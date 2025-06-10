"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  MapPin,
  Send,
  Plus,
  TrendingUp,
  AlertCircle,
  MessageSquare,
  BarChart3,
  Settings,
  Home,
  Briefcase,
  UserCheck,
  X,
  Menu,
  LayoutList,
  LayoutGrid,

} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AdminDashboard() {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messageForm, setMessageForm] = useState({
    recipient: "all",
    subject: "",
    message: ""
  });
  const [eddieText, setEddieText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [einsatzFilter, setEinsatzFilter] = useState("alle");
  const [showDropdown, setShowDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [showActivePromotionsModal, setShowActivePromotionsModal] = useState(false);
  const [activePromotionsViewMode, setActivePromotionsViewMode] = useState<'list' | 'cards'>('list');
  const [activePromotionsSearch, setActivePromotionsSearch] = useState('');
  const [showOffeneAnfragenModal, setShowOffeneAnfragenModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  
  const fullEddieText = `Guten Tag! Hier ist ein Überblick über die wichtigsten Aufgaben für heute:

Die 4 aktiven Promotions laufen alle sehr erfolgreich und zeigen gute Verkaufszahlen. Es gibt jedoch 2 neue Promotion-Anfragen, die Ihre Aufmerksamkeit benötigen - diese sollten heute noch bearbeitet werden.

Sehr erfreulich: Die Verkaufszahlen dieser Woche liegen 15% über dem Durchschnitt! Das Team leistet wirklich hervorragende Arbeit.

3 Promotoren haben ihre Schulungen erfolgreich abgeschlossen und sind nun bereit für neue Einsätze. Außerdem stehen heute noch einige Berichte zur Überprüfung an.

Ich empfehle, zuerst die offenen Anfragen zu bearbeiten und dann die neuen Schulungsabsolventen für kommende Promotions einzuplanen.`;

  // Mock data for promotions
  const todaysPromotions = [
    { id: 1, location: "Interspar Graz", promotor: "Jan Müller", time: "09:00 - 17:00", status: "aktiv", product: "Vertuo" },
    { id: 2, location: "Billa Plus Wien", promotor: "Sarah Schmidt", time: "10:00 - 18:00", status: "aktiv", product: "Original" },
    { id: 3, location: "Merkur Salzburg", promotor: "Michael Weber", time: "08:30 - 16:30", status: "pause", product: "Vertuo" },
    { id: 4, location: "Spar Innsbruck", promotor: "Lisa König", time: "11:00 - 19:00", status: "wartend", product: "Original" }
  ];

  // Mock data for pending requests
  const pendingRequests = [
    { id: 1, market: "Billa Plus Graz", address: "Herrengasse 10", plz: "8010", city: "Graz", promotor: "Lisa Müller", requestDate: "2024-01-15", planStart: "09:00", planEnd: "17:00", product: "Vertuo" },
    { id: 2, market: "Spar Wien", address: "Kärntner Straße 25", plz: "1010", city: "Wien", promotor: "Max Weber", requestDate: "2024-01-14", planStart: "10:30", planEnd: "18:30", product: "Original" }
  ];

  // Mock data for today's Einsätze with actual start/end times
  const todaysEinsaetze = [
    { id: 1, market: "Interspar Graz", address: "Weblinger Gürtel 25", plz: "8054", city: "Graz", promotor: "Jan Müller", planStart: "09:00", planEnd: "17:00", actualStart: "09:15", actualEnd: null, status: "active" },
    { id: 2, market: "Billa Plus Wien", address: "Mariahilfer Straße 85", plz: "1060", city: "Wien", promotor: "Sarah Schmidt", planStart: "10:00", planEnd: "18:00", actualStart: "10:05", actualEnd: null, status: "active" },
    { id: 3, market: "Merkur Salzburg", address: "Alpenstraße 107", plz: "5020", city: "Salzburg", promotor: "Michael Weber", planStart: "08:30", planEnd: "16:30", actualStart: "08:45", actualEnd: "16:25", status: "completed" },
    { id: 4, market: "Spar Innsbruck", address: "Innrain 25", plz: "6020", city: "Innsbruck", promotor: "Lisa König", planStart: "09:30", planEnd: "19:00", actualStart: null, actualEnd: null, status: "pending" },
    { id: 5, market: "Hofer Linz", address: "Landstraße 49", plz: "4020", city: "Linz", promotor: "Thomas Bauer", planStart: "12:00", planEnd: "20:00", actualStart: "12:10", actualEnd: null, status: "active" },
    { id: 6, market: "Billa Klagenfurt", address: "Völkermarkter Ring 21", plz: "9020", city: "Klagenfurt", promotor: "Anna Steiner", planStart: "10:00", planEnd: "18:00", actualStart: null, actualEnd: null, status: "cancelled", cancelReason: "krankenstand" },
    { id: 7, market: "Spar Villach", address: "Hauptplatz 15", plz: "9500", city: "Villach", promotor: "Peter Huber", planStart: "11:00", planEnd: "19:00", actualStart: null, actualEnd: null, status: "cancelled", cancelReason: "notfall" },
    // Additional test data with gestartet status
    { id: 8, market: "Billa Wien Nord", address: "Prager Straße 180", plz: "1210", city: "Wien", promotor: "Markus Fischer", planStart: "08:00", planEnd: "16:00", actualStart: "08:05", actualEnd: null, status: "active" },
    { id: 9, market: "Spar Graz Süd", address: "Gradner Straße 42", plz: "8055", city: "Graz", promotor: "Julia Wagner", planStart: "09:30", planEnd: "17:30", actualStart: "09:25", actualEnd: null, status: "active" },
    { id: 10, market: "Merkur Linz", address: "Wiener Straße 25", plz: "4020", city: "Linz", promotor: "Robert Klein", planStart: "10:15", planEnd: "18:15", actualStart: "10:20", actualEnd: null, status: "active" },
    { id: 11, market: "Hofer Salzburg", address: "Münchner Straße 33", plz: "5020", city: "Salzburg", promotor: "Elena Hofer", planStart: "11:00", planEnd: "19:00", actualStart: "11:10", actualEnd: null, status: "active" },
    { id: 12, market: "Billa Plus Innsbruck", address: "Maria-Theresien-Straße 50", plz: "6020", city: "Innsbruck", promotor: "David Moser", planStart: "08:45", planEnd: "16:45", actualStart: "08:50", actualEnd: null, status: "active" },
    { id: 13, market: "Interspar Wien", address: "Lugner City", plz: "1150", city: "Wien", promotor: "Sophie Wimmer", planStart: "09:00", planEnd: "17:00", actualStart: "09:08", actualEnd: null, status: "active" },
    { id: 14, market: "Spar Klagenfurt", address: "Bahnhofstraße 44", plz: "9020", city: "Klagenfurt", promotor: "Martin Gruber", planStart: "10:30", planEnd: "18:30", actualStart: "10:35", actualEnd: null, status: "active" },
    { id: 15, market: "Merkur Villach", address: "Ringmauergasse 8", plz: "9500", city: "Villach", promotor: "Christina Pichler", planStart: "12:15", planEnd: "20:15", actualStart: "12:18", actualEnd: null, status: "active" },
    { id: 16, market: "Billa Graz West", address: "Eggenberger Straße 65", plz: "8020", city: "Graz", promotor: "Alexander Steiner", planStart: "07:30", planEnd: "15:30", actualStart: "07:35", actualEnd: null, status: "active" },
    { id: 17, market: "Hofer Wien Süd", address: "Triester Straße 210", plz: "1230", city: "Wien", promotor: "Petra Maier", planStart: "13:00", planEnd: "21:00", actualStart: "13:05", actualEnd: null, status: "active" },
    { id: 18, market: "Spar Linz Nord", address: "Freistädter Straße 315", plz: "4040", city: "Linz", promotor: "Stefan Berger", planStart: "09:15", planEnd: "17:15", actualStart: "09:18", actualEnd: null, status: "active" },
    { id: 19, market: "Interspar Salzburg", address: "Europark", plz: "5015", city: "Salzburg", promotor: "Nicole Huber", planStart: "10:45", planEnd: "18:45", actualStart: "10:50", actualEnd: null, status: "active" },
    { id: 20, market: "Billa Innsbruck West", address: "Olympiastraße 10", plz: "6020", city: "Innsbruck", promotor: "Thomas Lechner", planStart: "11:30", planEnd: "19:30", actualStart: "11:33", actualEnd: null, status: "active" },
    { id: 21, market: "Merkur Klagenfurt", address: "St. Veiter Ring 47", plz: "9020", city: "Klagenfurt", promotor: "Sabine Wolf", planStart: "08:15", planEnd: "16:15", actualStart: "08:20", actualEnd: null, status: "active" },
    { id: 22, market: "Spar Villach Ost", address: "Ossiacher Zeile 45", plz: "9500", city: "Villach", promotor: "Daniel Kraus", planStart: "14:00", planEnd: "22:00", actualStart: "14:03", actualEnd: null, status: "active" },
    { id: 23, market: "Hofer Graz Ost", address: "Liebenauer Hauptstraße 120", plz: "8041", city: "Graz", promotor: "Andrea Fuchs", planStart: "07:45", planEnd: "15:45", actualStart: "07:48", actualEnd: null, status: "active" },
    { id: 24, market: "Billa Wien Mitte", address: "Landstraßer Hauptstraße 1", plz: "1030", city: "Wien", promotor: "Manuel Bauer", planStart: "13:30", planEnd: "21:30", actualStart: "13:35", actualEnd: null, status: "active" },
    { id: 25, market: "Interspar Linz", address: "PlusCity", plz: "4061", city: "Linz", promotor: "Vanessa Köhler", planStart: "09:45", planEnd: "17:45", actualStart: "09:48", actualEnd: null, status: "active" },
    { id: 26, market: "Merkur Salzburg Nord", address: "Vogelweiderstraße 70", plz: "5020", city: "Salzburg", promotor: "Florian Reiter", planStart: "11:15", planEnd: "19:15", actualStart: "11:20", actualEnd: null, status: "active" },
    { id: 27, market: "Spar Innsbruck Ost", address: "Amraser Straße 8", plz: "6020", city: "Innsbruck", promotor: "Lisa Mayer", planStart: "12:45", planEnd: "20:45", actualStart: "12:50", actualEnd: null, status: "active" }
  ];

  // Recent activities
  const recentActivities = [
    { id: 1, action: "Neue Promotion-Anfrage", user: "Jan Müller", time: "vor 15 Min", type: "request" },
    { id: 2, action: "Schulung abgeschlossen", user: "Sarah Schmidt", time: "vor 1 Std", type: "training" },
    { id: 3, action: "Bericht eingereicht", user: "Michael Weber", time: "vor 2 Std", type: "report" },
    { id: 4, action: "Equipment bestellt", user: "System", time: "vor 3 Std", type: "system" }
  ];

  const formatTime = (time: string | null) => {
    return time || '--:--';
  };

  const getStatusColor = (einsatz: any) => {
    // Red for cancelled (krankenstand or notfall)
    if (einsatz.status === 'cancelled' && (einsatz.cancelReason === 'krankenstand' || einsatz.cancelReason === 'notfall')) {
      return 'red';
    }
    
    // Green for started
    if (einsatz.actualStart) {
      return 'green';
    }
    
    // Orange if not started 30 minutes after planned start
    if (!einsatz.actualStart && einsatz.planStart) {
      const now = new Date();
      const [hours, minutes] = einsatz.planStart.split(':').map(Number);
      const planStart = new Date();
      planStart.setHours(hours, minutes, 0, 0);
      
      const thirtyMinutesLater = new Date(planStart.getTime() + 30 * 60 * 1000);
      
      if (now > thirtyMinutesLater) {
        return 'orange';
      }
    }
    
    // Default gray for pending
    return 'gray';
  };

  // Get unique location combinations for filter
  const getLocationOptions = () => {
    const unique = new Set(todaysEinsaetze.map(e => `${e.plz} ${e.city}`));
    return Array.from(unique).sort();
  };

  // Filter einsätze based on selected location
  const filteredEinsaetze = einsatzFilter === "alle" 
    ? todaysEinsaetze 
    : todaysEinsaetze.filter(e => `${e.plz} ${e.city}` === einsatzFilter);

  // Calculate completion statistics
  const getCompletionStats = () => {
    const started = filteredEinsaetze.filter(e => e.actualStart).length;
    const cancelled = filteredEinsaetze.filter(e => e.status === 'cancelled').length;
    const notStarted = filteredEinsaetze.filter(e => !e.actualStart && e.status !== 'cancelled').length;
    const completed = started + cancelled;
    const total = filteredEinsaetze.length;
    const completionPercentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { started, cancelled, notStarted, completionPercentage };
  };

  // Get status color for a location based on einsätze in that location
  const getLocationStatusColor = (location: string) => {
    const locationEinsaetze = todaysEinsaetze.filter(e => `${e.plz} ${e.city}` === location);
    
    // Check for cancelled first (highest priority)
    if (locationEinsaetze.some(e => e.status === 'cancelled')) return 'red';
    
    // Check for started
    if (locationEinsaetze.some(e => e.actualStart)) return 'green';
    
    // Check for late (verspätet) - not started 30 minutes after planned start
    const hasLateEinsatz = locationEinsaetze.some(e => {
      if (!e.actualStart && e.planStart) {
        const now = new Date();
        const [hours, minutes] = e.planStart.split(':').map(Number);
        const planStart = new Date();
        planStart.setHours(hours, minutes, 0, 0);
        const thirtyMinutesLater = new Date(planStart.getTime() + 30 * 60 * 1000);
        return now > thirtyMinutesLater;
      }
      return false;
    });
    
    if (hasLateEinsatz) return 'orange';
    
    return 'gray';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Sending message:", messageForm);
    setShowMessageModal(false);
    setMessageForm({ recipient: "all", subject: "", message: "" });
  };

  const openInGoogleMaps = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleApproveRequest = (requestId: number) => {
    console.log("Approved request:", requestId);
    // Here you would typically call an API to approve the request
  };

  const handleDeclineRequest = (requestId: number) => {
    setSelectedRequestId(requestId);
    setShowDeclineModal(true);
  };

  const submitDeclineReason = () => {
    console.log("Declined request:", selectedRequestId, "Reason:", declineReason);
    // Here you would typically call an API to decline the request with reason
    setShowDeclineModal(false);
    setDeclineReason('');
    setSelectedRequestId(null);
  };

  const navigationItems = [
    { id: "overview", label: "Übersicht", icon: Home, active: true },
    { id: "promotions", label: "Promotions", icon: Briefcase },
    { id: "team", label: "Team", icon: Users },
    { id: "messages", label: "Nachrichten", icon: MessageSquare },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Einstellungen", icon: Settings }
  ];

  // Typing animation effect
  useEffect(() => {
    if (fullEddieText.length === 0) return;
    
    let index = 0;
    const timer = setInterval(() => {
      setEddieText(fullEddieText.slice(0, index + 1));
      index++;
      
      if (index >= fullEddieText.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, 30); // Typing speed: 30ms per character
    
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll effect during typing
  useEffect(() => {
    if (textContainerRef.current && isTyping) {
      textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
    }
  }, [eddieText, isTyping]);

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
                onClick={() => setSidebarOpen(!sidebarOpen)}
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
              <h1 className="text-2xl font-semibold text-gray-900">Guten Tag, Admin</h1>
              <p className="text-gray-500 text-sm">Hier ist Ihr Überblick für heute</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowMessageModal(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Nachricht senden
              </Button>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8 space-y-6">
          {/* Top Row: Eddie Card & Today's Einsätze */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Eddie Assistant Card */}
            <Card 
              className="border-0 w-96 h-80 bg-gradient-to-br from-white to-blue-50/30"
              style={{
                boxShadow: '0 4px 20px -2px rgba(59, 130, 246, 0.08), 0 2px 8px -1px rgba(59, 130, 246, 0.04)'
              }}
            >
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <img
                    src="/icons/robot 1.svg"
                    alt="Eddie AI"
                    className="h-5 w-5"
                  />
                  <h3 className="text-lg font-semibold text-gray-900">Was gibts zu tun?</h3>
                </div>
                <div className="w-full h-px bg-gray-100 mb-4"></div>
                <div 
                  ref={textContainerRef} 
                  className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 scrollbar-thumb-rounded-full [&::-webkit-scrollbar-button]:hidden"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#e5e7eb transparent'
                  }}
                >
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line pr-2">
                    {eddieText}
                    {isTyping && <span className="animate-pulse">|</span>}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Today's Einsätze Card */}
            <Card 
              className="border-0 h-80 flex-1"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 185, 151, 0.003) 50%, rgba(255, 133, 82, 0.005) 100%)',
                boxShadow: '0 4px 20px -2px rgba(255, 133, 82, 0.06), 0 2px 8px -1px rgba(255, 185, 151, 0.04), 0 8px 32px -4px rgba(255, 133, 82, 0.03)'
              }}
            >
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Heutige Einsätze</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode(viewMode === 'list' ? 'cards' : 'list')}
                      className="p-1 rounded hover:bg-gray-100 transition-colors opacity-50"
                    >
                      {viewMode === 'list' ? (
                        <LayoutGrid className="h-4 w-4 text-gray-600" />
                      ) : (
                        <LayoutList className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="text-xs bg-white border border-gray-200/50 rounded px-2 py-1 text-gray-600 focus:outline-none transition-colors flex items-center justify-between min-w-20"
                      >
                        <span>{einsatzFilter}</span>
                        <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 20 20">
                          <path stroke="#6b7280" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m6 8 4 4 4-4"/>
                        </svg>
                      </button>
                      {showDropdown && (
                        <div 
                          className="absolute top-full right-0 mt-1 border-0 rounded-xl shadow-lg z-10 overflow-hidden w-40 bg-white"
                        >
                          <div
                            onClick={() => {setEinsatzFilter("alle"); setShowDropdown(false);}}
                            className="px-2 py-1 text-xs text-gray-600 cursor-pointer hover:bg-gradient-to-r hover:from-white hover:to-gray-100/80 transition-all duration-200"
                          >
                            alle
                          </div>
                          {getLocationOptions().slice(0, 8).map(location => {
                            const statusColor = getLocationStatusColor(location);
                            const hoverClass = statusColor === 'green' 
                              ? 'hover:bg-gradient-to-r hover:from-white hover:to-green-100/80'
                              : statusColor === 'red'
                              ? 'hover:bg-gradient-to-r hover:from-white hover:to-red-100/80'
                              : statusColor === 'orange'
                              ? 'hover:bg-gradient-to-r hover:from-white hover:to-orange-100/80'
                              : 'hover:bg-gradient-to-r hover:from-white hover:to-gray-100/80';
                            
                            return (
                              <div
                                key={location}
                                onClick={() => {setEinsatzFilter(location); setShowDropdown(false);}}
                                className={`px-2 py-1 text-xs text-gray-600 cursor-pointer ${hoverClass} transition-all duration-200`}
                              >
                                {location}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  {(() => {
                    const stats = getCompletionStats();
                    return (
                      <div className="space-y-2">
                        {/* Progress bar */}
                        <div className="w-full bg-gray-100 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full transition-all duration-300 ${
                              stats.completionPercentage === 100 ? 'bg-green-200' : 'bg-gradient-to-r from-gray-300 to-gray-400'
                            }`}
                            style={{ width: `${stats.completionPercentage}%` }}
                          ></div>
                        </div>
                        {/* Statistics indicators */}
                        <div className="flex items-center space-x-4 opacity-50">
                          <span className="text-xs text-green-600">{stats.started}</span>
                          <span className="text-xs text-red-600">{stats.cancelled}</span>
                          <span className="text-xs text-gray-600">{stats.notStarted}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div 
                  className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  {viewMode === 'list' ? (
                    <div className="space-y-2">
                      {filteredEinsaetze.map((einsatz) => {
                        const statusColor = getStatusColor(einsatz);
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
                                  <span>{einsatz.planStart} - {einsatz.planEnd}</span>
                                </div>
                                <div className="text-xs text-gray-600 text-center">
                                  <span>{formatTime(einsatz.actualStart)} - {formatTime(einsatz.actualEnd)}</span>
                                </div>
                                <div className="text-xs text-right">
                                  {einsatz.status === 'cancelled' ? (
                                    <span className="text-red-600 font-medium">
                                      {einsatz.cancelReason}
                                    </span>
                                  ) : statusColor === 'green' ? (
                                    <span className="text-green-600 font-medium">gestartet</span>
                                  ) : statusColor === 'orange' ? (
                                    <span className="text-orange-600 font-medium">verspätet</span>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center ml-4">
                                <div className={`w-2 h-2 rounded-full ${
                                  statusColor === 'green' ? 'bg-green-400' :
                                  statusColor === 'orange' ? 'bg-orange-400' :
                                  statusColor === 'red' ? 'bg-red-400' :
                                  'bg-gray-300'
                                }`}></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 h-fit">
                      {filteredEinsaetze.map((einsatz) => {
                        const statusColor = getStatusColor(einsatz);
                        return (
                          <div 
                            key={einsatz.id} 
                            className={`p-3 rounded-lg border border-gray-100 transition-all duration-200 hover:border-gray-200 hover:shadow-sm ${
                              statusColor === 'green' 
                                ? 'bg-gradient-to-br from-white to-green-50/35' 
                                : statusColor === 'orange'
                                ? 'bg-gradient-to-br from-white to-orange-50/35'
                                : statusColor === 'red'
                                ? 'bg-gradient-to-br from-white to-red-50/35'
                                : 'bg-white'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-medium text-gray-900 truncate">{einsatz.promotor}</h4>
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  statusColor === 'green' ? 'bg-green-400' :
                                  statusColor === 'orange' ? 'bg-orange-400' :
                                  statusColor === 'red' ? 'bg-red-400' :
                                  'bg-gray-300'
                                }`}></div>
                              </div>
                              <button
                                onClick={() => openInGoogleMaps(einsatz.address, einsatz.city)}
                                className="text-xs text-gray-500 text-left cursor-pointer hover:text-blue-600 block truncate w-full"
                              >
                                {einsatz.address}
                              </button>
                              <div className="text-xs text-gray-600 truncate">
                                {einsatz.plz} {einsatz.city}
                              </div>
                              <div className="text-xs text-gray-600">
                                {einsatz.planStart} - {einsatz.planEnd}
                              </div>
                              <div className="text-xs text-gray-600">
                                {formatTime(einsatz.actualStart)} - {formatTime(einsatz.actualEnd)}
                              </div>
                              <div className="text-xs">
                                {einsatz.status === 'cancelled' ? (
                                  <span className="text-red-600 font-medium text-xs">
                                    {einsatz.cancelReason}
                                  </span>
                                ) : statusColor === 'green' ? (
                                  <span className="text-green-600 font-medium">gestartet</span>
                                ) : statusColor === 'orange' ? (
                                  <span className="text-orange-600 font-medium">verspätet</span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
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

          {/* Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="border-0 cursor-pointer hover:scale-[1.02] transition-transform duration-200"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(34, 197, 94, 0.003) 50%, rgba(21, 128, 61, 0.005) 100%)',
                boxShadow: '0 4px 20px -2px rgba(21, 128, 61, 0.06), 0 2px 8px -1px rgba(34, 197, 94, 0.04), 0 8px 32px -4px rgba(21, 128, 61, 0.03)'
              }}
              onClick={() => setShowActivePromotionsModal(true)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{todaysEinsaetze.filter(e => e.actualStart).length}</p>
                    <p className="text-xs text-gray-500">Aktive Promotions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-0 cursor-pointer hover:scale-[1.02] transition-transform duration-200"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(251, 146, 60, 0.003) 50%, rgba(234, 88, 12, 0.005) 100%)',
                boxShadow: '0 4px 20px -2px rgba(234, 88, 12, 0.06), 0 2px 8px -1px rgba(251, 146, 60, 0.04), 0 8px 32px -4px rgba(234, 88, 12, 0.03)'
              }}
              onClick={() => setShowOffeneAnfragenModal(true)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{pendingRequests.length}</p>
                    <p className="text-xs text-gray-500">Offene Anfragen</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-0"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(59, 130, 246, 0.003) 50%, rgba(29, 78, 216, 0.005) 100%)',
                boxShadow: '0 4px 20px -2px rgba(29, 78, 216, 0.06), 0 2px 8px -1px rgba(59, 130, 246, 0.04), 0 8px 32px -4px rgba(29, 78, 216, 0.03)'
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">12</p>
                    <p className="text-xs text-gray-500">Aktive Promotoren</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-0"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(168, 85, 247, 0.003) 50%, rgba(126, 34, 206, 0.005) 100%)',
                boxShadow: '0 4px 20px -2px rgba(126, 34, 206, 0.06), 0 2px 8px -1px rgba(168, 85, 247, 0.04), 0 8px 32px -4px rgba(126, 34, 206, 0.03)'
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">+15%</p>
                    <p className="text-xs text-gray-500">Wochenwachstum</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Promotions & Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Promotions */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Heutige Promotions</CardTitle>
                <CardDescription className="text-sm text-gray-500">Aktuelle Einsätze im Überblick</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {todaysPromotions.map((promotion) => (
                    <div key={promotion.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">{promotion.location}</h4>
                          <Badge 
                            variant={promotion.status === 'aktiv' ? 'default' : promotion.status === 'pause' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {promotion.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">{promotion.promotor}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-gray-400 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {promotion.time}
                          </span>
                          <span className="text-xs text-gray-400">{promotion.product}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Letzte Aktivitäten</CardTitle>
                <CardDescription className="text-sm text-gray-500">Aktuelle Systemereignisse</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-4 hover:bg-gray-50/50 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        activity.type === 'request' ? 'bg-orange-100' :
                        activity.type === 'training' ? 'bg-green-100' :
                        activity.type === 'report' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {activity.type === 'request' ? <AlertCircle className="h-4 w-4 text-orange-600" /> :
                         activity.type === 'training' ? <UserCheck className="h-4 w-4 text-green-600" /> :
                         activity.type === 'report' ? <BarChart3 className="h-4 w-4 text-blue-600" /> :
                         <Settings className="h-4 w-4 text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{activity.user}</span>
                          <span>•</span>
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Schnellzugriffe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2">
                  <Plus className="h-5 w-5" />
                  <span className="text-xs">Neue Promotion</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2">
                  <Users className="h-5 w-5" />
                  <span className="text-xs">Team verwalten</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2">
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-xs">Bericht erstellen</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-xs">Team-Chat</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Active Promotions Modal */}
      {showActivePromotionsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card 
            className="w-full max-w-6xl border border-white/20 shadow-xl max-h-[90vh] overflow-hidden backdrop-blur-none"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 185, 151, 0.003) 50%, rgba(255, 133, 82, 0.005) 100%)',
              boxShadow: '0 4px 20px -2px rgba(255, 133, 82, 0.06), 0 2px 8px -1px rgba(255, 185, 151, 0.04), 0 8px 32px -4px rgba(255, 133, 82, 0.03)'
            }}
          >
            <CardHeader className="pb-4 border-b border-gray-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Aktive Promotions</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {(() => {
                        const activePromotions = todaysEinsaetze.filter(e => e.actualStart);
                        return `${activePromotions.length} gestartete Einsätze`;
                      })()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Promotor suchen..."
                    value={activePromotionsSearch}
                    onChange={(e) => setActivePromotionsSearch(e.target.value)}
                    className="px-3 py-1.5 text-sm border-0 bg-white/60 rounded-lg focus:outline-none focus:ring-0 placeholder-gray-400"
                    style={{ opacity: 0.7 }}
                  />
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setActivePromotionsViewMode(activePromotionsViewMode === 'list' ? 'cards' : 'list')}
                      className="h-8 w-8 text-gray-900 hover:text-gray-700"
                    >
                      {activePromotionsViewMode === 'list' ? (
                        <LayoutGrid className="h-4 w-4" />
                      ) : (
                        <LayoutList className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowActivePromotionsModal(false)}
                      className="h-8 w-8 text-gray-900 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent 
              className="p-6 overflow-auto max-h-[70vh] [&::-webkit-scrollbar]:hidden" 
              style={{ 
                backdropFilter: 'none',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {(() => {
                const activePromotions = todaysEinsaetze
                  .filter(e => e.actualStart)
                  .filter(e => e.promotor.toLowerCase().includes(activePromotionsSearch.toLowerCase()));
                
                if (activePromotions.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Keine aktiven Promotions</p>
                    </div>
                  );
                }

                if (activePromotionsViewMode === 'list') {
                  return (
                    <div className="space-y-2">
                      {activePromotions.map((einsatz) => {
                        const statusColor = getStatusColor(einsatz);
                        return (
                          <div 
                            key={einsatz.id} 
                            className={`p-4 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-sm ${
                              statusColor === 'green' 
                                ? 'bg-gradient-to-r from-green-50/60 to-white/60' 
                                : statusColor === 'orange'
                                ? 'bg-gradient-to-r from-orange-50/60 to-white/60'
                                : statusColor === 'red'
                                ? 'bg-gradient-to-r from-red-50/60 to-white/60'
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
                                  <span>{einsatz.planStart} - {einsatz.planEnd}</span>
                                </div>
                                <div className="text-xs text-gray-600 text-center">
                                  <span>{formatTime(einsatz.actualStart)} - {formatTime(einsatz.actualEnd)}</span>
                                </div>
                                <div className="text-xs text-center flex items-center justify-end space-x-2">
                                  {einsatz.status === 'cancelled' ? (
                                    <span className="text-red-600 font-medium text-xs">
                                      {einsatz.cancelReason}
                                    </span>
                                  ) : statusColor === 'green' ? (
                                    <span className="text-green-600 font-medium">gestartet</span>
                                  ) : statusColor === 'orange' ? (
                                    <span className="text-orange-600 font-medium">verspätet</span>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
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
                  );
                } else {
                  return (
                    <div className="grid grid-cols-4 gap-2 h-fit">
                      {activePromotions.map((einsatz) => {
                        const statusColor = getStatusColor(einsatz);
                        return (
                          <div 
                            key={einsatz.id} 
                            className={`p-3 rounded-lg border border-gray-100 transition-all duration-200 hover:border-gray-200 hover:shadow-sm ${
                              statusColor === 'green' 
                                ? 'bg-gradient-to-br from-green-50/60 to-white/60' 
                                : statusColor === 'orange'
                                ? 'bg-gradient-to-br from-orange-50/60 to-white/60'
                                : statusColor === 'red'
                                ? 'bg-gradient-to-br from-red-50/60 to-white/60'
                                : 'bg-white'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-medium text-gray-900 truncate">{einsatz.promotor}</h4>
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  statusColor === 'green' ? 'bg-green-400' :
                                  statusColor === 'orange' ? 'bg-orange-400' :
                                  statusColor === 'red' ? 'bg-red-400' :
                                  'bg-gray-300'
                                }`}></div>
                              </div>
                              <button
                                onClick={() => openInGoogleMaps(einsatz.address, einsatz.city)}
                                className="text-xs text-gray-500 text-left cursor-pointer hover:text-blue-600 block truncate w-full"
                              >
                                {einsatz.address}
                              </button>
                              <div className="text-xs text-gray-600 truncate">
                                {einsatz.plz} {einsatz.city}
                              </div>
                              <div className="text-xs text-gray-600">
                                {einsatz.planStart} - {einsatz.planEnd}
                              </div>
                              <div className="text-xs text-gray-600">
                                {formatTime(einsatz.actualStart)} - {formatTime(einsatz.actualEnd)}
                              </div>
                              <div className="text-xs">
                                {einsatz.status === 'cancelled' ? (
                                  <span className="text-red-600 font-medium text-xs">
                                    {einsatz.cancelReason}
                                  </span>
                                ) : statusColor === 'green' ? (
                                  <span className="text-green-600 font-medium">gestartet</span>
                                ) : statusColor === 'orange' ? (
                                  <span className="text-orange-600 font-medium">verspätet</span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Offene Anfragen Modal */}
      {showOffeneAnfragenModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card 
            className="w-full max-w-6xl border border-white/20 shadow-xl max-h-[90vh] overflow-hidden backdrop-blur-none"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(251, 146, 60, 0.003) 50%, rgba(234, 88, 12, 0.005) 100%)',
              boxShadow: '0 4px 20px -2px rgba(234, 88, 12, 0.06), 0 2px 8px -1px rgba(251, 146, 60, 0.04), 0 8px 32px -4px rgba(234, 88, 12, 0.03)'
            }}
          >
            <CardHeader className="pb-4 border-b border-gray-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Offene Anfragen</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {pendingRequests.length} wartende Anfragen
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowOffeneAnfragenModal(false)}
                    className="h-8 w-8 text-gray-900 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent 
              className="p-6 overflow-auto max-h-[70vh] [&::-webkit-scrollbar]:hidden" 
              style={{ 
                backdropFilter: 'none',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Keine offenen Anfragen</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className="p-4 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-sm bg-gradient-to-r from-orange-50/60 to-white/60"
                    >
                      <div className="flex items-center justify-between">
                        <div className="grid grid-cols-5 gap-4 flex-1 items-center">
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-gray-900">{request.promotor}</h4>
                            <button
                              onClick={() => openInGoogleMaps(request.address, request.city)}
                              className="text-xs text-gray-500 text-left cursor-pointer hover:text-blue-600"
                            >
                              {request.address}
                            </button>
                          </div>
                          <div className="text-xs text-gray-600 text-center">
                            <span>{request.plz} {request.city}</span>
                          </div>
                          <div className="text-xs text-gray-600 text-center">
                            <span>{request.planStart} - {request.planEnd}</span>
                          </div>
                          <div className="text-xs text-gray-600 text-center">
                            <span>{request.product}</span>
                          </div>
                          <div className="text-xs text-center">
                            <span className="text-orange-600 font-medium">wartend</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            className="w-6 h-6 flex items-center justify-center transition-colors"
                          >
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request.id)}
                            className="w-6 h-6 flex items-center justify-center transition-colors"
                          >
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card 
            className="w-full max-w-md border border-white/20 shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(251, 146, 60, 0.003) 50%, rgba(234, 88, 12, 0.005) 100%)',
              boxShadow: '0 4px 20px -2px rgba(234, 88, 12, 0.06), 0 2px 8px -1px rgba(251, 146, 60, 0.04), 0 8px 32px -4px rgba(234, 88, 12, 0.03)'
            }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Anfrage ablehnen</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeclineModal(false)}
                  className="h-8 w-8 text-gray-900 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Grund der Ablehnung</label>
                  <Textarea
                    placeholder="Bitte geben Sie den Grund für die Ablehnung an..."
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="border-red-300 focus:outline-none focus:ring-0 focus:border-red-300 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 h-24"
                    style={{ backdropFilter: 'none', outline: 'none !important', borderWidth: '1px' }}
                  />
                </div>
                <div className="flex space-x-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeclineModal(false)}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={submitDeclineReason}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    disabled={!declineReason.trim()}
                  >
                    Ablehnen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0 shadow-xl bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Wichtige Nachricht senden</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMessageModal(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Empfänger</label>
                  <select
                    value={messageForm.recipient}
                    onChange={(e) => setMessageForm({...messageForm, recipient: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">Alle Promotoren</option>
                    <option value="active">Nur aktive Promotoren</option>
                    <option value="specific">Bestimmte Personen</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Betreff</label>
                  <Input
                    type="text"
                    placeholder="Wichtige Mitteilung..."
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                    className="border-gray-200 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Nachricht</label>
                  <Textarea
                    placeholder="Ihre wichtige Nachricht..."
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                    className="border-gray-200 focus:ring-blue-500 h-24"
                  />
                </div>
                <div className="flex space-x-3 pt-2">
                  <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600">
                    <Send className="h-4 w-4 mr-2" />
                    Senden
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMessageModal(false)}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 