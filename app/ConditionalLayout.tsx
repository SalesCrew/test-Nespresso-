"use client";

import { usePathname } from "next/navigation";
import SiteLayout from "./SiteLayout";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Pages that should NOT have the SiteLayout (landing, auth, admin pages, and promotor pages with their own layout)
  const excludedPaths = [
    '/',           // Landing page
    '/auth/promotors/login',
    '/auth/salescrew/login',
  ];
  
  // Check if it's an admin route or promotor route (which have their own layouts)
  const isAdminRoute = pathname.startsWith('/admin/');
  const isPromotorRoute = pathname.startsWith('/promotors/');
  
  const shouldExcludeLayout = excludedPaths.includes(pathname) || isAdminRoute || isPromotorRoute;
  
  if (shouldExcludeLayout) {
    return <>{children}</>;
  }
  
  return <SiteLayout>{children}</SiteLayout>;
} 