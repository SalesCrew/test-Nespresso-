'use client';

import React from 'react';
import { useNotificationCenter } from '@/lib/notifications/NotificationCenterContext';
import PromotorMessageToast from './PromotorMessageToast';

export default function PromotorNotificationStack() {
  const { notifications, remove } = useNotificationCenter();

  return (
    <div
      className="fixed z-50 flex flex-col gap-2 items-center w-full pointer-events-none"
      style={{
        top: '0.75rem',
        left: 0,
      }}
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <PromotorMessageToast
            notification={notification}
            onClose={() => remove(notification.id)}
          />
        </div>
      ))}
    </div>
  );
}


