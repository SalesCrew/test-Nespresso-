import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Create a Supabase client for Server Components / layouts.
// Next.js does not allow mutating cookies during a Server Component render.
// We therefore expose read-only cookie access here and make set/remove no-ops
// to prevent runtime crashes when Supabase attempts to refresh tokens.
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      // No-ops to avoid "Cookies can only be modified in a Server Action or Route Handler"
      set() {
        /* intentionally noop in Server Components */
      },
      remove() {
        /* intentionally noop in Server Components */
      },
    },
  });
}


