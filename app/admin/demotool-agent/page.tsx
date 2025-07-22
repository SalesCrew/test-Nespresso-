"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import AdminNavigation from "../../../components/AdminNavigation";
import AdminEddieAssistant from "../../../components/AdminEddieAssistant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, Calendar, ChevronDown, ChevronLeft, ChevronRight, X, Users, CheckSquare, Zap, Check, Pause, CheckCircle2, MapPin, Clock, User, FileCheck, UserCheck, ThumbsUp, ThumbsDown, Download } from "lucide-react";
import { IoColorWandOutline } from "react-icons/io5";
import * as XLSX from 'xlsx';

// Mock Einsätze data for validation
const mockEinsaetze = [
  {
    id: 1,
    promotor: "Martin Gruber",
    date: "17.06.2025",
    address: "Mariahilfer Str. 123, Wien",
    timespan: "09:00 - 17:00",
    hoursWorked: 8,
    pauseTaken: true,
    pauseDuration: 1,
    hasSignature: true,
    isWeekend: false,
    aiRecommendation: "validate",
    salesCount: 3.8
  },
  {
    id: 2,
    promotor: "Sarah Weber",
    date: "18.06.2025", 
    address: "Kärnter Ring 45, Wien",
    timespan: "10:00 - 16:00",
    hoursWorked: 6,
    pauseTaken: false,
    pauseDuration: 0,
    hasSignature: true,
    isWeekend: true,
    aiRecommendation: "validate",
    salesCount: 4.6
  },
  {
    id: 3,
    promotor: "Michael Klein",
    date: "19.06.2025",
    address: "Linzer Str. 78, Salzburg", 
    timespan: "08:30 - 17:30",
    hoursWorked: 8.5,
    pauseTaken: true,
    pauseDuration: 0.5,
    hasSignature: false,
    isWeekend: false,
    aiRecommendation: "reject",
    salesCount: 2.1
  },
  {
    id: 4,
    promotor: "Anna Müller",
    date: "20.06.2025",
    address: "Hauptplatz 12, Graz",
    timespan: "09:00 - 16:00", 
    hoursWorked: 7,
    pauseTaken: true,
    pauseDuration: 1,
    hasSignature: true,
    isWeekend: false,
    aiRecommendation: "reject",
    salesCount: 5.2
  },
  {
    id: 5,
    promotor: "Thomas Fischer",
    date: "21.06.2025",
    address: "Innrain 67, Innsbruck",
    timespan: "10:00 - 18:00",
    hoursWorked: 8,
    pauseTaken: true,
    pauseDuration: 1,
    hasSignature: true,
    isWeekend: false,
    aiRecommendation: "validate",
    salesCount: 4.1
  },
  {
    id: 6,
    promotor: "Lisa Hoffmann",
    date: "22.06.2025",
    address: "Bahnhofstr. 34, Linz",
    timespan: "11:00 - 17:00",
    hoursWorked: 6,
    pauseTaken: false,
    pauseDuration: 0,
    hasSignature: true,
    isWeekend: true,
    aiRecommendation: "validate",
    salesCount: 3.9
  },
  {
    id: 7,
    promotor: "David Wagner",
    date: "23.06.2025", 
    address: "Dornbirner Str. 89, Bregenz",
    timespan: "09:30 - 18:30",
    hoursWorked: 9,
    pauseTaken: true,
    pauseDuration: 1,
    hasSignature: true,
    isWeekend: false,
    aiRecommendation: "reject",
    salesCount: 3.5
  },
  {
    id: 8,
    promotor: "Julia Steiner",
    date: "24.06.2025",
    address: "Völkermarkter Ring 56, Klagenfurt",
    timespan: "08:00 - 16:00",
    hoursWorked: 8,
    pauseTaken: true,
    pauseDuration: 1,
    hasSignature: true,
    isWeekend: false,
    aiRecommendation: "validate",
    salesCount: 4.9
  }
];

// Mock Einsätze data for LEFT CARD (rejected items) - independent data
const mockLeftEinsaetze = [
  {
    id: 101,
    promotor: "Lisa Schneider",
    date: "10.05.2025",
    address: "Graben 34, Wien",
    timespan: "09:30 - 17:30",
    hoursWorked: 8,
    pauseTaken: false,
    pauseDuration: 0,
    hasSignature: false,
    isWeekend: false,
    aiRecommendation: "reject",
    salesCount: 1.2
  },
  {
    id: 102,
    promotor: "Andreas Huber",
    date: "12.05.2025", 
    address: "Salzachstr. 67, Salzburg",
    timespan: "10:00 - 18:00",
    hoursWorked: 8,
    pauseTaken: false,
    pauseDuration: 0,
    hasSignature: true,
    isWeekend: false,
    aiRecommendation: "reject",
    salesCount: 0.9
  },
  {
    id: 103,
    promotor: "Carmen Rodriguez",
    date: "15.05.2025",
    address: "Hauptplatz 12, Graz", 
    timespan: "08:00 - 16:00",
    hoursWorked: 8,
    pauseTaken: true,
    pauseDuration: 0.5,
    hasSignature: false,
    isWeekend: false,
    aiRecommendation: "reject",
    salesCount: 2.1
  },
  {
    id: 104,
    promotor: "Thomas Bauer",
    date: "18.05.2025",
    address: "Ringstr. 89, Linz",
    timespan: "11:00 - 19:00",
    hoursWorked: 8,
    pauseTaken: false,
    pauseDuration: 0,
    hasSignature: true,
    isWeekend: true,
    aiRecommendation: "reject",
    salesCount: 1.5
  },
  {
    id: 105,
    promotor: "Nina Koller",
    date: "22.05.2025",
    address: "Bahnhofstr. 156, Innsbruck",
    timespan: "09:00 - 17:00",
    hoursWorked: 8,
    pauseTaken: true,
    pauseDuration: 0.3,
    hasSignature: false,
    isWeekend: false,
    aiRecommendation: "reject",
    salesCount: 0.7
  },
  {
    id: 106,
    promotor: "David Wagner",
    date: "25.05.2025",
    address: "Am Stadtpark 23, Wien",
    timespan: "10:30 - 18:30",
    hoursWorked: 8,
    pauseTaken: false,
    pauseDuration: 0,
    hasSignature: true,
    isWeekend: false,
    aiRecommendation: "reject",
    salesCount: 1.8
  },
  {
    id: 107,
    promotor: "Julia Mayer",
    date: "28.05.2025",
    address: "Neubaugasse 45, Wien",
    timespan: "08:30 - 16:30",
    hoursWorked: 8,
    pauseTaken: true,
    pauseDuration: 0.2,
    hasSignature: false,
    isWeekend: false,
    aiRecommendation: "reject",
    salesCount: 2.4
  },
  {
    id: 108,
    promotor: "Robert Steiner",
    date: "01.06.2025",
    address: "Landstr. 78, Sankt Pölten",
    timespan: "09:15 - 17:15",
    hoursWorked: 8,
    pauseTaken: false,
    pauseDuration: 0,
    hasSignature: true,
    isWeekend: true,
    aiRecommendation: "reject",
    salesCount: 1.1
  },
  {
    id: 109,
    promotor: "Alexandra Fuchs",
    date: "03.06.2025",
    address: "Wiener Str. 234, Graz",
    timespan: "10:00 - 18:00",
    hoursWorked: 8,
    pauseTaken: true,
    pauseDuration: 0.4,
    hasSignature: false,
    isWeekend: false,
    aiRecommendation: "reject",
    salesCount: 0.6
  },
  {
    id: 110,
    promotor: "Stefan Hofer",
    date: "07.06.2025",
    address: "Mozartplatz 9, Salzburg",
    timespan: "11:30 - 19:30",
    hoursWorked: 8,
    pauseTaken: false,
    pauseDuration: 0,
    hasSignature: true,
    isWeekend: false,
    aiRecommendation: "reject",
    salesCount: 1.9
  },
  {
    id: 111,
    promotor: "Katharina Lang",
    date: "11.06.2025",
    address: "Stadtplatz 56, Wels",
    timespan: "09:45 - 17:45",
    hoursWorked: 8,
    pauseTaken: true,
    pauseDuration: 0.6,
    hasSignature: false,
    isWeekend: false,
    aiRecommendation: "reject",
    salesCount: 2.7
  },
  {
    id: 112,
    promotor: "Markus Fischer",
    date: "14.06.2025",
    address: "Praterstr. 123, Wien",
    timespan: "08:45 - 16:45",
    hoursWorked: 8,
    pauseTaken: false,
    pauseDuration: 0,
    hasSignature: true,
    isWeekend: true,
    aiRecommendation: "reject",
    salesCount: 1.3
  }
];

// Promotor data
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

