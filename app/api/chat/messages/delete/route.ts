import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// DELETE: Handle message deletion (for me or for everyone)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, conversationId, deleteForEveryone } = body;

    if (!messageId || !conversationId) {
      return NextResponse.json({ error: 'Missing messageId or conversationId' }, { status: 400 });
    }

    // Verify user is a participant in the conversation
    const { data: participant } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
    }

    // Get the message to check ownership
    const { data: message } = await supabase
      .from('chat_messages')
      .select('sender_id, file_url')
      .eq('id', messageId)
      .single();

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Get user role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = userProfile?.role || 'promotor';
    const isAdmin = ['admin_staff', 'admin_of_admins'].includes(userRole);
    const isOwner = message.sender_id === user.id;

    if (deleteForEveryone) {
      // Delete for everyone - only allowed if user is the sender or is an admin
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Not authorized to delete for everyone' }, { status: 403 });
      }

      // Use service client to bypass RLS for soft delete
      const svc = createSupabaseServiceClient();
      
      // Soft delete the message
      const { error: updateError } = await svc
        .from('chat_messages')
        .update({
          deleted_for_all: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          message_text: 'Diese Nachricht wurde gelöscht...',
          file_url: null,
          file_name: null,
        })
        .eq('id', messageId);

      if (updateError) {
        console.error('Error soft deleting message:', updateError);
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
      }

      // TODO: Delete file from Supabase Storage if it exists
      // This would require additional logic to extract the file path from the signed URL
      // and call supabase.storage.from('chat-attachments').remove([filePath])

      return NextResponse.json({ 
        success: true, 
        deletedForEveryone: true,
        messageId,
        conversationId 
      });
    } else {
      // Delete for me - hide the message for this user only
      const { error: insertError } = await supabase
        .from('chat_message_hidden')
        .insert({
          message_id: messageId,
          user_id: user.id,
        });

      if (insertError) {
        // Check if already hidden
        if (insertError.code === '23505') { // unique_violation
          return NextResponse.json({ 
            success: true, 
            deletedForEveryone: false,
            messageId,
            conversationId,
            alreadyHidden: true 
          });
        }
        console.error('Error hiding message:', insertError);
        return NextResponse.json({ error: 'Failed to hide message' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        deletedForEveryone: false,
        messageId,
        conversationId 
      });
    }
  } catch (error) {
    console.error('Error in POST /api/chat/messages/delete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

