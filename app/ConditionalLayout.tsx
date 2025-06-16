"use client";

import { usePathname } from "next/navigation";
import SiteLayout from "./SiteLayout";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Pages that should NOT have the SiteLayout (landing, auth, and admin pages)
  const excludedPaths = [
    '/',           // Landing page
    '/auth/promotors/login',
    '/auth/salescrew/login',
    '/admin/dashboard',  // Admin dashboard
    '/admin/einsatzplan', // Admin einsatzplan
  ];
  
  const shouldExcludeLayout = excludedPaths.includes(pathname);
  
  if (shouldExcludeLayout) {
    return <>{children}</>;
  }
  
  return <SiteLayout>{children}</SiteLayout>;
} 