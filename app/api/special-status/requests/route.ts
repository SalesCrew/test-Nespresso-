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

    // Fetch pending requests
    const { data: requests, error } = await service
      .from('special_status_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        console.warn('Special status requests table not found');
        return NextResponse.json({ requests: [] });
      }
      console.error('Error fetching special status requests:', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
    
    // If we have requests, fetch user profiles separately
    if (requests && requests.length > 0) {
      const userIds = [...new Set(requests.map((r: any) => r.user_id))];
      const { data: profiles } = await service
        .from('user_profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);
      
      // Map profiles to requests
      if (profiles) {
        const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p]));
        requests.forEach((r: any) => {
          r.user_profiles = profileMap[r.user_id] || null;
        });
      }
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error('Unexpected error in GET /api/special-status/requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
