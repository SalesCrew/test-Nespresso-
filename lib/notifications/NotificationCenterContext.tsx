'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface MessageNotification {
  id: string;
  messageId: string;
  conversationId: string;
  title: string;
  subtitle?: string;
  preview: string;
  avatarUrl?: string | null;
  timestamp: Date;
}

interface NotificationCenterContextType {
  notifications: MessageNotification[];
  push: (notification: MessageNotification) => void;
  remove: (id: string) => void;
}

const NotificationCenterContext = createContext<NotificationCenterContextType | undefined>(undefined);

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 7000;

export function NotificationCenterProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const remove = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // Clear timer if exists
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback((notification: MessageNotification) => {
    console.log('[NotificationCenter] Push called with:', notification);
    setNotifications(prev => {
      console.log('[NotificationCenter] Current notifications:', prev);
      // Deduplicate by messageId
      if (prev.some(n => n.messageId === notification.messageId)) {
        console.log('[NotificationCenter] Duplicate detected, skipping');
        return prev;
      }

      let updated = [notification, ...prev];

      // Keep only MAX_VISIBLE
      if (updated.length > MAX_VISIBLE) {
        const removed = updated.slice(MAX_VISIBLE);
        removed.forEach(n => {
          const timer = timersRef.current.get(n.id);
          if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(n.id);
          }
        });
        updated = updated.slice(0, MAX_VISIBLE);
      }

      console.log('[NotificationCenter] Updated notifications:', updated);
      return updated;
    });

    // Set auto-dismiss timer
    const timer = setTimeout(() => {
      remove(notification.id);
    }, AUTO_DISMISS_MS);
    timersRef.current.set(notification.id, timer);
  }, [remove]);

  return (
    <NotificationCenterContext.Provider value={{ notifications, push, remove }}>
      {children}
    </NotificationCenterContext.Provider>
  );
}

export function useNotificationCenter() {
  const context = useContext(NotificationCenterContext);
  if (!context) {
    throw new Error('useNotificationCenter must be used within NotificationCenterProvider');
  }
  return context;
}

