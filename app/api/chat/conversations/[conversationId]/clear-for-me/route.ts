import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// POST: Clear chat for current user (hide all messages created before now)
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

    // Update the participant's cleared_at timestamp and reset unread flags
    const { error: updateError } = await supabase
      .from('chat_participants')
      .update({
        cleared_at: new Date().toISOString(),
        marked_unread: false,
        marked_unread_at: null,
        last_read_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error clearing conversation:', updateError);
      return NextResponse.json({ error: 'Failed to clear conversation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/chat/conversations/[conversationId]/clear-for-me:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

