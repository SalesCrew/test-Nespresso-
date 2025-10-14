import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/lib/socket/SocketContext';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message_text: string;
  message_type: string;
  file_url?: string | null;
  file_name?: string | null;
  reply_to_id?: string | null;
  reply_to?: {
    id: string;
    sender_name: string;
    message_text: string;
    message_type: string;
    file_url?: string | null;
    file_name?: string | null;
  } | null;
  edited: boolean;
  created_at: string;
  updated_at: string;
}

interface Conversation {
  id: string;
  type: string;
  name: string;
  description?: string | null;
  is_read_only: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants: Array<{
    user_id: string;
    display_name: string;
    role: string;
    last_read_at: string;
  }>;
  last_message: {
    text: string;
    type: string;
    created_at: string;
    sender_name: string;
    sender_id: string;
  } | null;
  unread_count: number;
  is_group: boolean;
}

interface UseChatIntegrationOptions {
  onNewMessage?: (message: Message) => void;
  onUserTyping?: (data: { userId: string; userName: string; conversationId: string }) => void;
  onUserStoppedTyping?: (data: { userId: string; conversationId: string }) => void;
}

export const useChatIntegration = (options: UseChatIntegrationOptions = {}) => {
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<string, Set<string>>>({});

  // Fetch conversations on mount
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${conversationId}?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => ({
          ...prev,
          [conversationId]: data.messages || [],
        }));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback((
    conversationId: string,
    messageText: string,
    replyToId?: string | null,
    messageType: string = 'text',
    fileUrl?: string | null,
    fileName?: string | null
  ) => {
    return new Promise<Message>((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit(
        'send_message',
        {
          conversationId,
          messageText,
          messageType,
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          replyToId: replyToId || null,
        },
        (response: { success?: boolean; message?: Message; error?: string }) => {
          if (response.success && response.message) {
            resolve(response.message);
          } else {
            reject(new Error(response.error || 'Failed to send message'));
          }
        }
      );
    });
  }, [socket]);

  // Mark conversation as read
  const markAsRead = useCallback((conversationId: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit(
        'mark_read',
        { conversationId },
        (response: { success?: boolean; error?: string }) => {
          if (response.success) {
            // Update local conversation unread count
            setConversations(prev =>
              prev.map(conv =>
                conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
              )
            );
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to mark as read'));
          }
        }
      );
    });
  }, [socket]);

  // Emit typing indicators
  const startTyping = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit('typing_start', { conversationId });
    }
  }, [socket]);

  const stopTyping = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit('typing_stop', { conversationId });
    }
  }, [socket]);

  // Join a conversation room (for newly created conversations)
  const joinConversation = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit('join_conversation', { conversationId });
    }
  }, [socket]);

  // Create a new conversation
  const createConversation = useCallback(async (
    type: 'direct' | 'group',
    participantIds: string[],
    name?: string,
    description?: string
  ) => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name,
          description,
          participantIds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Join the conversation room if it's new
        if (!data.existing && socket) {
          joinConversation(data.conversation.id);
        }

        // Refresh conversations list
        await fetchConversations();
        
        return data.conversation;
      } else {
        throw new Error('Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }, [socket, joinConversation, fetchConversations]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      // Add message to the conversation
      setMessages(prev => ({
        ...prev,
        [message.conversation_id]: [...(prev[message.conversation_id] || []), message],
      }));

      // Update conversation's last message and move to top
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === message.conversation_id) {
            return {
              ...conv,
              last_message: {
                text: message.message_text,
                type: message.message_type,
                created_at: message.created_at,
                sender_name: message.sender_name,
                sender_id: message.sender_id,
              },
              updated_at: message.created_at,
              // Increment unread count if message is not from current user
              // (Note: This would need user ID check in actual implementation)
            };
          }
          return conv;
        });
        
        // Sort by updated_at
        return updated.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });

      if (options.onNewMessage) {
        options.onNewMessage(message);
      }
    };

    const handleUserTyping = (data: { userId: string; userName: string; conversationId: string }) => {
      setTypingUsers(prev => {
        const convTyping = new Set(prev[data.conversationId] || []);
        convTyping.add(data.userId);
        return {
          ...prev,
          [data.conversationId]: convTyping,
        };
      });

      if (options.onUserTyping) {
        options.onUserTyping(data);
      }

      // Auto-clear typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => {
          const convTyping = new Set(prev[data.conversationId] || []);
          convTyping.delete(data.userId);
          if (convTyping.size === 0) {
            const updated = { ...prev };
            delete updated[data.conversationId];
            return updated;
          }
          return {
            ...prev,
            [data.conversationId]: convTyping,
          };
        });
      }, 3000);
    };

    const handleUserStoppedTyping = (data: { userId: string; conversationId: string }) => {
      setTypingUsers(prev => {
        const convTyping = new Set(prev[data.conversationId] || []);
        convTyping.delete(data.userId);
        if (convTyping.size === 0) {
          const updated = { ...prev };
          delete updated[data.conversationId];
          return updated;
        }
        return {
          ...prev,
          [data.conversationId]: convTyping,
        };
      });

      if (options.onUserStoppedTyping) {
        options.onUserStoppedTyping(data);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [socket, options]);

  // Fetch conversations on mount
  useEffect(() => {
    if (isConnected) {
      fetchConversations();
    }
  }, [isConnected, fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    typingUsers,
    isConnected,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    createConversation,
    joinConversation,
  };
};

