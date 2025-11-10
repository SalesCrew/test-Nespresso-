'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, CalendarDays, Search, Link as LinkIcon } from 'lucide-react';

interface KrankenstandHistoryPopoverProps {
  userId: string;
  displayName?: string;
  onClose: () => void;
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

export default function KrankenstandHistoryPopover({
  userId,
  displayName,
  onClose
}: KrankenstandHistoryPopoverProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ total: number; items: FreedItem[] }>({ total: 0, items: [] });
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!userId) return;
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
  }, [userId]);

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

  const extractLocalHHMM = (ts?: string | null) => {
    if (!ts) return '';
    const s = String(ts);
    const m = s.match(/T(\d{2}:\d{2})/);
    if (m && m[1]) return m[1];
    // Fallback: locale formatting if unexpected shape
    try {
      return new Date(s).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">Krankenstand</p>
          <h3 className="text-sm font-semibold truncate">
            Freigegebene Einsätze – {displayName || 'Promotor'}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
              {data.total} insgesamt
            </span>
          </div>
        </div>
        <button className="p-1.5 rounded-md hover:bg-gray-50" onClick={onClose}>
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nach Markt / PLZ / Ort suchen…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="p-4 max-h-[520px] overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-3 bg-white">
                <div className="h-3 bg-gray-100 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="grid grid-cols-1 gap-2">
                  {[...Array(3)].map((__, j) => (
                    <div key={j} className="h-7 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-10">
            <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="text-sm text-gray-600">Keine freigegebenen Einsätze</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-200 p-3 bg-white space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  {new Date(item.created_at).toLocaleString('de-AT', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-gray-700 border border-gray-200">
                  {item.released_count} {item.released_count === 1 ? 'Einsatz' : 'Einsätze'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {(item.assignments || []).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-2 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {a.title || a.location_text || 'Promotion'}
                      </div>
                      <div className="text-[11px] text-gray-600 truncate">
                        {(a.postal_code || '')} {(a.city || '')}
                        {a.start_ts ? ` • ${extractLocalHHMM(a.start_ts)}` : ''}
                      </div>
                    </div>
                    <button
                      title="Details öffnen"
                      className="ml-3 h-7 w-7 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-100 text-[11px] text-gray-500 bg-white">
        Einsätze, die aufgrund von Krankenstand freigegeben wurden.
      </div>
    </div>
  );
}


