# Real-Time Chat Integration Guide

## ✅ Completed Components

### Backend Infrastructure
1. **Database Schema** (`docs/chat-system-schema.sql`)
   - `chat_conversations` table
   - `chat_participants` table
   - `chat_messages` table
   - RLS policies for admins and promotors
   - Automatic timestamp updates
   - **ACTION REQUIRED**: Execute this SQL in Supabase

2. **Socket.IO Server** (`server.js`)
   - Custom Next.js server with Socket.IO
   - Authentication middleware
   - Event handlers: `send_message`, `typing_start`, `typing_stop`, `mark_read`, `join_conversation`
   - Message persistence to Supabase
   - **READY TO USE**: Just run `npm run dev`

3. **API Routes**
   - `/api/chat/conversations` - GET (fetch conversations) & POST (create conversation)
   - `/api/chat/messages/[conversationId]` - GET (fetch message history with pagination)
   - `/api/chat/promotors` - GET (fetch promotor list for admin group creation)

4. **Client-Side Infrastructure**
   - `lib/socket/SocketContext.tsx` - React context for Socket.IO connection
   - `lib/chat/useChatIntegration.ts` - Custom hook with all chat functionality
   - SocketProvider wrapped in both admin and promotor layouts

### Package Configuration
- Socket.IO packages installed
- `package.json` scripts updated to use custom server

## 🔄 Partial Integration

### Admin Chat Page (`app/admin/chat/page.tsx`)
**Completed:**
- Imports added for `useChatIntegration` and `useSocket`
- Chat integration hook initialized
- Promotors list fetching for group creation
- Messages fetched when conversation selected
- Auto mark-as-read when conversation opened

**Still TODO:**
1. Replace mock `contacts` data with `chatIntegration.conversations`
2. Replace mock `messages` data with `chatIntegration.messages[selectedChat.id]`
3. Update send message handler to use `chatIntegration.sendMessage()`
4. Update group creation handler (line ~1377) to call `chatIntegration.createConversation()`
5. Remove readOnly toggle from group creation UI (line 1347-1363)
6. Map `promotorsList` to the group creation contact selector
7. Add typing indicators using `chatIntegration.startTyping()` / `stopTyping()`
8. Display unread badges from `conversation.unread_count`

