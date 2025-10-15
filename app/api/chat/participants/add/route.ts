import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    const server = createSupabaseServerClient();
    const { data: auth } = await server.auth.getUser();

    if (!auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, userIds } = body;

    if (!conversationId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Missing conversationId or userIds' }, { status: 400 });
    }

    console.log('[Add Participants] Request:', { conversationId, userIds });

    const supabase = createSupabaseServiceClient();

    // Verify conversation exists and requester is admin or participant
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('id, type')
      .eq('id', conversationId)
      .single();

    console.log('[Add Participants] Conversation lookup:', { conversation, convError });

    if (convError || !conversation) {
      console.error('[Add Participants] Conversation not found:', convError);
      return NextResponse.json({ error: 'Conversation not found', details: convError?.message }, { status: 404 });
    }

    if (conversation.type !== 'group') {
      return NextResponse.json({ error: 'Can only add participants to group chats' }, { status: 400 });
    }

    // Check if requester is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', auth.user.id)
      .single();

    const isAdmin = ['admin_staff', 'admin_of_admins'].includes(userProfile?.role || '');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can add participants' }, { status: 403 });
    }

    // Add participants
    const participants = userIds.map(userId => ({
      conversation_id: conversationId,
      user_id: userId,
      last_read_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('chat_participants')
      .insert(participants);

    if (insertError) {
      console.error('Error adding participants:', insertError);
      return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 });
    }

    // Fetch the names of added users for the response
    const { data: addedUsers } = await supabase
      .from('user_profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);

    return NextResponse.json({ 
      success: true,
      addedUsers: addedUsers || []
    });
  } catch (error: any) {
    console.error('Error in POST /api/chat/participants/add:', error);
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
  }
}

