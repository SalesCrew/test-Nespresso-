import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteLayout from "./SiteLayout";
import { 
  Home, 
  Calendar, 
  CalendarDays, 
  CalendarCheck, 
  Clock, 
  Settings, 
  User, 
  FileText, 
  CheckCircle, 
  Package,
  BarChart2
} from "lucide-react"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SalesCrew App",
  description: "SalesCrew Promotor App",
};

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "Einsatz",
    href: "/einsatz",
    icon: <Package className="h-4 w-4" />,
  },
  {
    title: "Krankenstand",
    href: "/krankenstand",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  {
    title: "Statistiken",
    href: "/statistiken",
    icon: <BarChart2 className="h-4 w-4" />,
  },
  {
    title: "Gehaltsabrechnung",
    href: "/gehaltsabrechnung",
    icon: <FileText className="h-4 w-4" />,
  },
]

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <SiteLayout>{children}</SiteLayout>
      </body>
    </html>
  );
}
