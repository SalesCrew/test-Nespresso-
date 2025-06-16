"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, 
  Briefcase, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings,
  Calendar,
  LayoutGrid,
  LayoutList,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  X
} from "lucide-react";

export default function EinsatzplanPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'cards' | 'days'>('list');
  const [isMainCardExpanded, setIsMainCardExpanded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [einsatzFilter, setEinsatzFilter] = useState("alle");
  const [regionFilter, setRegionFilter] = useState("ALLE");
  const [dateFilter, setDateFilter] = useState("");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [dateViewMode, setDateViewMode] = useState<'weeks' | 'calendar'>('weeks');
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [plzFilter, setPlzFilter] = useState("");
  const [showPlzDropdown, setShowPlzDropdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showMaerkteView, setShowMaerkteView] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState<'roh' | 'intern'>('roh');
  const weeksContainerRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const plzDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Get current week number
  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  };

  // Generate all calendar weeks for current year
  const generateCalendarWeeks = () => {
    const weeks = [];
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    
    // Find first Monday of the year
    const firstMonday = new Date(startDate);
    const dayOfWeek = startDate.getDay();
    const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    firstMonday.setDate(startDate.getDate() + daysToAdd);
    
    for (let week = 1; week <= 52; week++) {
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const formatDate = (date: Date) => {
        return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      };
      
      weeks.push(`KW ${week} (${formatDate(weekStart)}-${formatDate(weekEnd)})`);
    }
    return weeks;
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Start from Monday
    
    const days = [];
    for (let i = 0; i < 42; i++) { // 6 weeks
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
         return days;
   };

  // Generate all dates between two dates (inclusive)
  const getDatesBetween = (startDate: string, endDate: string) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

     // Get all dates in current range (including in-between dates)
   const getAllRangeDates = () => {
     if (!dateRange.start) return [];
     if (!dateRange.end) return [dateRange.start];
     
     const start = dateRange.start <= dateRange.end ? dateRange.start : dateRange.end;
     const end = dateRange.start <= dateRange.end ? dateRange.end : dateRange.start;
     return getDatesBetween(start, end);
   };

   // Get display text for the filter pill
   const getFilterDisplayText = () => {
     if (selectedWeeks.length > 0) {
       if (selectedWeeks.length === 1) {
         // Extract KW number from "KW 47 (18.11-24.11)" format
         const kwNumber = selectedWeeks[0].match(/KW (\d+)/)?.[1];
         return `KW ${kwNumber}`;
       } else {
         // Multiple weeks - show count
         return `${selectedWeeks.length} KWs`;
       }
     }
     
     if (dateRange.start) {
       if (!dateRange.end) {
         // Single date - show as DD.MM
         const date = new Date(dateRange.start);
         return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
       } else {
         // Date range - show as DD.MM-DD.MM
         const startDate = new Date(dateRange.start);
         const endDate = new Date(dateRange.end);
         const startStr = `${startDate.getDate().toString().padStart(2, '0')}.${(startDate.getMonth() + 1).toString().padStart(2, '0')}`;
         const endStr = `${endDate.getDate().toString().padStart(2, '0')}.${(endDate.getMonth() + 1).toString().padStart(2, '0')}`;
         return `${startStr}-${endStr}`;
       }
     }
     
     return 'Datum';
   };

  // Auto-scroll to current week when dropdown opens
  useEffect(() => {
    if (showDateDropdown && dateViewMode === 'weeks' && weeksContainerRef.current) {
      const currentWeek = getCurrentWeek();
      const weekElement = weeksContainerRef.current.children[currentWeek - 1] as HTMLElement;
      if (weekElement) {
        weekElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [showDateDropdown, dateViewMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setShowDateDropdown(false);
      }
    };

    if (showDateDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDateDropdown]);

  // Close PLZ dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plzDropdownRef.current && !plzDropdownRef.current.contains(event.target as Node)) {
        setShowPlzDropdown(false);
      }
    };

    if (showPlzDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPlzDropdown]);

  // Close Status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    if (showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatusDropdown]);

  const navigationItems = [
    { id: "overview", label: "Übersicht", icon: Home, active: pathname === '/admin/dashboard' },
    { id: "einsatzplan", label: "Einsatzplan", icon: Briefcase, active: pathname === '/admin/einsatzplan' },
    { id: "team", label: "Team", icon: Users, active: false },
    { id: "messages", label: "Nachrichten", icon: MessageSquare, active: false },
    { id: "analytics", label: "Analytics", icon: BarChart3, active: false },
    { id: "settings", label: "Einstellungen", icon: Settings, active: false }
  ];

  const einsatzplanData = [
    { 
      id: 1, 
      promotor: "Sarah Schmidt", 
      address: "Mariahilfer Str. 45",
      plz: "1060",
      city: "Wien", 
      planStart: "09:00", 
      planEnd: "17:00",
      date: "2024-11-25",
      status: "geplant",
      product: "Nespresso"
    },
    { 
      id: 2, 
      promotor: "Michael Weber", 
      address: "Herrengasse 12",
      plz: "8010",
      city: "Graz", 
      planStart: "10:00", 
      planEnd: "18:00",
      date: "2024-11-25",
      status: "bestätigt",
      product: "Nespresso"
    }
  ];

  const weekOverviewData = [
    { 
      date: "Mo 25.11", 
      einsätze: 12, 
      promotoren: 8, 
      bestätigt: 10, 
      offen: 2, 
      abgesagt: 0,
      status: "active"
    },
    { 
      date: "Di 26.11", 
      einsätze: 15, 
      promotoren: 10, 
      bestätigt: 12, 
      offen: 3, 
      abgesagt: 0,
      status: "planned"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bestätigt': return 'green';
      case 'geplant': return 'orange';
      case 'abgesagt': return 'red';
      default: return 'gray';
    }
  };

  const getLocationOptions = () => {
    return [...new Set(einsatzplanData.map(item => item.city))];
  };

  const getPlzOptions = () => {
    return [...new Set(einsatzplanData.map(item => item.plz))].sort();
  };

  const getStatusOptions = () => {
    return ["Verplant", "Krankenstand", "Notfall", "Urlaub", "Zeitausgleich", "Markierte"];
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case "Verplant": return "from-white to-green-100/60";
      case "Krankenstand": return "from-white to-red-100/60";
      case "Notfall": return "from-white to-orange-100/60";
      case "Urlaub": return "from-white to-blue-100/60";
      case "Zeitausgleich": return "from-white to-yellow-100/60";
      case "Markierte": return "from-white to-purple-100/60";
      default: return "from-white to-white";
    }
  };

  const getStatusHoverClass = (status: string) => {
    switch (status) {
      case "Verplant": return "hover:bg-gradient-to-r hover:from-white hover:to-green-100/50";
      case "Krankenstand": return "hover:bg-gradient-to-r hover:from-white hover:to-red-100/50";
      case "Notfall": return "hover:bg-gradient-to-r hover:from-white hover:to-orange-100/50";
      case "Urlaub": return "hover:bg-gradient-to-r hover:from-white hover:to-blue-100/50";
      case "Zeitausgleich": return "hover:bg-gradient-to-r hover:from-white hover:to-yellow-100/50";
      case "Markierte": return "hover:bg-gradient-to-r hover:from-white hover:to-purple-100/50";
      default: return "hover:bg-gray-50";
    }
  };

  const openInGoogleMaps = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Generate day cards with status counts
  const generateDayCards = () => {
    const dayMap = new Map();
    
    // Group einsatzplan data by date
    filteredEinsatzplan.forEach(item => {
      const date = item.date;
      if (!dayMap.has(date)) {
        dayMap.set(date, {
          date: date,
          verplant: 0,
          offen: 0,
          krankenstand: 0,
          notfall: 0,
          urlaub: 0,
          zeitausgleich: 0,
          total: 0
        });
      }
      
      const dayData = dayMap.get(date);
      dayData.total++;
      
      // Count based on status
      switch(item.status.toLowerCase()) {
        case 'bestätigt':
        case 'verplant':
          dayData.verplant++;
          break;
        case 'geplant':
        case 'offen':
          dayData.offen++;
          break;
        case 'krankenstand':
          dayData.krankenstand++;
          break;
        case 'notfall':
          dayData.notfall++;
          break;
        case 'urlaub':
          dayData.urlaub++;
          break;
        case 'zeitausgleich':
          dayData.zeitausgleich++;
          break;
        default:
          dayData.offen++;
      }
    });
    
    // Convert to array and sort by date
    return Array.from(dayMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Format date for display
  const formatDateForCard = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Heute';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Morgen';
    } else {
      return date.toLocaleDateString('de-DE', { 
        weekday: 'short', 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const filteredEinsatzplan = einsatzplanData.filter(item => 
    (einsatzFilter === "alle" || item.city === einsatzFilter) &&
    (!plzFilter || item.plz === plzFilter)
  );

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Sidebar */}
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
              <h1 className="text-2xl font-semibold text-gray-900">{showMaerkteView ? 'Märkte' : 'Einsatzplan'}</h1>
              <p className="text-gray-500 text-sm">{showMaerkteView ? 'Marktübersicht und Verwaltung' : 'Übersicht und Planung aller Einsätze'}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {showMaerkteView ? 'Import POS' : 'Import EP'}
              </button>
              <button
                onClick={() => setShowMaerkteView(!showMaerkteView)}
                className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {showMaerkteView ? 'Einsatzplan' : 'Märkte'}
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8 space-y-6">
          {showMaerkteView ? (
            /* Märkte View */
            <div className="w-full">
              <Card 
                className="border-0 w-full h-[600px]"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(99, 102, 241, 0.003) 50%, rgba(79, 70, 229, 0.005) 100%)',
                  boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.06), 0 2px 8px -1px rgba(139, 92, 246, 0.04), 0 8px 32px -4px rgba(99, 102, 241, 0.03)'
                }}
              >
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Home className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Märkte</h3>
                      </div>
                    </div>
                    
                    {/* Region Filter Pills */}
                    <div className="flex items-center space-x-3">
                      {["ALLE", "W/NÖ/BGL", "ST", "S", "OÖ", "T", "V", "K"].map((region) => {
                        const isSelected = regionFilter === region || (regionFilter === "ALLE" && region === "ALLE");
                        return (
                          <button
                            key={region}
                            onClick={() => setRegionFilter(regionFilter === region ? "ALLE" : region)}
                            className={`px-3 py-1.5 rounded-full text-xs transition-all duration-200 border border-gray-200 ${
                              isSelected 
                                ? 'bg-gray-100 text-gray-700 scale-110' 
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {region}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div 
                    className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    <div className="space-y-2">
                      {/* Empty rows matching einsatzplan format */}
                      {[1, 2, 3, 4, 5, 6].map((index) => (
                        <div 
                          key={index} 
                          className="p-4 rounded-lg border border-gray-100 transition-all duration-200 hover:border-gray-200 hover:shadow-sm bg-white"
                        >
                          <div className="flex items-center justify-between">
                            <div className="grid grid-cols-5 gap-4 flex-1 items-center">
                              <div className="min-w-0">
                                {/* Empty placeholder for promotor */}
                              </div>
                              <div className="text-xs text-gray-600 text-center">
                                {/* Empty placeholder for PLZ/city */}
                              </div>
                              <div className="text-xs text-gray-600 text-center">
                                {/* Empty placeholder for date */}
                              </div>
                              <div className="text-xs text-gray-600 text-center">
                                {/* Empty placeholder for time */}
                              </div>
                              <div className="text-xs text-center flex items-center justify-end space-x-2">
                                {/* Empty placeholder for status */}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Original Einsatzplan View */
          <div className="flex gap-6">
            {/* Big Card - Left Side */}
            <div className="flex-[3] relative">
              <Card 
                className={`border-0 w-full transition-all duration-300 ${isMainCardExpanded ? 'absolute top-0 left-0 right-0 h-[960px] z-20' : 'relative h-[600px]'}`}
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(99, 102, 241, 0.003) 50%, rgba(79, 70, 229, 0.005) 100%)',
                  boxShadow: '0 4px 20px -2px rgba(255, 133, 82, 0.06), 0 2px 8px -1px rgba(255, 185, 151, 0.04), 0 8px 32px -4px rgba(255, 133, 82, 0.03)'
                }}
              >
                <CardContent className={`p-6 h-full flex flex-col ${isMainCardExpanded ? 'bg-white' : ''}`}>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Einsatzplan</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setViewMode(
                            viewMode === 'list' ? 'days' : 
                            viewMode === 'days' ? 'cards' : 'list'
                          )}
                          className="p-1 rounded hover:bg-gray-100 transition-colors opacity-50"
                        >
                          {viewMode === 'list' ? (
                            <LayoutGrid className="h-4 w-4 text-gray-600" />
                          ) : viewMode === 'days' ? (
                            <LayoutList className="h-4 w-4 text-gray-600" />
                          ) : (
                            <LayoutGrid className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                                          {/* Region Filter Pills */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {["ALLE", "W/NÖ/BGL", "ST", "S", "OÖ", "T", "V", "K"].map((region) => {
                          const isSelected = regionFilter === region || (regionFilter === "ALLE" && region === "ALLE");
                          return (
                            <button
                              key={region}
                              onClick={() => setRegionFilter(regionFilter === region ? "ALLE" : region)}
                              className={`px-3 py-1.5 rounded-full text-xs transition-all duration-200 border border-gray-200 ${
                                isSelected 
                                  ? 'bg-gray-100 text-gray-700 scale-110' 
                                  : 'bg-white text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {region}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* PLZ, Status and Date Filter Pills */}
                      <div className="flex items-center space-x-2">
                        {/* PLZ Filter Pill */}
                        <div className="relative">
                          <button
                            onClick={() => setShowPlzDropdown(!showPlzDropdown)}
                            className={`px-3 py-1.5 rounded-full text-xs bg-gradient-to-r from-white to-blue-100/60 border border-gray-200 transition-all duration-200 hover:to-blue-100/80 ${
                              plzFilter
                                ? 'text-gray-700 scale-110' 
                                : 'text-gray-500'
                            }`}
                          >
                            {plzFilter || 'PLZ'}
                          </button>
                          
                          {showPlzDropdown && (
                            <div 
                              ref={plzDropdownRef}
                              className="absolute top-full right-0 mt-1 border-0 rounded-lg shadow-lg z-10 w-40 bg-white max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                              style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none'
                              }}
                            >
                              <div className="p-2">
                                <button
                                  onClick={() => {
                                    setPlzFilter("");
                                    setShowPlzDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 rounded text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                  Alle PLZ
                                </button>
                                {getPlzOptions().map((plz) => (
                                  <button
                                    key={plz}
                                    onClick={() => {
                                      setPlzFilter(plz);
                                      setShowPlzDropdown(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                                      plzFilter === plz
                                        ? 'bg-gray-100 text-gray-700'
                                        : 'hover:bg-gray-50 text-gray-600'
                                    }`}
                                  >
                                    {plz}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Status Filter Pill */}
                        <div className="relative">
                          <button
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className={`px-3 py-1.5 rounded-full text-xs bg-gradient-to-r ${
                              statusFilter ? getStatusGradient(statusFilter) : 'from-white to-white'
                            } border border-gray-200 transition-all duration-200 hover:bg-gray-50 ${
                              statusFilter
                                ? 'text-gray-700 scale-110' 
                                : 'text-gray-500'
                            }`}
                          >
                            {statusFilter || 'Status'}
                          </button>
                          
                          {showStatusDropdown && (
                            <div 
                              ref={statusDropdownRef}
                              className="absolute top-full right-0 mt-1 border-0 rounded-lg shadow-lg z-10 w-44 bg-white max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                              style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none'
                              }}
                            >
                              <div className="p-2">
                                <button
                                  onClick={() => {
                                    setStatusFilter("");
                                    setShowStatusDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 rounded text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                  Alle Status
                                </button>
                                {getStatusOptions().map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => {
                                      setStatusFilter(status);
                                      setShowStatusDropdown(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                                      statusFilter === status
                                        ? 'bg-gray-100 text-gray-700'
                                        : `text-gray-600 ${getStatusHoverClass(status)}`
                                    }`}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Date Filter Pill */}
                        <div className="relative">
                        <button
                          onClick={() => setShowDateDropdown(!showDateDropdown)}
                          className={`px-3 py-1.5 rounded-full text-xs bg-gradient-to-r from-white to-orange-50/30 border border-gray-200 transition-all duration-200 hover:to-orange-50/50 ${
                            selectedWeeks.length > 0 || dateRange.start || dateFilter
                              ? 'text-black scale-110' 
                              : 'text-gray-500'
                          }`}
                        >
                          {getFilterDisplayText()}
                        </button>
                        
                        {showDateDropdown && (
                          <div 
                            ref={dateDropdownRef}
                            className="absolute top-full right-0 mt-1 border-0 rounded-lg shadow-lg z-10 w-80 bg-white max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                            style={{
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none'
                            }}
                          >
                            {/* View Mode Toggle */}
                            <div className="p-3 border-b border-gray-100">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setDateViewMode('weeks')}
                                  className={`px-3 py-1 rounded text-xs transition-colors ${
                                    dateViewMode === 'weeks' 
                                      ? 'bg-gray-100 text-gray-700' 
                                      : 'bg-gray-50 text-gray-500 hover:bg-gray-75'
                                  }`}
                                >
                                  Kalenderwochen
                                </button>
                                <button
                                  onClick={() => setDateViewMode('calendar')}
                                  className={`px-3 py-1 rounded text-xs transition-colors ${
                                    dateViewMode === 'calendar' 
                                      ? 'bg-gray-100 text-gray-700' 
                                      : 'bg-gray-50 text-gray-500 hover:bg-gray-75'
                                  }`}
                                >
                                  Kalender
                                </button>
                              </div>
                            </div>
                            
                            {/* Content Area */}
                            <div className="p-3">
                              {dateViewMode === 'weeks' ? (
                                <div ref={weeksContainerRef} className="space-y-1 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                  {generateCalendarWeeks().map((week) => (
                                    <button
                                      key={week}
                                      onClick={() => {
                                        setSelectedWeeks(prev => 
                                          prev.includes(week) 
                                            ? prev.filter(w => w !== week)
                                            : [...prev, week]
                                        );
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                                        selectedWeeks.includes(week)
                                          ? 'bg-gray-100 text-gray-700'
                                          : 'hover:bg-gray-50 text-gray-600'
                                      }`}
                                    >
                                      {week}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {/* Month Header */}
                                  <div className="flex items-center justify-between">
                                    <button
                                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                      className="p-1 rounded hover:bg-gray-50 transition-colors"
                                    >
                                      <ChevronLeft className="h-4 w-4 text-gray-400" />
                                    </button>
                                    <h4 className="text-sm font-medium text-gray-700">
                                      {currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                                    </h4>
                                    <button
                                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                      className="p-1 rounded hover:bg-gray-50 transition-colors"
                                    >
                                      <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </button>
                                  </div>
                                  
                                  {/* Calendar Grid */}
                                  <div className="grid grid-cols-7 gap-1">
                                    {/* Day Headers */}
                                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                                      <div key={day} className="text-center text-xs text-gray-400 font-medium py-1">
                                        {day}
                                      </div>
                                    ))}
                                    
                                    {/* Calendar Days */}
                                    {generateCalendarDays().map((date, index) => {
                                      const dateStr = date.toISOString().split('T')[0];
                                      const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                                      const isToday = dateStr === new Date().toISOString().split('T')[0];
                                      const allRangeDates = getAllRangeDates();
                                      const isStartOrEnd = dateStr === dateRange.start || dateStr === dateRange.end;
                                      const isInRange = allRangeDates.includes(dateStr) && !isStartOrEnd;
                                      const isSelected = isStartOrEnd;
                                      
                                      return (
                                        <button
                                          key={index}
                                          onClick={() => {
                                            // If clicking on already selected start or end date, deselect
                                            if (dateStr === dateRange.start || dateStr === dateRange.end) {
                                              setDateRange({ start: null, end: null });
                                            } else if (!dateRange.start) {
                                              // First click - set start date
                                              setDateRange({ start: dateStr, end: null });
                                            } else if (!dateRange.end) {
                                              // Second click - set end date and create range
                                              setDateRange({ start: dateRange.start, end: dateStr });
                                            } else {
                                              // Third click - reset and start new range
                                              setDateRange({ start: dateStr, end: null });
                                            }
                                          }}
                                          className={`w-8 h-8 text-xs rounded transition-colors ${
                                            isSelected
                                              ? 'bg-gray-700 text-white'
                                              : isInRange
                                              ? 'bg-gray-200/50 text-gray-700'
                                              : isToday
                                              ? 'bg-gray-100 text-gray-700 font-medium'
                                              : isCurrentMonth
                                              ? 'text-gray-700 hover:bg-gray-50'
                                              : 'text-gray-300 hover:bg-gray-25'
                                          }`}
                                        >
                                          {date.getDate()}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="space-y-2">
                      {/* Progress bar */}
                      <div className="w-full bg-gray-100 rounded-full h-1">
                        <div 
                          className="h-1 rounded-full transition-all duration-300 bg-gradient-to-r from-gray-300 to-gray-400"
                          style={{ width: `65%` }}
                        ></div>
                      </div>
                      {/* Statistics indicators */}
                      <div className="flex items-center space-x-4 opacity-50">
                        <span className="text-xs text-green-600">8</span>
                        <span className="text-xs text-red-600">1</span>
                        <span className="text-xs text-gray-600">3</span>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    {viewMode === 'days' ? (
                      /* Days View */
                      <div className="grid grid-cols-4 gap-4">
                        {generateDayCards().map((dayData) => (
                          <div 
                            key={dayData.date}
                            className="p-4 rounded-lg border border-gray-100 transition-all duration-200 hover:border-gray-200 hover:shadow-sm bg-white"
                          >
                            <div className="space-y-3">
                              {/* Date Header */}
                              <div className="text-center">
                                <h4 className="text-sm font-medium text-gray-900">{formatDateForCard(dayData.date)}</h4>
                                <p className="text-xs text-gray-500">{new Date(dayData.date).toLocaleDateString('de-DE')}</p>
                              </div>
                              
                              {/* Status Counts */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">Verplant</span>
                                  <span className={`text-xs font-medium text-green-600 ${dayData.verplant === 0 ? 'opacity-30' : ''}`}>{dayData.verplant > 0 ? dayData.verplant : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">Offen</span>
                                  <span className={`text-xs font-medium text-gray-600 ${dayData.offen === 0 ? 'opacity-30' : ''}`}>{dayData.offen > 0 ? dayData.offen : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">Krankenstand</span>
                                  <span className={`text-xs font-medium text-red-600 ${dayData.krankenstand === 0 ? 'opacity-30' : ''}`}>{dayData.krankenstand > 0 ? dayData.krankenstand : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">Notfall</span>
                                  <span className={`text-xs font-medium text-orange-600 ${dayData.notfall === 0 ? 'opacity-30' : ''}`}>{dayData.notfall > 0 ? dayData.notfall : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">Urlaub</span>
                                  <span className={`text-xs font-medium text-blue-600 ${dayData.urlaub === 0 ? 'opacity-30' : ''}`}>{dayData.urlaub > 0 ? dayData.urlaub : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">Zeitausgleich</span>
                                  <span className={`text-xs font-medium text-yellow-600 ${dayData.zeitausgleich === 0 ? 'opacity-30' : ''}`}>{dayData.zeitausgleich > 0 ? dayData.zeitausgleich : 'N/A'}</span>
                                </div>
                                
                                {/* Total Count */}
                                <div className="pt-2 border-t border-gray-100">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-700">Gesamt</span>
                                    <span className="text-xs font-medium text-gray-900">{dayData.total}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* List View */
                      <div className="space-y-2">
                        {filteredEinsatzplan.map((einsatz) => {
                        const statusColor = getStatusColor(einsatz.status);
                        return (
                          <div 
                            key={einsatz.id} 
                            className={`p-4 rounded-lg border border-gray-100 transition-all duration-200 hover:border-gray-200 hover:shadow-sm ${
                              statusColor === 'green' 
                                ? 'bg-gradient-to-r from-white to-green-50/35' 
                                : statusColor === 'orange'
                                ? 'bg-gradient-to-r from-white to-orange-50/35'
                                : statusColor === 'red'
                                ? 'bg-gradient-to-r from-white to-red-50/35'
                                : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="grid grid-cols-5 gap-4 flex-1 items-center">
                                <div className="min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900">{einsatz.promotor}</h4>
                                  <button
                                    onClick={() => openInGoogleMaps(einsatz.address, einsatz.city)}
                                    className="text-xs text-gray-500 text-left cursor-pointer hover:text-blue-600"
                                  >
                                    {einsatz.address}
                                  </button>
                                </div>
                                <div className="text-xs text-gray-600 text-center">
                                  <span>{einsatz.plz} {einsatz.city}</span>
                                </div>
                                <div className="text-xs text-gray-600 text-center">
                                  <span>{einsatz.date}</span>
                                </div>
                                <div className="text-xs text-gray-600 text-center">
                                  <span>{einsatz.planStart} - {einsatz.planEnd}</span>
                                </div>
                                <div className="text-xs text-center flex items-center justify-end space-x-2">
                                  <span className={`font-medium ${
                                    statusColor === 'green' ? 'text-green-600' :
                                    statusColor === 'orange' ? 'text-orange-600' :
                                    statusColor === 'red' ? 'text-red-600' :
                                    'text-gray-400'
                                  }`}>
                                    {einsatz.status}
                                  </span>
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    statusColor === 'green' ? 'bg-green-400' :
                                    statusColor === 'orange' ? 'bg-orange-400' :
                                    statusColor === 'red' ? 'bg-red-400' :
                                    'bg-gray-300'
                                  }`}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Smaller Card - Right Side */}
            <div className="w-80 flex items-center">
              <Card 
                className="border-0 h-80 w-full"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(34, 197, 94, 0.003) 50%, rgba(22, 163, 74, 0.005) 100%)',
                  boxShadow: '0 4px 20px -2px rgba(255, 133, 82, 0.06), 0 2px 8px -1px rgba(255, 185, 151, 0.04), 0 8px 32px -4px rgba(255, 133, 82, 0.03)'
                }}
              >
                <CardContent className="p-3 h-full flex flex-col">
                  <div 
                    className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5, 6].map((index) => (
                        <div 
                          key={index}
                          className="p-3 rounded-lg border border-gray-100 transition-all duration-200 hover:border-gray-200 hover:shadow-sm bg-white"
                        >
                          <div className="grid grid-cols-5 gap-3 flex-1 items-center">
                            <div className="min-w-0">
                              <div className="h-3 bg-gray-100 rounded mb-1"></div>
                              <div className="h-2 bg-gray-50 rounded w-3/4"></div>
                            </div>
                            <div className="text-center">
                              <div className="h-2 bg-gray-100 rounded mx-auto w-2/3"></div>
                            </div>
                            <div className="text-center">
                              <div className="h-2 bg-gray-100 rounded mx-auto w-1/2"></div>
                            </div>
                            <div className="text-center">
                              <div className="h-2 bg-gray-100 rounded mx-auto w-3/4"></div>
                            </div>
                            <div className="text-center flex items-center justify-end space-x-2">
                              <div className="h-2 bg-gray-100 rounded w-1/3"></div>
                              <div className="w-2 h-2 rounded-full bg-gray-200 flex-shrink-0"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          )}
        </main>
      </div>

      {/* Import EP Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-96 max-w-[90vw]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{showMaerkteView ? 'Import POS' : 'Import EP'}</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Import Type Selection - Only show for EP imports */}
              {!showMaerkteView && (
                <div className="mb-6">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setImportType('roh')}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        importType === 'roh'
                          ? 'bg-gray-100 text-gray-700 border border-gray-200'
                          : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Roh Excel
                    </button>
                    <button
                      onClick={() => setImportType('intern')}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        importType === 'intern'
                          ? 'bg-gray-100 text-gray-700 border border-gray-200'
                          : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      EP intern
                    </button>
                  </div>
                </div>
              )}

              {/* Drag and Drop Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Excel-Datei hier ablegen oder
                    </p>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Datei auswählen
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Unterstützte Formate: .xlsx, .xls
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  disabled
                >
                  Importieren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 