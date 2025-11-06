"use client";

import React, { useEffect, useRef, useState, useLayoutEffect } from "react";

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

  const cardBg = theme === "admin" ? "rgba(255,255,255,0.96)" : "#fff";
  const border = theme === "admin" ? "#E5E7EB" : "#E5E7EB";
  const text = "#111827";
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

  const drawerWidth = 360;
  const gap = 16;
  const padding = 16;
  const [position, setPosition] = useState<{ left: number; top: number }>({
    left: anchorRect ? anchorRect.left - drawerWidth - gap : 600,
    top: anchorRect ? anchorRect.top : 80,
  });

  useLayoutEffect(() => {
    if (!open) return;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const rect = anchorRect ?? { top: 80, left: viewportWidth - gap, width: 0, height: 0 };
    const desiredLeft = rect.left - drawerWidth - gap;
    const minLeft = padding;
    const maxLeft = viewportWidth - drawerWidth - padding;
    const clampedLeft = Math.min(Math.max(desiredLeft, minLeft), Math.max(minLeft, maxLeft));
    const desiredTop = rect.top;
    const drawerHeight = dialogRef.current?.offsetHeight ?? 0;
    const minTop = padding;
    const maxTop = viewportHeight - drawerHeight - padding;
    const clampedTop = Math.min(
      Math.max(desiredTop, minTop),
      Math.max(minTop, maxTop)
    );
    setPosition({ left: clampedLeft, top: clampedTop });
  }, [open, anchorRect?.top, anchorRect?.left, anchorRect?.height, anchorRect?.width, gap]);

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
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: border }}>
          <div className="font-semibold" style={{ color: text }}>{question}</div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {options.map((opt, idx) => (
            <div key={opt.id} className="mb-3">
              {idx > 0 && <div className="my-2" style={{ borderTop: `1px solid ${theme === 'admin' ? 'rgba(17,24,39,0.08)' : '#E5E7EB'}` }} />}
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm" style={{ color: text }}>{opt.text}</div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#ECFDF5', border: `1px solid #D1FAE5`, color: '#065F46' }}>
                  {opt.voters.length} Stimme{opt.voters.length === 1 ? '' : 'n'}
                </span>
              </div>
              <div
                className="space-y-1.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ maxHeight: '112px' }}
              >
                {opt.voters.map((v) => {
                  const u = resolveUser(v.user_id);
                  return (
                    <div key={v.user_id + v.created_at} className="flex items-center gap-3 rounded-lg px-2 py-1.5" style={{ background: 'transparent' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(17,24,39,0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="h-7 w-7 rounded-full overflow-hidden border" style={{ borderColor: border }}>
                        <img src={u.avatar || '/placeholder.svg'} alt={u.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 text-sm truncate" style={{ color: text }}>{u.name}</div>
                      <div className="text-xs whitespace-nowrap" style={{ opacity: 0.8, color: text }}>{new Date(v.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


