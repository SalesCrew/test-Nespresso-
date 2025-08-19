import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { requireAdmin } from '@/lib/supabase/queries';
import { recomputeOnboarding } from '@/lib/onboarding/recompute';

export async function POST(req: NextRequest) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const {
    user_id,
    file_path,
    is_active,
    employment_type,
    hours_per_week,
    monthly_gross,
    start_date,
    end_date,
    is_temporary,
  } = body || {};
  // If file_path is missing, we treat this as sending an offer (no uploaded file yet)
  if (!user_id) return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  const svc = createSupabaseServiceClient();
  const insertPayload: any = {
    user_id,
    file_path: file_path ?? null,
    is_active: !!is_active && !!file_path,
  };
  if (employment_type) insertPayload.employment_type = String(employment_type);
  if (hours_per_week !== undefined && hours_per_week !== '') insertPayload.hours_per_week = Number(hours_per_week);
  if (monthly_gross !== undefined && monthly_gross !== '') insertPayload.monthly_gross = Number(monthly_gross);
  if (start_date) insertPayload.start_date = start_date;
  if (end_date) insertPayload.end_date = end_date;
  if (typeof is_temporary === 'boolean') insertPayload.is_temporary = is_temporary;

  // Try with full payload; if columns are missing in DB, fall back to minimal insert
  let insertRes = await svc
    .from('contracts')
    .insert(insertPayload)
    .select('*')
    .maybeSingle();
  if (insertRes.error) {
    const minimal = { user_id, file_path: file_path ?? null, is_active: !!is_active && !!file_path };
    insertRes = await svc
      .from('contracts')
      .insert(minimal)
      .select('*')
      .maybeSingle();
  }
  if (insertRes.error) return NextResponse.json({ error: insertRes.error.message }, { status: 500 });
  try { await recomputeOnboarding(svc as any, user_id); } catch {}
  return NextResponse.json({ contract: insertRes.data });
}

export async function PATCH(req: NextRequest) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const { id, is_active } = body || {};
  if (!id || typeof is_active !== 'boolean') return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  const svc = createSupabaseServiceClient();

  // Fetch the target contract to get user_id and file_path for validation
  const { data: target, error: fetchErr } = await svc
    .from('contracts')
    .select('id, user_id, file_path')
    .eq('id', id)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!target) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // If activating a contract, ensure it has a signed file and demote existing actives
  if (is_active) {
    if (!target.file_path) {
      return NextResponse.json({ error: 'cannot activate without signed file' }, { status: 400 });
    }
    // Demote all other active contracts for this user
    const { error: demoteErr } = await svc
      .from('contracts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', target.user_id as string)
      .eq('is_active', true)
      .neq('id', id);
    if (demoteErr) return NextResponse.json({ error: demoteErr.message }, { status: 500 });
  }

  const { error: activateErr } = await svc
    .from('contracts')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (activateErr) return NextResponse.json({ error: activateErr.message }, { status: 500 });

  try { await recomputeOnboarding(svc as any, target.user_id); } catch {}
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({} as any));
  const { id } = body || {};
  if (!id) return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  const svc = createSupabaseServiceClient();
  const { data: deleted, error } = await svc
    .from('contracts')
    .delete()
    .eq('id', id)
    .select('user_id')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  try { await recomputeOnboarding(svc as any, deleted?.user_id); } catch {}
  return NextResponse.json({ ok: true });
}


