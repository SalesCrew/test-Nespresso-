import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { recomputeOnboarding } from '@/lib/onboarding/recompute';
import { requireAdmin } from '@/lib/supabase/queries';

function isSelfOrAdmin(requestingUserId: string, targetUserId: string, isAdmin: boolean) {
  return isAdmin || requestingUserId === targetUserId;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { ok: isAdmin } = await requireAdmin();
  if (!isSelfOrAdmin(auth.user.id, params.id, isAdmin)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const svc = createSupabaseServiceClient();

  const { data: profile } = await svc
    .from('promotor_profiles')
    .select('*')
    .eq('user_id', params.id)
    .maybeSingle();

  let application: any = null;
  if (profile?.application_id) {
    const { data: appRow } = await svc
      .from('applications')
      .select('*')
      .eq('id', profile.application_id)
      .maybeSingle();
    application = appRow || null;
  }

  return NextResponse.json({ profile: profile || null, application });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { ok: isAdmin } = await requireAdmin();
  if (!isSelfOrAdmin(auth.user.id, params.id, isAdmin)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const raw = await req.json().catch(() => ({} as any));
  const allowed = {
    phone: typeof raw.phone === 'string' ? raw.phone : undefined,
    address: typeof raw.address === 'string' ? raw.address : undefined,
    postal_code: typeof raw.postal_code === 'string' ? raw.postal_code : undefined,
    city: typeof raw.city === 'string' ? raw.city : undefined,
    region: typeof raw.region === 'string' ? raw.region : undefined,
    working_days: Array.isArray(raw.working_days) ? raw.working_days : undefined,
    height: typeof raw.height === 'string' ? raw.height : undefined,
    clothing_size: typeof raw.clothing_size === 'string' ? raw.clothing_size : undefined,
    birth_date: typeof raw.birth_date === 'string' ? raw.birth_date : undefined,
  } as any;

  const updates: any = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(allowed)) if (v !== undefined) updates[k] = v;
  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'no valid fields' }, { status: 400 });
  }

  const svc = createSupabaseServiceClient();
  const { error } = await svc
    .from('promotor_profiles')
    .update(updates)
    .eq('user_id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Recompute onboarding after profile change
  try { await recomputeOnboarding(svc as any, params.id); } catch {}
  return NextResponse.json({ ok: true });
}


