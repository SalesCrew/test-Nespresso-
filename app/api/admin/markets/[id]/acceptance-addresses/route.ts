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
      .select('id, acceptance_addresses')
      .eq('id', params.id)
      .single();

    const list: any[] = Array.isArray((market as any)?.acceptance_addresses) ? (market as any).acceptance_addresses : [];
    const exists = list.some((e: any) => (e?.fingerprint || '') === fingerprint);
    const updated = exists ? list : [{ raw, fingerprint, plz, city, source: 'manual', added_at: new Date().toISOString() }, ...list].slice(0, 30);

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


