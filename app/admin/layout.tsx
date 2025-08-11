import { getCurrentUserAndProfile } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    redirect("/auth/salescrew/login");
  }

  // If profile is missing, route to admin login to avoid loops
  if (!profile) {
    redirect("/auth/salescrew/login");
  }

  // Only admins may access admin routes
  if (profile.role === "admin_of_admins" || profile.role === "admin_staff") {
    return <div className="min-h-screen bg-gray-50/30">{children}</div>;
  }

  // Known non-admin (promotor) → send to promotor dashboard; others go home
  if (profile.role === "promotor") {
    redirect("/promotors/dashboard");
  }
  redirect("/");
  return null;
}