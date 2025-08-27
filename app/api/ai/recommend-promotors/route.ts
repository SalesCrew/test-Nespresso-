import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  console.log('🚀 AI Recommendation Request Started')
  
  try {
    const body = await req.json().catch(() => ({}))
    const assignmentId = body?.assignmentId
    const maxRecommendations = body?.maxRecommendations || 6

    console.log('📋 Request Parameters:', {
      assignmentId,
      maxRecommendations,
      hasApiKey: !!process.env.OPENAI_API_KEY
    })

    if (!assignmentId) {
      console.log('❌ Missing assignmentId')
      return NextResponse.json({ error: 'assignmentId required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ Missing OpenAI API key')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const svc = createSupabaseServiceClient()
    console.log('📊 Database connection established')
    
    // Get assignment details
    console.log('🎯 Fetching assignment details for ID:', assignmentId)
    const { data: assignment, error: assignmentError } = await svc
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()
    
    if (assignmentError || !assignment) {
      console.log('❌ Assignment fetch error:', assignmentError?.message || 'Assignment not found')
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }
    
    console.log('✅ Assignment found:', {
      id: assignment.id,
      title: assignment.title,
      location: assignment.location_text,
      region: assignment.region,
      postal_code: assignment.postal_code,
      start_ts: assignment.start_ts,
      end_ts: assignment.end_ts
    })

    // Get all promotors with comprehensive data
    console.log('👥 Fetching promotor users...')
    const { data: users, error: usersError } = await svc
      .from('user_profiles')
      .select('user_id, display_name, phone, role')
      .eq('role', 'promotor')

    if (usersError) {
      console.log('❌ Users fetch error:', usersError.message)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    console.log(`✅ Found ${users?.length || 0} promotor users`)
    const userIds = (users || []).map((u: any) => u.user_id)
    console.log('🔍 User IDs:', userIds.slice(0, 3), userIds.length > 3 ? `... (${userIds.length} total)` : '')
    
    // Get promotor profiles with detailed info
    console.log('📋 Fetching promotor profiles...')
    const { data: profiles, error: profilesError } = await svc
      .from('promotor_profiles')
      .select('user_id, phone, region, postal_code, city, working_days')
      .in('user_id', userIds)

    if (profilesError) {
      console.log('⚠️ Profiles fetch error:', profilesError.message)
    }
    console.log(`✅ Found ${profiles?.length || 0} promotor profiles`)

    // Get active contracts for weekly hours
    console.log('📄 Fetching active contracts...')
    const { data: contracts, error: contractsError } = await svc
      .from('contracts')
      .select('user_id, hours_per_week, is_active')
      .in('user_id', userIds)
      .eq('is_active', true)

    if (contractsError) {
      console.log('⚠️ Contracts fetch error:', contractsError.message)
    }
    console.log(`✅ Found ${contracts?.length || 0} active contracts`)

    // Calculate current calendar week from assignment date
    const assignmentDate = new Date(assignment.start_ts || assignment.date)
    const currentKW = getCalendarWeek(assignmentDate)
    console.log('📅 Assignment date analysis:', {
      assignmentDate: assignmentDate.toISOString(),
      currentKW,
      formattedDate: assignmentDate.toLocaleDateString('de-DE')
    })
    
    // Get date range for context (4 weeks before/after)
    const contextStartDate = new Date(assignmentDate)
    contextStartDate.setDate(contextStartDate.getDate() - 28)
    const contextEndDate = new Date(assignmentDate) 
    contextEndDate.setDate(contextEndDate.getDate() + 28)

    console.log('🕰️ Context date range:', {
      contextStart: contextStartDate.toLocaleDateString('de-DE'),
      contextEnd: contextEndDate.toLocaleDateString('de-DE')
    })

    // Get assignment history for context (4 weeks before/after current assignment)
    console.log('📚 Fetching assignment history...')
    const { data: assignmentHistory, error: historyError } = await svc
      .from('assignments')
      .select('id, title, location_text, postal_code, region, start_ts, end_ts, status, notes')
      .gte('start_ts', contextStartDate.toISOString())
      .lte('start_ts', contextEndDate.toISOString())
      .order('start_ts', { ascending: true })

    if (historyError) {
      console.log('⚠️ Assignment history fetch error:', historyError.message)
    }
    console.log(`✅ Found ${assignmentHistory?.length || 0} historical assignments`)

    // Get current week assignments for workload calculation
    const weekStart = getWeekStart(assignmentDate)
    const weekEnd = getWeekEnd(assignmentDate)
    console.log('📊 Current week range:', {
      weekStart: weekStart.toLocaleDateString('de-DE'),
      weekEnd: weekEnd.toLocaleDateString('de-DE'),
      weekKW: currentKW
    })
    
    console.log('⏱️ Fetching current week assignments...')
    const { data: currentWeekAssignments, error: weekAssignmentsError } = await svc
      .from('assignment_participants')
      .select(`
        user_id,
        assignments!inner(id, start_ts, end_ts, status)
      `)
      .in('user_id', userIds)
      .gte('assignments.start_ts', weekStart.toISOString())
      .lte('assignments.start_ts', weekEnd.toISOString())

    if (weekAssignmentsError) {
      console.log('⚠️ Week assignments fetch error:', weekAssignmentsError.message)
    }
    console.log(`✅ Found ${currentWeekAssignments?.length || 0} current week assignment participations`)

    // Create maps for quick lookup
    console.log('🗂️ Creating lookup maps...')
    const profileByUser = new Map((profiles || []).map((p: any) => [p.user_id, p]))
    const contractByUser = new Map((contracts || []).map((c: any) => [c.user_id, c]))
    console.log(`📋 Profile map: ${profileByUser.size} entries`)
    console.log(`📄 Contract map: ${contractByUser.size} entries`)
    
    // Group current week assignments by user
    console.log('📊 Grouping week assignments by user...')
    const weekAssignmentsByUser = new Map()
    ;(currentWeekAssignments || []).forEach((item: any) => {
      const userId = item.user_id
      if (!weekAssignmentsByUser.has(userId)) {
        weekAssignmentsByUser.set(userId, [])
      }
      weekAssignmentsByUser.get(userId).push(item.assignments)
    })
    console.log(`⏱️ Week assignments grouped for ${weekAssignmentsByUser.size} users`)
    
    console.log('👥 Building comprehensive promotor data...')
    const promotors = (users || []).map((u: any, index: number) => {
      const profile = profileByUser.get(u.user_id) as any
      const contract = contractByUser.get(u.user_id) as any
      const weekAssignments = weekAssignmentsByUser.get(u.user_id) || []
      
      // Calculate worked hours this week
      const workedHours = calculateWorkedHours(weekAssignments)
      const contractHours = contract?.hours_per_week || 0
      const remainingHours = Math.max(0, contractHours - workedHours)
      
      const promotorData = {
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
      
      if (index < 3) {
        console.log(`👤 Promotor ${index + 1}: ${promotorData.display_name}`, {
          region: promotorData.region,
          contractHours: promotorData.contract_hours_per_week,
          workedHours: promotorData.worked_hours_this_week,
          remainingHours: promotorData.remaining_hours_this_week,
          weekAssignments: promotorData.current_week_assignments
        })
      }
      
      return promotorData
    })
    
    console.log(`✅ Built data for ${promotors.length} promotors`)

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
    console.log('🚫 Checking assignment restrictions...')
    const assignmentRestrictions = extractRestrictions(assignment.notes || '')
    console.log('🚫 Assignment restrictions:', assignmentRestrictions.length > 0 ? assignmentRestrictions : 'None found')
    
    // Prepare assignment history context (4 weeks before/after)
    console.log('📚 Preparing assignment context...')
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
    console.log(`📚 Assignment context: ${assignmentContext.length} assignments over 8 weeks`)

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
    console.log('🤖 Calling GPT-5 nano for AI analysis...')
    console.log('📤 AI request parameters:', {
      model: 'gpt-5-nano',
      temperature: '1 (default, only supported value)',
      max_completion_tokens: 2000,
      promotorCount: promotorData.length,
      assignmentKW: currentKW,
      hasRestrictions: assignmentRestrictions.length > 0,
      contextAssignments: assignmentContext.length
    })
    
    try {
      // GPT-5 uses the new Responses API, not Chat Completions
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-5-nano",
          input: `Du bist GPT-5 nano und wirkst in diesem System als deterministischer Einsatz-Matcher für Nespresso-Promotions. Pro Aufruf erhältst du strukturierte Informationen zu genau einem Einsatz sowie eine Liste von Promotor:innen mit aktuellen Daten der Kalenderwoche. 

STRIKTE REGELN:
- Nutze ausschließlich die übergebenen Angaben
- Erfinde NICHTS, nutze keine externen Quellen
- Führe keine Nebenaufgaben aus
- HARTE REGEL (Cluster/Bundesland): Das Cluster/Bundesland der/des Promotor:in MUSS 1:1 mit dem Cluster/Bundesland des Einsatzes übereinstimmen. Keine Cross-Cluster-Vorschläge. Beispiel: "Wien/NÖ/BGL" ↔ nur Einsätze in "Wien/NÖ/BGL".
- EINDEUTIGKEIT: Jede/r Promotor:in darf nur EINMAL in den Empfehlungen erscheinen - keine Duplikate!
- Prüfe harte Eignung: Verfügbarkeit, verbleibende Wochenstunden, Muss-Anforderungen, keine Sperren
- Bewerte geeignete Personen nach: Nähe/Anreise, Skills/Notizen, Zuverlässigkeit/Erfahrung, faire Stundenverteilung
- Löse Gleichstände strikt deterministisch (alphabetische Reihenfolge bei gleicher Bewertung)

AUSGABEFORMAT:
Antworte ausschließlich mit einem JSON-Array mit maximal ${maxRecommendations} Einträgen. Falls weniger als ${maxRecommendations} geeignete Promotor:innen gefunden werden, ist es völlig in Ordnung, weniger Empfehlungen zurückzugeben:
[
  {
    "keyword": "promotor_[erste8ZeichenDerID]",
    "promotorName": "Vollständiger Name",
    "promotorId": "string",
    "phone": "string", 
    "confidence": number zwischen 0.0 und 1.0,
    "rank": number von 1 bis zur Anzahl der tatsächlichen Empfehlungen,
    "reasoning": "Kurze Begründung der Eignung"
  }
]

EINSATZ (KW ${currentKW}):
${JSON.stringify(assignmentData, null, 2)}

VERFÜGBARE PROMOTOR:INNEN:
${JSON.stringify(promotorData, null, 2)}

ASSIGNMENT RESTRICTIONS:
${assignmentRestrictions.length > 0 ? JSON.stringify(assignmentRestrictions, null, 2) : 'Keine Einschränkungen'}

ASSIGNMENT CONTEXT (4 Wochen vorher/nachher):
${JSON.stringify(assignmentContext, null, 2)}

WICHTIGE PRÜFKRITERIEN:
1. HARTE EIGNUNG:
   - EXAKTE CLUSTER-/BUNDESLAND-ÜBEREINSTIMMUNG (AUSSCHLUSSKRITERIUM): Wenn das Cluster des/der Promotor:in nicht exakt dem Einsatz-Cluster entspricht → Kandidat strikt ausschließen. Beispiel: "Wien/NÖ/BGL" darf NUR Einsätze in "Wien/NÖ/BGL".
   - Verfügbarkeit an working_days prüfen
   - Verbleibende Wochenstunden (remaining_hours_this_week) ausreichend
   - Keine Sperren in assignment restrictions
   
2. BEWERTUNGSKRITERIEN:
   - Nähe/Anreise (postal_code Vergleich)
   - Faire Stundenverteilung (weniger Assignments diese Woche bevorzugen)
   - Erfahrung in ähnlichen Märkten (assignment context berücksichtigen)
   
3. DETERMINISTISCHE RANGFOLGE:
   - Bei Gleichstand: alphabetische Reihenfolge nach Name
   
Analysiere und empfehle die besten Promotor:innen für KW ${currentKW}. Maximum: ${maxRecommendations} Empfehlungen. Falls weniger geeignete Kandidaten verfügbar sind, gib entsprechend weniger zurück.`,
          reasoning: {
            effort: "minimal" // For fast response times with GPT-5-nano
          },
          text: {
            verbosity: "low" // Keep responses concise
          },
          // response_format is not mentioned in GPT-5 docs, might not be supported
        })
      })

      console.log('🌐 GPT-5 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ GPT-5 API error:', errorText)
        throw new Error(`GPT-5 API error: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log('📥 GPT-5 Response structure:', {
        hasOutputText: typeof result.output_text === 'string',
        outputType: Array.isArray(result.output) ? 'array' : typeof result.output,
        responseId: result.response_id,
        reasoningTokens: result.reasoning_tokens,
        outputTokens: result.output_tokens
      })

      // Helper to robustly extract text from GPT-5 Responses API
      const extractTextFromResponse = (res: any): string => {
        if (typeof res?.output_text === 'string') return res.output_text
        let text = ''
        const out = res?.output
        if (Array.isArray(out)) {
          for (const item of out) {
            // item.content can be string or array of segments
            const content = (item && item.content) || []
            if (typeof content === 'string') {
              text += content + '\n'
            } else if (Array.isArray(content)) {
              for (const seg of content) {
                if (typeof seg?.text === 'string') text += seg.text + '\n'
                else if (typeof seg === 'string') text += seg + '\n'
              }
            }
          }
        }
        if (!text && typeof res === 'string') return res
        return text.trim()
      }

      const aiResponseRaw: any = result
      const aiResponseText: string = extractTextFromResponse(aiResponseRaw)

      console.log('📥 Raw AI response received:', {
        hasResponse: !!aiResponseText,
        responseLength: aiResponseText.length,
        usedOutputText: typeof result.output_text === 'string',
        usedOutputArray: Array.isArray(result.output),
        reasoningTokens: result.reasoning_tokens || 0,
        outputTokens: result.output_tokens || 0
      })
      
      if (!aiResponseText) {
        console.log('❌ No response content from GPT-5')
        throw new Error('No response from GPT-5')
      }

      const preview = (typeof aiResponseText === 'string' ? aiResponseText : JSON.stringify(aiResponseText)).slice(0, 200)
      console.log('🔍 AI Response Preview:', preview + '...')

      // Parse AI response
      let recommendations: any[]
      try {
        console.log('🔄 Parsing AI JSON response...')
        const parsed = JSON.parse(aiResponseText)
        recommendations = Array.isArray(parsed) ? parsed : parsed.recommendations || []
        console.log(`✅ Successfully parsed ${recommendations.length} recommendations`)
      } catch (parseError) {
        console.error('❌ Failed to parse AI response:', parseError)
        console.error('📄 Raw response that failed to parse:', aiResponseText)
        throw new Error('Invalid AI response format')
      }

      // Validate and sanitize recommendations
      console.log('🔍 Validating and sanitizing recommendations...')
      const validRecommendations = recommendations
        .slice(0, maxRecommendations)
        .map((rec: any, index: number) => {
          const validated = {
            keyword: rec.keyword || `promotor_${rec.promotorId?.slice(0, 8) || index}`,
            promotorName: rec.promotorName || 'Unknown',
            promotorId: rec.promotorId || '',
            phone: rec.phone || '',
            confidence: Math.max(0.0, Math.min(1.0, Number(rec.confidence) || 0.5)),
            rank: rec.rank || (index + 1),
            reasoning: rec.reasoning || 'AI recommendation'
          }
          
          if (index < 3) {
            console.log(`🏆 Recommendation ${index + 1}:`, {
              rank: validated.rank,
              name: validated.promotorName,
              confidence: validated.confidence,
              reasoning: validated.reasoning.substring(0, 50) + '...'
            })
          }
          
          return validated
        })

      console.log(`✅ Final recommendations count: ${validRecommendations.length}`)
      console.log('🎯 AI recommendation process completed successfully')

      return NextResponse.json({ 
        success: true,
        assignmentId,
        recommendations: validRecommendations,
        timestamp: new Date().toISOString(),
        source: 'gpt-5-nano',
        debug: {
          totalPromotors: promotors.length,
          calendarWeek: currentKW,
          restrictionsFound: assignmentRestrictions.length,
          contextAssignments: assignmentContext.length,
          reasoningTokens: result.reasoning_tokens || 0,
          outputTokens: result.output_tokens || 0,
          responseId: result.response_id
        }
      })

    } catch (aiError: any) {
      console.error('❌ AI API Error:', aiError)
      console.log('🔄 Falling back to mock recommendations...')
      
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

      console.log(`🆘 Fallback completed with ${fallbackRecommendations.length} recommendations`)

      return NextResponse.json({ 
        success: true,
        assignmentId,
        recommendations: fallbackRecommendations,
        timestamp: new Date().toISOString(),
        source: 'fallback',
        error: `AI error: ${aiError.message}`,
        debug: {
          totalPromotors: promotors.length,
          calendarWeek: currentKW,
          restrictionsFound: assignmentRestrictions.length,
          contextAssignments: assignmentContext.length,
          aiErrorType: aiError.constructor.name
        }
      })
    }

  } catch (e: any) {
    console.error('❌ Critical AI recommendation error:', e)
    console.error('📊 Error stack:', e.stack)
    return NextResponse.json({ 
      error: e?.message || 'Server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
