import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const server = createSupabaseServerClient();
    const { data: { user } } = await server.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await server
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin_staff', 'admin_of_admins'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const svc = createSupabaseServiceClient();
    const userId = params.userId;

    // Fetch all KPI feedback for this specific promotor
    const { data: feedback, error } = await svc
      .from('kpi_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching KPI history:', error);
      return NextResponse.json({ error: 'Failed to fetch KPI history' }, { status: 500 });
    }

    return NextResponse.json({ feedback: feedback || [] });
  } catch (e: any) {
    console.error('Error in promotor-kpi-history:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

