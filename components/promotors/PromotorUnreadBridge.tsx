"use client";

import { useEffect, useMemo } from "react";
import { useChatIntegration } from "@/lib/chat/useChatIntegration";

export default function PromotorUnreadBridge() {
  const { conversations } = useChatIntegration();

  const totalUnread = useMemo(
    () => (conversations || []).reduce((sum, c: any) => sum + (c?.unread_count || 0), 0),
    [conversations]
  );

  useEffect(() => {
    try {
      const prev = Number.parseInt(localStorage.getItem("promotorUnreadCount") || "0", 10);
      if (prev !== totalUnread) {
        localStorage.setItem("promotorUnreadCount", String(totalUnread));
        // Let SiteLayout know about the update (same-tab)
        window.dispatchEvent(new Event("storage"));
      }
    } catch {}
  }, [totalUnread]);

  return null;
}


