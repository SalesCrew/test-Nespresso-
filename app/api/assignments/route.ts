import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const region = url.searchParams.get('region')
    const status = url.searchParams.get('status')

    const svc = await createSupabaseServerClient()
    let q = svc.from('assignments').select('*').order('start_ts', { ascending: true })
    if (from) q = q.gte('start_ts', from)
    if (to) q = q.lte('end_ts', to)
    if (region) q = q.eq('region', region)
    if (status) q = q.eq('status', status)
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
    const svc = await createSupabaseServerClient()
    const { data, error } = await svc.from('assignments').insert(body).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ assignment: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


