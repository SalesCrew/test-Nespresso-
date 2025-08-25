import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const svc = createSupabaseServiceClient()
    const server = createSupabaseServerClient()
    
    // Get current user for history
    const { data: { user } } = await server.auth.getUser()
    
    const body = await req.json().catch(() => ({} as any))
    const assignment_ids: string[] = Array.isArray(body.assignment_ids) ? body.assignment_ids : []
    const promotor_ids: string[] = Array.isArray(body.promotor_ids) ? body.promotor_ids : []
    const buddy: boolean = Boolean(body.buddy)
    const replacement_for: string | null = body.replacement_for || null
    const is_buddy_tag: boolean = Boolean(body.is_buddy_tag)

    if (assignment_ids.length === 0 || promotor_ids.length === 0) {
      return NextResponse.json({ error: 'assignment_ids and promotor_ids are required' }, { status: 400 })
    }

    const role = buddy ? 'buddy' : 'lead'
    const rows = assignment_ids.flatMap((assignment_id: string) => (
      promotor_ids.map((user_id: string) => ({ 
        assignment_id, 
        user_id, 
        role, 
        status: 'invited',
        is_buddy_tag: is_buddy_tag,
        ...(replacement_for ? { replacement_for } : {})
      }))
    ))

    // For replacements, we need to handle existing invitations differently
    // Since replacements are for NEW assignments, not the same ones that were rejected
    let result;
    
    if (replacement_for) {
      // For replacements, always use upsert since we're inviting to NEW assignments
      // The constraint is on assignment_id/user_id/role, so new assignments won't conflict
      result = await svc
        .from('assignment_invitations')
        .upsert(rows as any, { onConflict: 'assignment_id,user_id,role' })
    } else {
      // For regular invitations, use upsert as before
      result = await svc
        .from('assignment_invitations')
        .upsert(rows as any, { onConflict: 'assignment_id,user_id,role' })
    }
    
    if (result.error) {
      console.error('Bulk invite error:', result.error);
      console.error('Attempted to insert rows:', rows);
      console.error('Is replacement:', !!replacement_for);
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    // Save to invitation history
    const { error: historyError } = await svc
      .from('invitation_history')
      .insert({
        created_by: user?.id,
        promotion_count: assignment_ids.length,
        promotor_count: promotor_ids.length,
        buddy: buddy,
        assignment_ids: assignment_ids,
        promotor_ids: promotor_ids,
        metadata: {} // Can be expanded later
      })
    
    if (historyError) {
      console.error('Failed to save invitation history:', historyError)
    }

    return NextResponse.json({ ok: true, count: rows.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


