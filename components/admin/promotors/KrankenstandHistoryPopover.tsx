'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, CalendarDays, Search, Link as LinkIcon, ArrowLeft, Thermometer } from 'lucide-react';

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
  const [selected, setSelected] = useState<FreedItem['assignments'][number] | null>(null);

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

  const formatLocalDate = (ts?: string | null) => {
    if (!ts) return '';
    try {
      return new Date(String(ts)).toLocaleDateString('de-AT', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  // Allow Esc to go back from details
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selected) {
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  // Cluster helpers (mirrors einsatzplan rules)
  const getRegionFromPLZ = (plz?: string | null): string => {
    if (!plz) return '';
    const digits = String(plz).match(/\d{4}/)?.[0];
    if (!digits) return '';
    const plzNum = parseInt(digits, 10);
    if (Number.isNaN(plzNum)) return '';
    // Vienna
    if (plzNum >= 1000 && plzNum <= 1610) return 'W/NÖ/BGL';
    // NÖ / mixed
    if (plzNum >= 2000 && plzNum <= 3999) {
      if ((plzNum >= 2421 && plzNum <= 2425) || (plzNum >= 2473 && plzNum <= 2475) || plzNum === 2491) return 'W/NÖ/BGL';
      if (plzNum >= 3334 && plzNum <= 3335) return 'OÖ';
      return 'W/NÖ/BGL';
    }
    // OÖ
    if (plzNum >= 4000 && plzNum <= 4999) {
      if (plzNum === 4300 || plzNum === 4303 || (plzNum >= 4431 && plzNum <= 4432) ||
          plzNum === 4441 || plzNum === 4482 || plzNum === 4392) return 'W/NÖ/BGL';
      return 'OÖ';
    }
    // Salzburg / OÖ
    if (plzNum >= 5000 && plzNum <= 5999) {
      if ((plzNum >= 5120 && plzNum <= 5145) || plzNum === 5166 ||
          (plzNum >= 5211 && plzNum <= 5283) || plzNum === 5310 || plzNum === 5311 || plzNum === 5360) return 'OÖ';
      return 'S';
    }
    // Tirol / Vorarlberg
    if (plzNum >= 6000 && plzNum <= 6999) {
      if (plzNum >= 6700) return 'V';
      return 'T';
    }
    // Burgenland
    if (plzNum >= 7000 && plzNum <= 7999) {
      if (plzNum === 7421) return 'ST';
      return 'W/NÖ/BGL';
    }
    // Steiermark
    if (plzNum >= 8000 && plzNum <= 8999) {
      if (plzNum >= 8380 && plzNum <= 8385) return 'W/NÖ/BGL';
      return 'ST';
    }
    // Kärnten / Tirol
    if (plzNum >= 9000 && plzNum <= 9999) {
      if (plzNum === 9323) return 'ST';
      if (plzNum === 9782 || plzNum >= 9900) return 'T';
      return 'K';
    }
    return '';
  };
  const getClusterFromPLZ = (plz?: string | null): string => {
    const code = getRegionFromPLZ(plz);
    switch (code) {
      case 'W/NÖ/BGL': return 'wien-noe-bgl';
      case 'ST': return 'steiermark';
      case 'S': return 'salzburg';
      case 'OÖ': return 'oberoesterreich';
      case 'T': return 'tirol';
      case 'V': return 'vorarlberg';
      case 'K': return 'kaernten';
      default: return '';
    }
  };
  const getClusterShort = (cluster: string): string => {
    switch (cluster) {
      case 'wien-noe-bgl': return 'W/NÖ/BGL';
      case 'steiermark': return 'ST';
      case 'salzburg': return 'S';
      case 'oberoesterreich': return 'OÖ';
      case 'tirol': return 'T';
      case 'vorarlberg': return 'V';
      case 'kaernten': return 'K';
      default: return '—';
    }
  };
  const getClusterPillClasses = (cluster: string): string => {
    switch (cluster) {
      case 'wien-noe-bgl': return 'bg-[#E8F0FE] text-gray-700 border-[#CBD7F5]';
      case 'steiermark': return 'bg-[#E7F5ED] text-gray-700 border-[#CFECDD]';
      case 'salzburg': return 'bg-[#F0E9FF] text-gray-700 border-[#DDD4FF]';
      case 'oberoesterreich': return 'bg-[#FFF3E6] text-gray-700 border-[#FFE3C7]';
      case 'tirol': return 'bg-[#FFF0F0] text-gray-700 border-[#FFD9D9]';
      case 'vorarlberg': return 'bg-[#EAF8FF] text-gray-700 border-[#CFEFFF]';
      case 'kaernten': return 'bg-[#EAF6FF] text-gray-700 border-[#D6ECFF]';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="relative rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-50 border border-gray-200">
              <Thermometer className="h-3.5 w-3.5 text-gray-500" />
            </span>
            <span>Krankenstand</span>
          </div>
          <h3 className="text-sm font-semibold truncate">
            Freigegebene Einsätze – {displayName || 'Promotor'}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
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
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-0 focus:border-gray-300"
          />
        </div>
      </div>

      {/* Content area with list and details layers */}
      <div className="relative" style={{ maxHeight: '520px' }}>
        {/* List Layer */}
        <div className={`p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden transition-opacity transform duration-200 ease-out ${selected ? 'opacity-0 pointer-events-none -translate-y-1' : 'opacity-100 translate-y-0'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                    {item.released_count} {item.released_count === 1 ? 'Einsatz' : 'Einsätze'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {(item.assignments || []).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between px-2 py-1.5 rounded-md border border-gray-200 bg-gradient-to-r from-white to-red-50 transition-colors"
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
                          setSelected(a);
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

        {/* Details Layer */}
        <div className={`absolute inset-0 transition-opacity transform duration-200 ease-out ${selected ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none -translate-y-1'}`}>
          {/* Sticky mini header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Einsatzdetails</div>
            <div />
          </div>

          <div className="p-4 overflow-y-auto h-full [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {selected && (
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 space-y-3">
                <div className="text-base font-semibold text-gray-900 truncate">
                  {selected.title || selected.location_text || 'Promotion'}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] text-gray-500">Datum</div>
                    <div className="text-sm text-gray-900">{formatLocalDate(selected.start_ts) || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Geplante Zeit</div>
                    <div className="text-sm text-gray-900">
                      {selected.start_ts ? extractLocalHHMM(selected.start_ts) : '—'}
                      {selected.end_ts ? ` – ${extractLocalHHMM(selected.end_ts)}` : ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Adresse</div>
                    <div className="text-sm text-gray-900">
                      {(selected.postal_code || '')} {(selected.city || '') || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Cluster</div>
                    {(() => {
                      const slug = getClusterFromPLZ(selected.postal_code);
                      const short = getClusterShort(slug);
                      return (
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs border ${getClusterPillClasses(slug)}`}>
                          {short}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-end">
                  <button
                    className="h-8 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                    onClick={() => setSelected(null)}
                  >
                    Zurück
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-gray-100 text-[11px] text-gray-500 bg-white text-center">
        Einsätze, die aufgrund von Krankenstand freigegeben wurden.
      </div>
    </div>
  );
}


