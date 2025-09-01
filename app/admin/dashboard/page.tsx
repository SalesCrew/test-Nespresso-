"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  Trophy,
  MessageCircle,
  UserPlus,
  CheckSquare,
  Check,
  Wand2,
  Sparkles,
  Edit3,
  ChevronDown,
  ChevronUp,
  Trash2,

} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import AdminNavigation from "@/components/AdminNavigation";
import AdminEddieAssistant from "@/components/AdminEddieAssistant";

 export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
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
  const [showActivePromotorenModal, setShowActivePromotorenModal] = useState(false);
  const [activePromotorenSearch, setActivePromotorenSearch] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [showKpiView, setShowKpiView] = useState(true); // true for CA KPIs, false for Mystery Shop
  const [isEinsaetzeExpanded, setIsEinsaetzeExpanded] = useState(false);
  const textContainerRef = useRef<HTMLDivElement>(null);
  
  // KPI Popup state
  const [showKpiPopup, setShowKpiPopup] = useState(false);
  const [kpiPopupActiveTab, setKpiPopupActiveTab] = useState<"ca-kpis" | "mystery-shop">("ca-kpis");
  
  // Promotor Selection states
  const [showPromotorSelection, setShowPromotorSelection] = useState(false);
  const [selectedPromotors, setSelectedPromotors] = useState<string[]>([]);
  const [activeRegionFilter, setActiveRegionFilter] = useState<string>("all");
  const [promotorSelectionSearch, setPromotorSelectionSearch] = useState("");
  const [lastSelectedByIcon, setLastSelectedByIcon] = useState<string[]>([]);
  
  // Message enhancement states
  const [messageText, setMessageText] = useState("");
  const [enableTwoStep, setEnableTwoStep] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  // Real promotors data
  const [allPromotors, setAllPromotors] = useState<any[]>([]);
  
  // Load promotors on component mount (same as einsatzplan)
  useEffect(() => {
    const loadPromotors = async () => {
      try {
        const res = await fetch('/api/promotors', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.promotors) ? data.promotors.map((p: any) => ({ 
          id: p.id, 
          name: p.name, 
          region: p.region || 'wien-noe-bgl' // Use actual region from API
        })) : [];
        console.log('✅ Loaded promotors for admin dashboard:', list.length, 'promotors');
        console.log('✅ First promotor:', list[0]);
        setAllPromotors(list);
      } catch (error) {
        console.error('Error loading promotors:', error);
        setAllPromotors([]);
      }
    };
    
    loadPromotors();
  }, []);
  
  // Scheduling states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduledMessages, setScheduledMessages] = useState(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const getNextWeekday = (day: number) => {
      const date = new Date(today);
      const diff = (day + 7 - date.getDay()) % 7;
      date.setDate(date.getDate() + (diff === 0 ? 7 : diff));
      return date;
    };
    
    return [
      { id: 1, preview: "Wichtiger Termin morgen um 9:00 Uhr...", fullText: "Wichtiger Termin morgen um 9:00 Uhr in der Zentrale. Bitte pünktlich erscheinen.", time: "09:00", date: "Morgen", dateISO: tomorrow.toISOString().split('T')[0], recipients: "Alle", promotors: ["Sarah Schmidt", "Michael Weber", "Jan Müller"] },
      { id: 2, preview: "Neue Produktschulung verfügbar...", fullText: "Neue Produktschulung verfügbar für alle Mitarbeiter. Online-Zugang ist freigeschaltet.", time: "14:30", date: "Heute", dateISO: today.toISOString().split('T')[0], recipients: "5 Promotoren", promotors: ["Lisa König", "Anna Bauer", "Tom Fischer", "Maria Huber", "David Klein"] },
      { id: 3, preview: "Bitte Arbeitszeiten bestätigen...", fullText: "Bitte Arbeitszeiten für diese Woche bis Freitag bestätigen.", time: "16:00", date: "Freitag", dateISO: getNextWeekday(5).toISOString().split('T')[0], recipients: "Region Nord", promotors: ["Emma Wagner", "Paul Berger"] },
      { id: 4, preview: "Verkaufszahlen für diese Woche...", fullText: "Verkaufszahlen für diese Woche sind sehr gut ausgefallen.", time: "10:00", date: "Montag", dateISO: getNextWeekday(1).toISOString().split('T')[0], recipients: "Team Leads", promotors: ["Julia Mayer", "Felix Gruber", "Sophie Reiter"] },
      { id: 5, preview: "Neue Sicherheitsrichtlinien beachten...", fullText: "Neue Sicherheitsrichtlinien beachten und umsetzen.", time: "13:00", date: "Dienstag", dateISO: getNextWeekday(2).toISOString().split('T')[0], recipients: "Alle", promotors: ["Max Köhler", "Lena Fuchs", "Klaus Müller", "Sandra Hofer"] },
      { id: 6, preview: "Monatliche Teambesprech­ung...", fullText: "Monatliche Teambesprechung findet wie geplant statt.", time: "15:30", date: "Mittwoch", dateISO: getNextWeekday(3).toISOString().split('T')[0], recipients: "8 Promotoren", promotors: ["Martin Schneider", "Nina Weiss", "Patrick Schwarz", "Andrea Roth", "Florian Braun", "Jessica Grün", "Daniel Gelb", "Sabrina Blau"] }
    ];
  });

  // Toggle state for scheduled messages vs history
  const [showHistory, setShowHistory] = useState(false);

  // History data for sent messages (both scheduled and instant)
  const [messageHistory] = useState([
    { id: 101, preview: "Erinnerung: Teammeeting heute um 14:00...", fullText: "Erinnerung: Teammeeting heute um 14:00 in der Zentrale. Agenda wurde per E-Mail versendet.", time: "08:30", date: "23. Nov 2024", recipients: "Alle", promotors: ["Sarah Schmidt", "Michael Weber"], readBy: ["Sarah Schmidt"], sent: true, type: "scheduled" },
    { id: 102, preview: "Neue Produktinformationen verfügbar...", fullText: "Neue Produktinformationen verfügbar im Portal. Bitte bis Ende der Woche durcharbeiten.", time: "12:15", date: "22. Nov 2024", recipients: "8 Promotoren", promotors: ["Lisa König", "Anna Bauer", "Tom Fischer"], readBy: ["Lisa König", "Tom Fischer"], sent: true, type: "instant" },
    { id: 103, preview: "Wichtige Änderung der Arbeitszeiten...", fullText: "Wichtige Änderung der Arbeitszeiten ab nächster Woche. Details in der separaten E-Mail.", time: "16:45", date: "21. Nov 2024", recipients: "Region Süd", promotors: ["Maria Huber", "David Klein"], readBy: [], sent: true, type: "scheduled" },
    { id: 104, preview: "Verkaufszahlen übertroffen - Gratulation...", fullText: "Verkaufszahlen übertroffen - Gratulation an das gesamte Team für die hervorragende Leistung diese Woche!", time: "17:20", date: "20. Nov 2024", recipients: "Alle", promotors: ["Emma Wagner", "Paul Berger", "Julia Mayer"], readBy: ["Julia Mayer"], sent: true, type: "instant" },
    { id: 105, preview: "Schulung nächste Woche verschoben...", fullText: "Schulung nächste Woche verschoben auf Donnerstag. Neue Einladung folgt.", time: "09:10", date: "19. Nov 2024", recipients: "5 Promotoren", promotors: ["Felix Gruber", "Sophie Reiter"], readBy: ["Felix Gruber", "Sophie Reiter"], sent: true, type: "scheduled" },
    { id: 106, preview: "Notfall: Einsatz in Wien abgesagt...", fullText: "Notfall: Einsatz in Wien abgesagt wegen technischer Probleme. Ersatztermin wird bekannt gegeben.", time: "11:30", date: "18. Nov 2024", recipients: "Wien Team", promotors: ["Max Köhler"], readBy: [], sent: true, type: "instant" }
  ]);
  
  // Message detail popup states
  const [showMessageDetail, setShowMessageDetail] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [editedMessageText, setEditedMessageText] = useState("");
  const [editedDate, setEditedDate] = useState("");
  const [editedTime, setEditedTime] = useState("");
  
  // Delete confirmation states
  const [deleteConfirmationState, setDeleteConfirmationState] = useState(false);
  const [deleteConfirmationTimer, setDeleteConfirmationTimer] = useState<NodeJS.Timeout | null>(null);

  // Function to select all filtered promotors
  const selectAllFiltered = () => {
    // Use real promotors data from state instead of hardcoded array
         const filteredNames = allPromotors
       .filter(promotor => 
         (activeRegionFilter === "all" || promotor.region === activeRegionFilter) &&
         promotor.name.toLowerCase().includes(promotorSelectionSearch.toLowerCase())
       )
       .map(promotor => promotor.name);
     
     // Check if we should deselect (if all filtered items are currently selected and match last selection)
     const allFilteredSelected = filteredNames.every(name => selectedPromotors.includes(name));
     const matchesLastSelection = lastSelectedByIcon.length > 0 && 
       filteredNames.every(name => lastSelectedByIcon.includes(name)) &&
       lastSelectedByIcon.every(name => filteredNames.includes(name));
     
     if (allFilteredSelected && matchesLastSelection) {
       // Deselect the ones that were selected by this icon
       setSelectedPromotors(prev => prev.filter(name => !lastSelectedByIcon.includes(name)));
       setLastSelectedByIcon([]);
     } else {
       // Select all filtered
       setSelectedPromotors(prev => [...new Set([...prev, ...filteredNames])]);
       setLastSelectedByIcon(filteredNames);
     }
      };

  // Function to enhance message with AI
  const enhanceMessage = async () => {
    if (!messageText.trim() || isEnhancing) return;
    
    setIsEnhancing(true);
    
    try {
      // Simulate API call to ChatGPT for text enhancement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock enhanced text (in real implementation, this would be the ChatGPT response)
      const enhancedText = messageText
        .replace(/\s+/g, ' ')
        .trim()
        .split('. ')
        .map(sentence => sentence.charAt(0).toUpperCase() + sentence.slice(1))
        .join('. ');
      
      setMessageText(enhancedText);
    } catch (error) {
      console.error('Error enhancing text:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Function to handle message scheduling
  const handleScheduleMessage = async () => {
    if (!messageText.trim() || !scheduleDate || !scheduleTime || selectedPromotors.length === 0) return;
    
    try {
      // Get promotor IDs from selected names
      const promotorIds = selectedPromotors.map(name => {
        const promotor = allPromotors.find(p => p.name === name);
        return promotor?.id;
      }).filter(Boolean);
      
      // Combine date and time for scheduled send
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_text: messageText,
          message_type: enableTwoStep ? 'confirmation_required' : 'normal',
          recipient_ids: promotorIds,
          scheduled_send_time: scheduledDateTime,
          send_immediately: false
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Create display object for local state (keep existing UI working)
        const newMessage = {
          id: result.message.id,
          preview: messageText.substring(0, 50) + (messageText.length > 50 ? "..." : ""),
          fullText: messageText,
          time: scheduleTime,
          date: new Date(scheduleDate).toLocaleDateString('de-DE', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'short' 
          }),
          dateISO: scheduleDate,
          recipients: selectedPromotors.length === 1 
            ? selectedPromotors[0] 
            : `${selectedPromotors.length} Promotoren`,
          promotors: [...selectedPromotors]
        };
        
        // Add to scheduled messages
        setScheduledMessages(prev => [...prev, newMessage]);
        
        // Reset form
        setMessageText("");
        setScheduleDate("");
        setScheduleTime("");
        setSelectedPromotors([]);
        setEnableTwoStep(false);
        setShowScheduleModal(false);
        
        console.log('Message scheduled successfully');
      } else {
        console.error('Failed to schedule message');
      }
    } catch (error) {
      console.error('Error scheduling message:', error);
    }
  };

  // Function to handle message detail view
  const handleMessageClick = (message: any) => {
    setSelectedMessage(message);
    setEditedMessageText(message.fullText);
    setEditedDate(message.dateISO || message.date); // Use ISO date for editing
    setEditedTime(message.time);
    setIsEditingMessage(false);
    setShowMessageDetail(true);
  };

  // Function to save edited message
  const handleSaveMessage = () => {
    if (!selectedMessage || !editedMessageText.trim()) return;
    
    setScheduledMessages(prev => 
      prev.map(msg => 
        msg.id === selectedMessage.id 
          ? { 
              ...msg, 
              fullText: editedMessageText,
              preview: editedMessageText.substring(0, 50) + (editedMessageText.length > 50 ? "..." : ""),
              date: new Date(editedDate).toLocaleDateString('de-DE', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'short' 
              }),
              dateISO: editedDate,
              time: editedTime
            }
          : msg
      )
    );
    
    setIsEditingMessage(false);
  };

  // Function to delete scheduled message
  const handleDeleteScheduledMessage = (messageId: number) => {
    setScheduledMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  // Function to handle delete button click in message detail popup
  const handleDeleteClick = () => {
    if (!deleteConfirmationState) {
      // First click - vibrate and start timer
      setDeleteConfirmationState(true);
      
      // Clear any existing timer
      if (deleteConfirmationTimer) {
        clearTimeout(deleteConfirmationTimer);
      }
      
      // Set timer to reset confirmation state after 2 seconds
      const timer = setTimeout(() => {
        setDeleteConfirmationState(false);
        setDeleteConfirmationTimer(null);
      }, 2000);
      
      setDeleteConfirmationTimer(timer);
    } else {
      // Second click within 2 seconds - actually delete
      if (selectedMessage && !selectedMessage.sent) {
        handleDeleteScheduledMessage(selectedMessage.id);
        setShowMessageDetail(false);
        setDeleteConfirmationState(false);
        if (deleteConfirmationTimer) {
          clearTimeout(deleteConfirmationTimer);
          setDeleteConfirmationTimer(null);
        }
      }
    }
  };
  
  // Region gradient helper
  const getRegionGradient = (region: string) => {
    // Pastel, clean, modern shades per cluster
    switch (region) {
      case "wien-noe-bgl":
        return "bg-[#E8F0FE]"; // pastel blue
      case "steiermark":
        return "bg-[#E7F5ED]"; // pastel green
      case "salzburg":
        return "bg-[#F0E9FF]"; // pastel indigo/lavender
      case "oberoesterreich":
        return "bg-[#FFF3E6]"; // pastel orange
      case "tirol":
        return "bg-[#FDEBF3]"; // pastel pink
      case "vorarlberg":
        return "bg-[#EAF8FF]"; // pastel cyan
      case "kaernten":
        return "bg-[#EAF6FF]"; // soft sky
      default:
        return "bg-gray-50";
    }
  };

  // Region border helper
  const getRegionBorder = (region: string) => {
    // Matching soft borders per cluster
    switch (region) {
      case "wien-noe-bgl":
        return "border-[#CBD7F5]";
      case "steiermark":
        return "border-[#CFECDD]";
      case "salzburg":
        return "border-[#DDD4FF]";
      case "oberoesterreich":
        return "border-[#FFE3C7]";
      case "tirol":
        return "border-[#F8D5E5]";
      case "vorarlberg":
        return "border-[#CFEFFF]";
      case "kaernten":
        return "border-[#D6ECFF]";
      default:
        return "border-gray-200";
    }
  };

  // Get promotor region
  const getPromotorRegion = (promotorName: string) => {
    // Use real promotors data from state
    const promotor = allPromotors.find(p => p.name === promotorName);
    return promotor?.region || "wien-noe-bgl"; // Default region
  };
  
  // This function is now replaced by the above, removing the hardcoded array
  const getPromotorRegionOld = (promotorName: string) => {
    const oldAllPromotors = [
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
    
    const promotor = allPromotors.find(p => p.name === promotorName);
    return promotor?.region || "default";
  };

  // Get region pill colors - matching promotor selection popup styling
  const getRegionPillColors = (region: string) => {
    return `${getRegionGradient(region)} ${getRegionBorder(region)} text-gray-700`;
  };
  




  // Helper functions for CA KPI colors (same rules as in statistics page)
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

  const getPillColorKpi = (changePercent: string) => {
    // For CA KPIs, being above optimal is good, so positive = green, negative = red
    const isPositive = changePercent.startsWith('+');
    return isPositive 
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  // Mystery Shop data - use all-time average
  const mysteryShopData = {
    value: 88.7, // All-time average from mysteryShopStatsData
    change: "+3.1%" // All-time change from mysteryShopStatsData
  };

  // Helper function for Mystery Shop colors (same rules as in statistics page)
  const getMysteryShopColor = (value: number) => {
    if (value >= 95) return "custom-gold"; // 95-100%: Gold/shiny (100€ premium)
    if (value >= 90) return "text-green-600"; // 90-94%: Green (50€ premium)
    if (value >= 80) return "text-[#FD7E14]"; // 80-89%: Orange (no premium)
    return "text-red-600"; // <80%: Red (bad result)
  };

  const getMysteryShopStyle = (colorClass: string) => {
    if (colorClass === "custom-gold") {
      return {
        background: 'linear-gradient(to right, #E0AA3E, #F0D96A, #E0AA3E)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      };
    }
    return {};
  };

  const getPillColorMystery = (changePercent: string) => {
    const isPositive = changePercent.startsWith('+');
    return isPositive 
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  // Generate mock history data for CA KPIs (similar to statistics page)
  const [historyData] = useState(() => {
    const data = []
    const today = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today)
      date.setMonth(today.getMonth() - i)
      
      // Generate random values within appropriate ranges
      const mcet = (3.6 + Math.random() * 1.5).toFixed(1)
      const tma = (60 + Math.random() * 25).toFixed(0)
      const vl = (5 + Math.random() * 20).toFixed(0)
      
      data.push({
        date,
        mcet: parseFloat(mcet),
        tma: parseInt(tma),
        vl: parseInt(vl),
        month: date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })
      })
    }
    
    return data.reverse() // Show oldest to newest for chart
  })

  // Calculate CA KPI statistics (similar to statistics page)
  const calculateMysteryShopStatsData = () => {
    // Mock Mystery Shop data with realistic percentages and change indicators
    const baseData = {
      "30days": { value: 91.2, changePercent: "+2.8%" },
      "6months": { value: 89.5, changePercent: "+1.2%" },
      "alltime": { value: 88.7, changePercent: "+3.1%" }
    };

    return baseData;
  };

  const mysteryShopStatsData = calculateMysteryShopStatsData();

  // CA KPI data - all-time averages with difference from optimal values
  const companyKpis = {
    mcet: { value: 4.3, changePercent: "-0.2" }, // 4.3 vs optimal 4.5 = -0.2 (better = green)
    tma: { value: 72.1, changePercent: "-2.9" }, // 72.1 vs optimal 75 = -2.9 (worse = red)  
    vlShare: { value: 12.8, changePercent: "+2.8" } // 12.8 vs optimal 10 = +2.8 (better = green)
  };

  const mysteryShopHistoryData = [
    { shop: "Mysteryshop 1", percentage: 85.2 },
    { shop: "Mysteryshop 2", percentage: 88.7 },
    { shop: "Mysteryshop 3", percentage: 91.3 },
    { shop: "Mysteryshop 4", percentage: 89.8 },
    { shop: "Mysteryshop 5", percentage: 92.5 },
    { shop: "Mysteryshop 6", percentage: 90.1 },
    { shop: "Mysteryshop 7", percentage: 93.2 },
    { shop: "Mysteryshop 8", percentage: 89.6 },
    { shop: "Mysteryshop 9", percentage: 91.7 },
    { shop: "Mysteryshop 10", percentage: 94.1 },
    { shop: "Mysteryshop 11", percentage: 92.3 },
    { shop: "Mysteryshop 12", percentage: 91.2 }
  ];

  const getMysteryShopColorClass = (value: number) => {
    if (value >= 95) return "text-yellow-600"; // Gold
    if (value >= 90) return "text-green-600"; // Green
    if (value >= 80) return "text-[#FD7E14]"; // Orange - same as CA KPI
    return "text-red-600"; // Red
  };

  const getMysteryShopPillColor = (changePercent: string) => {
    if (changePercent.startsWith('+')) {
      return 'bg-green-100 text-green-800';
    } else if (changePercent.startsWith('-')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const calculateKpiStatsData = () => {
    // Calculate averages for all time
    const allTimeAvg = {
      mcet: historyData.reduce((sum, entry) => sum + entry.mcet, 0) / historyData.length,
      tma: historyData.reduce((sum, entry) => sum + entry.tma, 0) / historyData.length,
      vl: historyData.reduce((sum, entry) => sum + entry.vl, 0) / historyData.length
    }

    // Get current month (most recent entry) and comparison months
    const currentMonth = historyData[historyData.length - 1] // Most recent
    const lastMonth = historyData[historyData.length - 2] // Previous month  
    const sixMonthsAgo = historyData[historyData.length - 7] // 6 months ago

    // Calculate averages for last 6 months
    const last6MonthsData = historyData.slice(-6)
    const sixMonthsAvg = {
      mcet: last6MonthsData.reduce((sum, entry) => sum + entry.mcet, 0) / last6MonthsData.length,
      tma: last6MonthsData.reduce((sum, entry) => sum + entry.tma, 0) / last6MonthsData.length,
      vl: last6MonthsData.reduce((sum, entry) => sum + entry.vl, 0) / last6MonthsData.length
    }

    // Helper to calculate percentage change
    const calcPercentChange = (current: number, previous: number) => {
      const change = ((current - previous) / previous) * 100
      return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`
    }

    // Helper to calculate optimal difference
    const calcOptimalDiff = (value: number, optimal: number) => {
      const diff = value - optimal
      return diff >= 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`
    }

    return {
      "30days": {
        mcet: { 
          value: currentMonth.mcet, 
          changePercent: calcPercentChange(currentMonth.mcet, lastMonth.mcet)
        },
        tma: { 
          value: currentMonth.tma, 
          changePercent: calcPercentChange(currentMonth.tma, lastMonth.tma)
        },
        vlShare: { 
          value: currentMonth.vl, 
          changePercent: calcPercentChange(currentMonth.vl, lastMonth.vl)
        }
      },
      "6months": {
        mcet: { 
          value: sixMonthsAvg.mcet, 
          changePercent: calcPercentChange(currentMonth.mcet, sixMonthsAgo.mcet)
        },
        tma: { 
          value: sixMonthsAvg.tma, 
          changePercent: calcPercentChange(currentMonth.tma, sixMonthsAgo.tma)
        },
        vlShare: { 
          value: sixMonthsAvg.vl, 
          changePercent: calcPercentChange(currentMonth.vl, sixMonthsAgo.vl)
        }
      },
      "alltime": {
        mcet: { 
          value: allTimeAvg.mcet, 
          changePercent: calcOptimalDiff(allTimeAvg.mcet, 4.5)
        },
        tma: { 
          value: allTimeAvg.tma, 
          changePercent: calcOptimalDiff(allTimeAvg.tma, 75)
        },
        vlShare: { 
          value: allTimeAvg.vl, 
          changePercent: calcOptimalDiff(allTimeAvg.vl, 10)
        }
      }
    }
  }

  const kpiStatsData = calculateKpiStatsData()

  // Helper functions for KPI colors
  const getKpiColorClass = (category: "mcet" | "tma" | "vlshare", value: number) => {
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

  const getKpiPillColor = (changePercent: string) => {
    const isPositive = changePercent.startsWith('+');
    return isPositive 
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  // Toggle between CA KPIs and Mystery Shop every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowKpiView(prev => !prev);
    }, 7000);

    return () => clearInterval(interval);
  }, []);
  
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

  // Mock data for active promotors
  const activePromotors = [
    { id: 1, name: "Jan Müller", phone: "+43 664 123 4567", email: "jan.mueller@nespresso.at", location: "Wien", status: "aktiv", rating: 4.8, totalEinsaetze: 127 },
    { id: 2, name: "Sarah Schmidt", phone: "+43 664 234 5678", email: "sarah.schmidt@nespresso.at", location: "Graz", status: "aktiv", rating: 4.9, totalEinsaetze: 98 },
    { id: 3, name: "Michael Weber", phone: "+43 664 345 6789", email: "michael.weber@nespresso.at", location: "Salzburg", status: "aktiv", rating: 4.7, totalEinsaetze: 156 },
    { id: 4, name: "Lisa König", phone: "+43 664 456 7890", email: "lisa.koenig@nespresso.at", location: "Innsbruck", status: "aktiv", rating: 4.6, totalEinsaetze: 89 },
    { id: 5, name: "Thomas Bauer", phone: "+43 664 567 8901", email: "thomas.bauer@nespresso.at", location: "Linz", status: "aktiv", rating: 4.8, totalEinsaetze: 134 },
    { id: 6, name: "Anna Steiner", phone: "+43 664 678 9012", email: "anna.steiner@nespresso.at", location: "Klagenfurt", status: "aktiv", rating: 4.5, totalEinsaetze: 67 },
    { id: 7, name: "Peter Huber", phone: "+43 664 789 0123", email: "peter.huber@nespresso.at", location: "Villach", status: "aktiv", rating: 4.7, totalEinsaetze: 112 },
    { id: 8, name: "Markus Fischer", phone: "+43 664 890 1234", email: "markus.fischer@nespresso.at", location: "Wien", status: "aktiv", rating: 4.9, totalEinsaetze: 143 },
    { id: 9, name: "Julia Wagner", phone: "+43 664 901 2345", email: "julia.wagner@nespresso.at", location: "Graz", status: "aktiv", rating: 4.6, totalEinsaetze: 78 },
    { id: 10, name: "Robert Klein", phone: "+43 664 012 3456", email: "robert.klein@nespresso.at", location: "Linz", status: "aktiv", rating: 4.8, totalEinsaetze: 167 },
    { id: 11, name: "Elena Hofer", phone: "+43 664 123 4568", email: "elena.hofer@nespresso.at", location: "Salzburg", status: "aktiv", rating: 4.7, totalEinsaetze: 91 },
    { id: 12, name: "David Moser", phone: "+43 664 234 5679", email: "david.moser@nespresso.at", location: "Innsbruck", status: "aktiv", rating: 4.5, totalEinsaetze: 105 },
    { id: 13, name: "Sophie Wimmer", phone: "+43 664 345 6780", email: "sophie.wimmer@nespresso.at", location: "Wien", status: "aktiv", rating: 4.9, totalEinsaetze: 128 },
    { id: 14, name: "Martin Gruber", phone: "+43 664 456 7891", email: "martin.gruber@nespresso.at", location: "Klagenfurt", status: "aktiv", rating: 4.6, totalEinsaetze: 87 },
    { id: 15, name: "Christina Pichler", phone: "+43 664 567 8902", email: "christina.pichler@nespresso.at", location: "Villach", status: "aktiv", rating: 4.8, totalEinsaetze: 119 },
    { id: 16, name: "Alexander Steiner", phone: "+43 664 678 9013", email: "alexander.steiner@nespresso.at", location: "Graz", status: "aktiv", rating: 4.7, totalEinsaetze: 145 },
    { id: 17, name: "Petra Maier", phone: "+43 664 789 0124", email: "petra.maier@nespresso.at", location: "Wien", status: "aktiv", rating: 4.5, totalEinsaetze: 73 },
    { id: 18, name: "Stefan Berger", phone: "+43 664 890 1235", email: "stefan.berger@nespresso.at", location: "Linz", status: "aktiv", rating: 4.8, totalEinsaetze: 132 },
    { id: 19, name: "Nicole Huber", phone: "+43 664 901 2346", email: "nicole.huber@nespresso.at", location: "Salzburg", status: "aktiv", rating: 4.6, totalEinsaetze: 96 },
    { id: 20, name: "Thomas Lechner", phone: "+43 664 012 3457", email: "thomas.lechner@nespresso.at", location: "Innsbruck", status: "aktiv", rating: 4.7, totalEinsaetze: 111 },
    { id: 21, name: "Sabine Wolf", phone: "+43 664 123 4569", email: "sabine.wolf@nespresso.at", location: "Klagenfurt", status: "aktiv", rating: 4.9, totalEinsaetze: 158 },
    { id: 22, name: "Daniel Kraus", phone: "+43 664 234 5680", email: "daniel.kraus@nespresso.at", location: "Villach", status: "aktiv", rating: 4.6, totalEinsaetze: 84 },
    { id: 23, name: "Andrea Fuchs", phone: "+43 664 345 6781", email: "andrea.fuchs@nespresso.at", location: "Graz", status: "aktiv", rating: 4.8, totalEinsaetze: 137 },
    { id: 24, name: "Manuel Bauer", phone: "+43 664 456 7892", email: "manuel.bauer@nespresso.at", location: "Wien", status: "aktiv", rating: 4.7, totalEinsaetze: 102 },
    { id: 25, name: "Vanessa Köhler", phone: "+43 664 567 8903", email: "vanessa.koehler@nespresso.at", location: "Linz", status: "aktiv", rating: 4.5, totalEinsaetze: 79 },
    { id: 26, name: "Florian Reiter", phone: "+43 664 678 9014", email: "florian.reiter@nespresso.at", location: "Salzburg", status: "aktiv", rating: 4.8, totalEinsaetze: 124 },
    { id: 27, name: "Lisa Mayer", phone: "+43 664 789 0125", email: "lisa.mayer@nespresso.at", location: "Innsbruck", status: "aktiv", rating: 4.6, totalEinsaetze: 93 },
    { id: 28, name: "Maximilian Huber", phone: "+43 664 890 1236", email: "max.huber@nespresso.at", location: "Wien", status: "aktiv", rating: 4.9, totalEinsaetze: 149 },
    { id: 29, name: "Katharina Braun", phone: "+43 664 901 2347", email: "katharina.braun@nespresso.at", location: "Graz", status: "aktiv", rating: 4.7, totalEinsaetze: 116 },
    { id: 30, name: "Wolfgang Schwarz", phone: "+43 664 012 3458", email: "wolfgang.schwarz@nespresso.at", location: "Klagenfurt", status: "aktiv", rating: 4.5, totalEinsaetze: 88 },
    { id: 31, name: "Melanie Weiß", phone: "+43 664 123 4570", email: "melanie.weiss@nespresso.at", location: "Villach", status: "aktiv", rating: 4.8, totalEinsaetze: 133 },
    { id: 32, name: "Patrick Grün", phone: "+43 664 234 5681", email: "patrick.gruen@nespresso.at", location: "Linz", status: "aktiv", rating: 4.6, totalEinsaetze: 107 },
    { id: 33, name: "Sandra Rot", phone: "+43 664 345 6782", email: "sandra.rot@nespresso.at", location: "Salzburg", status: "aktiv", rating: 4.7, totalEinsaetze: 125 },
    { id: 34, name: "Benjamin Blau", phone: "+43 664 456 7893", email: "benjamin.blau@nespresso.at", location: "Innsbruck", status: "aktiv", rating: 4.9, totalEinsaetze: 162 },
    { id: 35, name: "Jessica Gelb", phone: "+43 664 567 8904", email: "jessica.gelb@nespresso.at", location: "Wien", status: "aktiv", rating: 4.5, totalEinsaetze: 71 },
    { id: 36, name: "Kevin Lila", phone: "+43 664 678 9015", email: "kevin.lila@nespresso.at", location: "Graz", status: "aktiv", rating: 4.8, totalEinsaetze: 139 },
    { id: 37, name: "Michelle Orange", phone: "+43 664 789 0126", email: "michelle.orange@nespresso.at", location: "Klagenfurt", status: "aktiv", rating: 4.6, totalEinsaetze: 95 },
    { id: 38, name: "Dominik Rosa", phone: "+43 664 890 1237", email: "dominik.rosa@nespresso.at", location: "Villach", status: "aktiv", rating: 4.7, totalEinsaetze: 118 },
    { id: 39, name: "Stephanie Grau", phone: "+43 664 901 2348", email: "stephanie.grau@nespresso.at", location: "Linz", status: "aktiv", rating: 4.8, totalEinsaetze: 142 },
    { id: 40, name: "Philip Türkis", phone: "+43 664 012 3459", email: "philip.tuerkis@nespresso.at", location: "Salzburg", status: "aktiv", rating: 4.5, totalEinsaetze: 86 },
    { id: 41, name: "Carina Mint", phone: "+43 664 123 4571", email: "carina.mint@nespresso.at", location: "Innsbruck", status: "aktiv", rating: 4.9, totalEinsaetze: 154 },
    { id: 42, name: "Oliver Beige", phone: "+43 664 234 5682", email: "oliver.beige@nespresso.at", location: "Wien", status: "aktiv", rating: 4.6, totalEinsaetze: 103 },
    { id: 43, name: "Tanja Braun", phone: "+43 664 345 6783", email: "tanja.braun@nespresso.at", location: "Graz", status: "aktiv", rating: 4.7, totalEinsaetze: 121 },
    { id: 44, name: "Marco Silber", phone: "+43 664 456 7894", email: "marco.silber@nespresso.at", location: "Klagenfurt", status: "aktiv", rating: 4.8, totalEinsaetze: 135 },
    { id: 45, name: "Franziska Gold", phone: "+43 664 567 8905", email: "franziska.gold@nespresso.at", location: "Villach", status: "aktiv", rating: 4.5, totalEinsaetze: 77 },
    { id: 46, name: "Tobias Kupfer", phone: "+43 664 678 9016", email: "tobias.kupfer@nespresso.at", location: "Linz", status: "aktiv", rating: 4.8, totalEinsaetze: 146 },
    { id: 47, name: "Nadine Bronze", phone: "+43 664 789 0127", email: "nadine.bronze@nespresso.at", location: "Salzburg", status: "aktiv", rating: 4.6, totalEinsaetze: 99 },
    { id: 48, name: "Lukas Platin", phone: "+43 664 890 1238", email: "lukas.platin@nespresso.at", location: "Innsbruck", status: "aktiv", rating: 4.7, totalEinsaetze: 113 },
    { id: 49, name: "Simone Kristall", phone: "+43 664 901 2349", email: "simone.kristall@nespresso.at", location: "Wien", status: "aktiv", rating: 4.9, totalEinsaetze: 167 },
    { id: 50, name: "Fabian Perl", phone: "+43 664 012 3460", email: "fabian.perl@nespresso.at", location: "Graz", status: "aktiv", rating: 4.5, totalEinsaetze: 82 },
    { id: 51, name: "Verena Diamant", phone: "+43 664 123 4572", email: "verena.diamant@nespresso.at", location: "Klagenfurt", status: "aktiv", rating: 4.8, totalEinsaetze: 129 },
    { id: 52, name: "Christian Rubin", phone: "+43 664 234 5683", email: "christian.rubin@nespresso.at", location: "Villach", status: "aktiv", rating: 4.6, totalEinsaetze: 108 },
    { id: 53, name: "Isabella Saphir", phone: "+43 664 345 6784", email: "isabella.saphir@nespresso.at", location: "Linz", status: "aktiv", rating: 4.7, totalEinsaetze: 122 },
    { id: 54, name: "Sebastian Smaragd", phone: "+43 664 456 7895", email: "sebastian.smaragd@nespresso.at", location: "Salzburg", status: "aktiv", rating: 4.8, totalEinsaetze: 148 },
    { id: 55, name: "Larisa Topas", phone: "+43 664 567 8906", email: "larisa.topas@nespresso.at", location: "Innsbruck", status: "aktiv", rating: 4.5, totalEinsaetze: 75 },
    { id: 56, name: "Moritz Opal", phone: "+43 664 678 9017", email: "moritz.opal@nespresso.at", location: "Wien", status: "aktiv", rating: 4.9, totalEinsaetze: 156 },
    { id: 57, name: "Celina Jade", phone: "+43 664 789 0128", email: "celina.jade@nespresso.at", location: "Graz", status: "aktiv", rating: 4.6, totalEinsaetze: 94 },
    { id: 58, name: "Leon Achat", phone: "+43 664 890 1239", email: "leon.achat@nespresso.at", location: "Klagenfurt", status: "aktiv", rating: 4.7, totalEinsaetze: 117 },
    { id: 59, name: "Amelie Quarz", phone: "+43 664 901 2350", email: "amelie.quarz@nespresso.at", location: "Villach", status: "aktiv", rating: 4.8, totalEinsaetze: 141 },
    { id: 60, name: "Jonas Onyx", phone: "+43 664 012 3461", email: "jonas.onyx@nespresso.at", location: "Linz", status: "aktiv", rating: 4.5, totalEinsaetze: 83 }
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



  // Cleanup delete confirmation state when modal closes
  useEffect(() => {
    if (!showMessageDetail) {
      setDeleteConfirmationState(false);
      if (deleteConfirmationTimer) {
        clearTimeout(deleteConfirmationTimer);
        setDeleteConfirmationTimer(null);
      }
    }
  }, [showMessageDetail, deleteConfirmationTimer]);

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Admin Navigation */}
      <AdminNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-14'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Guten Tag, Admin</h1>
              <p className="text-gray-500 text-sm">Hier ist Ihr Überblick für heute</p>
            </div>

          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8 space-y-6">
          {/* Top Row: Eddie Card & Today's Einsätze */}
          <div className="flex flex-col lg:flex-row gap-4 relative">
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
                  className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
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
            <div className="flex-1 relative h-80">
              <Card 
                className={`border-0 w-full transition-all duration-300 ${isEinsaetzeExpanded ? 'absolute top-0 left-0 right-0 h-[960px] z-20' : 'relative h-full'}`}
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 185, 151, 0.003) 50%, rgba(255, 133, 82, 0.005) 100%)',
                  boxShadow: '0 4px 20px -2px rgba(255, 133, 82, 0.06), 0 2px 8px -1px rgba(255, 185, 151, 0.04), 0 8px 32px -4px rgba(255, 133, 82, 0.03)'
                }}
              >
              <CardContent className={`p-6 h-full flex flex-col ${isEinsaetzeExpanded ? 'bg-white' : ''}`}>
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
                    <button
                      onClick={() => setIsEinsaetzeExpanded(!isEinsaetzeExpanded)}
                      className="p-1 rounded hover:bg-gray-100 transition-colors opacity-50"
                    >
                      {isEinsaetzeExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-600" />
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
                          className="absolute top-full right-0 mt-1 border-0 rounded-xl shadow-lg z-10 w-40 bg-white max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                          style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                          }}
                        >
                          <div
                            onClick={() => {setEinsatzFilter("alle"); setShowDropdown(false);}}
                            className="px-2 py-1 text-xs text-gray-600 cursor-pointer hover:bg-gradient-to-r hover:from-white hover:to-gray-100/80 transition-all duration-200"
                          >
                            alle
                          </div>
                          {getLocationOptions().map(location => {
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
                    <div className="grid grid-cols-5 gap-2 h-fit">
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
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="border-0 cursor-pointer hover:scale-[1.02] transition-transform duration-200 h-20 w-full"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(34, 197, 94, 0.003) 50%, rgba(21, 128, 61, 0.005) 100%)',
                boxShadow: '0 4px 20px -2px rgba(34, 197, 94, 0.06), 0 2px 8px -1px rgba(34, 197, 94, 0.04), 0 8px 32px -4px rgba(34, 197, 94, 0.03)'
              }}
              onClick={() => setShowActivePromotionsModal(true)}
            >
              <CardContent className="p-4 h-full">
                <div className="flex items-center space-x-3 h-full">
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
              className="border-0 cursor-pointer hover:scale-[1.02] transition-transform duration-200 h-20 w-full"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(251, 146, 60, 0.003) 50%, rgba(234, 88, 12, 0.005) 100%)',
                boxShadow: '0 4px 20px -2px rgba(234, 88, 12, 0.06), 0 2px 8px -1px rgba(251, 146, 60, 0.04), 0 8px 32px -4px rgba(234, 88, 12, 0.03)'
              }}
              onClick={() => setShowOffeneAnfragenModal(true)}
            >
              <CardContent className="p-4 h-full">
                <div className="flex items-center space-x-3 h-full">
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
              className="border-0 cursor-pointer hover:scale-[1.02] transition-transform duration-200 h-20 w-full"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(59, 130, 246, 0.003) 50%, rgba(29, 78, 216, 0.005) 100%)',
                boxShadow: '0 4px 20px -2px rgba(29, 78, 216, 0.06), 0 2px 8px -1px rgba(59, 130, 246, 0.04), 0 8px 32px -4px rgba(29, 78, 216, 0.03)'
              }}
              onClick={() => setShowActivePromotorenModal(true)}
            >
              <CardContent className="p-4 h-full">
                <div className="flex items-center space-x-3 h-full">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{activePromotors.length}</p>
                    <p className="text-xs text-gray-500">Aktive Promotoren</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-0 h-20 w-full cursor-pointer hover:scale-[1.02] transition-transform duration-200"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(168, 85, 247, 0.003) 50%, rgba(126, 34, 206, 0.005) 100%)',
                boxShadow: '0 4px 20px -2px rgba(126, 34, 206, 0.06), 0 2px 8px -1px rgba(168, 85, 247, 0.04), 0 8px 32px -4px rgba(126, 34, 206, 0.03)'
              }}
              onClick={() => setShowKpiPopup(true)}
            >
              <CardContent className="p-4 h-full">
                <div className="flex items-center space-x-3 h-full">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    {showKpiView ? (
                      // CA KPIs View - Compact 3-column layout
                      <div className="w-full">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {/* MC/ET Column */}
                          <div className="flex flex-col">
                            <span className="text-[9px] font-medium text-gray-600">MC/ET</span>
                            <span className={`text-sm font-semibold ${getKpiColor("mcet", companyKpis.mcet.value)}`}>
                              {companyKpis.mcet.value}
                            </span>
                            <span className={`text-[9px] px-[2px] py-0.5 rounded inline-block leading-none w-fit mx-auto ${getPillColorKpi(companyKpis.mcet.changePercent)}`}>
                              {companyKpis.mcet.changePercent}
                            </span>
                          </div>
                          {/* TMA Column */}
                          <div className="flex flex-col">
                            <span className="text-[9px] font-medium text-gray-600">TMA</span>
                            <span className={`text-sm font-semibold ${getKpiColor("tma", companyKpis.tma.value)}`}>
                              {companyKpis.tma.value}%
                            </span>
                            <span className={`text-[9px] px-[2px] py-0.5 rounded inline-block leading-none w-fit mx-auto ${getPillColorKpi(companyKpis.tma.changePercent)}`}>
                              {companyKpis.tma.changePercent}
                            </span>
                          </div>
                          {/* VL Share Column */}
                          <div className="flex flex-col">
                            <span className="text-[9px] font-medium text-gray-600">VL Share</span>
                            <span className={`text-sm font-semibold ${getKpiColor("vlshare", companyKpis.vlShare.value)}`}>
                              {companyKpis.vlShare.value}%
                            </span>
                            <span className={`text-[9px] px-[2px] py-0.5 rounded inline-block leading-none w-fit mx-auto ${getPillColorKpi(companyKpis.vlShare.changePercent)}`}>
                              {companyKpis.vlShare.changePercent}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Mystery Shop View
                      <div className="flex flex-col items-start space-y-1">
                        <div>
                          <span 
                            className={`text-2xl font-semibold ${
                              getMysteryShopColor(mysteryShopData.value) !== "custom-gold" && 
                              getMysteryShopColor(mysteryShopData.value) !== "text-[#FD7E14]" 
                                ? getMysteryShopColor(mysteryShopData.value) 
                                : ""
                            }`}
                            style={{
                              ...getMysteryShopStyle(getMysteryShopColor(mysteryShopData.value)),
                              ...(getMysteryShopColor(mysteryShopData.value) === "text-[#FD7E14]" ? { color: "#FD7E14" } : {})
                            }}
                          >
                            {mysteryShopData.value}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Mystery Shop Ø</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Promotions & Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Challenge Leaderboard */}
            <Card 
              className="border-0 bg-white"
              style={{
                boxShadow: '0 4px 20px -2px rgba(126, 34, 206, 0.06), 0 2px 8px -1px rgba(168, 85, 247, 0.04), 0 8px 32px -4px rgba(126, 34, 206, 0.03)'
              }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-gray-900" />
                    <CardTitle className="text-lg font-semibold text-gray-900">Sales Challenge Leaderboard</CardTitle>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-600 opacity-50">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">2T 14h 23m</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 py-0 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="space-y-1">
                  {[
                    { rank: 1, name: "Sarah Schmidt", sales: 45, reward: "150€" },
                    { rank: 2, name: "Michael Weber", sales: 42, reward: "100€" },
                    { rank: 3, name: "Jan Müller", sales: 38, reward: "50€" },
                    { rank: 4, name: "Lisa König", sales: 35, reward: "20€" },
                    { rank: 5, name: "Anna Bauer", sales: 32, reward: "20€" },
                    { rank: 6, name: "Tom Fischer", sales: 28, reward: "20€" },
                    { rank: 7, name: "Maria Huber", sales: 25, reward: "20€" },
                    { rank: 8, name: "David Klein", sales: 22, reward: "20€" }
                  ].map((entry) => (
                    <div key={entry.rank} className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                      entry.rank === 1 
                        ? 'border-yellow-200/50 bg-gradient-to-r from-yellow-50/20 to-amber-50/20 hover:from-yellow-50/40 hover:to-amber-50/40'
                        : entry.rank === 2
                        ? 'border-gray-200/50 bg-gradient-to-r from-gray-50/20 to-slate-50/20 hover:from-gray-50/40 hover:to-slate-50/40'
                        : entry.rank === 3
                        ? 'border-amber-200/50 bg-gradient-to-r from-amber-50/20 to-orange-50/20 hover:from-amber-50/40 hover:to-orange-50/40'
                        : 'border-blue-200/50 bg-gradient-to-r from-blue-50/20 to-indigo-50/20 hover:from-blue-50/40 hover:to-indigo-50/40'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {/* Placement Icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          entry.rank === 1 
                            ? '' 
                            : entry.rank === 2
                            ? ''
                            : entry.rank === 3
                            ? ''
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}
                        style={
                          entry.rank === 1 
                            ? { background: 'linear-gradient(135deg, #EEB34B 0%, #FFED99 25%, #FCD33D 50%, #FAF995 75%, #EFC253 100%)' }
                            : entry.rank === 2
                            ? { background: 'linear-gradient(135deg, #DEDFE1 0%, #BCBDC1 25%, #ECEEED 75%, #B6BCBC 100%)' }
                            : entry.rank === 3
                            ? { background: 'linear-gradient(135deg, #BD965D 0%, #99774A 25%, #DEBF93 75%, #AC9071 100%)' }
                            : {}
                        }>
                          <span className="text-white font-bold text-sm">{entry.rank}</span>
                        </div>
                        
                        {/* Promotor Info */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{entry.name}</h4>
                          <p className="text-xs text-gray-500">{entry.sales} VL Verkäufe</p>
                        </div>
                      </div>
                      
                      {/* Reward */}
                      <div className="text-right">
                        <div className={`text-sm font-bold ${
                          entry.rank === 1 
                            ? 'bg-gradient-to-r from-[#E0AA3E] via-[#F0D96A] to-[#E0AA3E] bg-clip-text text-transparent'
                            : entry.rank === 2
                            ? 'text-[#BCBDC1]'
                            : entry.rank === 3
                            ? 'text-[#BD965D]'
                            : 'text-blue-600'
                        }`}>
                          {entry.reward}
                        </div>
                        <p className="text-xs text-gray-400">Belohnung</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Message Terminal */}
            <Card className="border-0 flex flex-col h-full bg-gradient-to-br from-white to-blue-50/40" style={{ boxShadow: '0 1px 3px 0 rgba(59, 130, 246, 0.15), 0 1px 2px 0 rgba(96, 165, 250, 0.1)' }}>
              <CardHeader className="pb-0">
                <div className="relative flex items-center">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-gray-900" />
                    <CardTitle className="text-lg font-semibold text-gray-900">Nachrichten Terminal</CardTitle>
                  </div>
                  {/* Absolute positioned toggle whose right edge aligns with the left column's right edge */}
                  <button
                    onClick={() => setEnableTwoStep(prev => !prev)}
                    className={`absolute left-[calc(50%-0.5rem)] top-1/2 -translate-y-1/2 -translate-x-full h-6 px-2 rounded-md text-xs font-medium border transition-colors leading-none ${enableTwoStep ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    title="Zweistufig: Anhänge (Foto/PDF) beim Empfänger aktivieren"
                  >
                    2‑Step
                  </button>
                </div>

              </CardHeader>
              <CardContent className="p-4 pt-2 flex-1 flex flex-col">
                <div className="flex space-x-4 flex-1">
                  {/* Message Input - Left Side */}
                  <div className="flex-1 flex flex-col space-y-3">
                    <div className="flex-1 relative border border-gray-200 rounded-lg overflow-hidden" style={{
                      background: isEnhancing ? 'linear-gradient(135deg, #9FC6FF 0%, #5D97FF 25%, #4663ED 75%, #4F48E6 100%)' : 'transparent'
                    }}>
                      <div className="absolute inset-0 pb-8">
                        <textarea
                          placeholder="Nachricht eingeben..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          className={`w-full h-full p-3 border-0 rounded-lg resize-none focus:outline-none focus:ring-0 text-sm [&::-webkit-scrollbar]:hidden ${
                            isEnhancing ? '' : 'transition-all duration-1000'
                          }`}
                          style={{ 
                            scrollbarWidth: 'none', 
                            msOverflowStyle: 'none',
                            background: 'transparent',
                            color: isEnhancing ? 'transparent' : '#111827',
                            transition: isEnhancing ? 'none' : 'color 1000ms',
                            borderRadius: '8px',
                            borderBottom: 'none !important'
                          }}
                        />
                      </div>
                      
                      {/* Add Promotors Icon - Left side */}
                      <div className="absolute bottom-3 left-3 z-10">
                        {selectedPromotors.length > 0 ? (
                          <div 
                            onClick={() => setShowPromotorSelection(true)}
                            className="flex items-center space-x-1 cursor-pointer hover:opacity-75 transition-opacity"
                          >
                            <Check className="h-4 w-4 text-green-600 opacity-50" />
                            <span className="text-xs text-black opacity-30">
                              {(() => {
                                // Determine if all selected promotors are from same region
                                const selectedRegions = selectedPromotors.map(name => {
                                  const promotor = allPromotors.find(p => p.name === name);
                                  return promotor?.region;
                                }).filter(Boolean);
                                
                                const uniqueRegions = [...new Set(selectedRegions)];
                                
                                if (uniqueRegions.length === 1 && uniqueRegions[0]) {
                                  const regionNames: Record<string, string> = {
                                    "wien-noe-bgl": "W/NÖ/BGL",
                                    "steiermark": "Steiermark",
                                    "salzburg": "Salzburg", 
                                    "oberoesterreich": "Oberösterreich",
                                    "tirol": "Tirol",
                                    "vorarlberg": "Vorarlberg",
                                    "kaernten": "Kärnten"
                                  };
                                  return `${regionNames[uniqueRegions[0]]} Cluster ausgewählt`;
                                } else {
                                  return `${selectedPromotors.length} Promotoren ausgewählt`;
                                }
                              })()}
                            </span>
                          </div>
                        ) : (
                          <UserPlus 
                            onClick={() => setShowPromotorSelection(true)}
                            className="h-4 w-4 text-black opacity-50 cursor-pointer hover:opacity-75 transition-opacity"
                          />
                        )}
                      </div>

                      {/* Magic Wand Icon - Right side */}
                      <div className="absolute bottom-3 right-3 z-10">
                        <Wand2 
                          onClick={enhanceMessage}
                          className={`h-4 w-4 cursor-pointer transition-all duration-300 ${
                            !messageText.trim() || isEnhancing 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-blue-600 hover:text-blue-700'
                          } ${isEnhancing ? 'animate-pulse' : ''}`}
                        />
                      </div>
                      
                      {/* Single Scanning Line Animation - Covers entire container including footer icons */}
                      {isEnhancing && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 rounded-lg">
                          <div 
                            className="absolute h-full w-1 bg-gradient-to-b from-transparent via-white to-transparent opacity-90 shadow-lg"
                            style={{
                              left: '0%',
                              animation: 'scan-across 2s ease-in-out infinite',
                              filter: 'blur(1px)'
                            }}
                          />
                          <div 
                            className="absolute w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-90 shadow-lg"
                            style={{
                              top: '0%',
                              animation: 'scan-down 2s ease-in-out infinite',
                              filter: 'blur(1px)'
                            }}
                          />
                        </div>
                      )}
                      
                      <style jsx>{`
                        @keyframes scan-across {
                          0% { left: -2%; opacity: 0; }
                          10% { opacity: 0.9; }
                          50% { opacity: 1; }
                          90% { opacity: 0.9; }
                          100% { left: 102%; opacity: 0; }
                        }
                        
                        @keyframes scan-down {
                          0% { top: -2%; opacity: 0; }
                          10% { opacity: 0.9; }
                          50% { opacity: 1; }
                          90% { opacity: 0.9; }
                          100% { top: 102%; opacity: 0; }
                        }
                      `}</style>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={async () => {
                          if (!messageText.trim() || selectedPromotors.length === 0) return;
                          
                          try {
                            // Get promotor IDs from selected names
                            const promotorIds = selectedPromotors.map(name => {
                              const promotor = allPromotors.find(p => p.name === name);
                              return promotor?.id;
                            }).filter(Boolean);
                            
                            const response = await fetch('/api/messages', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                message_text: messageText,
                                message_type: enableTwoStep ? 'confirmation_required' : 'normal',
                                recipient_ids: promotorIds,
                                send_immediately: true
                              })
                            });
                            
                            if (response.ok) {
                              // Reset form
                              setMessageText("");
                              setSelectedPromotors([]);
                              setEnableTwoStep(false);
                              console.log('Message sent successfully');
                            } else {
                              console.error('Failed to send message');
                            }
                          } catch (error) {
                            console.error('Error sending message:', error);
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all"
                      >
                        Sofort senden
                      </button>
                      <button 
                        onClick={() => setShowScheduleModal(true)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Planen
                      </button>
                    </div>
                  </div>
                  
                  {/* Scheduled Messages - Right Side */}
                  <div className="flex-1 flex flex-col">
                    <div className="bg-white rounded-lg shadow-sm pt-2 px-2 pb-2 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <h4 
                          className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => setShowHistory(!showHistory)}
                        >
                          {showHistory ? "Verlauf" : "Geplante Nachrichten"}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {showHistory ? `${messageHistory.length} gesendet` : `${scheduledMessages.length} geplant`}
                        </span>
                      </div>
                                              <div className="space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', maxHeight: '215px' }}>
                          {showHistory ? (
                            // Show message history
                            messageHistory
                              .sort((a, b) => {
                                // Sort by date descending (newest first)
                                const dateA = new Date(a.date);
                                const dateB = new Date(b.date);
                                return dateB.getTime() - dateA.getTime();
                              })
                              .map((message) => (
                              <div 
                                key={message.id} 
                                onClick={() => handleMessageClick(message)}
                                className="p-3 border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50/30 to-indigo-50/30 hover:bg-gray-50/50 transition-colors cursor-pointer"
                              >
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-900 line-clamp-2 leading-relaxed overflow-hidden" style={{ wordBreak: 'break-all' }}>{message.preview.length > 25 ? message.preview.substring(0, 25) + '...' : message.preview}</p>
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{message.date} {message.time}</span>
                                    <span>{message.recipients}</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            // Show scheduled messages
                            scheduledMessages
                              .sort((a, b) => {
                                // Properly combine ISO date and time for sorting
                                const dateA = new Date(`${a.dateISO || a.date}T${a.time}`);
                                const dateB = new Date(`${b.dateISO || b.date}T${b.time}`);
                                return dateA.getTime() - dateB.getTime(); // Earliest first
                              })
                              .map((message) => (
                              <div 
                                key={message.id} 
                                onClick={() => handleMessageClick(message)}
                                className="p-3 border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50/30 to-indigo-50/30 hover:bg-gray-50/50 transition-colors cursor-pointer"
                              >
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-900 line-clamp-2 leading-relaxed overflow-hidden" style={{ wordBreak: 'break-all' }}>{message.preview.length > 25 ? message.preview.substring(0, 25) + '...' : message.preview}</p>
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{message.date} {message.time}</span>
                                    <span>{message.recipients}</span>
                                  </div>
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

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm bg-white">
          </Card>
        </main>
      </div>

      {/* Active Promotions Modal */}
      {showActivePromotionsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card 
            className="w-full max-w-6xl border border-gray-200 shadow-sm max-h-[90vh] overflow-hidden bg-white"
          >
            <CardHeader className="pb-4 border-b border-gray-200">
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
                    className="px-3 py-1.5 text-sm border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-0 placeholder-gray-400"
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
                                ? 'bg-gradient-to-r from-white to-green-50/35' 
                                : statusColor === 'orange'
                                ? 'bg-orange-50'
                                : statusColor === 'red'
                                ? 'bg-red-50'
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
                            className={`p-3 rounded-lg border border-gray-200 transition-all duration-200 hover:border-gray-300 hover:shadow-sm ${
                              statusColor === 'green' 
                                ? 'bg-gradient-to-br from-white to-green-50/35' 
                                : statusColor === 'orange'
                                ? 'bg-orange-50'
                                : statusColor === 'red'
                                ? 'bg-red-50'
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
            className="w-full max-w-6xl border border-gray-200 shadow-sm max-h-[90vh] overflow-hidden bg-white"
          >
            <CardHeader className="pb-4 border-b border-gray-200">
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
                      className="p-4 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-sm bg-gradient-to-r from-white to-orange-50"
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

      {/* Active Promotoren Modal */}
      {showActivePromotorenModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card 
            className="w-full max-w-6xl border border-gray-200 shadow-sm max-h-[90vh] overflow-hidden bg-white"
          >
            <CardHeader className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Aktive Promotoren</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {activePromotors.length} aktive Teammitglieder
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Promotor suchen..."
                    value={activePromotorenSearch}
                    onChange={(e) => setActivePromotorenSearch(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-0 placeholder-gray-400"
                  />
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowActivePromotorenModal(false)}
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
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <div className="grid grid-cols-4 gap-4">
                {activePromotors
                  .filter(promotor => promotor.name.toLowerCase().includes(activePromotorenSearch.toLowerCase()))
                  .map((promotor) => (
                  <div 
                    key={promotor.id} 
                    className="p-4 rounded-lg border border-gray-200 transition-all duration-300 hover:border-gray-300 hover:shadow-sm hover:scale-[1.02] bg-gradient-to-br from-white to-blue-50"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{promotor.name}</h4>
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">{promotor.phone}</p>
                        <p className="text-xs text-gray-600 truncate">{promotor.email}</p>
                        <p className="text-xs text-gray-600">{promotor.location}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-yellow-600">★</span>
                          <span className="text-xs text-gray-600">{promotor.rating}</span>
                        </div>
                        <span className="text-xs text-gray-500">{promotor.totalEinsaetze} Einsätze</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card 
            className="w-full max-w-md border border-gray-200 shadow-sm bg-white"
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

      {/* KPI Analytics Popup */}
      {showKpiPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card 
            className="w-full max-w-4xl border border-gray-200 shadow-sm max-h-[90vh] overflow-hidden bg-white"
          >
            <CardHeader className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">KPI Analytics</CardTitle>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowKpiPopup(false)}
                    className="h-8 w-8 text-gray-900 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Navigation Menu */}
              <div className="mt-4">
                <div className="flex bg-gray-100 rounded-lg p-1 max-w-sm mx-auto relative">
                  <div 
                    className={`absolute top-1 bottom-1 bg-white rounded-md shadow-sm transition-all duration-300 ease-in-out ${
                      kpiPopupActiveTab === "ca-kpis" 
                        ? "left-1 right-1/2 mr-0.5" 
                        : "left-1/2 right-1 ml-0.5"
                    }`}
                  />
                  
                  <button
                    onClick={() => setKpiPopupActiveTab("ca-kpis")}
                    className="relative flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 z-10"
                  >
                    <span className={`transition-all duration-200 ${
                      kpiPopupActiveTab === "ca-kpis" 
                        ? "text-gray-900 font-medium" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}>CA KPIs</span>
                  </button>
                  <button
                    onClick={() => setKpiPopupActiveTab("mystery-shop")}
                    className="relative flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 z-10"
                  >
                    <span className={`transition-all duration-200 ${
                      kpiPopupActiveTab === "mystery-shop" 
                        ? "text-gray-900 font-medium" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}>Mystery Shop</span>
                  </button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent 
              className="p-6 overflow-auto max-h-[70vh] [&::-webkit-scrollbar]:hidden" 
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {kpiPopupActiveTab === "ca-kpis" && (
                <div className="space-y-6">
                  {/* Three timeframes in horizontal layout */}
                  <div className="grid grid-cols-3 gap-6">
                    {/* All Time (17) */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-center font-medium text-gray-700 mb-4">All Time (17)</h3>
                      <div className="space-y-1 mx-2">
                                                 {/* MC/ET */}
                         <div className="text-center py-0.5">
                           <div className="flex items-center justify-center">
                             <div className="text-right text-gray-500 whitespace-nowrap">Avg MC/ET:</div>
                             <div 
                               className={`font-semibold ${getKpiColorClass("mcet", kpiStatsData["alltime"].mcet.value) !== "text-[#FD7E14]" ? getKpiColorClass("mcet", kpiStatsData["alltime"].mcet.value) : ""}`}
                               style={{marginLeft: '4px', ...getKpiStyle(getKpiColorClass("mcet", kpiStatsData["alltime"].mcet.value))}}
                             >
                               {kpiStatsData["alltime"].mcet.value.toFixed(1)}
                             </div>
                             <div className={`text-xs ${getKpiPillColor(kpiStatsData["alltime"].mcet.changePercent)} rounded-full px-1 py-0 whitespace-nowrap`} style={{marginLeft: '4px'}}>
                               {kpiStatsData["alltime"].mcet.changePercent}
                             </div>
                           </div>
                         </div>
                         
                         {/* TMA */}
                         <div className="text-center py-0.5">
                           <div className="flex items-center justify-center">
                             <div className="text-right text-gray-500 whitespace-nowrap">Avg TMA:</div>
                             <div 
                               className={`font-semibold ${getKpiColorClass("tma", kpiStatsData["alltime"].tma.value) !== "text-[#FD7E14]" ? getKpiColorClass("tma", kpiStatsData["alltime"].tma.value) : ""}`}
                               style={{marginLeft: '4px', ...getKpiStyle(getKpiColorClass("tma", kpiStatsData["alltime"].tma.value))}}
                             >
                               {kpiStatsData["alltime"].tma.value.toFixed(1)}%
                             </div>
                             <div className={`text-xs ${getKpiPillColor(kpiStatsData["alltime"].tma.changePercent)} rounded-full px-1 py-0 whitespace-nowrap`} style={{marginLeft: '4px'}}>
                               {kpiStatsData["alltime"].tma.changePercent}
                             </div>
                           </div>
                         </div>
                         
                         {/* VL Share */}
                         <div className="text-center py-0.5">
                           <div className="flex items-center justify-center">
                             <div className="text-right text-gray-500 whitespace-nowrap">Avg VL Share:</div>
                             <div 
                               className={`font-semibold ${getKpiColorClass("vlshare", kpiStatsData["alltime"].vlShare.value) !== "text-[#FD7E14]" ? getKpiColorClass("vlshare", kpiStatsData["alltime"].vlShare.value) : ""}`}
                               style={{marginLeft: '4px', ...getKpiStyle(getKpiColorClass("vlshare", kpiStatsData["alltime"].vlShare.value))}}
                             >
                               {kpiStatsData["alltime"].vlShare.value.toFixed(1)}%
                             </div>
                             <div className={`text-xs ${getKpiPillColor(kpiStatsData["alltime"].vlShare.changePercent)} rounded-full px-1 py-0 whitespace-nowrap`} style={{marginLeft: '4px'}}>
                               {kpiStatsData["alltime"].vlShare.changePercent}
                             </div>
                           </div>
                         </div>
                      </div>
                    </div>

                    {/* Last 30 Days (17) */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-center font-medium text-gray-700 mb-4">Last 30 Days (17)</h3>
                      <div className="space-y-1 mx-2">
                                                 {/* MC/ET */}
                         <div className="text-center py-0.5">
                           <div className="flex items-center justify-center">
                             <div className="text-right text-gray-500 whitespace-nowrap">Avg MC/ET:</div>
                             <div 
                               className={`font-semibold ${getKpiColorClass("mcet", kpiStatsData["30days"].mcet.value) !== "text-[#FD7E14]" ? getKpiColorClass("mcet", kpiStatsData["30days"].mcet.value) : ""}`}
                               style={{marginLeft: '4px', ...getKpiStyle(getKpiColorClass("mcet", kpiStatsData["30days"].mcet.value))}}
                             >
                               {kpiStatsData["30days"].mcet.value.toFixed(1)}
                             </div>
                             <div className={`text-xs ${getKpiPillColor(kpiStatsData["30days"].mcet.changePercent)} rounded-full px-1 py-0 whitespace-nowrap`} style={{marginLeft: '4px'}}>
                               {kpiStatsData["30days"].mcet.changePercent}
                             </div>
                           </div>
                         </div>
                         
                         {/* TMA */}
                         <div className="text-center py-0.5">
                           <div className="flex items-center justify-center">
                             <div className="text-right text-gray-500 whitespace-nowrap">Avg TMA:</div>
                             <div 
                               className={`font-semibold ${getKpiColorClass("tma", kpiStatsData["30days"].tma.value) !== "text-[#FD7E14]" ? getKpiColorClass("tma", kpiStatsData["30days"].tma.value) : ""}`}
                               style={{marginLeft: '4px', ...getKpiStyle(getKpiColorClass("tma", kpiStatsData["30days"].tma.value))}}
                             >
                               {kpiStatsData["30days"].tma.value.toFixed(1)}%
                             </div>
                             <div className={`text-xs ${getKpiPillColor(kpiStatsData["30days"].tma.changePercent)} rounded-full px-1 py-0 whitespace-nowrap`} style={{marginLeft: '4px'}}>
                               {kpiStatsData["30days"].tma.changePercent}
                             </div>
                           </div>
                         </div>
                         
                         {/* VL Share */}
                         <div className="text-center py-0.5">
                           <div className="flex items-center justify-center">
                             <div className="text-right text-gray-500 whitespace-nowrap">Avg VL Share:</div>
                             <div 
                               className={`font-semibold ${getKpiColorClass("vlshare", kpiStatsData["30days"].vlShare.value) !== "text-[#FD7E14]" ? getKpiColorClass("vlshare", kpiStatsData["30days"].vlShare.value) : ""}`}
                               style={{marginLeft: '4px', ...getKpiStyle(getKpiColorClass("vlshare", kpiStatsData["30days"].vlShare.value))}}
                             >
                               {kpiStatsData["30days"].vlShare.value.toFixed(1)}%
                             </div>
                             <div className={`text-xs ${getKpiPillColor(kpiStatsData["30days"].vlShare.changePercent)} rounded-full px-1 py-0 whitespace-nowrap`} style={{marginLeft: '4px'}}>
                               {kpiStatsData["30days"].vlShare.changePercent}
                             </div>
                           </div>
                         </div>
                      </div>
                    </div>

                    {/* Last 6 Months (17) */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-center font-medium text-gray-700 mb-4">Last 6 Months (17)</h3>
                      <div className="space-y-1 mx-2">
                                                 {/* MC/ET */}
                         <div className="text-center py-0.5">
                           <div className="flex items-center justify-center">
                             <div className="text-right text-gray-500 whitespace-nowrap">Avg MC/ET:</div>
                             <div 
                               className={`font-semibold ${getKpiColorClass("mcet", kpiStatsData["6months"].mcet.value) !== "text-[#FD7E14]" ? getKpiColorClass("mcet", kpiStatsData["6months"].mcet.value) : ""}`}
                               style={{marginLeft: '4px', ...getKpiStyle(getKpiColorClass("mcet", kpiStatsData["6months"].mcet.value))}}
                             >
                               {kpiStatsData["6months"].mcet.value.toFixed(1)}
                             </div>
                             <div className={`text-xs ${getKpiPillColor(kpiStatsData["6months"].mcet.changePercent)} rounded-full px-1 py-0 whitespace-nowrap`} style={{marginLeft: '4px'}}>
                               {kpiStatsData["6months"].mcet.changePercent}
                             </div>
                           </div>
                         </div>
                         
                         {/* TMA */}
                         <div className="text-center py-0.5">
                           <div className="flex items-center justify-center">
                             <div className="text-right text-gray-500 whitespace-nowrap">Avg TMA:</div>
                             <div 
                               className={`font-semibold ${getKpiColorClass("tma", kpiStatsData["6months"].tma.value) !== "text-[#FD7E14]" ? getKpiColorClass("tma", kpiStatsData["6months"].tma.value) : ""}`}
                               style={{marginLeft: '4px', ...getKpiStyle(getKpiColorClass("tma", kpiStatsData["6months"].tma.value))}}
                             >
                               {kpiStatsData["6months"].tma.value.toFixed(1)}%
                             </div>
                             <div className={`text-xs ${getKpiPillColor(kpiStatsData["6months"].tma.changePercent)} rounded-full px-1 py-0 whitespace-nowrap`} style={{marginLeft: '4px'}}>
                               {kpiStatsData["6months"].tma.changePercent}
                             </div>
                           </div>
                         </div>
                         
                         {/* VL Share */}
                         <div className="text-center py-0.5">
                           <div className="flex items-center justify-center">
                             <div className="text-right text-gray-500 whitespace-nowrap">Avg VL Share:</div>
                             <div 
                               className={`font-semibold ${getKpiColorClass("vlshare", kpiStatsData["6months"].vlShare.value) !== "text-[#FD7E14]" ? getKpiColorClass("vlshare", kpiStatsData["6months"].vlShare.value) : ""}`}
                               style={{marginLeft: '4px', ...getKpiStyle(getKpiColorClass("vlshare", kpiStatsData["6months"].vlShare.value))}}
                             >
                               {kpiStatsData["6months"].vlShare.value.toFixed(1)}%
                             </div>
                             <div className={`text-xs ${getKpiPillColor(kpiStatsData["6months"].vlShare.changePercent)} rounded-full px-1 py-0 whitespace-nowrap`} style={{marginLeft: '4px'}}>
                               {kpiStatsData["6months"].vlShare.changePercent}
                             </div>
                           </div>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Chart */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Monatlicher Trend-Verlauf</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={historyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#6b7280"
                          fontSize={12}
                        />
                        <YAxis 
                          yAxisId="mcet"
                          domain={[0, 6]}
                          stroke="#6b7280"
                          fontSize={12}
                          label={{ value: 'MC/ET', angle: -90, position: 'insideLeft' }}
                        />
                        <YAxis 
                          yAxisId="percentage"
                          orientation="right"
                          domain={[0, 100]}
                          stroke="#6b7280"
                          fontSize={12}
                          label={{ value: 'Prozent (%)', angle: 90, position: 'insideRight' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          formatter={(value, name) => [
                            name === 'mcet' ? value : `${value}%`,
                            name === 'mcet' ? 'MC/ET' : name === 'tma' ? 'TMA' : 'VL Share'
                          ]}
                        />
                        <Line 
                          yAxisId="mcet"
                          type="monotone" 
                          dataKey="mcet" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                        />
                        <Line 
                          yAxisId="percentage"
                          type="monotone" 
                          dataKey="tma" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                        />
                        <Line 
                          yAxisId="percentage"
                          type="monotone" 
                          dataKey="vl" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    
                    {/* Legend */}
                    <div className="flex justify-center space-x-6 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">MC/ET (Linke Skala)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">TMA (%)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">VL Share (%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {kpiPopupActiveTab === "mystery-shop" && (
                <div className="space-y-6">
                  {/* Three timeframes in horizontal layout */}
                  <div className="grid grid-cols-3 gap-6">
                    {/* All Time */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-center font-medium text-gray-700 mb-4">All Time</h3>
                      <div className="space-y-1 mx-2">
                        <div className="text-center py-0.5">
                          <div className="flex items-center justify-center mb-1">
                            <div 
                              className={`font-semibold ${getMysteryShopColorClass(mysteryShopStatsData["alltime"].value)}`}
                            >
                              {mysteryShopStatsData["alltime"].value.toFixed(1)}%
                            </div>
                            <div className={`text-xs ${getMysteryShopPillColor(mysteryShopStatsData["alltime"].changePercent)} rounded-full px-1 py-0 whitespace-nowrap`} style={{marginLeft: '4px'}}>
                              {mysteryShopStatsData["alltime"].changePercent}
                            </div>
                          </div>
                          <div className="text-gray-500 text-sm">Avg Mystery Shop:</div>
                        </div>
                      </div>
                    </div>

                    {/* Last 30 Days */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-center font-medium text-gray-700 mb-4">Last 30 Days</h3>
                      <div className="space-y-1 mx-2">
                        <div className="text-center py-0.5">
                          <div className="flex items-center justify-center mb-1">
                            <div 
                              className={`font-semibold ${getMysteryShopColorClass(mysteryShopStatsData["30days"].value)}`}
                            >
                              {mysteryShopStatsData["30days"].value.toFixed(1)}%
                            </div>
                            <div className={`text-xs ${getMysteryShopPillColor(mysteryShopStatsData["30days"].changePercent)} rounded-full px-1 py-0 whitespace-nowrap`} style={{marginLeft: '4px'}}>
                              {mysteryShopStatsData["30days"].changePercent}
                            </div>
                          </div>
                          <div className="text-gray-500 text-sm">Avg Mystery Shop:</div>
                        </div>
                      </div>
                    </div>

                    {/* Last 6 Months */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-center font-medium text-gray-700 mb-4">Last 6 Months</h3>
                      <div className="space-y-1 mx-2">
                        <div className="text-center py-0.5">
                          <div className="flex items-center justify-center mb-1">
                            <div 
                              className={`font-semibold ${getMysteryShopColorClass(mysteryShopStatsData["6months"].value)}`}
                            >
                              {mysteryShopStatsData["6months"].value.toFixed(1)}%
                            </div>
                            <div className={`text-xs ${getMysteryShopPillColor(mysteryShopStatsData["6months"].changePercent)} rounded-full px-1 py-0 whitespace-nowrap`} style={{marginLeft: '4px'}}>
                              {mysteryShopStatsData["6months"].changePercent}
                            </div>
                          </div>
                          <div className="text-gray-500 text-sm">Avg Mystery Shop:</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Chart */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Mystery Shop Trend-Verlauf</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={mysteryShopHistoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="shop" 
                          stroke="#6b7280"
                          fontSize={12}
                        />
                        <YAxis 
                          domain={[75, 100]}
                          stroke="#6b7280"
                          fontSize={12}
                          label={{ value: 'Prozent (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          formatter={(value) => [`${value}%`, 'Mystery Shop']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="percentage" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    
                    {/* Legend */}
                    <div className="flex justify-center mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Mystery Shop (%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

      {/* Promotor Selection Modal */}
      {showPromotorSelection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card 
            className="w-full max-w-4xl border border-gray-200 shadow-sm max-h-[90vh] overflow-hidden bg-white"
          >
            <CardHeader className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Promotoren auswählen</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPromotorSelection(false)}
                  className="h-8 w-8 text-gray-900 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
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
                    className="px-3 py-1.5 text-sm border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-0 placeholder-gray-400"
                  />
                </div>
                
                {/* Filter Options */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveRegionFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gray-100/70 text-gray-700 hover:bg-gray-200/80 ${
                    activeRegionFilter === "all"
                      ? "scale-110"
                      : ""
                  }`}
                >
                  Alle
                </button>
                <button
                  onClick={() => setActiveRegionFilter("wien-noe-bgl")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("wien-noe-bgl")} ${getRegionBorder("wien-noe-bgl")} ${
                    activeRegionFilter === "wien-noe-bgl"
                      ? "scale-110"
                      : ""
                  }`}
                >
                  W/NÖ/BGL
                </button>
                <button
                  onClick={() => setActiveRegionFilter("steiermark")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("steiermark")} ${getRegionBorder("steiermark")} ${
                    activeRegionFilter === "steiermark"
                      ? "scale-110"
                      : ""
                  }`}
                >
                  ST
                </button>
                <button
                  onClick={() => setActiveRegionFilter("salzburg")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("salzburg")} ${getRegionBorder("salzburg")} ${
                    activeRegionFilter === "salzburg"
                      ? "scale-110"
                      : ""
                  }`}
                >
                  SBG
                </button>
                <button
                  onClick={() => setActiveRegionFilter("oberoesterreich")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("oberoesterreich")} ${getRegionBorder("oberoesterreich")} ${
                    activeRegionFilter === "oberoesterreich"
                      ? "scale-110"
                      : ""
                  }`}
                >
                  OÖ
                </button>
                <button
                  onClick={() => setActiveRegionFilter("tirol")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("tirol")} ${getRegionBorder("tirol")} ${
                    activeRegionFilter === "tirol"
                      ? "scale-110"
                      : ""
                  }`}
                >
                  T
                </button>
                <button
                  onClick={() => setActiveRegionFilter("vorarlberg")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("vorarlberg")} ${getRegionBorder("vorarlberg")} ${
                    activeRegionFilter === "vorarlberg"
                      ? "scale-110"
                      : ""
                  }`}
                >
                  V
                </button>
                <button
                  onClick={() => setActiveRegionFilter("kaernten")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("kaernten")} ${getRegionBorder("kaernten")} ${
                    activeRegionFilter === "kaernten"
                      ? "scale-110"
                      : ""
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
            </CardHeader>
            
            <CardContent 
              className="p-6 flex flex-col h-[400px] [&::-webkit-scrollbar]:hidden" 
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {(() => {
                  console.log('🔍 Modal render - allPromotors:', allPromotors.length);
                  console.log('🔍 Modal render - activeRegionFilter:', activeRegionFilter);
                  console.log('🔍 Modal render - promotorSelectionSearch:', promotorSelectionSearch);
                  
                  const filtered = allPromotors.filter(promotor => 
                    (activeRegionFilter === "all" || promotor.region === activeRegionFilter) &&
                    promotor.name.toLowerCase().includes(promotorSelectionSearch.toLowerCase())
                  );
                  
                  console.log('🔍 Modal render - filtered promotors:', filtered.length);
                  return filtered;
                })()}
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
                    <Button
                      onClick={() => setShowPromotorSelection(false)}
                      variant="ghost"
                      className="bg-white/40 text-gray-700 hover:bg-white/60 border border-gray-200/50 backdrop-blur-sm"
                    >
                      Bestätigen
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Message Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card 
            className="w-full max-w-md border border-gray-200 shadow-sm bg-white"
          >
            <CardHeader className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-900" />
                  <CardTitle className="text-lg font-semibold text-gray-900">Nachricht planen</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowScheduleModal(false)}
                  className="h-8 w-8 text-gray-900 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-4">
              {/* Message Preview */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Nachricht</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 max-h-24 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {messageText || "Keine Nachricht eingegeben..."}
                </div>
              </div>
              
              {/* Recipients Preview */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Empfänger</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
                  {selectedPromotors.length === 0 
                    ? "Keine Promotoren ausgewählt..."
                    : selectedPromotors.length === 1 
                    ? selectedPromotors[0]
                    : `${selectedPromotors.length} Promotoren ausgewählt`
                  }
                </div>
              </div>
              
              {/* Date Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Datum</label>
                <DatePicker
                  value={scheduleDate}
                  onChange={(value) => setScheduleDate(value)}
                  className="w-full"
                />
              </div>
              
              {/* Time Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Uhrzeit</label>
                <TimePicker
                  value={scheduleTime}
                  onChange={(value) => setScheduleTime(value)}
                  className="w-full"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleScheduleMessage}
                  disabled={!messageText.trim() || !scheduleDate || !scheduleTime || selectedPromotors.length === 0}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  Planen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Message Detail Modal */}
      {showMessageDetail && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card 
            className="w-full max-w-md border border-gray-200 shadow-sm bg-white"
          >
            <CardHeader className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {selectedMessage?.sent ? "Gesendete Nachricht" : "Geplante Nachricht"}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {!selectedMessage?.sent && (
                    <>
                      <button
                        onClick={() => {
                          if (isEditingMessage) {
                            handleSaveMessage();
                          } else {
                            setIsEditingMessage(true);
                          }
                        }}
                        className="h-5 w-5 text-black opacity-50 hover:opacity-75 transition-opacity"
                      >
                        {isEditingMessage ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <Edit3 className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={handleDeleteClick}
                        className={`p-1 text-gray-400 hover:text-red-500 transition-colors ${
                          deleteConfirmationState ? 'animate-vibrate text-red-500' : ''
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMessageDetail(false)}
                    className="h-8 w-8 text-gray-900 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-4">
              {/* Message Content */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Nachricht</label>
                {isEditingMessage && !selectedMessage?.sent ? (
                  <textarea
                    value={editedMessageText}
                    onChange={(e) => setEditedMessageText(e.target.value)}
                    className="w-full p-3 border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 text-sm min-h-24 max-h-32 resize-none overflow-y-auto [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
                    {selectedMessage.fullText}
                  </div>
                )}
              </div>
              
              {/* Schedule Information */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Datum</label>
                  {isEditingMessage && !selectedMessage?.sent ? (
                    <DatePicker
                      value={editedDate}
                      onChange={(value) => setEditedDate(value)}
                      className="w-full"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
                      {selectedMessage.date}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Zeit</label>
                  {isEditingMessage && !selectedMessage?.sent ? (
                    <TimePicker
                      value={editedTime}
                      onChange={(value) => setEditedTime(value)}
                      className="w-full"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
                      {selectedMessage.time}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Recipients */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Empfänger</label>
                <div className="space-y-2 max-h-24 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <div>
                    <p className="text-[11px] text-gray-500 mb-1">Gelesen</p>
                    <div className="flex flex-wrap gap-2">
                      {(selectedMessage.readBy || []).map((promotor: string, index: number) => {
                        const region = getPromotorRegion(promotor);
                        const colors = getRegionPillColors(region);
                        return (
                          <span key={`read-${index}`} className={`px-2 py-1 rounded-full text-xs border ${colors} flex items-center gap-1`}>
                            <Check className="h-3 w-3 text-green-600" /> {promotor}
                          </span>
                        );
                      })}
                      {(!selectedMessage.readBy || selectedMessage.readBy.length === 0) && (
                        <span className="text-xs text-gray-400">Keine</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 mb-1">Ungelesen</p>
                    <div className="flex flex-wrap gap-2">
                      {(selectedMessage.unreadBy || selectedMessage.promotors || []).filter((p: string) => !(selectedMessage.readBy || []).includes(p)).map((promotor: string, index: number) => {
                        const region = getPromotorRegion(promotor);
                        const colors = getRegionPillColors(region);
                        return (
                          <span key={`unread-${index}`} className={`px-2 py-1 rounded-full text-xs border ${colors} opacity-60`}>
                            {promotor}
                          </span>
                        );
                      })}
                    </div>
                  </div>
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