"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';
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
  X,
  CheckSquare,
  Send,
  UserPlus,
  MousePointer,
  History,
  Check,
  Search,
  Eye,
  EyeOff,
  Brain,
  User,
  Loader2,
  Sparkles
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import AdminNavigation from "@/components/AdminNavigation";
import AdminEddieAssistant from "@/components/AdminEddieAssistant";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// Typing animation component
const TypingText = ({ text, isTyping }: { text: string; isTyping: boolean }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    if (!isTyping) {
      setDisplayedText('');
      return;
    }
    
    let index = 0;
    setDisplayedText('');
    
    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 25); // 25ms per character for smooth typing
    
    return () => clearInterval(timer);
  }, [text, isTyping]);
  
  return <>{displayedText}</>;
};

export default function EinsatzplanPage() {
  // Custom scrollbar styles
  const customScrollbarStyle = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.3);
      border-radius: 2px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(156, 163, 175, 0.5);
    }
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
    }
    .overflow-y-auto::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

  `;
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

  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState<'roh' | 'intern'>('roh');
  const [einsatzplanData, setEinsatzplanData] = useState<any[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEinsatz, setSelectedEinsatz] = useState<any>(null);
  const [editingEinsatz, setEditingEinsatz] = useState<any>(null);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [declinedPromotor, setDeclinedPromotor] = useState<{user_id: string, name: string, invitation_id: string} | null>(null);
  const [openAssignments, setOpenAssignments] = useState<any[]>([]);
  const [selectedReplacementAssignments, setSelectedReplacementAssignments] = useState<string[]>([]);
  const [replacementRegionFilter, setReplacementRegionFilter] = useState("ALLE");
  
  // Promotion distribution states
  const [selectedPromotions, setSelectedPromotions] = useState<number[]>([]);
  const [showPromotorSelection, setShowPromotorSelection] = useState(false);
  const [selectedPromotors, setSelectedPromotors] = useState<string[]>([]);
  const [activeRegionFilter, setActiveRegionFilter] = useState<string>("all");
  const [promotorSelectionSearch, setPromotorSelectionSearch] = useState("");
  const [lastSelectedByIcon, setLastSelectedByIcon] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [distributionHistory, setDistributionHistory] = useState<any[]>([]);
  
  // AI Recommendations state
  const [aiMode, setAiMode] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());
  
  // Import conflict state
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [importConflicts, setImportConflicts] = useState<any[]>([]);
  const [conflictDecisions, setConflictDecisions] = useState<Map<string, 'excel' | 'existing'>>(new Map());
  
  // Load distribution history from database
  const loadInvitationHistory = async () => {
    try {
      const res = await fetch('/api/assignments/invitation-history');
      if (res.ok) {
        const data = await res.json();
        setDistributionHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load invitation history:', error);
    }
  };
  
  useEffect(() => {
    loadInvitationHistory();
  }, []);

  // Fetch open assignments when replacement modal opens
  useEffect(() => {
    if (showReplacementModal) {
      (async () => {
        try {
          const res = await fetch('/api/assignments?status=open');
          const data = await res.json();
          setOpenAssignments(data.assignments || []);
        } catch (error) {
          console.error('Error fetching open assignments:', error);
        }
      })();
    }
  }, [showReplacementModal]);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const [promotionView, setPromotionView] = useState<'sent' | 'applications'>('sent');
  
  // Promotors list for assignment
  const [promotorsList, setPromotorsList] = useState<any[]>([]);
  // Buddy toggle for bulk invites
  const [inviteBuddy, setInviteBuddy] = useState(false);
  // Accepted applications for the current assignment (detail view)
  const [applicationsList, setApplicationsList] = useState<any[]>([]);
  // Flash effect for promotor field
  const [promotorFieldFlash, setPromotorFieldFlash] = useState(false);

  useEffect(() => {
    const loadApplications = async () => {
      if (!showDetailModal || promotionView !== 'applications' || !editingEinsatz?.id) return;
      try {
        console.log('Loading applications for assignment:', editingEinsatz.id);
        const res = await fetch(`/api/assignments/${editingEinsatz.id}/applications`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        const apps = Array.isArray(data?.applications) ? data.applications : [];
        console.log('Loaded applications:', apps);
        setApplicationsList(apps);
      } catch (error) {
        console.error('Error loading applications:', error);
      }
    };
    
    // Load immediately
    loadApplications();
    
    // Refresh every 5 seconds when viewing applications tab
    const interval = setInterval(loadApplications, 5000);
    
    return () => clearInterval(interval);
  }, [showDetailModal, promotionView, editingEinsatz?.id]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/promotors', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.promotors) ? data.promotors.map((p: any) => ({ id: p.id, name: p.name, region: p.region })) : [];
        setPromotorsList(list);
      } catch {}
    })();
  }, []);
  

  
  // Eye filter state - when true, filter out "Verplant" items
  const [hideVerplant, setHideVerplant] = useState(false);
  

  
  // Function to assign promotion to a promotor
  const assignPromotionToPromotor = async (promotorName: string, promotorId?: string) => {
    if (!editingEinsatz) return;
    try {
      if (promotorId) {
        // Update participant
        await fetch(`/api/assignments/${editingEinsatz.id}/participants/choose`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: promotorId, role: 'lead' })
        })
        
        // Update invitation status to accepted
        await fetch(`/api/assignments/${editingEinsatz.id}/invites/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: promotorId })
        })
      }
    } catch (error) {
      console.error('Error assigning promotor:', error);
    }
    // optimistic UI
    setEditingEinsatz({ ...editingEinsatz, promotor: promotorName, status: 'Verplant' })
    setEinsatzplanData(prev => prev.map(item => item.id === editingEinsatz.id ? { ...item, promotor: promotorName, status: 'Verplant' } : item))
  };

  // Function to get AI recommendations
  const fetchAiRecommendations = async (assignmentId: string) => {
    console.log('🎯 [CLIENT] AI recommendation request started', { assignmentId });
    
    if (!assignmentId) {
      console.log('❌ [CLIENT] No assignment ID provided');
      setAiError('Bitte wählen Sie zuerst einen Einsatz aus');
      return;
    }

    setAiLoading(true);
    setAiError(null);
    console.log('🔄 [CLIENT] Setting loading state, calling API...');

    try {
      const requestBody = { 
        assignmentId: assignmentId,
        maxRecommendations: 6 
      };
      console.log('📤 [CLIENT] Request payload:', requestBody);

      const response = await fetch('/api/ai/recommend-promotors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 [CLIENT] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ [CLIENT] API error response:', errorText);
        throw new Error('Fehler beim Abrufen der Empfehlungen');
      }

      const data = await response.json();
      console.log('✅ [CLIENT] API response data:', data);
      console.log('🏆 [CLIENT] Recommendations received:', data.recommendations?.length || 0);
      
      setAiRecommendations(data.recommendations || []);
    } catch (err: any) {
      console.error('❌ [CLIENT] AI request failed:', err);
      setAiError(err.message || 'Unbekannter Fehler');
      setAiRecommendations([]);
    } finally {
      setAiLoading(false);
      console.log('🏁 [CLIENT] AI request completed');
    }
  };

  // Function to assign buddy to promotion
  const assignBuddyToPromotion = async (buddyName: string, buddyId?: string) => {
    if (!editingEinsatz) return;
    try {
      if (buddyId) {
        // Update participant as buddy
        await fetch(`/api/assignments/${editingEinsatz.id}/participants/choose`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: buddyId, role: 'buddy' })
        })
        
        // Update assignment status to buddy_tag
        await fetch(`/api/assignments/${editingEinsatz.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'buddy_tag' })
        })
      } else if (!buddyName) {
        // Remove buddy if no name provided
        await fetch(`/api/assignments/${editingEinsatz.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: editingEinsatz.promotor ? 'assigned' : 'open' })
        })
      }
    } catch (error) {
      console.error('Error assigning buddy:', error);
    }
    // optimistic UI update
    const newStatus = buddyName ? 'Buddy Tag' : (editingEinsatz.promotor ? 'Verplant' : 'Offen');
    setEditingEinsatz({ ...editingEinsatz, buddy_name: buddyName || null, buddy_user_id: buddyId || null, status: newStatus })
    setEinsatzplanData(prev => prev.map(item => 
      item.id === editingEinsatz.id 
        ? { ...item, buddy_name: buddyName || null, buddy_user_id: buddyId || null, status: newStatus } 
        : item
    ))
  };

  // Function to update assignment status
  const updateAssignmentStatus = async (assignmentId: string, newStatus: string) => {
    try {
      // Convert UI status to database status
      const dbStatus = newStatus === 'Verplant' ? 'assigned' : 
                       newStatus === 'Buddy Tag' ? 'buddy_tag' :
                       newStatus === 'Offen' ? 'open' :
                       newStatus.toLowerCase();
      
      await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: dbStatus })
      });
      
      // Update local state
      setEditingEinsatz((prev: any) => prev ? { ...prev, status: newStatus } : prev);
      setEinsatzplanData((prev: any[]) => prev.map(item => 
        item.id === assignmentId ? { ...item, status: newStatus } : item
      ));
    } catch (error) {
      console.error('Error updating assignment status:', error);
    }
  };

  // Function to update assignment notes
  const updateAssignmentNotes = async (assignmentId: string, notes: string) => {
    try {
      console.log('🔵 Saving notes:', { assignmentId, notes });
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to save notes:', response.status, errorText);
        return;
      }
      
      const result = await response.json();
      console.log('✅ Notes saved successfully:', result);
      
      // Update local state
      setEditingEinsatz((prev: any) => prev ? { ...prev, notes } : prev);
      setEinsatzplanData((prev: any[]) => prev.map(item => 
        item.id === assignmentId ? { ...item, notes } : item
      ));
    } catch (error) {
      console.error('Error updating assignment notes:', error);
    }
  };

  const weeksContainerRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const plzDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current week number
  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  };

  // Get week number for any date
  const getWeekNumber = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
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

  const getStatusBackgroundColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verplant': return 'bg-green-50/40';
      case 'buddy tag': return 'bg-purple-50/40';
      case 'krankenstand': return 'bg-red-50/40';
      case 'notfall': return 'bg-orange-50/40';
      case 'urlaub': return 'bg-blue-50/40';
      case 'zeitausgleich': return 'bg-yellow-50/40';
      case 'markierte': return 'bg-purple-50/40';
      case 'bestätigt': return 'bg-green-50/40';
      case 'geplant': return 'bg-white';
      default: return 'bg-white';
    }
  };

  const getLocationOptions = () => {
    return [...new Set(einsatzplanData.map(item => item.city))];
  };

  const getPlzOptions = () => {
    return [...new Set(einsatzplanData.map(item => item.plz))].sort();
  };

  const getStatusOptions = () => {
    return ["Verplant", "Buddy Tag", "Krankenstand", "Notfall", "Urlaub", "Zeitausgleich", "Markierte"];
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case "Verplant": return "from-white to-green-100/60";
      case "Buddy Tag": return "from-white to-purple-100/60";
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
      case "Verplant": return "hover:bg-green-100/50";
      case "Buddy Tag": return "hover:bg-purple-100/50";
      case "Krankenstand": return "hover:bg-red-100/50";
      case "Notfall": return "hover:bg-orange-100/50";
      case "Urlaub": return "hover:bg-blue-100/50";
      case "Zeitausgleich": return "hover:bg-yellow-100/50";
      case "Markierte": return "hover:bg-purple-100/50";
      default: return "hover:bg-gray-50";
    }
  };

  const openInGoogleMaps = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Helper function to format promotor name consistently with dropdown
  const getDisplayName = (einsatz: any) => {
    // Always combine promotor and buddy names based on what's actually in the dropdowns
    const promotorName = einsatz.promotor;
    const buddyName = einsatz.buddy_name;
    
    if (promotorName && buddyName) {
      return `${promotorName} & ${buddyName}`;
    } else if (promotorName) {
      return promotorName;
    } else if (buddyName) {
      return buddyName;
    }
    
    return einsatz.product || 'Market';
  };

  // Helper functions for promotor selection (copied from admin dashboard)
  const getRegionGradient = (region: string) => {
    switch (region) {
      case "wien-noe-bgl":
        return "bg-[#E8F0FE]";
      case "steiermark":
        return "bg-[#E7F5ED]";
      case "salzburg":
        return "bg-[#F0E9FF]";
      case "oberoesterreich":
        return "bg-[#FFF3E6]";
      case "tirol":
        return "bg-[#FDEBF3]";
      case "vorarlberg":
        return "bg-[#EAF8FF]";
      case "kaernten":
        return "bg-[#EAF6FF]";
      default:
        return "bg-gray-50";
    }
  };

  const getRegionBorder = (region: string) => {
    switch (region) {
      case "wien-noe-bgl": return "border-[#CBD7F5]";
      case "steiermark": return "border-[#CFECDD]";
      case "salzburg": return "border-[#DDD4FF]";
      case "oberoesterreich": return "border-[#FFE3C7]";
      case "tirol": return "border-[#F8D5E5]";
      case "vorarlberg": return "border-[#CFEFFF]";
      case "kaernten": return "border-[#D6ECFF]";
      default: return "border-gray-200";
    }
  };

  const selectAllFiltered = () => {
    const filteredNames = promotorsList
      .filter((promotor: any) => 
        (activeRegionFilter === "all" || promotor.region === activeRegionFilter) &&
        promotor.name.toLowerCase().includes(promotorSelectionSearch.toLowerCase())
      )
      .map((promotor: any) => promotor.name);
    
    const allFilteredSelected = filteredNames.every(name => selectedPromotors.includes(name));
    const matchesLastSelection = lastSelectedByIcon.length > 0 && 
      filteredNames.every(name => lastSelectedByIcon.includes(name)) &&
      lastSelectedByIcon.every(name => filteredNames.includes(name));
    
    if (allFilteredSelected && matchesLastSelection) {
      setSelectedPromotors(prev => prev.filter(name => !lastSelectedByIcon.includes(name)));
      setLastSelectedByIcon([]);
    } else {
      setSelectedPromotors(prev => [...new Set([...prev, ...filteredNames])]);
      setLastSelectedByIcon(filteredNames);
    }
  };

  // PLZ to region mapping based on Austrian postal codes
  const getRegionFromPLZ = (plz: string): string => {
    const plzNum = parseInt(plz);
    if (isNaN(plzNum)) return '';
    
    // Define PLZ mapping - using exact mapping from provided list
    const plzMapping: { [key: string]: string } = {};
    
    // Add all Vienna postal codes (W)
    const viennaPLZ = ['1000','1004','1006','1010','1011','1015','1016','1020','1021','1024','1025','1029','1030','1031','1032','1035','1037','1038','1040','1041','1042','1043','1045','1050','1051','1052','1053','1060','1061','1063','1065','1070','1071','1072','1080','1081','1082','1090','1091','1092','1095','1097','1100','1101','1103','1104','1105','1106','1107','1108','1109','1110','1111','1114','1115','1120','1121','1122','1124','1125','1127','1128','1130','1131','1132','1134','1136','1140','1141','1142','1143','1147','1148','1150','1151','1152','1153','1155','1156','1160','1161','1163','1165','1166','1170','1171','1172','1180','1181','1182','1183','1190','1191','1192','1193','1195','1196','1200','1201','1203','1205','1206','1208','1210','1211','1213','1215','1217','1218','1219','1220','1221','1222','1223','1224','1225','1228','1229','1230','1231','1233','1235','1236','1238','1239','1254','1300','1310','1400','1423','1500','1502','1503','1504','1600','1610'];
    viennaPLZ.forEach(code => plzMapping[code] = 'W');
    
    // Use range-based approach for efficiency since we have thousands of codes
    // W/NÖ/BGL cluster (W, N, B initials)
    if (plzNum >= 1000 && plzNum <= 1610) return 'W/NÖ/BGL'; // Vienna
    if (plzNum >= 2000 && plzNum <= 3999) {
      // Special Burgenland ranges within this area
      if ((plzNum >= 2421 && plzNum <= 2425) || (plzNum >= 2473 && plzNum <= 2475) || plzNum === 2491) return 'W/NÖ/BGL';
      // Special OÖ ranges
      if (plzNum >= 3334 && plzNum <= 3335) return 'OÖ';
      return 'W/NÖ/BGL'; // Most is Niederösterreich
    }
    
    // OÖ (O initial)
    if (plzNum >= 4000 && plzNum <= 4999) {
      // Special Niederösterreich codes in this range
      if (plzNum === 4300 || plzNum === 4303 || (plzNum >= 4431 && plzNum <= 4432) || 
          plzNum === 4441 || plzNum === 4482 || plzNum === 4392) return 'W/NÖ/BGL';
      return 'OÖ';
    }
    
    // Mixed Salzburg (Sa) and OÖ (O)
    if (plzNum >= 5000 && plzNum <= 5999) {
      // OÖ ranges in 5xxx area
      if ((plzNum >= 5120 && plzNum <= 5145) || plzNum === 5166 || 
          (plzNum >= 5211 && plzNum <= 5283) || plzNum === 5310 || 
          plzNum === 5311 || plzNum === 5360) return 'OÖ';
      return 'S'; // Salzburg
    }
    
    // Tirol (T) and Vorarlberg (V)
    if (plzNum >= 6000 && plzNum <= 6999) {
      if (plzNum >= 6700) return 'V'; // Vorarlberg
      return 'T'; // Tirol
    }
    
    // Burgenland (B) range
    if (plzNum >= 7000 && plzNum <= 7999) {
      if (plzNum === 7421) return 'ST'; // Special Steiermark code
      return 'W/NÖ/BGL'; // Burgenland
    }
    
    // Steiermark (St)
    if (plzNum >= 8000 && plzNum <= 8999) {
      // Special Burgenland ranges in this area
      if (plzNum >= 8380 && plzNum <= 8385) return 'W/NÖ/BGL';
      return 'ST'; // Steiermark
    }
    
    // Kärnten (K) and some Tirol (T)
    if (plzNum >= 9000 && plzNum <= 9999) {
      if (plzNum === 9323) return 'ST'; // Special Steiermark
      if (plzNum === 9782 || plzNum >= 9900) return 'T'; // Tirol codes
      return 'K'; // Kärnten
    }
    
    return '';
  };

  // Check if two assignments match (same location, date, time)
  const assignmentsMatch = (a1: any, a2: any) => {
    return a1.location_text === a2.location_text &&
           a1.postal_code === a2.postal_code &&
           a1.start_ts === a2.start_ts &&
           a1.end_ts === a2.end_ts;
  };
  
  // Handle conflict resolution
  const handleConflictResolution = async () => {
    const assignmentsToImport: any[] = [];
    const assignmentsToUpdate: any[] = [];
    
    // Process each conflict based on user decisions
    for (const conflict of importConflicts) {
      const decision = conflictDecisions.get(conflict.existing.id) || 'existing';
      
      if (decision === 'excel') {
        // User wants the Excel version - update existing assignment to "Offen"
        assignmentsToUpdate.push({
          id: conflict.existing.id,
          status: 'Offen'
        });
      }
      // If 'existing', we keep the current state and ignore the Excel import
    }
    
    // Update existing assignments if needed
    if (assignmentsToUpdate.length > 0) {
      for (const update of assignmentsToUpdate) {
        await fetch(`/api/assignments/${update.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: update.status })
        });
      }
    }
    
    // Close modal and refresh
    setShowConflictModal(false);
    setImportConflicts([]);
    setConflictDecisions(new Map());
    await loadAssignments(true);
  };

  // Process Excel file for Roh Excel import
  const processRohExcel = (file: File) => {
    console.log('🔵 processRohExcel START - file:', file.name, 'size:', file.size);
    const reader = new FileReader();
    
    reader.onerror = (error) => {
      console.error('🔴 FileReader error:', error);
      alert('Fehler beim Lesen der Datei');
    };
    
    reader.onload = async (e) => {
      console.log('🔵 FileReader.onload triggered');
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        console.log('🔵 ArrayBuffer size:', data.length);
        const workbook = XLSX.read(data, { type: 'array' });
        console.log('🔵 Workbook sheets:', workbook.SheetNames);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log('🔵 Excel parsed. Total rows:', jsonData.length);
        console.log('🔵 First row (header):', jsonData[0]);
        console.log('🔵 Second row (data):', jsonData[1]);
        console.log('🔵 Date columns from header:', jsonData[0]?.slice(4, 10));
        // Expected layout:
        // Col A: location name (used as address text)
        // Col B: PLZ
        // Col C,D: ignored
        // Row 1 from Col E onwards: date labels (e.g., '04.Aug') as plain text
        // Body from Col E onwards: values 1, 2, or 0.75 meaning shifts per rules
        const header = jsonData[0] || [];
        const rows: any[] = [];
        console.log('🔵 Header length:', header.length);
        if (header.length < 5) throw new Error('Excel-Format unerwartet (Header fehlt)');
        
        console.log('🔵 Starting row processing...');
        for (let r = 1; r < jsonData.length; r++) {
          const row = jsonData[r] || [];
          const location_text = String(row[0] || '').trim();
          const postal_code = String(row[1] || '').trim();
          if (!location_text || !postal_code) continue;
          const city = '';
          const region = getRegionFromPLZ(postal_code);
          let assignmentsForRow = 0;
          for (let c = 4; c < header.length; c++) { // E onwards (0-indexed)
            const label = String(header[c] || '').trim();
            if (!label) continue;
            const cell = row[c];
            const val = typeof cell === 'number' ? cell : parseFloat(String(cell).replace(',', '.'));
            if (![1, 2, 0.75].includes(val)) continue;
            
            if (r === 1 && assignmentsForRow === 0) {
              console.log(`🔵 First valid cell - Col ${c}: label="${label}", value=${val}`);
            }
            
            // Handle Excel serial dates or text dates
            let start: Date;
            const numericLabel = parseInt(label, 10);
            
            if (!isNaN(numericLabel) && numericLabel > 40000) {
              // Excel serial date (days since 1900-01-01, but with leap year bug)
              const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
              const dateOnly = new Date(excelEpoch.getTime() + numericLabel * 24 * 60 * 60 * 1000);
              // Create date in UTC to avoid timezone shifts
              start = new Date(Date.UTC(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate(), 9, 30, 0, 0));
            } else {
              // Try parsing as text date (e.g., "04.Aug")
              const parts = label.split('.');
              if (parts.length < 2) continue;
              const day = parseInt(parts[0], 10);
              const monthName = parts[1];
              const months: Record<string, number> = { Jan:0, Feb:1, Mär:2, Mrz:2, Apr:3, Mai:4, Jun:5, Jul:6, Aug:7, Sep:8, Okt:9, Nov:10, Dez:11 };
              const month = months[monthName as keyof typeof months];
              if (month == null || isNaN(day)) continue;
              const year = new Date().getFullYear();
              start = new Date(Date.UTC(year, month, day, 9, 30));
            }
            const end = new Date(start);
            if (val === 1 || val === 2) {
              end.setUTCHours(18, 30, 0, 0);
            } else if (val === 0.75) {
              end.setUTCHours(15, 30, 0, 0);
            }
            const base = {
              title: 'Promotion',
              location_text,
              postal_code,
              city,
              region,
              start_ts: start.toISOString(),
              end_ts: end.toISOString(),
              type: 'promotion' as const,
            };
            rows.push(base);
            if (val === 2) rows.push(base);
          }
        }
        console.log('🔵 Assignments to import:', rows.length);
        if (rows.length > 0) {
          console.log('🔵 First assignment:', rows[0]);
          console.log('🔵 Sample dates:', rows.slice(0, 3).map(r => r.start_ts));
        }
        
        // Check for conflicts with existing assignments
        const newAssignments: any[] = [];
        const conflicts: any[] = [];
        
        for (const newRow of rows) {
          const existingMatch = einsatzplanData.find(existing => assignmentsMatch(existing, newRow));
          
          if (existingMatch) {
            // Check if it's identical (including status)
            if (existingMatch.status === 'Offen') {
              // Identical, skip
              continue;
            } else {
              // Different status - this is a conflict
              conflicts.push({
                excel: newRow,
                existing: existingMatch
              });
            }
          } else {
            // New assignment
            newAssignments.push(newRow);
          }
        }
        
        console.log('🔵 New assignments:', newAssignments.length);
        console.log('🔵 Conflicts:', conflicts.length);
        
        if (conflicts.length > 0) {
          // Show conflict modal
          setImportConflicts(conflicts);
          // Set default decisions to 'existing'
          const defaultDecisions = new Map();
          conflicts.forEach(c => defaultDecisions.set(c.existing.id, 'existing'));
          setConflictDecisions(defaultDecisions);
          setShowConflictModal(true);
          setShowImportModal(false);
          return;
        }
        
        // No conflicts, proceed with import
        if (newAssignments.length === 0) {
          alert('Keine neuen Einsätze zum Importieren gefunden.');
          setShowImportModal(false);
          return;
        }
        
        const res = await fetch('/api/assignments/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: newAssignments }) })
        console.log('🔵 Import response:', res.status);
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Import fehlgeschlagen: ${res.status} ${t}`);
        }
        const importResult = await res.json();
        console.log('🔵 Import result:', importResult);
        setShowImportModal(false)
        // Load ALL assignments after import to see the new ones
        console.log('🔵 Calling loadAssignments...');
        await loadAssignments(true)
        console.log('🔵 Import complete!');
      } catch (error: any) {
        console.error('🔴 Error processing Roh Excel:', error);
        console.error('🔴 Stack trace:', error?.stack);
        alert(error?.message || 'Fehler beim Verarbeiten');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Process Excel file for EP intern import
  const processInternExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // Reuse the same parsing as Roh: header row contains dates E→, body has counts
        const header = jsonData[0] || [];
        const rows: any[] = [];
        if (header.length < 5) throw new Error('Excel-Format unerwartet (Header fehlt)');
        for (let r = 1; r < jsonData.length; r++) {
          const row = jsonData[r] || [];
          const location_text = String(row[0] || '').trim();
          const postal_code = String(row[1] || '').trim();
          if (!location_text || !postal_code) continue;
          const city = '';
          const region = getRegionFromPLZ(postal_code);
          for (let c = 4; c < header.length; c++) {
            const label = String(header[c] || '').trim();
            if (!label) continue;
            const cell = row[c];
            const val = typeof cell === 'number' ? cell : parseFloat(String(cell).replace(',', '.'));
            if (![1, 2, 0.75].includes(val)) continue;
            
            // Handle Excel serial dates or text dates
            let start: Date;
            const numericLabel = parseInt(label, 10);
            
            if (!isNaN(numericLabel) && numericLabel > 40000) {
              // Excel serial date (days since 1900-01-01, but with leap year bug)
              const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
              const dateOnly = new Date(excelEpoch.getTime() + numericLabel * 24 * 60 * 60 * 1000);
              // Create date in UTC to avoid timezone shifts
              start = new Date(Date.UTC(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate(), 9, 30, 0, 0));
          } else {
              // Try parsing as text date (e.g., "04.Aug")
              const parts = label.split('.');
              if (parts.length < 2) continue;
              const day = parseInt(parts[0], 10);
              const monthName = parts[1];
              const months: Record<string, number> = { Jan:0, Feb:1, Mär:2, Mrz:2, Apr:3, Mai:4, Jun:5, Jul:6, Aug:7, Sep:8, Okt:9, Nov:10, Dez:11 };
              const month = months[monthName as keyof typeof months];
              if (month == null || isNaN(day)) continue;
              const year = new Date().getFullYear();
              start = new Date(Date.UTC(year, month, day, 9, 30));
            }
            const end = new Date(start);
            if (val === 1 || val === 2) {
              end.setUTCHours(18, 30, 0, 0);
            } else if (val === 0.75) {
              end.setUTCHours(15, 30, 0, 0);
            }
            const base = {
              title: 'Promotion',
              location_text,
              postal_code,
              city,
              region,
              start_ts: start.toISOString(),
              end_ts: end.toISOString(),
              type: 'promotion' as const,
            };
            rows.push(base);
            if (val === 2) rows.push(base);
          }
        }
        
        // Check for conflicts with existing assignments
        const newAssignments: any[] = [];
        const conflicts: any[] = [];
        
        for (const newRow of rows) {
          const existingMatch = einsatzplanData.find(existing => assignmentsMatch(existing, newRow));
          
          if (existingMatch) {
            // Check if it's identical (including status)
            if (existingMatch.status === 'Offen') {
              // Identical, skip
              continue;
            } else {
              // Different status - this is a conflict
              conflicts.push({
                excel: newRow,
                existing: existingMatch
              });
            }
          } else {
            // New assignment
            newAssignments.push(newRow);
          }
        }
        
        if (conflicts.length > 0) {
          // Show conflict modal
          setImportConflicts(conflicts);
          // Set default decisions to 'existing'
          const defaultDecisions = new Map();
          conflicts.forEach(c => defaultDecisions.set(c.existing.id, 'existing'));
          setConflictDecisions(defaultDecisions);
          setShowConflictModal(true);
          setShowImportModal(false);
          return;
        }
        
        // No conflicts, proceed with import
        if (newAssignments.length === 0) {
          alert('Keine neuen Einsätze zum Importieren gefunden.');
          setShowImportModal(false);
          return;
        }
        
        const res = await fetch('/api/assignments/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: newAssignments }) })
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Import fehlgeschlagen: ${res.status} ${t}`);
        }
        setShowImportModal(false)
        // Load ALL assignments after import to see the new ones
        await loadAssignments(true)
      } catch (error: any) {
        console.error('Error processing EP intern Excel file:', error);
        alert(error?.message || 'Fehler beim Verarbeiten der EP intern Excel-Datei');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle replacement assignment selection
  const handleReplacementAssignmentSelect = (assignmentId: string) => {
    setSelectedReplacementAssignments(prev => 
      prev.includes(assignmentId)
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  // Handle sending replacement invites
  const handleSendReplacementInvites = async () => {
    if (!declinedPromotor || selectedReplacementAssignments.length === 0) return;
    
    try {
      const res = await fetch('/api/assignments/bulk-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_ids: selectedReplacementAssignments,
          promotor_ids: [declinedPromotor.user_id],
          buddy: false,
          replacement_for: declinedPromotor.invitation_id
        })
      });
      
      if (res.ok) {
        setShowReplacementModal(false);
        setDeclinedPromotor(null);
        setSelectedReplacementAssignments([]);
        
        // Update the status in the invitations to show as replacement
        // This will trigger the replacement UI in the promotor's view
      }
      } catch (error) {
      console.error('Error sending replacement invites:', error);
      }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file?.name, 'Import type:', importType);
    if (file) {
      if (importType === 'roh') {
        processRohExcel(file);
      } else if (importType === 'intern') {
        processInternExcel(file);
      } else {
        console.log('Unknown import type:', importType);
      }
    }
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    console.log('File dropped:', file?.name, 'Import type:', importType);
    if (file) {
      if (importType === 'roh') {
        processRohExcel(file);
      } else if (importType === 'intern') {
        processInternExcel(file);
      } else {
        console.log('Unknown import type:', importType);
      }
    }
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
          buddyTag: 0,
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
        case 'buddy tag':
          dayData.buddyTag++;
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



  const filteredEinsatzplan = useMemo(() => {
    return einsatzplanData.filter(item => {
    // Region filter using PLZ mapping
    const itemRegion = getRegionFromPLZ(item.plz);
    const regionMatch = regionFilter === "ALLE" || itemRegion === regionFilter;
    
    // PLZ filter
    const plzMatch = !plzFilter || item.plz === plzFilter;
    
    // Status filter
    const statusMatch = !statusFilter || item.status === statusFilter;
    
    // Eye filter - hide all non-"Offen" items when active, based on UI status (dropdown value)
    const verplantMatch = !hideVerplant || item.status === 'Offen';
    
    // Date filters
    let dateMatch = true;
    
    // Single date filter (from day card clicks)
    if (dateFilter) {
      dateMatch = item.date === dateFilter;
    }
    // Calendar weeks filter
    else if (selectedWeeks.length > 0) {
      const itemDate = new Date(item.date);
      const itemWeek = getWeekNumber(itemDate);
      const itemYear = itemDate.getFullYear();
      dateMatch = selectedWeeks.some(weekStr => {
        const weekNum = parseInt(weekStr.match(/KW (\d+)/)?.[1] || '0');
        return weekNum === itemWeek && itemYear === new Date().getFullYear();
      });
    }
    // Date range filter
    else if (dateRange.start) {
      if (dateRange.end) {
        const start = dateRange.start <= dateRange.end ? dateRange.start : dateRange.end;
        const end = dateRange.start <= dateRange.end ? dateRange.end : dateRange.start;
        dateMatch = item.date >= start && item.date <= end;
      } else {
        dateMatch = item.date === dateRange.start;
      }
    }
    
    return regionMatch && plzMatch && statusMatch && verplantMatch && dateMatch;
  }).sort((a, b) => {
    // Sort by date (nearest to farthest)
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  }, [einsatzplanData, regionFilter, plzFilter, statusFilter, hideVerplant, dateFilter, selectedWeeks, dateRange]);



  // Memoize statistics to prevent repeated calculations
  const einsatzStats = useMemo(() => {
    const confirmed = filteredEinsatzplan.filter(item => ['bestätigt', 'Verplant', 'Buddy Tag'].includes(item.status)).length;
    const cancelled = filteredEinsatzplan.filter(item => ['Krankenstand', 'Notfall'].includes(item.status)).length;
    const planned = filteredEinsatzplan.filter(item => !['bestätigt', 'Verplant', 'Buddy Tag', 'Krankenstand', 'Notfall'].includes(item.status)).length;
    const total = filteredEinsatzplan.length;
    
    return {
      confirmed,
      cancelled,
      planned,
      total,
      confirmedPercentage: total > 0 ? Math.min(100, (confirmed / total) * 100) : 0
    };
  }, [filteredEinsatzplan]);

  const loadAssignments = async (skipFilters = false) => {
    console.log('🟢 loadAssignments called, skipFilters:', skipFilters);
    try {
      const params = new URLSearchParams();
      // Only apply filters if not skipping (e.g., after import we want to see all)
      if (!skipFilters) {
        if (dateRange.start) params.set('from', new Date(dateRange.start).toISOString());
        if (dateRange.end) params.set('to', new Date(dateRange.end).toISOString());
        if (regionFilter && regionFilter !== 'ALLE') params.set('region', regionFilter);
        if (statusFilter) params.set('status', statusFilter);
      }
      console.log('🟢 Fetching from /api/assignments with params:', params.toString());
      const res = await fetch(`/api/assignments?${params.toString()}`, { cache: 'no-store' });
      console.log('🟢 Response status:', res.status);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Laden fehlgeschlagen: ${res.status} ${t}`);
      }
      const j = await res.json();
      console.log('🟢 Response data:', j);
      const rows: any[] = Array.isArray(j.assignments) ? j.assignments : [];
      console.log('🟢 Assignments count:', rows.length);
      if (rows.length > 0) {
              console.log('🟢 First assignment data:', rows[0]);
      console.log('🟢 Notes field in first assignment:', rows[0].notes);
      }
      const mapped = rows.map((r) => {
        const startIso: string = r.start_ts || ''
        const endIso: string = r.end_ts || r.start_ts || ''
        const timeStart = startIso ? startIso.substring(11, 16) : '09:30'
        const timeEnd = endIso ? endIso.substring(11, 16) : ''
        const timeText = timeEnd ? `${timeStart}-${timeEnd}` : timeStart

        return {
          id: r.id,
          date: r.start_ts ? new Date(r.start_ts).toISOString().slice(0,10) : '',
          time: timeText,
          city: r.city || r.location_text || '',
          address: r.location_text || '',
          planStart: timeStart,
          planEnd: timeEnd,
          plz: r.postal_code || '',
          region: r.region || getRegionFromPLZ(String(r.postal_code || '')),
          // If there's a buddy, force status to Buddy Tag regardless of database status
          status: (r.buddy_name || r.buddy_display_name || r.buddy_user_id) ? 'Buddy Tag' : 
                  // Map all database statuses to UI statuses
                  (r.status === 'assigned' ? 'Verplant' : 
                   r.status === 'buddy_tag' ? 'Buddy Tag' : 
                   r.status === 'open' ? 'Offen' :
                   r.status === 'krankenstand' ? 'Krankenstand' :
                   r.status === 'notfall' ? 'Notfall' :
                   r.status === 'urlaub' ? 'Urlaub' :
                   r.status === 'zeitausgleich' ? 'Zeitausgleich' :
                   r.status === 'markierte' ? 'Markierte' :
                   r.status === 'bestätigt' ? 'bestätigt' :
                   r.status === 'geplant' ? 'geplant' :
                   (r.status || 'Offen')),
          // Include buddy information
          promotor: r.lead_name || (r.status === 'assigned' ? 'Verplant' : ''),
          buddy_name: r.buddy_name || r.buddy_display_name,
          buddy_user_id: r.buddy_user_id,
          promotionCount: 1,
          promotorCount: 0,
          promotions: [{ id: r.id }],
          notes: r.notes || '',
        }
      });
      console.log('🟢 Mapped data:', mapped.length, 'items');
      console.log('🟢 First mapped item:', mapped[0]);
      

      
      setEinsatzplanData(mapped);
      console.log('🟢 State updated with', mapped.length, 'assignments');
    } catch (e: any) {
      console.error('🔴 loadAssignments error:', e);
      alert(e?.message || 'Fehler beim Laden der Einsätze');
    }
  };

  useEffect(() => { loadAssignments(true); }, []);

  return (
    <div className="min-h-screen bg-gray-50/30">
      <style jsx>{customScrollbarStyle}</style>
      {/* Admin Navigation */}
      <AdminNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-14'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Einsatzplan</h1>
              <p className="text-gray-500 text-sm">Übersicht und Planung aller Einsätze</p>
            </div>
            <div className="flex items-center space-x-3">

              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 text-sm text-white border border-gray-200 rounded-lg transition-colors"
                style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)', opacity: 0.85}}
              >
