import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET: Fetch user's conversations with participants, last message, and unread count
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = userProfile?.role || 'promotor';
    const isAdmin = ['admin_staff', 'admin_of_admins'].includes(userRole);

    // Fetch conversations where user is a participant
    const { data: participantData, error: participantError } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (participantError) {
      console.error('Error fetching participants:', participantError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    const conversationIds = participantData?.map(p => p.conversation_id) || [];

    if (conversationIds.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Fetch conversation details
    const { data: conversations, error: conversationsError } = await supabase
      .from('chat_conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Fetch participants for all conversations
    const { data: allParticipants, error: allParticipantsError } = await supabase
      .from('chat_participants')
      .select('conversation_id, user_id, last_read_at')
      .in('conversation_id', conversationIds);

    if (allParticipantsError) {
      console.error('Error fetching all participants:', allParticipantsError);
    }

    // Fetch user profiles for all participants
    const participantUserIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, role')
      .in('user_id', participantUserIds);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
    }

    // Fetch last message for each conversation
    const { data: lastMessages, error: lastMessagesError } = await supabase
      .from('chat_messages')
      .select('conversation_id, message_text, message_type, created_at, sender_id')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    if (lastMessagesError) {
      console.error('Error fetching last messages:', lastMessagesError);
    }

    // Get unread counts for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations?.map(async (conv) => {
        // Get participants for this conversation
        const convParticipants = allParticipants?.filter(p => p.conversation_id === conv.id) || [];
        
        // Get participant details with profiles
        const participantDetails = convParticipants.map(p => {
          const profile = userProfiles?.find(up => up.user_id === p.user_id);
          return {
            user_id: p.user_id,
            display_name: profile?.display_name || 'Unknown',
            role: profile?.role || 'promotor',
            last_read_at: p.last_read_at,
          };
        });

        // Get current user's last_read_at
        const currentUserParticipant = convParticipants.find(p => p.user_id === user.id);
        const lastReadAt = currentUserParticipant?.last_read_at || new Date(0).toISOString();

        // Count unread messages
        const { count: unreadCount } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', user.id) // Don't count own messages
          .gt('created_at', lastReadAt);

        // Get last message for this conversation
        const lastMessage = lastMessages?.find(m => m.conversation_id === conv.id);
        const lastMessageSender = userProfiles?.find(up => up.user_id === lastMessage?.sender_id);

        // For direct chats, find the other participant
        let conversationName = conv.name;
        let isGroup = conv.type === 'group';

        if (conv.type === 'direct' && !conversationName) {
          const otherParticipant = participantDetails.find(p => p.user_id !== user.id);
          conversationName = otherParticipant?.display_name || 'Unknown User';
        }

        return {
          id: conv.id,
          type: conv.type,
          name: conversationName,
          description: conv.description,
          is_read_only: conv.is_read_only,
          created_by: conv.created_by,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          participants: participantDetails,
          last_message: lastMessage ? {
            text: lastMessage.message_text,
            type: lastMessage.message_type,
            created_at: lastMessage.created_at,
            sender_name: lastMessageSender?.display_name || 'Unknown',
            sender_id: lastMessage.sender_id,
          } : null,
          unread_count: unreadCount || 0,
          is_group: isGroup,
        };
      }) || []
    );

    return NextResponse.json({ conversations: conversationsWithDetails });
  } catch (error) {
    console.error('Error in GET /api/chat/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = userProfile?.role || 'promotor';
    const isAdmin = ['admin_staff', 'admin_of_admins'].includes(userRole);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can create conversations' }, { status: 403 });
    }

    const body = await request.json();
    const { type, name, description, participantIds } = body;

    // Validate input
    if (!type || !['direct', 'group'].includes(type)) {
      return NextResponse.json({ error: 'Invalid conversation type' }, { status: 400 });
    }

    if (type === 'group' && !name) {
      return NextResponse.json({ error: 'Group conversations require a name' }, { status: 400 });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: 'At least one participant is required' }, { status: 400 });
    }

    // For direct chats, check if conversation already exists
    if (type === 'direct' && participantIds.length === 1) {
      const otherUserId = participantIds[0];
      
      // Find existing direct conversation between these two users
      const { data: existingParticipants } = await supabase
        .from('chat_participants')
        .select('conversation_id')
        .in('user_id', [user.id, otherUserId]);

      if (existingParticipants && existingParticipants.length > 0) {
        // Find conversation where both users are participants
        const conversationCounts = existingParticipants.reduce((acc, p) => {
          acc[p.conversation_id] = (acc[p.conversation_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const existingConvId = Object.keys(conversationCounts).find(
          convId => conversationCounts[convId] === 2
        );

        if (existingConvId) {
          // Check if it's a direct conversation
          const { data: existingConv } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('id', existingConvId)
            .eq('type', 'direct')
            .single();

          if (existingConv) {
            return NextResponse.json({ 
              conversation: existingConv, 
              existing: true 
            });
          }
        }
      }
    }

    // Create new conversation
    const { data: newConversation, error: conversationError } = await supabase
      .from('chat_conversations')
      .insert({
        type,
        name: type === 'group' ? name : null,
        description: description || null,
        is_read_only: type === 'group', // Groups are always read-only for promotors
        created_by: user.id,
      })
      .select()
      .single();

    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Add participants (creator + selected users)
    const participantsToAdd = [user.id, ...participantIds].filter(
      (id, index, self) => self.indexOf(id) === index // Remove duplicates
    );

    const { error: participantsError } = await supabase
      .from('chat_participants')
      .insert(
        participantsToAdd.map(userId => ({
          conversation_id: newConversation.id,
          user_id: userId,
        }))
      );

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      // Rollback: delete the conversation
      await supabase.from('chat_conversations').delete().eq('id', newConversation.id);
      return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 });
    }

    return NextResponse.json({ conversation: newConversation, existing: false }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/chat/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

