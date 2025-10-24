import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// POST: Pin a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;

    // Verify user is a participant
    const { data: participant, error: participantError } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
    }

    // Pin the conversation for this user only (update participant record)
    const { error: updateError } = await supabase
      .from('chat_participants')
      .update({
        is_pinned: true,
        pinned_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error pinning conversation:', updateError);
      return NextResponse.json({ error: 'Failed to pin conversation' }, { status: 500 });
    }

    return NextResponse.json({ success: true, pinned: true });
  } catch (error) {
    console.error('Error in POST /api/chat/conversations/[conversationId]/pin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

