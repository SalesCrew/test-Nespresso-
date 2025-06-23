"use client";

import { useState, useEffect, useRef } from "react";
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
  EyeOff
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import AdminNavigation from "@/components/AdminNavigation";
import AdminEddieAssistant from "@/components/AdminEddieAssistant";

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
  const [showMaerkteView, setShowMaerkteView] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState<'roh' | 'intern'>('roh');
  const [einsatzplanData, setEinsatzplanData] = useState<any[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEinsatz, setSelectedEinsatz] = useState<any>(null);
  const [editingEinsatz, setEditingEinsatz] = useState<any>(null);
  
  // Promotion distribution states
  const [selectedPromotions, setSelectedPromotions] = useState<number[]>([]);
  const [showPromotorSelection, setShowPromotorSelection] = useState(false);
  const [selectedPromotors, setSelectedPromotors] = useState<string[]>([]);
  const [activeRegionFilter, setActiveRegionFilter] = useState<string>("all");
  const [promotorSelectionSearch, setPromotorSelectionSearch] = useState("");
  const [lastSelectedByIcon, setLastSelectedByIcon] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [distributionHistory, setDistributionHistory] = useState<any[]>([]);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const [promotionView, setPromotionView] = useState<'sent' | 'applications'>('sent');
  
  // Märkte search state
  const [maerkteSearch, setMaerkteSearch] = useState('');
  
  // Eye filter state - when true, filter out "Verplant" items
  const [hideVerplant, setHideVerplant] = useState(false);
  

  
  // Function to assign promotion to a promotor
  const assignPromotionToPromotor = (promotorName: string) => {
    if (!editingEinsatz) return;
    
    // Update the editing einsatz with the promotor and set status to Verplant
    setEditingEinsatz({
      ...editingEinsatz,
      promotor: promotorName,
      status: 'Verplant'
    });

    // Also update the main data immediately
    setEinsatzplanData(prev => prev.map(item => 
      item.id === editingEinsatz.id 
        ? { ...item, promotor: promotorName, status: 'Verplant' }
        : item
    ));
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
      case "Verplant": return "hover:bg-green-100/50";
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

  // Helper functions for promotor selection (copied from admin dashboard)
  const getRegionGradient = (region: string) => {
    switch (region) {
      case "wien-noe-bgl":
        return "bg-red-50/40";
      case "steiermark":
        return "bg-green-50/40";
      case "salzburg":
        return "bg-blue-50/40";
      case "oberoesterreich":
        return "bg-yellow-50/40";
      case "tirol":
        return "bg-purple-50/40";
      case "vorarlberg":
        return "bg-orange-50/40";
      case "kaernten":
        return "bg-teal-50/40";
      default:
        return "bg-gray-50/40";
    }
  };

  const getRegionBorder = (region: string) => {
    // All pills get the same thin grey border
    return "border-gray-200";
  };

  const selectAllFiltered = () => {
    const allPromotors = [
      { name: "Sarah Schmidt", region: "wien-noe-bgl" },
      { name: "Michael Weber", region: "steiermark" },
      { name: "Jan Müller", region: "salzburg" },
      { name: "Lisa König", region: "wien-noe-bgl" },
      { name: "Anna Bauer", region: "oberoesterreich" },
      { name: "Tom Fischer", region: "tirol" },
      { name: "Maria Huber", region: "steiermark" },
      { name: "David Klein", region: "vorarlberg" },
      { name: "Emma Wagner", region: "kaernten" },
      { name: "Paul Berger", region: "wien-noe-bgl" },
      { name: "Julia Mayer", region: "salzburg" },
      { name: "Felix Gruber", region: "oberoesterreich" },
      { name: "Sophie Reiter", region: "steiermark" },
      { name: "Max Köhler", region: "tirol" },
      { name: "Lena Fuchs", region: "vorarlberg" },
      { name: "Klaus Müller", region: "wien-noe-bgl" },
      { name: "Sandra Hofer", region: "steiermark" },
      { name: "Martin Schneider", region: "salzburg" },
      { name: "Nina Weiss", region: "oberoesterreich" },
      { name: "Patrick Schwarz", region: "tirol" },
      { name: "Andrea Roth", region: "vorarlberg" },
      { name: "Florian Braun", region: "kaernten" },
      { name: "Jessica Grün", region: "wien-noe-bgl" },
      { name: "Daniel Gelb", region: "steiermark" },
      { name: "Sabrina Blau", region: "salzburg" },
      { name: "Thomas Orange", region: "oberoesterreich" },
      { name: "Melanie Violett", region: "tirol" },
      { name: "Christian Rosa", region: "vorarlberg" },
      { name: "Vanessa Grau", region: "kaernten" },
      { name: "Marco Silber", region: "wien-noe-bgl" },
      { name: "Tanja Gold", region: "steiermark" },
      { name: "Oliver Bronze", region: "salzburg" },
      { name: "Carina Kupfer", region: "oberoesterreich" },
      { name: "Lukas Platin", region: "tirol" },
      { name: "Stephanie Kristall", region: "vorarlberg" },
      { name: "Benjamin Diamant", region: "kaernten" },
      { name: "Michelle Rubin", region: "wien-noe-bgl" },
      { name: "Tobias Saphir", region: "steiermark" },
      { name: "Nadine Smaragd", region: "salzburg" },
      { name: "Kevin Topas", region: "oberoesterreich" },
      { name: "Franziska Opal", region: "tirol" },
      { name: "Dominik Achat", region: "vorarlberg" },
      { name: "Simone Jade", region: "kaernten" },
      { name: "Philip Onyx", region: "wien-noe-bgl" },
      { name: "Verena Quarz", region: "steiermark" },
      { name: "Fabian Marmor", region: "salzburg" },
      { name: "Isabella Granit", region: "oberoesterreich" },
      { name: "Maximilian Schiefer", region: "tirol" },
      { name: "Katharina Basalt", region: "vorarlberg" },
      { name: "Wolfgang Kalk", region: "kaernten" },
      { name: "Elena Ton", region: "wien-noe-bgl" },
      { name: "Robert Sand", region: "steiermark" },
      { name: "Nicole Lehm", region: "salzburg" },
      { name: "Stefan Kies", region: "oberoesterreich" },
      { name: "Petra Fels", region: "tirol" },
      { name: "Alexander Stein", region: "vorarlberg" },
      { name: "Christina Berg", region: "kaernten" },
      { name: "Manuel Tal", region: "wien-noe-bgl" },
      { name: "Andrea Bach", region: "steiermark" },
      { name: "Daniel See", region: "salzburg" },
      { name: "Sabine Meer", region: "oberoesterreich" },
      { name: "Thomas Ozean", region: "tirol" }
    ];

    const filteredNames = allPromotors
      .filter(promotor => 
        (activeRegionFilter === "all" || promotor.region === activeRegionFilter) &&
        promotor.name.toLowerCase().includes(promotorSelectionSearch.toLowerCase())
      )
      .map(promotor => promotor.name);
    
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

  // Process Excel file for Roh Excel import
  const processRohExcel = (file: File) => {
    console.log('Processing Excel file:', file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const newEinsatzplan: any[] = [];
        let currentId = 1;
        
        // Helper functions from the provided file
        const getDayOfWeek = (date: Date): string => {
          const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
          return days[date.getDay()];
        };

        const getWorkingHours = (dayOfWeek: string): { start: string, end: string } => {
          if (dayOfWeek === 'Samstag' || dayOfWeek === 'Sonntag') {
            return { start: '09:00', end: '18:00' };
          }
          return { start: '09:30', end: '18:30' };
        };

        const getMonthInfo = (monthAbbr: string, actualYear?: number): { monthNumber: number, year: number, monthName: string } => {
          const normalizedMonth = monthAbbr.charAt(0).toUpperCase() + monthAbbr.slice(1).toLowerCase();
          
          const germanMonths: { [key: string]: { number: number, name: string } } = {
            'Jan': { number: 0, name: 'Januar' },
            'Feb': { number: 1, name: 'Februar' },
            'Mär': { number: 2, name: 'März' },
            'Mar': { number: 2, name: 'März' },
            'Apr': { number: 3, name: 'April' },
            'Mai': { number: 4, name: 'Mai' },
            'Jun': { number: 5, name: 'Juni' },
            'Jul': { number: 6, name: 'Juli' },
            'Aug': { number: 7, name: 'August' },
            'Sep': { number: 8, name: 'September' },
            'Okt': { number: 9, name: 'Oktober' },
            'Oct': { number: 9, name: 'Oktober' },
            'Nov': { number: 10, name: 'November' },
            'Dez': { number: 11, name: 'Dezember' },
            'Dec': { number: 11, name: 'Dezember' }
          };
          
          console.log('Looking for month:', normalizedMonth);
          const monthInfo = germanMonths[normalizedMonth];
          if (!monthInfo) {
            console.log('Available months:', Object.keys(germanMonths));
            throw new Error(`Unknown month abbreviation: ${monthAbbr} (normalized: ${normalizedMonth})`);
          }
          
          const year = actualYear || new Date().getFullYear();
          
          return {
            monthNumber: monthInfo.number,
            year: year,
            monthName: monthInfo.name
          };
        };

        const getDaysInMonth = (month: number, year: number): number => {
          return new Date(year, month + 1, 0).getDate();
        };

        const excelDateToJSDate = (excelDate: number): Date => {
          const excelEpoch = new Date(1899, 11, 30);
          const jsDate = new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
          return jsDate;
        };

        const extractMonthFromHeader = (data: any[][]): { monthAbbr: string, year: number } => {
          const headerRow = data[0];
          if (!headerRow) throw new Error('No header row found');
          
          console.log('Header row:', headerRow);
          
          for (let i = 4; i < headerRow.length; i++) {
            const cellValue = headerRow[i];
            console.log(`Column ${i} value:`, cellValue, typeof cellValue);
            
            if (cellValue) {
              if (typeof cellValue === 'number') {
                try {
                  const jsDate = excelDateToJSDate(cellValue);
                  const month = jsDate.getMonth();
                  const year = jsDate.getFullYear();
                  
                  const monthAbbreviations = [
                    'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
                  ];
                  
                  const monthAbbr = monthAbbreviations[month];
                  console.log('Converted Excel date', cellValue, 'to JS date:', jsDate, 'month:', monthAbbr, 'year:', year);
                  return { monthAbbr, year };
                } catch (error) {
                  console.log('Error converting Excel date:', error);
                  continue;
                }
              }
              
              const cellStr = String(cellValue).trim();
              
              let match = cellStr.match(/\d{1,2}\.([A-Za-z]{3})/i);
              if (match) {
                console.log('Found month with pattern 1:', match[1]);
                return { monthAbbr: match[1], year: new Date().getFullYear() };
              }
              
              match = cellStr.match(/\d{1,2}([A-Za-z]{3})/i);
              if (match) {
                console.log('Found month with pattern 2:', match[1]);
                return { monthAbbr: match[1], year: new Date().getFullYear() };
              }
              
              match = cellStr.match(/^([A-Za-z]{3})$/i);
              if (match) {
                console.log('Found month with pattern 3:', match[1]);
                return { monthAbbr: match[1], year: new Date().getFullYear() };
              }
            }
          }
          
          console.log('Could not find month in any column from E onwards');
          throw new Error('Could not detect month from Excel headers');
        };

        // Process Excel data using the exact logic from the provided file
        const { monthAbbr, year: excelYear } = extractMonthFromHeader(jsonData as any[][]);
        const currentYear = new Date().getFullYear();
        const { monthNumber, year, monthName } = getMonthInfo(monthAbbr, currentYear);
        const daysInMonth = getDaysInMonth(monthNumber, currentYear);
        
        console.log(`Using Excel month: ${monthAbbr}, Excel year: ${excelYear}, Current year: ${currentYear}`);
        
        // Skip header row, start from row 1
        for (let rowIndex = 1; rowIndex < (jsonData as any[][]).length; rowIndex++) {
          const row = (jsonData as any[][])[rowIndex];
          if (!row || row.length < 5) continue;
          
          const marketName = row[0] || '';
          const district = row[1] || '';
          
          // Process each date column (starting from column E = index 4)
          const maxColumns = 4 + daysInMonth;
          for (let colIndex = 4; colIndex < row.length && colIndex < maxColumns; colIndex++) {
            const rawValue = row[colIndex];
            if (!rawValue || rawValue === 0) continue;

            // Handle numeric conversion for values like "0,75"
            let numValue: number;
            if (typeof rawValue === 'number') {
              numValue = rawValue;
            } else if (typeof rawValue === 'string') {
              numValue = parseFloat(rawValue.replace(',', '.'));
              if (isNaN(numValue)) continue;
            } else {
              continue;
            }
            
            // Only process valid values
            if (numValue !== 1 && numValue !== 2 && numValue !== 0.75) {
              continue;
            }
            
            // Calculate the date using CURRENT YEAR but same day/month from Excel
            const day = colIndex - 3;
            const dateInCurrentYear = new Date(currentYear, monthNumber, day);
            const dayOfWeek = getDayOfWeek(dateInCurrentYear);
            
            // Skip Sundays
            if (dayOfWeek === 'Sonntag') continue;
            
            // Determine working hours and other promotion details
            let planStart: string;
            let planEnd: string;
            
            if (numValue === 0.75) {
              // 6-hour promotion (9:00-15:00)
              planStart = "09:00";
              planEnd = "15:00";
            } else {
              // 8-hour promotion
              const workingHours = getWorkingHours(dayOfWeek);
              planStart = workingHours.start;
              planEnd = workingHours.end;
            }
            
            // Format date as YYYY-MM-DD for our system, avoiding timezone issues
            const year = dateInCurrentYear.getFullYear();
            const month = String(dateInCurrentYear.getMonth() + 1).padStart(2, '0');
            const dayOfMonth = String(dateInCurrentYear.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${dayOfMonth}`;
            
            console.log(`Day ${day} of ${monthAbbr} ${currentYear} is a ${dayOfWeek}`);
            
            // If value is 2, create two separate entries
            const numPromotions = numValue === 2 ? 2 : 1;
            
            for (let i = 0; i < numPromotions; i++) {
              newEinsatzplan.push({
                id: currentId++,
                promotor: "",
                address: marketName,
                plz: district,
                city: "",
                planStart: planStart,
                planEnd: planEnd,
                date: dateStr,
                status: "Offen",
                product: marketName.split(' ')[0] || "Market"
              });
            }
          }
        }
        
        // Merge with existing data instead of replacing
        const mergedEinsatzplan = [...einsatzplanData];
        let updatedCount = 0;
        let addedCount = 0;
        
        newEinsatzplan.forEach(newPromotion => {
          // Count existing promotions with same date, address, and time
          const existingCount = mergedEinsatzplan.filter(existing => 
            existing.date === newPromotion.date &&
            existing.address === newPromotion.address &&
            existing.planStart === newPromotion.planStart &&
            existing.planEnd === newPromotion.planEnd
          ).length;
          
          if (existingCount >= 2) {
            // Already have 2 promotions at this time/location - don't add more
            console.log(`Skipping promotion (max 2 reached): ${newPromotion.date} at ${newPromotion.address} (${newPromotion.planStart}-${newPromotion.planEnd})`);
          } else {
            // Can add new promotion - add it with next available ID
            const maxId = mergedEinsatzplan.length > 0 ? Math.max(...mergedEinsatzplan.map(p => p.id)) : 0;
            newPromotion.id = maxId + 1 + addedCount;
            mergedEinsatzplan.push(newPromotion);
            addedCount++;
          }
        });
        
        console.log(`Roh import complete: ${addedCount} new promotions added, ${newEinsatzplan.length - addedCount} duplicates skipped`);
        setEinsatzplanData(mergedEinsatzplan);
        setShowImportModal(false);
        
      } catch (error) {
        console.error('Error processing Excel file:', error);
        alert(`Fehler beim Verarbeiten der Excel-Datei: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Process Excel file for EP intern import
  const processInternExcel = (file: File) => {
    console.log('Processing EP intern Excel file:', file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const newEinsatzplan: any[] = [];
        let currentId = 1;
        
        // Helper function to get working hours based on day and hours
        const getWorkingHoursByDayAndDuration = (dayOfWeek: string, hours: string): { start: string, end: string } => {
          // Normalize hours value - handle different formats like "6", "6 hours", "6h", etc.
          const normalizedHours = String(hours).toLowerCase().trim();
          const isS6Hours = normalizedHours.includes('6') || normalizedHours === '6';
          
          if (isS6Hours) {
            // 6-hour promotion (same as 0.75 value in Roh import)
            return { start: '09:00', end: '15:00' };
          } else {
            // 8-hour promotion (same logic as Roh import)
            if (dayOfWeek === 'Samstag') {
              return { start: '09:00', end: '18:00' };
            }
            return { start: '09:30', end: '18:30' };
          }
        };
        
        const getDayOfWeek = (date: Date): string => {
          const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
          return days[date.getDay()];
        };
        
        // Skip header row, start from row 1
        let skippedRows = 0;
        let processedRows = 0;
        
        for (let rowIndex = 1; rowIndex < (jsonData as any[][]).length; rowIndex++) {
          const row = (jsonData as any[][])[rowIndex];
          if (!row || row.length < 9) {
            console.log(`Row ${rowIndex}: Insufficient columns (${row?.length || 0})`);
            skippedRows++;
            continue;
          }
          
          const dateValue = row[1]; // Column B - date
          const hoursValue = row[4]; // Column E - hours (8 hours or 6 hours)
          const plz = row[6] || ''; // Column G - PLZ
          const marketName = row[7] || ''; // Column H - market name
          const promotorName = row[8] || ''; // Column I - promotor name (might be empty)
          
          if (!dateValue || !hoursValue || !marketName) {
            console.log(`Row ${rowIndex}: Missing required data - Date: ${dateValue}, Hours: ${hoursValue}, Market: ${marketName}`);
            skippedRows++;
            continue;
          }
          
          // Parse the date
          let promotionDate: Date;
          if (typeof dateValue === 'number') {
            // Excel serial date
            const excelEpoch = new Date(1899, 11, 30);
            promotionDate = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
          } else if (typeof dateValue === 'string') {
            // Handle German date format DD.MM.YYYY
            const dateStr = String(dateValue).trim();
            const germanDateMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
            if (germanDateMatch) {
              const [, day, month, year] = germanDateMatch;
              promotionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
              // Try standard Date parsing as fallback
              promotionDate = new Date(dateValue);
            }
          } else {
            continue;
          }
          
          // Check if date is valid
          if (isNaN(promotionDate.getTime())) {
            console.log(`Row ${rowIndex}: Invalid date detected, skipping row:`, dateValue);
            skippedRows++;
            continue;
          }
          
          const dayOfWeek = getDayOfWeek(promotionDate);
          
          // Format date as YYYY-MM-DD
          const year = promotionDate.getFullYear();
          const month = String(promotionDate.getMonth() + 1).padStart(2, '0');
          const day = String(promotionDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          
          // Skip Sundays
          if (dayOfWeek === 'Sonntag') {
            console.log(`Row ${rowIndex}: Skipping Sunday (${dateStr})`);
            skippedRows++;
            continue;
          }
          
          // Get working hours based on day and duration
          const workingHours = getWorkingHoursByDayAndDuration(dayOfWeek, hoursValue);
          
          // Determine status based on promotor name
          const status = promotorName.trim() ? 'Verplant' : 'Offen';
          
          newEinsatzplan.push({
            id: currentId++,
            promotor: promotorName.trim(),
            address: marketName,
            plz: plz,
            city: "",
            planStart: workingHours.start,
            planEnd: workingHours.end,
            date: dateStr,
            status: status,
            product: marketName.split(' ')[0] || "Market"
          });
          
          processedRows++;
        }
        
        // Merge with existing data and update promotor names
        const mergedEinsatzplan = [...einsatzplanData];
        let updatedCount = 0;
        let addedCount = 0;
        
        newEinsatzplan.forEach(newPromotion => {
          // Find existing promotion with same date, address, and time
          const existingIndex = mergedEinsatzplan.findIndex(existing => 
            existing.date === newPromotion.date &&
            existing.address === newPromotion.address &&
            existing.planStart === newPromotion.planStart &&
            existing.planEnd === newPromotion.planEnd
          );
          
          if (existingIndex !== -1) {
            // Promotion already exists
            if (newPromotion.promotor && newPromotion.promotor.trim()) {
              // Update existing promotion with promotor name and set status to Verplant
              mergedEinsatzplan[existingIndex].promotor = newPromotion.promotor;
              mergedEinsatzplan[existingIndex].status = 'Verplant';
              updatedCount++;
              console.log(`Updated promotion: ${newPromotion.date} at ${newPromotion.address} with promotor ${newPromotion.promotor}`);
            } else {
              console.log(`Skipping promotion update (no promotor name): ${newPromotion.date} at ${newPromotion.address}`);
            }
          } else {
            // New promotion - add it with next available ID
            const maxId = mergedEinsatzplan.length > 0 ? Math.max(...mergedEinsatzplan.map(p => p.id)) : 0;
            newPromotion.id = maxId + 1 + addedCount;
            mergedEinsatzplan.push(newPromotion);
            addedCount++;
          }
        });
        
        console.log(`EP intern import complete: ${addedCount} new promotions added, ${updatedCount} promotions updated, ${newEinsatzplan.length - addedCount - updatedCount} skipped. ${skippedRows} rows skipped out of ${(jsonData as any[][]).length - 1} total rows.`);
        setEinsatzplanData(mergedEinsatzplan);
        setShowImportModal(false);
        
      } catch (error) {
        console.error('Error processing EP intern Excel file:', error);
        alert(`Fehler beim Verarbeiten der EP intern Excel-Datei: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      }
    };
    
    reader.readAsArrayBuffer(file);
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



  const filteredEinsatzplan = einsatzplanData.filter(item => {
    // Region filter using PLZ mapping
    const itemRegion = getRegionFromPLZ(item.plz);
    const regionMatch = regionFilter === "ALLE" || itemRegion === regionFilter;
    
    // PLZ filter
    const plzMatch = !plzFilter || item.plz === plzFilter;
    
    // Status filter
    const statusMatch = !statusFilter || item.status === statusFilter;
    
    // Eye filter - hide "Verplant" items when active
    const verplantMatch = !hideVerplant || item.status !== 'Verplant';
    
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
                    <div className="flex items-center justify-between space-x-3">
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
                      
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 z-10 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Suchen..."
                          value={maerkteSearch}
                          onChange={(e) => setMaerkteSearch(e.target.value)}
                          className="w-48 pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-0 bg-white placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className="flex-1 overflow-y-auto custom-scrollbar"
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
                            width: `${filteredEinsatzplan.length > 0 ? Math.min(100, (filteredEinsatzplan.filter(item => ['bestätigt', 'Verplant'].includes(item.status)).length / filteredEinsatzplan.length) * 100) : 0}%` 
                          }}
                        ></div>
                      </div>
                      {/* Statistics indicators */}
                      <div className="flex items-center justify-between opacity-50">
                        <div className="flex items-center space-x-4">
                          <span className="text-xs text-green-600">{filteredEinsatzplan.filter(item => ['bestätigt', 'Verplant'].includes(item.status)).length}</span>
                          <span className="text-xs text-red-600">{filteredEinsatzplan.filter(item => ['abgesagt', 'Krankenstand'].includes(item.status)).length}</span>
                          <span className="text-xs text-gray-600">{filteredEinsatzplan.filter(item => ['geplant', 'Offen'].includes(item.status)).length}</span>
                        </div>
                        <button
                          onClick={() => setHideVerplant(!hideVerplant)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title={hideVerplant ? "Verplante anzeigen" : "Verplante ausblenden"}
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
                      <div className="grid grid-cols-4 gap-4">
                        {generateDayCards().map((dayData) => {
                          // Check if all promotions are "Verplant" (and there's at least one promotion)
                          const allVerplant = dayData.total > 0 && dayData.verplant === dayData.total;
                          
                          return (
                          <div 
                            key={dayData.date}
                            onClick={() => {
                              setDateFilter(dayData.date);
                              setViewMode('list');
                            }}
                            className={`p-4 rounded-lg shadow-sm hover:shadow-sm hover:scale-[1.01] transition-all duration-200 cursor-pointer ${
                              allVerplant ? 'bg-green-50' : 'bg-white'
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
                      <div className="space-y-2">
                        {filteredEinsatzplan.map((einsatz) => {
                        const hasPromotor = ['Verplant', 'bestätigt', 'Krankenstand'].includes(einsatz.status);
                        const isUnplanned = !hasPromotor;
                        return (
                          <div 
                            key={einsatz.id} 
                            onClick={(e) => {
                              if (selectionMode) {
                                e.stopPropagation();
                                setSelectedPromotions(prev => 
                                  prev.includes(einsatz.id) 
                                    ? prev.filter(id => id !== einsatz.id)
                                    : [...prev, einsatz.id]
                                );
                              } else {
                                setSelectedEinsatz(einsatz);
                                setEditingEinsatz({...einsatz});
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
                                  {hasPromotor ? (
                                    <>
                                      <h4 className="text-sm font-medium text-gray-900">{einsatz.promotor}</h4>
                                      <button
                                        onClick={() => openInGoogleMaps(einsatz.address, einsatz.city)}
                                        className="text-xs text-gray-500 text-left cursor-pointer hover:text-blue-600"
                                      >
                                        {einsatz.address}
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <h4 className="text-sm font-medium text-gray-900">{einsatz.product || 'Market'}</h4>
                                      <button
                                        onClick={() => openInGoogleMaps(einsatz.address, einsatz.city)}
                                        className="text-xs text-gray-500 text-left cursor-pointer hover:text-blue-600"
                                      >
                                        {einsatz.address}
                                      </button>
                                    </>
                                  )}
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
                  <div 
                    className="flex-1 overflow-y-auto"
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

          {/* Promotion Distribution Component - Only for Einsatzplan view */}
          {!showMaerkteView && (
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
                        <button
                          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          onClick={() => {
                            const newHistoryItem = {
                              id: Date.now(),
                              date: new Date().toLocaleDateString('de-DE'),
                              time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
                              promotions: einsatzplanData.filter(e => selectedPromotions.includes(e.id)),
                              promotors: [...selectedPromotors],
                              promotionCount: selectedPromotions.length,
                              promotorCount: selectedPromotors.length
                            };
                            setDistributionHistory(prev => [newHistoryItem, ...prev]);
                            setSelectedPromotions([]);
                            setSelectedPromotors([]);
                            setSelectionMode(false);
                          }}
                        >
                          <Send className="h-4 w-4" />
                          <span>Senden</span>
                        </button>
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
          )}
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
                {[
                  { name: "Sarah Schmidt", region: "wien-noe-bgl" },
                  { name: "Michael Weber", region: "steiermark" },
                  { name: "Jan Müller", region: "salzburg" },
                  { name: "Lisa König", region: "wien-noe-bgl" },
                  { name: "Anna Bauer", region: "oberoesterreich" },
                  { name: "Tom Fischer", region: "tirol" },
                  { name: "Maria Huber", region: "steiermark" },
                  { name: "David Klein", region: "vorarlberg" },
                  { name: "Emma Wagner", region: "kaernten" },
                  { name: "Paul Berger", region: "wien-noe-bgl" },
                  { name: "Julia Mayer", region: "salzburg" },
                  { name: "Felix Gruber", region: "oberoesterreich" },
                  { name: "Sophie Reiter", region: "steiermark" },
                  { name: "Max Köhler", region: "tirol" },
                  { name: "Lena Fuchs", region: "vorarlberg" },
                  { name: "Klaus Müller", region: "wien-noe-bgl" },
                  { name: "Sandra Hofer", region: "steiermark" },
                  { name: "Martin Schneider", region: "salzburg" },
                  { name: "Nina Weiss", region: "oberoesterreich" },
                  { name: "Patrick Schwarz", region: "tirol" },
                  { name: "Andrea Roth", region: "vorarlberg" },
                  { name: "Florian Braun", region: "kaernten" },
                  { name: "Jessica Grün", region: "wien-noe-bgl" },
                  { name: "Daniel Gelb", region: "steiermark" },
                  { name: "Sabrina Blau", region: "salzburg" },
                  { name: "Thomas Orange", region: "oberoesterreich" },
                  { name: "Melanie Violett", region: "tirol" },
                  { name: "Christian Rosa", region: "vorarlberg" },
                  { name: "Vanessa Grau", region: "kaernten" },
                  { name: "Marco Silber", region: "wien-noe-bgl" },
                  { name: "Tanja Gold", region: "steiermark" },
                  { name: "Oliver Bronze", region: "salzburg" },
                  { name: "Carina Kupfer", region: "oberoesterreich" },
                  { name: "Lukas Platin", region: "tirol" },
                  { name: "Stephanie Kristall", region: "vorarlberg" },
                  { name: "Benjamin Diamant", region: "kaernten" },
                  { name: "Michelle Rubin", region: "wien-noe-bgl" },
                  { name: "Tobias Saphir", region: "steiermark" },
                  { name: "Nadine Smaragd", region: "salzburg" },
                  { name: "Kevin Topas", region: "oberoesterreich" },
                  { name: "Franziska Opal", region: "tirol" },
                  { name: "Dominik Achat", region: "vorarlberg" },
                  { name: "Simone Jade", region: "kaernten" },
                  { name: "Philip Onyx", region: "wien-noe-bgl" },
                  { name: "Verena Quarz", region: "steiermark" },
                  { name: "Fabian Marmor", region: "salzburg" },
                  { name: "Isabella Granit", region: "oberoesterreich" },
                  { name: "Maximilian Schiefer", region: "tirol" },
                  { name: "Katharina Basalt", region: "vorarlberg" },
                  { name: "Wolfgang Kalk", region: "kaernten" },
                  { name: "Elena Ton", region: "wien-noe-bgl" },
                  { name: "Robert Sand", region: "steiermark" },
                  { name: "Nicole Lehm", region: "salzburg" },
                  { name: "Stefan Kies", region: "oberoesterreich" },
                  { name: "Petra Fels", region: "tirol" },
                  { name: "Alexander Stein", region: "vorarlberg" },
                  { name: "Christina Berg", region: "kaernten" },
                  { name: "Manuel Tal", region: "wien-noe-bgl" },
                  { name: "Andrea Bach", region: "steiermark" },
                  { name: "Daniel See", region: "salzburg" },
                  { name: "Sabine Meer", region: "oberoesterreich" },
                  { name: "Thomas Ozean", region: "tirol" }
                ]
                .filter(promotor => 
                  (activeRegionFilter === "all" || promotor.region === activeRegionFilter) &&
                  promotor.name.toLowerCase().includes(promotorSelectionSearch.toLowerCase())
                )
                .map((promotor) => {
                  const isSelected = selectedPromotors.includes(promotor.name);
                  return (
                    <button
                      key={promotor.name}
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
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {selectedHistoryItem.promotors.map((promotor: string) => (
                      <div 
                        key={promotor}
                        className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-sm"
                      >
                        <span className="font-medium text-gray-900">{promotor}</span>
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
                      <input
                        type="text"
                        value={editingEinsatz.promotor || ''}
                        onChange={(e) => setEditingEinsatz({...editingEinsatz, promotor: e.target.value})}
                        placeholder="Promotor Name"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                      <select
                        value={editingEinsatz.status}
                        onChange={(e) => setEditingEinsatz({...editingEinsatz, status: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none transition-colors"
                      >
                        <option value="Offen">Offen</option>
                        <option value="Verplant">Verplant</option>
                        <option value="bestätigt">Bestätigt</option>
                        <option value="Krankenstand">Krankenstand</option>
                        <option value="Urlaub">Urlaub</option>
                        <option value="Zeitausgleich">Zeitausgleich</option>
                        <option value="Notfall">Notfall</option>
                      </select>
                    </div>
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
                            Angemeldet
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
                          <div className="space-y-2">
                            {/* Mock applications data - replace with real data */}
                            {[
                              "Paul Leutner",
                              "Maria Schmidt", 
                              "Thomas Weber",
                              "Lisa König",
                              "Anna Bauer"
                            ].map((promotor, index) => (
                              <div key={index} className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 mx-1 flex items-center justify-between">
                                <span className="text-sm text-gray-900">{promotor}</span>
                                <div className="flex items-center space-x-2">
                                  <button 
                                    className="p-1 rounded"
                                    onClick={() => assignPromotionToPromotor(promotor)}
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </button>
                                  <button className="p-1 rounded">
                                    <X className="h-4 w-4 text-red-600" />
                                  </button>
                                </div>
                              </div>
                            ))}
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
                onClick={() => {
                  // Update the einsatzplan data
                  setEinsatzplanData(prev => prev.map(item => 
                    item.id === editingEinsatz.id ? editingEinsatz : item
                  ));
                  setShowDetailModal(false);
                  setSelectedEinsatz(null);
                  setEditingEinsatz(null);
                }}
                className="px-6 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
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

      {/* Eddie KI Assistant */}
      <AdminEddieAssistant />
    </div>
  );
} 