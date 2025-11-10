'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageNotification, useNotificationCenter } from '@/lib/notifications/NotificationCenterContext';

interface PromotorMessageToastProps {
  notification: MessageNotification;
  onClose: () => void;
}

export default function PromotorMessageToast({ notification, onClose }: PromotorMessageToastProps) {
  const router = useRouter();
  const { remove } = useNotificationCenter();
  const startYRef = useRef<number | null>(null);
  const translateYRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    router.push(`/promotors/chat?open=${notification.conversationId}`);
    onClose();
  };

  // Touch handlers for swipe-up dismiss
  const onTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    translateYRef.current = 0;
    setDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current == null) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    // Only allow upwards drag (negative delta)
    const translateY = Math.min(0, deltaY);
    translateYRef.current = translateY;
    if (containerRef.current) {
      containerRef.current.style.transform = `translateY(${translateY}px)`;
      containerRef.current.style.opacity = `${Math.max(0.2, 1 + translateY / 100)}`;
    }
  };
  const onTouchEnd = () => {
    setDragging(false);
    const threshold = -60; // swipe up threshold
    if (translateYRef.current <= threshold) {
      onClose();
    } else {
      // snap back
      if (containerRef.current) {
        containerRef.current.style.transition = 'transform 180ms ease-out, opacity 180ms ease-out';
        containerRef.current.style.transform = `translateY(0)`;
        containerRef.current.style.opacity = `1`;
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.transition = '';
          }
        }, 200);
      }
    }
    startYRef.current = null;
    translateYRef.current = 0;
  };

  // Keyboard accessibility
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      handleOpen();
    } else if (e.key === 'Escape') {
      remove(notification.id);
    }
  };

  // Prevent lingering transform after mount/unmount
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        containerRef.current.style.transform = '';
        containerRef.current.style.opacity = '';
        containerRef.current.style.transition = '';
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="status"
      aria-live="polite"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="promotor-toast-card bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      style={{
        width: '92vw',
        maxWidth: '420px',
        animation: 'promotor-toast-slide-in 220ms ease-out',
        cursor: 'pointer',
      }}
      onClick={handleOpen}
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
          <p className="text-sm font-semibold text-gray-900 truncate">
            {notification.title}
          </p>
          {notification.subtitle && (
            <p className="text-xs text-gray-500 truncate">
              {notification.subtitle}
            </p>
          )}
          <p className="text-sm text-gray-700 truncate mt-1">
            {notification.preview}
          </p>
        </div>
      </div>
    </div>
  );
}


