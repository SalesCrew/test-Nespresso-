import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const inputText: string = (body?.text || '').toString()

    if (!inputText.trim()) {
      return NextResponse.json({ error: 'text required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const systemPrompt = `Deine Aufgabe ist es NUR Groß- und Kleinschreibung auszubessern und Satzzeichen zu setzen.
KEINE Bindestriche hinzufügen, außer sie stehen bereits da. Verändere KEINE Wörter, außer sie sind grammatikalisch falsch
und der Satz ergibt keinen Sinn. In diesem Fall korrigiere minimal, so nah wie möglich am Original.`

    const userPrompt = `Korrigiere folgenden Text gemäß den Regeln. Antworte NUR mit der korrigierten Version, ohne Erklärungen:
"""
${inputText}
"""`

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        reasoning: { effort: 'low' },
        text: { verbosity: 'high' }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ error: `AI error: ${response.status} ${errText}` }, { status: 500 })
    }

    const result = await response.json()

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

    const enhanced = extractText(result)
    if (!enhanced) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, text: enhanced })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


