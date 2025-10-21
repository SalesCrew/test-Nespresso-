import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// GET: Fetch message history for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // Cursor for pagination (message created_at)

    // Verify user is a participant in this conversation and get cleared_at timestamp
    const { data: participant, error: participantError } = await supabase
      .from('chat_participants')
      .select('conversation_id, cleared_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
    }

    const clearedAt = participant.cleared_at || '1970-01-01T00:00:00.000Z';

    // Build query for messages (filter out messages created before cleared_at)
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .gt('created_at', clearedAt)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Add cursor pagination if provided
    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Fetch hidden messages for this user
    const { data: hiddenMessages } = await supabase
      .from('chat_message_hidden')
      .select('message_id')
      .eq('user_id', user.id);

    const hiddenMessageIds = new Set(hiddenMessages?.map(h => h.message_id) || []);

    // Filter out hidden messages for this user
    const visibleMessages = messages?.filter(m => !hiddenMessageIds.has(m.id)) || [];

    // Fetch sender profiles for all messages (use service client to bypass RLS)
    const senderIds = [...new Set(visibleMessages?.map(m => m.sender_id) || [])];
    const svc = createSupabaseServiceClient();
    const { data: senderProfiles, error: profilesError } = await svc
      .from('user_profiles')
      .select('user_id, display_name, role')
      .in('user_id', senderIds);

    if (profilesError) {
      console.error('Error fetching sender profiles:', profilesError);
    }

    // Fetch reactions for all visible messages
    const messageIds = visibleMessages?.map(m => m.id) || [];
    const { data: allReactions, error: reactionsError } = await svc
      .from('chat_message_reactions')
      .select('message_id, emoji, user_id')
      .in('message_id', messageIds);

    if (reactionsError) {
      console.error('Error fetching reactions:', reactionsError);
    }

    // Build reaction summaries per message
    const reactionsByMessage = new Map<string, Array<{ emoji: string; count: number }>>();
    const myReactionsByMessage = new Map<string, string>();
    const topReactionsByMessage = new Map<string, { emoji: string; count: number }>();

    messageIds.forEach(msgId => {
      const msgReactions = allReactions?.filter(r => r.message_id === msgId) || [];
      const emojiCounts = new Map<string, number>();
      
      msgReactions.forEach(r => {
        emojiCounts.set(r.emoji, (emojiCounts.get(r.emoji) || 0) + 1);
        if (r.user_id === user.id) {
          myReactionsByMessage.set(msgId, r.emoji);
        }
      });

      const summary: Array<{ emoji: string; count: number }> = [];
      emojiCounts.forEach((count, emoji) => {
        summary.push({ emoji, count });
      });

      // Sort by count desc, then emoji asc
      summary.sort((a, b) => {
        if (a.count !== b.count) return b.count - a.count;
        return a.emoji.localeCompare(b.emoji);
      });

      if (summary.length > 0) {
        reactionsByMessage.set(msgId, summary);
        topReactionsByMessage.set(msgId, { emoji: summary[0].emoji, count: summary[0].count });
      }
    });

    // For messages with reply_to_id, fetch the replied-to messages
    const replyToIds = visibleMessages
      ?.filter(m => m.reply_to_id)
      .map(m => m.reply_to_id)
      .filter((id): id is string => id !== null) || [];

    let repliedToMessages = [];
    if (replyToIds.length > 0) {
      const { data: replyData } = await supabase
        .from('chat_messages')
        .select('*')
        .in('id', replyToIds);
      repliedToMessages = replyData || [];
    }

    // Enrich messages with sender info and reply data
    const enrichedMessages = visibleMessages?.map(message => {
      const sender = senderProfiles?.find(p => p.user_id === message.sender_id);
      const replyTo = message.reply_to_id 
        ? repliedToMessages.find(r => r.id === message.reply_to_id)
        : null;

      let replyToEnriched = null;
      if (replyTo) {
        const replyToSender = senderProfiles?.find(p => p.user_id === replyTo.sender_id);
        replyToEnriched = {
          id: replyTo.id,
          sender_name: replyToSender?.display_name || 'Unknown',
          message_text: replyTo.message_text,
          message_type: replyTo.message_type,
          file_url: replyTo.file_url,
          file_name: replyTo.file_name,
        };
      }

      return {
        ...message,
        sender_name: sender?.display_name || 'Unknown',
        sender_role: sender?.role || 'promotor',
        reply_to: replyToEnriched,
        reactions_summary: reactionsByMessage.get(message.id) || [],
        my_reaction: myReactionsByMessage.get(message.id) || null,
        top_reaction: topReactionsByMessage.get(message.id) || null,
        total_reactions: reactionsByMessage.get(message.id)?.reduce((sum, r) => sum + r.count, 0) || 0,
      };
    }) || [];

    // Reverse to get chronological order (oldest first)
    enrichedMessages.reverse();

    return NextResponse.json({ 
      messages: enrichedMessages,
      has_more: visibleMessages?.length === limit,
    });
  } catch (error) {
    console.error('Error in GET /api/chat/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

