import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const promotorId = params.id;
  const svc = createSupabaseServiceClient();

  console.log('🔑 ===== ACCESS CREDENTIALS API START =====');
  console.log('🔑 Promotor ID from URL params:', promotorId);
  console.log('🔑 Admin user making request:', auth.user.id);

  try {
    // The promotorId is actually the user_id directly
    const userId = promotorId;
    console.log('🔑 Using user_id for query:', userId);
    console.log('🔑 User ID type:', typeof userId);
    console.log('🔑 User ID length:', userId.length);

    // First, let's check if there are ANY records in access_credentials table
    console.log('🔑 Step 1: Checking if access_credentials table has any data...');
    const { data: allRecords, error: allError } = await svc
      .from('access_credentials')
      .select('user_id, huebner_email, demotool_email, tma_email, boost_app_email')
      .limit(5);
    
    console.log('🔑 All access_credentials records (first 5):', allRecords);
    console.log('🔑 Error getting all records:', allError);

    // Check if this specific user_id exists in the table
    console.log('🔑 Step 2: Checking if user_id exists in access_credentials...');
    const { data: userCheck, error: userCheckError } = await svc
      .from('access_credentials')
      .select('user_id')
      .eq('user_id', userId);
    
    console.log('🔑 User check result:', userCheck);
    console.log('🔑 User check error:', userCheckError);

    // Now try the original query
    console.log('🔑 Step 3: Running original query with .single()...');
    const { data: credentials, error: credentialsError } = await svc
      .from('access_credentials')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('🔑 Original query - Raw credentials data:', credentials);
    console.log('🔑 Original query - Full error object:', credentialsError);
    console.log('🔑 Original query - Error code:', credentialsError?.code);
    console.log('🔑 Original query - Error message:', credentialsError?.message);
    console.log('🔑 Original query - Error details:', credentialsError?.details);

    // Try without .single() to see if we get multiple records
    console.log('🔑 Step 4: Trying query without .single()...');
    const { data: credentialsArray, error: arrayError } = await svc
      .from('access_credentials')
      .select('*')
      .eq('user_id', userId);

    console.log('🔑 Array query - Results:', credentialsArray);
    console.log('🔑 Array query - Error:', arrayError);
    console.log('🔑 Array query - Result count:', credentialsArray?.length || 0);

    if (credentialsError && credentialsError.code !== 'PGRST116') {
      console.error('🔑 ERROR: Non-PGRST116 error occurred:', credentialsError);
      return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
    }

    const finalCredentials = credentials || (credentialsArray && credentialsArray[0]) || null;
    console.log('🔑 Final credentials to return:', finalCredentials);
    console.log('🔑 ===== ACCESS CREDENTIALS API END =====');
    
    return NextResponse.json({ credentials: finalCredentials });
  } catch (error: any) {
    console.error('🔑 UNEXPECTED ERROR in access credentials:', error);
    console.error('🔑 Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
