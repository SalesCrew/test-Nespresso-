import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update all unacknowledged invitations for this user
    const { error } = await supabase
      .from('assignment_invitations')
      .update({ acknowledged_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('acknowledged_at', null)
      .in('status', ['accepted', 'rejected']);

    if (error) {
      console.error('Error acknowledging invitations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in acknowledge-all:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
