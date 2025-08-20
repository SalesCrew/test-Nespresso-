import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const svc = await createSupabaseServerClient()
    // Expect JSON rows already parsed client side for now
    const body = await req.json().catch(() => null)
    if (!body || !Array.isArray(body.rows)) {
      return NextResponse.json({ error: 'rows array required' }, { status: 400 })
    }
    const rows = body.rows as Array<any>
    const mapped = rows.map(r => ({
      title: r.title || null,
      description: r.description || null,
      location_text: r.location_text || r.location || null,
      postal_code: r.postal_code || r.plz || null,
      city: r.city || null,
      region: r.region || null,
      start_ts: r.start_ts,
      end_ts: r.end_ts || r.start_ts,
      type: r.type || 'promotion',
      status: 'open'
    }))
    const { data, error } = await svc.from('assignments').insert(mapped).select('id')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ inserted: data?.length ?? 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


