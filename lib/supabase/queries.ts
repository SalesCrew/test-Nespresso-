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

export async function requireAdmin() {
  const { user, profile } = await getCurrentUserAndProfile();
  
  console.log('requireAdmin debug:');
  console.log('- user:', user?.id);
  console.log('- profile:', profile);
  
  if (!user || !profile) {
    console.log('- result: unauthorized (no user or profile)');
    return { ok: false as const, reason: 'unauthorized' as const };
  }
  const isAdmin = profile.role === 'admin_of_admins' || profile.role === 'admin_staff';
  
  console.log('- isAdmin check:', isAdmin, 'role:', profile.role);
  
  return isAdmin
    ? { ok: true as const, user, profile }
    : { ok: false as const, reason: 'forbidden' as const };
}


