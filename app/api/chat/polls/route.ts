import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// POST: Create a new poll and an associated chat message (admin only)
export async function POST(request: NextRequest) {
  try {
    const server = createSupabaseServerClient();
    const { data: { user }, error: authError } = await server.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const svc = createSupabaseServiceClient();

    // Check role
    const { data: profile } = await svc
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    const isAdmin = ['admin_staff', 'admin_of_admins'].includes(profile?.role || '');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { conversation_id, question, options, allow_multiple } = body as {
      conversation_id: string; question: string; options: string[]; allow_multiple?: boolean;
    };

    if (!conversation_id || !question || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Verify admin is participant in conversation
    const { data: participant } = await svc
      .from('chat_participants')
      .select('conversation_id')
      .eq('conversation_id', conversation_id)
      .eq('user_id', user.id)
      .single();
    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Create poll header
    const { data: poll, error: pollErr } = await svc
      .from('chat_polls')
      .insert({
        conversation_id,
        created_by: user.id,
        question: String(question).trim(),
        allow_multiple: !!allow_multiple,
      })
      .select('*')
      .single();
    if (pollErr || !poll) {
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
    }

    // Create poll options
    const rows = options.map((text: string, idx: number) => ({
      poll_id: poll.id,
      option_text: String(text).trim(),
      order_index: idx,
    }));
    const { data: createdOptions, error: optErr } = await svc
      .from('chat_poll_options')
      .insert(rows)
      .select('*');
    if (optErr) {
      return NextResponse.json({ error: 'Failed to create poll options' }, { status: 500 });
    }

    // Create chat message referencing poll
    const { data: message, error: msgErr } = await svc
      .from('chat_messages')
      .insert({
        conversation_id,
        sender_id: user.id,
        message_type: 'poll',
        message_text: String(question).trim(),
        poll_id: poll.id,
      })
      .select('*')
      .single();
    if (msgErr || !message) {
      return NextResponse.json({ error: 'Failed to create poll message' }, { status: 500 });
    }

    // Update conversation timestamp
    await svc.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversation_id);

    return NextResponse.json({
      poll,
      options: createdOptions || [],
      message,
    });
  } catch (error) {
    console.error('Error in POST /api/chat/polls:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


