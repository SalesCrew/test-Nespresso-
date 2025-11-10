import SiteLayout from "../SiteLayout";
import { getCurrentUserAndProfile } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import { SocketProvider } from "@/lib/socket/SocketContext";
import TagesCheckProvider from "@/components/TagesCheckProvider";
import PromotorUnreadBridge from "@/components/promotors/PromotorUnreadBridge";

interface PromotorLayoutProps {
  children: React.ReactNode;
}
 
export default async function PromotorLayout({ children }: PromotorLayoutProps) {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    redirect("/auth/promotors/login");
  }

  // If profile is missing but user is authenticated, allow access for now
  if (!profile) {
    return (
      <SiteLayout>
        <SocketProvider>
          <PromotorUnreadBridge />
          {children}
        </SocketProvider>
      </SiteLayout>
    );
  }

  if (profile.role === "promotor") {
    return (
      <SiteLayout>
        <SocketProvider>
          <PromotorUnreadBridge />
          <TagesCheckProvider />
          {children}
        </SocketProvider>
      </SiteLayout>
    );
  }

  if (profile.role === "admin_of_admins" || profile.role === "admin_staff") {
    redirect("/admin/dashboard");
  }

  redirect("/");
  return null;
}