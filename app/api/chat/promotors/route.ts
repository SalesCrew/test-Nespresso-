import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET: Fetch all promotors for group creation (admin only)
export async function GET(request: NextRequest) {
  try {
    console.log('[/api/chat/promotors] Starting request');
    const supabase = createSupabaseServerClient();
    console.log('[/api/chat/promotors] Supabase client created');
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[/api/chat/promotors] User:', user?.id, 'Auth error:', authError);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log('[/api/chat/promotors] Profile:', userProfile, 'Error:', profileError);

    const userRole = userProfile?.role || 'promotor';
    const isAdmin = ['admin_staff', 'admin_of_admins'].includes(userRole);

    if (!isAdmin) {
      console.log('[/api/chat/promotors] User is not admin:', userRole);
      return NextResponse.json({ error: 'Only admins can access this resource' }, { status: 403 });
    }

    // Fetch all promotors
    console.log('[/api/chat/promotors] Fetching promotors...');
    
    // First, test without any filters to see if RLS is blocking
    const { data: allProfiles, error: allError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, role')
      .limit(5);
    
    console.log('[/api/chat/promotors] Test query (all profiles):', allProfiles?.length, 'Error:', allError);
    
    const { data: promotors, error: promotorsError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name')
      .eq('role', 'promotor')
      .order('display_name', { ascending: true });

    console.log('[/api/chat/promotors] Promotors query result:', promotors?.length, 'Error:', promotorsError);
    console.log('[/api/chat/promotors] First promotor:', promotors?.[0]);

    if (promotorsError) {
      console.error('[/api/chat/promotors] Error fetching promotors:', promotorsError);
      return NextResponse.json({ error: 'Failed to fetch promotors', details: promotorsError.message }, { status: 500 });
    }

    console.log('[/api/chat/promotors] Success! Returning', promotors?.length, 'promotors');
    return NextResponse.json({ promotors: promotors || [] });
  } catch (error: any) {
    console.error('[/api/chat/promotors] Unexpected error:', error);
    console.error('[/api/chat/promotors] Error stack:', error?.stack);
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
  }
}

