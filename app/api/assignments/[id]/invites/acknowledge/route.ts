import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const server = createSupabaseServerClient()
    const { data: auth } = await server.auth.getUser()
    if (!auth?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const svc = createSupabaseServiceClient()
    
    // Insert acknowledgment record
    const { error } = await svc
      .from('assignment_acknowledgments')
      .insert({
        assignment_id: params.id,
        user_id: auth.user.id
      })
      .select()
      .single()
      
    if (error && error.code !== '23505') { // Ignore unique constraint violations
      console.error('Error saving acknowledgment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Server error in acknowledge:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
