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
    if (body.notes !== undefined) updates.notes = String(body.notes)

    // Handle status updates - accept both UI and DB status formats
    if (body.status) {
      const status = String(body.status)
      // If it's already a valid DB status, use it directly
      const validDbStatuses = ['open', 'assigned', 'buddy_tag', 'inviting', 'completed', 'cancelled', 
                               'krankenstand', 'notfall', 'urlaub', 'zeitausgleich', 'markierte', 
                               'bestätigt', 'geplant']
      if (validDbStatuses.includes(status)) {
        updates.status = status
      } else {
        // Otherwise map from UI status to DB status
        const map: Record<string, string> = {
          'Offen': 'open',
          'Verplant': 'assigned',
          'Buddy Tag': 'buddy_tag',
          'Krankenstand': 'krankenstand',
          'Notfall': 'notfall',
          'Urlaub': 'urlaub',
          'Zeitausgleich': 'zeitausgleich',
          'Markierte': 'markierte',
          'bestätigt': 'bestätigt',
          'geplant': 'geplant'
        }
        const dbStatus = map[status]
        if (dbStatus) updates.status = dbStatus
      }
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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const svc = createSupabaseServiceClient()

    const { error } = await svc
      .from('assignments')
      .delete()
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


