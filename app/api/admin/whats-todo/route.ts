import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const server = createSupabaseServerClient();
    const { data: { user } } = await server.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Temporary prompt - will be replaced with system prompt in next step
    const systemPrompt = `Du bist ein hilfreicher Admin-Assistent für ein Promotions-Management-System. Gib einen kurzen Überblick über die wichtigsten Aufgaben des Tages.`;
    
    const userPrompt = `Erstelle einen kurzen Überblick über die wichtigsten Aufgaben für heute als Admin.`;

    const requestPayload = {
      model: 'gpt-5-nano',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      reasoning: { effort: 'low' },
      text: { verbosity: 'low' }
    };

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI API error:', {
        status: response.status,
        errorBody: errText
      });
      return NextResponse.json({ 
        error: `OpenAI API error: ${response.status}`,
        details: errText
      }, { status: 500 });
    }

    const result = await response.json();

    const extractText = (res: any): string => {
      if (typeof res?.output_text === 'string') return res.output_text.trim();
      const out = res?.output;
      if (Array.isArray(out)) {
        let text = '';
        for (const item of out) {
          const content = (item && item.content) || [];
          if (typeof content === 'string') text += content;
          else if (Array.isArray(content)) {
            for (const seg of content) {
              if (typeof seg?.text === 'string') text += seg.text;
              else if (typeof seg === 'string') text += seg;
            }
          }
        }
        return text.trim();
      }
      return (typeof res === 'string' ? res : '').trim();
    };

    const aiResponse = extractText(result);
    
    if (!aiResponse) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 });
    }

    return NextResponse.json({ response: aiResponse });
  } catch (e: any) {
    console.error('Error in whats-todo:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