Import EP
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8 space-y-6">
          {/* Einsatzplan View */}
          <div className="flex gap-6">
            {/* Big Card - Left Side */}
            <div className="flex-[3] relative">
              {/* Invisible placeholder to maintain layout space when expanded */}
              <div className="h-[600px] w-full"></div>
              
              <Card 
                className={`border-0 w-full transition-all duration-300 ${isMainCardExpanded ? 'absolute top-0 left-0 right-0 h-[960px] z-20' : 'absolute top-0 left-0 right-0 h-[600px]'}`}
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
                          onClick={() => setIsMainCardExpanded(!isMainCardExpanded)}
                          className="p-1 rounded hover:bg-gray-100 transition-colors opacity-50"
                        >
                          {isMainCardExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                        <button
                          onClick={() => setViewMode(viewMode === 'list' ? 'days' : 'list')}
                          className="p-1 rounded hover:bg-gray-100 transition-colors opacity-50"
                        >
                          {viewMode === 'list' ? (
                            <LayoutGrid className="h-4 w-4 text-gray-600" />
                          ) : (
                            <LayoutList className="h-4 w-4 text-gray-600" />
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
                              className="absolute top-full right-0 mt-1 border-0 rounded-lg shadow-lg z-10 w-40 bg-white max-h-60 overflow-y-auto custom-scrollbar"
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
                              className="absolute top-full right-0 mt-1 border-0 rounded-lg shadow-lg z-10 w-44 bg-white max-h-60 overflow-y-auto custom-scrollbar"
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
                              className="absolute top-full right-0 mt-1 border-0 rounded-lg shadow-lg z-10 w-80 bg-white max-h-96 overflow-y-auto custom-scrollbar"
                            >
                            {/* View Mode Toggle */}
                            <div className="p-3 border-b border-gray-100">
                              <div className="flex items-center justify-between">
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
                                <button
                                  onClick={() => {
                                    setSelectedWeeks([]);
                                    setDateRange({ start: null, end: null });
                                    setDateFilter("");
                                  }}
                                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                                  title="Filter zurücksetzen"
                                >
                                  <X className="h-3 w-3 text-gray-400" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Content Area */}
                            <div className="p-3">
                              {dateViewMode === 'weeks' ? (
                                <div ref={weeksContainerRef} className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
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
                                      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                      const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                                      const today = new Date();
                                      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                      const isToday = dateStr === todayStr;
                                      const allRangeDates = getAllRangeDates();
                                      const isStartOrEnd = dateStr === dateRange.start || dateStr === dateRange.end;
                                      const isInRange = allRangeDates.includes(dateStr) && !isStartOrEnd;
                                      const isDateFiltered = dateStr === dateFilter;
                                      const isSelected = isStartOrEnd || isDateFiltered;
                                      
                                      return (
                                        <button
                                          key={index}
                                          onClick={() => {
                                            // If clicking on dateFilter date, deselect it
                                            if (dateStr === dateFilter) {
                                              setDateFilter("");
                                            }
                                            // If clicking on already selected start or end date, deselect
                                            else if (dateStr === dateRange.start || dateStr === dateRange.end) {
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
                          style={{ 
                            width: `${einsatzStats.confirmedPercentage}%` 
                          }}
                        ></div>
                      </div>
                      {/* Statistics indicators */}
                      <div className="flex items-center justify-between opacity-50">
                        <div className="flex items-center space-x-4">
                          <span className="text-xs text-green-600">{einsatzStats.confirmed}</span>
                          <span className="text-xs text-red-600">{einsatzStats.cancelled}</span>
                          <span className="text-xs text-gray-600">{einsatzStats.planned}</span>
                        </div>
                        <button
                          onClick={() => setHideVerplant(!hideVerplant)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title={hideVerplant ? "Alle anzeigen" : "Nur Offene anzeigen"}
                        >
                          {hideVerplant ? (
                            <EyeOff className="h-3 w-3 text-gray-400" />
                          ) : (
                            <Eye className="h-3 w-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className="flex-1 overflow-y-auto"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    {viewMode === 'days' ? (
                      /* Days View */
                      <div key={`days-view-${hideVerplant ? 'filtered' : 'all'}`} className="grid grid-cols-4 gap-4">
                        {generateDayCards().map((dayData) => {
                          // Green background when there are 0 "Offen" assignments and at least one assignment total
                          const noOpenAssignments = dayData.total > 0 && dayData.offen === 0;
                          
                          return (
                          <div 
                            key={dayData.date}
                            onClick={() => {
                              setDateFilter(dayData.date);
                              setViewMode('list');
                            }}
                            className={`p-4 rounded-lg shadow-sm hover:shadow-sm hover:scale-[1.01] transition-all duration-200 cursor-pointer ${
                              noOpenAssignments ? 'bg-green-50' : 'bg-white'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Date Header with Total */}
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">{formatDateForCard(dayData.date)}</h4>
                                  <p className="text-xs text-gray-500">{new Date(dayData.date).toLocaleDateString('de-DE')}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-gray-900">{dayData.total}</div>
                                  <div className="text-xs text-gray-500">Gesamt</div>
                                </div>
                              </div>
                              
                              {/* Status List */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                    <span className="text-xs text-gray-600">Verplant</span>
                                  </div>
                                  <span className={`text-xs font-medium text-green-600 ${dayData.verplant === 0 ? 'opacity-30' : ''}`}>{dayData.verplant > 0 ? dayData.verplant : 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                    <span className="text-xs text-gray-600">Offen</span>
                                  </div>
                                  <span className={`text-xs font-medium text-gray-600 ${dayData.offen === 0 ? 'opacity-30' : ''}`}>{dayData.offen > 0 ? dayData.offen : 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                                    <span className="text-xs text-gray-600">Buddy Tage</span>
                                  </div>
                                  <span className={`text-xs font-medium text-purple-600 ${dayData.buddyTag === 0 ? 'opacity-30' : ''}`}>{dayData.buddyTag > 0 ? dayData.buddyTag : 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                    <span className="text-xs text-gray-600">Krankenstand</span>
                                  </div>
                                  <span className={`text-xs font-medium text-red-600 ${dayData.krankenstand === 0 ? 'opacity-30' : ''}`}>{dayData.krankenstand > 0 ? dayData.krankenstand : 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                    <span className="text-xs text-gray-600">Notfall</span>
                                  </div>
                                  <span className={`text-xs font-medium text-orange-600 ${dayData.notfall === 0 ? 'opacity-30' : ''}`}>{dayData.notfall > 0 ? dayData.notfall : 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                    <span className="text-xs text-gray-600">Urlaub</span>
                                  </div>
                                  <span className={`text-xs font-medium text-blue-600 ${dayData.urlaub === 0 ? 'opacity-30' : ''}`}>{dayData.urlaub > 0 ? dayData.urlaub : 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                    <span className="text-xs text-gray-600">Zeitausgleich</span>
                                  </div>
                                  <span className={`text-xs font-medium text-yellow-600 ${dayData.zeitausgleich === 0 ? 'opacity-30' : ''}`}>{dayData.zeitausgleich > 0 ? dayData.zeitausgleich : 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* List View */
                      <div key={`list-view-${hideVerplant ? 'filtered' : 'all'}`} className="space-y-2">
                        {filteredEinsatzplan.map((einsatz) => {
                        const hasPromotor = ['Verplant', 'bestätigt', 'Krankenstand'].includes(einsatz.status);
                        const isUnplanned = !hasPromotor;
                        return (
                          <div 
                            key={`${einsatz.id}-${hideVerplant ? 'filtered' : 'all'}`} 
                            onClick={(e) => {
                              if (selectionMode) {
                                e.stopPropagation();
                                setSelectedPromotions(prev => 
                                  prev.includes(einsatz.id) 
                                    ? prev.filter(id => id !== einsatz.id)
                                    : [...prev, einsatz.id]
                                );
                              } else if (aiMode) {
                                // AI mode: fetch recommendations instead of opening detail modal
                                console.log('🧠 [CLIENT] AI mode click detected', { einsatzId: einsatz.id, aiMode });
                                setSelectedEinsatz(einsatz);
                                fetchAiRecommendations(einsatz.id);
                              } else {
                                setSelectedEinsatz(einsatz);
                                // Extract just the promotor name without any formatting
                                const rawPromotorName = einsatz.promotor?.includes(' & ') 
                                  ? einsatz.promotor.split(' & ')[0] 
                                  : einsatz.promotor;
                                // Auto-set status to Buddy Tag if buddy_name exists
                                const autoStatus = einsatz.buddy_name ? 'Buddy Tag' : einsatz.status;
                                setEditingEinsatz({
                                  ...einsatz,
                                  promotor: rawPromotorName,
                                  status: autoStatus
                                });
                                setShowDetailModal(true);
                              }
                            }}
                            className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer ${
                              selectedPromotions.includes(einsatz.id) 
                                ? 'border-blue-300 bg-blue-50 shadow-md' 
                                : 'border-gray-100'
                            } ${getStatusBackgroundColor(einsatz.status)}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="grid grid-cols-5 gap-4 flex-1 items-center">
                                <div className="min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900">{getDisplayName(einsatz)}</h4>
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
                                    einsatz.status === 'Verplant' || einsatz.status === 'bestätigt' ? 'text-green-500' :
                                    einsatz.status === 'Buddy Tag' ? 'text-purple-500' :
                                    einsatz.status === 'Krankenstand' ? 'text-red-500' :
                                    einsatz.status === 'Notfall' ? 'text-orange-500' :
                                    einsatz.status === 'Urlaub' ? 'text-blue-500' :
                                    einsatz.status === 'Zeitausgleich' ? 'text-yellow-600' :
                                    einsatz.status === 'Markierte' ? 'text-purple-500' :
                                    'text-gray-500'
                                  }`}>
                                    {einsatz.status}
                                  </span>
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    einsatz.status === 'Verplant' || einsatz.status === 'bestätigt' ? 'bg-green-400' :
                                    einsatz.status === 'Buddy Tag' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                    einsatz.status === 'Krankenstand' ? 'bg-red-400' :
                                    einsatz.status === 'Notfall' ? 'bg-orange-400' :
                                    einsatz.status === 'Urlaub' ? 'bg-blue-400' :
                                    einsatz.status === 'Zeitausgleich' ? 'bg-yellow-400' :
                                    einsatz.status === 'Markierte' ? 'bg-purple-400' :
                                    'bg-gray-400'
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
                  {/* Header with Toggle Button */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      {aiMode ? 'Perfect Match' : 'Perfect Match'}
                      <Sparkles className="h-4 w-4 text-black" />
                    </h3>
                    <button
                      onClick={() => {
                        const newAiMode = !aiMode;
                        console.log('🧠 [CLIENT] Brain button clicked', { currentAiMode: aiMode, newAiMode });
                        setAiMode(newAiMode);
                        if (!aiMode) {
                          setAiRecommendations([]);
                          setAiError(null);
                          console.log('🧠 [CLIENT] AI mode activated, cleared previous data');
                        } else {
                          console.log('🧠 [CLIENT] AI mode deactivated');
                        }
                      }}
                      className={`p-2 rounded-lg border transition-colors ${
                        aiMode 
                          ? 'border-green-300 bg-green-100 text-green-700' 
                          : 'border-gray-300 hover:border-gray-400 text-gray-600'
                      }`}
                      title={aiMode ? "AI Modus beenden" : "AI Modus aktivieren"}
                    >
                      <Brain className="h-4 w-4" />
                    </button>
                  </div>

                  <div 
                    className="flex-1 overflow-y-auto"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    {aiMode ? (
                      /* AI Mode Content */
                      <div className="space-y-2">
                        {aiError && (
                          <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                            {aiError}
                          </div>
                        )}

                        {aiLoading ? (
                          <div className="flex items-center justify-center py-16">
                            <div className="relative h-10 w-10">
                              <div className="absolute inset-0 rounded-full border border-gray-200"></div>
                              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-green-500 animate-spin" style={{ animationDuration: '900ms' }}></div>
                            </div>
                            <span className="ml-3 text-sm text-gray-600">AI analysiert…</span>
                          </div>
                        ) : aiRecommendations.length > 0 ? (
                          aiRecommendations.map((rec: any, index: number) => {
                            const getConfidenceColor = (confidence: number) => {
                              if (confidence >= 0.8) return 'text-green-600 bg-green-50 border border-green-200/40';
                              if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border border-green-200/40';
                              return 'text-red-600 bg-red-50 border border-green-200/40';
                            };

                            const getRankColor = (rank: number) => {
                              if (rank === 1) return 'text-white';
                              if (rank === 2) return 'text-white';
                              if (rank === 3) return 'text-white';
                              return 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white';
                            };

                            const getRankStyle = (rank: number) => {
                              if (rank === 1) return { background: 'linear-gradient(135deg, #EEB34B 0%, #FFED99 25%, #FCD33D 50%, #FAF995 75%, #EFC253 100%)' };
                              if (rank === 2) return { background: 'linear-gradient(135deg, #DEDFE1 0%, #BCBDC1 25%, #ECEEED 75%, #B6BCBC 100%)' };
                              if (rank === 3) return { background: 'linear-gradient(135deg, #BD965D 0%, #99774A 25%, #DEBF93 75%, #AC9071 100%)' };
                              return {};
                            };

                            const isExpanded = expandedRecommendations.has(rec.keyword);
                            
                            return (
                              <div
                                key={rec.keyword}
                                onClick={() => {
                                  if (selectedEinsatz) {
                                    assignPromotionToPromotor(rec.promotorName, rec.promotorId);
                                    setEditingEinsatz({ ...selectedEinsatz, promotor: rec.promotorName, promotorId: rec.promotorId, status: 'Verplant' });
                                  }
                                }}
                                className={`p-3 rounded-lg border border-gray-100 cursor-pointer transition-all bg-white relative overflow-hidden ${
                                  rec.rank === 1 ? 'hover:bg-gradient-to-r hover:from-yellow-50/60 hover:to-amber-50/60 hover:border-yellow-200/80' :
                                  rec.rank === 2 ? 'hover:bg-gradient-to-r hover:from-gray-50/60 hover:to-slate-50/60 hover:border-gray-200/80' :
                                  rec.rank === 3 ? 'hover:bg-gradient-to-r hover:from-amber-50/60 hover:to-orange-50/60 hover:border-amber-200/80' :
                                  'hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-indigo-50/60 hover:border-blue-200/80'
                                }`}
                              >
                                <div className="flex items-center space-x-3 h-12 relative">
                                  {/* Rank Badge - Clickable */}
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newExpanded = new Set(expandedRecommendations);
                                      if (newExpanded.has(rec.keyword)) {
                                        newExpanded.delete(rec.keyword);
                                      } else {
                                        newExpanded.add(rec.keyword);
                                      }
                                      setExpandedRecommendations(newExpanded);
                                    }}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer flex-shrink-0 ${getRankColor(rec.rank)}`}
                                    style={getRankStyle(rec.rank)}
                                  >
                                    {rec.rank}
                                  </div>

                                  {/* Content Area - Both states remain in DOM */}
                                  <div className="flex-1 relative h-full">
                                    {/* Promotor Info */}
                                    <div 
                                      className="absolute inset-0 flex items-center space-x-3"
                                      style={{
                                        transform: isExpanded ? 'translateX(-120%)' : 'translateX(0)',
                                        opacity: isExpanded ? 0 : 1,
                                        transition: 'all 0.3s ease-out',
                                        pointerEvents: isExpanded ? 'none' : 'auto'
                                      }}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center mb-1">
                                          <User className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                                          <span className="font-medium text-gray-900 text-sm truncate">
                                            {rec.promotorName}
                                          </span>
                                        </div>
                                        {rec.phone && (
                                          <div className="text-xs text-gray-600" style={{ opacity: 0.7 }}>
                                            {rec.phone}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Confidence - Right side */}
                                      <div className="flex-shrink-0">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(rec.confidence)}`}>
                                          {Math.round(rec.confidence * 100)}%
                                        </span>
                                      </div>
                                    </div>

                                    {/* Reasoning Text */}
                                    <div 
                                      ref={(el) => {
                                        if (el && isExpanded) {
                                          // Auto-scroll during typing animation
                                          const scrollInterval = setInterval(() => {
                                            el.scrollTop = el.scrollHeight;
                                          }, 50);
                                          setTimeout(() => clearInterval(scrollInterval), (rec.reasoning?.length || 0) * 25 + 500);
                                        }
                                      }}
                                      className="absolute inset-0 text-xs text-gray-600 overflow-y-auto no-scrollbar flex items-center"
                                      style={{ 
                                        opacity: isExpanded ? 1 : 0,
                                        transition: isExpanded ? 'opacity 0.4s ease-in 0.3s' : 'opacity 0.2s ease-out',
                                        pointerEvents: isExpanded ? 'auto' : 'none',
                                        lineHeight: '1.4'
                                      }}
                                    >
                                      <div className="w-full">
                                        <TypingText text={rec.reasoning || ''} isTyping={isExpanded} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8">
                            <Brain className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-600 mb-1">Einsatz auswählen</p>
                            <p className="text-xs text-gray-400">Klicken Sie auf eine Promotion für AI-Empfehlungen</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Normal Mode - Placeholder Content */
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
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Promotion Distribution Component */}
          <div className="mt-8">
            <Card 
              className="border-0 w-full bg-gradient-to-br from-white to-blue-50/40"
              style={{
                boxShadow: '0 1px 3px 0 rgba(59, 130, 246, 0.15), 0 1px 2px 0 rgba(96, 165, 250, 0.1)'
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Einsätze verteilen</h3>
                    <p className="text-sm text-gray-500">Wähle Promotionen aus und sende sie an Promotoren zur Auswahl</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectionMode(!selectionMode);
                      if (!selectionMode) {
                        setSelectedPromotions([]);
                      }
                    }}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectionMode 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <MousePointer className="h-4 w-4" />
                    <span>{selectionMode ? 'Auswahl beenden' : 'Auswahl starten'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Selected Promotions */}
                  <div className="lg:col-span-1">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between min-h-[40px]">
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                          Ausgewählte Promotionen ({selectedPromotions.length})
                        </h4>
                        <div className="w-8 h-8"></div> {/* Spacer to match button width */}
                      </div>
                      
                                             <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                         {selectedPromotions.length === 0 ? (
                           <div className="p-6 rounded-lg bg-gray-50 text-center border border-gray-200">
                             <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                             <p className="text-sm font-medium text-gray-600 mb-1">Keine Promotionen ausgewählt</p>
                             <p className="text-xs text-gray-400">Starte die Auswahl und klicke auf Promotionen in der Liste</p>
                           </div>
                        ) : (
                          einsatzplanData
                            .filter(einsatz => selectedPromotions.includes(einsatz.id))
                            .map(einsatz => (
                              <div 
                                key={einsatz.id}
                                className="p-3 rounded-lg bg-white border border-gray-200 text-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">{einsatz.address}</p>
                                    <p className="text-xs text-gray-500">{einsatz.date} • {einsatz.planStart}-{einsatz.planEnd}</p>
                                  </div>
                                  <button
                                    onClick={() => setSelectedPromotions(prev => prev.filter(id => id !== einsatz.id))}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                        )}
                      </div>

                      {selectedPromotions.length > 0 && (
                        <button
                          onClick={() => setSelectedPromotions([])}
                          className="w-full text-xs text-gray-500 hover:text-gray-700 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                        >
                          Alle abwählen
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selected Promotors */}
                  <div className="lg:col-span-1">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between min-h-[40px]">
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                          Promotoren ({selectedPromotors.length})
                        </h4>
                        <div className="flex items-center space-x-2">
                          {selectedPromotors.length > 0 && (
                            <div className="flex items-center text-xs text-gray-600">
                              <Check className="h-3 w-3 text-green-600 mr-1" />
                              {selectedPromotors.length} ausgewählt
                            </div>
                          )}
                          <button
                            onClick={() => setShowPromotorSelection(true)}
                            className="p-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                          >
                            <UserPlus className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {selectedPromotors.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {selectedPromotors.map(promotor => (
                            <div 
                              key={promotor}
                              className="p-2 rounded-lg bg-white border border-gray-200 text-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 text-xs">{promotor}</span>
                                <button
                                  onClick={() => setSelectedPromotors(prev => prev.filter(name => name !== promotor))}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 rounded-lg bg-gray-50 text-center border border-gray-200">
                          <UserPlus className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm font-medium text-gray-600 mb-1">Keine Promotoren ausgewählt</p>
                          <p className="text-xs text-gray-400">Klicke auf das + Icon um Promotoren auszuwählen</p>
                        </div>
                      )}

                      {selectedPromotions.length > 0 && selectedPromotors.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <label className="flex items-center space-x-2">
                              <input type="checkbox" checked={inviteBuddy} onChange={(e) => setInviteBuddy(e.target.checked)} />
                              <span>Buddy-Tag senden</span>
                            </label>
                            <span className="text-gray-500">{selectedPromotions.length} Einsätze → {selectedPromotors.length} Promotoren</span>
                          </div>
                        <button
                          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          onClick={async () => {
                            try {
                              // Map selected promoter names to IDs
                              const ids = promotorsList
                                .filter((p: any) => selectedPromotors.includes(p.name))
                                .map((p: any) => p.id)
                                .filter(Boolean)
                              // Check if any selected assignments are "Verplant" (assigned)
                              const selectedAssignmentData = einsatzplanData.filter((assignment: any) => 
                                selectedPromotions.includes(assignment.id));
                              const hasVerplantAssignments = selectedAssignmentData.some((assignment: any) => 
                                assignment.status === 'Verplant');
                              
                              // Auto-buddy tag if selecting Verplant assignments, otherwise use checkbox
                              const isBuddyTag = hasVerplantAssignments || inviteBuddy;
                              
                              const res = await fetch('/api/assignments/bulk-invite', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  assignment_ids: selectedPromotions,
                                  promotor_ids: ids,
                                  buddy: inviteBuddy,
                                  is_buddy_tag: isBuddyTag
                                })
                              })
                              if (res.ok) {
                                // Reload history from database
                                await loadInvitationHistory();
                              }
                            } catch (error) {
                              console.error('Failed to send invitations:', error);
                            }
                            setSelectedPromotions([]);
                            setSelectedPromotors([]);
                            setInviteBuddy(false);
                            setSelectionMode(false);
                          }}
                        >
                          <Send className="h-4 w-4" />
                          <span>Senden</span>
                        </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* History */}
                  <div className="lg:col-span-1">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between min-h-[40px]">
                        <div className="flex items-center space-x-2">
                          <History className="h-4 w-4 text-gray-600" />
                          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                            Historie ({distributionHistory.length})
                          </h4>
                        </div>
                        <div className="w-8 h-8"></div> {/* Spacer to match button width */}
                      </div>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {distributionHistory.length === 0 ? (
                          <div className="p-6 rounded-lg bg-gray-50 text-center border border-gray-200">
                            <History className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-600 mb-1">Keine Sendungen</p>
                            <p className="text-xs text-gray-400">Hier erscheinen gesendete Einsätze zur Promotor-Auswahl</p>
                          </div>
                        ) : (
                          distributionHistory.map(item => (
                            <div 
                              key={item.id}
                              onClick={() => {
                                setSelectedHistoryItem(item);
                                setShowHistoryDetail(true);
                              }}
                              className="p-3 rounded-lg bg-white border border-gray-200 text-sm hover:border-gray-300 cursor-pointer transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900 text-xs">{item.promotionCount} → {item.promotorCount}</span>
                                  <span className="text-xs text-gray-500">{item.time}</span>
                                </div>
                                <p className="text-xs text-gray-500">{item.date}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Promotor Selection Modal */}
      {showPromotorSelection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card 
            className="w-full max-w-4xl border border-gray-200 shadow-sm max-h-[90vh] overflow-hidden bg-white"
          >
            <CardContent className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Promotoren auswählen</h3>
                <button
                  onClick={() => setShowPromotorSelection(false)}
                  className="h-8 w-8 text-gray-900 hover:text-gray-700 flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Search and Filter Options */}
              <div className="mt-4 space-y-3">
                {/* Searchbar */}
                <div>
                  <input
                    type="text"
                    placeholder="Promotor suchen..."
                    value={promotorSelectionSearch}
                    onChange={(e) => setPromotorSelectionSearch(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 bg-white rounded-lg focus:outline-none placeholder-gray-400"
                  />
                </div>
                
                {/* Filter Options */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveRegionFilter("all")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gray-100/70 text-gray-700 hover:bg-gray-200/80 ${
                        activeRegionFilter === "all" ? "scale-110" : ""
                      }`}
                    >
                      Alle
                    </button>
                    <button
                      onClick={() => setActiveRegionFilter("wien-noe-bgl")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("wien-noe-bgl")} ${getRegionBorder("wien-noe-bgl")} ${
                        activeRegionFilter === "wien-noe-bgl" ? "scale-110" : ""
                      }`}
                    >
                      W/NÖ/BGL
                    </button>
                    <button
                      onClick={() => setActiveRegionFilter("steiermark")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("steiermark")} ${getRegionBorder("steiermark")} ${
                        activeRegionFilter === "steiermark" ? "scale-110" : ""
                      }`}
                    >
                      ST
                    </button>
                    <button
                      onClick={() => setActiveRegionFilter("salzburg")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("salzburg")} ${getRegionBorder("salzburg")} ${
                        activeRegionFilter === "salzburg" ? "scale-110" : ""
                      }`}
                    >
                      SBG
                    </button>
                    <button
                      onClick={() => setActiveRegionFilter("oberoesterreich")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("oberoesterreich")} ${getRegionBorder("oberoesterreich")} ${
                        activeRegionFilter === "oberoesterreich" ? "scale-110" : ""
                      }`}
                    >
                      OÖ
                    </button>
                    <button
                      onClick={() => setActiveRegionFilter("tirol")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("tirol")} ${getRegionBorder("tirol")} ${
                        activeRegionFilter === "tirol" ? "scale-110" : ""
                      }`}
                    >
                      T
                    </button>
                    <button
                      onClick={() => setActiveRegionFilter("vorarlberg")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("vorarlberg")} ${getRegionBorder("vorarlberg")} ${
                        activeRegionFilter === "vorarlberg" ? "scale-110" : ""
                      }`}
                    >
                      V
                    </button>
                    <button
                      onClick={() => setActiveRegionFilter("kaernten")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("kaernten")} ${getRegionBorder("kaernten")} ${
                        activeRegionFilter === "kaernten" ? "scale-110" : ""
                      }`}
                    >
                      K
                    </button>
                  </div>
                  
                  {/* Select All Filtered Icon */}
                  <div 
                    onClick={selectAllFiltered}
                    className="cursor-pointer"
                    title="Alle gefilterten auswählen/abwählen"
                  >
                    <CheckSquare className="h-5 w-5 text-black hover:text-gray-700 transition-colors" />
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardContent 
              className="p-6 flex flex-col h-[400px] [&::-webkit-scrollbar]:hidden" 
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <div className="flex-1 overflow-auto custom-scrollbar">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {promotorsList
                .filter(promotor => 
                  (activeRegionFilter === "all" || promotor.region === activeRegionFilter) &&
                  promotor.name.toLowerCase().includes(promotorSelectionSearch.toLowerCase())
                )
                .map((promotor) => {
                  const isSelected = selectedPromotors.includes(promotor.name);
                  return (
                    <button
                      key={promotor.id || promotor.name}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPromotors(prev => prev.filter(name => name !== promotor.name));
                        } else {
                          setSelectedPromotors(prev => [...prev, promotor.name]);
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full h-10 flex items-center justify-center border ${
                        isSelected
                          ? "bg-white/80 text-gray-900 shadow-md border-gray-300 backdrop-blur-sm"
                          : `${getRegionGradient(promotor.region)} ${getRegionBorder(promotor.region)} text-gray-700 hover:bg-gray-200/80`
                      }`}
                    >
                      {promotor.name}
                    </button>
                  );
                })}
                </div>
              </div>
              
              {/* Fixed confirmation section at bottom */}
              {selectedPromotors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedPromotors.length} Promotor{selectedPromotors.length !== 1 ? 'en' : ''} ausgewählt
                    </span>
                    <button
                      onClick={() => setShowPromotorSelection(false)}
                      className="bg-white/40 text-gray-700 hover:bg-white/60 border border-gray-200/50 backdrop-blur-sm px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Bestätigen
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Detail Modal */}
      {showHistoryDetail && selectedHistoryItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="relative p-6 border-b border-gray-100">
              <div className="pr-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Sendung Details</h3>
                <p className="text-sm text-gray-500">{selectedHistoryItem.date} um {selectedHistoryItem.time}</p>
              </div>
              <button
                onClick={() => {
                  setShowHistoryDetail(false);
                  setSelectedHistoryItem(null);
                }}
                className="absolute top-6 right-6 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
              <div className="space-y-6">
                {/* Summary */}
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedHistoryItem.promotionCount} Promotionen → {selectedHistoryItem.promotorCount} Promotoren
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Zur Auswahl gesendet</p>
                </div>

                {/* Sent Promotions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Gesendete Promotionen ({selectedHistoryItem.promotions.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {selectedHistoryItem.promotions.map((promotion: any) => (
                      <div 
                        key={promotion.id}
                        className="p-3 rounded-lg bg-white border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{promotion.address}</p>
                            <p className="text-xs text-gray-500">
                              {promotion.date} • {promotion.planStart}-{promotion.planEnd} • {promotion.plz}
                            </p>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${
                            promotion.status === 'Verplant' || promotion.status === 'bestätigt' ? 'bg-green-400' :
                            promotion.status === 'Buddy Tag' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                            promotion.status === 'Krankenstand' ? 'bg-red-400' :
                            promotion.status === 'Notfall' ? 'bg-orange-400' :
                            promotion.status === 'Urlaub' ? 'bg-blue-400' :
                            promotion.status === 'Zeitausgleich' ? 'bg-yellow-400' :
                            'bg-gray-400'
                          }`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recipients */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Empfänger ({selectedHistoryItem.promotors.length})
                  </h4>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {selectedHistoryItem.promotors.map((promotor: string) => (
                      <div 
                        key={promotor}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm"
                      >
                        <span className="font-medium text-gray-900 whitespace-nowrap">{promotor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && editingEinsatz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="relative p-6 border-b border-gray-100">
              <div className="pr-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Einsatz Details</h3>
                <p className="text-sm text-gray-500">{editingEinsatz.address}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedEinsatz(null);
                  setEditingEinsatz(null);
                }}
                className="absolute top-6 right-6 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Promotor</label>
                      <Select
                        value={editingEinsatz.promotorId || ''}
                        onValueChange={(val) => {
                          const p = promotorsList.find((x: any) => x.id === val);
                          if (!p) return;
                          assignPromotionToPromotor(p.name, p.id);
                          setEditingEinsatz({ ...editingEinsatz, promotor: p.name, promotorId: p.id, status: 'Verplant' });
                        }}
                      >
                        <SelectTrigger 
                          className="w-full h-9 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-0 focus:ring-offset-0"
                          style={{
                            boxShadow: promotorFieldFlash 
                              ? '0 0 20px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.8)' 
                              : 'none',
                            transition: 'box-shadow 0.3s ease-in-out'
                          }}
                        >
                          <SelectValue placeholder={editingEinsatz.promotor || 'Promotor auswählen'} />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          {promotorsList.map((p: any) => (
                            <SelectItem key={p.id} value={p.id} className="focus:bg-gray-100">{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Buddy (optional)</label>
                      <Select
                        value={editingEinsatz.buddy_user_id || 'none'}
                        onValueChange={(val) => {
                          if (val === 'none') {
                            assignBuddyToPromotion('', undefined);
                          } else {
                            const buddy = promotorsList.find((x: any) => x.id === val);
                            if (buddy) {
                              assignBuddyToPromotion(buddy.name, buddy.id);
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="w-full h-9 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-0 focus:ring-offset-0">
                          <SelectValue placeholder={editingEinsatz.buddy_name || 'Buddy auswählen'} />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="none" className="focus:bg-gray-100">Kein Buddy</SelectItem>
                          {promotorsList.map((p: any) => (
                            <SelectItem key={p.id} value={p.id} className="focus:bg-gray-100">{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                    <Select
                      value={editingEinsatz.buddy_name ? 'Buddy Tag' : editingEinsatz.status}
                      onValueChange={(value) => {
                        // If there's a buddy, force status to stay as Buddy Tag
                        if (editingEinsatz.buddy_name) {
                          return; // Don't allow status change when buddy exists
                        }
                        updateAssignmentStatus(editingEinsatz.id, value);
                      }}
                    >
                      <SelectTrigger className="w-full h-9 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="Status wählen" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="Offen" className="focus:bg-gray-100">Offen</SelectItem>
                        <SelectItem value="Verplant" className="focus:bg-green-100">Verplant</SelectItem>
                        <SelectItem value="Buddy Tag" className="focus:bg-purple-100">Buddy Tag</SelectItem>
                        
                        <SelectItem value="Krankenstand" className="focus:bg-red-100">Krankenstand</SelectItem>
                        <SelectItem value="Urlaub" className="focus:bg-blue-100">Urlaub</SelectItem>
                        <SelectItem value="Zeitausgleich" className="focus:bg-yellow-100">Zeitausgleich</SelectItem>
                        <SelectItem value="Notfall" className="focus:bg-orange-100">Notfall</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Datum</label>
                      <DatePicker
                        value={editingEinsatz.date}
                        onChange={(value) => setEditingEinsatz({...editingEinsatz, date: value})}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">PLZ</label>
                      <input
                        type="text"
                        value={editingEinsatz.plz || ''}
                        onChange={(e) => setEditingEinsatz({...editingEinsatz, plz: e.target.value})}
                        placeholder="PLZ"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Adresse</label>
                    <input
                      type="text"
                      value={editingEinsatz.address || ''}
                      onChange={(e) => setEditingEinsatz({...editingEinsatz, address: e.target.value})}
                      placeholder="Markt Adresse"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start Zeit</label>
                      <TimePicker
                        value={editingEinsatz.planStart}
                        onChange={(value) => setEditingEinsatz({...editingEinsatz, planStart: value})}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">End Zeit</label>
                      <TimePicker
                        value={editingEinsatz.planEnd}
                        onChange={(value) => setEditingEinsatz({...editingEinsatz, planEnd: value})}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>



                {/* Notes, Status and Promotion Distribution Section */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Notes Section - Left Side */}
                  <div className="flex flex-col h-72">
                    {/* Status Indicator - Same width as textarea */}
                    <div className="p-3 rounded-lg bg-gray-50 mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          editingEinsatz.status === 'Verplant' || editingEinsatz.status === 'bestätigt' ? 'bg-green-400' :
                          editingEinsatz.status === 'Buddy Tag' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                          editingEinsatz.status === 'Krankenstand' ? 'bg-red-400' :
                          editingEinsatz.status === 'Notfall' ? 'bg-orange-400' :
                          editingEinsatz.status === 'Urlaub' ? 'bg-blue-400' :
                          editingEinsatz.status === 'Zeitausgleich' ? 'bg-yellow-400' :
                          'bg-gray-400'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-700">Status: {editingEinsatz.status}</span>
                      </div>
                    </div>
                    
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Notizen</h4>
                    <textarea
                      value={editingEinsatz.notes || ''}
                      onChange={(e) => setEditingEinsatz({...editingEinsatz, notes: e.target.value})}
                      onBlur={(e) => updateAssignmentNotes(editingEinsatz.id, e.target.value)}
                      placeholder="Notizen hinzufügen..."
                      className="flex-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Promotion Distribution Section - Right Side */}
                  <div className="h-72">
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
                      {/* Card Header with Toggle */}
                      <div className="p-3 border-b border-gray-100">
                        <div className="relative flex space-x-0.5 bg-gray-50 rounded-lg p-0.5">
                          {/* Sliding background */}
                          <div 
                            className="absolute top-0.5 bottom-0.5 bg-white shadow-sm border border-gray-200 rounded-md transition-all duration-300 ease-in-out"
                            style={{
                              left: promotionView === 'sent' ? '2px' : '50%',
                              width: 'calc(50% - 1px)'
                            }}
                          />
                          <button
                            onClick={() => setPromotionView('sent')}
                            className={`relative z-10 flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                              promotionView === 'sent'
                                ? 'text-gray-900'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            Gesendet
                          </button>
                          <button
                            onClick={() => setPromotionView('applications')}
                            className={`relative z-10 flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                              promotionView === 'applications'
                                ? 'text-gray-900'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            Angemeldet {applicationsList.length > 0 && `(${applicationsList.length})`}
                          </button>
                        </div>
                      </div>
                      
                      {/* Card Content */}
                      <div className="p-4 h-full overflow-y-auto custom-scrollbar">
                        {promotionView === 'sent' ? (
                          <div className="space-y-2">
                            {(() => {
                              const sentHistoryItem = distributionHistory.find(item => 
                                item.promotions.some((p: any) => p.id === editingEinsatz.id)
                              );
                              if (sentHistoryItem) {
                                return sentHistoryItem.promotors.map((promotor: string, index: number) => (
                                  <div key={index} className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 mx-1">
                                    <span className="text-sm text-gray-900">{promotor}</span>
                                  </div>
                                ));
                              } else {
                                return (
                                  <div className="flex items-center justify-center h-full">
                                    <div className="text-sm text-gray-400">Noch nicht gesendet</div>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        ) : (
                          <div className="space-y-2 relative overflow-hidden">
                            {applicationsList.length === 0 ? (
                              <div className="text-sm text-gray-400 text-center py-8">Keine Anmeldungen</div>
                            ) : (
                              applicationsList.map((app: any) => (
                                <div 
                                  key={app.user_id} 
                                  className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 mx-1 flex items-center justify-between overflow-hidden relative transition-all duration-300"
                                  style={{
                                    transform: app.isSliding ? 'translateY(-100%)' : app.isSlidingRight ? 'translateX(100%)' : 'translate(0)',
                                    opacity: app.isSliding || app.isSlidingRight ? 0 : 1,
                                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease-out'
                                  }}
                                >
                                  <span className="text-sm text-gray-900">{app.name}</span>
                                <div className="flex items-center space-x-2">
                                  <button 
                                    className="p-1 rounded"
                                      onClick={async () => {
                                        // Trigger slide animation
                                        setApplicationsList(prev => 
                                          prev.map(a => a.user_id === app.user_id ? {...a, isSliding: true} : a)
                                        );
                                        
                                        // Update promotor field and trigger flash after animation
                                        setTimeout(() => {
                                          setEditingEinsatz((prev: any) => ({...prev, promotor: app.name}));
                                          setPromotorFieldFlash(true);
                                          setTimeout(() => setPromotorFieldFlash(false), 800);
                                        }, 500);
                                        
                                        await assignPromotionToPromotor(app.name, app.user_id);
                                        
                                        // Remove from list after animation
                                        setTimeout(() => {
                                          setApplicationsList(prev => prev.filter((x: any) => x.user_id !== app.user_id));
                                        }, 600);
                                      }}
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </button>
                                    <button 
                                      className="p-1 rounded"
                                      onClick={async () => {
                                        // Trigger slide-right animation
                                        setApplicationsList(prev => 
                                          prev.map(a => a.user_id === app.user_id ? {...a, isSlidingRight: true} : a)
                                        );
                                        
                                        // After animation, open replacement assignment window
                                        setTimeout(async () => {
                                          try {
                                            await fetch(`/api/assignments/${editingEinsatz.id}/applications/decline`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ user_id: app.user_id })
                                            });
                                          } catch {}
                                          setApplicationsList(prev => prev.filter((x: any) => x.user_id !== app.user_id));
                                          
                                          // Open replacement assignment selection
                                          setDeclinedPromotor({ user_id: app.user_id, name: app.name, invitation_id: app.invitation_id });
                                          setShowReplacementModal(true);
                                        }, 500);
                                      }}
                                    >
                                    <X className="h-4 w-4 text-red-600" />
                                  </button>
                                </div>
                              </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center rounded-b-xl">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedEinsatz(null);
                  setEditingEinsatz(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetch(`/api/assignments/${editingEinsatz.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        date: editingEinsatz.date,
                        planStart: editingEinsatz.planStart,
                        planEnd: editingEinsatz.planEnd,
                        location_text: editingEinsatz.address,
                        postal_code: editingEinsatz.plz,
                        status: editingEinsatz.status
                      })
                    });
                  } catch {}
                  // Update the einsatzplan data
                  setEinsatzplanData(prev => prev.map(item => 
                    item.id === editingEinsatz.id ? editingEinsatz : item
                  ));
                  setShowDetailModal(false);
                  setSelectedEinsatz(null);
                  setEditingEinsatz(null);
                }}
                className="px-6 py-2 text-sm text-white rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #22C55E, #105F2D)',
                  opacity: 0.9
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import EP Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-96 max-w-[90vw]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Import EP</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Import Type Selection */}
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

              {/* Drag and Drop Area */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
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
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
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

      {/* Import Conflict Modal */}
      {showConflictModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Import Konflikte</h3>
                <p className="text-sm text-gray-500 mt-1">{importConflicts.length} Einsätze haben unterschiedliche Status</p>
              </div>
              <button
                onClick={() => {
                  setShowConflictModal(false);
                  setImportConflicts([]);
                  setConflictDecisions(new Map());
                }}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {importConflicts.map((conflict, index) => {
                  const startDate = new Date(conflict.existing.start_ts);
                  const dateStr = startDate.toLocaleDateString('de-AT', { day: '2-digit', month: 'short' });
                  const timeStr = startDate.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div key={conflict.existing.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{conflict.existing.location_text}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            PLZ: {conflict.existing.postal_code} • {dateStr} • {timeStr}
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`conflict-${conflict.existing.id}`}
                                checked={conflictDecisions.get(conflict.existing.id) === 'existing'}
                                onChange={() => {
                                  const newDecisions = new Map(conflictDecisions);
                                  newDecisions.set(conflict.existing.id, 'existing');
                                  setConflictDecisions(newDecisions);
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm">
                                Einsatzplan behalten: <span className="font-medium text-gray-900">{conflict.existing.status}</span>
                                {conflict.existing.promotor && <span className="text-gray-600"> ({conflict.existing.promotor})</span>}
                              </span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`conflict-${conflict.existing.id}`}
                                checked={conflictDecisions.get(conflict.existing.id) === 'excel'}
                                onChange={() => {
                                  const newDecisions = new Map(conflictDecisions);
                                  newDecisions.set(conflict.existing.id, 'excel');
                                  setConflictDecisions(newDecisions);
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm">
                                Excel übernehmen: <span className="font-medium text-green-600">Offen</span>
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newDecisions = new Map();
                      importConflicts.forEach(c => newDecisions.set(c.existing.id, 'existing'));
                      setConflictDecisions(newDecisions);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Alle Einsatzplan behalten
                  </button>
                  <span className="text-gray-400">•</span>
                  <button
                    onClick={() => {
                      const newDecisions = new Map();
                      importConflicts.forEach(c => newDecisions.set(c.existing.id, 'excel'));
                      setConflictDecisions(newDecisions);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Alle Excel übernehmen
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowConflictModal(false);
                      setImportConflicts([]);
                      setConflictDecisions(new Map());
                    }}
                    className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleConflictResolution}
                    className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Anwenden
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Assignments Modal */}
      {showReplacementModal && declinedPromotor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="relative p-6 border-b border-gray-100">
              <div className="pr-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Ersatztermine für {declinedPromotor.name}</h3>
                <p className="text-sm text-gray-500">Wähle Ersatztermine aus den offenen Einsätzen</p>
              </div>
              <button
                onClick={() => {
                  setShowReplacementModal(false);
                  setDeclinedPromotor(null);
                  setSelectedReplacementAssignments([]);
                  setReplacementRegionFilter("ALLE");
                }}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Region Filter Pills */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                {["ALLE", "W/NÖ/BGL", "ST", "S", "OÖ", "T", "V", "K"].map((region) => {
                  const isSelected = replacementRegionFilter === region || (replacementRegionFilter === "ALLE" && region === "ALLE");
                  return (
                    <button
                      key={region}
                      onClick={() => setReplacementRegionFilter(replacementRegionFilter === region ? "ALLE" : region)}
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

            {/* Content */}
            <div 
              className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {openAssignments
                  .filter((assignment: any) => {
                    if (replacementRegionFilter === "ALLE") return true;
                    // Map region codes to postal code ranges (same logic as main einsatzplan)
                    const plz = assignment.postal_code;
                    switch (replacementRegionFilter) {
                      case "W/NÖ/BGL": return plz >= 1000 && plz <= 3999;
                      case "ST": return plz >= 8000 && plz <= 8999;
                      case "S": return plz >= 5000 && plz <= 5999;
                      case "OÖ": return plz >= 4000 && plz <= 4999;
                      case "T": return plz >= 6000 && plz <= 6999;
                      case "V": return plz >= 6700 && plz <= 6999;
                      case "K": return plz >= 9000 && plz <= 9999;
                      default: return true;
                    }
                  })
                  .map((assignment: any) => (
                  <div
                    key={assignment.id}
                    onClick={() => handleReplacementAssignmentSelect(assignment.id)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${selectedReplacementAssignments.includes(assignment.id)
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="space-y-2">
                      <div className="font-medium text-gray-900">
                        {new Date(assignment.start_ts).toLocaleDateString('de-DE', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: '2-digit' 
                        })}
                      </div>
                      <div className="text-sm text-gray-600">
                        {assignment.location_text}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {assignment.postal_code} {assignment.city}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                          {`${String(new Date(assignment.start_ts).getUTCHours()).padStart(2, '0')}:${String(new Date(assignment.start_ts).getUTCMinutes()).padStart(2, '0')}-${String(new Date(assignment.end_ts).getUTCHours()).padStart(2, '0')}:${String(new Date(assignment.end_ts).getUTCMinutes()).padStart(2, '0')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  ))
                }
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {selectedReplacementAssignments.length} Ersatztermine ausgewählt
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowReplacementModal(false);
                      setDeclinedPromotor(null);
                      setSelectedReplacementAssignments([]);
                      setReplacementRegionFilter("ALLE");
                    }}
                    className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSendReplacementInvites}
                    disabled={selectedReplacementAssignments.length === 0}
                    className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                      selectedReplacementAssignments.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    Ersatztermine senden
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Eddie KI Assistant */}
      <AdminEddieAssistant />
    </div>
  );
} 