"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MoreVertical, Phone, Video, Info, Send, Paperclip, Smile, Reply, Edit, Copy, Check, Heart, Trash2, MessageCircle } from "lucide-react";
import AdminNavigation from "@/components/AdminNavigation";

interface Contact {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: number;
  sender: string;
  content: string;
  time: string;
  own: boolean;
  edited?: boolean;
  replyTo?: {
    id: number;
    sender: string;
    content: string;
  };
}

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<Contact | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);  

  const [messageInput, setMessageInput] = useState("");
  const [contextMenu, setContextMenu] = useState<{ show: boolean; x: number; y: number; messageId: number | null; isOwnMessage: boolean }>({
    show: false, x: 0, y: 0, messageId: null, isOwnMessage: false
  });
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [replyAnimation, setReplyAnimation] = useState<{ startY: number; endY: number } | null>(null);
  const [flashingMessageId, setFlashingMessageId] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editAnimation, setEditAnimation] = useState<{ startY: number; endY: number } | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{ show: boolean; messageId: number | null; isOwnMessage: boolean }>({
    show: false,
    messageId: null,
    isOwnMessage: false
  });
  const [allMessages, setAllMessages] = useState<Record<number, Message[]>>({
    1: [ // Lisa Müller - lots of messages for scrolling
      { id: 1, sender: "Lisa Müller", content: "Hallo! Wie läuft es heute?", time: "09:15", own: false },
      { id: 2, sender: "You", content: "Hi Lisa! Alles bestens, danke der Nachfrage.", time: "09:16", own: true },
      { id: 3, sender: "Lisa Müller", content: "Super! Hast du schon die neuen Zahlen gesehen?", time: "09:17", own: false },
      { id: 4, sender: "You", content: "Ja, die sehen wirklich gut aus. Besonders der Umsatz ist gestiegen.", time: "09:18", own: true },
      { id: 5, sender: "Lisa Müller", content: "Genau! Das Team arbeitet wirklich hart.", time: "09:19", own: false },
      { id: 6, sender: "You", content: "Absolut. Wir sollten das beim nächsten Meeting besprechen.", time: "09:20", own: true },
      { id: 7, sender: "Lisa Müller", content: "Gute Idee! Wann passt es dir denn?", time: "09:25", own: false },
      { id: 8, sender: "You", content: "Wie wäre es morgen um 10 Uhr?", time: "09:26", own: true },
      { id: 9, sender: "Lisa Müller", content: "Perfekt, das passt mir sehr gut.", time: "09:27", own: false },
      { id: 10, sender: "You", content: "Super, dann trage ich das gleich in den Kalender ein.", time: "09:28", own: true },
      { id: 11, sender: "Lisa Müller", content: "Danke! Soll ich schon mal eine Agenda vorbereiten?", time: "09:30", own: false },
      { id: 12, sender: "You", content: "Das wäre fantastisch. Fokus auf die Q1 Ergebnisse?", time: "09:31", own: true },
      { id: 13, sender: "Lisa Müller", content: "Ja, und vielleicht auch die Planung für Q2.", time: "09:35", own: false },
      { id: 14, sender: "You", content: "Sehr gute Idee. Lass uns auch über das neue Projekt sprechen.", time: "09:36", own: true },
      { id: 15, sender: "Lisa Müller", content: "Welches meinst du? Das mit den neuen Kunden?", time: "09:40", own: false },
      { id: 16, sender: "You", content: "Genau das! Ich denke, wir haben da großes Potenzial.", time: "09:41", own: true },
      { id: 17, sender: "Lisa Müller", content: "Da stimme ich dir zu. Die ersten Gespräche liefen sehr vielversprechend.", time: "09:45", own: false },
      { id: 18, sender: "You", content: "Exzellent! Dann können wir morgen die nächsten Schritte planen.", time: "09:46", own: true },
      { id: 19, sender: "Lisa Müller", content: "Freue mich schon darauf! Bis morgen dann.", time: "14:30", own: false },
      { id: 20, sender: "You", content: "Bis morgen, Lisa! Hab einen schönen Tag.", time: "14:31", own: true },
      { id: 21, sender: "Lisa Müller", content: "Alles klar, bis später!", time: "14:32", own: false },
    ],
    2: [ // Max Schmidt
      { id: 1, sender: "Max Schmidt", content: "Hey! Wie siehts aus mit dem Report?", time: "13:40", own: false },
      { id: 2, sender: "You", content: "Hi Max! Bin gerade dabei, sollte in einer Stunde fertig sein.", time: "13:41", own: true },
      { id: 3, sender: "Max Schmidt", content: "Perfekt! Die Zahlen sehen gut aus.", time: "13:42", own: false },
      { id: 4, sender: "You", content: "Ja, sehr zufrieden mit der Entwicklung.", time: "13:44", own: true },
      { id: 5, sender: "Max Schmidt", content: "Die Zahlen sehen gut aus", time: "13:45", own: false },
    ],
    3: [ // Anna Weber
      { id: 1, sender: "Anna Weber", content: "Hi! Kannst du mir mit dem Projekt helfen?", time: "12:10", own: false },
      { id: 2, sender: "You", content: "Klar! Was brauchst du denn?", time: "12:11", own: true },
      { id: 3, sender: "Anna Weber", content: "Hauptsächlich Feedback zu meinem Entwurf.", time: "12:13", own: false },
      { id: 4, sender: "You", content: "Schick mir gerne den Link, schaue ich mir an.", time: "12:14", own: true },
      { id: 5, sender: "Anna Weber", content: "Danke für die Info!", time: "12:15", own: false },
    ],
    4: [ // Tom Klein
      { id: 1, sender: "Tom Klein", content: "Hey, weißt du noch wegen dem Meeting heute?", time: "11:25", own: false },
      { id: 2, sender: "You", content: "Hi Tom! Ja, 15 Uhr oder?", time: "11:26", own: true },
      { id: 3, sender: "Tom Klein", content: "Genau! Konferenzraum B ist reserviert.", time: "11:28", own: false },
      { id: 4, sender: "You", content: "Super, bis dann!", time: "11:29", own: true },
      { id: 5, sender: "Tom Klein", content: "Wann ist das Meeting?", time: "11:30", own: false },
    ],
    5: [ // Sarah Lange
      { id: 1, sender: "Sarah Lange", content: "Alles erledigt! Das Projekt ist abgeschlossen.", time: "10:20", own: false },
      { id: 2, sender: "You", content: "Wow, das ging schnell! Großartige Arbeit.", time: "10:21", own: true },
      { id: 3, sender: "Sarah Lange", content: "Perfekt, danke!", time: "10:22", own: false },
    ]
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data - replace with real data later
  const contacts = [
    { id: 1, name: "Lisa Müller", lastMessage: "Alles klar, bis später!", time: "14:32", unread: 2, online: true },
    { id: 2, name: "Max Schmidt", lastMessage: "Die Zahlen sehen gut aus", time: "13:45", unread: 0, online: false },
    { id: 3, name: "Anna Weber", lastMessage: "Danke für die Info!", time: "12:15", unread: 1, online: true },
    { id: 4, name: "Tom Klein", lastMessage: "Wann ist das Meeting?", time: "11:30", unread: 0, online: true },
    { id: 5, name: "Sarah Lange", lastMessage: "Perfekt, danke!", time: "10:22", unread: 0, online: false },
  ];

    // Handle sending messages
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;

    if (editingMessage) {
      // Edit existing message
      setAllMessages(prev => ({
        ...prev,
        [selectedChat.id]: (prev[selectedChat.id] || []).map(msg => 
          msg.id === editingMessage.id 
            ? { ...msg, content: messageInput.trim(), edited: true }
            : msg
        )
      }));
      setEditingMessage(null);
      setEditAnimation(null);
      // Clean up edit keyframe
      const existingEditStyle = document.getElementById('edit-keyframes');
      if (existingEditStyle) {
        existingEditStyle.remove();
      }
    } else {
      // Send new message
      const newMessage: Message = {
        id: Date.now(),
        sender: "You",
        content: messageInput.trim(),
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        own: true,
        ...(replyingTo && {
          replyTo: {
            id: replyingTo.id,
            sender: replyingTo.sender,
            content: replyingTo.content
          }
        })
      };

      setAllMessages(prev => ({
        ...prev,
        [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage]
      }));

      setReplyingTo(null);
      setReplyAnimation(null);
      // Clean up keyframe
      const existingStyle = document.getElementById('reply-keyframes');
      if (existingStyle) {
        existingStyle.remove();
      }
    }

    setMessageInput("");
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent, messageId: number, isOwn: boolean) => {
    e.preventDefault();
    
    const menuWidth = 160;
    const menuHeight = 220; // Approximate height of the menu
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Calculate position based on message type
    let x, y;
    
    if (isOwn) {
      // Own messages: bottom-right corner at mouse position (opens to left)
      x = mouseX - menuWidth;
      y = mouseY - menuHeight;
    } else {
      // Received messages: bottom-left corner at mouse position (opens to right)
      x = mouseX;
      y = mouseY - menuHeight;
    }
    
    // If menu would go off left edge, position it to the right of mouse
    if (x < 0) {
      x = mouseX;
    }
    
    // If menu would go off top edge, position it below mouse
    if (y < 0) {
      y = mouseY;
    }
    
    // If menu would go off right edge, keep it on left side
    if (mouseX + menuWidth > window.innerWidth) {
      x = mouseX - menuWidth;
    }
    
    // If menu would go off bottom edge, keep it above mouse
    if (mouseY + menuHeight > window.innerHeight) {
      y = mouseY - menuHeight;
    }
    
    setContextMenu({
      show: true,
      x: x,
      y: y,
      messageId,
      isOwnMessage: isOwn
    });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, messageId: null, isOwnMessage: false });
  };

  // Handle context menu actions
  const handleContextAction = (action: string) => {
    if (action === 'reply' && contextMenu.messageId && selectedChat) {
      const messageToReply = allMessages[selectedChat.id]?.find(msg => msg.id === contextMenu.messageId);
      if (messageToReply) {
        // Find the original message element
        const messageElement = document.querySelector(`[data-message-id="${contextMenu.messageId}"]`) as HTMLElement;
        if (messageElement) {
          const rect = messageElement.getBoundingClientRect();
          const chatAreaRect = messageElement.closest('.relative')?.getBoundingClientRect();
          
          if (chatAreaRect) {
            // Calculate the distance from original position to reply position
            const replyTargetY = chatAreaRect.height - 80; // Where reply bubble will be
            const originalY = rect.top - chatAreaRect.top;
            const startOffset = originalY - replyTargetY;
            
            console.log('Chat area height:', chatAreaRect.height);
            console.log('Original message Y:', originalY);
            console.log('Reply target Y:', replyTargetY);
            console.log('Start offset:', startOffset);
            
            // Create dynamic keyframe
            const keyframeName = `slide-to-reply-${contextMenu.messageId}`;
            const keyframes = `
              @keyframes ${keyframeName} {
                from { transform: translateY(${startOffset}px); opacity: 1; }
                to { transform: translateY(0px); opacity: 1; }
              }
            `;
            
            // Remove existing keyframe if any
            const existingStyle = document.getElementById('reply-keyframes');
            if (existingStyle) {
              existingStyle.remove();
            }
            
            // Add new keyframe
            const style = document.createElement('style');
            style.id = 'reply-keyframes';
            style.textContent = keyframes;
            document.head.appendChild(style);
            
            setReplyAnimation({ startY: startOffset, endY: 0 });
          }
        }
        setReplyingTo(messageToReply);
      }
    } else if (action === 'copy' && contextMenu.messageId && selectedChat) {
      const messageToCopy = allMessages[selectedChat.id]?.find(msg => msg.id === contextMenu.messageId);
      if (messageToCopy) {
        navigator.clipboard.writeText(messageToCopy.content).catch(err => {
          console.error('Failed to copy message:', err);
        });
      }
    } else if (action === 'edit' && contextMenu.messageId && selectedChat) {
      const messageToEdit = allMessages[selectedChat.id]?.find(msg => msg.id === contextMenu.messageId);
      if (messageToEdit) {
        // Find the original message element
        const messageElement = document.querySelector(`[data-message-id="${contextMenu.messageId}"]`) as HTMLElement;
        if (messageElement) {
          const rect = messageElement.getBoundingClientRect();
          const chatAreaRect = messageElement.closest('.relative')?.getBoundingClientRect();
          
          if (chatAreaRect) {
            // Calculate the distance from original position to input field position
            const inputTargetY = chatAreaRect.height - 80; // Where input field is
            const originalY = rect.top - chatAreaRect.top;
            const startOffset = originalY - inputTargetY;
            
            // Create dynamic keyframe for edit animation
            const keyframeName = `slide-to-edit-${contextMenu.messageId}`;
            const keyframes = `
              @keyframes ${keyframeName} {
                from { transform: translateY(${startOffset}px); opacity: 1; }
                to { transform: translateY(0px); opacity: 1; }
              }
            `;
            
            // Remove existing keyframe if any
            const existingStyle = document.getElementById('edit-keyframes');
            if (existingStyle) {
              existingStyle.remove();
            }
            
            // Add new keyframe
            const style = document.createElement('style');
            style.id = 'edit-keyframes';
            style.textContent = keyframes;
            document.head.appendChild(style);
            
            setEditAnimation({ startY: startOffset, endY: 0 });
          }
        }
        setEditingMessage(messageToEdit);
        setMessageInput(messageToEdit.content);
      }
    } else if (action === 'select') {
      setIsSelectMode(true);
      // Automatically select the message that was right-clicked
      if (contextMenu.messageId) {
        const newSelected = new Set(selectedMessages);
        newSelected.add(contextMenu.messageId);
        setSelectedMessages(newSelected);
      }
    } else if (action === 'delete' && contextMenu.messageId) {
      setDeleteDialog({ show: true, messageId: contextMenu.messageId, isOwnMessage: contextMenu.isOwnMessage });
    } else {
      console.log(`${action} message ${contextMenu.messageId}`);
    }
    closeContextMenu();
  };

  // Handle click on replied-to message container
  const handleReplyClick = (messageId: number) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;
    if (messageElement) {
      // Scroll to the message
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Flash the message after scroll completes with short pause
      setTimeout(() => {
        setFlashingMessageId(messageId);
        setTimeout(() => {
          setFlashingMessageId(null);
        }, 800); // Flash duration
      }, 400); // Wait for scroll to complete + short pause
    }
  };

  // Handle delete for me (remove message completely)
  const handleDeleteForMe = () => {
    if (deleteDialog.messageId && selectedChat) {
      setAllMessages(prev => ({
        ...prev,
        [selectedChat.id]: (prev[selectedChat.id] || []).filter(msg => msg.id !== deleteDialog.messageId)
      }));
      setDeleteDialog({ show: false, messageId: null, isOwnMessage: false });
    }
  };

  // Handle delete for everyone (change content to "Nachricht gelöscht...")
  const handleDeleteForEveryone = () => {
    if (deleteDialog.messageId && selectedChat) {
      setAllMessages(prev => ({
        ...prev,
        [selectedChat.id]: (prev[selectedChat.id] || []).map(msg => 
          msg.id === deleteDialog.messageId 
            ? { ...msg, content: 'Nachricht gelöscht...', edited: false }
            : msg
        )
      }));
      setDeleteDialog({ show: false, messageId: null, isOwnMessage: false });
    }
  };

  const messages = selectedChat ? allMessages[selectedChat.id] || [] : [];

  // Auto-scroll to bottom when messages change or chat changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages, selectedChat]);

  // Handle click outside context menu
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        closeContextMenu();
      }
    };

    if (contextMenu.show) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.show]);

  // Handle escape key to cancel reply, edit, or delete dialog
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (replyingTo) {
          setReplyingTo(null);
          setReplyAnimation(null);
          // Clean up keyframe
          const existingStyle = document.getElementById('reply-keyframes');
          if (existingStyle) {
            existingStyle.remove();
          }
        }
        if (editingMessage) {
          setEditingMessage(null);
          setEditAnimation(null);
          setMessageInput("");
          // Clean up edit keyframe
          const existingEditStyle = document.getElementById('edit-keyframes');
          if (existingEditStyle) {
            existingEditStyle.remove();
          }
        }
        if (deleteDialog.show) {
          setDeleteDialog({ show: false, messageId: null, isOwnMessage: false });
        }
      }
    };

    if (replyingTo || editingMessage || deleteDialog.show) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [replyingTo, editingMessage, deleteDialog]);





  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Admin Navigation */}
      <AdminNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-14'} h-screen flex bg-gray-50`}>
        
        {/* Left Sidebar - Contacts */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-gray-800">Chats</h1>
            <MoreVertical className="h-5 w-5 text-gray-600 cursor-pointer" />
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Suche oder starte neuen Chat"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto relative [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>

          
          {contacts.map((contact, index) => (
            <div
              key={contact.id}
                                           onClick={() => {
                 setSelectedChat(contact);
               }}
               className={`flex items-center p-3 m-2 cursor-pointer rounded-lg relative z-10 transition-colors duration-200 ${
                 selectedChat?.id === contact.id 
                   ? 'bg-gray-200' 
                   : 'hover:bg-gray-100'
               }`}
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">{contact.name.charAt(0)}</span>
                </div>
                {contact.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              {/* Content */}
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                  <span className="text-xs text-gray-500">{contact.time}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-600 truncate">{contact.lastMessage}</p>
                  {contact.unread > 0 && (
                    <span 
                      className="text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                      style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                    >
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 relative">
        
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div 
              className="bg-white border-b border-gray-200 p-4 flex items-center justify-between"
              style={{
                boxShadow: 'inset 20px 0 30px -20px rgba(0,0,0,0.15)'
              }}
            >
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">{selectedChat.name.charAt(0)}</span>
                  </div>
                  {selectedChat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold text-gray-900">{selectedChat.name}</h2>
                  <p className="text-sm text-gray-500">{selectedChat.online ? 'Online' : 'Zuletzt online heute'}</p>
                </div>
              </div>
              
                              <div className="flex space-x-4">
                  <Info className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-800" />
                </div>
            </div>

            {/* Messages Area */}
            <div 
              className="flex-1 overflow-y-auto pt-4 px-4 pb-20 [&::-webkit-scrollbar]:hidden"
              style={{
                boxShadow: 'inset 20px 0 30px -20px rgba(0,0,0,0.15)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                backgroundImage: `
                  radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)
                `,
                backgroundSize: '20px 20px'
              }}
            >
              <div className="space-y-4">
                                  {messages.map((message: Message) => (
                  <div
                    key={message.id}
                    className={`flex items-center ${message.own ? 'justify-end' : 'justify-start'} ${
                      replyingTo?.id === message.id || editingMessage?.id === message.id ? 'opacity-0' : ''
                    } transition-all duration-300 ease-out`}
                    data-message-id={message.id}
                  >
                    {/* Checkbox for received messages (left side) */}
                    {isSelectMode && !message.own && (
                      <div className="flex items-center animate-slide-from-left">
                        <div
                          onClick={() => {
                            const newSelected = new Set(selectedMessages);
                            if (selectedMessages.has(message.id)) {
                              newSelected.delete(message.id);
                            } else {
                              newSelected.add(message.id);
                            }
                            setSelectedMessages(newSelected);
                          }}
                          className="mr-2 h-4 w-4 rounded-lg cursor-pointer flex items-center justify-center"
                          style={{
                            background: selectedMessages.has(message.id) 
                              ? 'linear-gradient(135deg, #22C55E, #105F2D)' 
                              : 'white',
                            border: '2px solid #22C55E'
                          }}
                        >
                          {selectedMessages.has(message.id) && (
                            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.own
                          ? 'text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                      style={{
                        ...(message.own ? {background: 'linear-gradient(135deg, #22C55E, #105F2D)'} : {opacity: 0.8}),
                        boxShadow: flashingMessageId === message.id 
                          ? '0 0 20px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.8)'
                          : message.own 
                            ? '0 2px 6px rgba(16, 95, 45, 0.6)' 
                            : '0 2px 6px rgba(0,0,0,0.12)',
                        transition: 'box-shadow 0.3s ease-in-out',
                        ...(isSelectMode ? { cursor: 'pointer' } : {})
                      }}
                      onContextMenu={(e) => handleContextMenu(e, message.id, message.own)}
                      onClick={() => {
                        if (isSelectMode) {
                          const newSelected = new Set(selectedMessages);
                          if (selectedMessages.has(message.id)) {
                            newSelected.delete(message.id);
                          } else {
                            newSelected.add(message.id);
                          }
                          setSelectedMessages(newSelected);
                        }
                      }}
                    >
                                              {message.replyTo && (
                        <div 
                          className="mt-2 mb-2 p-2 rounded border cursor-pointer"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            borderColor: 'rgba(255,255,255,0.20)' 
                          }}
                          onClick={() => handleReplyClick(message.replyTo!.id)}
                        >
                          <p className={`text-xs font-medium ${message.own ? 'text-green-100' : 'text-gray-600'} opacity-50`}>
                            {message.replyTo.sender}
                          </p>
                          <p className={`text-xs mt-1 ${message.own ? 'text-green-50' : 'text-gray-700'} ${message.replyTo.content === 'Nachricht gelöscht...' ? 'italic opacity-60' : ''}`} 
                             style={{ 
                               wordBreak: 'break-word',
                               overflow: 'hidden',
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical'
                             }}>
                            {message.replyTo.content}
                          </p>
                        </div>
                      )}
                      <p className={`text-sm ${message.content === 'Nachricht gelöscht...' ? 'italic opacity-60' : ''}`}>
                        {message.content}
                      </p>
                      <p className={`text-xs mt-1 ${message.own ? 'text-green-100 text-right' : 'text-gray-500'}`} style={{ fontSize: '0.5775rem' }}>
                        {message.edited && '(edited) '}{message.time}
                      </p>
                    </div>
                    
                    {/* Checkbox for own messages (right side) */}
                    {isSelectMode && message.own && (
                      <div className="flex items-center animate-slide-from-right">
                        <div
                          onClick={() => {
                            const newSelected = new Set(selectedMessages);
                            if (selectedMessages.has(message.id)) {
                              newSelected.delete(message.id);
                            } else {
                              newSelected.add(message.id);
                            }
                            setSelectedMessages(newSelected);
                          }}
                          className="ml-2 h-4 w-4 rounded-lg cursor-pointer flex items-center justify-center"
                          style={{
                            background: selectedMessages.has(message.id) 
                              ? 'linear-gradient(135deg, #22C55E, #105F2D)' 
                              : 'white',
                            border: '2px solid #22C55E'
                          }}
                        >
                          {selectedMessages.has(message.id) && (
                            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Context Menu */}
            {contextMenu.show && (
              <div
                className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-100"
                style={{
                  left: contextMenu.x,
                  top: contextMenu.y,
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(10px)',
                  minWidth: '160px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => handleContextAction('reply')}
                  >
                    <Reply className="h-4 w-4" />
                    <span>Antworten</span>
                  </button>
                  <hr className="border-gray-100 opacity-50" />
                  {contextMenu.isOwnMessage && (
                    <>
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        onClick={() => handleContextAction('edit')}
                      >
                        <Edit className="h-4 w-4" />
                        <span>Bearbeiten</span>
                      </button>
                      <hr className="border-gray-100 opacity-50" />
                    </>
                  )}
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => handleContextAction('copy')}
                  >
                    <Copy className="h-4 w-4" />
                    <span>Kopieren</span>
                  </button>
                  <hr className="border-gray-100 opacity-50" />
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => handleContextAction('select')}
                  >
                    <Check className="h-4 w-4" />
                    <span>Auswählen</span>
                  </button>
                  <hr className="border-gray-100 opacity-50" />
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    onClick={() => handleContextAction('delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Löschen</span>
                  </button>
                  <hr className="border-gray-100 opacity-50" />
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center justify-center space-x-3"
                    onClick={() => handleContextAction('react')}
                  >
                    <span className="text-lg hover:scale-125 transition-transform duration-150 cursor-pointer">❤️</span>
                    <span className="text-lg hover:scale-125 transition-transform duration-150 cursor-pointer">👍</span>
                    <span className="text-lg hover:scale-125 transition-transform duration-150 cursor-pointer">😂</span>
                    <span className="text-lg hover:scale-125 transition-transform duration-150 cursor-pointer">😮</span>
                  </button>
                </div>
              </div>
            )}

            

            {/* Reply Overlay */}
            {replyingTo && (
              <>
                {/* Blur/Dark Overlay */}
                                 <div 
                   className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
                   onClick={() => {
                     setReplyingTo(null);
                     setReplyAnimation(null);
                     // Clean up keyframe
                     const existingStyle = document.getElementById('reply-keyframes');
                     if (existingStyle) {
                       existingStyle.remove();
                     }
                   }}
                 />
                
                {/* Reply Message Bubble */}
                <div className={`absolute z-50 flex ${replyingTo.own ? 'right-4 justify-end' : 'left-4 justify-start'}`} style={{ bottom: '80px' }}>
                  <div 
                    style={{
                      animation: `slide-to-reply-${replyingTo.id} 0.4s cubic-bezier(0.4, 0, 0.2, 1)`
                    }}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        replyingTo.own
                          ? 'text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                      style={{
                        ...(replyingTo.own ? {background: 'linear-gradient(135deg, #22C55E, #105F2D)'} : {opacity: 0.8}),
                        boxShadow: replyingTo.own 
                          ? '0 2px 6px rgba(16, 95, 45, 0.6)' 
                          : '0 2px 6px rgba(0,0,0,0.12)'
                      }}
                    >
                                              {replyingTo.replyTo && (
                        <div 
                          className="mt-2 mb-2 p-2 rounded border cursor-pointer"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            borderColor: 'rgba(255,255,255,0.20)' 
                          }}
                          onClick={() => handleReplyClick(replyingTo.replyTo!.id)}
                        >
                          <p className={`text-xs font-medium ${replyingTo.own ? 'text-green-100' : 'text-gray-600'} opacity-50`}>
                            {replyingTo.replyTo.sender}
                          </p>
                          <p className={`text-xs mt-1 ${replyingTo.own ? 'text-green-50' : 'text-gray-700'} ${replyingTo.replyTo.content === 'Nachricht gelöscht...' ? 'italic opacity-60' : ''}`} 
                             style={{ 
                               wordBreak: 'break-word',
                               overflow: 'hidden',
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical'
                             }}>
                            {replyingTo.replyTo.content}
                          </p>
                        </div>
                      )}
                      <p className={`text-sm ${replyingTo.content === 'Nachricht gelöscht...' ? 'italic opacity-60' : ''}`}>
                        {replyingTo.content}
                      </p>
                      <p className={`text-xs mt-1 ${replyingTo.own ? 'text-green-100 text-right' : 'text-gray-500'}`} style={{ fontSize: '0.5775rem' }}>
                        {replyingTo.edited && '(edited) '}{replyingTo.time}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Edit Overlay */}
            {editingMessage && (
              <>
                {/* Blur/Dark Overlay */}
                <div 
                  className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
                  onClick={() => {
                    setEditingMessage(null);
                    setEditAnimation(null);
                    setMessageInput("");
                    // Clean up edit keyframe
                    const existingEditStyle = document.getElementById('edit-keyframes');
                    if (existingEditStyle) {
                      existingEditStyle.remove();
                    }
                  }}
                />
                
                {/* Edit Message Bubble */}
                <div className={`absolute z-50 flex ${editingMessage.own ? 'right-4 justify-end' : 'left-4 justify-start'}`} style={{ bottom: '80px' }}>
                  <div 
                    style={{
                      animation: `slide-to-edit-${editingMessage.id} 0.4s cubic-bezier(0.4, 0, 0.2, 1)`
                    }}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        editingMessage.own
                          ? 'text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                      style={{
                        ...(editingMessage.own ? {background: 'linear-gradient(135deg, #22C55E, #105F2D)'} : {opacity: 0.8}),
                        boxShadow: editingMessage.own 
                          ? '0 2px 6px rgba(16, 95, 45, 0.6)' 
                          : '0 2px 6px rgba(0,0,0,0.12)'
                      }}
                    >
                      {editingMessage.replyTo && (
                        <div 
                          className="mt-2 mb-2 p-2 rounded border cursor-pointer"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            borderColor: 'rgba(255,255,255,0.20)' 
                          }}
                          onClick={() => handleReplyClick(editingMessage.replyTo!.id)}
                        >
                          <p className={`text-xs font-medium ${editingMessage.own ? 'text-green-100' : 'text-gray-600'} opacity-50`}>
                            {editingMessage.replyTo.sender}
                          </p>
                                                     <p className={`text-xs mt-1 ${editingMessage.own ? 'text-green-50' : 'text-gray-700'} ${editingMessage.replyTo.content === 'Nachricht gelöscht...' ? 'italic opacity-60' : ''}`} 
                              style={{ 
                                wordBreak: 'break-word',
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>
                             {editingMessage.replyTo.content}
                           </p>
                        </div>
                      )}
                                             <p className={`text-sm ${editingMessage.content === 'Nachricht gelöscht...' ? 'italic opacity-60' : ''}`}>
                         {editingMessage.content}
                       </p>
                                             <p className={`text-xs mt-1 ${editingMessage.own ? 'text-green-100 text-right' : 'text-gray-500'}`} style={{ fontSize: '0.5775rem' }}>
                         {editingMessage.edited && '(edited) '}{editingMessage.time}
                       </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Message Input */}
            <form className={`absolute bottom-4 left-4 right-4 ${deleteDialog.show ? 'z-30' : 'z-50'}`} onSubmit={handleSendMessage} style={{ background: 'none' }}>
              <input 
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Nachricht eingeben..." 
                className={`w-full pl-12 pr-20 py-3 rounded-full outline-none text-gray-900 placeholder:text-gray-500 placeholder:text-sm transition-all duration-300 ${deleteDialog.show ? 'pointer-events-none' : ''}`}
                style={{ 
                  border: 'none', 
                  boxShadow: '0 3px 8px rgba(0,0,0,0.18)', 
                  WebkitAppearance: 'none', 
                  MozAppearance: 'none', 
                  appearance: 'none',
                  background: 'linear-gradient(to right, rgba(250,250,250,0.95), rgba(240,240,240,0.95))',
                  opacity: deleteDialog.show ? 0.3 : 0.85,
                  filter: deleteDialog.show ? 'blur(2px) brightness(0.6)' : 'none'
                }}
              />
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${deleteDialog.show ? 'opacity-30 pointer-events-none' : ''}`}>
                <Paperclip className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-800" />
              </div>
              <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2 transition-all duration-300 ${deleteDialog.show ? 'opacity-30 pointer-events-none' : ''}`}>
                <Smile className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-800" />
                <button 
                  type="submit"
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                >
                  {editingMessage ? (
                    <Check className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <Send className="h-3.5 w-3.5 text-white" />
                  )}
                </button>
              </div>
            </form>

            {/* Delete Confirmation Dialog */}
            {deleteDialog.show && (
              <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-60 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Nachricht löschen</h3>
                  <p className="text-gray-600 mb-6">Wie möchten Sie die Nachricht löschen?</p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleDeleteForMe}
                      className="w-full px-4 py-3 text-center text-sm text-gray-700 rounded-lg transition-colors border"
                      style={{
                        borderColor: 'rgba(34, 197, 94, 0.85)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div className="font-medium">Für mich löschen</div>
                      <div className="text-xs text-gray-500">Die Nachricht wird nur für Sie entfernt</div>
                    </button>
                    
                    {deleteDialog.isOwnMessage && (
                      <button
                        onClick={handleDeleteForEveryone}
                        className="w-full px-4 py-3 text-center text-sm text-gray-700 rounded-lg transition-colors border"
                        style={{
                          borderColor: 'rgba(250, 12, 12, 0.85)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(250, 12, 12, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div className="font-medium">Für alle löschen</div>
                        <div className="text-xs text-gray-500">Die Nachricht wird für alle entfernt</div>
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setDeleteDialog({ show: false, messageId: null, isOwnMessage: false })}
                    className="w-full mt-4 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center" 
               style={{
                 background: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)',
                 backgroundSize: '20px 20px'
               }}>
            <div className="text-center relative">
              {/* Blurred ellipse background */}
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-40 rounded-full blur-3xl"
                style={{
                  background: 'linear-gradient(135deg, #22C55E, #105F2D)',
                  opacity: 0.17
                }}
              />
              <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-medium text-gray-700 mb-3">Willkommen im Chat</h2>
              <p className="text-gray-500 text-lg">Wähle einen Kontakt aus, um zu chatten</p>
            </div>
          </div>
         )}
       </div>
     </div>
   </div>
   );
 } 