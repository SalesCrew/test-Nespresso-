import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET(req: Request) {
  try {
    const server = createSupabaseServerClient();
    const { data: { user } } = await server.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const svc = createSupabaseServiceClient();

    // Get today's date in YYYY-MM-DD format (local time)
    const today = new Date().toISOString().split('T')[0];

    // Fetch all assignments where the user is a participant (lead or buddy)
    const { data: participants, error: participantsError } = await svc
      .from('assignment_participants')
      .select(`
        assignment_id,
        assignments (
          id,
          title,
          location_text,
          start_ts,
          end_ts
        )
      `)
      .eq('user_id', user.id)
      .or('role.eq.lead,role.eq.buddy');

    if (participantsError) {
      console.error('Error fetching assignment participants:', participantsError);
      return NextResponse.json({ error: participantsError.message }, { status: 500 });
    }

    // Filter assignments that are happening today
    const todayAssignments = (participants || [])
      .filter(p => p.assignments)
      .map(p => p.assignments as any)
      .filter(a => {
        if (!a || !a.start_ts) return false;
        
        const startDate = new Date(a.start_ts).toISOString().split('T')[0];
        const endDate = a.end_ts ? new Date(a.end_ts).toISOString().split('T')[0] : startDate;
        
        // Check if today falls within the assignment period
        return startDate === today || endDate === today || 
          (startDate <= today && endDate >= today);
      });

    if (todayAssignments.length === 0) {
      return NextResponse.json({ needsCheckin: false });
    }

    // Check which assignments haven't been checked in yet today
    for (const assignment of todayAssignments) {
      const { data: checkin, error: checkinError } = await svc
        .from('assignment_daily_checkin')
        .select('id')
        .eq('assignment_id', assignment.id)
        .eq('user_id', user.id)
        .eq('checkin_date', today)
        .maybeSingle();

      if (checkinError) {
        console.error('Error checking daily check-in:', checkinError);
        continue;
      }

      // If no check-in exists for this assignment today, return it
      if (!checkin) {
        return NextResponse.json({
          needsCheckin: true,
          assignment: {
            id: assignment.id,
            title: assignment.title,
            location_text: assignment.location_text,
            start_time: assignment.start_ts
          }
        });
      }
    }

    // All assignments for today have been checked in
    return NextResponse.json({ needsCheckin: false });

  } catch (e: any) {
    console.error('Server error in daily-checkin/pending:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

