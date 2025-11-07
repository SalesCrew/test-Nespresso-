"use client";

import React, { useMemo } from "react";

interface PollOptionView {
  id: string;
  text: string;
  count: number;
  voterIds?: string[];
}

interface PollPayload {
  id: string;
  question: string;
  allow_multiple: boolean;
  options: PollOptionView[];
  my_votes: string[];
}

interface PollMessageProps {
  poll: PollPayload;
  mine: boolean; // message from current user (admin bubble)
  theme: "admin" | "promotor"; // controls gradient for fills and accents
  onToggle: (optionId: string, checked: boolean) => void;
  getAvatar?: (userId: string) => string | null | undefined; // optional mapping for voter avatars
  onViewVotes?: () => void;
  showViewButton?: boolean;
  timestamp?: string;
  viewButtonDisabled?: boolean; // when true, keep button visible but non-interactive
}

export default function PollMessage({ poll, mine, theme, onToggle, getAvatar, onViewVotes, showViewButton, timestamp, viewButtonDisabled }: PollMessageProps) {
  const totalVotes = useMemo(() => poll.options.reduce((s, o) => s + (o.count || 0), 0), [poll.options]);
  const isSelected = (id: string) => poll.my_votes.includes(id);
  const gradient = theme === "admin"
    ? "linear-gradient(135deg, #22C55E, #105F2D)"
    : "linear-gradient(135deg, #1D4ED8, #0EA5E9)";

  // Progress bar theming
  const trackBg = theme === "admin" ? "rgba(255,255,255,0.15)" : "rgba(229,231,235,0.7)"; // admin: subtle white; promotor: gray
  const fillBg = theme === "admin"
    ? "linear-gradient(135deg, rgba(255,255,255,0.60), #FFFFFF)" // admin: darker white to pure white for visible gradient
    : gradient; // promotor: blue gradient

  // Grey silhouette placeholder (head + shoulders) as inline SVG data URI
  const placeholderAvatar =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>` +
        `<circle cx='12' cy='12' r='12' fill='#E5E7EB'/>` +
        `<path d='M12 12c1.99 0 3.6-1.61 3.6-3.6S13.99 4.8 12 4.8 8.4 6.41 8.4 8.4 10.01 12 12 12zm0 2.4c-3.2 0-5.6 2.24-5.6 5.2h11.2c0-2.96-2.4-5.2-5.6-5.2z' fill='#9CA3AF'/>` +
      `</svg>`
    );

  return (
    <div className="w-full" data-poll-bubble>
      {/* Header */}
      <div className="mb-2">
        <div className="font-semibold text-base leading-tight" style={{ color: mine ? "#fff" : "#111827" }}>{poll.question}</div>
        <div className="text-xs opacity-70" style={{ color: mine ? "#ECFDF5" : "#6B7280" }}>
          {poll.allow_multiple ? "Mehrfachauswahl möglich." : "Wähle mindestens eine Option aus."}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const count = opt.count || 0;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const selected = isSelected(opt.id);
          return (
            <button
              key={opt.id}
              className={`w-full rounded-lg border text-left px-3 py-2 transition-colors ${mine ? 'bg-transparent border-white/20' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              onClick={(e) => { e.stopPropagation(); onToggle(opt.id, !selected); }}
            >
              <div className="flex items-start gap-3">
                {/* Control */}
                <div
                  className="flex items-center justify-center rounded-full h-5 w-5 flex-shrink-0 mt-0.5"
                  style={{
                    border: mine ? '2px solid rgba(255,255,255,0.9)' : '2px solid #D1D5DB',
                    background: selected ? gradient : 'transparent',
                    color: '#fff'
                  }}
                >
                  {selected ? '✓' : ''}
                </div>
                {/* Text & bar - fixed width for consistent alignment */}
                <div className="flex-1 min-w-0 relative">
                  <div className={`text-sm ${mine ? 'text-white' : 'text-gray-800'} break-words`}>{opt.text}</div>
                  {/* Progress - fixed width container */}
                  <div className="mt-1 h-2 rounded-full overflow-hidden w-full" style={{ background: trackBg }}>
                    <div
                      className="h-full"
                      style={{
                        width: `${percentage}%`,
                        background: fillBg,
                        transition: 'width 280ms cubic-bezier(0.2, 0.85, 0.2, 1)',
                        willChange: 'width',
                      }}
                    />
                  </div>
                  {/* Count + avatars - positioned absolutely above progress bar */}
                  <div className="absolute right-0 top-0 flex items-center gap-1 text-xs" style={{ color: mine ? '#F0FFF4' : '#6B7280' }}>
                    {Math.min(3, (opt.voterIds || []).length) > 0 && (
                      <div className="flex -space-x-1.5 mr-1">
                        {(opt.voterIds || []).slice(0, 3).map((id, i) => {
                          const resolved = getAvatar ? getAvatar(id) : undefined;
                          const src = resolved && !resolved.includes('placeholder') ? resolved : placeholderAvatar;
                          return (
                            <div key={i} className="h-4 w-4 rounded-full border border-white overflow-hidden bg-gray-300">
                              <img src={src} alt="voter" className="h-full w-full object-cover" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <span>{count}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {/* Timestamp (inside poll, above divider) */}
      {timestamp && (
        <p className={`text-xs mt-2 ${mine ? 'text-white/80 text-right' : 'text-gray-500'}`} style={{ fontSize: '0.5775rem' }}>
          {timestamp}
        </p>
      )}

      {theme === 'admin' && showViewButton && (onViewVotes || viewButtonDisabled) && (
        <div className="mt-2 pt-2" style={{ borderTop: theme === 'admin' ? '1px solid rgba(255,255,255,0.12)' : '1px solid #E5E7EB' }}>
          <button
            onClick={(e) => { if (viewButtonDisabled) return; e.stopPropagation(); onViewVotes && onViewVotes(); }}
            className="w-full text-sm rounded-lg px-3 py-2"
            style={{
              background: mine ? 'rgba(255,255,255,0.10)' : 'rgba(17,24,39,0.05)',
              border: mine ? '1px solid rgba(255,255,255,0.25)' : '1px solid #E5E7EB',
              color: mine ? '#fff' : '#111827',
              pointerEvents: viewButtonDisabled ? 'none' : 'auto'
            }}
            aria-disabled={viewButtonDisabled ? true : undefined}
            disabled={!!viewButtonDisabled}
          >
            Stimmen ansehen
          </button>
        </div>
      )}
    </div>
  );
}


