import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
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

    const { assignment_ids, user_id, reason } = await request.json();

    if (!assignment_ids || !Array.isArray(assignment_ids) || assignment_ids.length === 0) {
      return NextResponse.json({ error: 'No assignments provided' }, { status: 400 });
    }

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const failed: any[] = [];
    let releasedCount = 0;

    // Process each assignment
    for (const assignmentId of assignment_ids) {
      try {
        // Get the participation to know the role
        const { data: participation } = await service
          .from('assignment_participants')
          .select('role')
          .eq('assignment_id', assignmentId)
          .eq('user_id', user_id)
          .single();

        if (!participation) {
          failed.push({ assignment_id: assignmentId, reason: 'No participation found' });
          continue;
        }

        if (participation.role === 'lead') {
          // Remove lead participant
          const { error: deleteError } = await service
            .from('assignment_participants')
            .delete()
            .eq('assignment_id', assignmentId)
            .eq('role', 'lead');

          if (deleteError) {
            failed.push({ assignment_id: assignmentId, reason: deleteError.message });
            continue;
          }

          // Check if buddy exists
          const { data: buddyExists } = await service
            .from('assignment_participants')
            .select('user_id')
            .eq('assignment_id', assignmentId)
            .eq('role', 'buddy')
            .single();

          // Update assignment status
          const { error: updateError } = await service
            .from('assignments')
            .update({ 
              status: 'open',
              special_status: null
            })
            .eq('id', assignmentId);

          if (updateError) {
            failed.push({ assignment_id: assignmentId, reason: updateError.message });
            continue;
          }

          releasedCount++;
        } else if (participation.role === 'buddy') {
          // Remove buddy participant
          const { error: deleteError } = await service
            .from('assignment_participants')
            .delete()
            .eq('assignment_id', assignmentId)
            .eq('role', 'buddy');

          if (deleteError) {
            failed.push({ assignment_id: assignmentId, reason: deleteError.message });
            continue;
          }

          // Update assignment - clear buddy info and change status if needed
          const { data: assignment } = await service
            .from('assignments')
            .select('status')
            .eq('id', assignmentId)
            .single();

          const updates: any = {
            buddy_user_id: null,
            buddy_name: null
          };

          // If status was buddy_tag, change to assigned
          if (assignment?.status === 'buddy_tag') {
            updates.status = 'assigned';
          }

          const { error: updateError } = await service
            .from('assignments')
            .update(updates)
            .eq('id', assignmentId);

          if (updateError) {
            failed.push({ assignment_id: assignmentId, reason: updateError.message });
            continue;
          }

          releasedCount++;
        }
      } catch (error) {
        console.error(`Error releasing assignment ${assignmentId}:`, error);
        failed.push({ 
          assignment_id: assignmentId, 
          reason: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({ 
      released_count: releasedCount,
      failed: failed.length > 0 ? failed : undefined
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/assignments/release-multiple:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

