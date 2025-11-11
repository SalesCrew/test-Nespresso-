import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { normalizeForMatch } from '@/lib/matchers/marketMatcher';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const server = createSupabaseServerClient();
    const { data: { user } } = await server.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await server
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (!profile || !['admin_staff', 'admin_of_admins'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const raw = String(body.raw || '').trim();
    const plz = body.plz ? String(body.plz).trim() : null;
    const city = body.city ? String(body.city).trim() : null;
    if (!raw) return NextResponse.json({ error: 'raw required' }, { status: 400 });

    const fingerprint = normalizeForMatch(raw);

    const svc = createSupabaseServiceClient();
    const { data: market } = await svc
      .from('markets')
      .select('id, name, address, plz, city, acceptance_addresses')
      .eq('id', params.id)
      .single();

    const list: any[] = Array.isArray((market as any)?.acceptance_addresses) ? (market as any).acceptance_addresses : [];
    // Also compute a name-based variant so assignments with location_text match
    const marketPlz = String((market as any)?.plz || '').trim();
    const marketCity = String((market as any)?.city || '').trim();
    const marketName = String((market as any)?.name || '').trim();
    const nameRaw = [marketName, [marketPlz, marketCity].filter(Boolean).join(' ')].filter(Boolean).join(', ').trim();
    const nameFingerprint = normalizeForMatch(nameRaw);

    const nowIso = new Date().toISOString();
    const existingFps = new Set(list.map((e: any) => String(e?.fingerprint || '')));
    const nextList = [...list];
    if (fingerprint && !existingFps.has(fingerprint)) {
      nextList.unshift({ raw, fingerprint, plz, city, source: 'manual', added_at: nowIso });
      existingFps.add(fingerprint);
    }
    if (nameFingerprint && !existingFps.has(nameFingerprint)) {
      nextList.unshift({ raw: nameRaw, fingerprint: nameFingerprint, plz: marketPlz || null, city: marketCity || null, source: 'name', added_at: nowIso });
      existingFps.add(nameFingerprint);
    }
    const updated = nextList.slice(0, 30);

    const { data: updatedRow, error } = await svc
      .from('markets')
      .update({ acceptance_addresses: updated })
      .eq('id', params.id)
      .select('acceptance_addresses')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Cascade: match other unmatched assignments with same "<location_text>, PLZ City" as this market
    try {
      if (nameFingerprint) {
        let q = svc
          .from('assignments')
          .select('id, location_text, postal_code, city, matched_market_id')
          .is('matched_market_id', null);
        if (marketPlz) q = q.eq('postal_code', marketPlz);
        if (marketCity) q = q.eq('city', marketCity);
        const { data: rows } = await q;
        const toUpdate = (rows || []).filter((row: any) => {
          const combined = [String(row.location_text || '').trim(), [String(row.postal_code || '').trim(), String(row.city || '').trim()].filter(Boolean).join(' ')].filter(Boolean).join(', ').trim();
          return normalizeForMatch(combined) === nameFingerprint;
        }).map((r: any) => r.id);
        if (toUpdate.length > 0) {
          await svc.from('assignments').update({ matched_market_id: params.id }).in('id', toUpdate);
        }
      }
    } catch (e) {
      // non-blocking
      console.warn('Non-blocking: cascade failed after acceptance add', e);
    }

    return NextResponse.json({ acceptance_addresses: (updatedRow as any)?.acceptance_addresses || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const server = createSupabaseServerClient();
    const { data: { user } } = await server.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await server
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (!profile || !['admin_staff', 'admin_of_admins'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const fingerprint = String(body.fingerprint || '').trim();
    if (!fingerprint) return NextResponse.json({ error: 'fingerprint required' }, { status: 400 });

    const svc = createSupabaseServiceClient();
    const { data: market } = await svc
      .from('markets')
      .select('id, acceptance_addresses')
      .eq('id', params.id)
      .single();

    const list: any[] = Array.isArray((market as any)?.acceptance_addresses) ? (market as any).acceptance_addresses : [];
    const updated = list.filter((e: any) => (e?.fingerprint || '') !== fingerprint);

    const { data: updatedRow, error } = await svc
      .from('markets')
      .update({ acceptance_addresses: updated })
      .eq('id', params.id)
      .select('acceptance_addresses')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ acceptance_addresses: (updatedRow as any)?.acceptance_addresses || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}


