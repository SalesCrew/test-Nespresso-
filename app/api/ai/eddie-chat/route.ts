import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function POST(req: Request) {
  console.log('🤖 Eddie Chat Request Started');
  
  try {
    // Get authenticated user
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('❌ User not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('✅ User authenticated:', user.id);
    
    const body = await req.json().catch(() => ({}))
    const userMessage: string = (body?.message || '').toString()

    console.log('💬 User message received:', {
      hasMessage: !!userMessage,
      messageLength: userMessage.length,
      messagePreview: userMessage.substring(0, 100) + (userMessage.length > 100 ? '...' : '')
    });

    if (!userMessage.trim()) {
      console.log('❌ Empty message provided');
      return NextResponse.json({ error: 'message required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ OpenAI API key not configured');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    console.log('✅ OpenAI API key found, proceeding with Eddie chat');

    // Fetch promotor data from database
    const svc = createSupabaseServiceClient()
    console.log('📊 Fetching promotor data from database...');

    // 1. Get ALL assignments (Einsätze) - past and future for this promotor
    // First get all assignment IDs where this user is a participant
    const { data: userAssignments } = await svc
      .from('assignment_participants')
      .select('assignment_id')
      .eq('user_id', user.id)
    
    const userAssignmentIds = (userAssignments || []).map(ua => ua.assignment_id)
    
    // Then get all those assignments (past and future)
    const { data: assignments } = await svc
      .from('assignments_with_buddy_info')
      .select('*')
      .in('id', userAssignmentIds.length > 0 ? userAssignmentIds : ['00000000-0000-0000-0000-000000000000']) // dummy ID if no assignments
      .order('start_ts', { ascending: false }) // Most recent first
      .limit(50) // Increased limit to include more history
    
    const relevantAssignments = assignments || []

    // 2. Get documents
    const { data: documents } = await svc
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 3. Get promotor profile (includes bank data)
    const { data: promotorProfile } = await svc
      .from('promotor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    
    // Extract bank data from promotor profile
    const bankData = promotorProfile ? {
      bank_holder: promotorProfile.bank_holder,
      bank_name: promotorProfile.bank_name,
      bank_iban: promotorProfile.bank_iban,
      bank_bic: promotorProfile.bank_bic
    } : null

    // 4. Get application data and user profile
    
    const { data: userProfile } = await svc
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    
    // Get application data (onboarding info)
    const { data: applicationData } = await svc
      .from('applications')
      .select('*')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .maybeSingle()

    // 5. Get contract data
    const { data: contracts } = await svc
      .from('contracts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    console.log('✅ Data fetched:', {
      assignments: relevantAssignments?.length || 0,
      documents: documents?.length || 0,
      hasBankData: !!bankData,
      hasProfile: !!promotorProfile,
      hasUserProfile: !!userProfile,
      hasApplicationData: !!applicationData,
      contracts: contracts?.length || 0
    });

    // Format assignment data for prompt - separate past and future
    let einsatzDaten = 'Keine Einsätze gefunden.'
    if (relevantAssignments && relevantAssignments.length > 0) {
      const now = new Date()
      const futureAssignments = relevantAssignments.filter(a => new Date(a.start_ts) >= now)
      const pastAssignments = relevantAssignments.filter(a => new Date(a.start_ts) < now)
      
      let formattedData = ''
      
      // Future assignments
      if (futureAssignments.length > 0) {
        formattedData += 'KOMMENDE EINSÄTZE:\n\n'
        formattedData += futureAssignments.map((a, index) => {
          const startDate = new Date(a.start_ts)
          const endDate = new Date(a.end_ts)
          const dateStr = startDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
          const timeStart = startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
          const timeEnd = endDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
          
          return `Einsatz ${index + 1}:
Datum: ${dateStr}
Adresse: ${a.location_text || 'Keine Adresse angegeben'}
Uhrzeit: ${timeStart}–${timeEnd}
${a.buddy_display_name ? `Buddy: ${a.buddy_display_name}` : ''}
Status: ${a.status || 'offen'}`
        }).join('\n\n')
      }
      
      // Past assignments
      if (pastAssignments.length > 0) {
        if (formattedData) formattedData += '\n\n'
        formattedData += 'VERGANGENE EINSÄTZE:\n\n'
        formattedData += pastAssignments.slice(0, 20).map((a, index) => {
          const startDate = new Date(a.start_ts)
          const endDate = new Date(a.end_ts)
          const dateStr = startDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
          const timeStart = startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
          const timeEnd = endDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
          
          return `Einsatz ${index + 1}:
Datum: ${dateStr}
Adresse: ${a.location_text || 'Keine Adresse angegeben'}
Uhrzeit: ${timeStart}–${timeEnd}
${a.buddy_display_name ? `Buddy: ${a.buddy_display_name}` : ''}
Status: ${a.status || 'offen'}`
        }).join('\n\n')
      }
      
      einsatzDaten = formattedData
    }

    // Format document data
    let dokumentDaten = 'Keine Dokumente hochgeladen.'
    if (documents && documents.length > 0) {
      dokumentDaten = documents.map(doc => {
        const status = doc.status === 'uploaded' ? 'Uploaded (noch nicht geprüft)' :
                      doc.status === 'rejected' ? 'Rejected (abgelehnt, bitte neu hochladen)' :
                      doc.status === 'accepted' ? 'Accepted (angenommen)' :
                      'Noch nicht hochgeladen'
        return `${doc.document_type}: ${status}`
      }).join('\n')
    }

    // Format bank data from promotor_profiles
    let bankDaten = 'Keine Bankdaten angegeben. Bitte in der Profil-Seite eingeben.'
    if (bankData && (bankData.bank_iban || bankData.bank_bic || bankData.bank_holder || bankData.bank_name)) {
      const fields = Object.entries(bankData)
        .filter(([key, value]) => value) // Only include fields with values
        .map(([key, value]) => {
          const label = key === 'bank_iban' ? 'IBAN' :
                       key === 'bank_bic' ? 'BIC' :
                       key === 'bank_holder' ? 'Kontoinhaber' :
                       key === 'bank_name' ? 'Bank' : key
          return `${label}: ${value}`
        })
      bankDaten = fields.length > 0 ? fields.join('\n') : 'Keine Bankdaten angegeben. Bitte in der Profil-Seite eingeben.'
    }

    // Format promotor general data - ALL fields from user_profiles, promotor_profiles, and applications
    let promotorDaten = 'Keine Profildaten verfügbar.'
    const dataFields: string[] = []
    
    // User Profile data (ALL fields)
    if (userProfile) {
      Object.entries(userProfile)
        .filter(([key]) => !['id', 'user_id', 'created_at', 'updated_at'].includes(key))
        .forEach(([key, value]) => {
          if (value) {
            const label = key === 'display_name' ? 'Name' :
                         key === 'role' ? 'Rolle' :
                         key === 'phone' ? 'Telefon' :
                         key === 'status' ? 'Status' : key
            dataFields.push(`${label}: ${value}`)
          }
        })
    }
    
    // Promotor Profile data (ALL fields except bank data which is shown separately)
    if (promotorProfile) {
      Object.entries(promotorProfile)
        .filter(([key]) => !['id', 'user_id', 'created_at', 'updated_at', 'bank_holder', 'bank_name', 'bank_iban', 'bank_bic'].includes(key))
        .forEach(([key, value]) => {
          if (value) {
            const label = key === 'region' ? 'Region' :
                         key === 'postal_code' ? 'Postleitzahl' :
                         key === 'city' ? 'Stadt' :
                         key === 'address' ? 'Adresse' :
                         key === 'phone' ? 'Telefon (Profil)' :
                         key === 'working_days' ? 'Arbeitstage' :
                         key === 'stammmarkt' ? 'Stammmarkt' :
                         key === 'has_driving_license' ? 'Führerschein' :
                         key === 'has_car' ? 'Auto' : key
            const displayValue = Array.isArray(value) ? value.join(', ') :
                                typeof value === 'boolean' ? (value ? 'Ja' : 'Nein') :
                                value
            dataFields.push(`${label}: ${displayValue}`)
          }
        })
    }
    
    // Application data (ALL fields from onboarding)
    if (applicationData) {
      Object.entries(applicationData)
        .filter(([key]) => !['id', 'user_id', 'created_at', 'updated_at', 'email', 'payload', 'status'].includes(key))
        .forEach(([key, value]) => {
          if (value) {
            const label = key === 'full_name' ? 'Vollständiger Name' :
                         key === 'phone' ? 'Telefon (Bewerbung)' :
                         key === 'title' ? 'Titel' :
                         key === 'gender' ? 'Geschlecht' :
                         key === 'birthDate' ? 'Geburtsdatum' :
                         key === 'citizenship' ? 'Staatsbürgerschaft' :
                         key === 'socialSecurityNumber' ? 'SV-Nummer' :
                         key === 'drivingLicense' ? 'Führerschein (Bewerbung)' :
                         key === 'carAvailable' ? 'Auto verfügbar' :
                         key === 'education' ? 'Ausbildung' :
                         key === 'preferredRegion' ? 'Bevorzugte Region' :
                         key === 'hoursPerWeek' ? 'Gewünschte Wochenstunden' :
                         key === 'workingDays' ? 'Arbeitstage (Bewerbung)' : key
            const displayValue = Array.isArray(value) ? value.join(', ') :
                                typeof value === 'boolean' ? (value ? 'Ja' : 'Nein') :
                                value
            dataFields.push(`${label}: ${displayValue}`)
          }
        })
    }
    
    if (dataFields.length > 0) {
      promotorDaten = dataFields.join('\n')
    }

    // Format contract data
    let vertragDaten = 'Kein Dienstvertrag vorhanden.'
    if (contracts && contracts.length > 0) {
      const activeContract = contracts.find(c => c.is_active) || contracts[0]
      vertragDaten = `Status: ${activeContract.status || 'unbekannt'}
Stunden pro Woche: ${activeContract.hours_per_week || 'Nicht angegeben'}
Startdatum: ${activeContract.start_date ? new Date(activeContract.start_date).toLocaleDateString('de-DE') : 'Nicht angegeben'}
${activeContract.signed_at ? `Unterschrieben am: ${new Date(activeContract.signed_at).toLocaleDateString('de-DE')}` : 'Noch nicht unterschrieben'}`
    }

    const systemPrompt = `Dein Name ist Eddie, Eddie der Assistent, und du weißt nicht nur alles über den Coffee Advisor, mit dem du schreibst, du bist auch absoluter Nespresso Kaffee-Experte! Du antwortest immer nur auf das, wonach du gefragt wirst, und gibst nicht mehr Informationen als notwendig. Du bist freundlich, motiviert und auch motivierend, vielleicht ein wenig lustig, wenn es passt; geht es aber um sachliche Sachen, antworte bitte sachlich und mache Späße nur dort, wo sie auch sicher gut passen!

Hintergrundinfos Über uns: 

Wir sind das größte Marketingunternehmen in Österreich names SalesCrew und wir haben die Firma Nespresso als Kunden. Unsere Promotoren/Coffee Advisors gehen in MediaMärkte in ganz Österreich und verkaufen am POS Kaffee, Kaffeemaschinen sowie Zubehör. Alle Produkte werden später noch gelistet. Die Aufgabe unserer Promotoren/Coffee Advisors ist es, mit Kunden im MediaMarkt zu sprechen, sie zu beraten und im besten Fall auch eine Maschine zu verkaufen. Um Arbeitsqualität zu fördern, gibt es immer wieder Sales-Challenges, bei denen der Fokus auf ein bestimmtes Produkt gelegt wird, und dafür gibt es auch saftige Prämien. Intern haben wir fünf Mitarbeiter. Die Agency Head ist Susanne, der Senior Project Manager ist Mario, die Project Managerin ist Shirin, der Junior Project Manager ist Jack, Project Assistant ist Hannah. Diese fünf internen Mitarbeiter arbeiten eng zusammen mit den Promotoren; die Internen kümmern sich um alles rund um die Promotion selbst. Sie bekommen eine Liste von Nespresso mit Einsätzen, und intern werden dann diese Einsätze an die Promotoren verplant. Dafür werden sie angerufen. Ein Promotor, der das erste Mal eine Promotion macht, hat einen sogenannten Buddy-Tag, bei dem der neue Promotor einen Tag mit einem Buddy (erfahrener Promotor) am POS verbringt, um alles zu lernen. Einsätze sind in der Regel unter der Woche immer von 9:30–18:30 mit einer Stunde Pause. Es kann aber auch – und das meistens am Wochenende – zu einem 9:30–15:30-Einsatz kommen. Bei diesem Einsatz gibt es keine Pause.

App Hintergrundinfos: 

Ein Promotor, der sich bei uns in der App anmeldet, hat die Onboarding-Fragen beantwortet und bekommt anschließend von uns das Login-Passwort. Da wir dieses Passwort kennen, wird dringend empfohlen, es zu ändern – das geht im Header unter dem Einstellungs-Icon sehr schnell über die App. Dann müssen die Promotoren noch auf der Profil-Seite (im Menü die letzte Option) Bankdaten eingeben und die Zugänge wie Hübner, Boost App, TMA, Demotool für später speichern. Wenn der Account fertig angelegt ist, muss der Promotor über die Dokumente-Karte in der Profil-Page die Pflichtdokumente hochladen – das sind jene, bei denen nicht „optional" steht; man kann die verpflichtenden Dokumente, die noch fehlen, auch in der To-do-Liste im Dashboard sehen. Wenn man über das Upload-Icon links neben dem Status-Icon (normalerweise X) ein Dokument hochgeladen hat, ist statt des roten X jetzt ein drehender Kreis in Orange; das bedeutet, dass das Dokument abgesendet, aber noch nicht angenommen wurde. Die internen Mitarbeiter nehmen dann das Dokument an, und danach hat der Promotor ein grünes Häkchen als Bestätigung. Links neben dem grünen Häkchen, wo vorher das Upload-Icon war, ist jetzt ein Augen-Icon – darüber kann man sich das Dokument ansehen. Sollten die internen Mitarbeiter aus irgendeinem Grund das Dokument abgelehnt haben (nicht leserlich, falsches Dokument usw.), sieht der Promotor auf seiner Seite wieder das Upload-Icon mit dem roten X. Alle nicht optionalen Dokumente müssen abgeschickt und angenommen werden. Dann bekommt der Promotor einen Dienstvertrag zugeschickt. Diesen findet man auch in der Profil-Page auf dem großen blauen „Dienstvertrag"-Button. Dort muss der Vertrag angesehen und heruntergeladen werden. Nachdem man auf „Ansehen & Unterschreiben" gedrückt hat, kann man den Vertrag über das Download-Icon im Header oben rechts herunterladen. Dann soll der Promotor den heruntergeladenen Vertrag (PDF) unterschreiben und anschließend über das Upload-Icon rechts neben dem „Ansehen & Unterschreiben"-Button hochladen.  Wenn das auch fertig ist, würde der Promotor als nächsten Schritt auf der Einsatz-Page (zweite Option im Menü) 3–5 Promotion-Termine für einen Buddy-Tag bekommen (auf der Karte im Header steht: „Suche dir deinen Buddy-Tag selber aus!") – dort kann man einen aussuchen und annehmen. Im Kalender im Dashboard sieht man jetzt den Buddy-Tag als Promotion. Wenn der Promotor schon ein eingearbeiteter Promotor ist, bekommt man einige Promotions zugeschickt (normale Promotions, kein Buddy) und kann sich aus mehreren welche aussuchen. Wenn man das gemacht hat, wird man in eine Warteschleife gesetzt und der Promotor sieht einen Wartescreen. Wenn die internen Mitarbeiter die Einsätze bewilligen, muss der Promotor dies nur noch wahrnehmen und auf „Verstanden" drücken; sollten sie es ablehnen, dann bekommt der Promotor Ersatztermine zugeschickt. Sollte ein Promotor krank werden oder einen Notfall haben, kann der Promotor in der Einsatz-Page so etwas beantragen über „Krankenstand beantragen" oder „Notfall beantragen". Bevor sie aber auf „Beantragen" drücken, müssen sie diese Nummer anrufen: +43699141630. Die App ist noch in Entwicklung; wenn du über etwas gefragt wirst, das mit Funktionen zu tun hat, die nicht hier im Prompt stehen, dann sag bitte, dass es noch nicht so weit ist und dass diese Funktionen bald kommen.

!!!!!WICHTIGE REGELN IMMER IMMER IMMER BEACHTEN NIE VERLETZEN:

1. Schreibe menschlich und hilfreich, keine unnötigen Dashes ("-") im Satz, menschliche Sprache, verständnisvoll und lösungsorientiert, strikt an die Regeln! Keine anderen KI-Erkennungsmerkmale in der Satzsyntax.
2. Antworte gezielt auf die Frage und teile nicht mehr als nötig.
3. Du bist lustig und hast immer Freude an der Arbeit, übertreibe es aber nicht. Wenn es nicht passt, dann mache keine Späße!
4. Du lügst niemals! Wenn du etwas nicht weißt, gibst du das offen und ehrlich zu und rätst unbedingt, einen internen Mitarbeiter anzurufen, um Rat zu holen!
5. Du arbeitest nie eigensinnig. Du erlaubst Promotoren nichts, wenn du dir durch diesen Prompt nicht zu 100 % sicher bist, dass es okay ist. Bei Fragen wie „Darf ich das?" oder „Wie soll ich das machen?" gib immer einen Ratschlag, weise aber darauf hin, dass unbedingt intern angerufen werden muss, um eine 100 % sichere Antwort zu bekommen. Immer hierher weiterleiten: 069914161430
6. Überprüfe im Denkprozess zweimal, ob du alles richtig hast! Dass du Daten akkurat wiedergibst, ist das Allerwichtigste!!!!
7. Achte auf deine Rechtschreibung mache keine Fehler

Interne TEL und Kontakte: 

Alle Internen Mitarbeiter sind unter dieser Nummer erreichbar: 069914161430 

Shirin: shirin.mastalir@salescrew.at
Jack: jack.parker@salescrew.at
Hannah: hannah.klahn@salescrew.at
Mario: mario.kriszta@salescrew.at
Susanne: s.kristek@salescrew.at

Daten Einsätze: 

Einsätze spezifische regeln:

1. Wenn Fragen zu Einsätzen (normal oder Buddy) gestellt werden, findest du hier alle notwendigen Daten.
2. Wenn jemand nach einem oder mehreren Einsätzen fragt, erwähne den Einsatz in der Struktur:
Adresse: (Einsatzadresse)
Uhrzeit: (von–bis des Einsatzes)
(falls Buddy-Tag) Buddy: (Name des Buddies)
3. Achte sehr genau auf die Daten und darauf, dass du die richtigen Daten für den richtigen Einsatz gefunden hast, nach dem gefragt wurde.

${einsatzDaten}

Daten Onboarding: 

Onboarding spezifische Regeln: 

1. Der Fragebogen wurde bereits ausgefüllt, weil der Promotor sonst keinen Zugang zur App hätte.
2. Verpflichtend sind alle Dokumente, die nicht „optional" daneben stehen haben, oder Dokumente, nach denen interne Mitarbeiter spezifisch gefragt haben.
3. In der Datenbank gibt es für Dokumente vier Status: Kein Eintrag in der DB: noch keines eingeschickt. Uploaded: wurde geschickt, aber noch nicht approved. Rejected: wurde abgelehnt, neues Dokument muss geschickt werden. Accepted: Dokument wurde akzeptiert und ist aktiv, alles richtig gemacht!
4. bankdaten müssen Manuell ausgefüllt werden in der Profil seite (letzte menü Option ganz rechts) 

Dokumente: 
${dokumentDaten}

Bankdaten: 
${bankDaten}

Generelle Daten: 
${promotorDaten}

Dienstvertrag:
${vertragDaten}`

    const userPrompt = `Promotor fragt: ${userMessage}`

    console.log('🌐 Calling OpenAI GPT-5-nano API...');
    const requestPayload = {
      model: 'gpt-5-nano',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      reasoning: { effort: 'medium' },
      text: { verbosity: 'medium' }
    };
    
    console.log('📤 API request payload:', {
      model: requestPayload.model,
      inputMessages: requestPayload.input.length,
      reasoning: requestPayload.reasoning,
      text: requestPayload.text
    });

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    })

    console.log('📥 OpenAI response status:', response.status);

    if (!response.ok) {
      const errText = await response.text()
      console.error('❌ OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errText
      });
      return NextResponse.json({ error: `AI error: ${response.status} ${errText}` }, { status: 500 })
    }

    const result = await response.json()
    console.log('📥 OpenAI response structure:', {
      hasOutputText: typeof result.output_text === 'string',
      hasOutput: !!result.output,
      outputType: Array.isArray(result.output) ? 'array' : typeof result.output,
      responseId: result.response_id,
      reasoningTokens: result.reasoning_tokens,
      outputTokens: result.output_tokens
    });

    const extractText = (res: any): string => {
      if (typeof res?.output_text === 'string') return res.output_text.trim()
      const out = res?.output
      if (Array.isArray(out)) {
        let text = ''
        for (const item of out) {
          const content = (item && item.content) || []
          if (typeof content === 'string') text += content
          else if (Array.isArray(content)) {
            for (const seg of content) {
              if (typeof seg?.text === 'string') text += seg.text
              else if (typeof seg === 'string') text += seg
            }
          }
        }
        return text.trim()
      }
      return (typeof res === 'string' ? res : '').trim()
    }

    const aiResponse = extractText(result)
    console.log('💬 Extracted AI response:', {
      hasResponse: !!aiResponse,
      responseLength: aiResponse.length,
      responsePreview: aiResponse.substring(0, 100) + (aiResponse.length > 100 ? '...' : '')
    });
    
    if (!aiResponse) {
      console.error('❌ Empty AI response extracted');
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 })
    }

    console.log('✅ Eddie chat completed successfully');
    return NextResponse.json({ ok: true, response: aiResponse })
  } catch (e: any) {
    console.error('❌ Critical error in Eddie chat:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
