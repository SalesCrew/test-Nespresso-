"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import AdminNavigation from "../../../components/AdminNavigation";
import AdminEddieAssistant from "../../../components/AdminEddieAssistant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, Calendar, ChevronDown, ChevronLeft, ChevronRight, X, Users, CheckSquare, Zap, Check, Pause } from "lucide-react";

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
  
  // Promotor selection state
  const [showPromotorSelection, setShowPromotorSelection] = useState(false);
  const [selectedPromotors, setSelectedPromotors] = useState<string[]>([]);
  const [activeRegionFilter, setActiveRegionFilter] = useState<string>("all");
  const [promotorSelectionSearch, setPromotorSelectionSearch] = useState("");
  
  // Calendar state
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [dateViewMode, setDateViewMode] = useState<'weeks' | 'calendar'>('weeks');
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const weeksContainerRef = useRef<HTMLDivElement>(null);

  // Handle validation toggle
  const handleValidationToggle = () => {
    if (selectedPromotors.length > 0 && (selectedWeeks.length > 0 || dateRange.start)) {
      setIsValidating(!isValidating);
    }
  };

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
      <div className="absolute left-0 right-0 top-[73px] bottom-0 pointer-events-none overflow-hidden">
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
              
              {/* Left Card - Bigger */}
              <Card 
                className="lg:col-span-1 h-[500px] shadow-md transition-all duration-200 border-0 bg-white relative z-10"
                style={{
                  ...(isValidating && {
                    animation: 'strokePulseRed 2s ease-in-out infinite'
                  })
                }}
              >
                <CardContent className="p-8 h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                      <Cpu className="h-6 w-6" />
                    </div>
                    <p className="text-sm">Linke Karte</p>
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
                <CardContent className="p-0 h-full flex flex-col relative">
                  {/* Header Section */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-7 h-7 rounded flex items-center justify-center"
                        style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)', opacity: 0.85}}
                      >
                        <Cpu className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">DemoTool Agent</h3>
                    </div>
                  </div>

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
                        `
                      }} />
                      {matrixAnimation}
                    </>
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

                    {/* Spinning Zap Icon - absolutely positioned in center */}
                    {isValidating && (
                      <div className="absolute top-0 left-0 right-0 bottom-20 flex items-center justify-center pointer-events-none">
                        <Zap className="h-11 w-11 text-green-600 icon-spin-pulse" />
                      </div>
                    )}

                    {/* Validierung Button */}
                    <div className="pt-2">
                      <button 
                        onClick={handleValidationToggle}
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
                <CardContent className="p-8 h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                      <Cpu className="h-6 w-6" />
                    </div>
                    <p className="text-sm">Rechte Karte</p>
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

      {/* Eddie KI Assistant */}
      <AdminEddieAssistant />
    </div>
  );
} 