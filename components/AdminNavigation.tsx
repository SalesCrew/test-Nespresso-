"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Settings,
  User,
  BarChart2,
  Home,
  Briefcase,
  MessagesSquare,
  Users,
  BookOpen,
  Trophy,
  Cpu
} from "lucide-react";

interface AdminNavigationProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function AdminNavigation({ sidebarOpen, setSidebarOpen }: AdminNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    { id: "overview", label: "Übersicht", icon: Home, active: pathname === '/admin/dashboard', href: '/admin/dashboard' },
    { id: "einsatzplan", label: "Einsatzplan", icon: Briefcase, active: pathname === '/admin/einsatzplan', href: '/admin/einsatzplan' },
    { id: "team", label: "Promotoren", icon: Users, active: pathname === '/admin/team', href: '/admin/team' },
    { id: "messages", label: "Nachrichten", icon: MessagesSquare, active: false, href: '#' },
    { id: "statistiken", label: "Statistiken", icon: BarChart2, active: pathname === '/admin/statistiken', href: '/admin/statistiken' },
    { id: "schulungen", label: "Schulungen", icon: BookOpen, active: pathname === '/admin/schulungen', href: '/admin/schulungen' },
    { id: "sales-challenge", label: "Sales Challenge", icon: Trophy, active: pathname === '/admin/sales-challenge', href: '/admin/sales-challenge' },
    { id: "demotool-agent", label: "DemoTool Agent", icon: Cpu, active: pathname === '/admin/demotool-agent', href: '/admin/demotool-agent' },
    { id: "settings", label: "Einstellungen", icon: Settings, active: false, href: '#' }
  ];

  return (
    <div className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-sm border-r border-gray-100/50 z-40 transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-14'}`}>
      <div className="p-3">
        <div className={`${sidebarOpen ? 'flex items-center space-x-3' : 'w-8 h-8 flex items-center justify-center mx-auto'} bg-gray-100 rounded-lg mb-6 ${sidebarOpen ? 'p-3' : ''}`}>
          <Settings className="h-4 w-4 text-gray-600" />
          {sidebarOpen && (
            <div>
              <h1 className="text-sm font-semibold text-gray-900">SalesCrew</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          )}
        </div>

        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.active) {
                  // If clicking on the currently active page, toggle sidebar
                  setSidebarOpen(!sidebarOpen);
                } else {
                  // If clicking on a different page, navigate and collapse sidebar
                  setSidebarOpen(false);
                  if (item.href && item.href !== '#') {
                    router.push(item.href);
                  }
                }
              }}
              className={`${sidebarOpen ? 'w-full flex items-center space-x-3 px-3 py-2' : 'w-8 h-8 flex items-center justify-center mx-auto'} rounded-lg transition-colors ${
                item.active 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              style={item.active ? {background: 'linear-gradient(135deg, #22C55E, #105F2D)'} : {}}
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
} 