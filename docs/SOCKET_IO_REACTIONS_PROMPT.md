# Socket.IO Reactions Implementation

Add these handlers to your Socket.IO server (server.js on Railway):

```javascript
// ============================================
// REACT TO MESSAGE
// ============================================
socket.on('react_to_message', async (data) => {
  try {
    const { conversationId, messageId, emoji } = data;

    // Validate participant
    const { data: participant } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', socket.userId)
      .single();

    if (!participant) {
      console.error('❌ Not a participant');
      return;
    }

    // Fetch all reactions for this message to build summary
    const { data: reactions } = await supabase
      .from('chat_message_reactions')
      .select('emoji, user_id')
      .eq('message_id', messageId);

    // Aggregate by emoji
    const reactionsSummary = [];
    const emojiCounts = new Map();
    
    (reactions || []).forEach(r => {
      emojiCounts.set(r.emoji, (emojiCounts.get(r.emoji) || 0) + 1);
    });

    emojiCounts.forEach((count, emoji) => {
      reactionsSummary.push({ emoji, count });
    });

    // Sort by count desc
    reactionsSummary.sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.emoji.localeCompare(b.emoji);
    });

    const topReaction = reactionsSummary.length > 0 
      ? { emoji: reactionsSummary[0].emoji, count: reactionsSummary[0].count }
      : null;

    // Broadcast to all participants in the conversation
    io.to(conversationId).emit('reaction_updated', {
      conversationId,
      messageId,
      reactionsSummary,
      topReaction,
      totalReactions: reactions?.length || 0,
    });

    console.log(`👍 Reaction ${emoji} added to message ${messageId} by ${socket.userName}`);
  } catch (error) {
    console.error('❌ Error handling react_to_message:', error);
  }
});

// ============================================
// REMOVE REACTION
// ============================================
socket.on('remove_reaction', async (data) => {
  try {
    const { conversationId, messageId } = data;

    // Validate participant
    const { data: participant } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', socket.userId)
      .single();

    if (!participant) {
      console.error('❌ Not a participant');
      return;
    }

    // Fetch all reactions for this message to build summary
    const { data: reactions } = await supabase
      .from('chat_message_reactions')
      .select('emoji, user_id')
      .eq('message_id', messageId);

    // Aggregate by emoji
    const reactionsSummary = [];
    const emojiCounts = new Map();
    
    (reactions || []).forEach(r => {
      emojiCounts.set(r.emoji, (emojiCounts.get(r.emoji) || 0) + 1);
    });

    emojiCounts.forEach((count, emoji) => {
      reactionsSummary.push({ emoji, count });
    });

    // Sort by count desc
    reactionsSummary.sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.emoji.localeCompare(b.emoji);
    });

    const topReaction = reactionsSummary.length > 0 
      ? { emoji: reactionsSummary[0].emoji, count: reactionsSummary[0].count }
      : null;

    // Broadcast to all participants
    io.to(conversationId).emit('reaction_updated', {
      conversationId,
      messageId,
      reactionsSummary,
      topReaction,
      totalReactions: reactions?.length || 0,
    });

    console.log(`🗑️ Reaction removed from message ${messageId} by ${socket.userName}`);
  } catch (error) {
    console.error('❌ Error handling remove_reaction:', error);
  }
});
```

## Summary
- Both handlers validate participant status
- Both fetch all reactions for the message and recompute aggregated summaries
- Both broadcast `reaction_updated` to the conversation room with the same payload shape
- Frontend will receive real-time updates and merge into local state

