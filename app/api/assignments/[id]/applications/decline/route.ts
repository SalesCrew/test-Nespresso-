import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}))
    const user_id = body?.user_id as string
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    const svc = createSupabaseServiceClient()
    const { data, error } = await svc
      .from('assignment_invitations')
      .update({ status: 'rejected' })
      .eq('assignment_id', params.id)
      .eq('user_id', user_id)
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, invitation_id: data?.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


