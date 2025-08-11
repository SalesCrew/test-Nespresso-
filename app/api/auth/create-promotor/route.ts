import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

const payloadSchema = z.object({
  email: z.string(), // allow free input; validate minimally below
  display_name: z.string().min(1),
  password: z.string().min(6).max(128).optional(),
  applicationId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Require an authenticated session but not strict admin during early provisioning
  const server = createSupabaseServerClient();
  const { data: session } = await server.auth.getUser();
  if (!session.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const email = (parsed.data.email || '').trim();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Ungültige E-Mail für Kontoerstellung' }, { status: 400 });
  }

  const svc = createSupabaseServiceClient();
  const password = parsed.data.password ?? crypto.randomUUID().slice(0, 12);

  const { data: authUser, error: signUpError } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: parsed.data.display_name },
  });
  if (signUpError || !authUser?.user) {
    return NextResponse.json({ error: signUpError?.message ?? 'failed to create user' }, { status: 500 });
  }

  const { error: profileError } = await svc.from('user_profiles').insert({
    user_id: authUser.user.id,
    role: 'promotor',
    display_name: parsed.data.display_name,
  });
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (parsed.data.applicationId) {
    await svc.from('applications').update({ status: 'approved' }).eq('id', parsed.data.applicationId);
  }

  return NextResponse.json({ ok: true, user_id: authUser.user.id, password });
}


