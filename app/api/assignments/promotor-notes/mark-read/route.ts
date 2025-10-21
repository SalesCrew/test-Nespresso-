import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    const server = createSupabaseServerClient();
    const { data: authData } = await server.auth.getUser();
    
    if (!authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assignment_id } = body;
    
    if (!assignment_id) {
      return NextResponse.json({ error: 'assignment_id required' }, { status: 400 });
    }
    
    const svc = createSupabaseServiceClient();
    
    // Update read status to true
    const { data, error } = await svc
      .from('einsatznotiz_promotor')
      .update({ read: true })
      .eq('assignment_id', assignment_id)
      .select()
      .single();
    
    if (error) {
      console.error('Error marking note as read:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, note: data });
  } catch (error: any) {
    console.error('Error in mark-read API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

