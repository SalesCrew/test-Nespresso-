import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { requireAdmin } from '@/lib/supabase/queries';
import { z } from 'zod';

const applicationSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  // Admins only list applications
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('applications').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ applications: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  // Use service client to bypass RLS for unauthenticated/first-time submitters
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.from('applications').insert({
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    notes: parsed.data.notes ?? null,
    status: 'received',
  }).select('*').maybeSingle();
  if (error) {
    // Surface detailed message to help diagnose RLS or schema issues
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ application: data });
}

