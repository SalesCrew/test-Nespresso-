import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { computeBestMarket } from '@/lib/matchers/marketMatcher'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const svc = createSupabaseServiceClient()

    // Load assignment
    const { data: assignment, error: aErr } = await svc
      .from('assignments')
      .select('id, location_text, postal_code, city')
      .eq('id', params.id)
      .single()
    if (aErr || !assignment) return NextResponse.json({ error: aErr?.message || 'Assignment not found' }, { status: 404 })

    // Load markets
    const { data: markets, error: mErr } = await svc
      .from('markets')
      .select('id, name, address, plz, city')
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

    const { market, score } = computeBestMarket(
      {
        id: assignment.id,
        location_text: assignment.location_text,
        postal_code: assignment.postal_code,
        city: assignment.city,
      },
      (markets || []).map(m => ({
        id: m.id,
        name: (m as any).name,
        address: (m as any).address,
        plz: (m as any).plz,
        city: (m as any).city,
      }))
    )

    // Threshold for auto-match
    const threshold = 70
    if (!market || score < threshold) {
      return NextResponse.json({ matched_market_id: null, confidence: score, market: null })
    }

    // Persist immediately
    const { data: updated, error: uErr } = await svc
      .from('assignments')
      .update({ matched_market_id: market.id })
      .eq('id', params.id)
      .select('id, matched_market_id')
      .single()
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 })

    return NextResponse.json({ matched_market_id: updated.matched_market_id, confidence: score, market })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


