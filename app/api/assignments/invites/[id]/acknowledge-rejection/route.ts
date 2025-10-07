import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const svc = createSupabaseServiceClient()
    
    // Update the invitation to set acknowledged_at so it stops appearing as unhandled
    const { error } = await svc
      .from('assignment_invitations')
      .update({ acknowledged_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('status', 'rejected')
    
    if (error) {
      console.error('Error acknowledging rejection:', error);
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Server error acknowledging rejection:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
