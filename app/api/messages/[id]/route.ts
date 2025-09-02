import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const server = createSupabaseServerClient();
    const { data: { user }, error: authError } = await server.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = params.id;
    const svc = createSupabaseServiceClient();

    // Delete the message (this will cascade to delete recipients)
    const { error } = await svc
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user.id); // Only allow deleting own messages

    if (error) {
      console.error('Error deleting message:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (e: any) {
    console.error('Server error in message DELETE:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
