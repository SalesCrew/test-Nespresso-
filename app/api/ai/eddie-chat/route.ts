import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  console.log('🤖 Eddie Chat Request Started');
  
  try {
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

    const systemPrompt = `Du bist Eddie, der freundliche KI-Assistent für die SalesCrew Promotor App. 
Du hilfst Promotoren bei Fragen zur App-Navigation, Einsätzen, Schulungen und allgemeinen Problemen.
Antworte immer freundlich, hilfsbereit und auf Deutsch. Halte deine Antworten präzise und nützlich.
Dies ist nur ein Test - später wird ein detaillierterer Prompt folgen.`

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
