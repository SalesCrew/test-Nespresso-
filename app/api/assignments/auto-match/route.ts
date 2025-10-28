import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { computeBestMarket, normalizeForMatch } from '@/lib/matchers/marketMatcher'

type Body = {
  ids?: string[]
  from?: string
  to?: string
  region?: string
  unmatchedOnly?: boolean
  threshold?: number
}

export async function POST(req: Request) {
  try {
    const server = createSupabaseServerClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await server
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    if (!profile || !['admin_staff', 'admin_of_admins'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await req.json().catch(() => ({}))) as Body
    const ids = Array.isArray(body.ids) && body.ids.length ? body.ids : undefined
    const from = body.from
    const to = body.to
    const region = body.region
    const unmatchedOnly = body.unmatchedOnly !== false
    const threshold = typeof body.threshold === 'number' ? body.threshold : 70

    const svc = createSupabaseServiceClient()

    // Load all markets once
    const { data: markets, error: mErr } = await svc
      .from('markets')
      .select('id, name, address, plz, city')
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

    const normalizedCityToMarkets = new Map<string, any[]>()
    const plzToMarkets = new Map<string, any[]>()
    for (const mk of markets || []) {
      const cityKey = normalizeForMatch(String((mk as any).city || ''))
      if (cityKey) {
        const arr = normalizedCityToMarkets.get(cityKey) || []
        arr.push(mk)
        normalizedCityToMarkets.set(cityKey, arr)
      }
      const plz = String((mk as any).plz || '').trim()
      if (plz) {
        const arr = plzToMarkets.get(plz) || []
        arr.push(mk)
        plzToMarkets.set(plz, arr)
      }
    }

    // Helper to fetch assignments in pages
    const pageSize = 1000
    const assignments: any[] = []
    let offset = 0
    while (true) {
      let q = svc
        .from('assignments')
        .select('id, location_text, postal_code, city, matched_market_id, start_ts, region')
        .order('start_ts', { ascending: true })
        .range(offset, offset + pageSize - 1)

      if (ids) q = q.in('id', ids)
      else {
        if (from) q = q.gte('start_ts', from)
        if (to) q = q.lte('end_ts', to)
        if (region) q = q.eq('region', region)
      }
      if (unmatchedOnly) q = q.is('matched_market_id', null)

      const { data, error } = await q
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!data || data.length === 0) break
      assignments.push(...data)
      if (data.length < pageSize) break
      offset += pageSize
    }

    // Compute matches
    const updates: { id: string; matched_market_id: string }[] = []
    for (const a of assignments) {
      const cityKey = normalizeForMatch(String(a.city || a.location_text || ''))
      const byPlz = plzToMarkets.get(String(a.postal_code || '').trim()) || []
      if (byPlz.length === 1) {
        updates.push({ id: a.id, matched_market_id: byPlz[0].id })
        continue
      }
      const byCity = normalizedCityToMarkets.get(cityKey) || []
      const candidates = (byPlz.length ? byPlz : (byCity.length ? byCity : (markets || []))) as any[]
      const { market, score } = computeBestMarket(
        {
          id: a.id,
          location_text: a.location_text,
          postal_code: a.postal_code,
          city: a.city,
        },
        candidates.map(m => ({ id: m.id, name: m.name, address: m.address, plz: m.plz, city: m.city }))
      )
      if (market && score >= threshold) {
        updates.push({ id: a.id, matched_market_id: market.id })
      }
    }

    // Persist in chunks using upsert
    const chunkSize = 500
    let saved = 0
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize)
      const { error: upErr } = await svc
        .from('assignments')
        .upsert(chunk, { onConflict: 'id' })
      if (upErr) return NextResponse.json({ error: upErr.message, saved }, { status: 500 })
      saved += chunk.length
    }

    return NextResponse.json({ processed: assignments.length, matched: updates.length, saved, threshold })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


