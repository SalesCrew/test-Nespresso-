import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Approve or decline a special status request
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

    const body = await request.json();
    const { action } = body; // 'approve' or 'decline'

    if (!action || !['approve', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const requestId = params.id;

    if (action === 'approve') {
      // Use the database function to handle approval
      const { error: approvalError } = await supabase.rpc('approve_special_status_request', {
        request_id: requestId,
        admin_user_id: user.id
      });

      if (approvalError) {
        console.error('Error approving request:', approvalError);
        return NextResponse.json({ error: 'Failed to approve request' }, { status: 500 });
      }
    } else {
      // Decline the request
      const { error: declineError } = await supabase
        .from('special_status_requests')
        .update({
          status: 'declined',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('status', 'pending');

      if (declineError) {
        console.error('Error declining request:', declineError);
        return NextResponse.json({ error: 'Failed to decline request' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/special-status/requests/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
