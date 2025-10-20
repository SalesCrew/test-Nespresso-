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

  console.log('🔑 PATCH - Updating credentials for promotor:', promotorId);

  try {
    const userId = promotorId;
    const updateData = await req.json();
    console.log('🔑 PATCH - Update data received:', updateData);

    // First check if record exists
    const { data: existing, error: checkError } = await svc
      .from('access_credentials')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('🔑 PATCH - Existing record:', existing);
    console.log('🔑 PATCH - Check error:', checkError);

    let result;
    if (existing) {
      // Update existing record
      console.log('🔑 PATCH - Updating existing record');
      const { data: updated, error: updateError } = await svc
        .from('access_credentials')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();
      
      console.log('🔑 PATCH - Update result:', updated);
      console.log('🔑 PATCH - Update error:', updateError);
      
      if (updateError) {
        throw updateError;
      }
      result = updated;
    } else {
      // Insert new record
      console.log('🔑 PATCH - Creating new record');
      const { data: inserted, error: insertError } = await svc
        .from('access_credentials')
        .insert({ user_id: userId, ...updateData })
        .select()
        .single();
      
      console.log('🔑 PATCH - Insert result:', inserted);
      console.log('🔑 PATCH - Insert error:', insertError);
      
      if (insertError) {
        throw insertError;
      }
      result = inserted;
    }

    console.log('🔑 PATCH - Final result:', result);
    return NextResponse.json({ credentials: result });
  } catch (error: any) {
    console.error('🔑 PATCH - Unexpected error:', error);
    console.error('🔑 PATCH - Error details:', error.details);
    console.error('🔑 PATCH - Error message:', error.message);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
