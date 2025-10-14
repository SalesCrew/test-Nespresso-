# Railway Socket.IO Server Update Instructions

## What Changed
The `server.js` file was updated to include `reply_to` message details in Socket.IO broadcasts, so replies show correctly in the UI immediately without needing a page refresh.

## How to Update Railway

### Option 1: Redeploy from GitHub (Recommended if Railway is connected to your repo)
1. Go to Railway dashboard: https://railway.app/
2. Find your Socket.IO server project
3. Click on the service
4. Railway should automatically detect the new commit and redeploy
5. If not, click "Deploy" or "Redeploy" button

### Option 2: Manual Update via Railway CLI (if you have CLI installed)
```bash
railway login
railway link
railway up
```

### Option 3: Copy/Paste Code Changes (if Railway doesn't auto-deploy)

**File to update:** `server.js`

**Find this section** (around line 141-154):
```javascript
        if (error) {
          console.error('Error inserting message:', error);
          return callback({ error: 'Failed to send message' });
        }

        // Fetch sender info for the message
        const messageWithSender = {
          ...newMessage,
          sender_name: socket.userName,
          sender_role: socket.userRole,
        };

        // Emit message to all participants in the conversation room
        io.to(conversationId).emit('new_message', messageWithSender);
```

**Replace it with:**
```javascript
        if (error) {
          console.error('Error inserting message:', error);
          return callback({ error: 'Failed to send message' });
        }

        // Fetch reply_to message details if this is a reply
        let replyToDetails = null;
        if (replyToId) {
          const { data: replyToMessage } = await supabase
            .from('chat_messages')
            .select('id, sender_id, message_text, message_type, file_url, file_name')
            .eq('id', replyToId)
            .single();
          
          if (replyToMessage) {
            // Fetch sender name for the reply-to message
            const { data: replyToSenderProfile } = await supabase
              .from('user_profiles')
              .select('display_name')
              .eq('user_id', replyToMessage.sender_id)
              .single();
            
            replyToDetails = {
              id: replyToMessage.id,
              sender_name: replyToSenderProfile?.display_name || 'Unknown',
              message_text: replyToMessage.message_text,
              message_type: replyToMessage.message_type,
              file_url: replyToMessage.file_url,
              file_name: replyToMessage.file_name,
            };
          }
        }

        // Fetch sender info for the message
        const messageWithSender = {
          ...newMessage,
          sender_name: socket.userName,
          sender_role: socket.userRole,
          reply_to: replyToDetails,
        };

        // Emit message to all participants in the conversation room
        io.to(conversationId).emit('new_message', messageWithSender);
```

## What This Fix Does

When a user sends a reply to a message:
1. The server fetches the original message being replied to
2. The server fetches the sender's name of the original message
3. Includes this `reply_to` data in the Socket.IO broadcast
4. The UI now shows the reply correctly immediately, without needing a refresh

## Verification

After deploying:
1. Send a message in the chat
2. Reply to that message
3. The reply should show the "replying to" UI immediately
4. No page refresh needed

## Notes
- This change is backwards compatible
- If `replyToId` is `null`, the message sends normally (no reply)
- The server already uses `SUPABASE_SERVICE_ROLE_KEY`, so RLS is bypassed for these queries

