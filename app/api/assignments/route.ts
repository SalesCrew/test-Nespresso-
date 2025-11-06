import { NextResponse } from 'next/server'
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
    // Go back to using the view but ensure it includes notes by refreshing it
    let q = svc.from('assignments_with_buddy_info').select('*').order('start_ts', { ascending: true })
    
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

    // Ensure matched_market_id is present even if the view is out of date.
    const rows = data ?? []
    if (rows.length === 0) return NextResponse.json({ assignments: [] })

    const rowIds = rows.map((r: any) => r.id).filter(Boolean)
    const { data: mmRows } = await svc
      .from('assignments')
      .select('id, matched_market_id')
      .in('id', rowIds)
    const mmMap = new Map((mmRows || []).map((r: any) => [r.id, r.matched_market_id]))

    // Load tracking rows for the lead participant so historical data can be displayed
    const leadMap = new Map(rows.map((r: any) => [r.id, r.lead_user_id]))
    const trackingMap = new Map<string, any>()
    if (rowIds.length > 0) {
      const { data: trackingRows, error: trackingError } = await svc
        .from('assignment_tracking')
        .select('assignment_id, user_id, buddy_user_id, actual_start_time, actual_end_time, status, notes, early_start_reason, minutes_early_start, early_end_reason, minutes_early_end, foto_maschine_url, foto_kapsellade_url, foto_pos_gesamt_url, foto_extra_url')
        .in('assignment_id', rowIds)

      if (!trackingError && Array.isArray(trackingRows)) {
        trackingRows.forEach((tr: any) => {
          const leadId = leadMap.get(tr.assignment_id)
          if (leadId && tr.user_id === leadId) {
            trackingMap.set(tr.assignment_id, tr)
          }
        })
      }
    }

    const enriched = rows.map((r: any) => {
      const tracking = trackingMap.get(r.id)
      return {
        ...r,
        matched_market_id: r.matched_market_id !== undefined ? r.matched_market_id : (mmMap.get(r.id) ?? null),
        tracking_actual_start_time: tracking?.actual_start_time ?? null,
        tracking_actual_end_time: tracking?.actual_end_time ?? null,
        tracking_status: tracking?.status ?? null,
        tracking_notes: tracking?.notes ?? null,
        tracking_early_start_reason: tracking?.early_start_reason ?? null,
        tracking_minutes_early_start: tracking?.minutes_early_start ?? null,
        tracking_early_end_reason: tracking?.early_end_reason ?? null,
        tracking_minutes_early_end: tracking?.minutes_early_end ?? null,
        tracking_foto_maschine_url: tracking?.foto_maschine_url ?? null,
        tracking_foto_kapsellade_url: tracking?.foto_kapsellade_url ?? null,
        tracking_foto_pos_gesamt_url: tracking?.foto_pos_gesamt_url ?? null,
        tracking_foto_extra_url: tracking?.foto_extra_url ?? null,
      }
    })

    return NextResponse.json({ assignments: enriched })
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


