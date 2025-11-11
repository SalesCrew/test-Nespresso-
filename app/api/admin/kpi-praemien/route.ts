import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

const PRICE = {
  brutto: { tma: 7.5, gutscheine: 3.5, vertuo: 7.5, vertuo_pop: 7.5, aeroccino: 3.5, vorteilsbox: 0 },
  netto: { tma: 6.19, gutscheine: 2.89, vertuo: 6.19, vertuo_pop: 6.19, aeroccino: 2.89, vorteilsbox: 0 },
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const waveMonth = url.searchParams.get('waveMonth'); // YYYY-MM

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

    // Determine latest wave if not provided
    let where = svc.from('kpi_praemien').select('*');
    if (waveMonth) {
      where = where.eq('wave_month', `${waveMonth}-01`);
    }
    const { data: rows, error } = await where;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Load profiles for names
    const userIds = Array.from(new Set((rows || []).map((r: any) => r.user_id)));
    const { data: profiles } = await svc
      .from('user_profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);
    const mapProfile = new Map((profiles || []).map((p: any) => [p.user_id, p.display_name]));

    const mapTotals = { brutto: 0, netto: 0 };
    const items = (rows || []).map((r: any) => {
      const brutto =
        r.tma * PRICE.brutto.tma +
        r.gutscheine * PRICE.brutto.gutscheine +
        r.vertuo * PRICE.brutto.vertuo +
        r.vertuo_pop * PRICE.brutto.vertuo_pop +
        r.aeroccino * PRICE.brutto.aeroccino +
        r.vorteilsbox * PRICE.brutto.vorteilsbox;
      const netto =
        r.tma * PRICE.netto.tma +
        r.gutscheine * PRICE.netto.gutscheine +
        r.vertuo * PRICE.netto.vertuo +
        r.vertuo_pop * PRICE.netto.vertuo_pop +
        r.aeroccino * PRICE.netto.aeroccino +
        r.vorteilsbox * PRICE.netto.vorteilsbox;
      mapTotals.brutto += brutto;
      mapTotals.netto += netto;
      return {
        ...r,
        promotor_name: mapProfile.get(r.user_id) || '',
        brutto: Number(brutto.toFixed(2)),
        netto: Number(netto.toFixed(2)),
      };
    });

    return NextResponse.json({
      waveMonth: waveMonth || (items[0]?.wave_month?.slice(0, 7) ?? null),
      items,
      totals: { brutto: Number(mapTotals.brutto.toFixed(2)), netto: Number(mapTotals.netto.toFixed(2)) },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}


