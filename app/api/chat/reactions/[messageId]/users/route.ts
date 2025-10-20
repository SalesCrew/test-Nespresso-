import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// GET: Fetch users who reacted to a message (optionally filtered by emoji)
export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = params;
    const { searchParams } = new URL(request.url);
    const emojiFilter = searchParams.get('emoji');

    const svc = createSupabaseServiceClient();

    // Verify user is a participant in the conversation
    const { data: message, error: msgError } = await svc
      .from('chat_messages')
      .select('conversation_id')
      .eq('id', messageId)
      .single();

    if (msgError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const { data: participant, error: participantError } = await svc
      .from('chat_participants')
      .select('conversation_id')
      .eq('conversation_id', message.conversation_id)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
    }

    // Fetch reactions
    let query = svc
      .from('chat_message_reactions')
      .select('emoji, user_id, created_at')
      .eq('message_id', messageId);

    if (emojiFilter) {
      query = query.eq('emoji', emojiFilter);
    }

    const { data: reactions, error: reactionsError } = await query.order('created_at', { ascending: true });

    if (reactionsError) {
      console.error('Error fetching reactions:', reactionsError);
      return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
    }

    // Fetch user profiles for reactors
    const userIds = reactions?.map(r => r.user_id) || [];
    const { data: userProfiles, error: profilesError } = await svc
      .from('user_profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
    }

    // Map reactions to include display names
    const reactionsWithNames = reactions?.map(r => {
      const profile = userProfiles?.find(p => p.user_id === r.user_id);
      return {
        emoji: r.emoji,
        user_id: r.user_id,
        display_name: profile?.display_name || 'Unknown',
        created_at: r.created_at,
      };
    }) || [];

    // Group by emoji if no filter
    if (!emojiFilter) {
      const grouped: Record<string, Array<{ user_id: string; display_name: string; created_at: string }>> = {};
      reactionsWithNames.forEach(r => {
        if (!grouped[r.emoji]) {
          grouped[r.emoji] = [];
        }
        grouped[r.emoji].push({
          user_id: r.user_id,
          display_name: r.display_name,
          created_at: r.created_at,
        });
      });

      return NextResponse.json({
        reactions: grouped,
      });
    }

    // Return flat list if emoji filter is applied
    return NextResponse.json({
      reactions: reactionsWithNames.map(r => ({
        user_id: r.user_id,
        display_name: r.display_name,
        created_at: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Error in GET /api/chat/reactions/[messageId]/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

