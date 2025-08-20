import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const svc = createSupabaseServiceClient()
    const body = await _req.json().catch(() => ({}))
    const user_id = String(body.user_id || '')
    const role = String(body.role || 'lead')
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    // Upsert participant
    const { error: upErr } = await svc.from('assignment_participants').upsert({ assignment_id: params.id, user_id, role, chosen_by_admin: true, chosen_at: new Date().toISOString() })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    // Set status to assigned
    const { error: asgErr } = await svc.from('assignments').update({ status: 'assigned' }).eq('id', params.id)
    if (asgErr) return NextResponse.json({ error: asgErr.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


