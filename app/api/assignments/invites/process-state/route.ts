import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active invitations for the user
    const { data: invitations, error } = await supabase
      .from('assignment_invitations')
      .select(`
        id,
        assignment_id,
        status,
        responded_at,
        acknowledged_at,
        replacement_for,
        metadata,
        assignment:assignments (
          id,
          title,
          location_text,
          postal_code,
          city,
          start_ts,
          end_ts,
          type
        )
      `)
      .eq('user_id', user.id)
      .or('acknowledged_at.is.null,status.in.(invited,applied)')
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate the current process state
    const activeInvitations = invitations || [];
    const originalInvitations = activeInvitations.filter(inv => !inv.replacement_for);
    const replacementInvitations = activeInvitations.filter(inv => inv.replacement_for);
    
    // Determine the current stage
    let stage: string = 'idle';
    let invitedAssignments: any[] = [];
    let waitingAssignments: any[] = [];
    let acceptedAssignments: any[] = [];
    let rejectedAssignments: any[] = [];
    let replacementAssignments: any[] = [];

    // Process each invitation
    for (const inv of activeInvitations) {
      const assignment = inv.assignment;
      if (!assignment) continue;

      const assignmentData = {
        id: assignment.id,
        date: new Date(assignment.start_ts).toLocaleDateString('de-DE', { 
          weekday: 'short', 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        }),
        time: `${new Date(assignment.start_ts).getUTCHours().toString().padStart(2, '0')}:${new Date(assignment.start_ts).getUTCMinutes().toString().padStart(2, '0')}-${new Date(assignment.end_ts).getUTCHours().toString().padStart(2, '0')}:${new Date(assignment.end_ts).getUTCMinutes().toString().padStart(2, '0')}`,
        location: assignment.location_text,
        invitationId: inv.id,
        status: inv.status,
        isReplacement: !!inv.replacement_for
      };

      if (inv.replacement_for) {
        replacementAssignments.push(assignmentData);
      } else if (inv.status === 'invited' && !inv.responded_at) {
        invitedAssignments.push(assignmentData);
        stage = 'select_assignment';
      } else if (inv.status === 'applied') {
        waitingAssignments.push(assignmentData);
        if (stage !== 'select_assignment') stage = 'waiting';
      } else if (inv.status === 'accepted' && !inv.acknowledged_at) {
        acceptedAssignments.push(assignmentData);
        if (stage !== 'select_assignment' && stage !== 'waiting') stage = 'accepted';
      } else if (inv.status === 'rejected' && !inv.acknowledged_at) {
        rejectedAssignments.push(assignmentData);
        if (stage !== 'select_assignment' && stage !== 'waiting' && stage !== 'accepted') stage = 'declined';
      }
    }

    // Check for partially accepted state
    if (acceptedAssignments.length > 0 && rejectedAssignments.length > 0) {
      stage = 'partially_accepted';
    }

    return NextResponse.json({
      stage,
      invitedAssignments,
      waitingAssignments,
      acceptedAssignments,
      rejectedAssignments,
      replacementAssignments,
      hasActiveProcess: stage !== 'idle'
    });

  } catch (error) {
    console.error('Error in process-state:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
