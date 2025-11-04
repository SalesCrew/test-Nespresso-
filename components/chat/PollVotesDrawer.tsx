"use client";

import React from "react";

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

  return (
    <div 
      className="fixed inset-0 z-[9998]" 
      onClick={onClose}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="absolute rounded-xl shadow-xl"
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          color: text,
          width: '360px',
          maxWidth: '90vw',
          top: anchorRect ? `${anchorRect.top}px` : '80px',
          right: anchorRect ? `calc(100vw - ${anchorRect.left}px + 16px)` : 'auto',
          left: anchorRect ? 'auto' : '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: border }}>
          <div className="font-semibold">{question}</div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {options.map((opt) => (
            <div key={opt.id} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium" style={{ opacity: 0.95 }}>{opt.text}</div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: theme === 'admin' ? 'rgba(16,95,45,0.3)' : '#ECFDF5', border: `1px solid ${border}` }}>
                  {opt.voters.length} Stimme{opt.voters.length === 1 ? '' : 'n'}
                </span>
              </div>
              <div className="space-y-2">
                {opt.voters.map((v) => {
                  const u = resolveUser(v.user_id);
                  return (
                    <div key={v.user_id + v.created_at} className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full overflow-hidden border" style={{ borderColor: border }}>
                        <img src={u.avatar || '/placeholder.svg'} alt={u.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 text-sm">{u.name}</div>
                      <div className="text-xs opacity-70">{new Date(v.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t" style={{ borderColor: border }}>
          <button onClick={onClose} className="w-full text-sm rounded-lg px-3 py-2" style={{ background: theme === 'admin' ? 'rgba(255,255,255,0.10)' : '#F3F4F6', border: `1px solid ${border}`, color: text }}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}


