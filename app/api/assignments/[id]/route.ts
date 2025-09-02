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
    if (body.buddy_user_id !== undefined) updates.buddy_user_id = body.buddy_user_id
    if (body.buddy_name !== undefined) updates.buddy_name = body.buddy_name

    // Handle special_status separately
    if (body.special_status !== undefined) {
      updates.special_status = body.special_status || null
    }

    // Handle status updates - accept both UI and DB status formats
    if (body.status) {
      const status = String(body.status)
      const specialStatuses = ['krankenstand', 'notfall', 'urlaub', 'zeitausgleich', 'markierte', 'bestätigt', 'geplant']
      const specialStatusesUI = ['Krankenstand', 'Notfall', 'Urlaub', 'Zeitausgleich', 'Markierte', 'Bestätigt', 'Geplant']
      
      // Check if this is a special status
      if (specialStatuses.includes(status.toLowerCase()) || specialStatusesUI.includes(status)) {
        // Set special_status instead of main status
        const statusMap: Record<string, string> = {
          'Krankenstand': 'krankenstand',
          'Notfall': 'notfall',
          'Urlaub': 'urlaub',
          'Zeitausgleich': 'zeitausgleich',
          'Markierte': 'markierte',
          'Bestätigt': 'bestätigt',
          'Geplant': 'geplant'
        }
        updates.special_status = statusMap[status] || status.toLowerCase()
        // Don't change main status if it's a special status
      } else {
        // Regular status update
        const validDbStatuses = ['open', 'assigned', 'buddy_tag', 'inviting', 'completed', 'cancelled']
        if (validDbStatuses.includes(status)) {
          updates.status = status
          // Clear special_status when setting regular status
          updates.special_status = null
        } else {
          // Map from UI status to DB status
          const map: Record<string, string> = {
            'Offen': 'open',
            'Verplant': 'assigned',
            'Buddy Tag': 'buddy_tag'
          }
          const dbStatus = map[status]
          if (dbStatus) {
            updates.status = dbStatus
            // Clear special_status when setting regular status
            updates.special_status = null
          }
        }
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


