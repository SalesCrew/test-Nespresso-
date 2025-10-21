import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  try {
    const server = createSupabaseServerClient();
    const { data: authData } = await server.auth.getUser();
    
    if (!authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authData.user.id;
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const svc = createSupabaseServiceClient();
    
    // Get today's assignments where user is lead or buddy
    // and has unread notes (read = false)
    const { data: notes, error } = await svc
      .from('einsatznotiz_promotor')
      .select('assignment_id, note, read, created_at')
      .eq('read', false);
    
    if (error) {
      console.error('Error fetching unread notes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!notes || notes.length === 0) {
      return NextResponse.json({ unreadNotes: [] });
    }
    
    // Get assignment details for these notes to check if user is participant and if it's today
    const assignmentIds = notes.map(n => n.assignment_id);
    
    const { data: assignments, error: assignmentsError } = await svc
      .from('assignments_with_buddy_info')
      .select('id, start_ts, title, location_text, lead_user_id, buddy_user_id')
      .in('id', assignmentIds);
    
    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return NextResponse.json({ error: assignmentsError.message }, { status: 500 });
    }
    
    // Filter to only today's assignments where user is participant
    const unreadNotes = notes
      .map(note => {
        const assignment = assignments?.find(a => a.id === note.assignment_id);
        if (!assignment) return null;
        
        // Check if user is lead or buddy
        const isParticipant = assignment.lead_user_id === userId || assignment.buddy_user_id === userId;
        if (!isParticipant) return null;
        
        // Check if assignment is today
        const assignmentDate = new Date(assignment.start_ts).toISOString().split('T')[0];
        if (assignmentDate !== date) return null;
        
        return {
          assignment_id: note.assignment_id,
          note: note.note,
          title: assignment.title,
          location: assignment.location_text
        };
      })
      .filter(Boolean);
    
    return NextResponse.json({ unreadNotes });
  } catch (error: any) {
    console.error('Error in unread notes API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

