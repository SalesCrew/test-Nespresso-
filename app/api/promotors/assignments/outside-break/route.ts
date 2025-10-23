import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// POST: record an out-of-window break timestamp for a specific assignment
export async function POST(req: Request) {
  try {
    const server = createSupabaseServerClient();
    const { data: { user } } = await server.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { assignmentId, reportedAt } = body || {};
    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
    }

    // Use provided reportedAt or current time; store as timestamptz (UTC). Display can use Europe/Vienna.
    const timestamp: string = reportedAt || new Date().toISOString();

    const { error } = await server
      .from('assignment_outside_breaks')
      .insert({ assignment_id: assignmentId, user_id: user.id, reported_at: timestamp });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


