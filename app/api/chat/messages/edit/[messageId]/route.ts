import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// PUT: Edit a message
export async function PUT(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = params;
    const body = await request.json();
    const { message_text } = body;

    // Validate input
    if (!message_text || typeof message_text !== 'string' || message_text.trim().length === 0) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    if (message_text.length > 5000) {
      return NextResponse.json({ error: 'Message text too long (max 5000 characters)' }, { status: 400 });
    }

    const svc = createSupabaseServiceClient();

    // Fetch the message to validate ownership and type
    const { data: message, error: msgError } = await svc
      .from('chat_messages')
      .select('sender_id, message_type, deleted_for_all, conversation_id')
      .eq('id', messageId)
      .single();

    if (msgError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is the sender
    if (message.sender_id !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own messages' }, { status: 403 });
    }

    // Only allow editing text messages
    if (message.message_type !== 'text') {
      return NextResponse.json({ error: 'Only text messages can be edited' }, { status: 400 });
    }

    // Cannot edit deleted messages
    if (message.deleted_for_all) {
      return NextResponse.json({ error: 'Cannot edit deleted messages' }, { status: 400 });
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await svc
      .from('chat_messages')
      .update({
        message_text: message_text.trim(),
        edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('sender_id', user.id)
      .select(`
        id,
        conversation_id,
        sender_id,
        message_text,
        message_type,
        file_url,
        file_name,
        reply_to_id,
        edited,
        deleted_for_all,
        deleted_at,
        deleted_by,
        created_at,
        updated_at
      `)
      .single();

    if (updateError || !updatedMessage) {
      console.error('Error updating message:', updateError);
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }

    // Fetch sender info
    const { data: senderProfile } = await svc
      .from('user_profiles')
      .select('display_name, role')
      .eq('user_id', updatedMessage.sender_id)
      .single();

    // Fetch reply_to info if exists
    let replyTo = null;
    if (updatedMessage.reply_to_id) {
      const { data: replyMsg } = await svc
        .from('chat_messages')
        .select(`
          id,
          message_text,
          message_type,
          file_url,
          file_name,
          sender_id
        `)
        .eq('id', updatedMessage.reply_to_id)
        .single();

      if (replyMsg) {
        const { data: replySender } = await svc
          .from('user_profiles')
          .select('display_name')
          .eq('user_id', replyMsg.sender_id)
          .single();

        replyTo = {
          id: replyMsg.id,
          sender_name: replySender?.display_name || 'Unknown',
          message_text: replyMsg.message_text,
          message_type: replyMsg.message_type,
          file_url: replyMsg.file_url,
          file_name: replyMsg.file_name,
        };
      }
    }

    // Fetch reactions for this message
    const { data: reactions } = await svc
      .from('chat_message_reactions')
      .select('emoji, user_id')
      .eq('message_id', messageId);

    // Aggregate reactions
    const reactionsSummary: Array<{ emoji: string; count: number }> = [];
    const emojiCounts = new Map<string, number>();
    
    reactions?.forEach(r => {
      emojiCounts.set(r.emoji, (emojiCounts.get(r.emoji) || 0) + 1);
    });

    emojiCounts.forEach((count, emoji) => {
      reactionsSummary.push({ emoji, count });
    });

    reactionsSummary.sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.emoji.localeCompare(b.emoji);
    });

    const myReaction = reactions?.find(r => r.user_id === user.id)?.emoji || null;
    const topReaction = reactionsSummary.length > 0 
      ? { emoji: reactionsSummary[0].emoji, count: reactionsSummary[0].count }
      : null;

    // Build complete message object
    const completeMessage = {
      ...updatedMessage,
      sender_name: senderProfile?.display_name || 'Unknown',
      sender_role: senderProfile?.role || 'promotor',
      reply_to: replyTo,
      reactions_summary: reactionsSummary,
      my_reaction: myReaction,
      top_reaction: topReaction,
      total_reactions: reactions?.length || 0,
    };

    return NextResponse.json({
      success: true,
      message: completeMessage,
    });
  } catch (error) {
    console.error('Error in PUT /api/chat/messages/edit/[messageId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

