'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MessageNotification, useNotificationCenter } from '@/lib/notifications/NotificationCenterContext';

interface AdminMessageToastProps {
  notification: MessageNotification;
  onClose: () => void;
}

export default function AdminMessageToast({ notification, onClose }: AdminMessageToastProps) {
  const router = useRouter();
  const { pin, unpin } = useNotificationCenter();
  const [isReplyMode, setIsReplyMode] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!isReplyMode) {
      router.push(`/admin/chat?open=${notification.conversationId}`);
      onClose();
    }
  };

  const startIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      if (replyText.trim().length === 0) {
        // Collapse if no text after 10 seconds
        setIsReplyMode(false);
        unpin(notification.id);
      }
    }, 10000);
  };

  const handleReplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReplyMode(true);
    pin(notification.id);
    startIdleTimer();
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || isSending) return;

    try {
      setIsSending(true);
      setError(null);

      const response = await fetch('/api/chat/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: notification.conversationId,
          text: replyText.trim(),
          reply_to_id: notification.messageId,
        }),
      });

      if (response.ok) {
        // Success - close toast
        onClose();
      } else {
        setError('Fehler beim Senden');
        setIsSending(false);
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Fehler beim Senden');
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplyText(e.target.value);
    startIdleTimer(); // Reset idle timer on each keystroke
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    } else if (e.key === 'Escape') {
      setIsReplyMode(false);
      setReplyText('');
      unpin(notification.id);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    }
  };

  // Focus input when reply mode activates
  useEffect(() => {
    if (isReplyMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isReplyMode]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="admin-toast-card bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden transition-all"
      style={{
        width: '320px',
        animation: 'admin-toast-slide-in 180ms ease-out',
        cursor: isReplyMode ? 'default' : 'pointer',
      }}
      onClick={isReplyMode ? undefined : handleClick}
    >
      <div className="flex items-start p-3 gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {notification.avatarUrl ? (
            <img
              src={notification.avatarUrl}
              alt={notification.title}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {notification.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {notification.title}
              </p>
              {notification.subtitle && (
                <p className="text-xs text-gray-500 truncate">
                  {notification.subtitle}
                </p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Message preview with reply button */}
          <div className="flex items-center justify-between mt-1 gap-2">
            <p className="text-sm text-gray-700 truncate flex-1 pr-2">
              {notification.preview}
            </p>

            {/* Reply button */}
            {!isReplyMode && (
              <button
                onClick={handleReplyClick}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors opacity-60 hover:opacity-100 flex-shrink-0"
              >
                antworten
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply Input Area */}
      {isReplyMode && (
        <div 
          className="px-3 pb-3 pt-0 transition-all"
          style={{
            maxHeight: isReplyMode ? '80px' : '0px',
            overflow: 'hidden',
          }}
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={replyText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Nachricht eingeben..."
              disabled={isSending}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSendReply();
              }}
              disabled={!replyText.trim() || isSending}
              className="h-8 w-8 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
            >
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

