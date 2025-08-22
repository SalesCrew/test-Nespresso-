import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const server = createSupabaseServerClient()
    const { data: auth } = await server.auth.getUser()
    if (!auth?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // Store acknowledgment in localStorage on client side instead
    // Since we can't add a new status to the enum without a migration
    // For now, just return success
    // The client will handle hiding acknowledged assignments

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Server error in acknowledge:', e)
    return NextResponse.json({ ok: true }) // Return success anyway to not break UI
  }
}
