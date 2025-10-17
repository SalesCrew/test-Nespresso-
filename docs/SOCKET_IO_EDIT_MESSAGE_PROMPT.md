# Socket.IO Server: Edit Message Handler Implementation

## Add `edit_message` Handler

**Event to listen for:** `edit_message`

**Payload structure from client:**
```typescript
{
  conversationId: string,
  messageId: string,
  newText: string
}
```

## Implementation Logic

### 1. Validation
- Verify the user owns the message (`sender_id === socket.userId`)
- Verify `message_type === 'text'` (only text messages can be edited)
- Verify message is not deleted (`deleted_for_all !== true`)
- Verify `newText` is not empty and not too long (max 5000 characters)

### 2. Database Update
Update the `chat_messages` table:
```sql
UPDATE chat_messages 
SET 
  message_text = :newText,
  edited = true,
  updated_at = NOW()
WHERE id = :messageId 
  AND sender_id = :userId
  AND message_type = 'text'
  AND deleted_for_all = false
```

**IMPORTANT:** Do NOT update `chat_conversations.updated_at` - edits should not reorder conversations in the chat list.

### 3. Broadcast to Conversation Room
After successful update, broadcast to all users in the conversation:
```typescript
io.to(`conversation:${conversationId}`).emit('message_edited', {
  conversationId: conversationId,
  messageId: messageId,
  message_text: newText,
  edited: true,
  updated_at: new Date().toISOString()
});
```

### 4. Error Handling
If validation fails or database update fails, emit an error back to the sender:
```typescript
socket.emit('error', {
  type: 'edit_message_failed',
  message: 'Failed to edit message',
  reason: 'Not authorized' // or other specific reason
});
```

## Example Handler Structure

```typescript
socket.on('edit_message', async (data) => {
  try {
    const { conversationId, messageId, newText } = data;
    const userId = socket.userId; // Assuming userId is stored in socket

    // Validate input
    if (!newText || newText.trim().length === 0 || newText.length > 5000) {
      socket.emit('error', { type: 'edit_message_failed', message: 'Invalid message text' });
      return;
    }

    // Fetch message to verify ownership and type
    const message = await db.query(
      'SELECT sender_id, message_type, deleted_for_all FROM chat_messages WHERE id = ?',
      [messageId]
    );

    if (!message || message.sender_id !== userId) {
      socket.emit('error', { type: 'edit_message_failed', message: 'Not authorized' });
      return;
    }

    if (message.message_type !== 'text') {
      socket.emit('error', { type: 'edit_message_failed', message: 'Can only edit text messages' });
      return;
    }

    if (message.deleted_for_all) {
      socket.emit('error', { type: 'edit_message_failed', message: 'Cannot edit deleted messages' });
      return;
    }

    // Update in database
    await db.query(
      `UPDATE chat_messages 
       SET message_text = ?, edited = true, updated_at = NOW() 
       WHERE id = ? AND sender_id = ?`,
      [newText.trim(), messageId, userId]
    );

    // Broadcast to conversation room
    io.to(`conversation:${conversationId}`).emit('message_edited', {
      conversationId,
      messageId,
      message_text: newText.trim(),
      edited: true,
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error handling edit_message:', error);
    socket.emit('error', { type: 'edit_message_failed', message: 'Internal server error' });
  }
});
```

## Testing Checklist
- ✅ User can edit their own text messages
- ✅ Edited message shows "(edited)" label in UI
- ✅ Edit broadcasts in real-time to other users in conversation
- ✅ User cannot edit other people's messages (authorization check)
- ✅ User cannot edit photos/PDFs (type check)
- ✅ User cannot edit deleted messages
- ✅ Conversation order doesn't change when message is edited
- ✅ Empty edits are rejected
- ✅ Edits update the message timestamp (updated_at)

