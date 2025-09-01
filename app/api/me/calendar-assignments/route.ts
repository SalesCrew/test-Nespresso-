
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ assignments: [] }, { status: 401 })
    
    // Use service client for data queries to bypass RLS
    const svc = createSupabaseServiceClient()

    // Get all assignment IDs where this user is a participant (lead or buddy)
    const { data: participantRows, error: partErr } = await svc
      .from('assignment_participants')
      .select('assignment_id, role')
      .eq('user_id', user.id)

    if (partErr) return NextResponse.json({ error: partErr.message }, { status: 500 })
    const assignmentIds = [...new Set((participantRows || []).map(r => r.assignment_id))]
    
    if (assignmentIds.length === 0) return NextResponse.json({ assignments: [] })

    // Fetch all assignments for this user with status assigned or buddy_tag
    const { data: assignments, error: asgErr } = await svc
      .from('assignments_with_buddy_info')
      .select('*')
      .in('id', assignmentIds)
      .in('status', ['assigned', 'buddy_tag'])
      .order('start_ts', { ascending: true })

    if (asgErr) return NextResponse.json({ error: asgErr.message }, { status: 500 })

    // Process assignments to determine type (promotion vs buddy)
    const processedAssignments = (assignments || []).map((assignment: any) => {
      const startDate = new Date(assignment.start_ts)
      const endDate = new Date(assignment.end_ts)
      
      // Check user role and buddy presence
      const userRole = participantRows?.find(p => p.assignment_id === assignment.id)?.role
      const hasBuddy = assignment.buddy_user_id || assignment.buddy_name || assignment.buddy_display_name
      
      // If there's a buddy, always show in buddy section regardless of user role
      const type = hasBuddy ? 'buddy' : 'promotion'
      
      // Determine whose name to show in buddy pill:
      // - If user is lead: show buddy's name
      // - If user is buddy: show lead's name
      let buddyDisplayName = null
      if (hasBuddy) {
        if (userRole === 'lead') {
          // User is lead, show buddy's name
          buddyDisplayName = assignment.buddy_name || assignment.buddy_display_name
        } else if (userRole === 'buddy') {
          // User is buddy, show lead's name
          buddyDisplayName = assignment.lead_name
        }
      }
      
      return {
        id: assignment.id,
        title: assignment.location_text || assignment.title || 'Promotion',
        location: assignment.postal_code && assignment.city 
          ? `${assignment.postal_code} ${assignment.city}` 
          : assignment.location_text || '',
        time: `${String(startDate.getUTCHours()).padStart(2,'0')}:${String(startDate.getUTCMinutes()).padStart(2,'0')}-${String(endDate.getUTCHours()).padStart(2,'0')}:${String(endDate.getUTCMinutes()).padStart(2,'0')}`,
        date: startDate,
        type: type,
        buddyName: buddyDisplayName
      }
    })

    return NextResponse.json({ assignments: processedAssignments })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
