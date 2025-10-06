import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// GET: Fetch note for a promotor
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  
  if (!auth.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const svc = createSupabaseServiceClient();
  const promotorUserId = params.id;

  try {
    // Get the most recent note for this promotor
    const { data, error } = await svc
      .from('promotor_notes')
      .select('*')
      .eq('promotor_user_id', promotorUserId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ note: data });
  } catch (error: any) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create or update note for a promotor
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  
  if (!auth.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const svc = createSupabaseServiceClient();
  const promotorUserId = params.id;
  const { note_text } = await req.json();

  try {
    // Check if a note already exists for this promotor
    const { data: existingNote } = await svc
      .from('promotor_notes')
      .select('id')
      .eq('promotor_user_id', promotorUserId)
      .maybeSingle();

    if (existingNote) {
      // Update existing note
      const { data, error } = await svc
        .from('promotor_notes')
        .update({
          note_text,
          admin_user_id: auth.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingNote.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ note: data });
    } else {
      // Create new note
      const { data, error } = await svc
        .from('promotor_notes')
        .insert({
          promotor_user_id: promotorUserId,
          admin_user_id: auth.user.id,
          note_text
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ note: data });
    }
  } catch (error: any) {
    console.error('Error saving note:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
