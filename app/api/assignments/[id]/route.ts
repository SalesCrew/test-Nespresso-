import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({} as any))
    console.log('🟢 [API] PATCH /assignments/[id] received body:', body)
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

    // Handle status updates - SIMPLIFIED AND DIRECT
    if (body.status) {
      const status = String(body.status)
      console.log('🔵 [API] Processing status:', status)
      
      // Special statuses - save to special_status column
      const specialStatusMap: Record<string, string> = {
        'Krankenstand': 'krankenstand',
        'Notfall': 'notfall', 
        'Urlaub': 'urlaub',
        'Zeitausgleich': 'zeitausgleich',
        'Markierte': 'markierte',
        'Bestätigt': 'bestätigt',
        'Geplant': 'geplant'
      }
      
      if (specialStatusMap[status]) {
        // IT'S A SPECIAL STATUS - SET special_status COLUMN
        updates.special_status = specialStatusMap[status]
        console.log('🔴 SETTING SPECIAL_STATUS TO:', updates.special_status)
        // DON'T TOUCH THE MAIN STATUS
      } else {
        // Regular status - set main status and CLEAR special_status
        const regularStatusMap: Record<string, string> = {
          'Offen': 'open',
          'Verplant': 'assigned',
          'Buddy Tag': 'buddy_tag'
        }
        updates.status = regularStatusMap[status] || status
        updates.special_status = null // CLEAR special status
        console.log('🔵 Setting regular status:', updates.status, 'and clearing special_status')
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    console.log('🟢 Updating assignment with:', updates)

    const { data, error } = await svc
      .from('assignments')
      .update(updates)
      .eq('id', params.id)
      .select('*')
      .single()
    if (error) {
      console.error('🔴 Assignment update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('🟢 Assignment updated successfully:', data)
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


