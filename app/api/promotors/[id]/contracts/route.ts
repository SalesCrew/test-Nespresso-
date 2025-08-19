import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

function isSelfOrAdmin(requestingUserId: string, targetUserId: string, isAdmin: boolean) {
  return isAdmin || requestingUserId === targetUserId;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const svc = createSupabaseServiceClient();
  const { data, error } = await svc
    .from('contracts')
    .select('id, user_id, file_path, is_active, created_at, updated_at')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contracts: data || [] });
}


