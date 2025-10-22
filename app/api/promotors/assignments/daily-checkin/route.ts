import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function POST(req: Request) {
  try {
    const server = createSupabaseServerClient();
    const { data: { user } } = await server.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { assignment_id, checkin_date } = body;

    if (!assignment_id || !checkin_date) {
      return NextResponse.json({ error: 'Missing assignment_id or checkin_date' }, { status: 400 });
    }

    const svc = createSupabaseServiceClient();

    // Verify user is a participant in this assignment
    const { data: participants, error: participantError } = await svc
      .from('assignment_participants')
      .select('id, role')
      .eq('assignment_id', assignment_id)
      .eq('user_id', user.id);

    if (participantError) {
      console.error('Error verifying assignment participant:', participantError);
      return NextResponse.json({ error: participantError.message }, { status: 500 });
    }

    const isParticipant = participants && participants.length > 0 && 
      participants.some(p => p.role === 'lead' || p.role === 'buddy');

    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized for this assignment' }, { status: 403 });
    }

    // Upsert the check-in record (idempotent - safe to call multiple times)
    const { data, error } = await svc
      .from('assignment_daily_checkin')
      .upsert({
        assignment_id,
        user_id: user.id,
        checkin_date,
        checked_in_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error recording daily check-in:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (e: any) {
    console.error('Server error in daily-checkin POST:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

