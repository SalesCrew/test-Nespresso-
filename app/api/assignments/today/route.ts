import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const server = createSupabaseServerClient();
    const service = createSupabaseServiceClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await server.auth.getUser();
    if (authError || !user) {
      console.error('Auth error in /api/assignments/today:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin using service client
    console.log('Checking profile for user:', user.id);
    const { data: profile, error: profileError } = await service
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile query error:', profileError);
      console.error('User ID:', user.id);
      return NextResponse.json({ 
        error: 'Profile not found', 
        details: profileError.message,
        userId: user.id 
      }, { status: 404 });
    }
    
    if (!profile) {
      console.error('No profile found for user:', user.id);
      return NextResponse.json({ 
        error: 'Profile not found',
        userId: user.id 
      }, { status: 404 });
    }

    if (!['admin_of_admins', 'admin_staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // First, ensure tracking records exist for today's assignments
    const { error: updateError } = await service.rpc('check_and_update_tracking_status');
    if (updateError) {
      console.error('Error updating tracking status:', updateError);
    }

    // Fetch today's assignment participants with tracking data  
    // We need to query assignment_participants joined with tracking data for each participant
    const { data: assignments, error: assignmentsError } = await service
      .from('assignment_participants')
      .select(`
        assignment_id,
        user_id,
        role,
        status,
        assignments!inner (
          id,
          title,
          location_text,
          postal_code,
          city,
          planned_start,
          planned_end,
          special_status,
          display_status:status
        ),
        user_profiles!inner (
          display_name
        ),
        assignment_tracking (
          actual_start_time,
          actual_end_time,
          tracking_status,
          notes,
          early_start_reason,
          minutes_early_start,
          early_end_reason,
          minutes_early_end,
          foto_maschine_url,
          foto_kapsellade_url,
          foto_pos_gesamt_url
        )
      `)
      .eq('assignments.date', new Date().toISOString().split('T')[0])
      .order('assignments.planned_start', { ascending: true });

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
      const existingAssignment = acc.find(a => a.assignment_id === curr.assignment_id);
      const assignment = curr.assignments;
      const tracking = curr.assignment_tracking?.[0]; // Get first tracking record
      
      const trackingData = tracking ? {
        user_id: curr.user_id,
        actual_start_time: tracking.actual_start_time,
        actual_end_time: tracking.actual_end_time,
        tracking_status: tracking.tracking_status,
        notes: tracking.notes,
        early_start_reason: tracking.early_start_reason,
        minutes_early_start: tracking.minutes_early_start,
        early_end_reason: tracking.early_end_reason,
        minutes_early_end: tracking.minutes_early_end,
        foto_maschine_url: tracking.foto_maschine_url,
        foto_kapsellade_url: tracking.foto_kapsellade_url,
        foto_pos_gesamt_url: tracking.foto_pos_gesamt_url
      } : {
        user_id: curr.user_id,
        actual_start_time: null,
        actual_end_time: null,
        tracking_status: null,
        notes: null,
        early_start_reason: null,
        minutes_early_start: null,
        early_end_reason: null,
        minutes_early_end: null,
        foto_maschine_url: null,
        foto_kapsellade_url: null,
        foto_pos_gesamt_url: null
      };
      
      if (!existingAssignment) {
        // First participant for this assignment
        const assignmentData = {
          assignment_id: curr.assignment_id,
          title: assignment.title,
          location_text: assignment.location_text,
          postal_code: assignment.postal_code,
          city: assignment.city,
          planned_start: assignment.planned_start,
          planned_end: assignment.planned_end,
          display_status: assignment.display_status || curr.status,
          special_status: assignment.special_status,
          user_id: curr.user_id,
          role: curr.role,
          participant_status: curr.status,
          promotor_name: curr.user_profiles.display_name,
          buddy_name: null,
          buddy_user_id: null,
          // Store tracking data for the first participant (could be promotor or buddy)
          promotor_tracking: curr.role === 'lead' ? trackingData : null,
          buddy_tracking: curr.role === 'buddy' ? trackingData : null,
          // Legacy fields for backward compatibility
          tracking_status: tracking?.tracking_status,
          actual_start_time: tracking?.actual_start_time,
          actual_end_time: tracking?.actual_end_time,
          notes: tracking?.notes,
          early_start_reason: tracking?.early_start_reason,
          minutes_early_start: tracking?.minutes_early_start,
          early_end_reason: tracking?.early_end_reason,
          minutes_early_end: tracking?.minutes_early_end,
          foto_maschine_url: tracking?.foto_maschine_url,
          foto_kapsellade_url: tracking?.foto_kapsellade_url,
          foto_pos_gesamt_url: tracking?.foto_pos_gesamt_url
        };
        acc.push(assignmentData);
      } else {
        // Second participant for existing assignment
        if (curr.role === 'lead') {
          existingAssignment.promotor_tracking = trackingData;
          existingAssignment.promotor_name = curr.user_profiles.display_name;
          existingAssignment.user_id = curr.user_id; // Update to lead user
        } else {
          existingAssignment.buddy_tracking = trackingData;
          existingAssignment.buddy_name = curr.user_profiles.display_name;
          existingAssignment.buddy_user_id = curr.user_id;
        }
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
    const server = createSupabaseServerClient();
    const service = createSupabaseServiceClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await server.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assignment_id, user_id, action, status, actual_start_time, actual_end_time, early_start_reason, minutes_early_start, early_end_reason, minutes_early_end, foto_maschine_url, foto_kapsellade_url, foto_pos_gesamt_url } = body;

    if (!assignment_id) {
      return NextResponse.json({ error: 'Missing assignment_id' }, { status: 400 });
    }

    // If user_id is provided, check admin role. If not, use current user (promotor updating their own)
    const targetUserId = user_id || user.id;
    
    if (user_id && user_id !== user.id) {
      // Admin updating someone else's tracking
      const { data: profile } = await service
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!profile || !['admin_of_admins', 'admin_staff'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      // Promotor updating their own - verify they're assigned to this assignment
      const { data: participation } = await service
        .from('assignment_participants')
        .select('user_id')
        .eq('assignment_id', assignment_id)
        .eq('user_id', user.id)
        .single();
      
      if (!participation) {
        return NextResponse.json({ error: 'Not assigned to this assignment' }, { status: 403 });
      }
    }

    let updateData: any = { updated_at: new Date().toISOString() };

    // Handle direct timestamp updates (from promotor app)
    if (actual_start_time) {
      updateData.actual_start_time = actual_start_time;
    }
    if (actual_end_time) {
      updateData.actual_end_time = actual_end_time;
    }
    if (status) {
      updateData.status = status;
    }
    
    // Handle early start reasoning
    console.log('🔵 [API] Received early start data:', { early_start_reason, minutes_early_start });
    if (early_start_reason) {
      updateData.early_start_reason = early_start_reason;
      console.log('✅ [API] Adding early_start_reason to update');
    }
    if (minutes_early_start !== undefined) {
      updateData.minutes_early_start = minutes_early_start;
      console.log('✅ [API] Adding minutes_early_start to update');
    }
    
    // Handle early end reasoning
    console.log('🔵 [API] Received early end data:', { early_end_reason, minutes_early_end });
    if (early_end_reason) {
      updateData.early_end_reason = early_end_reason;
      console.log('✅ [API] Adding early_end_reason to update');
    }
    if (minutes_early_end !== undefined) {
      updateData.minutes_early_end = minutes_early_end;
      console.log('✅ [API] Adding minutes_early_end to update');
    }
    
    // Handle photo URLs
    if (foto_maschine_url) {
      updateData.foto_maschine_url = foto_maschine_url;
      console.log('✅ [API] Adding foto_maschine_url to update');
    }
    if (foto_kapsellade_url) {
      updateData.foto_kapsellade_url = foto_kapsellade_url;
      console.log('✅ [API] Adding foto_kapsellade_url to update');
    }
    if (foto_pos_gesamt_url) {
      updateData.foto_pos_gesamt_url = foto_pos_gesamt_url;
      console.log('✅ [API] Adding foto_pos_gesamt_url to update');
    }

    // Handle action-based updates (legacy admin interface)
    if (action) {
      // Get Austrian local time as ISO string WITHOUT timezone conversion
      const now = new Date();
      // Use sv-SE locale which gives YYYY-MM-DD HH:mm:ss format
      const austrianTimeString = now.toLocaleString('sv-SE', { 
        timeZone: 'Europe/Vienna',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(' ', 'T') + '.000Z';  // Add T and fake Z to make it look like ISO but with Austrian time
      
      switch (action) {
        case 'start':
          updateData.actual_start_time = austrianTimeString;
          updateData.status = 'gestartet';
          break;
        case 'stop':
          updateData.actual_end_time = austrianTimeString;
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
    }

    console.log('🔴 [API] Final updateData before database save:', updateData);
    
    // Update or create tracking record
    const { data: existing } = await service
      .from('assignment_tracking')
      .select('id')
      .eq('assignment_id', assignment_id)
      .eq('user_id', targetUserId)
      .single();

    let result;
    if (existing) {
      // Update existing record
      result = await service
        .from('assignment_tracking')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Create new record
      result = await service
        .from('assignment_tracking')
        .insert({
          assignment_id,
          user_id: targetUserId,
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
