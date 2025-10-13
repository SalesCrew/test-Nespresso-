import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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

    // Verify user is a participant in this conversation
    const { data: participant, error: participantError } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
    }

    // Build query for messages
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
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

    // Fetch sender profiles for all messages
    const senderIds = [...new Set(messages?.map(m => m.sender_id) || [])];
    const { data: senderProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, role')
      .in('user_id', senderIds);

    if (profilesError) {
      console.error('Error fetching sender profiles:', profilesError);
    }

    // For messages with reply_to_id, fetch the replied-to messages
    const replyToIds = messages
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
    const enrichedMessages = messages?.map(message => {
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
      };
    }) || [];

    // Reverse to get chronological order (oldest first)
    enrichedMessages.reverse();

    return NextResponse.json({ 
      messages: enrichedMessages,
      has_more: messages?.length === limit,
    });
  } catch (error) {
    console.error('Error in GET /api/chat/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

