import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const server = createSupabaseServerClient()
    const { data: auth } = await server.auth.getUser()
    if (!auth?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await _req.json().catch(() => ({}))
    const status = body?.status as 'applied' | 'withdrawn' | 'accepted' | 'verstanden' | 'rejected_handled'
    if (!['applied', 'withdrawn', 'accepted', 'verstanden', 'rejected_handled'].includes(status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 })
    }

    const svc = createSupabaseServiceClient()
    
    // Build update object based on status
    const updateData: any = { status }
    
    // Only set responded_at for initial responses, not for verstanden or rejected_handled
    if (status !== 'verstanden' && status !== 'rejected_handled') {
      updateData.responded_at = new Date().toISOString()
    } else {
      // For verstanden and rejected_handled, also set acknowledged_at
      updateData.acknowledged_at = new Date().toISOString()
    }
    
    const { error } = await svc
      .from('assignment_invitations')
      .update(updateData)
      .eq('assignment_id', params.id)
      .eq('user_id', auth.user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


