import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// POST: Create a new special status request
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { request_type, reason } = await request.json();
    
    if (!request_type || !['krankenstand', 'notfall'].includes(request_type)) {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    // Check if user already has a pending request
    const { data: existingRequest } = await supabase
      .from('special_status_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json({ error: 'You already have a pending request' }, { status: 400 });
    }

    // Create the request
    const { data, error } = await supabase
      .from('special_status_requests')
      .insert({
        user_id: user.id,
        request_type,
        reason,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating special status request:', error);
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  } catch (error) {
    console.error('Unexpected error in POST /api/special-status/requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Get pending requests for admins
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service client to bypass RLS for admin check
    const service = createSupabaseServiceClient();
    
    // Check if user is admin
    const { data: profile } = await service
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin_of_admins', 'admin_staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch pending requests with user profiles
    const { data: requests, error } = await service
      .from('special_status_requests')
      .select(`
        *,
        user_profiles!special_status_requests_user_id_fkey (
          display_name
        )
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching special status requests:', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error('Unexpected error in GET /api/special-status/requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
