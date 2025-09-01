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

    // Get all promotors for admin to select from
    const { data: promotors, error } = await svc
      .from('user_profiles')
      .select('user_id, display_name, email')
      .eq('role', 'promotor')
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching promotors:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ promotors: promotors || [] });

  } catch (e: any) {
    console.error('Server error in promotors list API:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
