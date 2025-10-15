# Message Deletion Feature Implementation Summary

## ✅ What Was Done

### 1. Database Schema (`docs/chat-deletion-schema.sql`)
- Created `chat_message_hidden` table for per-user message hiding ("Delete for me")
- Added soft delete columns to `chat_messages`: `deleted_for_all`, `deleted_at`, `deleted_by`
- Set up RLS policies for secure access control
- Created helper function `soft_delete_message()` for safe deletion

### 2. API Route (`app/api/chat/messages/delete/route.ts`)
- POST endpoint to handle both deletion types
- Validates user is participant in conversation
- **Delete for me**: Inserts record into `chat_message_hidden` table
- **Delete for everyone**: Soft deletes message (sets flags, replaces text, removes file URLs)
- Permission checks: Owner or admin can delete for everyone

### 3. Messages API Update (`app/api/chat/messages/[conversationId]/route.ts`)
- Now fetches and filters out hidden messages for each user
- Ensures "delete for me" messages don't appear in that user's message list

### 4. Chat Integration Hook (`lib/chat/useChatIntegration.ts`)
- Added `deleteMessage()` function
- Emits Socket.IO `delete_message` event for "delete for everyone"
- Updates local state immediately (optimistic UI)
- Added `message_deleted` socket event listener
- Updated Message interface to include `deleted_for_all`, `deleted_at`, `deleted_by`

### 5. Admin Chat Page (`app/admin/chat/page.tsx`)
- Updated `handleDeleteForMe()` to call `chatIntegration.deleteMessage()`
- Updated `handleDeleteForEveryone()` to call `chatIntegration.deleteMessage()`
- Both functions now use async/await for proper API communication

### 6. Promotor Chat Page (`app/promotors/chat/page.tsx`)
- Same updates as admin page
- Context menu already has "Löschen" option that triggers delete dialog
- Dialog presents both options based on message ownership

## 📋 What You Need to Do

### Step 1: Run SQL in Supabase
1. Go to Supabase Dashboard → SQL Editor
2. Open `docs/chat-deletion-schema.sql`
3. Copy the entire contents
4. Paste into SQL Editor and click "Run"
5. Verify no errors appear

### Step 2: Update Socket.IO Server on Railway
You need to add the `delete_message` event handler to your `server.js` on Railway.

**See the Socket.IO prompt below this document.**

### Step 3: Test the Feature
1. Open admin chat, send a message
2. Long-press (or double-click) the message → "Löschen"
3. Test "Löschen für mich" → message should disappear only for you
4. Test "Für alle löschen" → message should become "Diese Nachricht wurde gelöscht" for everyone
5. Test on promotor side too

## 🎯 How It Works

### Delete for Me (Löschen für mich)
1. API inserts row into `chat_message_hidden` table
2. Message stays in database, but filtered out when fetching messages for that user
3. No Socket.IO event (only affects current user)
4. Message immediately removed from local state

### Delete for Everyone (Für alle löschen)
1. API soft-deletes message (sets flags, clears content/files)
2. Socket.IO emits `message_deleted` event to conversation room
3. All connected clients replace message with placeholder text
4. Database keeps record but content is "Diese Nachricht wurde gelöscht"

## 🔐 Permissions
- **Delete for me**: Anyone can hide any message for themselves
- **Delete for everyone**: Only message sender or admins can delete for everyone

## 📝 Notes
- No time limit on deletion (as requested)
- File attachments are nullified in database but not physically deleted from Storage (can be added later)
- Soft delete preserves message history for audit/moderation
- Reply chains stay intact (replied-to deleted messages show placeholder)

