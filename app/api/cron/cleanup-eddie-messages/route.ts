import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

// This endpoint is called by Vercel Cron every minute
// to delete Eddie chat messages older than 15 minutes
export async function GET(req: Request) {
  try {
    // Verify this is being called by Vercel Cron
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🧹 Starting Eddie chat message cleanup...')
    
    const svc = createSupabaseServiceClient()
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    
    const { data, error } = await svc
      .from('eddie_chat_messages')
      .delete()
      .lt('created_at', fifteenMinutesAgo)
      .select()
    
    if (error) {
      console.error('❌ Cleanup error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log(`✅ Deleted ${data?.length || 0} old Eddie chat messages`)
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: data?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (e: any) {
    console.error('❌ Critical cleanup error:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

