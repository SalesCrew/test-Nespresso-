import SiteLayout from "../SiteLayout";

interface PromotorLayoutProps {
  children: React.ReactNode;
}
 
export default function PromotorLayout({ children }: PromotorLayoutProps) {
  return <SiteLayout>{children}</SiteLayout>;
} 