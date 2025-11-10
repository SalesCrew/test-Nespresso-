'use client';

import { usePromotorMessageToasts } from '@/lib/notifications/usePromotorMessageToasts';

interface PromotorToastListenerProps {
  currentUserId: string;
}

export default function PromotorToastListener({ currentUserId }: PromotorToastListenerProps) {
  usePromotorMessageToasts(currentUserId);
  return null;
}


