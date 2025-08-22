import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function GET(req: Request) {
  try {
    const svc = createSupabaseServiceClient()
    
    // Fetch invitation history
    const { data: history, error } = await svc
      .from('invitation_history')
      .select(`
        id,
        created_at,
        promotion_count,
        promotor_count,
        buddy,
        assignment_ids,
        promotor_ids,
        created_by
      `)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) {
      console.error('Failed to fetch invitation history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Fetch related data for the UI
    const formatted = await Promise.all((history || []).map(async (item) => {
      // Fetch promotions
      const { data: promotions } = await svc
        .from('assignments')
        .select('id, location_text, postal_code, city, start_ts, end_ts')
        .in('id', item.assignment_ids || [])
      
      // Fetch promotor names
      const { data: promotors } = await svc
        .from('user_profiles')
        .select('user_id, display_name')
        .in('user_id', item.promotor_ids || [])
      
      return {
        id: item.id,
        date: new Date(item.created_at).toLocaleDateString('de-DE'),
        time: new Date(item.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        promotionCount: item.promotion_count,
        promotorCount: item.promotor_count,
        buddy: item.buddy,
        assignmentIds: item.assignment_ids,
        promotorIds: item.promotor_ids,
        promotions: promotions || [],
        promotors: (promotors || []).map(p => p.display_name || 'Unknown')
      }
    }))
    
    return NextResponse.json({ history: formatted })
  } catch (e: any) {
    console.error('Server error in invitation history:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
