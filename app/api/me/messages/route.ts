import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const server = createSupabaseServerClient();
    const { data: { user }, error: authError } = await server.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    
    const { data: messages, error } = await svc
      .from('my_messages')
      .select('*');

    if (error) {
      console.error('Error fetching user messages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Found messages from view:', messages?.length || 0);
    console.log('Messages data from view:', messages);

    return NextResponse.json({ messages: messages || [] });

  } catch (e: any) {
    console.error('Server error in user messages API:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
