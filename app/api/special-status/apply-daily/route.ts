import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// GET: Apply special status to today's assignments for all active users
// This should be called daily via a cron job or scheduler
export async function GET(request: NextRequest) {
  try {
    // Use service client to bypass RLS
    const service = createSupabaseServiceClient();
    
    // Get all active special statuses
    const { data: activeStatuses, error: statusError } = await service
      .from('active_special_status')
      .select('user_id, status_type, ended_at')
      .eq('is_active', true);

    if (statusError) {
      console.error('Error fetching active statuses:', statusError);
      return NextResponse.json({ error: 'Failed to fetch active statuses' }, { status: 500 });
    }

    if (!activeStatuses || activeStatuses.length === 0) {
      return NextResponse.json({ message: 'No active special statuses to apply' });
    }

    // Get today's date
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    let updatedCount = 0;
    let expiredCount = 0;

    // For each user with active special status
    for (const status of activeStatuses) {
      // Check if status has expired
      if (status.ended_at && new Date(status.ended_at) < now) {
        // Mark as inactive
        await service
          .from('active_special_status')
          .update({ is_active: false })
          .eq('user_id', status.user_id)
          .eq('is_active', true);
        
        expiredCount++;
        continue;
      }
      
      // Continue with normal flow for non-expired statuses (const status of activeStatuses) {
      // Get today's assignment IDs for this user
      const { data: participations } = await service
        .from('assignment_participants')
        .select('assignment_id')
        .eq('user_id', status.user_id);
      
      if (!participations || participations.length === 0) continue;
      
      const assignmentIds = participations.map(p => p.assignment_id);
      
      // Get today's assignments from those IDs
      const { data: assignments } = await service
        .from('assignments')
        .select('id')
        .eq('date', today)
        .in('id', assignmentIds);

      if (assignments && assignments.length > 0) {
        // Update all assignments with the special status
        const { error: updateError } = await service
          .from('assignments')
          .update({
            special_status: status.status_type,
            updated_at: new Date().toISOString()
          })
          .in('id', assignments.map(a => a.id));

        if (!updateError) {
          updatedCount += assignments.length;
        } else {
          console.error(`Error updating assignments for user ${status.user_id}:`, updateError);
        }
      }
    }

    return NextResponse.json({ 
      message: `Applied special status to ${updatedCount} assignments, expired ${expiredCount} statuses`,
      activeUsers: activeStatuses.length - expiredCount,
      assignmentsUpdated: updatedCount,
      expiredStatuses: expiredCount
    });
  } catch (error) {
    console.error('Unexpected error in apply-daily:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
