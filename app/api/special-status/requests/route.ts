import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Get pending special status requests (for admin dashboard)
export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin_of_admins', 'admin_staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch pending requests with user info
    const { data: requests, error } = await supabase
      .from('special_status_requests')
      .select(`
        id,
        user_id,
        request_type,
        status,
        reason,
        requested_at,
        user_profiles!inner (
          display_name
        )
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error('Error in GET /api/special-status/requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Submit new special status request (from promotor)
export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { request_type, reason } = body;

    if (!request_type || !['krankenstand', 'notfall'].includes(request_type)) {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    // Check if user already has a pending request of this type
    const { data: existingRequest } = await supabase
      .from('special_status_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('request_type', request_type)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json({ error: 'You already have a pending request of this type' }, { status: 400 });
    }

    // Create new request
    const { data: newRequest, error: insertError } = await supabase
      .from('special_status_requests')
      .insert({
        user_id: user.id,
        request_type,
        reason: reason || null,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating request:', insertError);
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error) {
    console.error('Error in POST /api/special-status/requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
