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
    // Get the promotor's user_id from promotor_profiles
    const { data: profile, error: profileError } = await svc
      .from('promotor_profiles')
      .select('user_id')
      .eq('id', promotorId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Promotor not found' }, { status: 404 });
    }

    // Get access credentials for this user
    const { data: credentials, error: credentialsError } = await svc
      .from('access_credentials')
      .select('*')
      .eq('user_id', profile.user_id)
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
