"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  FileText,
  Info, // Added Info icon
  Inbox,
  MessageSquare,
  Package,
  Play,
  Plus,
  Settings,
  Send,
  X,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

export default function PromotorDashboard() {
  const [expandedTodos, setExpandedTodos] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [showBreakingNews, setShowBreakingNews] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", content: "Hallo! Wie kann ich Ihnen heute helfen?" },
  ])
  const [isSpinning, setIsSpinning] = useState(false)
  const [todoFilter, setTodoFilter] = useState("heute")
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const dropdownButtonRef = useRef<HTMLButtonElement>(null)
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [animating, setAnimating] = useState(false);
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [miniCalendarDisplayMonth, setMiniCalendarDisplayMonth] = useState(new Date()); // Month to display in mini calendar
  const miniCalendarButtonRef = useRef<HTMLButtonElement>(null);
  const miniCalendarPopupRef = useRef<HTMLDivElement>(null); // Ref for the mini calendar popup itself
  const [hoveredMiniCalendarDate, setHoveredMiniCalendarDate] = useState<Date | null>(null);
  const [showMapsModal, setShowMapsModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [showBitteLesen, setShowBitteLesen] = useState(true);

  // State for legend popup
  const [showLegendPopup, setShowLegendPopup] = useState(false);
  const legendIconRef = useRef<HTMLButtonElement>(null);
  const legendPopupRef = useRef<HTMLDivElement>(null);

  // State for animated footer indicator
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const footerButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // No explicit initialization needed here if directly assigning in JSX

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Get an array of 9 days centered around currentCalendarDate (2 extra for animation)
  const getCalendarDays = () => {
    const days = [];
    const startDay = new Date(currentCalendarDate);
    startDay.setDate(currentCalendarDate.getDate() - 4); // Start 4 days before (one extra for animation)
    
    for (let i = 0; i < 9; i++) { // 9 days total (7 visible + 2 for animation)
      const day = new Date(startDay);
      day.setDate(startDay.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Navigate days forward or backward by a number of steps
  const navigateDays = (steps: number) => {
    if (animating || steps === 0) return; // Prevent multiple animations and no-op

    setAnimating(true);

    // After a small delay for animation setup
    setTimeout(() => {
      const newCurrentDate = new Date(currentCalendarDate);
      newCurrentDate.setDate(currentCalendarDate.getDate() + steps);
      setCurrentCalendarDate(newCurrentDate);
      setSelectedCalendarDate(newCurrentDate); // The new center day is also the selected day

      // Allow animations and clicks again after transition completes
      setTimeout(() => setAnimating(false), 400); // Duration of animation
    }, 50); // Small delay to allow current state to render before animating
  };

  useEffect(() => {
    if (chatOpen) {
      scrollToBottom()
    }
  }, [chatMessages, chatOpen])

  // Update footer indicator position when activeTab changes
  useEffect(() => {
    const activeButtonIndex = ["home", "einsatz", "chats", "kpis", "profil"].indexOf(activeTab);
    const activeButton = footerButtonRefs.current[activeButtonIndex];

    if (activeButton) {
      const targetLeft = activeButton.offsetLeft + activeButton.offsetWidth / 2;
      setIndicatorStyle({
        width: '2.75rem', // 44px
        height: '2.75rem', // 44px
        left: `${targetLeft}px`,
        top: '50%',
        transform: 'translate(-50%, -50%)',
        transition: 'left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)', // Adjusted cubic-bezier for less overshoot
      });
    }
  }, [activeTab]);

  // Track dropdown button position for accurate menu positioning
  useEffect(() => {
    if (showFilterDropdown && dropdownButtonRef.current) {
      const rect = dropdownButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX
      });
    }
  }, [showFilterDropdown]);

  // Handle option selection
  const handleFilterSelect = (filter: string) => {
    setTodoFilter(filter);
    setShowFilterDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterDropdown && 
          dropdownButtonRef.current && 
          !dropdownButtonRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    // Add user message
    const newMessages = [...chatMessages, { role: "user", content: chatInput }]
    setChatMessages(newMessages)
    setChatInput("")

    // Simulate AI response
    setTimeout(() => {
      setChatMessages([
        ...newMessages,
        { 
          role: "ai", 
          content: "Ich verarbeite Ihre Anfrage. Wie kann ich Ihnen weiter behilflich sein?" 
        }
      ])
    }, 1000)
  }

  // Mock data with one completed item
  const [todos, setTodos] = useState([
    // Today tasks
    { id: 1, title: "VTC für Promotion #4582 ausfüllen", priority: "high", due: "Heute, 08:00", completed: true, timeframe: "heute" },
    { id: 2, title: "Schulungsvideo ansehen", priority: "medium", due: "Heute, 14:00", completed: false, timeframe: "heute" },
    { id: 3, title: "Zeiterfassung aktualisieren", priority: "medium", due: "Heute, 18:00", completed: false, timeframe: "heute" },
    { id: 4, title: "Tagesbericht schreiben", priority: "high", due: "Heute, 19:00", completed: false, timeframe: "heute" },
    
    // Next 7 days tasks
    { id: 5, title: "Equipment für nächste Woche anfordern", priority: "low", due: "Morgen", completed: false, timeframe: "7tage" },
    { id: 6, title: "Teammeeting vorbereiten", priority: "medium", due: "Übermorgen", completed: false, timeframe: "7tage" },
    { id: 7, title: "Feedback zum Event einreichen", priority: "low", due: "In 3 Tagen", completed: false, timeframe: "7tage" },
    { id: 8, title: "Schulung absolvieren", priority: "high", due: "In 5 Tagen", completed: false, timeframe: "7tage" },
    { id: 9, title: "Wochenplanung aktualisieren", priority: "medium", due: "In 6 Tagen", completed: false, timeframe: "7tage" },
    
    // Next 30 days tasks
    { id: 10, title: "Monatsreport erstellen", priority: "high", due: "In 12 Tagen", completed: false, timeframe: "30tage" },
    { id: 11, title: "Urlaubsantrag stellen", priority: "low", due: "In 15 Tagen", completed: false, timeframe: "30tage" },
    { id: 12, title: "Mitarbeitergespräch vorbereiten", priority: "medium", due: "In 20 Tagen", completed: false, timeframe: "30tage" },
    { id: 13, title: "Inventur durchführen", priority: "medium", due: "In 25 Tagen", completed: false, timeframe: "30tage" },
    { id: 14, title: "Strategieplanung Q3", priority: "high", due: "In 28 Tagen", completed: false, timeframe: "30tage" },
  ])

  // Filter todos based on selected filter
  const filteredTodos = todos.filter(todo => {
    if (todoFilter === "heute") return todo.timeframe === "heute";
    if (todoFilter === "7tage") return todo.timeframe === "heute" || todo.timeframe === "7tage";
    if (todoFilter === "30tage") return true; // Show all todos
    return true;
  });

  // Sort todos to move completed items to the bottom
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1; // Move completed items to the end
  });

  // Calculate completed tasks count from filtered todos
  const completedTodos = sortedTodos.filter(todo => todo.completed).length;
  const totalTodos = sortedTodos.length;
  const completionPercentage = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

  // Toggle todo completion
  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const [assignments, setAssignments] = useState([
    { id: 1, title: "Mediamarkt, Seiersberg", location: "Wien, Mariahilferstraße", time: "10:00 - 18:00", date: new Date(), type: "promotion" },
    { id: 2, title: "Mediamarkt, Klagenfurt", location: "Klagenfurt, Völkermarkter Straße", time: "09:00 - 17:30", date: new Date(new Date().setDate(new Date().getDate() + 1)), type: "buddy" },
    { id: 3, title: "Einsatz Seiersberg", location: "Graz, Seiersberg", time: "12:00 - 16:00", date: new Date(), type: "promotion" },
    { id: 6, title: "Urlaub", location: "", time: "", date: new Date(new Date().setDate(new Date().getDate() + 5)), type: "urlaub" },
    { id: 7, title: "Newcomer Schulung", location: "Online Meetingraum", time: "14:00 - 18:00", date: new Date(new Date().setDate(20)), type: "schulung" },
    { id: 8, title: "Saturn, City Park", location: "Graz, Lazarettgürtel", time: "11:00 - 15:00", date: new Date(new Date().setDate(new Date().getDate() + 2)), type: "promotion" },
    { id: 9, title: "Hartlauer, Murpark", location: "Graz, Ostbahnstraße", time: "13:00 - 19:00", date: new Date(new Date().setDate(new Date().getDate() + 3)), type: "promotion" },
  ]);

  // Helper function to format month and day range
  const formatDateRange = (startDate: Date, endDate: Date): string => {
    const startMonth = startDate.toLocaleDateString('de-DE', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('de-DE', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();

    if (startMonth === endMonth) {
      return `${startMonth}, ${String(startDay).padStart(2, '0')} - ${String(endDay).padStart(2, '0')}`;
    }
    return `${startMonth} ${String(startDay).padStart(2, '0')} - ${endMonth} ${String(endDay).padStart(2, '0')}`;
  };

  // Helper function to get all days in a given month for mini calendar
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = [];

    // Add blank days for the start of the week before the 1st
    let startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek -1; // Adjust to Mon (0) - Sun (6)
    for (let i = 0; i < startingDayOfWeek; i++) {
      daysInMonth.push(null);
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      daysInMonth.push(new Date(year, month, i));
    }
    return daysInMonth;
  };

  // Navigate mini calendar month
  const navigateMiniCalendarMonth = (direction: number) => {
    setMiniCalendarDisplayMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  // Close mini calendar on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showMiniCalendar &&
        miniCalendarButtonRef.current &&
        !miniCalendarButtonRef.current.contains(event.target as Node) &&
        miniCalendarPopupRef.current &&
        !miniCalendarPopupRef.current.contains(event.target as Node)
      ) {
        setShowMiniCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMiniCalendar]);

  // Close legend popup on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showLegendPopup &&
        legendIconRef.current &&
        !legendIconRef.current.contains(event.target as Node) &&
        legendPopupRef.current &&
        !legendPopupRef.current.contains(event.target as Node)
      ) {
        setShowLegendPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLegendPopup]);

  // Handle opening maps with the address
  const handleAddressClick = (address: string) => {
    setSelectedAddress(address);
    setShowMapsModal(true);
  };

  const openInGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(selectedAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    setShowMapsModal(false);
  };

  const openInAppleMaps = () => {
    const encodedAddress = encodeURIComponent(selectedAddress);
    window.open(`maps://maps.apple.com/?q=${encodedAddress}`, '_blank');
    setShowMapsModal(false);
  };

  // Close breaking news when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showBreakingNews) {
        // Close breaking news when clicking anywhere outside of it
        setShowBreakingNews(false);
      }
    };
    
    // Only add the event listener if breaking news is showing
    if (showBreakingNews) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBreakingNews]);

  // Function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 4 && currentHour < 11) {
      return "Guten Morgen";
    } else if (currentHour >= 11 && currentHour < 14) {
      return "Mahlzeit";
    } else if (currentHour >= 14 && currentHour < 18) {
      return "Schönen Nachmittag";
    } else {
      return "Schönen Abend";
    }
  };

  // Add state for progress bar animations
  const [progressBarsVisible, setProgressBarsVisible] = useState(false);
  const progressBarsRef = useRef<HTMLDivElement>(null);

  // Add Intersection Observer for progress bars
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setProgressBarsVisible(true);
          }
        });
      },
      {
        threshold: 0.3, // Trigger when 30% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before fully visible
      }
    );

    const currentRef = progressBarsRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="container flex h-16 items-center px-4">
                    <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-purple-200 dark:border-purple-900">
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Avatar" />
                <AvatarFallback className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-700 font-medium">JP</AvatarFallback>
              </Avatar>
              <div className="w-2 h-2 bg-green-400 rounded-full absolute top-0 right-0 border border-white dark:border-gray-900"></div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center">
                <p className="text-base font-semibold text-gray-800 dark:text-gray-200">Jan Promotor</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Promotor</p>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={(e) => {
                e.stopPropagation();
                setShowBreakingNews(!showBreakingNews);
              }}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-purple-500"></span>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Breaking News Animation Container */}
        <div 
          className={`absolute top-full left-0 right-0 z-40 flex justify-center transition-all duration-500 ease-out ${
            showBreakingNews ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
          style={{ 
            transformOrigin: 'top center',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-auto max-w-[90%] md:max-w-[460px] mt-3 transform-gpu">
            <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 animate-pulse" />
                  <div className="flex-1">
                    <p className="font-medium">Breaking News</p>
                    <p className="text-sm text-white/90">
                      Neue Schulungsmaterialien für das kommende Event sind jetzt verfügbar!
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20 rounded-full h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBreakingNews(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      {/* Darkening overlay for when breaking news is shown */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-500 z-[35] ${
          showBreakingNews ? 'opacity-40' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShowBreakingNews(false)}
      ></div>

      {/* Darkening overlay for when KI assistant chat is shown */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-500 z-[35] ${
          chatOpen ? 'opacity-40' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setChatOpen(false)}
      ></div>

      {/* Main Content */}
      <main className="container px-4 py-6 md:py-8 max-w-5xl mx-auto">
        {/* Welcome Section */}
        <section className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{getTimeBasedGreeting()}, Jan!</h1>
          <div className="text-gray-600 dark:text-gray-400">
            <div className="inline-block typing-animation typing-container" style={{animationDuration: '2.5s', width: 'fit-content'}}>
              Hier ist dein Überblick für heute.
            </div>
          </div>
        </section>

        {/* To-Dos Card */}
        <Card className="mb-6 overflow-hidden border-none shadow-md bg-white dark:bg-gray-900">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 relative h-[88px] z-[25]">
            {/* To-Dos title positioned left */}
            <div className="absolute top-4 left-4 flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5" />
              <span className="text-lg font-medium">To-Dos</span>
            </div>
            
            {/* Dropdown positioned on the right */}
            <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[25]">
              <div className="relative">
                <button 
                  className="text-white text-lg flex items-center font-medium py-1 px-3 rounded-md hover:bg-white/10 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFilterDropdown(!showFilterDropdown);
                  }}
              >
                  {todoFilter === "heute" ? "Heute" : 
                   todoFilter === "7tage" ? "Nächsten 7 Tage" : 
                   "Nächsten 30 Tage"}
                  <ChevronDown className="h-5 w-5 ml-1" />
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-30">
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-800 dark:hover:text-blue-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTodoFilter("heute");
                        setShowFilterDropdown(false);
                      }}
                    >
                      Heute
                    </button>
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-800 dark:hover:text-blue-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTodoFilter("7tage");
                        setShowFilterDropdown(false);
                      }}
              >
                      Nächsten 7 Tage
                    </button>
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-800 dark:hover:text-blue-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTodoFilter("30tage");
                        setShowFilterDropdown(false);
                      }}
                    >
                      Nächsten 30 Tage
                    </button>
            </div>
                )}
              </div>
            </div>
            
            {/* Progress bar at bottom */}
            <div className="absolute bottom-4 left-4 text-white/90 text-xs">
              <div className="flex justify-between mb-1">
                <span>Erledigt {completedTodos}/{totalTodos}</span>
              </div>
              <div className="w-40 bg-white/20 rounded-full h-1.5 mb-1">
                <div 
                  className="bg-white h-1.5 rounded-full" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardHeader>
          <CardContent
            className={`p-0 transition-all duration-300 ${expandedTodos ? "max-h-80" : "max-h-[180px]"} overflow-hidden`}
          >
            {expandedTodos ? (
              <ScrollArea className="h-full max-h-80 overflow-y-auto">
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sortedTodos.map((todo) => (
                    <li key={todo.id} className="px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {/* Improved checkbox design with better icons */}
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className="w-5 h-5 flex items-center justify-center transition-all focus:outline-none"
                        >
                          {todo.completed ? (
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              className="w-5 h-5 text-green-500"
                            >
                              <path 
                                fill="currentColor" 
                                d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M10,17l-5-5l1.41-1.41L10,14.17l7.59-7.59L19,8L10,17z"
                              />
                            </svg>
                          ) : (
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              className="w-5 h-5 text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 transition-colors"
                            >
                              <path 
                                fill="currentColor" 
                                d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.42,0-8-3.58-8-8s3.58-8,8-8s8,3.58,8,8S16.42,20,12,20z"
                              />
                            </svg>
                          )}
                        </button>
                        
                        {/* Todo content */}
                    <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${todo.completed ? 'text-gray-400 dark:text-gray-500 line-through' : ''}`}>
                            {todo.title}
                          </p>
                          
                          {/* Time indicator only */}
                          <div className="flex items-center mt-1">
                            <svg
                              className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                        >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{todo.due}</span>
                          </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {sortedTodos.slice(0, 3).map((todo) => (
                  <li key={todo.id} className="px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {/* Improved checkbox design with better icons */}
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className="w-5 h-5 flex items-center justify-center transition-all focus:outline-none"
                      >
                        {todo.completed ? (
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            className="w-5 h-5 text-green-500"
                          >
                            <path 
                              fill="currentColor" 
                              d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M10,17l-5-5l1.41-1.41L10,14.17l7.59-7.59L19,8L10,17z"
                            />
                          </svg>
                        ) : (
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            className="w-5 h-5 text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 transition-colors"
                          >
                            <path 
                              fill="currentColor" 
                              d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.42,0-8-3.58-8-8s3.58-8,8-8s8,3.58,8,8S16.42,20,12,20z"
                            />
                          </svg>
                        )}
                      </button>
                      
                      {/* Todo content */}
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${todo.completed ? 'text-gray-400 dark:text-gray-500 line-through' : ''}`}>
                          {todo.title}
                        </p>
                        
                        {/* Time indicator only */}
                        <div className="flex items-center mt-1">
                          <svg
                            className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{todo.due}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          <CardFooter className="p-3 border-t bg-gray-50 dark:bg-gray-800/50">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full flex items-center justify-center font-medium bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              onClick={() => setExpandedTodos(!expandedTodos)}
            >
              {expandedTodos ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1 text-purple-500" /> Weniger anzeigen
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1 text-purple-500" /> Alle anzeigen
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Bitte Lesen Card */}
        {showBitteLesen && (
          <div className="w-full max-w-md mx-auto mb-6">
            <div className="relative">
              {/* Outer glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-lg blur-sm opacity-75 animate-pulse"></div>
              
              {/* Main card */}
              <Card className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 border-0 shadow-xl overflow-hidden">
                {/* Animated background pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-red-500/20 animate-pulse"></div>
                
                {/* Header with icon */}
                <div className="relative py-4 px-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 animate-bounce">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-lg drop-shadow-lg">
                    Bitte Lesen
                  </h3>
                  <p className="text-white/90 text-sm mt-1 drop-shadow">
                    Wichtige Mitteilung von der Geschäftsleitung
                  </p>
                </div>
                
                {/* Content */}
                <CardContent className="relative p-6 pt-2">
                  <div className="text-center">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/20">
                      <div className="text-white text-sm leading-relaxed text-left">
                        Liebe Promotoren,
                        <br /><br />
                        ab sofort gelten neue Richtlinien für die Zeiterfassung. Bitte stellt sicher, dass ihr eure Arbeitszeiten täglich und korrekt eintragt.
                        <br /><br />
                        Bei Fragen wendet euch an euren Teamleiter.
                        <br /><br />
                        Vielen Dank für euer Verständnis!
                        <br /><br />
                        Euer SalesCrew Team
                      </div>
                    </div>
                    
                    {/* Read button */}
                    <button 
                      onClick={() => setShowBitteLesen(false)}
                      className="bg-white text-orange-600 font-medium py-2.5 px-5 rounded-lg shadow-md hover:bg-gray-50 hover:shadow-lg transform hover:scale-105 transition-all duration-200 border border-white/50"
                    >
                      ✓ Gelesen
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Upcoming Events -> Anstehende Einsätze */}
        <Card className="mb-6 overflow-hidden border-none shadow-md bg-white dark:bg-gray-900">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 flex flex-row justify-between items-center">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Anstehende Einsätze
            </CardTitle>
            <div className="relative">
              <button 
                ref={miniCalendarButtonRef}
                className="flex items-center text-sm font-medium hover:bg-white/10 p-1 rounded-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setMiniCalendarDisplayMonth(new Date(currentCalendarDate)); // Initialize with carousel's current month
                  setShowMiniCalendar(!showMiniCalendar);
                }}
              >
                <span>
                  {formatDateRange(
                    getCalendarDays()[1], // Second day in the 9-day array is the first visible day
                    getCalendarDays()[7]  // Eighth day is the last visible day
                  )}
                </span>
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showMiniCalendar ? 'rotate-180' : ''}`} />
              </button>
              {showMiniCalendar && (
                <div 
                  ref={miniCalendarPopupRef}
                  className="absolute top-full right-0 mt-1.5 w-72 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-50 p-3"
                  onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside popup
                >
                  {/* Mini Calendar Header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <button 
                      onClick={() => navigateMiniCalendarMonth(-1)} 
                      className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                      {miniCalendarDisplayMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                    </span>
                    <button 
                      onClick={() => navigateMiniCalendarMonth(1)} 
                      className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                  {/* Mini Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => <span key={day}>{day}</span>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(miniCalendarDisplayMonth).map((day, index) => {
                      let hoverClass = ''
                      if (hoveredMiniCalendarDate && day) {
                        const diff = Math.round((day.getTime() - hoveredMiniCalendarDate.getTime()) / (1000 * 60 * 60 * 24));
                        const absDiff = Math.abs(diff);

                        if (absDiff === 0) {
                          hoverClass = 'bg-indigo-500 text-white dark:bg-indigo-500 dark:text-white'; // Main hovered day
                        } else if (absDiff === 1) {
                          hoverClass = 'bg-indigo-400 text-white dark:bg-indigo-400 dark:text-white'; // 1 day away
                        } else if (absDiff === 2) {
                          hoverClass = 'bg-indigo-300 text-gray-100 dark:bg-indigo-300 dark:text-gray-200'; // 2 days away
                        }
                      }

                      return (
                        <button 
                          key={index} 
                          onMouseEnter={() => day && setHoveredMiniCalendarDate(day)}
                          onMouseLeave={() => setHoveredMiniCalendarDate(null)}
                          className={`p-1.5 rounded-md text-sm transition-colors relative
                            ${!day ? 'cursor-default' : ''}
                            ${hoverClass ? hoverClass : 
                              (day && selectedCalendarDate.toDateString() === day.toDateString() ? 'bg-indigo-600 text-white' : 
                                (day && new Date().toDateString() === day.toDateString() ? 'font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/50' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50')
                              )}
                          `}
                          disabled={!day}
                          onClick={() => {
                            if (day) {
                              // Fix: Instead of using navigateDays with potentially floating-point steps
                              // Set the exact date directly to ensure perfect synchronization
                              const newDate = new Date(day);
                              setCurrentCalendarDate(newDate);
                              setSelectedCalendarDate(newDate);
                              
                              // Allow animations and clicks again after transition completes
                              setAnimating(true);
                              setTimeout(() => setAnimating(false), 400);
                              
                              setShowMiniCalendar(false);
                              setHoveredMiniCalendarDate(null); // Clear hover on click
                            }
                          }}
                        >
                          {day ? (
                            <>
                              {day.getDate()}
                              {/* Assignment indicators - lines at bottom */}
                              <div className="absolute bottom-1 left-0 right-0 flex justify-center space-x-1 px-1">
                                {/* Promotion line (blue) */}
                                {assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "promotion") && (
                                  <div className="h-1 w-2/5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
                                )}
                                {/* Buddy tag line (purple) */}
                                {assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "buddy") && (
                                  <div className="h-1 w-2/5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                                )}
                                {/* Schulung line (orange) */}
                                {assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "schulung") && (
                                  <div className="h-1 w-2/5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"></div>
                                )}
                                {/* Urlaub line (green) */}
                                {assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "urlaub") && (
                                  <div className="h-1 w-2/5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500"></div>
                                )}
                              </div>
                            </>
                          ) : ''}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 relative"> {/* Added relative for popup positioning */}
            {/* Info Icon for Legend */}
            <div className="absolute top-2 left-2 z-10">
              <Button
                ref={legendIconRef}
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLegendPopup(!showLegendPopup);
                }}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>

            {/* Legend Popup */}
            {showLegendPopup && (
              <div
                ref={legendPopupRef}
                className="absolute top-10 left-2 mt-1 w-auto min-w-[230px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-4" // Increased padding
                onClick={(e) => e.stopPropagation()} 
              >
                <h4 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-100">Kalender Legende</h4>
                <ul className="space-y-2 text-xs"> {/* Increased spacing */}
                  <li className="flex items-center">
                    <div className="w-3.5 h-3.5 rounded-full mr-2.5 border border-indigo-600/50 bg-gradient-to-br from-indigo-500/60 to-indigo-600/60 flex-shrink-0 shadow-sm"></div>
                    <span className="text-gray-700 dark:text-gray-300">Promotion / Ausgewählt</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-3.5 h-3.5 rounded-full mr-2.5 border border-purple-500/50 bg-gradient-to-br from-purple-500/60 to-pink-500/60 flex-shrink-0 shadow-sm"></div>
                    <span className="text-gray-700 dark:text-gray-300">Buddy Tag</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-3.5 h-3.5 rounded-full mr-2.5 border border-orange-500/50 bg-gradient-to-br from-orange-500/60 to-amber-500/60 flex-shrink-0 shadow-sm"></div>
                    <span className="text-gray-700 dark:text-gray-300">Schulung</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-3.5 h-3.5 rounded-full mr-2.5 border border-emerald-500/50 bg-gradient-to-br from-emerald-500/60 to-green-500/60 flex-shrink-0 shadow-sm"></div>
                    <span className="text-gray-700 dark:text-gray-300">Urlaub</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-3.5 h-3.5 rounded-full mr-2.5 border border-indigo-400/50 bg-indigo-100 dark:bg-indigo-800/50 flex-shrink-0 shadow-sm"></div>
                    <span className="text-gray-700 dark:text-gray-300">Heute (ohne Einsatz)</span>
                  </li>
                </ul>
              </div>
            )}
            {/* Calendar Carousel Row */}
            <div className="relative mb-0 py-2"> {/* Reduced mb-1 to mb-0 and py-4 to py-2 */}
              {/* Fixed-width container for the calendar with precise centering */}
              <div className="w-full max-w-md mx-auto relative h-24">
                {/* Calendar days container with fixed width and centered */}
                <div className="w-full h-full relative">
                  {getCalendarDays().map((day, i) => {
                    const visibleIndex = i - 1; // Adjust index to account for extra day
                    const isCenter = visibleIndex === 3; // Middle position is now index 3
                    const distanceFromCenter = Math.abs(visibleIndex - 3);
                    const isSelected = selectedCalendarDate.toDateString() === day.toDateString();
                    const isToday = new Date().toDateString() === day.toDateString();
                    const isOffscreen = visibleIndex < 0 || visibleIndex > 6;
                    
                    const hasAssignment = assignments.some(a => a.date.toDateString() === day.toDateString());
                    const hasBuddyTag = assignments.some(a => 
                      a.date.toDateString() === day.toDateString() && a.type === "buddy"
                    );
                    let dynamicClasses = '';

                    if (isSelected) {
                      dynamicClasses = 'text-black border-indigo-700'; // Changed to black text for visibility
                    } else if (hasBuddyTag) {
                      // Has a buddy tag assignment
                      dynamicClasses = 'border-purple-500'; // Purple border for buddy tag
                      if (isToday) {
                        dynamicClasses += ' bg-purple-100 dark:bg-purple-800/50'; // If also today, add purple-tinted bg
                      } else {
                        dynamicClasses += ' hover:bg-purple-50 dark:hover:bg-purple-900/50'; // Default hover for buddy tag day
                      }
                    } else if (assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "urlaub")) {
                      // Has a vacation
                      dynamicClasses = 'border-emerald-500'; // Emerald border for vacation
                      if (isToday) {
                        dynamicClasses += ' bg-emerald-50 dark:bg-emerald-900/30'; // If also today, add emerald-tinted bg
                      } else {
                        dynamicClasses += ' hover:bg-emerald-50 dark:hover:bg-emerald-900/20'; // Default hover for vacation day
                      }
                    } else if (assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "schulung")) {
                      // Has a Schulung
                      dynamicClasses = 'border-orange-500'; // Orange border for Schulung
                      if (isToday) {
                        dynamicClasses += ' bg-orange-50 dark:bg-orange-900/30'; // If also today, add orange-tinted bg
                      } else {
                        dynamicClasses += ' hover:bg-orange-50 dark:hover:bg-orange-900/20'; // Default hover for Schulung day
                      }
                    } else if (hasAssignment) {
                      // Not selected, but has assignment
                      dynamicClasses = 'border-blue-500'; // Blue border for promotion
                      if (isToday) {
                        dynamicClasses += ' bg-indigo-100 dark:bg-indigo-800/50'; // If also today, add today's bg
                      } else {
                        dynamicClasses += ' hover:bg-indigo-50 dark:hover:bg-indigo-900/50'; // Default hover for non-today promotion day
                      }
                    } else if (isToday) {
                      // Not selected, no assignment, but is today
                      dynamicClasses = 'bg-indigo-100 dark:bg-indigo-800/50 border-indigo-400'; // Today's style
                    } else {
                      // Not selected, no assignment, not today (default)
                      // Use default border from variant="outline" or add a specific one if needed.
                      // For consistency, let's ensure a default border for non-active, non-today, non-assignment days.
                      dynamicClasses = 'border-gray-300 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50';
                    }

                    // Calculate size and opacity based on distance from center
                    const scale = isOffscreen ? 0.4 : 1 - (distanceFromCenter * 0.15);
                    const opacity = isOffscreen ? 0 : 1 - (distanceFromCenter * 0.15);
                    const zIndex = isOffscreen ? 0 : 10 - distanceFromCenter;
                    
                    // Position based on center of container
                    let leftPosition;
                    if (visibleIndex < 0) {
                      leftPosition = '-15%'; // Behind left arrow
                    } else if (visibleIndex > 6) {
                      leftPosition = '115%'; // Behind right arrow
                    } else {
                      // Center the days with more precise calculation
                      // Middle day (index 3) should be at 50%
                      leftPosition = `${50 + (visibleIndex - 3) * 20}%`;
                    }
                    
                    return (
                      <div 
                        key={day.toISOString()}
                        className="absolute transform transition-all duration-400 ease-in-out"
                        style={{
                          left: leftPosition,
                          top: '50%',
                          transform: `translate(-50%, -50%) scale(${scale})`,
                          opacity: opacity,
                          zIndex: zIndex,
                          transition: "all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1.0)"
                        }}
                      >
                        <Button
                          variant="outline"
                          size="lg"
                          className={`flex flex-col h-auto py-2 px-4 w-16 items-center justify-center overflow-hidden
                            ${isCenter ? 'border-2' : 'border'}
                            ${!isSelected ? dynamicClasses : (hasBuddyTag ? 'border-purple-500' : assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "urlaub") ? 'border-emerald-500' : assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "schulung") ? 'border-orange-500' : 'border-indigo-700')}
                          `}
                          style={isSelected ? 
                            (hasBuddyTag ? {
                              // Purple gradient for buddy tag days (from To-Dos card)
                              background: 'linear-gradient(to bottom, rgba(168,85,247,0.9), rgba(219,39,119,0.55))'
                            } : assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "urlaub") ? {
                              // Emerald-Green gradient for vacation days (matches time indicator)
                              background: 'linear-gradient(to bottom, rgba(16,185,129,0.8), rgba(34,197,94,0.6))'
                            } : assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "schulung") ? {
                              // Orange gradient for Schulung days
                              background: 'linear-gradient(to bottom, rgba(249,115,22,0.8), rgba(234,88,12,0.6))'
                            } : hasAssignment ? {
                              // Blue gradient for promotion days - EXACT match to header gradient (from-blue-500 to-indigo-600)
                              background: 'linear-gradient(to bottom, rgb(59,130,246), rgb(79,70,229))'
                            } : {
                              // Grey-white gradient for days with no plans
                              background: 'linear-gradient(to bottom, rgba(243,244,246,0.95), rgba(249,250,251,0.85))'
                            }) 
                          : {}}
                          onClick={() => {
                            // Calculate how many steps the currentCalendarDate needs to shift
                            // for the clicked 'day' to become the new center.
                            const stepsToShift = Math.round((day.getTime() - currentCalendarDate.getTime()) / (1000 * 60 * 60 * 24));
                            navigateDays(stepsToShift);
                          }}
                          disabled={animating}
                        >
                          {isSelected ? (
                            <div className="flex flex-col items-center w-full">
                              <span className={`text-xs font-medium mb-1 ${hasBuddyTag || hasAssignment ? 'text-white' : 'text-gray-700'}`}>
                                {day.toLocaleDateString('de-DE', { weekday: 'short' })}
                              </span>
                              <span className={`text-xl font-bold ${hasBuddyTag || hasAssignment ? 'text-white' : 'text-gray-800'}`}>
                                {day.getDate()}
                              </span>
                            </div>
                          ) : (
                            <>
                              <span className="text-xs font-medium mb-1">
                                {day.toLocaleDateString('de-DE', { weekday: 'short' })}
                              </span>
                              <span className="text-xl font-bold">
                                {day.getDate()}
                              </span>
                            </>
                          )}
                        </Button>
                  </div>
                    );
                  })}
                </div>
              </div>
            </div> {/* End of Calendar days container div */}

            {/* New Navigation Arrows - Centered Below Calendar */}
            <div className="flex justify-center items-center space-x-12 mb-1 -mt-1"> {/* Reduced mb-2 to mb-1 and added -mt-1 */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded-full p-2"
                onClick={() => navigateDays(-1)}
                disabled={animating}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded-full p-2"
                onClick={() => navigateDays(1)}
                disabled={animating}
              >
                <ArrowRight className="h-6 w-6" />
              </Button>
            </div>

            {/* Fixed Assignment Slot for selected day */}
            <div className="h-[90px] min-h-[90px]"> {/* Increased height from 72px to 90px */}
              {assignments
                .filter(a => a.date.toDateString() === selectedCalendarDate.toDateString() && a.type !== "urlaub" && a.type !== "schulung")
                .slice(0, 1) // Only take the first assignment
                .map((assignment) => (
                  <div 
                    key={assignment.id} 
                    className={`h-full p-3 rounded-md border flex items-center justify-between ${
                      assignment.type === "buddy" ? 
                        "border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/20" :
                      assignment.type === "promotion" ?
                        "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20" :
                        "dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30" // Default fallback, though should be covered by filter
                    }`}
                  >
                    <div>
                        <div className="relative pl-3">
                          <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-sm ${
                            assignment.type === "buddy" ? 
                              "bg-gradient-to-b from-purple-500 to-pink-500" : 
                              "bg-gradient-to-b from-blue-400 to-indigo-600"
                          }`}></span>
                          <p className="text-sm font-medium">{assignment.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center cursor-pointer hover:text-blue-600 transition-colors"
                             onClick={() => handleAddressClick(assignment.location)}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3 w-3 mr-1"
                            >
                              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {assignment.location}
                          </p>
                          {assignment.type === "promotion" && (
                            <Badge className="text-xs font-medium px-2 py-0.5 mt-1.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-sm whitespace-nowrap rounded-full">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1.5 opacity-90" />
                                {assignment.time}
                              </span>
                            </Badge>
                          )}
                        </div>
                    </div>
                    <div className={`flex flex-col items-end h-full py-1 ${
                      assignment.type === "promotion" ? "justify-end space-y-0" : "justify-center space-y-0.5"
                    }`}>
                      {assignment.type === "buddy" && (
                        <Badge className="text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-sm whitespace-nowrap rounded-full">
                          <span className="flex items-center">
                            Buddy: Cesira
                          </span>
                        </Badge>
                      )}
                      
                      {assignment.type !== "promotion" && (
                        <Badge className="text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-sm whitespace-nowrap rounded-full">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1.5 opacity-90" />
                            {assignment.time}
                          </span>
                        </Badge>
                       )}
                        
                                              <div className="text-xs font-medium px-2 py-0.5 bg-orange-500 text-white border-0 shadow-sm whitespace-nowrap rounded-full cursor-pointer"
                        style={{ backgroundColor: '#f97316', height: '22px' }} // Force orange color and match badge height
                        onClick={() => router.push('/einsatz')}
                      >
                        <span className="flex items-center">
                          Einsatz starten
                          <ChevronRight className="h-3 w-3 ml-1 opacity-90" />
                        </span>
                      </div>
                      </div>
                  </div>
              ))}
              {assignments.filter(a => a.date.toDateString() === selectedCalendarDate.toDateString() && a.type !== "urlaub" && a.type !== "schulung").length === 0 &&
               !assignments.some(a => a.date.toDateString() === selectedCalendarDate.toDateString() && (a.type === "urlaub" || a.type === "schulung")) && (
                <div className="h-full p-3 rounded-md border dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 opacity-70" />
                    Keine Promotion für diesen Tag geplant.
                  </p>
                </div>
              )}
              
              {/* Vacation display */}
              {assignments.some(a => a.date.toDateString() === selectedCalendarDate.toDateString() && a.type === "urlaub") && (
                <div className="h-full p-3 rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <p className="flex items-center">
                    <span className="text-xl">🌴</span>
                    <span className="text-xl">🍹</span>
                    <span className="mx-4 text-base font-semibold text-gray-800 dark:text-gray-200">Urlaub</span>
                    <span className="text-xl">⛱️</span>
                    <span className="text-xl">✈️</span>
                  </p>
                </div>
              )}
              {/* Schulung display */}
              {assignments.filter(a => a.date.toDateString() === selectedCalendarDate.toDateString() && a.type === "schulung").map(schulungAssignment => (
                <div key={schulungAssignment.id} className="h-full p-3 rounded-md border border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/20 flex items-center justify-between">
                  <div>
                    <div className="relative pl-3">
                      <span className="absolute left-0 top-0 bottom-0 w-1.5 rounded-sm bg-gradient-to-b from-orange-500 to-amber-500"></span>
                      <p className="text-sm font-medium">{schulungAssignment.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => handleAddressClick(schulungAssignment.location)}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {schulungAssignment.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-center space-y-1">
                    <Badge className="text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-sm whitespace-nowrap rounded-full">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1.5 opacity-90" />
                        {schulungAssignment.time}
                      </span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold mb-3">Schnellzugriff</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="flex flex-col items-center">
            <img 
              src="/icons/16._Mai_2025__09_20_17-removebg-preview 1.svg" 
              alt="Schulungsunterlagen" 
              className="w-16 h-16 cursor-pointer hover:opacity-90 transition-opacity"
            />
            <span className="text-xs mt-2 text-gray-700 dark:text-gray-300">Schulungsunterlagen</span>
          </div>

            <div className="flex flex-col items-center">
            <img 
              src="/icons/ChatGPT_Image_16._Mai_2025__10_31_35-removebg-preview 1.svg" 
              alt="Videos" 
              className="w-16 h-16 cursor-pointer hover:opacity-90 transition-opacity"
            />
            <span className="text-xs mt-2 text-gray-700 dark:text-gray-300">Videos</span>
            </div>

          <div className="flex flex-col items-center">
            <img 
              src="/icons/ChatGPT_Image_16._Mai_2025__10_27_42-removebg-preview 1.svg" 
              alt="Chat" 
              className="w-16 h-16 cursor-pointer hover:opacity-90 transition-opacity"
            />
            <span className="text-xs mt-2 text-gray-700 dark:text-gray-300">Chat</span>
          </div>
        </div>

        {/* Weekly Stats */}
        <Card className="mb-6 overflow-hidden border-none shadow-md bg-white dark:bg-gray-900" ref={progressBarsRef}>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Wochenstatus</CardTitle>
            <CardDescription>Deine Aktivitäten diese Woche</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Arbeitsstunden</span>
                  <span className="text-sm font-medium">24/40</span>
                </div>
                <div className="h-2 w-full bg-blue-100 dark:bg-blue-950/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-300 to-blue-600 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: progressBarsVisible ? '60%' : '0%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Erledigte Aufgaben</span>
                  <span className="text-sm font-medium">7/12</span>
                </div>
                <div className="h-2 w-full bg-blue-100 dark:bg-blue-950/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-300 to-blue-600 rounded-full transition-all duration-1000 ease-out delay-200" 
                    style={{ width: progressBarsVisible ? '58%' : '0%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Schulungen</span>
                  <span className="text-sm font-medium">1/2</span>
                </div>
                <div className="h-2 w-full bg-blue-100 dark:bg-blue-950/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-300 to-blue-600 rounded-full transition-all duration-1000 ease-out delay-400" 
                    style={{ width: progressBarsVisible ? '50%' : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* KI Assistant Floating Button */}
      <button 
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg flex items-center justify-center z-40 hover:shadow-xl transition-shadow"
        onClick={() => {
          setChatOpen(true);
          setIsSpinning(true);
          setTimeout(() => setIsSpinning(false), 1000); // Reset after animation completes
        }}
      >
        <div className="absolute w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 animate-ping-slow opacity-70"></div>
        <img
          src="/icons/robot 1.svg"
          alt="KI Assistant"
          className={`h-8 w-8 relative z-10 ${isSpinning ? 'animate-spin-once' : ''} brightness-0 invert`}
        />
      </button>

      {/* KI Assistant Chat Interface */}
      {chatOpen && (
        <div className="fixed bottom-36 right-4 w-72 h-[400px] bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col z-50 overflow-hidden">
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
          <div className="flex-1 overflow-y-auto p-3 pb-16 
          scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent hover:scrollbar-thumb-blue-600
          [&::-webkit-scrollbar]:w-1.5 
          [&::-webkit-scrollbar-track]:bg-transparent 
          [&::-webkit-scrollbar-thumb]:rounded-full 
          [&::-webkit-scrollbar-thumb]:bg-blue-500/50 
          [&::-webkit-scrollbar-thumb:hover]:bg-blue-500">
            <div className="space-y-3">
              {chatMessages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      message.role === 'user' 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
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
          
          {/* Input Area - Floating at bottom */}
          <div className="absolute bottom-3 left-3 right-3">
            <form onSubmit={sendMessage} className="relative">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Frag Eddie egal was..."
                className="w-full pr-12 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-full shadow-md chat-input placeholder:text-xs"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
              >
                <Send className="h-3.5 w-3.5 rotate-15" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Footer Menu - Modern Pill Design */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-auto px-3 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-full z-30 shadow-[0_35px_65px_-15px_rgba(0,0,0,0.25)] overflow-hidden"> {/* Applied custom stronger shadow */}
        <div className="relative flex items-center justify-around space-x-2 h-12"> {/* Removed overflow-hidden from here */}
          {/* Animated Circle Indicator */}
          <div 
            className="absolute bg-primary rounded-full shadow-lg"
            style={indicatorStyle}
          ></div>
          
          {/* Home Button */}
          <Button
            ref={el => { footerButtonRefs.current[0] = el; }}
            variant="ghost"
            size="icon"
            className={`flex flex-col items-center justify-center h-10 w-10 rounded-full relative z-10 ${activeTab === "home" ? "text-white hover:bg-transparent" : "text-gray-500 dark:text-gray-400 hover:opacity-55"}`}
            onClick={() => setActiveTab("home")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6" /* Increased icon size */
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {/* Text label removed for cleaner look */}
          </Button>

          {/* Einsatz Button */}
          <Button
            ref={el => { footerButtonRefs.current[1] = el; }}
            variant="ghost"
            size="icon"
            className={`flex flex-col items-center justify-center h-10 w-10 rounded-full relative z-10 ${activeTab === "einsatz" ? "text-white hover:bg-transparent" : "text-gray-500 dark:text-gray-400 hover:opacity-55"}`}
            onClick={() => setActiveTab("einsatz")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6" /* Increased icon size */
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
              <path d="m9 16 2 2 4-4" />
            </svg>
            {/* Text label removed */}
          </Button>

          {/* Chats Button */}
          <Button
            ref={el => { footerButtonRefs.current[2] = el; }}
            variant="ghost"
            size="icon"
            className={`flex flex-col items-center justify-center h-10 w-10 rounded-full relative z-10 ${activeTab === "chats" ? "text-white hover:bg-transparent" : "text-gray-500 dark:text-gray-400 hover:opacity-55"}`}
            onClick={() => setActiveTab("chats")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6" /* Increased icon size */
            >
              <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
              <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
            </svg>
            {/* Text label removed */}
          </Button>

          {/*CA KPIs Button */}
          <Button
            ref={el => { footerButtonRefs.current[3] = el; }}
            variant="ghost"
            size="icon"
            className={`flex flex-col items-center justify-center h-10 w-10 rounded-full relative z-10 ${activeTab === "kpis" ? "text-white hover:bg-transparent" : "text-gray-500 dark:text-gray-400 hover:opacity-55"}`}
            onClick={() => setActiveTab("kpis")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6" /* Increased icon size */
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            {/* Text label removed */}
          </Button>

          {/* Profil Button */}
          <Button
            ref={el => { footerButtonRefs.current[4] = el; }}
            variant="ghost"
            size="icon"
            className={`flex flex-col items-center justify-center h-10 w-10 rounded-full relative z-10 ${activeTab === "profil" ? "text-white hover:bg-transparent" : "text-gray-500 dark:text-gray-400"}`}
            onClick={() => setActiveTab("profil")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6" /* Increased icon size */
            >
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
            {/* Text label removed */}
          </Button>
        </div>
      </div>

      {/* Add click handler to close dropdown when clicking outside */}
      <div 
        className={`fixed inset-0 z-20 ${showFilterDropdown ? 'block' : 'hidden'}`}
        onClick={() => setShowFilterDropdown(false)}
      ></div>

      {/* Maps Modal */}
      {showMapsModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
            onClick={() => setShowMapsModal(false)}
          ></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl z-50 p-4 w-72">
            <h3 className="text-lg font-medium mb-3">Wegbeschreibung zu</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedAddress}</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={openInGoogleMaps}
                className="flex items-center py-2.5 px-4 bg-white border border-gray-100 dark:border-gray-700 dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <img 
                  src="/icons/google-maps-icon.svg" 
                  alt="Google Maps" 
                  width={20} 
                  height={20} 
                  className="mr-2.5"
                />
                <span className="font-medium text-sm">Google Maps</span>
              </button>
              <button 
                onClick={openInAppleMaps}
                className="flex items-center py-2.5 px-4 bg-white border border-gray-100 dark:border-gray-700 dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <img 
                  src="/icons/apple-maps-icon.svg" 
                  alt="Apple Maps" 
                  width={20} 
                  height={20}
                  className="mr-2.5" 
                />
                <span className="font-medium text-sm">Apple Maps</span>
              </button>
            </div>
            <button 
              onClick={() => setShowMapsModal(false)}
              className="w-full mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              Abbrechen
            </button>
          </div>
        </>
      )}
    </div>
  )
}
