import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// PATCH: Update group conversation profile picture
export async function PATCH(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
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

    const isAdmin = userProfile?.role && ['admin_staff', 'admin_of_admins'].includes(userProfile.role);
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can update group pictures' }, { status: 403 });
    }

    const { conversationId } = params;
    const body = await request.json();
    const { profilePictureUrl } = body;

    if (!profilePictureUrl) {
      return NextResponse.json({ error: 'Profile picture URL is required' }, { status: 400 });
    }

    // Use service client for update
    const svc = createSupabaseServiceClient();

    // Verify conversation exists and is a group
    const { data: conversation, error: fetchError } = await svc
      .from('chat_conversations')
      .select('type')
      .eq('id', conversationId)
      .single();

    if (fetchError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.type !== 'group') {
      return NextResponse.json({ error: 'Only group conversations can have profile pictures' }, { status: 400 });
    }

    // Update profile picture
    const { error: updateError } = await svc
      .from('chat_conversations')
      .update({ profile_picture_url: profilePictureUrl })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating group picture:', updateError);
      return NextResponse.json({ error: 'Failed to update group picture' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profilePictureUrl });
  } catch (error) {
    console.error('Error in PATCH /api/chat/conversations/[conversationId]/picture:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

