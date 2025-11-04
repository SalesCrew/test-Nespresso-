"use client";

import React, { useEffect, useRef, useState } from "react";

type Voter = { user_id: string; created_at: string };
type OptionDetail = { id: string; text: string; voters: Voter[] };

export default function PollVotesDrawer({
  open,
  onClose,
  question,
  options,
  resolveUser,
  theme = "admin",
  anchorRect,
}: {
  open: boolean;
  onClose: () => void;
  question: string;
  options: OptionDetail[];
  resolveUser: (userId: string) => { name: string; avatar?: string | null };
  theme?: "admin" | "promotor";
  anchorRect?: { top: number; left: number; width: number; height: number } | null;
}) {
  if (!open) return null;

  const cardBg = theme === "admin" ? "rgba(255,255,255,0.12)" : "#fff";
  const border = theme === "admin" ? "rgba(255,255,255,0.25)" : "#E5E7EB";
  const text = theme === "admin" ? "#fff" : "#111827";
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Animation mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Esc to close & basic focus trap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    // Initial focus
    setTimeout(() => dialogRef.current?.focus(), 0);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Calculate position: drawer sits inside chat area, to the left of the poll bubble
  // anchorRect.left is the message row left edge; we want drawer right edge to be slightly left of poll bubble
  const drawerWidth = 360;
  const gap = 16;
  let drawerLeft = 600; // fallback if no anchor
  if (anchorRect) {
    // Position drawer so its right edge is `gap` px to the left of the poll bubble's left edge
    // Poll bubble sits inside the message row; for right-aligned messages the bubble is at the right side
    // So we use anchorRect.left (which is actually where the message container starts in the chat)
    // and position the drawer inside the chat area, well before the bubble
    drawerLeft = anchorRect.left - drawerWidth - gap;
  }

  return (
    <div 
      className="fixed inset-0 z-[9998]" 
      onClick={onClose}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Stimmen ansehen"
        tabIndex={-1}
        className={"absolute rounded-xl shadow-xl transition-all duration-200 " + (mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1")}
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          color: text,
          width: `${drawerWidth}px`,
          top: anchorRect ? `${anchorRect.top}px` : '80px',
          left: `${drawerLeft}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: border }}>
          <div className="font-semibold text-white/95">{question}</div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {options.map((opt, idx) => (
            <div key={opt.id} className="mb-3">
              {idx > 0 && <div className="my-2" style={{ borderTop: `1px solid ${theme === 'admin' ? 'rgba(255,255,255,0.12)' : '#E5E7EB'}` }} />}
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm text-white/95">{opt.text}</div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: theme === 'admin' ? 'rgba(16,95,45,0.35)' : '#ECFDF5', border: `1px solid ${border}`, color: text }}>
                  {opt.voters.length} Stimme{opt.voters.length === 1 ? '' : 'n'}
                </span>
              </div>
              <div className="space-y-1.5">
                {opt.voters.map((v) => {
                  const u = resolveUser(v.user_id);
                  return (
                    <div key={v.user_id + v.created_at} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/10">
                      <div className="h-7 w-7 rounded-full overflow-hidden border" style={{ borderColor: border }}>
                        <img src={u.avatar || '/placeholder.svg'} alt={u.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 text-sm text-white/95 truncate">{u.name}</div>
                      <div className="text-xs opacity-80 whitespace-nowrap">{new Date(v.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t" style={{ borderColor: border }}>
          <button onClick={onClose} className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2" style={{ background: theme === 'admin' ? 'rgba(255,255,255,0.10)' : '#F3F4F6', border: `1px solid ${border}`, color: text }}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}


