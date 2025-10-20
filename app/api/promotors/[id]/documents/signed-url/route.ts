import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const userId = params.id;
  const { searchParams } = new URL(req.url);
  const doc_type = searchParams.get('doc_type');
  if (!doc_type) return NextResponse.json({ error: 'missing doc_type' }, { status: 400 });

  const svc = createSupabaseServiceClient();
  const { data: row, error } = await svc
    .from('documents')
    .select('file_path')
    .eq('user_id', userId)
    .eq('doc_type', doc_type)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row?.file_path) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const { data: signed, error: sErr } = await svc.storage
    .from('documents')
    .createSignedUrl(row.file_path, 300);
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
  return NextResponse.json({ url: signed?.signedUrl || null });
}


