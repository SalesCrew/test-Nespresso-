import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const server = createSupabaseServerClient()
    const { data: auth } = await server.auth.getUser()
    if (!auth?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const svc = createSupabaseServiceClient()
    
    // Update invitation status to 'verstanden'
    const { error } = await svc
      .from('assignment_invitations')
      .update({ 
        status: 'verstanden',
        acknowledged_at: new Date().toISOString()
      })
      .eq('assignment_id', params.id)
      .eq('user_id', auth.user.id)
      .in('status', ['accepted', 'rejected'])
      
    if (error) {
      console.error('Error updating to verstanden:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Server error in acknowledge:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
