'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CalendarDays, Search, Link as LinkIcon } from 'lucide-react';

interface KrankenstandHistorySheetProps {
  userId: string;
  displayName?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type FreedItem = {
  id: string;
  created_at: string;
  released_count: number;
  assignment_ids: string[];
  reason?: string | null;
  assignments: Array<{
    id: string;
    title?: string | null;
    location_text?: string | null;
    postal_code?: string | null;
    city?: string | null;
    start_ts?: string | null;
    end_ts?: string | null;
  }>;
};

export default function KrankenstandHistorySheet({
  userId,
  displayName,
  open,
  onOpenChange
}: KrankenstandHistorySheetProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ total: number; items: FreedItem[] }>({ total: 0, items: [] });
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open || !userId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/promotors/${userId}/freed-assignments`, { cache: 'no-store' });
        const j = await res.json().catch(() => ({}));
        if (res.ok) {
          setData({ total: Number(j.total || 0), items: Array.isArray(j.items) ? j.items : [] });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [open, userId]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return data.items;
    const q = query.toLowerCase();
    return data.items
      .map((it) => ({
        ...it,
        assignments: (it.assignments || []).filter((a) => {
          const txt = `${a.title || a.location_text || ''} ${a.postal_code || ''} ${a.city || ''}`.toLowerCase();
          return txt.includes(q);
        })
      }))
      .filter((it) => it.assignments.length > 0);
  }, [data.items, query]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg">
                  Freigegebene Einsätze – {displayName || 'Promotor'}
                </SheetTitle>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                    Krankenstand
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                    {data.total} insgesamt
                  </span>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Filters */}
          <div className="px-5 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nach Markt / PLZ / Ort suchen…"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {/* Placeholder for date filter (future enhancement) */}
              <button className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Zeitraum
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 p-4 bg-white">
                    <div className="h-4 bg-gray-100 rounded w-1/3 mb-3 animate-pulse"></div>
                    <div className="grid grid-cols-1 gap-2">
                      {[...Array(3)].map((__, j) => (
                        <div key={j} className="h-8 bg-gray-100 rounded animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-600">Keine freigegebenen Einsätze für Krankenstand</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 p-4 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {new Date(item.created_at).toLocaleString('de-AT', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                      {item.released_count} {item.released_count === 1 ? 'Einsatz' : 'Einsätze'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {(item.assignments || []).map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {a.title || a.location_text || 'Promotion'}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {(a.postal_code || '')} {(a.city || '')}{' '}
                            {a.start_ts
                              ? ` • ${new Date(a.start_ts).toLocaleTimeString('de-AT', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}`
                              : ''}
                          </div>
                        </div>
                        <button
                          title="Details öffnen"
                          className="ml-3 h-8 w-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Placeholder for deep-linking assignment details; integrate if available
                          }}
                        >
                          <LinkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500 bg-white">
            Diese Liste zeigt Einsätze, die aufgrund von Krankenstand freigegeben wurden.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


