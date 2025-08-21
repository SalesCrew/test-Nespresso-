import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const svc = createSupabaseServiceClient()

    const updates: Record<string, any> = {}

    // Accept direct start_ts/end_ts or compute from date + planStart/planEnd
    if (body.start_ts) updates.start_ts = body.start_ts
    if (body.end_ts) updates.end_ts = body.end_ts

    if ((!updates.start_ts || !updates.end_ts) && body.date && body.planStart && body.planEnd) {
      const toIso = (dateStr: string, timeStr: string) => {
        // Combine without timezone assumptions, then toISOString
        const d = new Date(`${dateStr}T${timeStr}:00`)
        return d.toISOString()
      }
      updates.start_ts = updates.start_ts || toIso(String(body.date), String(body.planStart))
      updates.end_ts = updates.end_ts || toIso(String(body.date), String(body.planEnd))
    }

    if (body.location_text !== undefined) updates.location_text = String(body.location_text)
    if (body.postal_code !== undefined) updates.postal_code = String(body.postal_code)
    if (body.city !== undefined) updates.city = String(body.city)
    if (body.region !== undefined) updates.region = String(body.region)

    // Optional mapping from UI status → DB status
    if (body.status) {
      const ui = String(body.status)
      const map: Record<string, 'open' | 'assigned' | 'inviting' | 'completed' | 'cancelled'> = {
        Offen: 'open',
        Verplant: 'assigned',
      }
      const dbStatus = map[ui]
      if (dbStatus) updates.status = dbStatus
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    const { data, error } = await svc
      .from('assignments')
      .update(updates)
      .eq('id', params.id)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ assignment: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


