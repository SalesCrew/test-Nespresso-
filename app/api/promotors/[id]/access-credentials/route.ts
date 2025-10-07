import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const promotorId = params.id;
  const svc = createSupabaseServiceClient();

  try {
    const userId = promotorId;

    // Get access credentials for this user
    const { data: credentials, error: credentialsError } = await svc
      .from('access_credentials')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (credentialsError && credentialsError.code !== 'PGRST116') {
      console.error('Error fetching access credentials:', credentialsError);
      return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
    }

    return NextResponse.json({ credentials: credentials || null });
  } catch (error: any) {
    console.error('Unexpected error in access credentials:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const promotorId = params.id;
  const svc = createSupabaseServiceClient();

  try {
    const userId = promotorId;
    const updateData = await req.json();

    // Update or insert access credentials
    const { data: credentials, error: updateError } = await svc
      .from('access_credentials')
      .upsert({ user_id: userId, ...updateData }, { onConflict: 'user_id' })
      .select()
      .single();

    if (updateError) {
      console.error('Error updating access credentials:', updateError);
      return NextResponse.json({ error: 'Failed to update credentials' }, { status: 500 });
    }

    return NextResponse.json({ credentials });
  } catch (error: any) {
    console.error('Unexpected error updating access credentials:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
