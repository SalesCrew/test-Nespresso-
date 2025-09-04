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
  Thermometer,
  AlertTriangle,
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
  
  // State for today's assignments
  const [todaysEinsaetze, setTodaysEinsaetze] = useState<any[]>([]);
  const [todaysEinsaetzeLoading, setTodaysEinsaetzeLoading] = useState(true);
  
  // State for detailed assignment view
  const [showAssignmentDetailModal, setShowAssignmentDetailModal] = useState(false);
  const [selectedAssignmentDetail, setSelectedAssignmentDetail] = useState<any | null>(null);
  
  // State for photo lightbox
  const [showPhotoLightbox, setShowPhotoLightbox] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{url: string, title: string} | null>(null);
  

  
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
  const [activePromotorsData, setActivePromotorsData] = useState<any[]>([]);
  
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
        
        // Prepare active promotors data and count their past assignments
        const activePromsData = await Promise.all((data?.promotors || []).map(async (promotor: any) => {
          // Count assignments where this promotor was "verplant" (assigned)
          let totalEinsaetze = 0;
          try {
            const svc = await fetch('/api/assignments', { cache: 'no-store' });
            const assignmentData = await svc.json();
            if (Array.isArray(assignmentData?.assignments)) {
              // Count assignments where this promotor is the lead
              totalEinsaetze = assignmentData.assignments.filter((assignment: any) => 
                assignment.lead_user_id === promotor.id
              ).length;
            }
          } catch (err) {
            console.error('Error counting assignments for promotor:', promotor.id, err);
          }
          
          return {
            id: promotor.id,
            name: promotor.name || 'Unbekannt',
            phone: promotor.phone || '',
            email: promotor.email || '',
            location: promotor.address || promotor.region || 'Unbekannt',
            status: 'aktiv',
            totalEinsaetze
          };
        }));
        
        setActivePromotorsData(activePromsData);
        console.log('✅ Loaded active promotors:', activePromsData.length);
        console.log('✅ First promotor:', list[0]);
        setAllPromotors(list);
      } catch (error) {
        console.error('Error loading promotors:', error);
        setAllPromotors([]);
      }
    };
    
    // Function to check and send due scheduled messages
    const checkScheduledMessages = async () => {
      try {
        const response = await fetch('/api/messages/send-scheduled', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.sent_count > 0) {
            console.log(`📤 Auto-sent ${result.sent_count} scheduled messages`);
            // Refresh both scheduled and history when messages are sent
            await loadScheduledMessages();
            await loadMessageHistory();
          }
        }
      } catch (error) {
        console.error('Error checking scheduled messages:', error);
      }
    };
    
    loadPromotors();
    loadScheduledMessages();
    loadMessageHistory();
    loadTodaysAssignments(); // Load today's assignments
    
    // Check for scheduled messages immediately and then every minute
    checkScheduledMessages();
    const interval = setInterval(checkScheduledMessages, 60000); // Every 60 seconds
    
    // Refresh today's assignments when window regains focus (after editing in einsatzplan)
    const handleFocus = () => {
      loadTodaysAssignments();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  // Scheduling states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduledMessages, setScheduledMessages] = useState<any[]>([]);
  const [scheduledMessagesLoading, setScheduledMessagesLoading] = useState(false);
  
  // Load scheduled messages from database
  const loadScheduledMessages = async () => {
    try {
      setScheduledMessagesLoading(true);
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        // Filter for scheduled messages only and format for UI
        const scheduledOnly = (data.messages || [])
          .filter((msg: any) => msg.status === 'scheduled')
          .map((msg: any) => {
            const scheduleDate = new Date(msg.scheduled_send_time);
            const recipients = msg.recipients || [];
            const recipientCount = recipients.length;
            
            return {
              id: msg.id,
              preview: msg.message_text.substring(0, 50) + (msg.message_text.length > 50 ? "..." : ""),
              fullText: msg.message_text,
              time: scheduleDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
              date: scheduleDate.toLocaleDateString('de-DE', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'short' 
              }),
              dateISO: scheduleDate.toISOString().split('T')[0],
              recipients: recipientCount === 1 
                ? recipients[0]?.recipient_name || 'Promotor'
                : `${recipientCount} Promotoren`,
              promotors: recipients.map((r: any) => r.recipient_name).filter(Boolean),
              messageType: msg.message_type,
              sent: false
            };
          });
        setScheduledMessages(scheduledOnly);
      }
    } catch (error) {
      console.error('Error loading scheduled messages:', error);
      setScheduledMessages([]);
    } finally {
      setScheduledMessagesLoading(false);
    }
  };

  // Toggle state for scheduled messages vs history
  const [showHistory, setShowHistory] = useState(false);

  // History data for sent messages (both scheduled and instant)
  const [messageHistory, setMessageHistory] = useState<any[]>([]);
  const [messageHistoryLoading, setMessageHistoryLoading] = useState(false);
  
  // Load message history from database
  const loadMessageHistory = async () => {
    try {
      setMessageHistoryLoading(true);
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        // Filter for sent messages and format for UI
        const sentMessages = (data.messages || [])
          .filter((msg: any) => msg.status === 'sent')
          .map((msg: any) => {
            const sentDate = new Date(msg.sent_at || msg.created_at);
            const recipients = msg.recipients || [];
            const recipientCount = recipients.length;
            
            // Extract promotor names and who has read the message
            const promotorNames = recipients.map((r: any) => r.recipient_name).filter(Boolean);
            const readByNames = recipients
              .filter((r: any) => r.read_at)
              .map((r: any) => r.recipient_name)
              .filter(Boolean);
            
            return {
              id: msg.id,
              preview: msg.message_text.substring(0, 50) + (msg.message_text.length > 50 ? "..." : ""),
              fullText: msg.message_text,
              time: sentDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
              date: sentDate.toLocaleDateString('de-DE', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              }),
              recipients: recipientCount === 1 
                ? promotorNames[0] || 'Promotor'
                : recipientCount === promotorNames.length
                  ? "Alle"
                  : `${recipientCount} Promotoren`,
              promotors: promotorNames,
              readBy: readByNames,
              sent: true,
              type: msg.scheduled_send_time ? "scheduled" : "instant",
              messageType: msg.message_type
            };
          });
        setMessageHistory(sentMessages);
      }
    } catch (error) {
      console.error('Error loading message history:', error);
      setMessageHistory([]);
    } finally {
      setMessageHistoryLoading(false);
    }
  };
  
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
    
    console.log('🤖 Starting AI enhancement for text:', messageText.substring(0, 100) + '...');
    setIsEnhancing(true);
    
    try {
      console.log('📤 Sending request to /api/ai/enhance-message');
      const res = await fetch('/api/ai/enhance-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText })
      })
      
      console.log('📥 Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ AI enhance error:', {
          status: res.status,
          statusText: res.statusText,
          errorBody: errorText
        });
      } else {
        const data = await res.json().catch(() => ({}));
        console.log('📝 Enhancement response:', {
          hasText: !!data?.text,
          enhancedLength: data?.text?.length || 0,
          enhancedPreview: data?.text ? data.text.substring(0, 100) + '...' : 'No text'
        });
        
        if (data?.text) {
          console.log('✅ Setting enhanced text');
          setMessageText(data.text);
        } else {
          console.warn('⚠️ No enhanced text in response');
        }
      }
    } catch (error) {
      console.error('❌ Error enhancing text:', error);
    } finally {
      console.log('🏁 AI enhancement process completed');
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
        
        // Refresh scheduled messages from database
        await loadScheduledMessages();
    
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
  const handleDeleteScheduledMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        // Refresh scheduled messages
        await loadScheduledMessages();
      } else {
        console.error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting scheduled message:', error);
    }
  };

  // Function to handle delete button click in message detail popup
  const handleDeleteClick = async () => {
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
        await handleDeleteScheduledMessage(selectedMessage.id);
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

  // State for special status requests
  const [specialStatusRequests, setSpecialStatusRequests] = useState<any[]>([]);
  const [specialStatusRequestsLoading, setSpecialStatusRequestsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadTodaysAssignments();
    loadSpecialStatusRequests();
  }, []);

  // Use real promotor data instead of mock data
  const activePromotors = activePromotorsData;

  // Function to load today's assignments
  const loadTodaysAssignments = async () => {
    try {
      setTodaysEinsaetzeLoading(true);
      const response = await fetch('/api/assignments/today');
      const data = await response.json();
      
      if (response.ok && data.assignments) {
        // Transform the data to match the expected format
        const transformedData = data.assignments.map((a: any) => ({
          id: a.assignment_id,
          market: a.title || 'N/A',
          address: a.location_text || '',
          plz: a.postal_code || '',
          city: a.city || '',
          promotor: a.promotor_name || 'N/A',
          buddyName: a.buddy_name,
          planStart: a.planned_start ? a.planned_start.substring(11, 16) : '09:30',
          planEnd: a.planned_end ? a.planned_end.substring(11, 16) : '18:30',
          actualStart: a.actual_start_time ? a.actual_start_time.substring(11, 16) : null,
          actualEnd: a.actual_end_time ? a.actual_end_time.substring(11, 16) : null,
          status: a.display_status,
          tracking_status: a.tracking_status,
          participant_status: a.participant_status,
          user_id: a.user_id,
          tracking_id: a.tracking_id,
          notes: a.notes,
          early_start_reason: a.early_start_reason,
          minutes_early_start: a.minutes_early_start,
          early_end_reason: a.early_end_reason,
          minutes_early_end: a.minutes_early_end,
          foto_maschine_url: a.foto_maschine_url,
          foto_kapsellade_url: a.foto_kapsellade_url,
          foto_pos_gesamt_url: a.foto_pos_gesamt_url
        }));
        setTodaysEinsaetze(transformedData);
      } else {
        console.error('Failed to load assignments:', data.error);
        setTodaysEinsaetze([]);
      }
    } catch (error) {
      console.error('Error loading today\'s assignments:', error);
      setTodaysEinsaetze([]);
    } finally {
      setTodaysEinsaetzeLoading(false);
    }
  };

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
    // Red for special statuses (krankenstand, urlaub, zeitausgleich, notfall)
    if (['krankenstand', 'urlaub', 'zeitausgleich', 'notfall'].includes(einsatz.status)) {
      return 'red';
    }
    
    // Green for started or completed
    if (einsatz.status === 'gestartet' || einsatz.status === 'beendet' || einsatz.actualStart) {
      return 'green';
    }
    
    // Orange for verspätet
    if (einsatz.status === 'verspätet') {
        return 'orange';
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
    const started = filteredEinsaetze.filter(e => e.status === 'gestartet' || e.status === 'beendet' || e.actualStart).length;
    const cancelled = filteredEinsaetze.filter(e => ['krankenstand', 'urlaub', 'zeitausgleich', 'notfall'].includes(e.status)).length;
    const notStarted = filteredEinsaetze.filter(e => ['pending', 'verspätet'].includes(e.status)).length;
    const completed = started + cancelled;
    const total = filteredEinsaetze.length;
    const completionPercentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { started, cancelled, notStarted, completionPercentage };
  };

  // Get status color for a location based on einsätze in that location
  const getLocationStatusColor = (location: string) => {
    const locationEinsaetze = todaysEinsaetze.filter(e => `${e.plz} ${e.city}` === location);
    
    // Check for special statuses first (highest priority)
    if (locationEinsaetze.some(e => ['krankenstand', 'urlaub', 'zeitausgleich', 'notfall'].includes(e.status))) return 'red';
    
    // Check for started
    if (locationEinsaetze.some(e => e.status === 'gestartet' || e.status === 'beendet' || e.actualStart)) return 'green';
    
    // Check for verspätet
    if (locationEinsaetze.some(e => e.status === 'verspätet')) return 'orange';
    
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

  // Load special status requests
  const loadSpecialStatusRequests = async () => {
    try {
      setSpecialStatusRequestsLoading(true);
      const response = await fetch('/api/special-status/requests');
      
      if (response.ok) {
        const data = await response.json();
        setSpecialStatusRequests(data.requests || []);
      } else {
        // Silently fail if the table doesn't exist yet
        console.warn('Special status requests feature not available yet');
        setSpecialStatusRequests([]);
      }
    } catch (error) {
      console.warn('Special status requests feature not available:', error);
      setSpecialStatusRequests([]);
    } finally {
      setSpecialStatusRequestsLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/special-status/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });

      if (response.ok) {
        // Reload requests and assignments
        loadSpecialStatusRequests();
        loadTodaysAssignments();
      } else {
        console.error('Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/special-status/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline' })
      });

      if (response.ok) {
        // Reload requests
        loadSpecialStatusRequests();
      } else {
        console.error('Failed to decline request');
      }
    } catch (error) {
      console.error('Error declining request:', error);
    }
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
                  {todaysEinsaetzeLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Lade heutige Einsätze...</p>
                      </div>
                    </div>
                  ) : filteredEinsaetze.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Keine Einsätze für heute</p>
                      </div>
                    </div>
                  ) : viewMode === 'list' ? (
                    <div className="space-y-2">
                      {filteredEinsaetze.map((einsatz) => {
                        const statusColor = getStatusColor(einsatz);
                        return (
                          <div 
                            key={einsatz.id} 
                            className={`p-4 rounded-lg border border-gray-100 transition-all duration-200 hover:border-gray-200 hover:shadow-sm cursor-pointer ${
                              statusColor === 'green' 
                                ? 'bg-gradient-to-r from-white to-green-50/35' 
                                : statusColor === 'orange'
                                ? 'bg-gradient-to-r from-white to-orange-50/35'
                                : statusColor === 'red'
                                ? 'bg-gradient-to-r from-white to-red-50/35'
                                : 'bg-white'
                            }`}
                            onClick={() => {
                              setSelectedAssignmentDetail(einsatz);
                              setShowAssignmentDetailModal(true);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="grid grid-cols-5 gap-4 flex-1 items-center">
                                <div className="min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {einsatz.buddyName ? `${einsatz.promotor} & ${einsatz.buddyName}` : einsatz.promotor}
                                  </h4>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openInGoogleMaps(einsatz.address, einsatz.city);
                                    }}
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
                                  {einsatz.buddyName ? (
                                    <div className="space-y-1">
                                      <div>{einsatz.promotor}: {formatTime(einsatz.actualStart)} - {formatTime(einsatz.actualEnd)}</div>
                                      <div>{einsatz.buddyName}: --:-- - --:--</div>
                                    </div>
                                  ) : (
                                  <span>{formatTime(einsatz.actualStart)} - {formatTime(einsatz.actualEnd)}</span>
                                  )}
                                </div>
                                <div className="text-xs text-right">
                                  {['krankenstand', 'urlaub', 'zeitausgleich', 'notfall'].includes(einsatz.status) ? (
                                    <span className="text-red-600 font-medium">
                                      {einsatz.status}
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
                            className={`p-3 rounded-lg border border-gray-100 transition-all duration-200 hover:border-gray-200 hover:shadow-sm cursor-pointer ${
                              statusColor === 'green' 
                                ? 'bg-gradient-to-br from-white to-green-50/35' 
                                : statusColor === 'orange'
                                ? 'bg-gradient-to-br from-white to-orange-50/35'
                                : statusColor === 'red'
                                ? 'bg-gradient-to-br from-white to-red-50/35'
                                : 'bg-white'
                            }`}
                            onClick={() => {
                              setSelectedAssignmentDetail(einsatz);
                              setShowAssignmentDetailModal(true);
                            }}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-medium text-gray-900 truncate">
                                  {einsatz.buddyName ? `${einsatz.promotor} & ${einsatz.buddyName}` : einsatz.promotor}
                                </h4>
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
                                {einsatz.buddyName ? (
                                  <div className="space-y-1">
                                    <div className="truncate">{einsatz.promotor}: {formatTime(einsatz.actualStart)} - {formatTime(einsatz.actualEnd)}</div>
                                    <div className="truncate">{einsatz.buddyName}: {einsatz.buddy_tracking?.actual_start_time ? einsatz.buddy_tracking.actual_start_time.substring(11, 16) : '--:--'} - {einsatz.buddy_tracking?.actual_end_time ? einsatz.buddy_tracking.actual_end_time.substring(11, 16) : '--:--'}</div>
                                  </div>
                                ) : (
                                  <div>{formatTime(einsatz.actualStart)} - {formatTime(einsatz.actualEnd)}</div>
                                )}
                              </div>
                              <div className="text-xs">
                                {['krankenstand', 'urlaub', 'zeitausgleich', 'notfall'].includes(einsatz.status) ? (
                                  <span className="text-red-600 font-medium text-xs">
                                    {einsatz.status}
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
                    <p className="text-2xl font-semibold text-gray-900">{specialStatusRequests.length}</p>
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
                      
                      {/* Scanning Line Animation - Moving scan lines */}
                      {isEnhancing && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 rounded-lg">
                          {/* Vertical scanning line */}
                          <div 
                            className="absolute h-full w-1 bg-gradient-to-b from-transparent via-white to-transparent opacity-90 shadow-lg"
                            style={{
                              left: '0%',
                              filter: 'blur(1px)',
                              animation: 'scanHorizontal 2s linear infinite'
                            }}
                          />
                          {/* Horizontal scanning line */}
                          <div 
                            className="absolute w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-90 shadow-lg"
                            style={{
                              top: '0%',
                              filter: 'blur(1px)',
                              animation: 'scanVertical 2s linear infinite'
                            }}
                          />
                      <style jsx>{`
                            @keyframes scanHorizontal {
                              0% { left: -1px; }
                              100% { left: calc(100% + 1px); }
                            }
                            @keyframes scanVertical {
                              0% { top: -1px; }
                              100% { top: calc(100% + 1px); }
                        }
                      `}</style>
                        </div>
                      )}

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
                            
                            console.log('📤 Sending message with data:', {
                              message_text: messageText,
                              message_type: enableTwoStep ? 'confirmation_required' : 'normal',
                              recipient_ids: promotorIds,
                              send_immediately: true
                            });
                            
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
                              // Refresh message history since a new message was sent
                              await loadMessageHistory();
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
                            messageHistoryLoading ? (
                              <div className="flex items-center justify-center h-16">
                                <div className="text-xs text-gray-500">Lade Nachrichtenverlauf...</div>
                              </div>
                            ) : messageHistory.length === 0 ? (
                              <div className="flex items-center justify-center h-16">
                                <div className="text-xs text-gray-500">Kein Nachrichtenverlauf</div>
                              </div>
                            ) : (
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
                            )
                          ) : (
                            // Show scheduled messages
                            scheduledMessagesLoading ? (
                              <div className="flex items-center justify-center h-16">
                                <div className="text-xs text-gray-500">Lade geplante Nachrichten...</div>
                              </div>
                            ) : scheduledMessages.length === 0 ? (
                              <div className="flex items-center justify-center h-16">
                                <div className="text-xs text-gray-500">Keine geplanten Nachrichten</div>
                              </div>
                            ) : (
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
                            )
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
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {einsatz.buddyName ? `${einsatz.promotor} & ${einsatz.buddyName}` : einsatz.promotor}
                                  </h4>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openInGoogleMaps(einsatz.address, einsatz.city);
                                    }}
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
                                  {einsatz.buddyName ? (
                                    <div className="space-y-1">
                                      <div>{einsatz.promotor}: {formatTime(einsatz.actualStart)} - {formatTime(einsatz.actualEnd)}</div>
                                      <div>{einsatz.buddyName}: --:-- - --:--</div>
                                    </div>
                                  ) : (
                                  <span>{formatTime(einsatz.actualStart)} - {formatTime(einsatz.actualEnd)}</span>
                                  )}
                                </div>
                                <div className="text-xs text-center flex items-center justify-end space-x-2">
                                  {['krankenstand', 'urlaub', 'zeitausgleich', 'notfall'].includes(einsatz.status) ? (
                                    <span className="text-red-600 font-medium text-xs">
                                      {einsatz.status}
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
                                <h4 className="text-xs font-medium text-gray-900 truncate">
                                  {einsatz.buddyName ? `${einsatz.promotor} & ${einsatz.buddyName}` : einsatz.promotor}
                                </h4>
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
                                {einsatz.buddyName ? (
                                  <div className="space-y-1">
                                    <div className="truncate">{einsatz.promotor}: {formatTime(einsatz.actualStart)} - {formatTime(einsatz.actualEnd)}</div>
                                    <div className="truncate">{einsatz.buddyName}: {einsatz.buddy_tracking?.actual_start_time ? einsatz.buddy_tracking.actual_start_time.substring(11, 16) : '--:--'} - {einsatz.buddy_tracking?.actual_end_time ? einsatz.buddy_tracking.actual_end_time.substring(11, 16) : '--:--'}</div>
                                  </div>
                                ) : (
                                  <div>{formatTime(einsatz.actualStart)} - {formatTime(einsatz.actualEnd)}</div>
                                )}
                              </div>
                              <div className="text-xs">
                                {['krankenstand', 'urlaub', 'zeitausgleich', 'notfall'].includes(einsatz.status) ? (
                                  <span className="text-red-600 font-medium text-xs">
                                    {einsatz.status}
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
                      {specialStatusRequests.length} wartende Anfragen
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
              {specialStatusRequestsLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2">Lade Anfragen...</p>
                </div>
              ) : specialStatusRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Keine offenen Anfragen</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {specialStatusRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                        request.request_type === 'krankenstand' 
                          ? 'border-red-200 bg-gradient-to-r from-white to-red-50'
                          : 'border-orange-200 bg-gradient-to-r from-white to-orange-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            request.request_type === 'krankenstand' 
                              ? 'bg-red-100' 
                              : 'bg-orange-100'
                          }`}>
                            {request.request_type === 'krankenstand' ? (
                              <Thermometer className="h-5 w-5 text-red-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-orange-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-gray-900">
                                {request.user_profiles?.display_name || 'Unknown User'}
                              </h4>
                              <Badge 
                                variant={request.request_type === 'krankenstand' ? 'destructive' : 'default'}
                                className={`text-xs ${
                                  request.request_type === 'krankenstand' 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'bg-orange-100 text-orange-700'
                                }`}
                              >
                                {request.request_type === 'krankenstand' ? 'Krankenstand' : 'Notfall'}
                              </Badge>
                          </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Angefragt am {new Date(request.requested_at).toLocaleDateString('de-DE', { 
                                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                              })}
                            </p>
                            {request.reason && (
                              <p className="text-xs text-gray-600 mt-1">
                                <span className="font-medium">Grund:</span> {request.reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-green-50 rounded transition-colors"
                            title="Genehmigen"
                          >
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request.id)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-red-50 rounded transition-colors"
                            title="Ablehnen"
                          >
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="relative p-4 rounded-lg border border-gray-200 transition-all duration-300 hover:border-gray-300 hover:shadow-sm hover:scale-[1.02] bg-gradient-to-br from-white to-blue-50"
                  >
                    <div className="space-y-3 pb-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{promotor.name}</h4>
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">{promotor.phone}</p>
                        <p className="text-xs text-gray-600 truncate">{promotor.email}</p>
                        <p className="text-xs text-gray-600">{promotor.location}</p>
                      </div>
                        </div>
                    <div className="absolute bottom-4 left-4">
                        <span className="text-xs text-gray-500">{promotor.totalEinsaetze} Einsätze</span>
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
                })().map((promotor) => {
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
      {/* Assignment Detail Modal */}
      {showAssignmentDetailModal && selectedAssignmentDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border border-gray-200 shadow-sm max-h-[90vh] overflow-hidden bg-white">
            <CardHeader className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Einsatz Details</CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    {selectedAssignmentDetail.market} • {selectedAssignmentDetail.promotor}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAssignmentDetailModal(false)}
                  className="h-8 w-8 text-gray-900 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            

            
            <CardContent className="p-6 overflow-auto max-h-[70vh] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="space-y-6">
                
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Location</h4>
                    <p className="text-sm text-gray-600">{selectedAssignmentDetail.address}</p>
                    <p className="text-sm text-gray-600">{selectedAssignmentDetail.plz} {selectedAssignmentDetail.city}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Geplante Zeiten</h4>
                    <p className="text-sm text-gray-600">{selectedAssignmentDetail.planStart} - {selectedAssignmentDetail.planEnd}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Status</h4>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      getStatusColor(selectedAssignmentDetail) === 'green' ? 'bg-green-400' :
                      getStatusColor(selectedAssignmentDetail) === 'orange' ? 'bg-orange-400' :
                      getStatusColor(selectedAssignmentDetail) === 'red' ? 'bg-red-400' :
                      'bg-gray-300'
                    }`}></div>
                    <span className="text-sm text-gray-600">
                      {['krankenstand', 'urlaub', 'zeitausgleich', 'notfall'].includes(selectedAssignmentDetail.status) 
                        ? selectedAssignmentDetail.status 
                        : getStatusColor(selectedAssignmentDetail) === 'green' 
                        ? 'gestartet' 
                        : getStatusColor(selectedAssignmentDetail) === 'orange' 
                        ? 'verspätet' 
                        : 'pending'}
                    </span>
                  </div>
                </div>

                {/* Actual Times */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Tatsächliche Zeiten</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Start:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedAssignmentDetail.actualStart || '--:--'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ende:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedAssignmentDetail.actualEnd || '--:--'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Early Start Reasoning */}
                {selectedAssignmentDetail.early_start_reason && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Früher Start</h4>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Minuten zu früh:</span>
                        <span className="text-sm font-medium text-orange-700">
                          {selectedAssignmentDetail.minutes_early_start} Min
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 block mb-1">Begründung:</span>
                        <p className="text-sm text-gray-900 bg-white rounded p-2 border">
                          {selectedAssignmentDetail.early_start_reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Early End Reasoning */}
                {selectedAssignmentDetail.early_end_reason && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Früher Schluss</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Minuten zu früh beendet:</span>
                        <span className="text-sm font-medium text-blue-700">
                          {selectedAssignmentDetail.minutes_early_end} Min
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 block mb-1">Begründung:</span>
                        <p className="text-sm text-gray-900 bg-white rounded p-2 border">
                          {selectedAssignmentDetail.early_end_reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buddy Information */}
                {selectedAssignmentDetail.buddyName && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Buddy Tag</h4>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-sm text-gray-900">{selectedAssignmentDetail.buddyName}</p>
                      <p className="text-xs text-gray-500">Buddy für diesen Einsatz</p>
                    </div>
                  </div>
                )}

                {/* Photos Section */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Fotos</h4>
                  {(selectedAssignmentDetail.foto_maschine_url || selectedAssignmentDetail.foto_kapsellade_url || selectedAssignmentDetail.foto_pos_gesamt_url) ? (
                    <div className="grid grid-cols-1 gap-4">
                      {/* Foto Maschine */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">Foto Maschine</span>
                          {selectedAssignmentDetail.foto_maschine_url ? (
                            <span className="text-xs text-green-600">✓</span>
                          ) : (
                            <span className="text-xs text-gray-400">Nicht verfügbar</span>
                          )}
                        </div>
                        {selectedAssignmentDetail.foto_maschine_url ? (
                          <img 
                            src={selectedAssignmentDetail.foto_maschine_url} 
                            alt="Foto Maschine" 
                            className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setSelectedPhoto({ url: selectedAssignmentDetail.foto_maschine_url, title: "Foto Maschine" });
                              setShowPhotoLightbox(true);
                            }}
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-sm">Nicht verfügbar</span>
                          </div>
                        )}
                      </div>

                      {/* Foto Kapsellade */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">Foto Kapsellade</span>
                          {selectedAssignmentDetail.foto_kapsellade_url ? (
                            <span className="text-xs text-green-600">✓</span>
                          ) : (
                            <span className="text-xs text-gray-400">Nicht verfügbar</span>
                          )}
                        </div>
                        {selectedAssignmentDetail.foto_kapsellade_url ? (
                          <img 
                            src={selectedAssignmentDetail.foto_kapsellade_url} 
                            alt="Foto Kapsellade" 
                            className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setSelectedPhoto({ url: selectedAssignmentDetail.foto_kapsellade_url, title: "Foto Kapsellade" });
                              setShowPhotoLightbox(true);
                            }}
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-sm">Nicht verfügbar</span>
                          </div>
                        )}
                      </div>

                      {/* Foto POS gesamt */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">Foto POS gesamt</span>
                          {selectedAssignmentDetail.foto_pos_gesamt_url ? (
                            <span className="text-xs text-green-600">✓</span>
                          ) : (
                            <span className="text-xs text-gray-400">Nicht verfügbar</span>
                          )}
                        </div>
                        {selectedAssignmentDetail.foto_pos_gesamt_url ? (
                          <img 
                            src={selectedAssignmentDetail.foto_pos_gesamt_url} 
                            alt="Foto POS gesamt" 
                            className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setSelectedPhoto({ url: selectedAssignmentDetail.foto_pos_gesamt_url, title: "Foto POS gesamt" });
                              setShowPhotoLightbox(true);
                            }}
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-sm">Nicht verfügbar</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <div className="space-y-2">
                        <div className="text-gray-400 mx-auto w-12 h-12 flex items-center justify-center">
                          📸
                        </div>
                        <p className="text-sm text-gray-500">Keine Fotos verfügbar</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedAssignmentDetail.notes && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Notizen</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900">{selectedAssignmentDetail.notes}</p>
                    </div>
                  </div>
                )}

              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {showPhotoLightbox && selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPhotoLightbox(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => setShowPhotoLightbox(false)}
              className="absolute top-4 right-4 z-60 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={selectedPhoto.url} 
              alt={selectedPhoto.title}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
              <p className="text-sm font-medium">{selectedPhoto.title}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 