import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET(req: NextRequest) {
  const server = await createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  const url = new URL(req.url);
  const kwParam = url.searchParams.get('kw'); // e.g., "KW 41 (13.10-19.10)"

  try {
    // Parse KW to get date range
    let weekStart: string | null = null;
    let weekEnd: string | null = null;
    
    if (kwParam) {
      const match = kwParam.match(/\((\d{2})\.(\d{2})-(\d{2})\.(\d{2})\)/);
      if (match) {
        const [, startDay, startMonth, endDay, endMonth] = match;
        const currentYear = new Date().getFullYear();
        weekStart = `${currentYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}`;
        weekEnd = `${currentYear}-${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}`;
      }
    }

    // Get all promotors
    const { data: users } = await svc
      .from('user_profiles')
      .select('user_id, display_name')
      .eq('role', 'promotor');

    const userIds = (users || []).map((u: any) => u.user_id);

    // Get promotor profiles for regions
    const { data: profiles } = await svc
      .from('promotor_profiles')
      .select('user_id, region')
      .in('user_id', userIds);

    // Get active contracts with hours_per_week
    const { data: contracts} = await svc
      .from('contracts')
      .select('user_id, hours_per_week')
      .in('user_id', userIds)
      .eq('is_active', true);

    // Get assignments for the selected week
    let assignmentsQuery = svc
      .from('assignment_participants')
      .select('user_id, assignment:assignments(start_ts, end_ts, special_status)')
      .in('user_id', userIds);

    if (weekStart && weekEnd) {
      assignmentsQuery = assignmentsQuery
        .gte('assignment.start_ts', `${weekStart}T00:00:00`)
        .lte('assignment.start_ts', `${weekEnd}T23:59:59`);
    }

    const { data: participants } = await assignmentsQuery;

    // Build promotor workload data
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    const contractMap = new Map((contracts || []).map(c => [c.user_id, c]));

    // Group assignments by user and calculate hours
    const assignmentsByUser = new Map<string, any[]>();
    (participants || []).forEach((p: any) => {
      if (!assignmentsByUser.has(p.user_id)) {
        assignmentsByUser.set(p.user_id, []);
      }
      if (p.assignment) {
        assignmentsByUser.get(p.user_id)!.push(p.assignment);
      }
    });

    const workloadData = (users || []).map((user: any) => {
      const profile = profileMap.get(user.user_id);
      const contract = contractMap.get(user.user_id);
      const assignments = assignmentsByUser.get(user.user_id) || [];

      // Calculate working hours (subtract 1 hour break if > 6 hours)
      let totalHours = 0;
      let activeSpecialStatus: string | null = null;

      assignments.forEach((assignment: any) => {
        if (assignment.start_ts && assignment.end_ts) {
          const start = new Date(assignment.start_ts);
          const end = new Date(assignment.end_ts);
          const durationMs = end.getTime() - start.getTime();
          let hours = durationMs / (1000 * 60 * 60);

          // Subtract 1 hour break if assignment is longer than 6 hours
          if (hours > 6) {
            hours -= 1;
          }

          totalHours += hours;
        }

        // Check for special status (take the most recent one)
        if (assignment.special_status && !activeSpecialStatus) {
          activeSpecialStatus = assignment.special_status;
        }
      });

      const contractHours = contract?.hours_per_week || 0;
      const assignedHours = Math.round(totalHours);
      const overtime = assignedHours > contractHours ? assignedHours - contractHours : 0;

      return {
        user_id: user.user_id,
        name: user.display_name || 'Unbekannt',
        cluster: profile?.region || 'wien-noe-bgl',
        contractHours,
        assignedHours: assignedHours - overtime, // Base hours without overtime
        overtime,
        specialStatus: activeSpecialStatus
      };
    });

    return NextResponse.json({ workload: workloadData });
  } catch (error: any) {
    console.error('Error fetching auslastung:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
