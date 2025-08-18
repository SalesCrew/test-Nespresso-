import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const server = createSupabaseServerClient();
  const { data: auth } = await server.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const svc = createSupabaseServiceClient();

  // Pull promotor base identities
  const { data: users, error: usersErr } = await svc
    .from('user_profiles')
    .select('user_id, display_name, phone, role')
    .eq('role', 'promotor');
  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 });

  // Link to promotor_profiles (optional) and applications for richer card data
  const userIds = (users || []).map((u: { user_id: string }) => u.user_id);
  const { data: links } = await svc
    .from('promotor_profiles')
    .select('user_id, application_id')
    .in('user_id', userIds);
  const appIds = (links || []).map((l: { application_id: string | null }) => l.application_id).filter(Boolean) as string[];
  const { data: applications } = appIds.length
    ? await svc.from('applications').select('*').in('id', appIds)
    : ({ data: [] } as { data: any[] });

  const appById = new Map((applications || []).map((a: any) => [a.id, a]));
  const linkByUser = new Map((links || []).map((l: any) => [l.user_id, l]));

  const cards = (users || []).map((u: any) => {
    const link: any = linkByUser.get(u.user_id);
    const app: any = link?.application_id ? appById.get(link.application_id) : null;
    const fullName = (u.display_name || '').trim() || (app?.full_name || '');
    const address = [app?.address, app?.postalCode, app?.city].filter(Boolean).join(', ');
    return {
      id: u.user_id,
      name: fullName,
      email: app?.email || null,
      phone: u.phone || app?.phone || null,
      address,
      birthDate: app?.birthDate || null,
      region: app?.preferredRegion || 'wien-noe-bgl',
      workingDays: app?.workingDays || [],
      status: 'active',
      avatar: '/placeholder.svg',
      clothingInfo: { height: app?.height || '', size: app?.clothingSize || '' },
      applicationId: link?.application_id || null,
    };
  });

  return NextResponse.json({ promotors: cards });
}


