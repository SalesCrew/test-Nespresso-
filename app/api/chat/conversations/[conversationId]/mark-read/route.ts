import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// POST: Mark a conversation as read (clear manual unread flag and update last_read_at)
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

    // Update the participant's marked_unread status and last_read_at
    const { error: updateError } = await supabase
      .from('chat_participants')
      .update({
        marked_unread: false,
        marked_unread_at: null,
        last_read_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error marking conversation as read:', updateError);
      return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true, marked_unread: false });
  } catch (error) {
    console.error('Error in POST /api/chat/conversations/[conversationId]/mark-read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

