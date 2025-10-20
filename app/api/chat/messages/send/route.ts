import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// POST: Send a message (for quick replies from toasts)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversation_id, text, reply_to_id } = body;

    // Validate input
    if (!conversation_id || !text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Conversation ID and message text are required' }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: 'Message text too long (max 5000 characters)' }, { status: 400 });
    }

    const svc = createSupabaseServiceClient();

    // Verify user is a participant in the conversation
    const { data: participant, error: participantError } = await svc
      .from('chat_participants')
      .select('conversation_id')
      .eq('conversation_id', conversation_id)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
    }

    // Insert the message
    const { data: newMessage, error: insertError } = await svc
      .from('chat_messages')
      .insert({
        conversation_id,
        sender_id: user.id,
        message_text: text.trim(),
        message_type: 'text',
        reply_to_id: reply_to_id || null,
      })
      .select()
      .single();

    if (insertError || !newMessage) {
      console.error('Error inserting message:', insertError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Update conversation's updated_at for real-time sorting
    await svc
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation_id);

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error('Error in POST /api/chat/messages/send:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

