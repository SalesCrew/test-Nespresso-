import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error in /api/assignments/today:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!['admin_of_admins', 'admin_staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // First, ensure tracking records exist for today's assignments
    const { error: updateError } = await supabase.rpc('check_and_update_tracking_status');
    if (updateError) {
      console.error('Error updating tracking status:', updateError);
    }

    // Fetch today's assignments with tracking data
    const { data: assignments, error: assignmentsError } = await supabase
      .from('todays_assignments')
      .select(`
        assignment_id,
        title,
        location_text,
        postal_code,
        city,
        planned_start,
        planned_end,
        user_id,
        role,
        participant_status,
        promotor_name,
        tracking_id,
        buddy_user_id,
        buddy_name,
        actual_start_time,
        actual_end_time,
        tracking_status,
        display_status,
        notes
      `)
      .order('planned_start', { ascending: true });

    if (assignmentsError) {
      console.error('Error fetching today\'s assignments:', assignmentsError);
      return NextResponse.json({ 
        error: 'Failed to fetch assignments', 
        details: assignmentsError.message 
      }, { status: 500 });
    }

    console.log(`Fetched ${assignments?.length || 0} assignments for today`);

    // Group assignments by assignment_id to handle buddy assignments
    const groupedAssignments = assignments?.reduce((acc: any[], curr) => {
      const existing = acc.find(a => a.assignment_id === curr.assignment_id && a.user_id === curr.user_id);
      if (!existing) {
        acc.push(curr);
      }
      return acc;
    }, []) || [];

    return NextResponse.json({ assignments: groupedAssignments });
  } catch (error) {
    console.error('Unexpected error in /api/assignments/today:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update assignment tracking (start/stop times, status)
export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin_of_admins', 'admin_staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { assignment_id, user_id, action, status } = body;

    if (!assignment_id || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let updateData: any = { updated_at: new Date().toISOString() };

    switch (action) {
      case 'start':
        updateData.actual_start_time = new Date().toISOString();
        updateData.status = 'gestartet';
        break;
      case 'stop':
        updateData.actual_end_time = new Date().toISOString();
        updateData.status = 'beendet';
        break;
      case 'update_status':
        if (!status || !['krankenstand', 'urlaub', 'zeitausgleich'].includes(status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        updateData.status = status;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update or create tracking record
    const { data: existing } = await supabase
      .from('assignment_tracking')
      .select('id')
      .eq('assignment_id', assignment_id)
      .eq('user_id', user_id)
      .single();

    let result;
    if (existing) {
      // Update existing record
      result = await supabase
        .from('assignment_tracking')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Create new record
      result = await supabase
        .from('assignment_tracking')
        .insert({
          assignment_id,
          user_id,
          ...updateData
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error updating tracking:', result.error);
      return NextResponse.json({ 
        error: 'Failed to update tracking',
        details: result.error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/assignments/today:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
