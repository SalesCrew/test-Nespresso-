import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET: Fetch all promotors for group creation (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = userProfile?.role || 'promotor';
    const isAdmin = ['admin_staff', 'admin_of_admins'].includes(userRole);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can access this resource' }, { status: 403 });
    }

    // Fetch all promotors
    const { data: promotors, error: promotorsError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name')
      .eq('role', 'promotor')
      .order('display_name', { ascending: true });

    if (promotorsError) {
      console.error('Error fetching promotors:', promotorsError);
      return NextResponse.json({ error: 'Failed to fetch promotors' }, { status: 500 });
    }

    return NextResponse.json({ promotors: promotors || [] });
  } catch (error) {
    console.error('Error in GET /api/chat/promotors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

