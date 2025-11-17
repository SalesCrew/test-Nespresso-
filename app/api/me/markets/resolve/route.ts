import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { computeBestMarket, normalizeForMatch } from '@/lib/matchers/marketMatcher';

export async function POST(req: NextRequest) {
  try {
    const server = createSupabaseServerClient();
    const { data: { user } } = await server.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const assignment = {
      id: 'resolve',
      location_text: String(body.location_text || '').trim(),
      postal_code: String(body.postal_code || '').trim(),
      city: String(body.city || '').trim(),
    };

    const svc = createSupabaseServiceClient();
    const { data: markets, error } = await svc
      .from('markets')
      .select('id, name, address, plz, city, cluster, marktleiter, marktleiterPhone, marktleiterEmail, photosExterior, photosProducts, updated_at, acceptance_addresses');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const list = Array.isArray(markets) ? markets : [];
    const { market } = computeBestMarket(assignment as any, list as any);
    if (!market) return NextResponse.json({ market: null });

    // Sanitize: exclude acceptance list and interior photos
    const projection = {
      id: market.id,
      name: (market as any).name || '',
      address: (market as any).address || '',
      plz: (market as any).plz || '',
      city: (market as any).city || '',
      cluster: (market as any).cluster || '',
      marktleiter: (market as any).marktleiter || '',
      marktleiterPhone: (market as any).marktleiterPhone || '',
      marktleiterEmail: (market as any).marktleiterEmail || '',
      photosExterior: (market as any).photosExterior || [],
      photosProducts: (market as any).photosProducts || [],
      updated_at: (market as any).updated_at || null,
    };
    return NextResponse.json({ market: projection });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}


