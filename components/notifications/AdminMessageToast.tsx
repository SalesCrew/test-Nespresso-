'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MessageNotification } from '@/lib/notifications/NotificationCenterContext';

interface AdminMessageToastProps {
  notification: MessageNotification;
  onClose: () => void;
}

export default function AdminMessageToast({ notification, onClose }: AdminMessageToastProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/admin/chat?open=${notification.conversationId}`);
    onClose();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="admin-toast-card bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
      onClick={handleClick}
      style={{
        width: '320px',
        animation: 'admin-toast-slide-in 180ms ease-out',
      }}
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
          <p className="text-sm text-gray-700 truncate mt-1">
            {notification.preview}
          </p>
        </div>
      </div>
    </div>
  );
}

