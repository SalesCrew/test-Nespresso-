import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
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

    const body = await req.json().catch(() => ({}));
    const waveMonth: string = body.waveMonth;
    const rows: any[] = Array.isArray(body.rows) ? body.rows : [];

    if (!waveMonth || !/^\d{4}-\d{2}$/.test(waveMonth)) {
      return NextResponse.json({ error: 'Invalid waveMonth (YYYY-MM)' }, { status: 400 });
    }
    if (!rows.length) {
      return NextResponse.json({ error: 'No rows' }, { status: 400 });
    }

    const svc = createSupabaseServiceClient();

    // Resolve emails to user_ids in one shot
    const emails = rows.map(r => (r.email || '').toString().trim()).filter(Boolean);
    const { data: profiles } = await svc
      .from('user_profiles')
      .select('user_id, email')
      .in('email', emails);
    const emailToUser = new Map((profiles || []).map(p => [String(p.email).toLowerCase(), p.user_id]));

    const upserts = rows.map((r: any) => {
      const email = (r.email || '').toString().trim().toLowerCase();
      const user_id = r.user_id || emailToUser.get(email);
      if (!user_id) return null;
      const toInt = (v: any) => Number.isFinite(Number(v)) ? parseInt(String(v), 10) : 0;
      return {
        user_id,
        wave_month: `${waveMonth}-01`,
        gutscheine: toInt(r.gutscheine ?? r.Gutscheine),
        tma: toInt(r.tma ?? r.TMA),
        vertuo: toInt(r.vertuo ?? r.Vertuo),
        vertuo_pop: toInt(r.vertuo_pop ?? r['Vertuo Pop+'] ?? r.vertuo_pop_plus),
        aeroccino: toInt(r.aeroccino ?? r.Aeroccino),
        vorteilsbox: toInt(r.vorteilsbox ?? r.Vorteilsbox),
      };
    }).filter(Boolean) as any[];

    if (!upserts.length) {
      return NextResponse.json({ error: 'No valid rows' }, { status: 400 });
    }

    const { data, error } = await svc
      .from('kpi_praemien')
      .upsert(upserts, { onConflict: 'user_id,wave_month' })
      .select('id');
    if (error) {
      return NextResponse.json({ error: 'Failed to import', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, imported: data?.length || 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}


