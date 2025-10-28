import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

// GET - Fetch all markets with visit statistics
export async function GET(req: NextRequest) {
  try {
    const server = createSupabaseServerClient();
    const { data: { user } } = await server.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    const { data: profile } = await server
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin_staff', 'admin_of_admins'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const svc = createSupabaseServiceClient();
    
    // Fetch all markets
    const { data: markets, error: marketsError } = await svc
      .from('markets')
      .select('*')
      .order('name', { ascending: true });
    
    if (marketsError) {
      console.error('Error fetching markets:', marketsError);
      return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 });
    }

    // Compute visits: count of assignments matched to a market, status 'assigned', and start date <= today
    const today = new Date();
    const tomorrowUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1, 0, 0, 0, 0));
    const { data: visitAgg, error: visitsError } = await svc
      .from('assignments')
      .select('matched_market_id, count:id')
      .eq('status', 'assigned')
      .not('matched_market_id', 'is', null)
      .lt('start_ts', tomorrowUtc.toISOString())
      .group('matched_market_id');
    if (visitsError) {
      console.error('Error computing visits:', visitsError);
    }
    const visitsCountMap = new Map((visitAgg || []).map((v: any) => [v.matched_market_id, Number(v.count) || 0]));

    // Fetch promotor names for stamm_promotor_id
    const stammPromotorIds = markets?.map(m => m.stamm_promotor_id).filter(Boolean) || [];
    let promotorsMap = new Map();
    
    if (stammPromotorIds.length > 0) {
      const { data: promotors } = await svc
        .from('user_profiles')
        .select('user_id, display_name')
        .in('user_id', stammPromotorIds);
      
      promotorsMap = new Map((promotors || []).map((p: any) => [p.user_id, p.display_name]));
    }

    // Map markets to UI structure
    const mappedMarkets = (markets || []).map((market: any) => {
      const visitsCount = visitsCountMap.get(market.id) || 0;
      const stammPromotorName = market.stamm_promotor_id ? promotorsMap.get(market.stamm_promotor_id) : null;
      
      return {
        id: market.id,
        name: market.name,
        address: market.address,
        plz: market.plz,
        city: market.city,
        cluster: market.cluster,
        stammPromotorId: market.stamm_promotor_id,
        stammPromotorName: stammPromotorName || null,
        marktleiter: market.marktleiter_name,
        marktleiterPhone: market.marktleiter_phone,
        marktleiterEmail: market.marktleiter_email,
        status: market.status,
        visits: visitsCount,
        lastVisit: null,
        nextVisit: null,
        internalNotes: market.internal_notes || '',
        promotorNotes: market.promotor_notes || '',
        photosInternal: market.photos_internal || [],
        photosExterior: market.photos_exterior || [],
        photosInterior: market.photos_interior || [],
        photosProducts: market.photos_products || []
      };
    });

    return NextResponse.json({ markets: mappedMarkets });
  } catch (error) {
    console.error('Error in markets GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create new market
export async function POST(req: NextRequest) {
  try {
    const server = createSupabaseServerClient();
    const { data: { user } } = await server.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    const { data: profile } = await server
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin_staff', 'admin_of_admins'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const svc = createSupabaseServiceClient();
    
    // Insert new market
    const { data: newMarket, error: insertError } = await svc
      .from('markets')
      .insert({
        name: body.name || '',
        address: body.address || '',
        plz: body.plz || '',
        city: body.city || '',
        cluster: body.cluster || 'wien-noe-bgl',
        stamm_promotor_id: body.stammPromotorId || null,
        marktleiter_name: body.marktleiter || '',
        marktleiter_phone: body.marktleiterPhone || '',
        marktleiter_email: body.marktleiterEmail || '',
        status: body.status || 'active',
        internal_notes: body.internalNotes || '',
        promotor_notes: body.promotorNotes || ''
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating market:', insertError);
      return NextResponse.json({ error: 'Failed to create market' }, { status: 500 });
    }

    return NextResponse.json({ market: newMarket });
  } catch (error) {
    console.error('Error in markets POST:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