export default function DemoToolAgentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, direction: 'left' | 'right', opacity: number}>>([]);
  
  // Magic Touch state
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [magicText, setMagicText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Feedback animation state
  const [animatedFeedback, setAnimatedFeedback] = useState('');

  // Column validation state
  const [validatingColumns, setValidatingColumns] = useState<Set<number>>(new Set());
  const [rejectingColumns, setRejectingColumns] = useState<Set<number>>(new Set());

  // Validated columns (removed from view)
  const [validatedColumns, setValidatedColumns] = useState<Set<number>>(new Set());
  const [rejectedColumns, setRejectedColumns] = useState<Set<number>>(new Set());

  // Column expansion state
  const [expandedColumns, setExpandedColumns] = useState<Set<number>>(new Set());
  const [typingAnimations, setTypingAnimations] = useState<Record<number, string>>({});
  const [fadedInContainers, setFadedInContainers] = useState<Set<number>>(new Set());
  const [showVerlauf, setShowVerlauf] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadDateRange, setDownloadDateRange] = useState<{start: string | null, end: string | null}>({start: null, end: null});
  const [downloadAllTime, setDownloadAllTime] = useState(false);
  const [downloadDateViewMode, setDownloadDateViewMode] = useState<'weeks' | 'calendar'>('weeks');
  const [downloadSelectedWeeks, setDownloadSelectedWeeks] = useState<string[]>([]);
  const [downloadCurrentMonth, setDownloadCurrentMonth] = useState(new Date());
  
  // Left card (rejected) states - independent from right card
  const [leftValidatedColumns, setLeftValidatedColumns] = useState<Set<number>>(new Set());
  const [leftRejectedColumns, setLeftRejectedColumns] = useState<Set<number>>(new Set());
  const [leftValidatingColumns, setLeftValidatingColumns] = useState<Set<number>>(new Set());
  const [leftRejectingColumns, setLeftRejectingColumns] = useState<Set<number>>(new Set());
  const [showLeftVerlauf, setShowLeftVerlauf] = useState(false);
  
  // AI Generation Process States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingColumns, setGeneratingColumns] = useState<Set<number>>(new Set());
  const [fadingColumns, setFadingColumns] = useState<Set<number>>(new Set());
  const [revealedColumns, setRevealedColumns] = useState<Set<number>>(new Set());
  const [leftDisplayOrder, setLeftDisplayOrder] = useState<number[]>([]);
  const [rightDisplayOrder, setRightDisplayOrder] = useState<number[]>([]);
  const [generationQueue, setGenerationQueue] = useState<Array<{data: any, side: 'left' | 'right'}>>([]);
  const [generationIndex, setGenerationIndex] = useState(0);
  const generationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showLeftDownloadModal, setShowLeftDownloadModal] = useState(false);
  const [leftDownloadDateRange, setLeftDownloadDateRange] = useState<{start: string | null, end: string | null}>({start: null, end: null});
  const [leftDownloadAllTime, setLeftDownloadAllTime] = useState(false);
  const [leftDownloadDateViewMode, setLeftDownloadDateViewMode] = useState<'weeks' | 'calendar'>('weeks');
  const [leftDownloadSelectedWeeks, setLeftDownloadSelectedWeeks] = useState<string[]>([]);
  const [leftDownloadCurrentMonth, setLeftDownloadCurrentMonth] = useState(new Date());
  
  const aiReasoningRefs = useRef<Record<number, HTMLParagraphElement | null>>({});

  // CA KPI color rules (same as admin/statistiken)
  const getSalesColor = (value: number) => {
    if (value >= 4.5) return "text-green-600";
    if (value >= 4.0) return "text-[#FD7E14]";
    return "text-red-600";
  };

  const getSalesStyle = (colorClass: string) => {
    if (colorClass === "text-[#FD7E14]") {
      return { color: "#FD7E14" };
    }
    return {};
  };

  // Excel download function
  const handleExcelDownload = () => {
    // Get validated einsätze
    const validatedEinsätze = mockEinsaetze.filter(einsatz => validatedColumns.has(einsatz.id));
    
    // Filter by validation date (for demo purposes, we'll use current date as validation date)
    const filteredData = validatedEinsätze.filter(einsatz => {
      if (downloadAllTime) return true;
      
      // Mock validation date - in real app this would be stored with validation
      const validationDate = new Date(); // Today as validation date
      const validationDateStr = `${validationDate.getFullYear()}-${String(validationDate.getMonth() + 1).padStart(2, '0')}-${String(validationDate.getDate()).padStart(2, '0')}`;
      
      if (downloadSelectedWeeks.length > 0) {
        // Check if validation date falls within selected weeks
        return downloadSelectedWeeks.some(weekStr => {
          const weekNum = parseInt(weekStr.match(/KW (\d+)/)?.[1] || '0');
          const currentYear = validationDate.getFullYear();
          const startDate = new Date(currentYear, 0, 1);
          const firstMonday = new Date(startDate);
          const dayOfWeek = startDate.getDay();
          const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
          firstMonday.setDate(startDate.getDate() + daysToAdd);
          
          const weekStart = new Date(firstMonday);
          weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          return validationDate >= weekStart && validationDate <= weekEnd;
        });
      }
      
      if (downloadDateRange.start) {
        const startDate = new Date(downloadDateRange.start);
        const endDate = downloadDateRange.end ? new Date(downloadDateRange.end) : startDate;
        return validationDate >= startDate && validationDate <= endDate;
      }
      
      return false;
    });
    
    // Check if there's data to export
    if (filteredData.length === 0) {
      alert('Keine Daten für den gewählten Zeitraum vorhanden.');
      return;
    }

    // Create Excel data - all validated items show as approved
    const excelData = filteredData.map(einsatz => ({
      'Promotor': einsatz.promotor,
      'Datum': einsatz.date,
      'Adresse': einsatz.address,
      'Arbeitszeit': einsatz.timespan,
      'Stunden': einsatz.hoursWorked,
      'Pause genommen': 'Ja', // All validated items approved for pause
      'Pause (Stunden)': einsatz.pauseDuration,
      'Unterschrift': 'Ja', // All validated items approved for signature
      'Wochenende': einsatz.isWeekend ? 'Ja' : 'Nein',
      'Verkäufe': einsatz.salesCount,
      'AI Empfehlung': 'Validiert' // All items in validated list are marked as validated
    }));
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Validierte Einsätze');
    
    // Generate filename with current timestamp
    const now = new Date();
    const filename = `Validierte_Einsaetze_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
  };

  // Left card Excel download function for validated items
  const handleLeftExcelDownload = () => {
    // Get validated einsätze from left card data
    const validatedEinsätze = mockLeftEinsaetze.filter(einsatz => leftValidatedColumns.has(einsatz.id));
    
    // Filter by validation date (for demo purposes, we'll use current date as validation date)
    const filteredData = validatedEinsätze.filter(einsatz => {
      if (leftDownloadAllTime) return true;
      
      // Mock validation date - in real app this would be stored with validation
      const validationDate = new Date(); // Today as validation date
      
      if (leftDownloadSelectedWeeks.length > 0) {
        // Check if validation date falls within selected weeks
        return leftDownloadSelectedWeeks.some(weekStr => {
          const weekNum = parseInt(weekStr.match(/KW (\d+)/)?.[1] || '0');
          const currentYear = validationDate.getFullYear();
          const startDate = new Date(currentYear, 0, 1);
          const firstMonday = new Date(startDate);
          const dayOfWeek = startDate.getDay();
          const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
          firstMonday.setDate(startDate.getDate() + daysToAdd);
          
          const weekStart = new Date(firstMonday);
          weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          return validationDate >= weekStart && validationDate <= weekEnd;
        });
      }
      
      if (leftDownloadDateRange.start) {
        const startDate = new Date(leftDownloadDateRange.start);
        const endDate = leftDownloadDateRange.end ? new Date(leftDownloadDateRange.end) : startDate;
        return validationDate >= startDate && validationDate <= endDate;
      }
      
      return false;
    });
    
    // Check if there's data to export
    if (filteredData.length === 0) {
      alert('Keine Daten für den gewählten Zeitraum vorhanden.');
      return;
    }

    // Create Excel data - all validated items show as approved
    const excelData = filteredData.map(einsatz => ({
      'Promotor': einsatz.promotor,
      'Datum': einsatz.date,
      'Adresse': einsatz.address,
      'Arbeitszeit': einsatz.timespan,
      'Stunden': einsatz.hoursWorked,
      'Pause genommen': einsatz.pauseTaken ? 'Ja' : 'Nein', // Show actual pause data
      'Pause (Stunden)': einsatz.pauseDuration,
      'Unterschrift': einsatz.hasSignature ? 'Ja' : 'Nein', // Show actual signature data
      'Wochenende': einsatz.isWeekend ? 'Ja' : 'Nein',
      'Verkäufe': einsatz.salesCount,
      'AI Empfehlung': 'Nicht validiert' // Left card = AI says don't validate
    }));
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Validierte Einsätze (Links)');
    
    // Generate filename with current timestamp
    const now = new Date();
    const filename = `Validierte_Einsaetze_Links_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
  };

  // Download modal calendar helper functions
  const generateDownloadCalendarWeeks = () => {
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

  const generateDownloadCalendarDays = () => {
    const year = downloadCurrentMonth.getFullYear();
    const month = downloadCurrentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
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

  const getDownloadAllRangeDates = () => {
    if (!downloadDateRange.start) return [];
    if (!downloadDateRange.end) return [downloadDateRange.start];
    
    const start = downloadDateRange.start <= downloadDateRange.end ? downloadDateRange.start : downloadDateRange.end;
    const end = downloadDateRange.start <= downloadDateRange.end ? downloadDateRange.end : downloadDateRange.start;
    return getDatesBetween(start, end);
  };

  // Left card calendar helper functions
  const generateLeftCalendarWeeks = () => {
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

  const generateLeftCalendarDays = () => {
    const year = leftDownloadCurrentMonth.getFullYear();
    const month = leftDownloadCurrentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
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

  const getLeftAllRangeDates = () => {
    if (!leftDownloadDateRange.start) return [];
    if (!leftDownloadDateRange.end) return [leftDownloadDateRange.start];
    
    const start = leftDownloadDateRange.start <= leftDownloadDateRange.end ? leftDownloadDateRange.start : leftDownloadDateRange.end;
    const end = leftDownloadDateRange.start <= leftDownloadDateRange.end ? leftDownloadDateRange.end : leftDownloadDateRange.start;
    return getDatesBetween(start, end);
  };

  // AI Generation Process Functions
  const startAIGenerationProcess = () => {
    if (isGenerating) return;
    
    // Create generation queue with all data mixed from both sides
    const leftQueue = mockLeftEinsaetze.map(item => ({data: item, side: 'left' as const}));
    const rightQueue = mockEinsaetze.map(item => ({data: item, side: 'right' as const}));
    
    // Shuffle the combined queue for random generation
    const combinedQueue = [...leftQueue, ...rightQueue];
    const shuffledQueue = combinedQueue.sort(() => Math.random() - 0.5);
    
    setGenerationQueue(shuffledQueue);
    setGenerationIndex(0);
    setIsGenerating(true);
    setRevealedColumns(new Set());
    
    // Start generation timer (every 5 seconds)
    let currentIndex = 0;
    generationTimerRef.current = setInterval(() => {
      currentIndex++;
      
      if (currentIndex > shuffledQueue.length) {
        // Process complete
        clearInterval(generationTimerRef.current!);
        setIsGenerating(false);
        return;
      }
      
      const currentItem = shuffledQueue[currentIndex - 1];
      
      // Check if already processing using refs to access current state
      setGeneratingColumns(prev => {
        setRevealedColumns(revealedPrev => {
          const isAlreadyProcessing = prev.has(currentItem.data.id) || revealedPrev.has(currentItem.data.id);
          
          if (!isAlreadyProcessing) {
            // Add to display order (at the beginning to push others down) - only if not already present
            if (currentItem.side === 'left') {
              setLeftDisplayOrder(displayPrev => {
                if (displayPrev.includes(currentItem.data.id)) return displayPrev;
                return [currentItem.data.id, ...displayPrev];
              });
            } else {
              setRightDisplayOrder(displayPrev => {
                if (displayPrev.includes(currentItem.data.id)) return displayPrev;
                return [currentItem.data.id, ...displayPrev];
              });
            }
            
            // After 2.5 seconds, start fade transition
            setTimeout(() => {
              // Start fading out the loading animation
              setFadingColumns(fadePrev => new Set(fadePrev).add(currentItem.data.id));
              
              // After 0.5 seconds fade transition, reveal the data
              setTimeout(() => {
                setGeneratingColumns(genPrev => {
                  const newSet = new Set(genPrev);
                  newSet.delete(currentItem.data.id);
                  return newSet;
                });
                setFadingColumns(fadePrev => {
                  const newSet = new Set(fadePrev);
                  newSet.delete(currentItem.data.id);
                  return newSet;
                });
                setRevealedColumns(revPrev => new Set(revPrev).add(currentItem.data.id));
              }, 500);
            }, 2500);
            
            // Return updated generating columns
            return new Set(prev).add(currentItem.data.id);
          }
          
          return revealedPrev;
        });
        
        return prev;
      });
    }, 5000);
  };

  const stopAIGenerationProcess = () => {
    // Clear the generation timer to stop generating new columns
    if (generationTimerRef.current) {
      clearInterval(generationTimerRef.current);
      generationTimerRef.current = null;
    }
    
    setIsGenerating(false);
    setGenerationIndex(0);
    setGeneratingColumns(new Set());
    setFadingColumns(new Set());
    // Keep revealed columns and display orders so generated columns stay visible
    // setRevealedColumns(new Set());
    // setLeftDisplayOrder([]);
    // setRightDisplayOrder([]);
    setGenerationQueue([]);
  };

  // Left card validation functions - independent from right card
  const handleLeftValidateColumn = (columnId: number) => {
    setLeftValidatingColumns(prev => new Set(prev).add(columnId));
    
    // Remove column after animation completes
    setTimeout(() => {
      setLeftValidatingColumns(prev => {
        const newSet = new Set(prev);
        newSet.delete(columnId);
        return newSet;
      });
      setLeftValidatedColumns(prev => new Set(prev).add(columnId));
    }, 500); // Animation duration
  };

  const handleLeftRejectColumn = (columnId: number) => {
    setLeftRejectingColumns(prev => new Set(prev).add(columnId));
    
    // Remove column after animation completes
    setTimeout(() => {
      setLeftRejectingColumns(prev => {
        const newSet = new Set(prev);
        newSet.delete(columnId);
        return newSet;
      });
      setLeftRejectedColumns(prev => new Set(prev).add(columnId));
    }, 500); // Animation duration
  };

  // Handle column validation
  const handleValidateColumn = (columnId: number) => {
    setValidatingColumns(prev => new Set(prev).add(columnId));
    
    // Remove column after animation completes
    setTimeout(() => {
      setValidatingColumns(prev => {
        const newSet = new Set(prev);
        newSet.delete(columnId);
        return newSet;
      });
      setValidatedColumns(prev => new Set(prev).add(columnId));
    }, 500); // Animation duration
  };

  // Handle column rejection
  const handleRejectColumn = (columnId: number) => {
    setRejectingColumns(prev => new Set(prev).add(columnId));
    
    // Remove column after animation completes
    setTimeout(() => {
      setRejectingColumns(prev => {
        const newSet = new Set(prev);
        newSet.delete(columnId);
        return newSet;
      });
      setRejectedColumns(prev => new Set(prev).add(columnId));
    }, 500); // Animation duration
  };

  // Handle chevron expansion
  const handleChevronClick = (columnId: number) => {
    setExpandedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
        setTypingAnimations(prev => ({ ...prev, [columnId]: '' }));
        setFadedInContainers(prev => {
          const fadeSet = new Set(prev);
          fadeSet.delete(columnId);
          return fadeSet;
        });
      } else {
        newSet.add(columnId);
        // Start fade-in animation after brief delay
        setTimeout(() => {
          setFadedInContainers(prev => new Set(prev).add(columnId));
        }, 200); // Short delay to sync with expansion
        // Start typing animation
        startTypingAnimation(columnId);
      }
      return newSet;
    });
  };

  // Typing animation for validation reasoning
  const startTypingAnimation = (columnId: number) => {
    // Check both right card data (mockEinsaetze) and left card data (mockLeftEinsaetze)
    let einsatz = mockEinsaetze.find(e => e.id === columnId);
    if (!einsatz) {
      einsatz = mockLeftEinsaetze.find(e => e.id === columnId);
    }
    if (!einsatz) return;

    const reasons = {
      validate: "Alle Kriterien erfüllt: Korrekte Arbeitszeiten, vollständige Pause dokumentiert, Unterschrift vorhanden, Verkaufszahlen im grünen Bereich. Empfehlung: Validierung genehmigen.",
      reject: "Unvollständige Dokumentation festgestellt: Fehlende Unterschrift oder unplausible Arbeitszeiten erkannt. Verkaufszahlen unter Durchschnitt. Empfehlung: Nachprüfung erforderlich."
    };

    const text = reasons[einsatz.aiRecommendation as keyof typeof reasons];
    let currentText = '';
    let i = 0;

    const typeInterval = setInterval(() => {
      if (i < text.length) {
        currentText += text[i];
        setTypingAnimations(prev => ({ ...prev, [columnId]: currentText }));
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 30);
  };

  // Promotor selection state
  const [showPromotorSelection, setShowPromotorSelection] = useState(false);
  const [selectedPromotors, setSelectedPromotors] = useState<string[]>([]);
  const [activeRegionFilter, setActiveRegionFilter] = useState<string>("all");
  const [promotorSelectionSearch, setPromotorSelectionSearch] = useState("");

  // Calendar state
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [dateViewMode, setDateViewMode] = useState<'weeks' | 'calendar'>('weeks');
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{start: string | null, end: string | null}>({start: null, end: null});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const weeksContainerRef = useRef<HTMLDivElement>(null);

  // Handle validation toggle
  const handleValidationToggle = () => {
    if (selectedPromotors.length > 0 && (selectedWeeks.length > 0 || dateRange.start)) {
      setIsValidating(!isValidating);
    }
  };

  // Handle magic touch functionality
  const handleMagicIconClick = () => {
    if (isSubmitted) {
      setIsSubmitted(false);
      setShowMagicModal(true);
    } else {
      setShowMagicModal(true);
    }
  };

  const handleMagicSubmit = () => {
    if (magicText.trim()) {
      setIsSubmitted(true);
      setShowMagicModal(false);
    }
  };

  // Typing animation for feedback text
  useEffect(() => {
    const feedbackMessages = [
      "Analysiere Promotor-Daten...",
      "Prüfe Zeiträume und Verfügbarkeiten...",
      "Simuliere Validierungsergebnisse...",
      "Kombiniere Datenpunkte...",
      "Erstelle Prognose..."
    ];
    let messageIndex = 0;
    let feedbackInterval: NodeJS.Timeout | null = null;
    let typingInterval: NodeJS.Timeout | null = null;

    const startTypingAnimation = (message: string) => {
      if (typingInterval) clearInterval(typingInterval);
      setAnimatedFeedback('');
      let charIndex = 0;
      typingInterval = setInterval(() => {
        if (charIndex < message.length) {
          setAnimatedFeedback(prev => message.substring(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typingInterval!);
        }
      }, 50);
    };

    if (isValidating) {
      startTypingAnimation(feedbackMessages[messageIndex]);
      feedbackInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % feedbackMessages.length;
        startTypingAnimation(feedbackMessages[messageIndex]);
      }, 3000); // Cycle every 3 seconds
    }

    return () => {
      if (feedbackInterval) clearInterval(feedbackInterval);
      if (typingInterval) clearInterval(typingInterval);
      setAnimatedFeedback('');
    };
  }, [isValidating]);

  // Helper functions for region styling
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
    return "border-gray-200";
  };

  // Helper function for promotor selection display
  const getPromotorDisplayText = () => {
    if (selectedPromotors.length === 0) {
      return "Promotoren auswählen";
    } else if (selectedPromotors.length === 1) {
      return selectedPromotors[0];
    } else if (selectedPromotors.length === allPromotors.length) {
      return "Alle Promotoren";
    } else {
      // Check if all selected promotors are from same region
      const selectedRegions = new Set(
        selectedPromotors.map(name => 
          allPromotors.find(p => p.name === name)?.region
        ).filter(Boolean)
      );
      
      if (selectedRegions.size === 1) {
        const region = Array.from(selectedRegions)[0];
        const regionNames = {
          "wien-noe-bgl": "Wien/NÖ/BGL",
          "steiermark": "Steiermark", 
          "salzburg": "Salzburg",
          "oberoesterreich": "Oberösterreich",
          "tirol": "Tirol",
          "vorarlberg": "Vorarlberg",
          "kaernten": "Kärnten"
        };
        return `${regionNames[region as keyof typeof regionNames]} (${selectedPromotors.length})`;
      } else {
        return `${selectedPromotors.length} Promotoren`;
      }
    }
  };

  // Select all filtered promotors
  const selectAllFiltered = () => {
    const filtered = allPromotors.filter(p => 
      (activeRegionFilter === "all" || p.region === activeRegionFilter) &&
      p.name.toLowerCase().includes(promotorSelectionSearch.toLowerCase())
    ).map(p => p.name);

    const currentlySelected = new Set(selectedPromotors);
    const allFilteredSelected = filtered.every(name => currentlySelected.has(name));

    if (allFilteredSelected) {
      // Deselect all filtered
      setSelectedPromotors(prev => prev.filter(name => !filtered.includes(name)));
    } else {
      // Select all filtered
      const newSelection = [...new Set([...selectedPromotors, ...filtered])];
      setSelectedPromotors(newSelection);
    }
  };

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
    
    return 'Zeitraum wählen';
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

  // Particle animation effect
  useEffect(() => {
    if (!isValidating) {
      setParticles([]);
      return;
    }

    const interval = setInterval(() => {
      setParticles(prev => {
        // Add new particles
        const newParticles = [];
        
        // Create particles for both directions
        for (let i = 0; i < 2; i++) {
          if (Math.random() < 0.3) { // 30% chance per frame
            const direction: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';
            newParticles.push({
              id: Math.random(),
              x: 0, // Start at middle card edge
              y: 20 + Math.random() * 60, // Random height between 20% and 80%
              direction,
              opacity: 0
            });
          }
        }

        // Update existing particles
        const updated = prev.map(particle => {
          const speed = 0.5; // Slowed down from 2 to 0.5
          const newX = particle.x + speed; // Always increase distance from center
          
          // Calculate opacity based on position
          let opacity = particle.opacity;
          if (newX < 10) {
            opacity = newX / 10; // Fade in as it emerges
          } else if (newX > 80) {
            opacity = Math.max(0, 1 - (newX - 80) / 20); // Fade out near destination
          } else {
            opacity = 1;
          }

          return { ...particle, x: newX, opacity };
        }).filter(particle => particle.x < 120); // Remove particles that have traveled too far

        return [...updated, ...newParticles].slice(0, 30); // Limit total particles
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isValidating]);

  // Memoize the matrix animation to prevent re-renders from particle state changes
  const matrixAnimation = useMemo(() => {
    if (!isValidating) return null;

    // Generate columns with fixed random values that persist across re-renders
    const columns = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      style: {
        left: `${(i * 100 / 15) + (100 / 15 / 2)}%`,
        transform: 'translateX(-50%)',
        animationDuration: `${15 + Math.random() * 10}s`,
        animationDelay: `${Math.random() * 5}s`
      },
      content: Array.from({ length: 50 }, () => (Math.random() > 0.5 ? '1' : '0')).join('\n')
    }));

    return (
      <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none overflow-hidden">
        {columns.map(col => (
          <div
            key={col.id}
            className="matrix-column absolute top-0 text-green-600 text-sm font-mono opacity-[0.08]"
            style={col.style}
          >
            <div className="whitespace-pre leading-[18px]">{col.content}</div>
          </div>
        ))}
      </div>
    );
  }, [isValidating]);

  // Auto-scroll typing animation in AI reasoning containers
  useEffect(() => {
    Object.keys(typingAnimations).forEach(columnIdStr => {
      const columnId = parseInt(columnIdStr);
      const element = aiReasoningRefs.current[columnId];
      if (element && typingAnimations[columnId]) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }, [typingAnimations]);

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Admin Navigation */}
      <AdminNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-14'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">DemoTool Agent</h1>
                <p className="text-gray-500 text-sm">AI-gestützte Promotion-Validierung</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl relative">
              
              {/* Particle Animation Layer - behind cards */}
              {isValidating && (
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
                  {particles.map(particle => (
                    <div
                      key={particle.id}
                      className={`absolute w-1.5 h-1.5 rounded-full ${
                        particle.direction === 'left' ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{
                        left: '50%',
                        top: `${particle.y}%`,
                        transform: `translateX(calc(-50% + ${particle.x * 4 * (particle.direction === 'left' ? -1 : 1)}px))`,
                        opacity: particle.opacity * 0.4,
                        transition: 'opacity 0.3s ease-out'
                      }}
                    />
                  ))}
                </div>
              )}
              
              {/* Left Card - Rejected Items */}
              <Card 
                className="lg:col-span-1 h-[500px] shadow-md transition-all duration-200 border-0 bg-white relative z-10"
                style={{
                  ...(isValidating && {
                    animation: 'strokePulseRed 2s ease-in-out infinite'
                  })
                }}
              >
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center opacity-85"
                        style={{background: 'linear-gradient(135deg, #FA0C0C, #CD0000)'}}
                      >
                        <X className="h-3 w-3 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{showLeftVerlauf ? 'Verlauf' : 'Einsätze validieren'}</h3>
                    </div>
                  </div>
                  
                  <div 
                    className="flex-1 rounded-lg border border-gray-300 shadow-sm relative"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 25%, #f3f4f6 100%)'
                    }}
                  >
                    {/* Fixed Header with Fillup Bar/Indicator */}
                    <div className="absolute top-0 left-0 right-0 z-10">
                      {showLeftVerlauf ? (
                        /* Left Verlauf Header - Indicator number with download icon */
                        <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                          <div className="text-sm text-gray-500 opacity-60">
                            {leftValidatedColumns.size} validierte Einsätze
                          </div>
                          <button 
                            className="opacity-60 hover:opacity-80 transition-opacity"
                            onClick={() => setShowLeftDownloadModal(true)}
                          >
                            <Download className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Background bar container */}
                          <div className="absolute top-5 left-5 right-5 h-1 rounded-lg overflow-hidden"
                            style={{
                              background: 'linear-gradient(to right, #d1d5db, #f9fafb)',
                              opacity: 0.6
                            }}
                          >
                            {/* Progress bar */}
                            <div 
                              className="h-full rounded-lg"
                              style={{
                                background: 'linear-gradient(135deg, #FA0C0C, #CD0000)',
                                boxShadow: '0 0 6px 2px rgba(250, 12, 12, 0.5)',
                                width: `${((leftValidatedColumns.size + leftRejectedColumns.size) / mockLeftEinsaetze.length) * 100}%`,
                                transition: 'width 0.5s ease-in-out',
                                opacity: 0.7
                              }}
                            />
                          </div>
                          
                          {/* Indicator Numbers */}
                          <div className="absolute top-7 left-5 text-[10px] flex space-x-1">
                            <span className="text-green-500 opacity-70">{leftValidatedColumns.size}</span>
                            <span className="text-red-500 opacity-70">{leftRejectedColumns.size}</span>
                            <span className="text-gray-500 opacity-40">{leftDisplayOrder.length}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Scrollable Content Area */}
                    <div 
                      className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                      }}
                    >
                      {/* Empty State */}
                      {leftDisplayOrder.filter(id => {
                        const einsatz = mockLeftEinsaetze.find(e => e.id === id);
                        if (!einsatz) return false;
                        return showLeftVerlauf ? leftValidatedColumns.has(id) : (!leftValidatedColumns.has(id) && !leftRejectedColumns.has(id));
                      }).length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-5 py-12">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500 font-medium mb-1">Alle Einsätze validiert</p>
                          <p className="text-xs text-gray-400">Keine weiteren Validierungen erforderlich</p>
                        </div>
                      )}

                      {/* Left Card Columns */}
                      <div className="px-5 pt-12 pb-6 space-y-3">
                        {/* Unified Column Rendering */}
                        {leftDisplayOrder.filter(id => {
                          const einsatz = mockLeftEinsaetze.find(e => e.id === id);
                          if (!einsatz) return false;
                          // Show all columns that are in display order
                          if (showLeftVerlauf) {
                            return leftValidatedColumns.has(id);
                          } else {
                            return !leftValidatedColumns.has(id) && !leftRejectedColumns.has(id);
                          }
                        }).map((id, index) => {
                          const einsatz = mockLeftEinsaetze.find(e => e.id === id)!;
                          const isExpanded = expandedColumns.has(einsatz.id);
                          return (
                          <div
                            key={`left-${einsatz.id}`}
                            className={`bg-white border border-gray-300 rounded-lg shadow-md p-3 flex flex-col relative transition-all duration-500 ease-in-out overflow-hidden cursor-pointer ${
                              leftValidatingColumns.has(einsatz.id) 
                                ? 'transform -translate-y-[500%] opacity-0' 
                                : leftRejectingColumns.has(einsatz.id)
                                ? 'transform translate-x-[500%] opacity-0'
                                : !showLeftVerlauf && (leftValidatedColumns.has(einsatz.id) || leftRejectedColumns.has(einsatz.id))
                                ? 'hidden'
                                : 'hover:scale-[1.02]'
                            }`}
                            style={{
                              height: isExpanded ? '200px' : '74px',
                              animation: index === 0 && generatingColumns.has(einsatz.id) && !revealedColumns.has(einsatz.id)
                                ? 'slideInFromTop 0.5s ease-out'
                                : undefined
                            }}
                            onClick={() => handleChevronClick(einsatz.id)}
                          >
                            {/* Conditional Content - Loading Animation or Data */}
                            {generatingColumns.has(einsatz.id) ? (
                              /* Loading Animation */
                              <div 
                                className="absolute inset-0 flex items-center justify-center bg-white"
                                style={{
                                  animation: fadingColumns.has(einsatz.id) ? 'fadeOut 0.5s ease-out forwards' : undefined
                                }}
                              >
                                <div className="flex flex-col items-center space-y-2">
                                  <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                  <span className="text-xs text-gray-500">AI analysiert...</span>
                                </div>
                              </div>
                            ) : null}
                            
                            {/* Data Content - Fades in when revealed */}
                            <div style={{
                              opacity: generatingColumns.has(einsatz.id) ? 0 : 1,
                              animation: revealedColumns.has(einsatz.id) && !generatingColumns.has(einsatz.id) 
                                ? 'fadeIn 0.5s ease-out forwards' 
                                : undefined
                            }}>
                              {/* Hours indicator - slides to right side */}
                            <div className={`absolute flex flex-col items-end transition-all duration-500 ease-in-out ${
                              isExpanded ? 'right-3 top-16' : 'right-16 top-1/2 transform -translate-y-1/2'
                            }`}>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-600">{einsatz.hoursWorked}h</span>
                              </div>
                              {isExpanded && (
                                <span className="text-xs text-gray-500 mt-1">{einsatz.timespan}</span>
                              )}
                            </div>

                            {/* Validation Buttons */}
                            {showLeftVerlauf ? (
                              <div className="absolute right-3" style={{top: '30px'}}>
                                <div className="p-0.5 rounded bg-green-100 border border-green-200">
                                  <Check className="text-green-600" style={{width: '11.4px', height: '11.4px'}} />
                                </div>
                              </div>
                            ) : (
                              <div className="absolute top-3 right-3 flex flex-col space-y-2">
                                <button 
                                  className="p-0.5 rounded bg-green-100 hover:bg-green-200 transition-colors border border-green-200"
                                  onClick={(e) => { e.stopPropagation(); handleLeftValidateColumn(einsatz.id); }}
                                >
                                  <Check className="text-green-600" style={{width: '11.4px', height: '11.4px'}} />
                                </button>
                                <button 
                                  className="p-0.5 rounded bg-red-100 hover:bg-red-200 transition-colors border border-red-200"
                                  onClick={(e) => { e.stopPropagation(); handleLeftRejectColumn(einsatz.id); }}
                                >
                                  <X className="text-red-500" style={{width: '11.4px', height: '11.4px'}} />
                                </button>
                              </div>
                            )}

                            {/* Row 1: Name, Date */}
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <User className="h-3 w-3 text-gray-500" />
                                <span className="text-xs font-medium text-gray-900">{einsatz.promotor}</span>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">{einsatz.date}</span>
                              </div>
                            </div>

                            {/* Row 2: Address - positioned at sign height */}
                            <div className={`absolute flex items-center transition-all duration-500 ease-in-out ${
                              isExpanded ? 'top-8 left-3' : 'top-12 left-3'
                            }`}>
                              <div className="flex items-center space-x-1 max-w-[140px]">
                                <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-600 truncate">{einsatz.address.split(',')[0]}</span>
                              </div>
                            </div>

                            {/* Indicators - always absolute for consistent alignment */}
                            <div className={`absolute flex flex-col space-y-0.5 transition-all duration-500 ease-in-out ${
                              isExpanded ? 'top-16 left-3' : 'top-8 left-36'
                            }`}>
                              <div className="flex items-center space-x-1">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-sm ring-2 ring-red-500/30 opacity-50" style={{background: 'linear-gradient(135deg, #FA0C0C, #CD0000)'}} />
                                <span className="text-xs text-gray-500">Pause</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-sm ring-2 ring-red-500/30 opacity-50" style={{background: 'linear-gradient(135deg, #FA0C0C, #CD0000)'}} />
                                <span className="text-xs text-gray-500">Sign</span>
                              </div>
                            </div>

                            {/* Sales info - positioned between dots and time */}
                            {isExpanded && (
                              <div className="absolute left-36 top-16 text-xs flex flex-col items-center space-y-0.5">
                                <div className="text-gray-500 text-center">Sales</div>
                                <div className={`font-semibold ${getSalesColor(einsatz.salesCount)}`}
                                  style={getSalesStyle(getSalesColor(einsatz.salesCount))}
                                >
                                  {einsatz.salesCount.toFixed(1)}
                                </div>
                              </div>
                            )}

                            {/* AI Reasoning Container - appears on expansion */}
                            {isExpanded && (
                              <div className="absolute bottom-3 left-3 right-3 bg-gray-50 border border-gray-200 rounded-lg p-3 transition-opacity duration-[2000ms] ease-in-out" 
                                style={{ opacity: fadedInContainers.has(einsatz.id) ? 1 : 0 }}>
                                <p 
                                  ref={(el) => { aiReasoningRefs.current[einsatz.id] = el; }}
                                  className="text-xs text-gray-700 leading-relaxed h-[40px] overflow-y-auto [&::-webkit-scrollbar]:hidden"
                                >
                                  {typingAnimations[einsatz.id] || ''}
                                  {typingAnimations[einsatz.id] && <span className="animate-pulse">|</span>}
                                </p>
                              </div>
                            )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Verlauf Button - fixed in bottom right outside scrollable area */}
                    <button 
                      className="absolute bottom-3 right-3 px-3 py-1 text-xs text-white rounded-md shadow-md z-30"
                      style={{
                        background: 'linear-gradient(135deg, #FA0C0C, #CD0000)',
                        opacity: 1,
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                      }}
                      onClick={() => setShowLeftVerlauf(prev => !prev)}
                    >
                      {showLeftVerlauf ? 'Validieren' : 'Verlauf'}
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Middle Card - Small with Header and Settings */}
              <Card 
                className={`lg:col-span-1 h-[300px] shadow-lg transition-all duration-200 border-0 lg:mt-24 relative z-20 ${!showDateDropdown ? 'overflow-hidden' : ''}`}
                style={{
                  background: 'linear-gradient(to top right, white, #F0FDF4)', // Using opaque light green instead of transparent rgba
                  ...(isValidating && {
                    animation: 'shadowPulse 2s ease-in-out infinite'
                  })
                }}
              >
                <CardHeader className="pb-3 border-b border-gray-100 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                      >
                        <Cpu className="h-4 w-4 text-white" />
                      </div>
                      <CardTitle className="text-base font-semibold text-gray-900">
                        {isValidating ? 'Willkommen in der Zukunft!' : 'DemoTool Agent'}
                      </CardTitle>
                    </div>
                    {!isValidating && (
                      <button
                        onClick={handleMagicIconClick}
                        className="opacity-40 hover:opacity-60 transition-opacity duration-200"
                      >
                        {isSubmitted ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <IoColorWandOutline className="h-4 w-4 text-gray-600" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Magic Touch Input Box - positioned relative to header */}
                  {showMagicModal && (
                    <>
                      {/* Click outside overlay */}
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMagicModal(false)}
                      />
                      <div className="absolute top-full right-0 mt-2 z-50">
                        <div className="bg-white shadow-lg border-0 w-64 min-h-24 flex flex-col p-3 rounded-lg">
                          <textarea
                            className="w-full min-h-16 px-3 py-2 border-0 focus:outline-none text-sm resize-none bg-white overflow-hidden rounded-lg opacity-60"
                            placeholder="Verzauber deine Validierung..."
                            value={magicText}
                            onChange={(e) => setMagicText(e.target.value)}
                            autoFocus
                            style={{ 
                              height: 'auto',
                              minHeight: '64px',
                              maxHeight: '140px',
                              overflowY: magicText.length > 200 ? 'auto' : 'hidden',
                              caretColor: 'rgba(0, 0, 0, 0.6)'
                            }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = Math.min(target.scrollHeight, 140) + 'px';
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={handleMagicSubmit}
                              disabled={!magicText.trim()}
                              className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all duration-200 text-white ${
                                magicText.trim() ? 'opacity-85' : 'opacity-30'
                              }`}
                              style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                            >
                              Hex, Hex!
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardHeader>

                <CardContent className="p-0 h-full flex flex-col relative">
                  {/* Matrix Animation - behind all content */}
                  {isValidating && (
                    <>
                      <style dangerouslySetInnerHTML={{
                        __html: `
                          @keyframes matrixfall {
                            from {
                              transform: translateY(-100%);
                            }
                            to {
                              transform: translateY(100vh);
                            }
                          }
                          .matrix-column {
                            animation: matrixfall linear infinite;
                          }
                          @keyframes shadowPulse {
                            0%, 100% {
                              box-shadow: -15px 8px 12px rgba(239, 68, 68, 0.08), -8px 8px 12px rgba(220, 85, 85, 0.06), 0px 8px 12px rgba(180, 120, 120, 0.04), 8px 8px 12px rgba(120, 180, 120, 0.04), 15px 8px 12px rgba(34, 197, 94, 0.06), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                            }
                            50% {
                              box-shadow: -24px 8px 12px rgba(239, 68, 68, 0.08), -12px 8px 12px rgba(220, 85, 85, 0.06), 0px 8px 12px rgba(180, 120, 120, 0.04), 12px 8px 12px rgba(120, 180, 120, 0.04), 24px 8px 12px rgba(34, 197, 94, 0.06), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                            }
                          }
                          @keyframes strokePulseRed {
                            0%, 100% {
                              box-shadow: 8px 8px 12px rgba(239, 68, 68, 0.08), 0px 8px 12px rgba(239, 68, 68, 0.06), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                            }
                            50% {
                              box-shadow: 12px 12px 16px rgba(239, 68, 68, 0.12), 0px 12px 16px rgba(239, 68, 68, 0.08), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                            }
                          }
                          @keyframes strokePulseGreen {
                            0%, 100% { box-shadow: -5px 5px 15px -5px rgba(34, 197, 94, 0.2); }
                            50% { box-shadow: -5px 5px 22px -5px rgba(34, 197, 94, 0.35); }
                          }
                          @keyframes iconColorPulse {
                            0%, 100% { color: #16a34a; } /* green-600 */
                            50% { color: #4ade80; } /* green-400 */
                          }
                          @keyframes iconSpinPulse {
                            0% { 
                              color: #16a34a; /* green-600 */
                              transform: rotate(0deg);
                            }
                            25% { 
                              color: #4ade80; /* green-400 */
                              transform: rotate(90deg);
                            }
                            50% { 
                              color: #16a34a; /* green-600 */
                              transform: rotate(180deg);
                            }
                            75% { 
                              color: #4ade80; /* green-400 */
                              transform: rotate(270deg);
                            }
                            100% { 
                              color: #16a34a; /* green-600 */
                              transform: rotate(360deg);
                            }
                          }
                          .icon-pulse {
                            animation: iconColorPulse 2s ease-in-out infinite;
                          }
                          .icon-spin-pulse {
                            animation: iconSpinPulse 2s linear infinite;
                          }
                          @keyframes slideInFromTop {
                            0% { 
                              transform: translateY(-100%);
                              opacity: 0;
                            }
                            100% { 
                              transform: translateY(0);
                              opacity: 1;
                            }
                          }
                          @keyframes fadeOut {
                            0% { opacity: 1; }
                            100% { opacity: 0; }
                          }
                          @keyframes fadeIn {
                            0% { opacity: 0; }
                            100% { opacity: 1; }
                          }
                        `
                      }} />
                      {matrixAnimation}
                    </>
                  )}

                  {/* Spinning Zap Icon - absolutely positioned in center */}
                  {isValidating && (
                    <div className="absolute top-0 left-0 right-0 bottom-28 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-xs text-gray-500 mb-4 h-4 opacity-50">{animatedFeedback}</p>
                      <Zap className="h-11 w-11 text-green-600 icon-spin-pulse" />
                    </div>
                  )}

                  {/* Content Section */}
                  <div className="p-4 flex-1 space-y-4 pb-6 relative z-10">
                    {/* Promotor Selection */}
                    <div className={`space-y-2 transition-all duration-500 ease-in-out ${
                      isValidating ? 'transform -translate-x-full opacity-0' : 'transform translate-x-0 opacity-100'
                    }`}>
                      <label className="text-xs font-medium text-gray-600">Promotoren</label>
                      
                      <button
                        onClick={() => setShowPromotorSelection(true)}
                        disabled={isValidating}
                        className={`w-full px-3 py-2 text-left rounded-lg border border-gray-200 bg-white text-sm transition-all duration-200 hover:border-gray-300 ${
                          selectedPromotors.length > 0
                            ? 'text-gray-900 border-gray-300' 
                            : 'text-gray-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={selectedPromotors.length > 0 ? "opacity-60" : ""}>{getPromotorDisplayText()}</span>
                          <div className="flex items-center space-x-1">
                            {selectedPromotors.length > 0 ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Users className="h-3 w-3 text-gray-400" />
                            )}
                            <ChevronDown className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Calendar Selection */}
                    <div className={`space-y-2 transition-all duration-500 ease-in-out relative ${showDateDropdown ? 'z-30' : ''} ${
                      isValidating ? 'transform translate-x-full opacity-0' : 'transform translate-x-0 opacity-100'
                    }`}>
                      <label className="text-xs font-medium text-gray-600">Validierungszeitraum</label>
                      
                      <div className="relative">
                        <button
                          onClick={() => setShowDateDropdown(!showDateDropdown)}
                          disabled={isValidating}
                          className={`w-full px-3 py-2 text-left rounded-lg border border-gray-200 bg-white text-sm transition-all duration-200 hover:border-gray-300 ${
                            selectedWeeks.length > 0 || dateRange.start
                              ? 'text-gray-900 border-gray-300' 
                              : 'text-gray-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={(selectedWeeks.length > 0 || dateRange.start) ? "opacity-60" : ""}>{getFilterDisplayText()}</span>
                            <div className="flex items-center space-x-1">
                              {(selectedWeeks.length > 0 || dateRange.start) ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Calendar className="h-3 w-3 text-gray-400" />
                              )}
                              <ChevronDown className="h-3 w-3 text-gray-400" />
                            </div>
                          </div>
                        </button>
                        
                        {showDateDropdown && !isValidating && (
                          <div 
                            ref={dateDropdownRef}
                            className="absolute top-full left-0 mt-1 border-0 rounded-lg shadow-lg z-50 w-full bg-white max-h-60 overflow-y-auto"
                            style={{ 
                              scrollbarWidth: 'thin',
                              scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                            }}
                          >
                            {/* View Mode Toggle */}
                            <div className="p-3 border-b border-gray-100">
                              <div className="flex items-center justify-between">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => setDateViewMode('weeks')}
                                    className={`px-2 py-1 rounded text-xs transition-colors ${
                                      dateViewMode === 'weeks' 
                                        ? 'bg-gray-100 text-gray-700' 
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-75'
                                    }`}
                                  >
                                    KWs
                                  </button>
                                  <button
                                    onClick={() => {
                                      // Convert selected weeks to date range when switching to calendar
                                      if (selectedWeeks.length > 0) {
                                        const weekDates = selectedWeeks.map(weekStr => {
                                          const weekNum = parseInt(weekStr.match(/KW (\d+)/)?.[1] || '0');
                                          const currentYear = new Date().getFullYear();
                                          const startDate = new Date(currentYear, 0, 1);
                                          const firstMonday = new Date(startDate);
                                          const dayOfWeek = startDate.getDay();
                                          const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
                                          firstMonday.setDate(startDate.getDate() + daysToAdd);
                                          
                                          const weekStart = new Date(firstMonday);
                                          weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
                                          const weekEnd = new Date(weekStart);
                                          weekEnd.setDate(weekStart.getDate() + 6);
                                          
                                          return {
                                            start: `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`,
                                            end: `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`
                                          };
                                        });
                                        
                                        // Set date range from earliest start to latest end
                                        const allStartDates = weekDates.map(w => w.start).sort();
                                        const allEndDates = weekDates.map(w => w.end).sort();
                                        setDateRange({ 
                                          start: allStartDates[0], 
                                          end: allEndDates[allEndDates.length - 1] 
                                        });
                                        setSelectedWeeks([]);
                                      }
                                      setDateViewMode('calendar');
                                    }}
                                    className={`px-2 py-1 rounded text-xs transition-colors ${
                                      dateViewMode === 'calendar' 
                                        ? 'bg-gray-100 text-gray-700' 
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-75'
                                    }`}
                                  >
                                    Kalender
                                  </button>
                                </div>
                                
                                {/* Clear selection button */}
                                <button
                                  onClick={() => {
                                    setSelectedWeeks([]);
                                    setDateRange({ start: null, end: null });
                                  }}
                                  className="p-1 rounded hover:bg-gray-50 transition-colors opacity-30 hover:opacity-50"
                                >
                                  <X className="h-3 w-3 text-gray-600" />
                                </button>
                              </div>
                            </div>

                            <div className="p-3">
                              {dateViewMode === 'weeks' ? (
                                <div ref={weeksContainerRef} className="space-y-1 max-h-40 overflow-y-auto">
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
                                      className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
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
                                <div className="space-y-2">
                                  {/* Month Header */}
                                  <div className="flex items-center justify-between">
                                    <button
                                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                      className="p-1 rounded hover:bg-gray-50 transition-colors"
                                    >
                                      <ChevronLeft className="h-3 w-3 text-gray-400" />
                                    </button>
                                    <h4 className="text-xs font-medium text-gray-700">
                                      {currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                                    </h4>
                                    <button
                                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                      className="p-1 rounded hover:bg-gray-50 transition-colors"
                                    >
                                      <ChevronRight className="h-3 w-3 text-gray-400" />
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
                                      const isSelected = isStartOrEnd;
                                      
                                      return (
                                        <button
                                          key={index}
                                          onClick={() => {
                                            if (dateStr === dateRange.start || dateStr === dateRange.end) {
                                              setDateRange({ start: null, end: null });
                                            } else if (!dateRange.start) {
                                              setDateRange({ start: dateStr, end: null });
                                            } else if (!dateRange.end) {
                                              setDateRange({ start: dateRange.start, end: dateStr });
                                            } else {
                                              setDateRange({ start: dateStr, end: null });
                                            }
                                          }}
                                          className={`w-6 h-6 text-xs rounded transition-colors ${
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

                    {/* Validation Button */}
                    <div 
                      className="pt-2"
                      style={{ transform: 'translateY(-9px)' }}
                    >
                      <button 
                        onClick={() => {
                          handleValidationToggle();
                          if (!isValidating) {
                            startAIGenerationProcess();
                          } else {
                            stopAIGenerationProcess();
                          }
                        }}
                        className={`w-full text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                          (selectedPromotors.length > 0 && (selectedWeeks.length > 0 || dateRange.start)) ? 'opacity-85' : 'opacity-40'
                        }`}
                        style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                      >
                        {!isValidating ? (
                          <>
                            <Zap className="h-4 w-4" />
                            <span>Validierung starten</span>
                          </>
                        ) : (
                          <span className="flex items-center">
                            Validierung pausieren
                            <span className="ml-0.5 flex space-x-0.5">
                              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                            </span>
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right Card - Bigger */}
              <Card 
                className="lg:col-span-1 h-[500px] shadow-md transition-all duration-200 border-0 bg-white relative z-10"
                style={{
                  ...(isValidating && {
                    animation: 'strokePulseGreen 2s ease-in-out infinite'
                  })
                }}
              >
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center opacity-85"
                        style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                      >
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{showVerlauf ? 'Verlauf' : 'Einsätze validieren'}</h3>
                    </div>

                  </div>
                  <div 
                    className="flex-1 rounded-lg border border-gray-300 shadow-sm relative"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 25%, #f3f4f6 100%)'
                    }}
                  >
                    {/* Fixed Header with Fillup Bar/Indicator */}
                    <div className="absolute top-0 left-0 right-0 z-10">
                      {showVerlauf ? (
                        /* Verlauf Header - Indicator number with download icon */
                        <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                          <div className="text-sm text-gray-500 opacity-60">
                            {validatedColumns.size} validierte Einsätze
                          </div>
                          <button 
                            className="opacity-60 hover:opacity-80 transition-opacity"
                            onClick={() => setShowDownloadModal(true)}
                          >
                            <Download className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Background bar container */}
                          <div className="absolute top-5 left-5 right-5 h-1 rounded-lg overflow-hidden"
                            style={{
                              background: 'linear-gradient(to right, #d1d5db, #f9fafb)',
                              opacity: 0.6
                            }}
                          >
                            {/* Progress bar */}
                            <div 
                              className="h-full rounded-lg"
                              style={{
                                background: 'linear-gradient(135deg, #22C55E, #105F2D)',
                                boxShadow: '0 0 6px 2px rgba(34, 197, 94, 0.5)',
                                width: `${((validatedColumns.size + rejectedColumns.size) / mockEinsaetze.length) * 100}%`,
                                transition: 'width 0.5s ease-in-out',
                                opacity: 0.7
                              }}
                            />
                          </div>
                          
                          {/* Indicator Numbers */}
                          <div className="absolute top-7 left-5 text-[10px] flex space-x-1">
                            <span className="text-green-500 opacity-70">{validatedColumns.size}</span>
                            <span className="text-red-500 opacity-70">{rejectedColumns.size}</span>
                            <span className="text-gray-500 opacity-40">{rightDisplayOrder.length}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Scrollable Content Area */}
                    <div 
                      className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                      }}
                    >
                                            {/* Empty State */}
                      {rightDisplayOrder.filter(id => {
                        const einsatz = mockEinsaetze.find(e => e.id === id);
                        if (!einsatz) return false;
                        return showVerlauf ? validatedColumns.has(id) : (!validatedColumns.has(id) && !rejectedColumns.has(id));
                      }).length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-5 py-12">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500 font-medium mb-1">Alle Einsätze validiert</p>
                          <p className="text-xs text-gray-400">Keine weiteren Validierungen erforderlich</p>
                        </div>
                      )}

                      {/* Right Card Columns */}
                      <div className="px-5 pt-12 pb-6 space-y-3">
                        {/* Unified Column Rendering */}
                        {rightDisplayOrder.filter(id => {
                          const einsatz = mockEinsaetze.find(e => e.id === id);
                          if (!einsatz) return false;
                          // Show all columns that are in display order
                          if (showVerlauf) {
                            return validatedColumns.has(id);
                          } else {
                            return !validatedColumns.has(id) && !rejectedColumns.has(id);
                          }
                        }).map((id, index) => {
                          const einsatz = mockEinsaetze.find(e => e.id === id)!;
                          const isExpanded = expandedColumns.has(einsatz.id);
                          return (
                          <div
                            key={`right-${einsatz.id}`}
                            className={`bg-white border border-gray-300 rounded-lg shadow-md p-3 flex flex-col relative transition-all duration-500 ease-in-out overflow-hidden cursor-pointer ${
                              validatingColumns.has(einsatz.id) 
                                ? 'transform -translate-y-[500%] opacity-0' 
                                : rejectingColumns.has(einsatz.id)
                                ? 'transform -translate-x-[500%] opacity-0'
                                : !showVerlauf && (validatedColumns.has(einsatz.id) || rejectedColumns.has(einsatz.id))
                                ? 'hidden'
                                : 'hover:scale-[1.02]'
                            }`}
                            style={{
                              height: isExpanded ? '200px' : '74px',
                              animation: index === 0 && generatingColumns.has(einsatz.id) && !revealedColumns.has(einsatz.id)
                                ? 'slideInFromTop 0.5s ease-out'
                                : undefined
                            }}
                            onClick={() => handleChevronClick(einsatz.id)}
                          >
                            {/* Conditional Content - Loading Animation or Data */}
                            {generatingColumns.has(einsatz.id) ? (
                              /* Loading Animation */
                              <div 
                                className="absolute inset-0 flex items-center justify-center bg-white"
                                style={{
                                  animation: fadingColumns.has(einsatz.id) ? 'fadeOut 0.5s ease-out forwards' : undefined
                                }}
                              >
                                <div className="flex flex-col items-center space-y-2">
                                  <div className="w-6 h-6 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                                  <span className="text-xs text-gray-500">AI analysiert...</span>
                                </div>
                              </div>
                            ) : null}
                            
                            {/* Data Content - Fades in when revealed */}
                            <div style={{
                              opacity: generatingColumns.has(einsatz.id) ? 0 : 1,
                              animation: revealedColumns.has(einsatz.id) && !generatingColumns.has(einsatz.id) 
                                ? 'fadeIn 0.5s ease-out forwards' 
                                : undefined
                            }}>
                              {/* Hours indicator - slides to right side */}
                          <div className={`absolute flex flex-col items-end transition-all duration-500 ease-in-out ${
                            isExpanded ? 'right-3 top-16' : 'right-16 top-1/2 transform -translate-y-1/2'
                          }`}>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-600">{einsatz.hoursWorked}h</span>
                            </div>
                            {isExpanded && (
                              <span className="text-xs text-gray-500 mt-1">{einsatz.timespan}</span>
                            )}
                          </div>

                          {/* Validation Buttons */}
                          {showVerlauf ? (
                            <div className="absolute right-3" style={{top: '30px'}}>
                              <div className="p-0.5 rounded bg-green-100 border border-green-200">
                                <Check className="text-green-600" style={{width: '11.4px', height: '11.4px'}} />
                              </div>
                            </div>
                          ) : (
                            <div className="absolute top-3 right-3 flex flex-col space-y-2">
                              <button 
                                className="p-0.5 rounded bg-green-100 hover:bg-green-200 transition-colors border border-green-200"
                                onClick={(e) => { e.stopPropagation(); handleValidateColumn(einsatz.id); }}
                              >
                                <Check className="text-green-600" style={{width: '11.4px', height: '11.4px'}} />
                              </button>
                              <button 
                                className="p-0.5 rounded bg-red-100 hover:bg-red-200 transition-colors border border-red-200"
                                onClick={(e) => { e.stopPropagation(); handleRejectColumn(einsatz.id); }}
                              >
                                <X className="text-red-500" style={{width: '11.4px', height: '11.4px'}} />
                              </button>
                            </div>
                          )}

                          {/* Row 1: Name, Date */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <User className="h-3 w-3 text-gray-500" />
                              <span className="text-xs font-medium text-gray-900">{einsatz.promotor}</span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">{einsatz.date}</span>
                            </div>
                          </div>



                          {/* Row 2: Address - positioned at sign height */}
                          <div className={`absolute flex items-center transition-all duration-500 ease-in-out ${
                            isExpanded ? 'top-8 left-3' : 'top-12 left-3'
                          }`}>
                            <div className="flex items-center space-x-1 max-w-[140px]">
                              <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-600 truncate">{einsatz.address.split(',')[0]}</span>
                            </div>
                          </div>

                          {/* Indicators - always absolute for consistent alignment */}
                          <div className={`absolute flex flex-col space-y-0.5 transition-all duration-500 ease-in-out ${
                            isExpanded ? 'top-16 left-3' : 'top-8 left-36'
                          }`}>
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-sm ring-2 ring-emerald-500/30 opacity-50" style={{background: 'linear-gradient(135deg, #22C55E, #16A34A)'}} />
                              <span className="text-xs text-gray-500">Pause</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-sm ring-2 ring-emerald-500/30 opacity-50" style={{background: 'linear-gradient(135deg, #22C55E, #16A34A)'}} />
                              <span className="text-xs text-gray-500">Sign</span>
                            </div>
                          </div>

                          {/* Sales info - positioned between dots and time */}
                          {isExpanded && (
                            <div className="absolute left-36 top-16 text-xs flex flex-col items-center space-y-0.5">
                              <div className="text-gray-500">Sales</div>
                              <div className={`font-semibold ${getSalesColor(einsatz.salesCount)}`}
                                style={getSalesStyle(getSalesColor(einsatz.salesCount))}
                              >
                                {einsatz.salesCount.toFixed(1)}
                              </div>
                            </div>
                          )}

                          {/* AI Reasoning Container - appears on expansion */}
                          {isExpanded && (
                            <div className="absolute bottom-3 left-3 right-3 bg-gray-50 border border-gray-200 rounded-lg p-3 transition-opacity duration-[2000ms] ease-in-out" 
                              style={{ opacity: fadedInContainers.has(einsatz.id) ? 1 : 0 }}>
                              <p 
                                ref={(el) => { aiReasoningRefs.current[einsatz.id] = el; }}
                                className="text-xs text-gray-700 leading-relaxed h-[40px] overflow-y-auto [&::-webkit-scrollbar]:hidden"
                              >
                                {typingAnimations[einsatz.id] || ''}
                                {typingAnimations[einsatz.id] && <span className="animate-pulse">|</span>}
                              </p>
                            </div>
                          )}
                            </div>
                        </div>
                          );
                        })}
                    </div>
                  </div>
                  
                  {/* Verlauf Button - fixed in bottom right outside scrollable area */}
                                    <button 
                    className="absolute bottom-3 right-3 px-3 py-1 text-xs text-white rounded-md shadow-md z-30"
                    style={{
                      background: 'linear-gradient(135deg, #22C55E, #105F2D)',
                      opacity: 1,
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                    }}
                    onClick={() => setShowVerlauf(prev => !prev)}
                  >
                    {showVerlauf ? 'Validieren' : 'Verlauf'}
                  </button>
                  </div>
                </CardContent>
              </Card>

            </div>
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
              className="p-6 flex flex-col h-[400px]" 
            >
              <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {allPromotors
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

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Excel Export</h3>
                <button 
                  onClick={() => {
                    setShowDownloadModal(false);
                    // Reset download modal state
                    setDownloadAllTime(false);
                    setDownloadSelectedWeeks([]);
                    setDownloadDateRange({ start: null, end: null });
                    setDownloadDateViewMode('weeks');
                  }}
                  className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Validierungszeitraum</label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="timeframe" 
                        checked={downloadAllTime}
                        onChange={() => setDownloadAllTime(true)}
                        className="text-green-600"
                      />
                      <span className="text-sm text-gray-700">Alle Zeiten</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="timeframe" 
                        checked={!downloadAllTime}
                        onChange={() => setDownloadAllTime(false)}
                        className="text-green-600"
                      />
                      <span className="text-sm text-gray-700">Bestimmter Zeitraum</span>
                    </label>
                  </div>
                </div>
                
                {!downloadAllTime && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Datum auswählen</label>
                    <div className="mt-2 border border-gray-300 rounded-lg bg-white max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                      {/* View Mode Toggle */}
                      <div className="p-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setDownloadDateViewMode('weeks')}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                downloadDateViewMode === 'weeks' 
                                  ? 'bg-gray-100 text-gray-700' 
                                  : 'bg-gray-50 text-gray-500 hover:bg-gray-75'
                              }`}
                            >
                              KWs
                            </button>
                            <button
                              onClick={() => {
                                // Convert selected weeks to date range when switching to calendar
                                if (downloadSelectedWeeks.length > 0) {
                                  const weekDates = downloadSelectedWeeks.map(weekStr => {
                                    const weekNum = parseInt(weekStr.match(/KW (\d+)/)?.[1] || '0');
                                    const currentYear = new Date().getFullYear();
                                    const startDate = new Date(currentYear, 0, 1);
                                    const firstMonday = new Date(startDate);
                                    const dayOfWeek = startDate.getDay();
                                    const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
                                    firstMonday.setDate(startDate.getDate() + daysToAdd);
                                    
                                    const weekStart = new Date(firstMonday);
                                    weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
                                    const weekEnd = new Date(weekStart);
                                    weekEnd.setDate(weekStart.getDate() + 6);
                                    
                                    return {
                                      start: `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`,
                                      end: `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`
                                    };
                                  });
                                  
                                  const allStartDates = weekDates.map(w => w.start).sort();
                                  const allEndDates = weekDates.map(w => w.end).sort();
                                  setDownloadDateRange({ 
                                    start: allStartDates[0], 
                                    end: allEndDates[allEndDates.length - 1] 
                                  });
                                  setDownloadSelectedWeeks([]);
                                }
                                setDownloadDateViewMode('calendar');
                              }}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                downloadDateViewMode === 'calendar' 
                                  ? 'bg-gray-100 text-gray-700' 
                                  : 'bg-gray-50 text-gray-500 hover:bg-gray-75'
                              }`}
                            >
                              Kalender
                            </button>
                          </div>
                          
                          {/* Clear selection button */}
                          <button
                            onClick={() => {
                              setDownloadSelectedWeeks([]);
                              setDownloadDateRange({ start: null, end: null });
                            }}
                            className="p-1 rounded hover:bg-gray-50 transition-colors opacity-30 hover:opacity-50"
                          >
                            <X className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3">
                        {downloadDateViewMode === 'weeks' ? (
                          <div className="space-y-1 max-h-40 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                            {generateDownloadCalendarWeeks().map((week) => (
                              <button
                                key={week}
                                onClick={() => {
                                  setDownloadSelectedWeeks(prev => 
                                    prev.includes(week) 
                                      ? prev.filter(w => w !== week)
                                      : [...prev, week]
                                  );
                                }}
                                className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                                  downloadSelectedWeeks.includes(week)
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'hover:bg-gray-50 text-gray-600'
                                }`}
                              >
                                {week}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Month Header */}
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => setDownloadCurrentMonth(new Date(downloadCurrentMonth.getFullYear(), downloadCurrentMonth.getMonth() - 1))}
                                className="p-1 rounded hover:bg-gray-50 transition-colors"
                              >
                                <ChevronLeft className="h-3 w-3 text-gray-400" />
                              </button>
                              <h4 className="text-xs font-medium text-gray-700">
                                {downloadCurrentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                              </h4>
                              <button
                                onClick={() => setDownloadCurrentMonth(new Date(downloadCurrentMonth.getFullYear(), downloadCurrentMonth.getMonth() + 1))}
                                className="p-1 rounded hover:bg-gray-50 transition-colors"
                              >
                                <ChevronRight className="h-3 w-3 text-gray-400" />
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
                              {generateDownloadCalendarDays().map((date, index) => {
                                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                const isCurrentMonth = date.getMonth() === downloadCurrentMonth.getMonth();
                                const today = new Date();
                                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                const isToday = dateStr === todayStr;
                                const allRangeDates = getDownloadAllRangeDates();
                                const isStartOrEnd = dateStr === downloadDateRange.start || dateStr === downloadDateRange.end;
                                const isInRange = allRangeDates.includes(dateStr) && !isStartOrEnd;
                                const isSelected = isStartOrEnd;
                                
                                return (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      if (dateStr === downloadDateRange.start || dateStr === downloadDateRange.end) {
                                        setDownloadDateRange({ start: null, end: null });
                                      } else if (!downloadDateRange.start) {
                                        setDownloadDateRange({ start: dateStr, end: null });
                                      } else if (!downloadDateRange.end) {
                                        setDownloadDateRange({ start: downloadDateRange.start, end: dateStr });
                                      } else {
                                        setDownloadDateRange({ start: dateStr, end: null });
                                      }
                                    }}
                                    className={`w-6 h-6 text-xs rounded transition-colors ${
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
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => {
                      handleExcelDownload();
                      setShowDownloadModal(false);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                    style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                  >
                    Excel herunterladen
                  </button>
                  <button
                    onClick={() => {
                      setShowDownloadModal(false);
                      // Reset download modal state
                      setDownloadAllTime(false);
                      setDownloadSelectedWeeks([]);
                      setDownloadDateRange({ start: null, end: null });
                      setDownloadDateViewMode('weeks');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
              )}

      {/* Left Card Download Modal */}
      {showLeftDownloadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Excel Export</h3>
                <button 
                  onClick={() => {
                    setShowLeftDownloadModal(false);
                    // Reset download modal state
                    setLeftDownloadAllTime(false);
                    setLeftDownloadSelectedWeeks([]);
                    setLeftDownloadDateRange({ start: null, end: null });
                    setLeftDownloadDateViewMode('weeks');
                  }}
                  className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Validierungszeitraum</label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="leftTimeframe" 
                        checked={leftDownloadAllTime}
                        onChange={() => setLeftDownloadAllTime(true)}
                        className="text-red-600"
                      />
                      <span className="text-sm text-gray-700">Alle Zeiten</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="leftTimeframe" 
                        checked={!leftDownloadAllTime}
                        onChange={() => setLeftDownloadAllTime(false)}
                        className="text-red-600"
                      />
                      <span className="text-sm text-gray-700">Bestimmter Zeitraum</span>
                    </label>
                  </div>
                </div>
                
                {!leftDownloadAllTime && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Datum auswählen</label>
                    <div className="mt-2 border border-gray-300 rounded-lg bg-white max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                      {/* View Mode Toggle */}
                      <div className="p-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setLeftDownloadDateViewMode('weeks')}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                leftDownloadDateViewMode === 'weeks' 
                                  ? 'bg-gray-100 text-gray-700' 
                                  : 'bg-gray-50 text-gray-500 hover:bg-gray-75'
                              }`}
                            >
                              KWs
                            </button>
                            <button
                              onClick={() => {
                                // Convert selected weeks to date range when switching to calendar
                                if (leftDownloadSelectedWeeks.length > 0) {
                                  const weekDates = leftDownloadSelectedWeeks.map(weekStr => {
                                    const weekNum = parseInt(weekStr.match(/KW (\d+)/)?.[1] || '0');
                                    const currentYear = new Date().getFullYear();
                                    const startDate = new Date(currentYear, 0, 1);
                                    const firstMonday = new Date(startDate);
                                    const dayOfWeek = startDate.getDay();
                                    const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
                                    firstMonday.setDate(startDate.getDate() + daysToAdd);
                                    
                                    const weekStart = new Date(firstMonday);
                                    weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
                                    const weekEnd = new Date(weekStart);
                                    weekEnd.setDate(weekStart.getDate() + 6);
                                    
                                    return {
                                      start: `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`,
                                      end: `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`
                                    };
                                  });
                                  
                                  const allStartDates = weekDates.map(w => w.start).sort();
                                  const allEndDates = weekDates.map(w => w.end).sort();
                                  setLeftDownloadDateRange({ 
                                    start: allStartDates[0], 
                                    end: allEndDates[allEndDates.length - 1] 
                                  });
                                  setLeftDownloadSelectedWeeks([]);
                                }
                                setLeftDownloadDateViewMode('calendar');
                              }}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                leftDownloadDateViewMode === 'calendar' 
                                  ? 'bg-gray-100 text-gray-700' 
                                  : 'bg-gray-50 text-gray-500 hover:bg-gray-75'
                              }`}
                            >
                              Kalender
                            </button>
                          </div>
                          
                          {/* Clear selection button */}
                          <button
                            onClick={() => {
                              setLeftDownloadSelectedWeeks([]);
                              setLeftDownloadDateRange({ start: null, end: null });
                            }}
                            className="p-1 rounded hover:bg-gray-50 transition-colors opacity-30 hover:opacity-50"
                          >
                            <X className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3">
                        {leftDownloadDateViewMode === 'weeks' ? (
                          <div className="space-y-1 max-h-40 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                            {generateLeftCalendarWeeks().map((week) => (
                              <button
                                key={week}
                                onClick={() => {
                                  setLeftDownloadSelectedWeeks(prev => 
                                    prev.includes(week) 
                                      ? prev.filter(w => w !== week)
                                      : [...prev, week]
                                  );
                                }}
                                className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                                  leftDownloadSelectedWeeks.includes(week)
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'hover:bg-gray-50 text-gray-600'
                                }`}
                              >
                                {week}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Month Header */}
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => setLeftDownloadCurrentMonth(new Date(leftDownloadCurrentMonth.getFullYear(), leftDownloadCurrentMonth.getMonth() - 1))}
                                className="p-1 rounded hover:bg-gray-50 transition-colors"
                              >
                                <ChevronLeft className="h-3 w-3 text-gray-400" />
                              </button>
                              <h4 className="text-xs font-medium text-gray-700">
                                {leftDownloadCurrentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                              </h4>
                              <button
                                onClick={() => setLeftDownloadCurrentMonth(new Date(leftDownloadCurrentMonth.getFullYear(), leftDownloadCurrentMonth.getMonth() + 1))}
                                className="p-1 rounded hover:bg-gray-50 transition-colors"
                              >
                                <ChevronRight className="h-3 w-3 text-gray-400" />
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
                              {generateLeftCalendarDays().map((date, index) => {
                                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                const isCurrentMonth = date.getMonth() === leftDownloadCurrentMonth.getMonth();
                                const today = new Date();
                                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                const isToday = dateStr === todayStr;
                                const allRangeDates = getLeftAllRangeDates();
                                const isStartOrEnd = dateStr === leftDownloadDateRange.start || dateStr === leftDownloadDateRange.end;
                                const isInRange = allRangeDates.includes(dateStr) && !isStartOrEnd;
                                const isSelected = isStartOrEnd;
                                
                                return (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      if (dateStr === leftDownloadDateRange.start || dateStr === leftDownloadDateRange.end) {
                                        setLeftDownloadDateRange({ start: null, end: null });
                                      } else if (!leftDownloadDateRange.start) {
                                        setLeftDownloadDateRange({ start: dateStr, end: null });
                                      } else if (!leftDownloadDateRange.end) {
                                        setLeftDownloadDateRange({ start: leftDownloadDateRange.start, end: dateStr });
                                      } else {
                                        setLeftDownloadDateRange({ start: dateStr, end: null });
                                      }
                                    }}
                                    className={`w-6 h-6 text-xs rounded transition-colors ${
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
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => {
                      handleLeftExcelDownload();
                      setShowLeftDownloadModal(false);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                    style={{background: 'linear-gradient(135deg, #FA0C0C, #CD0000)'}}
                  >
                    Excel herunterladen
                  </button>
                  <button
                    onClick={() => {
                      setShowLeftDownloadModal(false);
                      // Reset download modal state
                      setLeftDownloadAllTime(false);
                      setLeftDownloadSelectedWeeks([]);
                      setLeftDownloadDateRange({ start: null, end: null });
                      setLeftDownloadDateViewMode('weeks');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Eddie KI Assistant */}
      <AdminEddieAssistant />
    </div>
  );
} 