import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ assignment: null }, { status: 401 })

    // Get all assignment IDs where this user is a participant (lead or buddy)
    const { data: participantRows, error: partErr } = await supabase
      .from('assignment_participants')
      .select('assignment_id, role')
      .eq('user_id', user.id)

    if (partErr) return NextResponse.json({ error: partErr.message }, { status: 500 })
    const assignmentIds = [...new Set((participantRows || []).map(r => r.assignment_id))]
    if (assignmentIds.length === 0) return NextResponse.json({ assignment: null })

    const nowIso = new Date().toISOString()

    // Fetch upcoming assignments for this user where status is assigned or buddy_tag
    const { data: assignments, error: asgErr } = await supabase
      .from('assignments')
      .select('id, title, location_text, address, postal_code, city, region, start_ts, end_ts, status')
      .in('id', assignmentIds)
      .in('status', ['assigned', 'buddy_tag'])
      .gt('start_ts', nowIso)
      .order('start_ts', { ascending: true })
      .limit(1)

    if (asgErr) return NextResponse.json({ error: asgErr.message }, { status: 500 })

    const assignment = (assignments && assignments[0]) || null
    return NextResponse.json({ assignment })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


