import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  console.log('🤖 AI Enhancement Request Started');
  
  try {
    const body = await req.json().catch(() => ({}))
    const inputText: string = (body?.text || '').toString()

    console.log('📝 Input text received:', {
      hasText: !!inputText,
      textLength: inputText.length,
      textPreview: inputText.substring(0, 100) + (inputText.length > 100 ? '...' : '')
    });

    if (!inputText.trim()) {
      console.log('❌ Empty text provided');
      return NextResponse.json({ error: 'text required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ OpenAI API key not configured');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    console.log('✅ OpenAI API key found, proceeding with enhancement');

    const systemPrompt = `Deine Aufgabe ist es NUR Groß- und Kleinschreibung auszubessern und Satzzeichen zu setzen.
KEINE Bindestriche hinzufügen, außer sie stehen bereits da. Verändere KEINE Wörter, außer sie sind grammatikalisch falsch
und der Satz ergibt keinen Sinn. In diesem Fall korrigiere minimal, so nah wie möglich am Original.

ZUSÄTZLICH: Formatiere die Nachricht professionell in dieser Struktur:
- Anrede (falls nicht vorhanden, füge eine passende hinzu wie "Liebe Promotoren," oder "Hallo zusammen,")
- Hauptnachricht mit Absätzen an sinnvollen Stellen
- Abschluss: "Liebe Grüße, euer Nespresso Team"

Mache Absätze (Zeilenumbrüche) wo es inhaltlich Sinn macht, um die Lesbarkeit zu verbessern.`

    const userPrompt = `Korrigiere folgenden Text gemäß den Regeln. Antworte NUR mit der korrigierten Version, ohne Erklärungen:
"""
${inputText}
"""`

    console.log('🌐 Calling OpenAI GPT-5 Chat API...');
    const requestPayload = {
      model: 'gpt-5-chat-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2
    } as const;
    
    console.log('📤 API request payload:', {
      model: requestPayload.model,
      messages: requestPayload.messages.length,
      temperature: requestPayload.temperature
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      hasChoices: Array.isArray(result?.choices),
      choiceCount: result?.choices?.length || 0,
      id: result?.id
    });

    const enhanced: string = (result?.choices?.[0]?.message?.content || '').trim()
    console.log('📝 Extracted enhanced text:', {
      hasEnhanced: !!enhanced,
      enhancedLength: enhanced.length,
      enhancedPreview: enhanced.substring(0, 100) + (enhanced.length > 100 ? '...' : ''),
      originalLength: inputText.length
    });
    
    if (!enhanced) {
      console.error('❌ Empty enhanced text extracted from AI response');
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 })
    }

    console.log('✅ AI enhancement completed successfully');
    return NextResponse.json({ ok: true, text: enhanced })
  } catch (e: any) {
    console.error('❌ Critical error in AI enhancement:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


