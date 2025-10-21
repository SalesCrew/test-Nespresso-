import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// POST: Mark a conversation as unread
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

    // Update the participant's marked_unread status
    const { error: updateError } = await supabase
      .from('chat_participants')
      .update({
        marked_unread: true,
        marked_unread_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error marking conversation as unread:', updateError);
      return NextResponse.json({ error: 'Failed to mark as unread' }, { status: 500 });
    }

    return NextResponse.json({ success: true, marked_unread: true });
  } catch (error) {
    console.error('Error in POST /api/chat/conversations/[conversationId]/mark-unread:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

