import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// PATCH: Approve or decline a special status request
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const { action } = await request.json();
    
    if (!action || !['approve', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'approve') {
      // Call the approve function
      const { error: approveError } = await service.rpc('approve_special_status_request', {
        request_id: params.id,
        admin_user_id: user.id
      });

      if (approveError) {
        console.error('Error approving request:', approveError);
        return NextResponse.json({ 
          error: 'Failed to approve request',
          details: approveError.message 
        }, { status: 500 });
      }
    } else {
      // Decline the request
      const { error: declineError } = await service
        .from('special_status_requests')
        .update({
          status: 'declined',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('status', 'pending');

      if (declineError) {
        console.error('Error declining request:', declineError);
        return NextResponse.json({ error: 'Failed to decline request' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/special-status/requests/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
