import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const assignmentId = body?.assignmentId
    const maxRecommendations = body?.maxRecommendations || 6

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
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

    // Get all promotors with their profiles and phone numbers from both tables
    const { data: users, error: usersError } = await svc
      .from('user_profiles')
      .select('user_id, display_name, phone, role')
      .eq('role', 'promotor')

    if (usersError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get promotor profiles with phone numbers
    const userIds = (users || []).map((u: any) => u.user_id)
    const { data: profiles, error: profilesError } = await svc
      .from('promotor_profiles')
      .select('user_id, phone')
      .in('user_id', userIds)

    const profileByUser = new Map((profiles || []).map((p: any) => [p.user_id, p]))
    
    const promotors = (users || []).map((u: any) => {
      const profile = profileByUser.get(u.user_id) as any
      return {
        ...u,
        phone: profile?.phone || u.phone || '+43 123 456 789' // Fallback for demo
      }
    })


    // Prepare data for AI analysis
    const assignmentData = {
      id: assignment.id,
      title: assignment.title,
      location: assignment.location,
      date: assignment.date,
      time: assignment.time,
      description: assignment.description,
      postal_code: assignment.postal_code
    }

    const promotorData = (promotors || []).map((p: any) => ({
      id: p.user_id,
      name: p.display_name,
      phone: p.phone
    }))

    // Call GPT-5 nano for recommendations
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-5-nano",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that recommends the best promotors for marketing assignments. Analyze the assignment details and promotor list to provide ranked recommendations.

Return ONLY a valid JSON array of objects with this exact structure:
[
  {
    "keyword": "promotor_[first8charsOfId]",
    "promotorName": "string",
    "promotorId": "string", 
    "phone": "string",
    "confidence": number between 0.0 and 1.0,
    "rank": number starting from 1,
    "reasoning": "brief explanation"
  }
]

Rules:
- Return maximum ${maxRecommendations} recommendations
- Rank from best (1) to worst
- Confidence should reflect match quality (0.0-1.0)
- Include ALL promotors from the list in your analysis
- Return valid JSON only, no additional text`
          },
          {
            role: "user", 
            content: `Assignment: ${JSON.stringify(assignmentData)}
            
Available Promotors: ${JSON.stringify(promotorData)}

Please analyze and recommend the best promotors for this assignment.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      })

      const aiResponse = completion.choices[0]?.message?.content
      if (!aiResponse) {
        throw new Error('No response from AI')
      }

      // Parse AI response
      let recommendations: any[]
      try {
        const parsed = JSON.parse(aiResponse)
        recommendations = Array.isArray(parsed) ? parsed : parsed.recommendations || []
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        throw new Error('Invalid AI response format')
      }

      // Validate and sanitize recommendations
      const validRecommendations = recommendations
        .slice(0, maxRecommendations)
        .map((rec: any, index: number) => ({
          keyword: rec.keyword || `promotor_${rec.promotorId?.slice(0, 8) || index}`,
          promotorName: rec.promotorName || 'Unknown',
          promotorId: rec.promotorId || '',
          phone: rec.phone || '',
          confidence: Math.max(0.0, Math.min(1.0, Number(rec.confidence) || 0.5)),
          rank: rec.rank || (index + 1),
          reasoning: rec.reasoning || 'AI recommendation'
        }))

      return NextResponse.json({ 
        success: true,
        assignmentId,
        recommendations: validRecommendations,
        timestamp: new Date().toISOString(),
        source: 'gpt-5-nano'
      })

    } catch (aiError: any) {
      console.error('AI API Error:', aiError)
      
      // Fallback to mock data if AI fails
      const fallbackRecommendations = (promotors || [])
        .slice(0, maxRecommendations)
        .map((promotor: any, index: number) => ({
          keyword: `promotor_${promotor.user_id.slice(0, 8)}`,
          promotorName: promotor.display_name,
          promotorId: promotor.user_id,
          phone: promotor.phone,
          confidence: Math.max(0.6, 1 - (index * 0.1)),
          rank: index + 1,
          reasoning: `Fallback recommendation (AI unavailable: ${aiError.message})`
        }))

      return NextResponse.json({ 
        success: true,
        assignmentId,
        recommendations: fallbackRecommendations,
        timestamp: new Date().toISOString(),
        source: 'fallback',
        error: `AI error: ${aiError.message}`
      })
    }

  } catch (e: any) {
    console.error('AI recommendation error:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
