import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const promotorId = params.id;
  const svc = createSupabaseServiceClient();

  console.log('🔑 Access Credentials API - Fetching for promotor ID:', promotorId);

  try {
    // The promotorId is actually the user_id directly
    const userId = promotorId;
    console.log('🔑 Using user_id:', userId);

    // Get access credentials for this user
    const { data: credentials, error: credentialsError } = await svc
      .from('access_credentials')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('🔑 Supabase query result:', { 
      credentials: credentials ? 'Found data' : 'No data', 
      error: credentialsError?.code || 'No error',
      errorMessage: credentialsError?.message 
    });

    if (credentialsError && credentialsError.code !== 'PGRST116') {
      console.error('🔑 Error fetching access credentials:', credentialsError);
      return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
    }

    console.log('🔑 Returning credentials:', credentials ? 'Data found' : 'No data (null)');
    return NextResponse.json({ credentials: credentials || null });
  } catch (error: any) {
    console.error('🔑 Unexpected error in access credentials:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
