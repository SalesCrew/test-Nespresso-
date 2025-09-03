import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Get current promotor's special status
export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active special status
    const { data: activeStatus, error: statusError } = await supabase
      .from('active_special_status')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (statusError && statusError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching active status:', statusError);
      return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }

    // Get pending requests
    const { data: pendingRequests, error: requestsError } = await supabase
      .from('special_status_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching pending requests:', requestsError);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    return NextResponse.json({ 
      active_status: activeStatus,
      pending_requests: pendingRequests || []
    });
  } catch (error) {
    console.error('Error in GET /api/me/special-status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// End current special status (krankenstand beenden)
export async function DELETE() {
  try {
    const supabase = createSupabaseServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // End active special status
    const { error: endError } = await supabase
      .from('active_special_status')
      .update({
        ended_at: new Date().toISOString(),
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (endError) {
      console.error('Error ending special status:', endError);
      return NextResponse.json({ error: 'Failed to end special status' }, { status: 500 });
    }

    // Clear special status from today's assignments
    const { error: clearError } = await supabase
      .from('assignments')
      .update({
        special_status: null,
        updated_at: new Date().toISOString()
      })
      .eq('date', new Date().toISOString().split('T')[0])
      .in('id', 
        supabase
          .from('assignment_participants')
          .select('assignment_id')
          .eq('user_id', user.id)
      );

    if (clearError) {
      console.error('Error clearing assignment status:', clearError);
      return NextResponse.json({ error: 'Failed to clear assignment status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/me/special-status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
