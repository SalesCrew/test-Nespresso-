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
}

export default function PollMessage({ poll, mine, theme, onToggle }: PollMessageProps) {
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

  return (
    <div className="w-full">
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
              <div className="flex items-center gap-3">
                {/* Control */}
                <div
                  className="flex items-center justify-center rounded-full h-5 w-5 flex-shrink-0"
                  style={{
                    border: mine ? '2px solid rgba(255,255,255,0.9)' : '2px solid #D1D5DB',
                    background: selected ? gradient : 'transparent',
                    color: '#fff'
                  }}
                >
                  {selected ? '✓' : ''}
                </div>
                {/* Text & bar */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${mine ? 'text-white' : 'text-gray-800'} truncate`}>{opt.text}</div>
                  {/* Progress */}
                  <div className="mt-1 h-2 rounded-full overflow-hidden" style={{ background: trackBg }}>
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
                </div>
                {/* Count + avatars */}
                <div className="flex items-center gap-1 text-xs" style={{ color: mine ? '#F0FFF4' : '#6B7280' }}>
                  {Math.min(3, (opt.voterIds || []).length) > 0 && (
                    <div className="flex -space-x-2 mr-1">
                      {(opt.voterIds || []).slice(0, 3).map((id, i) => (
                        <div key={i} className="h-5 w-5 rounded-full border border-white overflow-hidden bg-gray-300">
                          <img src="/placeholder-user.jpg" alt="voter" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  <span>{count}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


