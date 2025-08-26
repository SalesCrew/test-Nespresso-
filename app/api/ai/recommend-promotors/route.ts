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

    // Get all promotors with comprehensive data
    const { data: users, error: usersError } = await svc
      .from('user_profiles')
      .select('user_id, display_name, phone, role')
      .eq('role', 'promotor')

    if (usersError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const userIds = (users || []).map((u: any) => u.user_id)
    
    // Get promotor profiles with detailed info
    const { data: profiles } = await svc
      .from('promotor_profiles')
      .select('user_id, phone, region, postal_code, city, working_days')
      .in('user_id', userIds)

    // Get active contracts for weekly hours
    const { data: contracts } = await svc
      .from('contracts')
      .select('user_id, hours_per_week, is_active')
      .in('user_id', userIds)
      .eq('is_active', true)

    // Calculate current calendar week from assignment date
    const assignmentDate = new Date(assignment.start_ts || assignment.date)
    const currentKW = getCalendarWeek(assignmentDate)
    
    // Get date range for context (4 weeks before/after)
    const contextStartDate = new Date(assignmentDate)
    contextStartDate.setDate(contextStartDate.getDate() - 28)
    const contextEndDate = new Date(assignmentDate) 
    contextEndDate.setDate(contextEndDate.getDate() + 28)

    // Get assignment history for context (4 weeks before/after current assignment)
    const { data: assignmentHistory } = await svc
      .from('assignments')
      .select('id, title, location_text, postal_code, region, start_ts, end_ts, status, notes')
      .gte('start_ts', contextStartDate.toISOString())
      .lte('start_ts', contextEndDate.toISOString())
      .order('start_ts', { ascending: true })

    // Get current week assignments for workload calculation
    const weekStart = getWeekStart(assignmentDate)
    const weekEnd = getWeekEnd(assignmentDate)
    
    const { data: currentWeekAssignments } = await svc
      .from('assignment_participants')
      .select(`
        user_id,
        assignments!inner(id, start_ts, end_ts, status)
      `)
      .in('user_id', userIds)
      .gte('assignments.start_ts', weekStart.toISOString())
      .lte('assignments.start_ts', weekEnd.toISOString())

    // Create maps for quick lookup
    const profileByUser = new Map((profiles || []).map((p: any) => [p.user_id, p]))
    const contractByUser = new Map((contracts || []).map((c: any) => [c.user_id, c]))
    
    // Group current week assignments by user
    const weekAssignmentsByUser = new Map()
    ;(currentWeekAssignments || []).forEach((item: any) => {
      const userId = item.user_id
      if (!weekAssignmentsByUser.has(userId)) {
        weekAssignmentsByUser.set(userId, [])
      }
      weekAssignmentsByUser.get(userId).push(item.assignments)
    })
    
    const promotors = (users || []).map((u: any) => {
      const profile = profileByUser.get(u.user_id) as any
      const contract = contractByUser.get(u.user_id) as any
      const weekAssignments = weekAssignmentsByUser.get(u.user_id) || []
      
      // Calculate worked hours this week
      const workedHours = calculateWorkedHours(weekAssignments)
      const contractHours = contract?.hours_per_week || 0
      const remainingHours = Math.max(0, contractHours - workedHours)
      
      return {
        ...u,
        phone: profile?.phone || u.phone || '+43 123 456 789',
        region: profile?.region || 'wien-noe-bgl',
        postal_code: profile?.postal_code || '',
        city: profile?.city || '',
        working_days: profile?.working_days || [],
        contract_hours_per_week: contractHours,
        worked_hours_this_week: workedHours,
        remaining_hours_this_week: remainingHours,
        current_week_assignments: weekAssignments.length
      }
    })

    // Helper functions
    function getCalendarWeek(date: Date): number {
      const target = new Date(date.valueOf())
      const dayNr = (date.getDay() + 6) % 7
      target.setDate(target.getDate() - dayNr + 3)
      const firstThursday = target.valueOf()
      target.setMonth(0, 1)
      if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
      }
      return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
    }

    function getWeekStart(date: Date): Date {
      const start = new Date(date)
      const day = start.getDay()
      const diff = start.getDate() - day + (day === 0 ? -6 : 1)
      start.setDate(diff)
      start.setHours(0, 0, 0, 0)
      return start
    }

    function getWeekEnd(date: Date): Date {
      const end = new Date(date)
      const day = end.getDay()
      const diff = end.getDate() - day + (day === 0 ? 0 : 7)
      end.setDate(diff)
      end.setHours(23, 59, 59, 999)
      return end
    }

    function calculateWorkedHours(assignments: any[]): number {
      return assignments.reduce((total, assignment) => {
        if (assignment.status === 'cancelled') return total
        
        const start = new Date(assignment.start_ts)
        const end = new Date(assignment.end_ts)
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        
        // Subtract 1 hour break for assignments longer than 6 hours
        const workingHours = hours > 6 ? hours - 1 : hours
        return total + workingHours
      }, 0)
    }


    // Prepare comprehensive data for AI analysis
    const assignmentData = {
      id: assignment.id,
      title: assignment.title,
      location_text: assignment.location_text,
      postal_code: assignment.postal_code,
      region: assignment.region,
      start_ts: assignment.start_ts,
      end_ts: assignment.end_ts,
      date: assignmentDate.toLocaleDateString('de-DE'),
      time: `${assignmentDate.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})} - ${new Date(assignment.end_ts).toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})}`,
      duration_hours: (new Date(assignment.end_ts).getTime() - assignmentDate.getTime()) / (1000 * 60 * 60),
      calendar_week: currentKW,
      notes: assignment.notes,
      status: assignment.status
    }

    const promotorData = (promotors || []).map((p: any) => ({
      id: p.user_id,
      name: p.display_name,
      phone: p.phone,
      region: p.region,
      postal_code: p.postal_code,
      city: p.city,
      working_days: p.working_days,
      contract_hours_per_week: p.contract_hours_per_week,
      worked_hours_this_week: p.worked_hours_this_week,
      remaining_hours_this_week: p.remaining_hours_this_week,
      current_week_assignments: p.current_week_assignments
    }))

    // Check for assignment restrictions in notes
    const assignmentRestrictions = extractRestrictions(assignment.notes || '')
    
    // Prepare assignment history context (4 weeks before/after)
    const assignmentContext = (assignmentHistory || []).map((hist: any) => ({
      id: hist.id,
      location_text: hist.location_text,
      postal_code: hist.postal_code,
      region: hist.region,
      date: new Date(hist.start_ts).toLocaleDateString('de-DE'),
      status: hist.status,
      calendar_week: getCalendarWeek(new Date(hist.start_ts)),
      notes: hist.notes
    }))

    function extractRestrictions(notes: string): string[] {
      if (!notes) return []
      const restrictions: string[] = []
      
      // Look for "nicht [name]" patterns in notes
      const matches = notes.match(/nicht\s+([A-Za-zÄÖÜäöüß\s]+)/gi)
      if (matches) {
        matches.forEach(match => {
          const name = match.replace(/nicht\s+/i, '').trim()
          if (name) restrictions.push(name)
        })
      }
      
      return restrictions
    }

    // Call GPT-5 nano for recommendations
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-5-nano",
        messages: [
          {
            role: "system",
            content: `Du bist GPT-5 nano und wirkst in diesem System als deterministischer Einsatz-Matcher für Nespresso-Promotions. Pro Aufruf erhältst du strukturierte Informationen zu genau einem Einsatz sowie eine Liste von Promotor:innen mit aktuellen Daten der Kalenderwoche. 

STRIKTE REGELN:
- Nutze ausschließlich die übergebenen Angaben
- Erfinde NICHTS, nutze keine externen Quellen
- Führe keine Nebenaufgaben aus
- Prüfe harte Eignung: Verfügbarkeit, verbleibende Wochenstunden, Muss-Anforderungen, keine Sperren
- Bewerte geeignete Personen nach: Nähe/Anreise, Skills/Notizen, Zuverlässigkeit/Erfahrung, faire Stundenverteilung
- Löse Gleichstände strikt deterministisch (alphabetische Reihenfolge bei gleicher Bewertung)

AUSGABEFORMAT:
Antworte ausschließlich mit einem JSON-Array mit exakt ${maxRecommendations} Einträgen:
[
  {
    "keyword": "promotor_[erste8ZeichenDerID]",
    "promotorName": "Vollständiger Name",
    "promotorId": "string",
    "phone": "string", 
    "confidence": number zwischen 0.0 und 1.0,
    "rank": number von 1 bis ${maxRecommendations},
    "reasoning": "Kurze Begründung der Eignung"
  }
]

WICHTIG:
- Wenn weniger als ${maxRecommendations} Promotor:innen geeignet sind, fülle mit den besten verfügbaren auf
- Jeder Eintrag muss das exakte Vollnamens-Keyword der ausgewählten Person enthalten
- Keine Erklärungen außerhalb des JSON, kein Zusatztext
- Deterministische Rangfolge basierend auf objektiven Kriterien`
          },
          {
            role: "user", 
            content: `EINSATZ (KW ${currentKW}):
${JSON.stringify(assignmentData, null, 2)}

VERFÜGBARE PROMOTOR:INNEN:
${JSON.stringify(promotorData, null, 2)}

ASSIGNMENT RESTRICTIONS:
${assignmentRestrictions.length > 0 ? JSON.stringify(assignmentRestrictions, null, 2) : 'Keine Einschränkungen'}

ASSIGNMENT CONTEXT (4 Wochen vorher/nachher):
${JSON.stringify(assignmentContext, null, 2)}

WICHTIGE PRÜFKRITERIEN:
1. HARTE EIGNUNG:
   - Region/Bundesland muss übereinstimmen
   - Verfügbarkeit an working_days prüfen
   - Verbleibende Wochenstunden (remaining_hours_this_week) ausreichend
   - Keine Sperren in assignment restrictions
   
2. BEWERTUNGSKRITERIEN:
   - Nähe/Anreise (postal_code Vergleich)
   - Faire Stundenverteilung (weniger Assignments diese Woche bevorzugen)
   - Erfahrung in ähnlichen Märkten (assignment context berücksichtigen)
   
3. DETERMINISTISCHE RANGFOLGE:
   - Bei Gleichstand: alphabetische Reihenfolge nach Name
   
Analysiere und empfehle die besten ${maxRecommendations} Promotor:innen für KW ${currentKW}.`
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
