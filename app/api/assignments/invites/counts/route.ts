import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

// GET invite counts (invited/accepted/rejected) grouped by assignment_id
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const idsParam = url.searchParams.get('ids') || ''
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean)

    if (ids.length === 0) {
      return NextResponse.json({ counts: {} })
    }

    const svc = createSupabaseServiceClient()

    // Group by assignment and status
    const { data, error } = await svc
      .from('assignment_invitations')
      .select('assignment_id,status,count:count()')
      .in('assignment_id', ids)
      .in('status', ['invited', 'accepted', 'rejected'])
      .group('assignment_id,status')

    if (error) {
      console.error('Failed to fetch invite counts:', error)
      return NextResponse.json({ counts: {} })
    }

    const result: Record<string, { invited: number; accepted: number; rejected: number }> = {}
    for (const row of data || []) {
      const assignmentId = (row as any).assignment_id as string
      const status = (row as any).status as string
      const count = Number((row as any).count || 0)
      if (!result[assignmentId]) {
        result[assignmentId] = { invited: 0, accepted: 0, rejected: 0 }
      }
      if (status === 'invited') result[assignmentId].invited += count
      if (status === 'accepted') result[assignmentId].accepted += count
      if (status === 'rejected') result[assignmentId].rejected += count
    }

    return NextResponse.json({ counts: result })
  } catch (e: any) {
    console.error('Server error in invite counts:', e)
    return NextResponse.json({ counts: {} })
  }
}


