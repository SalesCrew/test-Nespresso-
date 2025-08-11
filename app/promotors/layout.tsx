import SiteLayout from "../SiteLayout";
import { getCurrentUserAndProfile } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";

interface PromotorLayoutProps {
  children: React.ReactNode;
}
 
export default async function PromotorLayout({ children }: PromotorLayoutProps) {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    redirect("/auth/promotors/login");
  }

  if (!profile || profile.role !== "promotor") {
    redirect("/admin/dashboard");
  }

  return <SiteLayout>{children}</SiteLayout>;
}