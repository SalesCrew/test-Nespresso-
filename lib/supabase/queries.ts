import { createSupabaseServerClient } from "./server";

export type UserRole = 'admin_of_admins' | 'admin_staff' | 'promotor';

export async function getCurrentUserAndProfile() {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { user: null, profile: null };
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_id, role, display_name')
    .eq('user_id', user.id)
    .maybeSingle();
  return { user, profile } as const;
}


