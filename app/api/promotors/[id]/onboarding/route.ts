import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const svc = createSupabaseServiceClient();
  const userId = params.id;
  const { data, error } = await svc
    .from('onboarding_steps')
    .select('id, step_key, label, status, payload, created_at, updated_at, completed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ steps: data || [] });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const svc = createSupabaseServiceClient();
  const userId = params.id;
  const body = await req.json().catch(() => ({} as any));
  const { step_key, status, payload } = body || {};
  if (!step_key || !['pending','in_progress','done'].includes(status)) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }
  const update: any = { status, payload: payload ?? null, updated_at: new Date().toISOString() };
  if (status === 'done') update.completed_at = new Date().toISOString();
  const { error } = await svc
    .from('onboarding_steps')
    .update(update)
    .eq('user_id', userId)
    .eq('step_key', step_key);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


