"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Settings,
  User,
  BarChart2,
  Home,
  Briefcase,
  MessagesSquare,
  X,
  Send,
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  MoreVertical,
  Star,
  Activity,
  FileText,
  GraduationCap,
  Check
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function PromotorenPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Eddie Chat Assistant states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", content: "Hallo! Wie kann ich Ihnen heute helfen?" },
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Notes functionality
  const [notesOpen, setNotesOpen] = useState<number | null>(null);
  const [notes, setNotes] = useState<{[key: number]: string}>({});
  const [notesPosition, setNotesPosition] = useState<Record<number, 'left' | 'right'>>({});
  const [detailedViewOpen, setDetailedViewOpen] = useState<number | null>(null);
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});

  const navigationItems = [
    { id: "overview", label: "Übersicht", icon: Home, active: pathname === '/admin/dashboard', href: '/admin/dashboard' },
    { id: "einsatzplan", label: "Einsatzplan", icon: Briefcase, active: pathname === '/admin/einsatzplan', href: '/admin/einsatzplan' },
    { id: "team", label: "Promotoren", icon: Users, active: pathname === '/admin/team', href: '/admin/team' },
    { id: "messages", label: "Nachrichten", icon: MessagesSquare, active: false, href: '#' },
    { id: "analytics", label: "Analytics", icon: BarChart2, active: false, href: '#' },
    { id: "settings", label: "Einstellungen", icon: Settings, active: false, href: '#' }
  ];

  // Mock promotor data based on the app structure
  const promotors = [
    {
      id: 1,
      name: "Sarah Schmidt",
      email: "sarah.schmidt@salescrew.de",
      phone: "+43 664 123 4567",
      region: "wien-noe-bgl",
      workingDays: ["Mo", "Di", "Mi", "Do", "Fr"],
      status: "active",
      lastActivity: "2024-01-15",
      performance: {
        mcet: 4.8,
        tma: 92,
        vlshare: 18
      },
      assignments: 12,
      completedTrainings: 8,
      onboardingProgress: 85,
      ausfaelle: {
        krankenstand: 2,
        notfaelle: 1
      },
      avatar: "/placeholder.svg"
    },
    {
      id: 2,
      name: "Michael Weber",
      email: "michael.weber@salescrew.de",
      phone: "+43 676 234 5678",
      region: "steiermark",
      workingDays: ["Mo", "Di", "Mi", "Do"],
      status: "active",
      lastActivity: "2024-01-14",
      performance: {
        mcet: 3.9,
        tma: 78,
        vlshare: 12
      },
      assignments: 8,
      completedTrainings: 6,
      onboardingProgress: 60,
      ausfaelle: {
        krankenstand: 1,
        notfaelle: 0
      },
      avatar: "/placeholder.svg"
    },
    {
      id: 3,
      name: "Jan Müller",
      email: "jan.mueller@salescrew.de",
      phone: "+43 650 345 6789",
      region: "salzburg",
      workingDays: ["Di", "Mi", "Do", "Fr", "Sa"],
      status: "active",
      lastActivity: "2024-01-15",
      performance: {
        mcet: 5.2,
        tma: 88,
        vlshare: 22
      },
      assignments: 15,
      completedTrainings: 10,
      onboardingProgress: 100,
      ausfaelle: {
        krankenstand: 0,
        notfaelle: 0
      },
      avatar: "/placeholder.svg"
    },
    {
      id: 4,
      name: "Lisa König",
      email: "lisa.koenig@salescrew.de",
      phone: "+43 699 456 7890",
      region: "wien-noe-bgl",
      workingDays: ["Mo", "Mi", "Fr"],
      status: "inactive",
      lastActivity: "2024-01-10",
      performance: {
        mcet: 3.2,
        tma: 65,
        vlshare: 8
      },
      assignments: 5,
      completedTrainings: 4,
      onboardingProgress: 40,
      ausfaelle: {
        krankenstand: 3,
        notfaelle: 2
      },
      avatar: "/placeholder.svg"
    },
    {
      id: 5,
      name: "Anna Bauer",
      email: "anna.bauer@salescrew.de",
      phone: "+43 664 567 8901",
      region: "oberoesterreich",
      workingDays: ["Mo", "Di", "Do", "Fr"],
      status: "active",
      lastActivity: "2024-01-15",
      performance: {
        mcet: 4.5,
        tma: 85,
        vlshare: 16
      },
      assignments: 11,
      completedTrainings: 7,
      onboardingProgress: 75,
      ausfaelle: {
        krankenstand: 1,
        notfaelle: 1
      },
      avatar: "/placeholder.svg"
    },
    {
      id: 6,
      name: "Tom Fischer",
      email: "tom.fischer@salescrew.de",
      phone: "+43 676 678 9012",
      region: "tirol",
      workingDays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa"],
      status: "active",
      lastActivity: "2024-01-15",
      performance: {
        mcet: 4.1,
        tma: 82,
        vlshare: 14
      },
      assignments: 13,
      completedTrainings: 9,
      onboardingProgress: 90,
      ausfaelle: {
        krankenstand: 0,
        notfaelle: 1
      },
      avatar: "/placeholder.svg"
    }
  ];

  // Region mapping for display
  const regionNames = {
    "wien-noe-bgl": "Wien/NÖ/Bgl",
    "steiermark": "Steiermark",
    "salzburg": "Salzburg",
    "oberoesterreich": "Oberösterreich",
    "tirol": "Tirol",
    "vorarlberg": "Vorarlberg",
    "kaernten": "Kärnten"
  };

  // Region colors for badges - matching admin dashboard popup styling
  const getRegionGradient = (region: string) => {
    switch (region) {
      case "wien-noe-bgl": return "bg-red-50/40";
      case "steiermark": return "bg-green-50/40";
      case "salzburg": return "bg-blue-50/40";
      case "oberoesterreich": return "bg-yellow-50/40";
      case "tirol": return "bg-purple-50/40";
      case "vorarlberg": return "bg-orange-50/40";
      case "kaernten": return "bg-teal-50/40";
      default: return "bg-gray-50/40";
    }
  };

  const getRegionBorder = (region: string) => {
    // All pills get the same thin grey border
    return "border-gray-200";
  };

  const getRegionPillColors = (region: string) => {
    return `${getRegionGradient(region)} ${getRegionBorder(region)} text-gray-700`;
  };

  // KPI color functions - matching statistics page rules
  const getKpiColor = (category: "mcet" | "tma" | "vlshare", value: number) => {
    if (category === "mcet") {
      if (value >= 4.5) return "text-green-600";
      if (value >= 4.0) return "text-[#FD7E14]";
      return "text-red-600";
    } else if (category === "tma") {
      if (value >= 75) return "text-green-600";
      if (value >= 65) return "text-[#FD7E14]";
      return "text-red-600";
    } else if (category === "vlshare") {
      if (value >= 10) return "text-green-600";
      if (value >= 6) return "text-[#FD7E14]";
      return "text-red-600";
    }
    return "text-gray-600";
  };

  const getKpiStyle = (colorClass: string) => {
    if (colorClass === "text-[#FD7E14]") {
      return { color: "#FD7E14" };
    }
    return {};
  };

  // Status indicator
  const getStatusIcon = (status: string) => {
    return status === "active" ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-gray-400" />
    );
  };

  // Filter promotors
  const filteredPromotors = promotors.filter(promotor => {
    const matchesSearch = promotor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         promotor.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = regionFilter === "all" || promotor.region === regionFilter;
    const matchesStatus = statusFilter === "all" || promotor.status === statusFilter;
    
    return matchesSearch && matchesRegion && matchesStatus;
  });

  // Format last activity
  const formatLastActivity = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Heute";
    if (diffDays === 2) return "Gestern";
    return `vor ${diffDays - 1} Tagen`;
  };

  // Eddie chat functions (copied from admin dashboard)
  useEffect(() => {
    if (chatOpen) {
      scrollToBottom();
    }
  }, [chatMessages, chatOpen]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--input-bg',
      'linear-gradient(to bottom, rgba(243,244,246,0.95), rgba(249,250,251,0.95))'
    );

    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateColorMode = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.style.setProperty(
          '--input-bg',
          'linear-gradient(to bottom, rgba(31,41,55,0.95), rgba(17,24,39,0.95))'
        );
      } else {
        document.documentElement.style.setProperty(
          '--input-bg',
          'linear-gradient(to bottom, rgba(243,244,246,0.95), rgba(249,250,251,0.95))'
        );
      }
    };
    
    updateColorMode(darkModeMediaQuery.matches);
    darkModeMediaQuery.addEventListener('change', (e) => updateColorMode(e.matches));
    
    return () => {
      darkModeMediaQuery.removeEventListener('change', (e) => updateColorMode(e.matches));
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessages = [...chatMessages, { role: "user", content: chatInput }];
    setChatMessages(newMessages);
    setChatInput("");

    setTimeout(() => {
      setChatMessages([
        ...newMessages,
        { 
          role: "ai", 
          content: "Ich verarbeite Ihre Anfrage. Wie kann ich Ihnen weiter behilflich sein?" 
        }
      ]);
    }, 1000);
  };

  // Notes functions
  const toggleNotes = (promotorId: number) => {
    setNotesOpen(notesOpen === promotorId ? null : promotorId);
  };

  // Check if notes should open to the left (when card is too close to right edge)
  const shouldOpenLeft = (cardElement: HTMLElement) => {
    const rect = cardElement.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const spaceToRight = windowWidth - rect.right;
    return spaceToRight < 320; // 320px is the width of notes panel
  };

  const updateNotes = (promotorId: number, noteText: string) => {
    setNotes(prev => ({
      ...prev,
      [promotorId]: noteText
    }));
  };

  // Detailed view functions
  const toggleDetailedView = (promotorId: number) => {
    setDetailedViewOpen(detailedViewOpen === promotorId ? null : promotorId);
  };

  // Copy function
  const copyToClipboard = async (text: string, type: 'email' | 'phone', promotorId: number) => {
    try {
      await navigator.clipboard.writeText(text);
      const key = `${promotorId}-${type}`;
      setCopiedItems(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Minimalistic Sidebar */}
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
                    if (item.id === 'einsatzplan') {
                      router.push('/admin/einsatzplan');
                    } else if (item.id === 'overview') {
                      router.push('/admin/dashboard');
                    } else if (item.id === 'team') {
                      router.push('/admin/team');
                    }
                    // Add other navigation items as needed
                  }
                }}
                className={`${sidebarOpen ? 'w-full flex items-center space-x-3 px-3 py-2' : 'w-8 h-8 flex items-center justify-center mx-auto'} rounded-lg transition-colors ${
                  item.active 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-14'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Promotoren</h1>
              <p className="text-gray-500 text-sm">Team Management</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Promotor suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="all">Alle Regionen</option>
                {Object.entries(regionNames).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="all">Alle Status</option>
                <option value="active">Aktiv</option>
                <option value="inactive">Inaktiv</option>
              </select>
            </div>
          </div>

          {/* Promotor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPromotors.map((promotor) => (
              <div key={promotor.id} className="relative">
                <Card 
                  className="group hover:shadow-xl hover:shadow-gray-900/5 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm relative overflow-hidden cursor-pointer"
                  onClick={() => toggleDetailedView(promotor.id)}
                >
                  {/* Subtle gradient border effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200/20 via-transparent to-gray-200/20 rounded-lg"></div>
                  <div className="absolute inset-[1px] bg-white rounded-lg"></div>
                
                <CardContent className="relative p-6 space-y-5">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-11 w-11 ring-2 ring-gray-100 ring-offset-2">
                          <AvatarImage src={promotor.avatar} alt={promotor.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 font-medium text-sm">
                            {promotor.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {/* Status indicator dot */}
                        <div className="absolute -bottom-0.5 -right-0.5">
                          {promotor.status === 'active' ? (
                            <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                          ) : (
                            <div className="w-3 h-3 bg-gray-400 rounded-full border-2 border-white shadow-sm"></div>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-base truncate">{promotor.name}</h3>
                        <p className="text-xs text-gray-500 capitalize mt-0.5">{promotor.status}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>

                  {/* Region Badge */}
                  <div>
                    <Badge className={`${getRegionPillColors(promotor.region)} border text-xs px-2.5 py-1`}>
                      {regionNames[promotor.region as keyof typeof regionNames]}
                    </Badge>
                  </div>

                  {/* Working Days */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-3">Arbeitstage</p>
                    <div className="flex space-x-1.5">
                      {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                        <div
                          key={day}
                          className={`relative w-7 h-7 rounded-full text-xs font-medium flex items-center justify-center transition-all duration-200 ${
                            promotor.workingDays.includes(day)
                              ? 'bg-slate-100 text-slate-700 shadow-sm border border-slate-200/60'
                              : 'bg-gray-50/50 text-gray-400 border border-transparent'
                          }`}
                        >
                          {promotor.workingDays.includes(day) && (
                            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent"></div>
                          )}
                          <span className="relative z-10">{day[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Performance</p>
                    <div className="bg-slate-50/30 border border-slate-200/40 rounded-lg p-2.5 backdrop-blur-sm relative overflow-hidden">
                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg"></div>
                      
                      <div className="relative grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <p 
                            className={`text-sm font-semibold transition-colors ${getKpiColor("mcet", promotor.performance.mcet)}`}
                            style={getKpiStyle(getKpiColor("mcet", promotor.performance.mcet))}
                          >
                            {promotor.performance.mcet.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-500">MC/ET</p>
                        </div>
                        <div className="text-center border-l border-r border-slate-200/40">
                          <p 
                            className={`text-sm font-semibold transition-colors ${getKpiColor("tma", promotor.performance.tma)}`}
                            style={getKpiStyle(getKpiColor("tma", promotor.performance.tma))}
                          >
                            {promotor.performance.tma}%
                          </p>
                          <p className="text-xs text-gray-500">TMA</p>
                        </div>
                        <div className="text-center">
                          <p 
                            className={`text-sm font-semibold transition-colors ${getKpiColor("vlshare", promotor.performance.vlshare)}`}
                            style={getKpiStyle(getKpiColor("vlshare", promotor.performance.vlshare))}
                          >
                            {promotor.performance.vlshare}%
                          </p>
                          <p className="text-xs text-gray-500">VL Share</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full text-xs font-medium">
                      {promotor.assignments} Einsätze
                    </span>
                    <span className="text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full text-xs font-medium">
                      {promotor.completedTrainings} Schulungen
                    </span>
                  </div>

                  {/* Onboarding Progress as Divider */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-600">Onboarding</p>
                      <span className="text-xs text-gray-500 font-medium">{promotor.onboardingProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100/60 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          promotor.onboardingProgress === 100 
                            ? 'bg-gradient-to-r from-green-400/60 to-emerald-400/60' 
                            : promotor.onboardingProgress >= 75 
                            ? 'bg-gradient-to-r from-blue-400/60 to-indigo-400/60'
                            : promotor.onboardingProgress >= 50 
                            ? 'bg-gradient-to-r from-yellow-400/60 to-orange-400/60'
                            : 'bg-gradient-to-r from-red-400/60 to-pink-400/60'
                        }`}
                        style={{ width: `${promotor.onboardingProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Contact & Last Activity */}
                  <div className="space-y-3 pt-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="h-3 w-3 text-gray-500" />
                      </div>
                      <span className="text-xs text-gray-600 truncate">{promotor.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="h-3 w-3 text-gray-500" />
                      </div>
                      <span className="text-xs text-gray-600">
                        Letzte Aktivität: {formatLastActivity(promotor.lastActivity)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Notes Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent opening detailed view
                      const cardElement = e.currentTarget.closest('.relative') as HTMLElement;
                      const openLeft = shouldOpenLeft(cardElement);
                      setNotesPosition(prev => ({ ...prev, [promotor.id]: openLeft ? 'left' : 'right' }));
                      toggleNotes(promotor.id);
                    }}
                    className="absolute bottom-4 right-4 p-2 text-gray-400/30 hover:text-gray-600 hover:bg-gray-100/60 rounded-lg transition-all duration-200"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>

              {/* Notes Panel */}
              {notesOpen === promotor.id && (
                <div className={`absolute top-0 w-80 h-full bg-white border border-gray-200 shadow-xl z-20 ${
                  notesPosition[promotor.id] === 'left' 
                    ? 'right-full rounded-l-lg animate-slide-in-left' 
                    : 'left-full rounded-r-lg animate-slide-in-right'
                }`}>
                  <div className="p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Notizen - {promotor.name}</h4>
                      <button
                        onClick={() => setNotesOpen(null)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                    <textarea
                      value={notes[promotor.id] || ''}
                      onChange={(e) => updateNotes(promotor.id, e.target.value)}
                      placeholder="Notizen zu diesem Promotor hinzufügen..."
                      className="flex-1 w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredPromotors.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Keine Promotoren gefunden
              </h3>
              <p className="text-gray-500">
                Versuchen Sie andere Suchkriterien oder Filter.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Detailed Promotor View Modal */}
      {detailedViewOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 transition-opacity duration-300 z-[60]"
            onClick={() => setDetailedViewOpen(null)}
          ></div>

          {/* Modal Content */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
              {(() => {
                const promotor = promotors.find(p => p.id === detailedViewOpen);
                if (!promotor) return null;

                return (
                  <>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 relative">
                      <button
                        onClick={() => setDetailedViewOpen(null)}
                        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16 ring-4 ring-white/20">
                          <AvatarImage src={promotor.avatar} alt={promotor.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-medium">
                            {promotor.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold">{promotor.name}</h2>
                          <p className="text-white/80">{promotor.email}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge className={`${getRegionPillColors(promotor.region)} border text-xs`}>
                              {regionNames[promotor.region as keyof typeof regionNames]}
                            </Badge>
                            <span className={`text-sm font-medium ${
                              promotor.status === 'active' ? 'text-green-300' : 'text-gray-400'
                            }`}>
                              {promotor.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
                        
                        {/* Left Column - Personal & Contact */}
                        <div className="space-y-6">
                          {/* Personal Information */}
                          <Card className="shadow-sm border-gray-200/60">
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <User className="h-4 w-4 mr-2 text-blue-500" />
                                Persönliche Daten
                              </h3>
                                                             <div className="space-y-3 text-sm">
                                 <div 
                                   className="flex items-center space-x-2 cursor-pointer"
                                   onClick={() => copyToClipboard(promotor.phone, 'phone', promotor.id)}
                                 >
                                   {copiedItems[`${promotor.id}-phone`] ? (
                                     <Check className="h-4 w-4 text-green-500" />
                                   ) : (
                                     <Phone className="h-4 w-4 text-gray-400" />
                                   )}
                                   <span>{promotor.phone}</span>
                                 </div>
                                 <div 
                                   className="flex items-center space-x-2 cursor-pointer"
                                   onClick={() => copyToClipboard(promotor.email, 'email', promotor.id)}
                                 >
                                   {copiedItems[`${promotor.id}-email`] ? (
                                     <Check className="h-4 w-4 text-green-500" />
                                   ) : (
                                     <Mail className="h-4 w-4 text-gray-400" />
                                   )}
                                   <span>{promotor.email}</span>
                                 </div>
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span>{regionNames[promotor.region as keyof typeof regionNames]}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span>Dabei seit März 2023</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Documents */}
                          <Card className="shadow-sm border-gray-200/60">
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-green-500" />
                                Dokumente
                              </h3>
                              <div className="space-y-3">
                                {[
                                  { name: "Staatsbürgerschaftsnachweis", status: "approved" },
                                  { name: "Pass", status: "pending" },
                                  { name: "Arbeitserlaubnis", status: "approved" },
                                  { name: "Dienstvertrag", status: "approved" },
                                  { name: "Strafregister", status: "missing" }
                                ].map((doc, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">{doc.name}</span>
                                    <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'pending' ? 'secondary' : 'destructive'} className="text-xs">
                                      {doc.status === 'approved' ? 'Genehmigt' : doc.status === 'pending' ? 'Ausstehend' : 'Fehlend'}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Working Days */}
                          <Card className="shadow-sm border-gray-200/60">
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-4">Arbeitstage</h3>
                              <div className="flex justify-center space-x-2">
                                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                                  <div
                                    key={day}
                                    className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center ${
                                      promotor.workingDays.includes(day)
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'bg-gray-50 text-gray-400'
                                    }`}
                                  >
                                    {day[0]}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Middle Column - Performance & Training */}
                        <div className="space-y-6">
                          {/* Performance Metrics */}
                          <Card className="shadow-sm border-gray-200/60">
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <BarChart2 className="h-4 w-4 mr-2 text-purple-500" />
                                Performance KPIs
                              </h3>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                  <p 
                                    className={`text-lg font-bold ${getKpiColor("mcet", promotor.performance.mcet)}`}
                                    style={getKpiStyle(getKpiColor("mcet", promotor.performance.mcet))}
                                  >
                                    {promotor.performance.mcet.toFixed(1)}
                                  </p>
                                  <p className="text-xs text-gray-500 font-medium">MC/ET</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                  <p 
                                    className={`text-lg font-bold ${getKpiColor("tma", promotor.performance.tma)}`}
                                    style={getKpiStyle(getKpiColor("tma", promotor.performance.tma))}
                                  >
                                    {promotor.performance.tma}%
                                  </p>
                                  <p className="text-xs text-gray-500 font-medium">TMA</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                  <p 
                                    className={`text-lg font-bold ${getKpiColor("vlshare", promotor.performance.vlshare)}`}
                                    style={getKpiStyle(getKpiColor("vlshare", promotor.performance.vlshare))}
                                  >
                                    {promotor.performance.vlshare}%
                                  </p>
                                  <p className="text-xs text-gray-500 font-medium">VL Share</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Training Progress */}
                          <Card className="shadow-sm border-gray-200/60">
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <GraduationCap className="h-4 w-4 mr-2 text-indigo-500" />
                                Schulungen & Training
                              </h3>
                              <div className="space-y-3">
                                {[
                                  { name: "Grundlagen des Verkaufs", status: "completed", progress: 100 },
                                  { name: "Produktpräsentation", status: "in_progress", progress: 75 },
                                  { name: "Kundeneinwände behandeln", status: "not_started", progress: 0 },
                                  { name: "Teamarbeit & Kommunikation", status: "completed", progress: 100 },
                                  { name: "Digitale Tools & Apps", status: "not_started", progress: 0 }
                                ].map((training, index) => (
                                  <div key={index} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-gray-700">{training.name}</span>
                                      <Badge variant={training.status === 'completed' ? 'default' : training.status === 'in_progress' ? 'secondary' : 'outline'} className="text-xs">
                                        {training.status === 'completed' ? 'Abgeschlossen' : training.status === 'in_progress' ? 'In Bearbeitung' : 'Nicht begonnen'}
                                      </Badge>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-full rounded-full ${
                                          training.progress === 100 ? 'bg-green-500' : training.progress > 0 ? 'bg-blue-500' : 'bg-gray-300'
                                        }`}
                                        style={{ width: `${training.progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Onboarding Progress */}
                          <Card className="shadow-sm border-gray-200/60">
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                                Onboarding Status
                              </h3>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Fortschritt</span>
                                  <span className="text-sm font-bold text-gray-900">{promotor.onboardingProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      promotor.onboardingProgress === 100 
                                        ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                                        : promotor.onboardingProgress >= 75 
                                        ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
                                        : promotor.onboardingProgress >= 50 
                                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                                        : 'bg-gradient-to-r from-red-400 to-pink-500'
                                    }`}
                                    style={{ width: `${promotor.onboardingProgress}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {promotor.onboardingProgress === 100 ? 'Onboarding abgeschlossen' : 
                                   promotor.onboardingProgress >= 75 ? 'Fast abgeschlossen' :
                                   promotor.onboardingProgress >= 50 ? 'In Bearbeitung' : 'Gerade begonnen'}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Right Column - Activity & Assignments */}
                        <div className="space-y-6">
                                                     {/* Recent Activity */}
                           <Card className="shadow-sm border-gray-200/60">
                             <CardContent className="p-4">
                               <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                 <Activity className="h-4 w-4 mr-2 text-orange-500" />
                                 Aktivität & Einsätze
                               </h3>
                               <div className="space-y-3 text-sm">
                                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                   <span className="font-medium">Gesamte Einsätze</span>
                                   <span className="font-bold text-blue-600">{promotor.assignments}</span>
                                 </div>
                                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                   <span className="font-medium">Abgeschlossene Schulungen</span>
                                   <span className="font-bold text-green-600">{promotor.completedTrainings}</span>
                                 </div>
                                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                   <span className="font-medium">Krankenstand</span>
                                   <span className="font-bold text-red-600">{promotor.ausfaelle.krankenstand}</span>
                                 </div>
                                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                   <span className="font-medium">Notfälle</span>
                                   <span className="font-bold text-orange-500">{promotor.ausfaelle.notfaelle}</span>
                                 </div>
                                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                   <span className="font-medium">Letzte Aktivität</span>
                                   <span className="text-gray-600">{formatLastActivity(promotor.lastActivity)}</span>
                                 </div>
                               </div>
                             </CardContent>
                           </Card>

                                                     {/* Upcoming Assignments */}
                           <Card className="shadow-sm border-gray-200/60">
                             <CardContent className="p-4">
                               <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                 <Briefcase className="h-4 w-4 mr-2 text-teal-500" />
                                 Kommende Einsätze
                               </h3>
                               <div className="space-y-3 h-[260px]">
                                 {[
                                   { date: "Heute", time: "10:00-18:00", location: "MediaMarkt Seiersberg", type: "Promotion" },
                                   { date: "Morgen", time: "09:00-17:30", location: "Saturn Klagenfurt", type: "Buddy Tag" },
                                   { date: "Do, 25. Jan", time: "14:00-20:00", location: "Saturn Graz", type: "Promotion" }
                                 ].map((assignment, index) => (
                                   <div key={index} className="p-3 border border-gray-200 rounded-lg">
                                     <div className="flex items-center justify-between mb-1">
                                       <span className="text-sm font-medium text-gray-900">{assignment.date}</span>
                                       <Badge 
                                         variant="outline" 
                                         className={`text-xs border-0 text-white font-medium ${
                                           assignment.type === "Promotion" 
                                             ? "bg-gradient-to-r from-blue-500 to-blue-600" 
                                             : "bg-gradient-to-r from-purple-500 to-purple-600"
                                         }`}
                                       >
                                         {assignment.type}
                                       </Badge>
                                     </div>
                                     <p className="text-xs text-gray-600">{assignment.time}</p>
                                     <p className="text-xs text-gray-500">{assignment.location}</p>
                                   </div>
                                 ))}
                               </div>
                             </CardContent>
                           </Card>

                          
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* Eddie Assistant Floating Button */}
      <button 
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg flex items-center justify-center z-40 hover:shadow-xl transition-shadow"
        onClick={() => {
          setChatOpen(true);
          setIsSpinning(true);
          setTimeout(() => setIsSpinning(false), 1000);
        }}
      >
        <div className="absolute w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 animate-ping-slow opacity-70"></div>
        <img
          src="/icons/robot 1.svg"
          alt="KI Assistant"
          className={`h-8 w-8 relative z-10 ${isSpinning ? 'animate-spin-once' : ''} brightness-0 invert`}
        />
      </button>

      {/* Eddie Assistant Chat Interface */}
      {chatOpen && (
        <>
          {/* Darkening overlay */}
          <div 
            className="fixed inset-0 bg-black transition-opacity duration-500 z-[35] opacity-40"
            onClick={() => setChatOpen(false)}
          ></div>

          {/* Chat Interface */}
          <div className="fixed bottom-36 right-4 w-72 h-[400px] bg-white rounded-lg shadow-xl flex flex-col z-50 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-3 flex items-center justify-between shadow-md sticky top-0 z-10">
              <div className="flex items-center">
                <img
                  src="/icons/robot 1.svg"
                  alt="KI Assistant"
                  className="h-5 w-5 mr-2 brightness-0 invert"
                />
                <h3 className="text-white font-medium">Frag Eddie!</h3>
              </div>
              <button 
                onClick={() => setChatOpen(false)} 
                className="text-white hover:bg-blue-600 rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 pb-16 scrollbar-thin scrollbar-track-transparent hover:scrollbar-thumb-blue-600">
              <div className="space-y-3">
                {chatMessages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        message.role === 'user' 
                          ? 'bg-gray-200 text-gray-900' 
                          : 'bg-blue-400 text-white'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat Input */}
            <div className="absolute bottom-3 left-3 right-3 z-20">
              <form onSubmit={sendMessage} className="relative">
                <input 
                  type="text"
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  placeholder="Frag Eddie egal was..." 
                  className="w-full pr-12 py-2 px-5 rounded-full outline-none text-gray-900 placeholder:text-gray-500 placeholder:text-xs"
                  style={{ 
                    border: 'none', 
                    boxShadow: '0 3px 8px rgba(0,0,0,0.18)', 
                    WebkitAppearance: 'none', 
                    MozAppearance: 'none', 
                    appearance: 'none',
                    background: 'var(--input-bg, linear-gradient(to bottom, rgba(243,244,246,0.95), rgba(249,250,251,0.95)))'
                  }}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
                  disabled={!chatInput.trim()}
                >
                  <Send className="h-3.5 w-3.5 rotate-15" />
                </Button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 