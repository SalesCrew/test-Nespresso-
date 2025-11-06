import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id
    if (!assignmentId) {
      return NextResponse.json({ error: 'Missing assignmentId' }, { status: 400 })
    }

    const server = createSupabaseServerClient()
    const { data: { user }, error: authError } = await server.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await server
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || !['admin_of_admins', 'admin_staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const svc = createSupabaseServiceClient()

    const { data: assignment, error: assignmentError } = await svc
      .from('assignments_with_buddy_info')
      .select('id, title, location_text, postal_code, city, start_ts, end_ts, notes, special_status, lead_user_id, lead_name, buddy_user_id, buddy_display_name')
      .eq('id', assignmentId)
      .maybeSingle()

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    let tracking = null
    if (assignment.lead_user_id) {
      const { data: trackingRow } = await svc
        .from('assignment_tracking')
        .select('assignment_id, user_id, buddy_user_id, actual_start_time, actual_end_time, status, notes, early_start_reason, minutes_early_start, early_end_reason, minutes_early_end, foto_maschine_url, foto_kapsellade_url, foto_pos_gesamt_url, foto_extra_url')
        .eq('assignment_id', assignmentId)
        .eq('user_id', assignment.lead_user_id)
        .maybeSingle()
      tracking = trackingRow ?? null
    }

    const { data: checkins } = await svc
      .from('assignment_daily_checkin')
      .select('checked_in_at')
      .eq('assignment_id', assignmentId)
      .order('checked_in_at', { ascending: true })

    const { data: outsideBreaks } = await svc
      .from('assignment_outside_breaks')
      .select('reported_at, user_id, created_at')
      .eq('assignment_id', assignmentId)
      .order('reported_at', { ascending: true })

    return NextResponse.json({
      assignment,
      tracking,
      checkins: checkins || [],
      outsideBreaks: outsideBreaks || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
