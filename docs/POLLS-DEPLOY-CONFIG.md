# Polls Deployment & Configuration

1) Supabase SQL
- Execute `docs/chat-system-schema.sql` (if not already applied).
- Execute `docs/chat-polls-schema.sql` to create `chat_polls`, `chat_poll_options`, `chat_poll_votes`, and add `chat_messages.poll_id`.

2) Environment variables (Next.js client)
- `NEXT_PUBLIC_SOCKET_URL=https://your-socket-host` (no trailing slash)

3) Environment variables (Standalone Socket server)
- `PORT=3000`
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `ALLOWED_ORIGIN=https://your-vercel-domain` (include previews as needed)

4) CORS
- Ensure the socket server allows your deployed origins. Client uses default Socket.IO path `/socket.io`.

5) Verification
- Open two browsers (admin + promotor), same conversation.
- Create poll → both receive instantly.
- Vote from promotor → bars/counts update in real-time.
- Refresh → poll state restored from `/api/chat/messages/[conversationId]`.

