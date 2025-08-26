import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const region = url.searchParams.get('region')
    const status = url.searchParams.get('status')
    const ids = url.searchParams.get('ids')

    // Use service role to ensure admins can list all assignments regardless of session context
    const svc = createSupabaseServiceClient()
    // Query assignments directly and join with participant info to get buddy information
    let q = svc.from('assignments').select(`
      *,
      assignment_participants!assignment_participants_assignment_id_fkey(
        user_id,
        role,
        user_profiles(display_name)
      )
    `).order('start_ts', { ascending: true })
    
    if (ids) {
      const idArray = ids.split(',').filter(id => id.trim())
      q = q.in('id', idArray)
    } else {
      if (from) q = q.gte('start_ts', from)
      if (to) q = q.lte('end_ts', to)
      if (region) q = q.eq('region', region)
      if (status) q = q.eq('status', status)
    }
    
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ assignments: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const svc = createSupabaseServiceClient()
    const { data, error } = await svc.from('assignments').insert(body).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ assignment: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


