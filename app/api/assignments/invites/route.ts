import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

// GET current user's assignment invitations (e.g., status=invited|accepted)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status') || 'invited'

    const server = createSupabaseServerClient()
    const { data: auth } = await server.auth.getUser()
    if (!auth?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // Use service client to join assignment details robustly
    const svc = createSupabaseServiceClient()
    const { data: invites, error: invErr } = await svc
      .from('assignment_invitations')
      .select('assignment_id, user_id, role, status, created_at')
      .eq('user_id', auth.user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })
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
        created_at: inv.created_at,
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


