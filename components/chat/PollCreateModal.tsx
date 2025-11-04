"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface PollCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { question: string; options: string[]; allowMultiple: boolean }) => void;
  theme: "admin" | "promotor"; // controls gradient of the send button
}

export default function PollCreateModal({ open, onClose, onSubmit, theme }: PollCreateModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  // Local emoji picker for this modal
  const [emojiPicker, setEmojiPicker] = useState<{
    show: boolean;
    anchor: { top: number; left: number } | null; // viewport coordinates
    target: { type: 'question' } | { type: 'option'; index: number } | null;
    category: 'smileys' | 'symbols';
  }>({ show: false, anchor: null, target: null, category: 'smileys' });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setEmojiPicker({ show: false, anchor: null, target: null, category: 'smileys' });
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Element;
      if (containerRef.current && !containerRef.current.contains(t)) onClose();
      // close emoji picker if clicking outside of it and not on triggers
      const insidePicker = !!(t.closest('[data-modal-emoji-picker]'));
      const isTrigger = !!(t.closest('[data-modal-emoji-trigger]'));
      if (emojiPicker.show && !insidePicker && !isTrigger) {
        setEmojiPicker(prev => ({ ...prev, show: false }));
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, onClose]);

  const isValid = useMemo(() => {
    const q = question.trim();
    const filled = options.map(o => o.trim()).filter(Boolean);
    return q.length > 0 && filled.length >= 2 && filled.length <= 12 && filled.every(o => o.length <= 120);
  }, [question, options]);

  if (!open || !mounted) return null;

  const gradient = theme === "admin"
    ? "linear-gradient(135deg, #22C55E, #105F2D)"
    : "linear-gradient(135deg, #1D4ED8, #0EA5E9)";

  const addRowIfNeeded = (idx: number, value: string) => {
    const next = [...options];
    next[idx] = value;
    // Auto-add a new row when editing the last non-empty option and total < 12
    const nonEmpty = next.map(o => o.trim()).filter(Boolean).length;
    if (idx === next.length - 1 && nonEmpty === next.length && next.length < 12) {
      next.push("");
    }
    setOptions(next);
  };

  const submit = () => {
    if (!isValid) return;
    onSubmit({
      question: question.trim(),
      options: options.map(o => o.trim()).filter(Boolean).slice(0, 12),
      allowMultiple,
    });
    setQuestion("");
    setOptions(["", ""]);
    setAllowMultiple(true);
    onClose();
  };

  useEffect(() => {
    if (open) {
      console.log('[PollModal] rendering via portal');
    }
  }, [open]);

  const node = (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-[2px]" style={{ zIndex: 999999 }}>
      <div
        ref={containerRef}
        className="relative w-full sm:w-[560px] max-w-[92vw] rounded-2xl shadow-xl border border-gray-100"
        style={{ backgroundColor: "rgba(255,255,255,0.96)" }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 sticky top-0" style={{ backgroundColor: "rgba(255,255,255,0.96)" }}>
          <h3 className="text-base font-semibold text-gray-800">Abstimmung erstellen</h3>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[70vh] outline-none focus:outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Question */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Frage</label>
            <div className="relative">
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Gib eine Frage ein."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:outline-none focus:ring-0"
              />
              {/* Emoji placeholder spot (open to the right) */}
              <button
                type="button"
                data-modal-emoji-trigger
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={(e) => {
                  const triggerRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const pickerWidth = 260;
                  const pickerHeight = 196;
                  const padding = 12;
                  const viewportWidth = window.innerWidth;
                  const viewportHeight = window.innerHeight;
                  const desiredLeft = triggerRect.right + 8 + window.scrollX;
                  const maxLeft = viewportWidth + window.scrollX - pickerWidth - padding;
                  const clampedLeft = Math.max(window.scrollX + padding, Math.min(desiredLeft, maxLeft));
                  const desiredTop = triggerRect.top - 4 + window.scrollY;
                  const maxTop = viewportHeight + window.scrollY - pickerHeight - padding;
                  const clampedTop = Math.max(window.scrollY + padding, Math.min(desiredTop, maxTop));
                  setEmojiPicker({
                    show: true,
                    anchor: { top: clampedTop, left: clampedLeft },
                    target: { type: 'question' },
                    category: 'smileys',
                  });
                }}
              >🙂</button>
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Optionen</label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div className="relative" key={`opt-${idx}`}>
                  <input
                    value={opt}
                    onChange={e => addRowIfNeeded(idx, e.target.value)}
                    placeholder="+ Füge eine Option hinzu."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    data-modal-emoji-trigger
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={(e) => {
                      const triggerRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const pickerWidth = 260;
                      const pickerHeight = 196;
                      const padding = 12;
                      const viewportWidth = window.innerWidth;
                      const viewportHeight = window.innerHeight;
                      const desiredLeft = triggerRect.right + 8 + window.scrollX;
                      const maxLeft = viewportWidth + window.scrollX - pickerWidth - padding;
                      const clampedLeft = Math.max(window.scrollX + padding, Math.min(desiredLeft, maxLeft));
                      const desiredTop = triggerRect.top - 4 + window.scrollY;
                      const maxTop = viewportHeight + window.scrollY - pickerHeight - padding;
                      const clampedTop = Math.max(window.scrollY + padding, Math.min(desiredTop, maxTop));
                      setEmojiPicker({
                        show: true,
                        anchor: { top: clampedTop, left: clampedLeft },
                        target: { type: 'option', index: idx },
                        category: 'smileys',
                      });
                    }}
                  >🙂</button>
                </div>
              ))}
            </div>
          </div>

          {/* Toggle */}
          <label className="flex items-center gap-3 select-none cursor-pointer">
            <input type="checkbox" className="accent-green-600" checked={allowMultiple} onChange={e => setAllowMultiple(e.target.checked)} />
            <span className="text-sm text-gray-700">Mehrere Antworten erlauben</span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
          >Abbrechen</button>
          <button
            onClick={submit}
            disabled={!isValid}
            className="h-10 w-12 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: gradient }}
            title="Senden"
          >
            ▷
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(node, document.body)}
      {emojiPicker.show && emojiPicker.anchor && createPortal(
        <div
          data-modal-emoji-picker
          className="bg-white rounded-lg shadow-xl border border-gray-200"
          style={{
            position: 'absolute',
            top: emojiPicker.anchor.top,
            left: emojiPicker.anchor.left,
            width: '260px',
            height: '196px',
            zIndex: 1000000,
            overflow: 'hidden'
          }}
        >
          <div className="h-full flex flex-col">
            <div
              className="flex-1 p-2"
              style={{ overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="grid grid-cols-8 gap-1">
                {(emojiPicker.category === 'smileys'
                    ? ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😍','🤩','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🥳','😎']
                    : ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💖','💘','💝','💟','✅','❌','⭕','💯','✨','⭐','🔥','⚡'])
                  .map((emoji, i) => (
                    <button
                      key={i}
                      className="text-xl p-1.5 rounded hover:bg-gray-100"
                      onClick={() => {
                        if (!emojiPicker.target) return;
                        if (emojiPicker.target.type === 'question') {
                          setQuestion(prev => prev + emoji);
                        } else {
                          const targetIndex = (emojiPicker.target.type === 'option') ? emojiPicker.target.index : 0;
                          setOptions(prev => {
                            const next = [...prev];
                            next[targetIndex] = (next[targetIndex] || '') + emoji;
                            return next;
                          });
                        }
                        setEmojiPicker(prev => ({ ...prev, show: false }));
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
              </div>
            </div>
            <div className="border-t border-gray-200 p-1 bg-gray-50">
              <div className="flex justify-around">
                {(['smileys','symbols'] as const).map(cat => (
                  <button
                    key={cat}
                    className={`px-2 py-1 rounded text-xs ${emojiPicker.category===cat? 'bg-gray-200 text-gray-800':'hover:bg-gray-100 text-gray-600'}`}
                    onClick={() => setEmojiPicker(prev => ({ ...prev, category: cat }))}
                  >{cat}</button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body)}
    </>
  );
}