### Promotor Chat Page (`app/promotors/chat/page.tsx`)
**Still TODO:**
1. Add imports: `useChatIntegration`, `useSocket`
2. Initialize chat integration hook
3. Replace mock `contacts` with `chatIntegration.conversations`
4. Replace mock `messages` with `chatIntegration.messages[selectedChat.id]`
5. Update send message handler
6. Add check for `conversation.is_read_only` and disable input for group chats
7. Remove group creation UI (promotors can't create groups)
8. Add lock icon/badge on read-only group chats
9. Filter conversations to only show admins + group chats (no other promotors)

## 📋 Detailed Integration Steps

### Admin Chat Page

#### Step 1: Replace Mock Contacts (line ~596-602)
**Find:**
```javascript
const [contacts, setContacts] = useState<Contact[]>([
  { id: 1, name: "Lisa Müller", lastMessage: "Alles klar, bis später!", ... },
  // ... more mock data
]);
```

**Replace with:**
```javascript
// Convert chatIntegration.conversations to Contact format
const contacts = chatIntegration.conversations.map(conv => ({
  id: conv.id, // Note: conversations use UUID strings, may need to handle conversion
  name: conv.name || 'Unknown',
  lastMessage: conv.last_message?.text || '',
  time: conv.last_message?.created_at ? new Date(conv.last_message.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '',
  unread: conv.unread_count,
  online: false, // Can be enhanced with presence tracking
  pinned: false,
  markedUnread: false,
  isGroup: conv.is_group,
  profileImage: null,
  description: conv.description,
  members: conv.participants.map(p => p.user_id), // May need ID conversion
  readOnly: conv.is_read_only,
}));
```

#### Step 2: Replace Mock Messages (line ~560-592)
**Find:**
```javascript
const [messages, setMessages] = useState<Record<number, Message[]>>({
  1: [{ id: 1, sender: "Lisa Müller", content: "Hey!", ... }],
  // ... more mock data
});
```

**Replace with:**
```javascript
// Get messages for selected conversation
const conversationMessages = selectedChat 
  ? (chatIntegration.messages[selectedChat.id] || []).map(msg => ({
      id: msg.id,
      sender: msg.sender_name,
      content: msg.message_text,
      time: new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      own: msg.sender_id === currentUserId, // Need to get current user ID
      edited: msg.edited,
      reaction: undefined, // Can be added later
      photo: msg.message_type === 'photo' ? msg.file_url : undefined,
      pdf: msg.message_type === 'pdf' ? msg.file_url : undefined,
      pdfName: msg.message_type === 'pdf' ? msg.file_name : undefined,
      type: msg.message_type,
      replyTo: msg.reply_to ? {
        id: msg.reply_to.id,
        sender: msg.reply_to.sender_name,
        content: msg.reply_to.message_text,
        photo: msg.reply_to.message_type === 'photo' ? msg.reply_to.file_url : undefined,
        pdf: msg.reply_to.message_type === 'pdf' ? msg.reply_to.file_url : undefined,
        pdfName: msg.reply_to.message_type === 'pdf' ? msg.reply_to.file_name : undefined,
      } : undefined,
    }))
  : [];
```

#### Step 3: Update Send Message Handler
**Find the send button click handler (around line 2500+) and update to:**
```javascript
const handleSendMessage = async () => {
  if (!messageInput.trim() || !selectedChat) return;

  try {
    await chatIntegration.sendMessage(
      selectedChat.id,
      messageInput.trim(),
      replyingTo ? replyingTo.id : null
    );
    
    setMessageInput('');
    setReplyingTo(null);
    
    // Scroll to bottom
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  } catch (error) {
    console.error('Failed to send message:', error);
    // Show error to user
  }
};
```

#### Step 4: Update Group Creation Handler (line ~1377-1400)
**Find:**
```javascript
onClick={() => {
  if (groupCreationPopup.groupName.trim()) {
    // Create new group chat
    const newGroupId = Date.now();
    // ... mock implementation
  }
}}
```

**Replace with:**
```javascript
onClick={async () => {
  if (!groupCreationPopup.groupName.trim()) return;
  
  try {
    const newConversation = await chatIntegration.createConversation(
      'group',
      groupCreationPopup.selectedContacts, // These should be user_id strings
      groupCreationPopup.groupName,
      groupCreationPopup.groupDescription || undefined
    );
    
    // Close popup and select new conversation
    setGroupCreationPopup({ 
      show: false, 
      selectedContacts: [], 
      searchQuery: '', 
      step: 1, 
      groupName: '', 
      groupDescription: '', 
      profileImage: null, 
      readOnly: false 
    });
    
    // Select the new conversation
    setSelectedChat({
      id: newConversation.id,
      name: newConversation.name,
      lastMessage: '',
      time: '',
      unread: 0,
      online: false,
      isGroup: true,
      readOnly: true,
    });
  } catch (error) {
    console.error('Failed to create group:', error);
    // Show error to user
  }
}}
```

#### Step 5: Remove Read-Only Toggle (line 1347-1363)
**Find and DELETE:**
```javascript
{/* Read-Only Option with Switch */}
<div className="flex items-center justify-between p-3 border-t border-gray-100">
  <div className="flex-1">
    <label className="block text-sm font-medium text-gray-800 mb-0.5">
      Nur Admins dürfen schreiben
    </label>
    <p className="text-xs text-gray-500 mt-0.5">...</p>
  </div>
  <Switch
    className={cn(...)}
    checked={groupCreationPopup.readOnly}
    onCheckedChange={(checked: boolean) => ...}
    ...
  />
</div>
```

**Reason:** All group chats are automatically read-only for promotors (set in API).

#### Step 6: Map Promotors List to Contact Selector (line ~1203-1244)
**Find:**
```javascript
{contacts
  .filter(contact => 
    contact.name.toLowerCase().includes(groupCreationPopup.searchQuery.toLowerCase())
  )
  .map(contact => (
    // ... contact selection UI
  ))
}
```

**Replace with:**
```javascript
{promotorsList
  .filter(promotor => 
    promotor.display_name.toLowerCase().includes(groupCreationPopup.searchQuery.toLowerCase())
  )
  .map(promotor => (
    <div 
      key={promotor.user_id}
      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
      onClick={() => {
        setGroupCreationPopup(prev => ({
          ...prev,
          selectedContacts: prev.selectedContacts.includes(promotor.user_id)
            ? prev.selectedContacts.filter(id => id !== promotor.user_id)
            : [...prev.selectedContacts, promotor.user_id]
        }));
      }}
    >
      <div className="flex items-center">
        <div 
          className={`mr-3 w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${
            groupCreationPopup.selectedContacts.includes(promotor.user_id) 
              ? 'border-transparent' 
              : 'border-gray-300'
          }`}
          style={groupCreationPopup.selectedContacts.includes(promotor.user_id) 
            ? { backgroundColor: '#22C55E' }
            : {}
          }
        >
          {groupCreationPopup.selectedContacts.includes(promotor.user_id) && (
            <Check className="w-2.5 h-2.5 text-white" />
          )}
        </div>
        <span className="text-sm text-gray-800">{promotor.display_name}</span>
      </div>
    </div>
  ))
}
```

#### Step 7: Add Typing Indicators
**In the message input onChange handler, add:**
```javascript
<input
  type="text"
  placeholder="Nachricht schreiben..."
  value={messageInput}
  onChange={(e) => {
    setMessageInput(e.target.value);
    
    // Emit typing indicator
    if (selectedChat && e.target.value.length > 0) {
      chatIntegration.startTyping(selectedChat.id);
      
      // Auto-stop after 2 seconds
      clearTimeout(typingTimeout);
      setTypingTimeout(setTimeout(() => {
        chatIntegration.stopTyping(selectedChat.id);
      }, 2000));
    }
  }}
  onBlur={() => {
    if (selectedChat) {
      chatIntegration.stopTyping(selectedChat.id);
    }
  }}
/>
```

**Display typing indicator in chat header:**
```javascript
{chatIntegration.typingUsers[selectedChat.id]?.size > 0 && (
  <span className="text-xs text-gray-500">typing...</span>
)}
```

### Promotor Chat Page

Similar steps to admin, but with these key differences:

1. **Filter Conversations:**
```javascript
const conversations = chatIntegration.conversations.filter(conv => {
  // Show only: direct chats with admins + group chats
  // Don't show: direct chats with other promotors
  if (conv.type === 'group') return true;
  
  // For direct chats, check if other participant is admin
  const otherParticipant = conv.participants.find(p => p.user_id !== currentUserId);
  return otherParticipant?.role && ['admin_staff', 'admin_of_admins'].includes(otherParticipant.role);
});
```

2. **Disable Input for Read-Only Chats:**
```javascript
const isInputDisabled = selectedChat?.isGroup && selectedChat?.readOnly;

<input
  type="text"
  placeholder={isInputDisabled ? "Nur Lesen (Nur Admins können schreiben)" : "Nachricht schreiben..."}
  value={messageInput}
  onChange={(e) => setMessageInput(e.target.value)}
  disabled={isInputDisabled}
  className={isInputDisabled ? 'opacity-50 cursor-not-allowed' : ''}
/>
```

3. **Show Lock Icon on Read-Only Groups:**
```javascript
{selectedChat.isGroup && selectedChat.readOnly && (
  <Lock className="h-4 w-4 text-gray-400 ml-2" />
)}
```

4. **Remove Group Creation UI:**
Delete the `<SquarePen>` icon and group creation popup entirely.

## 🚀 Testing Checklist

After integration:

1. **Database**
   - [ ] Execute `chat-system-schema.sql` in Supabase
   - [ ] Verify tables created
   - [ ] Test RLS policies with admin and promotor accounts

2. **Server**
   - [ ] Run `npm run dev` - server should start on port 3000
   - [ ] Check console for "Socket.IO server is running"
   - [ ] Check for authentication errors

3. **Admin Features**
   - [ ] Login as admin
   - [ ] Create a direct chat with a promotor
   - [ ] Send messages
   - [ ] Create a group chat with multiple promotors
   - [ ] Verify group is read-only for promotors
   - [ ] Test typing indicators
   - [ ] Check unread counts

4. **Promotor Features**
   - [ ] Login as promotor
   - [ ] See direct chat with admin
   - [ ] Send messages in direct chat
   - [ ] See group chats
   - [ ] Verify can't send messages in group chats
   - [ ] Verify can't see other promotors in contact list
   - [ ] Verify no group creation button

5. **Real-Time**
   - [ ] Open admin and promotor in two browsers
   - [ ] Send message from admin, verify promotor receives instantly
   - [ ] Test typing indicators
   - [ ] Test message persistence (refresh page)

## 📝 Notes

- The existing UI is fully preserved - only data sources change
- All photo/PDF/attachment editors remain functional
- Message reactions, editing, deletion UI remain functional
- The integration is designed to be non-breaking - the app should still work with mock data during migration
- Consider adding presence tracking (online/offline status) in a future iteration
- File uploads through Socket.IO can be added later
- Consider implementing message pagination for very long conversations

