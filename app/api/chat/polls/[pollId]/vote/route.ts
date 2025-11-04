import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// POST: cast a vote (or switch vote for single-choice)
export async function POST(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { optionId } = await request.json();
    if (!optionId) return NextResponse.json({ error: 'Missing optionId' }, { status: 400 });

    const svc = createSupabaseServiceClient();

    // Verify that user is participant of the conversation owning this poll
    const { data: poll } = await svc
      .from('chat_polls')
      .select('id, conversation_id, allow_multiple')
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

    // If single-choice, remove other votes by this user first
    if (!poll.allow_multiple) {
      await svc
        .from('chat_poll_votes')
        .delete()
        .eq('poll_id', poll.id)
        .eq('user_id', user.id);
    }

    // Upsert vote
    const { error: voteErr } = await svc
      .from('chat_poll_votes')
      .insert({ poll_id: poll.id, option_id: optionId, user_id: user.id });
    if (voteErr) return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/chat/polls/[pollId]/vote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: remove a vote (for multi-choice or unselect)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const optionId = searchParams.get('optionId');
    if (!optionId) return NextResponse.json({ error: 'Missing optionId' }, { status: 400 });

    const svc = createSupabaseServiceClient();

    // Verify poll exists and user is participant
    const { data: poll } = await svc
      .from('chat_polls')
      .select('id, conversation_id')
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

    const { error: delErr } = await svc
      .from('chat_poll_votes')
      .delete()
      .eq('poll_id', poll.id)
      .eq('option_id', optionId)
      .eq('user_id', user.id);
    if (delErr) return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/chat/polls/[pollId]/vote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


