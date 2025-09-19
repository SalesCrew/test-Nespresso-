import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { recomputeOnboarding } from '@/lib/onboarding/recompute';
import { requireAdmin } from '@/lib/supabase/queries';

function isSelfOrAdmin(requestingUserId: string, targetUserId: string, isAdmin: boolean) {
  return isAdmin || requestingUserId === targetUserId;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { ok: isAdmin } = await requireAdmin();
  if (!isSelfOrAdmin(auth.user.id, params.id, isAdmin)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const svc = createSupabaseServiceClient();

  const { data: profile } = await svc
    .from('promotor_profiles')
    .select('*')
    .eq('user_id', params.id)
    .maybeSingle();

  let application: any = null;
  if (profile?.application_id) {
    const { data: appRow } = await svc
      .from('applications')
      .select('*')
      .eq('id', profile.application_id)
      .maybeSingle();
    application = appRow || null;
  }

  return NextResponse.json({ profile: profile || null, application });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  console.log('PATCH /api/promotors/[id] - Debug info:');
  console.log('- Current user ID:', auth.user.id);
  console.log('- Target promotor ID:', params.id);
  
  const adminResult = await requireAdmin();
  console.log('- requireAdmin result:', adminResult);
  
  if (!isSelfOrAdmin(auth.user.id, params.id, adminResult.ok)) {
    console.log('- isSelfOrAdmin check failed');
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  
  console.log('- Authorization passed, proceeding with update');

  const raw = await req.json().catch(() => ({} as any));
  const allowed = {
    phone: typeof raw.phone === 'string' ? raw.phone : undefined,
    address: typeof raw.address === 'string' ? raw.address : undefined,
    postal_code: typeof raw.postal_code === 'string' ? raw.postal_code : undefined,
    city: typeof raw.city === 'string' ? raw.city : undefined,
    region: typeof raw.region === 'string' ? raw.region : undefined,
    working_days: Array.isArray(raw.working_days) ? raw.working_days : undefined,
    height: typeof raw.height === 'string' ? raw.height : undefined,
    clothing_size: typeof raw.clothing_size === 'string' ? raw.clothing_size : undefined,
    birth_date: typeof raw.birth_date === 'string' ? raw.birth_date : undefined,
    bank_iban: typeof raw.bank_iban === 'string' ? raw.bank_iban : undefined,
    bank_bic: typeof raw.bank_bic === 'string' ? raw.bank_bic : undefined,
    bank_holder: typeof raw.bank_holder === 'string' ? raw.bank_holder : undefined,
    bank_name: typeof raw.bank_name === 'string' ? raw.bank_name : undefined,
  } as any;

  const updates: any = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(allowed)) if (v !== undefined) updates[k] = v;
  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'no valid fields' }, { status: 400 });
  }

  const svc = createSupabaseServiceClient();
  let { error } = await svc
    .from('promotor_profiles')
    .update(updates)
    .eq('user_id', params.id);
  if (error) {
    // Fallback: if project used an alternative column name like 'bankname'
    // try again by mapping bank_name -> bankname
    const bankNameValue = (updates as any).bank_name;
    if (bankNameValue !== undefined && /bank_name/.test(error.message || '')) {
      const alt: any = { ...updates };
      delete alt.bank_name;
      alt.bankname = bankNameValue;
      const retry = await svc.from('promotor_profiles').update(alt).eq('user_id', params.id);
      if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  // Recompute onboarding after profile change
  try { await recomputeOnboarding(svc as any, params.id); } catch {}
  return NextResponse.json({ ok: true });
}


