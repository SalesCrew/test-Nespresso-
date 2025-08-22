import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

// GET current user's assignment invitations (e.g., status=invited|accepted)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status') || 'invited'

    // Use service client for both auth check and data fetch to avoid RLS issues
    const svc = createSupabaseServiceClient()
    const server = createSupabaseServerClient()
    const { data: auth } = await server.auth.getUser()
    
    if (!auth?.user) {
      console.error('No authenticated user found in invites API');
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    console.log('Fetching invites for user:', auth.user.id, 'with status:', status)
    
    // Use service client to join assignment details robustly
    const { data: invites, error: invErr } = await svc
      .from('assignment_invitations')
      .select('assignment_id, user_id, role, status, invited_at, responded_at')
      .eq('user_id', auth.user.id)
      .eq('status', status)
      .order('invited_at', { ascending: false })
    
    console.log('Invites query result:', { invites, error: invErr })
    if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })

    const assignmentIds = [...new Set((invites || []).map((i: any) => i.assignment_id))]
    if (assignmentIds.length === 0) return NextResponse.json({ invites: [] })

    const { data: assignments, error: asgErr } = await svc
      .from('assignments')
      .select('*')
      .in('id', assignmentIds)
    if (asgErr) return NextResponse.json({ error: asgErr.message }, { status: 500 })

    const byId = new Map((assignments || []).map((a: any) => [a.id, a]))
    const result = (invites || []).map((inv: any) => {
      const a = byId.get(inv.assignment_id)
      return {
        assignment_id: inv.assignment_id,
        status: inv.status,
        role: inv.role,
        invited_at: inv.invited_at,
        responded_at: inv.responded_at,
        assignment: a ? {
          id: a.id,
          location_text: a.location_text,
          postal_code: a.postal_code,
          city: a.city,
          region: a.region,
          start_ts: a.start_ts,
          end_ts: a.end_ts,
          status: a.status,
          description: a.description,
        } : null
      }
    })

    return NextResponse.json({ invites: result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


