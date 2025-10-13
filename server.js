const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? 'http://localhost:3000' : '*',
      methods: ['GET', 'POST'],
    },
  });

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return next(new Error('Invalid authentication token'));
      }

      // Attach user info to socket
      socket.userId = user.id;
      socket.userEmail = user.email;
      
      // Fetch user profile for role information
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, display_name')
        .eq('user_id', user.id)
        .single();
      
      socket.userRole = profile?.role || 'promotor';
      socket.userName = profile?.display_name || user.email;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Socket.IO connection handler
  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userName})`);

    // Join user to their conversation rooms
    try {
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('conversation_id')
        .eq('user_id', socket.userId);
      
      if (participants) {
        participants.forEach(({ conversation_id }) => {
          socket.join(conversation_id);
        });
        console.log(`User ${socket.userName} joined ${participants.length} conversation rooms`);
      }
    } catch (error) {
      console.error('Error joining conversation rooms:', error);
    }

    // Handle sending messages
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, messageText, messageType = 'text', fileUrl = null, fileName = null, replyToId = null } = data;

        // Validate that user is participant in conversation
        const { data: participant } = await supabase
          .from('chat_participants')
          .select('conversation_id')
          .eq('conversation_id', conversationId)
          .eq('user_id', socket.userId)
          .single();

        if (!participant) {
          return callback({ error: 'Not a participant in this conversation' });
        }

        // Check if conversation is read-only and user is not admin
        const { data: conversation } = await supabase
          .from('chat_conversations')
          .select('is_read_only')
          .eq('id', conversationId)
          .single();

        if (conversation?.is_read_only && !['admin_staff', 'admin_of_admins'].includes(socket.userRole)) {
          return callback({ error: 'Cannot send messages to read-only conversation' });
        }

        // Insert message into database
        const { data: newMessage, error } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: socket.userId,
            message_text: messageText,
            message_type: messageType,
            file_url: fileUrl,
            file_name: fileName,
            reply_to_id: replyToId,
          })
          .select()
          .single();

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

        // Send success callback to sender
        callback({ success: true, message: messageWithSender });
      } catch (error) {
        console.error('Error sending message:', error);
        callback({ error: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', async ({ conversationId }) => {
      try {
        // Verify user is participant
        const { data: participant } = await supabase
          .from('chat_participants')
          .select('conversation_id')
          .eq('conversation_id', conversationId)
          .eq('user_id', socket.userId)
          .single();

        if (participant) {
          socket.to(conversationId).emit('user_typing', {
            userId: socket.userId,
            userName: socket.userName,
            conversationId,
          });
        }
      } catch (error) {
        console.error('Error handling typing_start:', error);
      }
    });

    socket.on('typing_stop', async ({ conversationId }) => {
      try {
        socket.to(conversationId).emit('user_stopped_typing', {
          userId: socket.userId,
          conversationId,
        });
      } catch (error) {
        console.error('Error handling typing_stop:', error);
      }
    });

    // Handle marking messages as read
    socket.on('mark_read', async ({ conversationId }, callback) => {
      try {
        // Update last_read_at for this user in this conversation
        const { error } = await supabase
          .from('chat_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('user_id', socket.userId);

        if (error) {
          console.error('Error marking as read:', error);
          return callback({ error: 'Failed to mark as read' });
        }

        // Notify other participants that this user has read messages
        socket.to(conversationId).emit('user_read', {
          userId: socket.userId,
          conversationId,
        });

        callback({ success: true });
      } catch (error) {
        console.error('Error marking conversation as read:', error);
        callback({ error: 'Failed to mark as read' });
      }
    });

    // Handle user joining a new conversation (for dynamic group creation)
    socket.on('join_conversation', ({ conversationId }) => {
      socket.join(conversationId);
      console.log(`User ${socket.userName} joined conversation ${conversationId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId} (${socket.userName})`);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server is running`);
    });
});

