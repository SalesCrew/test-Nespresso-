import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// POST: Add or update a reaction to a message
export async function POST(
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
    const body = await request.json();
    const { emoji } = body;

    if (!emoji || typeof emoji !== 'string' || emoji.length === 0 || emoji.length > 16) {
      return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
    }

    const svc = createSupabaseServiceClient();

    // Verify user is a participant in the conversation this message belongs to
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

    // Upsert reaction (replace if user already reacted)
    const { error: upsertError } = await svc
      .from('chat_message_reactions')
      .upsert({
        message_id: messageId,
        user_id: user.id,
        emoji,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'message_id,user_id',
      });

    if (upsertError) {
      console.error('Error upserting reaction:', upsertError);
      return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 });
    }

    // Get aggregated reactions for this message
    const { data: reactions, error: reactionsError } = await svc
      .from('chat_message_reactions')
      .select('emoji, user_id')
      .eq('message_id', messageId);

    if (reactionsError) {
      console.error('Error fetching reactions:', reactionsError);
      return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
    }

    // Aggregate by emoji
    const reactionsSummary: Array<{ emoji: string; count: number }> = [];
    const emojiCounts = new Map<string, number>();
    
    reactions?.forEach(r => {
      emojiCounts.set(r.emoji, (emojiCounts.get(r.emoji) || 0) + 1);
    });

    emojiCounts.forEach((count, emoji) => {
      reactionsSummary.push({ emoji, count });
    });

    // Sort by count desc, then emoji asc
    reactionsSummary.sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.emoji.localeCompare(b.emoji);
    });

    // Get user's reaction
    const myReaction = reactions?.find(r => r.user_id === user.id)?.emoji || null;

    // Top reaction (most used)
    const topReaction = reactionsSummary.length > 0 
      ? { emoji: reactionsSummary[0].emoji, count: reactionsSummary[0].count }
      : null;

    return NextResponse.json({
      success: true,
      reactionsSummary,
      myReaction,
      topReaction,
      totalReactions: reactions?.length || 0,
    });
  } catch (error) {
    console.error('Error in POST /api/chat/messages/[messageId]/react:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove a reaction from a message
export async function DELETE(
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
    const svc = createSupabaseServiceClient();

    // Delete the reaction
    const { error: deleteError } = await svc
      .from('chat_message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting reaction:', deleteError);
      return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 });
    }

    // Get updated aggregated reactions for this message
    const { data: reactions, error: reactionsError } = await svc
      .from('chat_message_reactions')
      .select('emoji, user_id')
      .eq('message_id', messageId);

    if (reactionsError) {
      console.error('Error fetching reactions:', reactionsError);
      return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
    }

    // Aggregate by emoji
    const reactionsSummary: Array<{ emoji: string; count: number }> = [];
    const emojiCounts = new Map<string, number>();
    
    reactions?.forEach(r => {
      emojiCounts.set(r.emoji, (emojiCounts.get(r.emoji) || 0) + 1);
    });

    emojiCounts.forEach((count, emoji) => {
      reactionsSummary.push({ emoji, count });
    });

    // Sort by count desc, then emoji asc
    reactionsSummary.sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.emoji.localeCompare(b.emoji);
    });

    const topReaction = reactionsSummary.length > 0 
      ? { emoji: reactionsSummary[0].emoji, count: reactionsSummary[0].count }
      : null;

    return NextResponse.json({
      success: true,
      reactionsSummary,
      myReaction: null,
      topReaction,
      totalReactions: reactions?.length || 0,
    });
  } catch (error) {
    console.error('Error in DELETE /api/chat/messages/[messageId]/react:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

