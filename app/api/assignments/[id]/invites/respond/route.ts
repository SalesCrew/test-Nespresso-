import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const server = createSupabaseServerClient()
    const { data: auth } = await server.auth.getUser()
    if (!auth?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await _req.json().catch(() => ({}))
    const status = body?.status as 'accepted' | 'withdrawn'
    if (!['accepted', 'withdrawn'].includes(status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 })
    }

    const svc = createSupabaseServiceClient()
    const { error } = await svc
      .from('assignment_invitations')
      .update({ status })
      .eq('assignment_id', params.id)
      .eq('user_id', auth.user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


