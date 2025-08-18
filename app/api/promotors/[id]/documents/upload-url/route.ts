import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

const ALLOWED_TYPES = new Set(['passport','citizenship','arbeitserlaubnis']);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const userId = params.id;
  // Only self or admin will be constrained by storage policies; here we just generate a path
  const body = await req.json().catch(() => ({} as any));
  const { doc_type, file_ext } = body || {};
  if (!ALLOWED_TYPES.has(doc_type)) return NextResponse.json({ error: 'invalid doc_type' }, { status: 400 });
  const ext = (String(file_ext || 'pdf').replace(/[^a-z0-9]/gi,'').toLowerCase()) || 'pdf';

  const path = `${userId}/${doc_type}.${ext}`;
  const svc = createSupabaseServiceClient();
  // We will use a signed URL for PUT via storage from the client; supabase-js v2 signed upload URLs are not universal,
  // so we return the path and the client will do storage.from('documents').upload(path, file, { upsert: true })
  // This endpoint exists mainly to agree on canonical path.
  return NextResponse.json({ bucket: 'documents', path });
}


