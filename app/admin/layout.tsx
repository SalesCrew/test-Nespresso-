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

  // Only admins may access admin routes
  if (!profile || (profile.role !== "admin_of_admins" && profile.role !== "admin_staff")) {
    redirect("/promotors/dashboard");
  }

  return <div className="min-h-screen bg-gray-50/30">{children}</div>;
}