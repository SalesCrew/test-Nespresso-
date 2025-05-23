"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  // FileText, // Replaced by ClipboardList for quick action
  Info,
  // MessageSquare, // Replaced by MessagesSquareIcon for quick action
  Send,
  X,
  ArrowLeft,
  ArrowRight,
  MapPin, // For assignment location
  // Film, // Replaced by VideoIcon for quick action
  ClipboardList, // For Schulungsunterlagen quick action
  Video as VideoIcon, // For Videos quick action
  MessagesSquare as MessagesSquareIcon, // For Chat quick action
  Briefcase, // For "Anstehende Einsätze" card title icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  const [expandedTodos, setExpandedTodos] = useState(false);
  const [todoFilter, setTodoFilter] = useState("heute");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [animating, setAnimating] = useState(false);
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [miniCalendarDisplayMonth, setMiniCalendarDisplayMonth] = useState(new Date()); 
  const miniCalendarButtonRef = useRef<HTMLButtonElement>(null);
  const miniCalendarPopupRef = useRef<HTMLDivElement>(null); 
  const [hoveredMiniCalendarDate, setHoveredMiniCalendarDate] = useState<Date | null>(null);
  const [showMapsModal, setShowMapsModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");

  const [showLegendPopup, setShowLegendPopup] = useState(false);
  const legendIconRef = useRef<HTMLButtonElement>(null);
  const legendPopupRef = useRef<HTMLDivElement>(null);

  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const filterDropdownPopupRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fullSubtitle = "Hier ist dein Überblick für heute.";
  const [animatedSubtitle, setAnimatedSubtitle] = useState(fullSubtitle.split('').map(() => '\u00A0').join('')); 
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const currentHour = new Date().getHours();
    let newGreeting = "";
    if (currentHour >= 5 && currentHour < 12) {
      newGreeting = "Guten Morgen, Jan";
    } else if (currentHour >= 12 && currentHour < 18) {
      newGreeting = "Guten Tag, Jan";
    } else if (currentHour >= 18 && currentHour < 22) {
      newGreeting = "Guten Abend, Jan";
    } else {
      newGreeting = "Gute Nacht, Jan";
    }
    setGreeting(newGreeting);
  }, []);

  useEffect(() => {
    setAnimatedSubtitle(fullSubtitle.split('').map(() => '\u00A0').join(''));

    let currentTypedIndex = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (currentTypedIndex < fullSubtitle.length) {
        setAnimatedSubtitle(
          fullSubtitle.substring(0, currentTypedIndex + 1) +
          Array(fullSubtitle.length - (currentTypedIndex + 1)).fill('\u00A0').join('')
        );
        currentTypedIndex++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const getCalendarDays = () => {
    const days = [];
    const startDay = new Date(currentCalendarDate);
    startDay.setDate(currentCalendarDate.getDate() - 4);
    for (let i = 0; i < 9; i++) {
      const day = new Date(startDay);
      day.setDate(startDay.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const navigateDays = (steps: number) => {
    if (animating || steps === 0) return;
    setAnimating(true);
    setTimeout(() => {
      const newCurrentDate = new Date(currentCalendarDate);
      newCurrentDate.setDate(currentCalendarDate.getDate() + steps);
      setCurrentCalendarDate(newCurrentDate);
      setSelectedCalendarDate(newCurrentDate);
      setTimeout(() => setAnimating(false), 400);
    }, 50);
  };

  useEffect(() => {
    const handleClickOutsideFilter = (event: MouseEvent) => {
      if (
        showFilterDropdown &&
        dropdownButtonRef.current &&
        !dropdownButtonRef.current.contains(event.target as Node) &&
        filterDropdownPopupRef.current &&
        !filterDropdownPopupRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideFilter);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideFilter);
    };
  }, [showFilterDropdown]);

  const [todos, setTodos] = useState([
    { id: 1, title: "VTC für Promotion #4582 ausfüllen", priority: "high", due: "Heute, 08:00", completed: true, timeframe: "heute" },
    { id: 2, title: "Schulungsvideo ansehen", priority: "medium", due: "Heute, 14:00", completed: false, timeframe: "heute" },
    { id: 3, title: "Zeiterfassung aktualisieren", priority: "medium", due: "Heute, 18:00", completed: false, timeframe: "heute" },
    { id: 4, title: "Tagesbericht schreiben", priority: "high", due: "Heute, 19:00", completed: false, timeframe: "heute" },
    { id: 5, title: "Equipment für nächste Woche anfordern", priority: "low", due: "Morgen", completed: false, timeframe: "7tage" },
    { id: 6, title: "Reisekostenabrechnung vorbereiten", priority: "medium", due: "In 3 Tagen", completed: false, timeframe: "7tage" },
    { id: 7, title: "Monatsabschluss Meeting planen", priority: "high", due: "In 2 Wochen", completed: false, timeframe: "30tage" },
    { id: 8, title: "Feedbackgespräch vorbereiten", priority: "medium", due: "In 3 Wochen", completed: false, timeframe: "30tage" },
  ]);

  const filteredTodos = todos.filter(todo => {
    if (todoFilter === "heute") {
      return todo.timeframe === "heute";
    }
    if (todoFilter === "7tage") {
      return todo.timeframe === "heute" || todo.timeframe === "7tage";
    }
    if (todoFilter === "30tage") {
      return todo.timeframe === "heute" || todo.timeframe === "7tage" || todo.timeframe === "30tage";
    }
    return false; // Default to showing no todos if filter is unrecognized
  });

  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const completedTodos = sortedTodos.filter(todo => todo.completed).length;
  const totalTodos = sortedTodos.length;
  const completionPercentage = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const [assignments, setAssignments] = useState([
    { id: 1, title: "Mediamarkt, Seiersberg", location: "Wien, Mariahilferstraße", time: "10:00 - 18:00", date: new Date(), type: "promotion" },
    { id: 2, title: "Mediamarkt, Klagenfurt", location: "Klagenfurt, Völkermarkter Straße", time: "09:00 - 17:30", date: new Date(new Date().setDate(new Date().getDate() + 1)), type: "buddy" },
    { id: 3, title: "Android Pro Schulung", location: "Online Meetingraum", time: "13:00 - 17:00", date: new Date(new Date().setDate(new Date().getDate() + 3)), type: "schulung" },
    { id: 7, title: "Newcomer Schulung", location: "Online Meetingraum", time: "14:00 - 18:00", date: new Date(new Date().setDate(new Date().getDate() + 20)), type: "schulung" },
  ]);

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = [];
    let startingDayOfWeek = firstDayOfMonth.getDay();
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    for (let i = 0; i < startingDayOfWeek; i++) {
      daysInMonth.push(null);
    }
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      daysInMonth.push(new Date(year, month, i));
    }
    return daysInMonth;
  };

  const navigateMiniCalendarMonth = (direction: number) => {
    setMiniCalendarDisplayMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  useEffect(() => {
    const handleClickOutsideMiniCalendar = (event: MouseEvent) => {
      if (showMiniCalendar && miniCalendarButtonRef.current && !miniCalendarButtonRef.current.contains(event.target as Node) && miniCalendarPopupRef.current && !miniCalendarPopupRef.current.contains(event.target as Node)) {
        setShowMiniCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideMiniCalendar);
    return () => document.removeEventListener('mousedown', handleClickOutsideMiniCalendar);
  }, [showMiniCalendar]);

  useEffect(() => {
    const handleClickOutsideLegend = (event: MouseEvent) => {
      if (showLegendPopup && legendIconRef.current && !legendIconRef.current.contains(event.target as Node) && legendPopupRef.current && !legendPopupRef.current.contains(event.target as Node)) {
        setShowLegendPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideLegend);
    return () => document.removeEventListener('mousedown', handleClickOutsideLegend);
  }, [showLegendPopup]);

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

  return (
    <>
      <section className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{greeting}</h1>
        <p className="text-gray-600 dark:text-gray-400">{animatedSubtitle}</p>
      </section>

      <Card className="mb-6 overflow-hidden border-none shadow-md bg-white dark:bg-gray-900">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 relative h-[88px] z-[25]">
            <div className="absolute top-4 left-4 flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5" />
              <span className="text-lg font-medium">To-Dos</span>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[25]">
              <div className="relative">
                <button ref={dropdownButtonRef} className="text-white text-lg flex items-center font-medium py-1 px-3 rounded-md hover:bg-white/10 transition-colors h-[48px]" onClick={(e) => { e.stopPropagation(); setShowFilterDropdown(!showFilterDropdown);}}>
                  {todoFilter === "heute" ? (
                    "Heute"
                  ) : todoFilter === "7tage" ? (
                    <div className="flex flex-col items-center leading-tight">
                      <span>Nächsten</span>
                      <span className="text-sm -mt-0.5">7 Tage</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center leading-tight">
                      <span>Nächsten</span>
                      <span className="text-sm -mt-0.5">30 Tage</span>
                    </div>
                  )}
                  <ChevronDown className="h-5 w-5 ml-1.5" />
                </button>
                {showFilterDropdown && (
                  <div 
                    ref={filterDropdownPopupRef}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-30">
                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-800 dark:hover:text-blue-100" onClick={() => { setTodoFilter("heute"); setShowFilterDropdown(false); }}>Heute</button>
                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-800 dark:hover:text-blue-100" onClick={() => { setTodoFilter("7tage"); setShowFilterDropdown(false); }}>Nächsten 7 Tage</button>
                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-800 dark:hover:text-blue-100" onClick={() => { setTodoFilter("30tage"); setShowFilterDropdown(false); }}>Nächsten 30 Tage</button>
      </div>
                )}
              </div>
            </div>
            <div className="absolute bottom-4 left-4 text-white/90 text-xs">
              <div className="flex justify-between mb-1"><span>Erledigt {completedTodos}/{totalTodos}</span></div>
              <div className="w-40 bg-white/20 rounded-full h-1.5 mb-1"><div className="bg-white h-1.5 rounded-full" style={{ width: `${completionPercentage}%` }}></div></div>
            </div>
          </CardHeader>
          <CardContent className={`p-0 transition-all duration-300 ${expandedTodos ? "max-h-80" : "max-h-[180px]"} overflow-hidden`}>
            {expandedTodos ? (
              <ScrollArea className="h-full max-h-80 overflow-y-auto">
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sortedTodos.map((todo) => (
                    <li key={todo.id} className="px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleTodo(todo.id)} className="w-5 h-5 flex items-center justify-center transition-all focus:outline-none">
                          {todo.completed ? (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-green-500"><path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M10,17l-5-5l1.41-1.41L10,14.17l7.59-7.59L19,8L10,17z"/></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 transition-colors"><path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.42,0-8-3.58-8-8s3.58-8,8-8s8,3.58,8,8S16.42,20,12,20z"/></svg>)}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${todo.completed ? 'text-gray-400 dark:text-gray-500 line-through' : ''}`}>{todo.title}</p>
                          <div className="flex items-center mt-1"><Clock className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500"/><span className="text-xs text-gray-500 dark:text-gray-400">{todo.due}</span></div>
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
                       <button onClick={() => toggleTodo(todo.id)} className="w-5 h-5 flex items-center justify-center transition-all focus:outline-none">
                          {todo.completed ? (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-green-500"><path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M10,17l-5-5l1.41-1.41L10,14.17l7.59-7.59L19,8L10,17z"/></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 transition-colors"><path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.42,0-8-3.58-8-8s3.58-8,8-8s8,3.58,8,8S16.42,20,12,20z"/></svg>)}
                        </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${todo.completed ? 'text-gray-400 dark:text-gray-500 line-through' : ''}`}>{todo.title}</p>
                        <div className="flex items-center mt-1"><Clock className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500"/><span className="text-xs text-gray-500 dark:text-gray-400">{todo.due}</span></div>
          </div>
                  </div>
                  </li>
                ))}
              </ul>
            )}
                </CardContent>
          <CardFooter className="p-3 border-t bg-gray-50 dark:bg-gray-800/50">
            <Button variant="ghost" size="sm" className="w-full flex items-center justify-center font-medium bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity" onClick={() => setExpandedTodos(!expandedTodos)}>
              {expandedTodos ? (<><ChevronUp className="h-4 w-4 mr-1 text-purple-500" /> Weniger anzeigen</>) : (<><ChevronDown className="h-4 w-4 mr-1 text-purple-500" /> Alle anzeigen</>)}
                  </Button>
                </CardFooter>
              </Card>

      <Card className="mb-6 overflow-hidden border-none shadow-md bg-white dark:bg-gray-900">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 flex flex-row justify-between items-center">
            <CardTitle className="text-lg flex items-center"><Briefcase className="mr-2 h-5 w-5" />Anstehende Einsätze</CardTitle>
            <div className="relative">
              <button ref={miniCalendarButtonRef} className="flex items-center text-sm font-medium hover:bg-white/10 p-1 rounded-md transition-colors" onClick={(e) => { e.stopPropagation(); setMiniCalendarDisplayMonth(new Date(currentCalendarDate)); setShowMiniCalendar(!showMiniCalendar); }}>
                <span>{formatDateRange(getCalendarDays()[1], getCalendarDays()[7])}</span>
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showMiniCalendar ? 'rotate-180' : ''}`} />
              </button>
              {showMiniCalendar && (
                <div ref={miniCalendarPopupRef} className="absolute top-full right-0 mt-1.5 w-72 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-50 p-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <button onClick={() => navigateMiniCalendarMonth(-1)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" /></button>
                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{miniCalendarDisplayMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => navigateMiniCalendarMonth(1)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" /></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 mb-1">{['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => <span key={day}>{day}</span>)}</div>
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(miniCalendarDisplayMonth).map((day, index) => {
                      let hoverClass = ''
                      if (hoveredMiniCalendarDate && day) {
                        const diff = Math.round((day.getTime() - hoveredMiniCalendarDate.getTime()) / (1000 * 60 * 60 * 24));
                        const absDiff = Math.abs(diff);
                        if (absDiff === 0) hoverClass = 'bg-indigo-500 text-white dark:bg-indigo-500 dark:text-white';
                        else if (absDiff === 1) hoverClass = 'bg-indigo-400 text-white dark:bg-indigo-400 dark:text-white';
                        else if (absDiff === 2) hoverClass = 'bg-indigo-300 text-gray-100 dark:bg-indigo-300 dark:text-gray-200';
                      }
                      return (
                        <button key={index} onMouseEnter={() => day && setHoveredMiniCalendarDate(day)} onMouseLeave={() => setHoveredMiniCalendarDate(null)} 
                                className={`p-1.5 rounded-md text-sm transition-colors relative ${!day ? 'cursor-default' : ''} ${hoverClass ? hoverClass : (day && selectedCalendarDate.toDateString() === day.toDateString() ? 'bg-indigo-600 text-white' : (day && new Date().toDateString() === day.toDateString() ? 'font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/50' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'))}`}
                                disabled={!day}
                                onClick={() => { if (day) { const newDate = new Date(day); setCurrentCalendarDate(newDate); setSelectedCalendarDate(newDate); setAnimating(true); setTimeout(() => setAnimating(false), 400); setShowMiniCalendar(false); setHoveredMiniCalendarDate(null); } }}>
                          {day ? (<>{day.getDate()}<div className="absolute bottom-1 left-0 right-0 flex justify-center space-x-1 px-1">
                            {assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "promotion") && (<div className="h-1 w-2/5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600"></div>)}
                            {assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "buddy") && (<div className="h-1 w-2/5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>)}
                            {assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "schulung") && (<div className="h-1 w-2/5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"></div>)}
                            {assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "urlaub") && (<div className="h-1 w-2/5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500"></div>)}
                          </div></>) : ''}
                        </button>)})}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 relative">
            <div className="absolute top-2 left-2 z-10">
              <Button ref={legendIconRef} variant="ghost" size="icon" className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full" onClick={(e) => { e.stopPropagation(); setShowLegendPopup(!showLegendPopup); }}><Info className="h-4 w-4" /></Button>
            </div>
            {showLegendPopup && (
              <div ref={legendPopupRef} className="absolute top-10 left-2 mt-1 w-auto min-w-[230px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-4" onClick={(e) => e.stopPropagation()}>
                <h4 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-100">Kalender Legende</h4>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center"><div className="w-3.5 h-3.5 rounded-full mr-2.5 border border-indigo-600/50 bg-gradient-to-br from-indigo-500/60 to-indigo-600/60 flex-shrink-0 shadow-sm"></div><span className="text-gray-700 dark:text-gray-300">Promotion / Ausgewählt</span></li>
                  <li className="flex items-center"><div className="w-3.5 h-3.5 rounded-full mr-2.5 border border-purple-500/50 bg-gradient-to-br from-purple-500/60 to-pink-500/60 flex-shrink-0 shadow-sm"></div><span className="text-gray-700 dark:text-gray-300">Buddy Tag</span></li>
                  <li className="flex items-center"><div className="w-3.5 h-3.5 rounded-full mr-2.5 border border-orange-500/50 bg-gradient-to-br from-orange-500/60 to-amber-500/60 flex-shrink-0 shadow-sm"></div><span className="text-gray-700 dark:text-gray-300">Schulung</span></li>
                  <li className="flex items-center"><div className="w-3.5 h-3.5 rounded-full mr-2.5 border border-emerald-500/50 bg-gradient-to-br from-emerald-500/60 to-green-500/60 flex-shrink-0 shadow-sm"></div><span className="text-gray-700 dark:text-gray-300">Urlaub</span></li>
                  <li className="flex items-center"><div className="w-3.5 h-3.5 rounded-full mr-2.5 border border-indigo-400/50 bg-indigo-100 dark:bg-indigo-800/50 flex-shrink-0 shadow-sm"></div><span className="text-gray-700 dark:text-gray-300">Heute (ohne Einsatz)</span></li>
                </ul>
              </div>
            )}
            <div className="relative mb-0 py-2"><div className="w-full max-w-md mx-auto relative h-24"><div className="w-full h-full relative">
              {getCalendarDays().map((day, i) => {
                const visibleIndex = i - 1; const isCenter = visibleIndex === 3; const distanceFromCenter = Math.abs(visibleIndex - 3);
                const isSelected = selectedCalendarDate.toDateString() === day.toDateString(); const isToday = new Date().toDateString() === day.toDateString();
                const isOffscreen = visibleIndex < 0 || visibleIndex > 6;
                const hasAssignment = assignments.some(a => a.date.toDateString() === day.toDateString());
                const hasBuddyTag = assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "buddy");
                const hasSchulung = assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "schulung");
                let dynamicClasses = '';
                if (isSelected) dynamicClasses = 'text-black border-indigo-700';
                else if (hasBuddyTag) { dynamicClasses = 'border-purple-500'; if (isToday) dynamicClasses += ' bg-purple-100 dark:bg-purple-800/50'; else dynamicClasses += ' hover:bg-purple-50 dark:hover:bg-purple-900/50'; }
                else if (assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "urlaub")) { dynamicClasses = 'border-emerald-500'; if (isToday) dynamicClasses += ' bg-emerald-50 dark:bg-emerald-900/30'; else dynamicClasses += ' hover:bg-emerald-50 dark:hover:bg-emerald-900/20';}
                else if (assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "schulung")) { dynamicClasses = 'border-orange-500'; if (isToday) dynamicClasses += ' bg-orange-50 dark:bg-orange-900/30'; else dynamicClasses += ' hover:bg-orange-50 dark:hover:bg-orange-900/20';}
                else if (hasAssignment) { dynamicClasses = 'border-blue-500'; if (isToday) dynamicClasses += ' bg-indigo-100 dark:bg-indigo-800/50'; else dynamicClasses += ' hover:bg-indigo-50 dark:hover:bg-indigo-900/50';}
                else if (isToday) dynamicClasses = 'bg-indigo-100 dark:bg-indigo-800/50 border-indigo-400';
                else dynamicClasses = 'border-gray-300 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50';
                const scale = isOffscreen ? 0.4 : 1 - (distanceFromCenter * 0.15); const opacity = isOffscreen ? 0 : 1 - (distanceFromCenter * 0.15); const zIndex = isOffscreen ? 0 : 10 - distanceFromCenter;
                let leftPosition; if (visibleIndex < 0) leftPosition = '-15%'; else if (visibleIndex > 6) leftPosition = '115%'; else leftPosition = `${50 + (visibleIndex - 3) * 20}%`;
                return (<div key={day.toISOString()} className="absolute transform transition-all duration-400 ease-in-out" style={{left: leftPosition, top: '50%', transform: `translate(-50%, -50%) scale(${scale})`, opacity: opacity, zIndex: zIndex, transition: "all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1.0)"}}>
                  <Button variant="outline" size="lg" className={`flex flex-col h-auto py-2 px-4 w-16 items-center justify-center overflow-hidden ${isCenter ? 'border-2' : 'border'} ${!isSelected ? dynamicClasses : (hasBuddyTag ? 'border-purple-500' : assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "urlaub") ? 'border-emerald-500' : assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "schulung") ? 'border-orange-500' : 'border-indigo-700')}`}
                          style={isSelected ? (hasBuddyTag ? {background: 'linear-gradient(to bottom, rgba(168,85,247,0.9), rgba(219,39,119,0.55))'} : assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "urlaub") ? {background: 'linear-gradient(to bottom, rgba(16,185,129,0.8), rgba(34,197,94,0.6))'} : assignments.some(a => a.date.toDateString() === day.toDateString() && a.type === "schulung") ? {background: 'linear-gradient(to bottom, rgba(249,115,22,0.8), rgba(234,88,12,0.6))'} : hasAssignment ? {background: 'linear-gradient(to bottom, rgba(79,70,229,0.9), rgba(79,70,229,0.55))'} : {background: 'linear-gradient(to bottom, rgba(243,244,246,0.95), rgba(249,250,251,0.85))'}) : {}}
                          onClick={() => { const stepsToShift = Math.round((day.getTime() - currentCalendarDate.getTime()) / (1000 * 60 * 60 * 24)); navigateDays(stepsToShift); }} disabled={animating}>
                    {isSelected ? (<div className="flex flex-col items-center w-full"><span className={`text-xs font-medium mb-1 ${hasSchulung ? 'text-gray-700' : (hasBuddyTag || hasAssignment) ? 'text-white' : 'text-gray-700'}`}>{day.toLocaleDateString('de-DE', { weekday: 'short' })}</span><span className={`text-xl font-bold ${hasSchulung ? 'text-gray-800' : (hasBuddyTag || hasAssignment) ? 'text-white' : 'text-gray-800'}`}>{day.getDate()}</span></div>) : (<><span className="text-xs font-medium mb-1">{day.toLocaleDateString('de-DE', { weekday: 'short' })}</span><span className="text-xl font-bold">{day.getDate()}</span></>)}
                  </Button></div>);})}
            </div></div></div>
            <div className="flex justify-center items-center space-x-12 mb-1 -mt-1">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded-full p-2" onClick={() => navigateDays(-1)} disabled={animating}><ArrowLeft className="h-6 w-6" /></Button>
              <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded-full p-2" onClick={() => navigateDays(1)} disabled={animating}><ArrowRight className="h-6 w-6" /></Button>
            </div>
            <div className="h-[90px] min-h-[90px]">
              {(() => {
                const dailyAssignmentsFiltered = assignments.filter(a => a.date.toDateString() === selectedCalendarDate.toDateString() && a.type !== "urlaub");

                if (dailyAssignmentsFiltered.length > 0) {
                  const assignment = dailyAssignmentsFiltered[0]; // Show only the first one

                  if (assignment.type === "promotion") {
                    return (
                      <div key={assignment.id} className="h-full p-3 rounded-md border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20 relative">
                        {/* Absolute positioned vertical bar spanning full height */}
                        <div className="absolute left-3 top-3 bottom-3 w-1.5 rounded-sm bg-gradient-to-b from-blue-400 to-indigo-600"></div>
                        
                        {/* Content container with appropriate left padding */}
                        <div className="h-full flex flex-col ml-3">
                          {/* Top part: Title and Location */}
                          <div className="mb-auto">
                            <p className="text-sm font-medium pl-2">{assignment.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center cursor-pointer hover:text-blue-600 transition-colors pl-2" onClick={() => handleAddressClick(assignment.location)}>
                              <MapPin className="h-3 w-3 mr-1"/>{assignment.location}
                            </p>
        </div>

                          {/* Bottom part: Timestamp and Button */}
                          <div className="flex justify-between items-center mt-1.5">
                            <Badge className="text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm whitespace-nowrap rounded-full ml-2">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1.5 opacity-90" />{assignment.time}
                              </span>
                            </Badge>
                            <div className="text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-sm whitespace-nowrap rounded-full cursor-pointer" style={{ height: '22px' }}>
                              <span className="flex items-center">Einsatz starten <ChevronRight className="h-3 w-3 ml-1 opacity-90" /></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (assignment.type === "schulung") {
                    return (
                      <div key={assignment.id} className="h-full p-3 rounded-md border border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/20 relative">
                        {/* Absolute positioned vertical bar spanning full height */}
                        <div className="absolute left-3 top-3 bottom-3 w-1.5 rounded-sm bg-gradient-to-b from-orange-400 to-amber-600"></div>
                        
                        {/* Content container with appropriate left padding */}
                        <div className="h-full flex flex-col ml-3">
                          {/* Top part: Title and Location */}
                          <div className="mb-auto">
                            <p className="text-sm font-medium pl-2">{assignment.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center cursor-pointer hover:text-orange-600 transition-colors pl-2" onClick={() => handleAddressClick(assignment.location)}>
                              <MapPin className="h-3 w-3 mr-1"/>{assignment.location}
            </p>
          </div>

                          {/* Bottom part: Timestamp and Button */}
                          <div className="flex justify-between items-center mt-1.5">
                            <Badge className="text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0 shadow-sm whitespace-nowrap rounded-full ml-2">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1.5 opacity-90" />{assignment.time}
                              </span>
                            </Badge>
                            <div className="text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-sm whitespace-nowrap rounded-full cursor-pointer" style={{ height: '22px' }}>
                              <span className="flex items-center">Details anzeigen <ChevronRight className="h-3 w-3 ml-1 opacity-90" /></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (assignment.type === "buddy") {
                    return (
                      <div key={assignment.id} className={`h-full p-3 rounded-md border flex items-center justify-between border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/20`}>
                        {/* Left side content block */}
                        <div>
                          <div className="relative pl-3">
                            <span className={`absolute left-0 top-0 h-full w-1.5 rounded-sm bg-gradient-to-b from-purple-500 to-pink-500`}></span>
                            <p className="text-sm font-medium">{assignment.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleAddressClick(assignment.location)}>
                              <MapPin className="h-3 w-3 mr-1"/>{assignment.location}
                            </p>
                          </div>
                        </div>
                        {/* Right side content block (for buddy, this is where its badges and button go) */}
                        <div className={`flex flex-col items-end h-full py-1 justify-center space-y-0.5`}>
                          <Badge className="text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-sm whitespace-nowrap rounded-full">
                            <span className="flex items-center">Buddy: Cesira</span>
                          </Badge>
                          <Badge className="text-xs font-medium px-2 py-0.5 mt-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm whitespace-nowrap rounded-full">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1.5 opacity-90" />{assignment.time}
                            </span>
                          </Badge>
                           <div className="text-xs font-medium px-2 py-0.5 mt-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-sm whitespace-nowrap rounded-full cursor-pointer" style={{ height: '22px' }}>
                            <span className="flex items-center">Einsatz starten <ChevronRight className="h-3 w-3 ml-1 opacity-90" /></span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null; // Fallback for other types if not handled explicitly
                } else {
                  // No promotion, schulung, or buddy assignments for this day.
                  // Check if the day was an Urlaub day; if so, show nothing. Otherwise, show "Keine Termine".
                  const isUrlaubDay = assignments.some(a => a.date.toDateString() === selectedCalendarDate.toDateString() && a.type === "urlaub");
                  if (!isUrlaubDay) {
                    return (
                      <div className="h-full p-3 rounded-md border dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 opacity-70" />Keine Termine für diesen Tag geplant.
                        </p>
                      </div>
                    );
                  }
                  return null; // It's an Urlaub day, show nothing here.
                }
              })()}
                </div>
              </CardContent>
            </Card>

      <h2 className="text-lg font-semibold mb-3">Schnellzugriff</h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-850 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:scale-105">
            <ClipboardList className="h-9 w-9 text-gray-600 dark:text-gray-400" />
          </div>
          <span className="text-xs mt-2 text-gray-700 dark:text-gray-300 text-center">Schulungs-<br />unterlagen</span>
                </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-850 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:scale-105">
            <VideoIcon className="h-9 w-9 text-gray-600 dark:text-gray-400" />
                </div>
          <span className="text-xs mt-2 text-gray-700 dark:text-gray-300">Videos</span>
                </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-850 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:scale-105">
            <MessagesSquareIcon className="h-9 w-9 text-gray-600 dark:text-gray-400" />
          </div>
          <span className="text-xs mt-2 text-gray-700 dark:text-gray-300">Chat</span>
        </div>
          </div>

      <Card className="mb-6 overflow-hidden border-none shadow-md bg-white dark:bg-gray-900">
          <CardHeader className="p-4"><CardTitle className="text-lg">Wochenstatus</CardTitle><CardDescription>Deine Aktivitäten diese Woche</CardDescription></CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-4">
              <div><div className="flex items-center justify-between mb-1"><span className="text-sm">Arbeitsstunden</span><span className="text-sm font-medium">24/40</span></div><div className="h-2 w-full bg-blue-100 dark:bg-blue-950/30 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-300 to-blue-600 rounded-full" style={{ width: '60%' }}></div></div></div>
              <div><div className="flex items-center justify-between mb-1"><span className="text-sm">Erledigte Aufgaben</span><span className="text-sm font-medium">7/12</span></div><div className="h-2 w-full bg-blue-100 dark:bg-blue-950/30 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-300 to-blue-600 rounded-full" style={{ width: '58%' }}></div></div></div>
              <div><div className="flex items-center justify-between mb-1"><span className="text-sm">Schulungen</span><span className="text-sm font-medium">1/2</span></div><div className="h-2 w-full bg-blue-100 dark:bg-blue-950/30 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-300 to-blue-600 rounded-full" style={{ width: '50%' }}></div></div></div>
                    </div>
                  </CardContent>
                </Card>

      {showMapsModal && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm" onClick={() => setShowMapsModal(false)}></div>
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl z-50 p-4 w-72">
            <h3 className="text-lg font-medium mb-3">Wegbeschreibung zu</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedAddress}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={openInGoogleMaps} className="flex items-center justify-center py-2.5 px-4 bg-white border border-gray-100 dark:border-gray-700 dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                <img src="/icons/google-maps-icon.svg" alt="Google Maps" width={20} height={20} className="mr-2.5"/>
                <span className="font-medium text-sm">Google Maps</span>
              </button>
              <button onClick={openInAppleMaps} className="flex items-center justify-center py-2.5 px-4 bg-white border border-gray-100 dark:border-gray-700 dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                <img src="/icons/apple-maps-icon.svg" alt="Apple Maps" width={20} height={20} className="mr-2.5"/>
                <span className="font-medium text-sm">Apple Maps</span>
              </button>
            </div>
            <button onClick={() => setShowMapsModal(false)} className="w-full mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm">Abbrechen</button>
          </div>
        </>
      )}
       <div className={`fixed inset-0 z-20 ${showFilterDropdown ? 'block' : 'hidden'}`} onClick={() => setShowFilterDropdown(false)}></div>
    </>
  );
}
