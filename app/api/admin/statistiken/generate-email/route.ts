import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const server = createSupabaseServerClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const name: string = (body?.name || '').toString()
    const email: string = (body?.email || '').toString()
    const mcet: string = (body?.mcet || '').toString()
    const tma: string = (body?.tma || '').toString()
    const vlShare: string = (body?.vlShare || '').toString()
    const category: string = (body?.category || 'Neutral').toString()

    const systemPrompt = `Du bist der SalesCrew Assistent und verfasst kurze, freundliche E-Mails in Deutsch an unsere Promotor:innen basierend auf KPI-Daten. Schreibe menschlich, natürlich und motivierend, ohne Emojis und ohne Aufzählungszeichen. Baue die Kennzahlen sinnvoll in den Text ein (nicht als Liste), hebe 1-2 Highlights hervor und bleibe sachlich, wenn die Zahlen schwächer sind. Schlankes Format: Begrüßung mit Name, 1–2 kurze Absätze (insgesamt ~120–180 Wörter), Abschluss mit "Liebe Grüße, dein Nespresso Team".

Daten:
Name: ${name}
E-Mail: ${email}
MC/ET: ${mcet}
TMA: ${tma}%
VL-Share: ${vlShare}%
Stimmung/Magic Touch: ${category}

Schreibe den finalen E-Mail-Text direkt als Fließtext ohne zusätzliche Erklärungen.`

    const userPrompt = 'Erzeuge jetzt den endgültigen E-Mail-Text.'

    const requestPayload = {
      model: 'gpt-5-nano',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      reasoning: { effort: 'low' },
      text: { verbosity: 'medium' }
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ error: 'OpenAI API error', details: errText }, { status: 500 })
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

    const text = extractText(result)
    if (!text) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 })
    }

    return NextResponse.json({ text })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


