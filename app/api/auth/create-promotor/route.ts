import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/queries';
import { z } from 'zod';

const payloadSchema = z.object({
  email: z.string().email(),
  display_name: z.string().min(1),
  password: z.string().min(6).max(128).optional(),
});

export async function POST(req: NextRequest) {
  // Admin only
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  // Create auth user using admin service RPC via supabase-js (needs service role key)
  // With @supabase/ssr server client, we do not expose service key to client.
  const password = parsed.data.password ?? crypto.randomUUID().slice(0, 12);

  const { data: authUser, error: signUpError } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password,
    email_confirm: true,
  });
  if (signUpError || !authUser?.user) {
    return NextResponse.json({ error: signUpError?.message ?? 'failed to create user' }, { status: 500 });
  }

  // Insert profile as promotor
  const { error: profileError } = await supabase.from('user_profiles').insert({
    user_id: authUser.user.id,
    role: 'promotor',
    display_name: parsed.data.display_name,
  });
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user_id: authUser.user.id });
}


