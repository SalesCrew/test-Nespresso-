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

  // If profile is missing but user is authenticated, allow access for now
  // This prevents a loop if the profile hasn't been provisioned yet
  if (!profile) {
    return <div className="min-h-screen bg-gray-50/30">{children}</div>;
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