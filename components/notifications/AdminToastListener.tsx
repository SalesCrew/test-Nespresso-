'use client';

import { useAdminMessageToasts } from '@/lib/notifications/useAdminMessageToasts';

interface AdminToastListenerProps {
  currentUserId: string;
}

export default function AdminToastListener({ currentUserId }: AdminToastListenerProps) {
  useAdminMessageToasts(currentUserId);
  return null;
}

