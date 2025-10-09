import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const server = createSupabaseServerClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Temporary prompt – will refine in next step via system prompt
    const now = new Date()
    const austrianNow = now.toLocaleString('de-AT', { timeZone: 'Europe/Vienna' })
    const systemPrompt = `Du bist ein sehr kurzer, konkreter Assistent für Promotoren. Antworte mit genau einem freundlichen Satz (max. 22 Wörter). Keine Emojis, keine Aufzählungen. Vermeide Floskeln.`
    const userPrompt = `Heutiges Datum/Zeit (AT): ${austrianNow}. Gib mir in einem Satz, was ich heute zuerst erledigen oder checken sollte.`

    const payload = {
      model: 'gpt-5-nano',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      reasoning: { effort: 'low' },
      text: { verbosity: 'low' }
    }

    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!resp.ok) {
      const details = await resp.text()
      return NextResponse.json({ error: 'AI error', details }, { status: 500 })
    }

    const result = await resp.json()
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

    const text = extractText(result) || 'Kurzer Überblick folgt gleich.'
    return NextResponse.json({ text })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


