import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const assignmentId = body?.assignmentId
    const maxRecommendations = body?.maxRecommendations || 6

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId required' }, { status: 400 })
    }

    const svc = createSupabaseServiceClient()
    
    // Get assignment details
    const { data: assignment, error: assignmentError } = await svc
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()
    
    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Get all promotors with their profiles and phone numbers
    const { data: promotors, error: promotorsError } = await svc
      .from('user_profiles')
      .select(`
        user_id,
        display_name,
        phone,
        role
      `)
      .eq('role', 'promotor')
    
    if (promotorsError) {
      return NextResponse.json({ error: 'Failed to fetch promotors' }, { status: 500 })
    }

    // For now, return a mock response until we integrate with OpenAI
    // This will be replaced with actual AI logic
    const mockRecommendations = (promotors || [])
      .slice(0, maxRecommendations)
      .map((promotor: any, index: number) => ({
        keyword: `promotor_${promotor.user_id.slice(0, 8)}`,
        promotorName: promotor.display_name,
        promotorId: promotor.user_id,
        phone: promotor.phone,
        confidence: Math.max(0.6, 1 - (index * 0.1)),
        rank: index + 1,
        reasoning: `Good match based on profile analysis`
      }))

    return NextResponse.json({ 
      success: true,
      assignmentId,
      recommendations: mockRecommendations,
      timestamp: new Date().toISOString()
    })

  } catch (e: any) {
    console.error('AI recommendation error:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
