'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useSocket } from '@/lib/socket/SocketContext';
import { useNotificationCenter, MessageNotification } from './NotificationCenterContext';

interface ConversationCache {
  id: string;
  type: string;
  name: string;
  profile_picture_url?: string | null;
  is_group: boolean;
}

interface SocketMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  message_text: string;
  message_type: string;
  file_url?: string | null;
  file_name?: string | null;
  created_at: string;
}

export function usePromotorMessageToasts(currentUserId: string) {
  const pathname = usePathname();
  const { socket } = useSocket();
  const { push } = useNotificationCenter();
  const conversationCacheRef = useRef<Map<string, ConversationCache>>(new Map());
  const isFetchingRef = useRef(false);

  const fetchConversations = useCallback(async () => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      const response = await fetch('/api/chat/conversations');
      if (response.ok) {
        const data = await response.json();
        const conversations = data.conversations || [];
        conversations.forEach((conv: any) => {
          conversationCacheRef.current.set(conv.id, {
            id: conv.id,
            type: conv.type,
            name: conv.name,
            profile_picture_url: conv.profile_picture_url,
            is_group: conv.type === 'group',
          });
        });
      }
    } catch (error) {
      console.error('[PromotorToast] Error fetching conversations:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = async (message: SocketMessage) => {
      // Skip on chat page to avoid duplicative alerts
      if (pathname === '/promotors/chat') return;
      // Skip self-messages
      if (message.sender_id === currentUserId) return;

      // Retrieve conversation meta
      let conversation = conversationCacheRef.current.get(message.conversation_id);
      if (!conversation) {
        // Best-effort: rely on initial cache; single-fetch endpoint may not exist
        await fetchConversations();
        conversation = conversationCacheRef.current.get(message.conversation_id);
      }

      // Preview text mapping
      let preview = message.message_text || '';
      if (message.message_type === 'photo') preview = '📷 Foto';
      else if (message.message_type === 'pdf') preview = '📄 PDF';
      else if (message.message_type === 'poll') preview = '📊 Abstimmung';
      preview = preview.trim() || 'Neue Nachricht';

      // Title/subtitle, avatar
      let title = message.sender_name;
      let subtitle: string | undefined = undefined;
      let avatarUrl: string | null | undefined = undefined;
      if (conversation) {
        if (conversation.is_group) {
          title = conversation.name;
          subtitle = message.sender_name;
          avatarUrl = conversation.profile_picture_url;
        } else {
          title = message.sender_name;
          avatarUrl = conversation.profile_picture_url;
        }
      }

      const notification: MessageNotification = {
        id: `promotor-toast-${message.id}-${Date.now()}`,
        messageId: message.id,
        conversationId: message.conversation_id,
        title,
        subtitle,
        preview,
        avatarUrl,
        timestamp: new Date(message.created_at),
      };

      push(notification);
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, pathname, currentUserId, push, fetchConversations]);
}


