import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const server = createSupabaseServerClient()
    const { data: auth } = await server.auth.getUser()
    if (!auth?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const svc = createSupabaseServiceClient()
    const { data: invite, error } = await svc
      .from('assignment_invitations')
      .select('status')
      .eq('assignment_id', params.id)
      .eq('user_id', auth.user.id)
      .single()
      
    if (error) {
      console.error('Error fetching invitation status:', error)
      return NextResponse.json({ status: 'pending' })
    }

    return NextResponse.json({ status: invite?.status || 'pending' })
  } catch (e: any) {
    console.error('Server error in status check:', e)
    return NextResponse.json({ status: 'pending' })
  }
}
