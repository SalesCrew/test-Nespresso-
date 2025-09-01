import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const server = createSupabaseServerClient();
    const { data: { user }, error: authError } = await server.auth.getUser();

    console.log('Auth check - user:', user?.id, 'error:', authError?.message);

    if (authError || !user) {
      console.error('Auth failed:', authError?.message || 'No user');
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    const svc = createSupabaseServiceClient();

    // Get messages for this user using the view
    console.log('Fetching messages for user:', user.id);
    
    // First check if the view exists and what data is in the base tables
    const { data: allMessages, error: allError } = await svc
      .from('messages')
      .select('*');
    
    const { data: allRecipients, error: recipError } = await svc
      .from('message_recipients')
      .select('*')
      .eq('recipient_user_id', user.id);
    
    console.log('All messages in database:', allMessages?.length || 0);
    console.log('Recipients for this user:', allRecipients?.length || 0);
    console.log('Recipient data:', allRecipients);
    
    // Try to fetch directly from tables with joins instead of view
    const { data: messagesWithJoin, error: joinError } = await svc
      .from('message_recipients')
      .select(`
        *,
        messages!inner(
          id,
          sender_id,
          message_text,
          message_type,
          scheduled_send_time,
          created_at,
          sent_at,
          status
        )
      `)
      .eq('recipient_user_id', user.id)
      .eq('messages.status', 'sent')
      .order('messages.created_at', { ascending: false });

    console.log('Messages with join:', messagesWithJoin?.length || 0);
    console.log('Join data:', messagesWithJoin);

    if (joinError) {
      console.error('Error with join query:', joinError);
    }

    // Format the messages for the frontend
    const formattedMessages = (messagesWithJoin || []).map(mr => {
      // Handle both nested and flat structures
      const messageData = mr.messages || mr;
      return {
        id: messageData.id,
        sender_id: messageData.sender_id,
        message_text: messageData.message_text,
        message_type: messageData.message_type,
        read_at: mr.read_at,
        acknowledged_at: mr.acknowledged_at,
        created_at: messageData.created_at,
        sent_at: messageData.sent_at,
        sender_name: 'Admin' // We'll add this later from user_profiles
      };
    });

    console.log('Formatted messages:', formattedMessages);

    return NextResponse.json({ messages: formattedMessages });

  } catch (e: any) {
    console.error('Server error in user messages API:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
