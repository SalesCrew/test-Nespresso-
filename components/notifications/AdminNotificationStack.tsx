'use client';

import React from 'react';
import { useNotificationCenter } from '@/lib/notifications/NotificationCenterContext';
import AdminMessageToast from './AdminMessageToast';

export default function AdminNotificationStack() {
  const { notifications, remove } = useNotificationCenter();

  return (
    <div
      className="fixed z-50 flex flex-col gap-3"
      style={{
        top: '80px',
        right: '1rem',
      }}
    >
      {notifications.map((notification) => (
        <AdminMessageToast
          key={notification.id}
          notification={notification}
          onClose={() => remove(notification.id)}
        />
      ))}
    </div>
  );
}

