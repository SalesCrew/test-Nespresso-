import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { recomputeOnboarding } from '@/lib/onboarding/recompute';

const ALLOWED_TYPES = new Set(['passport','citizenship','arbeitserlaubnis']);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const userId = params.id;
  const body = await req.json().catch(() => ({} as any));
  const { doc_type, path } = body || {};
  if (!ALLOWED_TYPES.has(doc_type) || !path) return NextResponse.json({ error: 'invalid payload' }, { status: 400 });

  const svc = createSupabaseServiceClient();
  // Register/Upsert uploaded doc as 'uploaded'
  const { data, error } = await svc
    .from('documents')
    .upsert({ user_id: userId, doc_type, status: 'uploaded', file_path: path }, { onConflict: 'user_id,doc_type', ignoreDuplicates: false })
    .select('*')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  try { await recomputeOnboarding(svc as any, userId); } catch {}
  return NextResponse.json({ document: data });
}


