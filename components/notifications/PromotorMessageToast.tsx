'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageNotification, useNotificationCenter } from '@/lib/notifications/NotificationCenterContext';
import { useSocket } from '@/lib/socket/SocketContext';

interface PromotorMessageToastProps {
  notification: MessageNotification;
  onClose: () => void;
}

export default function PromotorMessageToast({ notification, onClose }: PromotorMessageToastProps) {
  const router = useRouter();
  const { remove, pin, unpin } = useNotificationCenter();
  const { socket } = useSocket();

  const startYRef = useRef<number | null>(null);
  const translateYRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isReplyMode, setIsReplyMode] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    if (isReplyMode) return;
    router.push(`/promotors/chat?open=${notification.conversationId}`);
    onClose();
  };

  // Touch handlers for swipe-up dismiss (disabled while editing)
  const onTouchStart = (e: React.TouchEvent) => {
    if (isReplyMode) return;
    startYRef.current = e.touches[0].clientY;
    translateYRef.current = 0;
    setDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (isReplyMode || startYRef.current == null) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    const translateY = Math.min(0, deltaY);
    translateYRef.current = translateY;
    if (containerRef.current) {
      containerRef.current.style.transform = `translateY(${translateY}px)`;
      containerRef.current.style.opacity = `${Math.max(0.2, 1 + translateY / 100)}`;
    }
  };
  const onTouchEnd = () => {
    if (isReplyMode) return;
    setDragging(false);
    const threshold = -60;
    if (translateYRef.current <= threshold) {
      onClose();
    } else {
      if (containerRef.current) {
        containerRef.current.style.transition = 'transform 180ms ease-out, opacity 180ms ease-out';
        containerRef.current.style.transform = `translateY(0)`;
        containerRef.current.style.opacity = `1`;
        setTimeout(() => {
          if (containerRef.current) containerRef.current.style.transition = '';
        }, 200);
      }
    }
    startYRef.current = null;
    translateYRef.current = 0;
  };

  // Reply logic (mirrors admin behavior, with blue gradient)
  const startIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (replyText.trim().length === 0) {
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
    if (!replyText.trim() || isSending || !socket) return;
    try {
      setIsSending(true);
      setError(null);
      socket.emit(
        'send_message',
        {
          conversationId: notification.conversationId,
          messageText: replyText.trim(),
          messageType: 'text',
          fileUrl: null,
          fileName: null,
          replyToId: notification.messageId,
        },
        (response: { success?: boolean; message?: any; error?: string }) => {
          if (response.success) {
            onClose();
          } else {
            setError(response.error || 'Fehler beim Senden');
            setIsSending(false);
          }
        }
      );
    } catch (err) {
      setError('Fehler beim Senden');
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplyText(e.target.value);
    startIdleTimer();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isReplyMode) {
      if (e.key === 'Escape') {
        setIsReplyMode(false);
        setReplyText('');
        unpin(notification.id);
      }
      return;
    }
    if (e.key === 'Enter') handleOpen();
    else if (e.key === 'Escape') remove(notification.id);
  };

  // Focus input when reply mode activates
  useEffect(() => {
    if (isReplyMode && inputRef.current) inputRef.current.focus();
  }, [isReplyMode]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        containerRef.current.style.transform = '';
        containerRef.current.style.opacity = '';
        containerRef.current.style.transition = '';
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="status"
      aria-live="polite"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="promotor-toast-card bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative"
      style={{
        width: '92vw',
        maxWidth: '420px',
        animation: 'promotor-toast-slide-in 220ms ease-out',
        cursor: isReplyMode ? 'default' : 'pointer',
      }}
      onClick={isReplyMode ? undefined : handleOpen}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
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
                <p className="text-xs text-gray-500 truncate">{notification.subtitle}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-700 truncate mt-1">
            {notification.preview}
          </p>
        </div>
      </div>
      {!isReplyMode && (
        <button
          onClick={(e) => { e.stopPropagation(); handleReplyClick(e); }}
          className="absolute bottom-2 right-3 text-xs text-gray-500 hover:text-gray-700 transition-colors opacity-60 hover:opacity-100"
        >
          antworten
        </button>
      )}

      {/* Reply Input Area */}
      {isReplyMode && (
        <div
          className="px-3 pb-3 pt-2 transition-all"
          style={{ maxHeight: '80px', overflow: 'visible' }}
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={replyText}
              onChange={handleInputChange}
              placeholder="Nachricht eingeben..."
              disabled={isSending}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSendReply();
              }}
              disabled={!replyText.trim() || isSending}
              className="h-8 w-8 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #1E40AF)' }}
              aria-label="Senden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-3.5 w-3.5">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      )}
    </div>
  );
}


