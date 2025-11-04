import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// GET: poll details with votes grouped by option (user_ids only)
export async function GET(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = createSupabaseServiceClient();

    // Load poll and verify participation
    const { data: poll } = await svc
      .from('chat_polls')
      .select('id, question, conversation_id')
      .eq('id', params.pollId)
      .single();
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });

    const { data: participant } = await svc
      .from('chat_participants')
      .select('conversation_id')
      .eq('conversation_id', poll.conversation_id)
      .eq('user_id', user.id)
      .single();
    if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

    const { data: options } = await svc
      .from('chat_poll_options')
      .select('id, option_text, order_index')
      .eq('poll_id', poll.id)
      .order('order_index');

    const { data: votes } = await svc
      .from('chat_poll_votes')
      .select('option_id, user_id, created_at')
      .eq('poll_id', poll.id);

    const byOption: Record<string, { id: string; text: string; voters: Array<{ user_id: string; created_at: string }> }> = {};
    (options || []).forEach(o => { byOption[o.id] = { id: o.id, text: o.option_text, voters: [] }; });
    (votes || []).forEach(v => {
      if (!byOption[v.option_id]) return;
      byOption[v.option_id].voters.push({ user_id: v.user_id, created_at: v.created_at });
    });

    return NextResponse.json({
      poll: { id: poll.id, question: poll.question },
      options: Object.values(byOption)
    });
  } catch (error) {
    console.error('Error in GET /api/chat/polls/[pollId]/votes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


