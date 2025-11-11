import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET(req: NextRequest) {
  try {
    const server = createSupabaseServerClient();
    const { data: { user } } = await server.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await server
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (!profile || !['admin_staff', 'admin_of_admins'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const svc = createSupabaseServiceClient();

    // Find latest KPI feedback wave (approximate: latest created_at in kpi_feedback)
    const { data: latestFeedback } = await svc
      .from('kpi_feedback')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let waveMonth: string | null = null;
    let highlight = false;
    let completion = 0;

    if (latestFeedback?.created_at) {
      const d = new Date(latestFeedback.created_at);
      waveMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const waveDate = new Date(`${waveMonth}-01T00:00:00Z`);

      // Count promotors and entries for this wave
      const { data: promotors } = await svc
        .from('user_profiles')
        .select('user_id')
        .eq('role', 'promotor');
      const totalPromotors = promotors?.length || 0;

      const { data: entries } = await svc
        .from('kpi_praemien')
        .select('id')
        .eq('wave_month', `${waveMonth}-01`);
      const done = entries?.length || 0;

      completion = totalPromotors > 0 ? Math.round((done / totalPromotors) * 100) : 0;

      // Highlight if 14+ days passed since feedback and not ~complete
      const now = new Date();
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      highlight = diffDays >= 14 && completion < 95;
    }

    return NextResponse.json({ waveMonth, completion, highlight });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}


