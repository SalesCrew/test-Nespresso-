import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.conversationId;

    // Fetch conversation
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('id, type, name, description, is_read_only, profile_picture_url, created_at, updated_at')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify user is a participant
    const { data: participant, error: participantError } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Fetch participants with profile data
    const { data: participants, error: participantsError } = await supabase
      .from('chat_participants')
      .select(`
        user_id,
        user_profiles!inner (
          display_name,
          role,
          profile_picture_url
        )
      `)
      .eq('conversation_id', conversationId);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
    }

    // Map participants
    const mappedParticipants = (participants || []).map((p: any) => ({
      user_id: p.user_id,
      display_name: p.user_profiles?.display_name || 'Unknown',
      role: p.user_profiles?.role || 'promotor',
      profile_picture_url: p.user_profiles?.profile_picture_url || null,
    }));

    // For direct chats, get the other participant's profile picture
    let profilePictureUrl = conversation.profile_picture_url;
    if (conversation.type === 'direct' && mappedParticipants.length === 2) {
      const otherParticipant = mappedParticipants.find((p: any) => p.user_id !== user.id);
      if (otherParticipant && !profilePictureUrl) {
        profilePictureUrl = otherParticipant.profile_picture_url;
      }
    }

    return NextResponse.json({
      conversation: {
        ...conversation,
        is_group: conversation.type === 'group',
        profile_picture_url: profilePictureUrl,
        participants: mappedParticipants,
      },
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

