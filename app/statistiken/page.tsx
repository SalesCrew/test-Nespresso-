"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, ArrowLeft, ChevronDown, ChevronUp, X, BarChart2, History, Info } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function StatistikenPage() {
  const [timeFrame, setTimeFrame] = useState<"30days" | "6months" | "alltime">("30days")
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [historyPage, setHistoryPage] = useState(0)
  const entriesPerPage = 15
  const [showInfoContent, setShowInfoContent] = useState(false)
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<number | null>(null)
  const [showNewFeedback, setShowNewFeedback] = useState(true)
  const [feedbackRead, setFeedbackRead] = useState(false)
  
  // Feedback texts for history entries
  const feedbackTexts = [
    // For newest month - use existing feedback
    `Liebe Eveline,

ich darf dir heute deine Mai KPIs zukommen lassen.

Trotz der Herausforderungen, die der Frühling mit sich bringt, machst du das Beste draus und dafür ein großes Dankeschön unsererseits. 😊

Hier ein Rückblick auf deine Mai-Zahlen:

MC/ET: 1.8 (Platz 51)
TMA Anteil: 91%
VL Share: 20% (Platz 7)

Du bist im Bereich "VL Share" auf einem beeindruckenden Platz 7. Das zeigt, dass du einen hervorragenden Beitrag leistest, unsere Vertuo-Reihe zu fördern. Beim "TMA Anteil" gehörst du zu den Besten, was eine tolle Leistung ist. Im Bereich "MC/ET" bist du aktuell auf Platz 51. Hier gibt es sicherlich noch Potenzial nach oben, um deine Verkäufe an Kaffeemaschinen pro Einsatztag zu steigern.

Bleib dran und lass uns gemeinsam weiter daran arbeiten, die Verkaufszahlen zu verbessern.

Liebe Grüße, dein Nespresso Team.`,
    // Template 1
    `Liebe Gertrud,

ich darf dir heute deine Mai KPIs zukommen lassen.

Trotz der aktuellen Herausforderungen machst du das Beste draus und dafür ein großes Dankeschön unsererseits. 😊

Hier ein Rückblick auf deine Mai-Zahlen:

MC/ET: 4.0 (Platz 4)  
TMA Anteil: 70%  
VL Share: 19% (Platz 3)

Du bist diesen Monat in den Bereichen MC/ET und VL Share unter den Top 3. Das ist eine großartige Leistung und zeigt, wie engagiert du bist. Beim TMA-Anteil bist du im Mittelfeld, da gibt es sicherlich noch Potenzial nach oben. Deine konstanten Ergebnisse sind beeindruckend, bleib dran!

Solltest du noch Tipps und Tricks brauchen, kannst du dich jederzeit bei uns melden. 😊

Liebe Grüße, dein Nespresso Team`,
    // Template 2
    `Lieber Johann,

ich darf dir heute deine Mai KPIs zukommen lassen.

Trotz der Herausforderungen, die der Einzelhandel manchmal mit sich bringt, machst du das Beste draus und dafür ein großes Dankeschön unsererseits. 😊

Hier ein Rückblick auf deine Mai-Zahlen:

MC/ET: 4.7 (Platz 3)  
TMA-Anteil: 97%  
VL Share: 12% (Platz 4)  

Du hast im Mai wirklich beeindruckende Arbeit geleistet. Mit einem MC/ET-Wert von 4.7 bist du auf einem hervorragenden 3. Platz. Das zeigt, wie effektiv du im Verkauf von Kaffeemaschinen bist. Dein TMA-Anteil von 97% ist absolute Spitzenklasse, eine Leistung, die nur wenige erreichen. Auch beim VL Share liegst du mit 12% auf einem starken 4. Platz. Das ist eine solide Leistung, die deine Fähigkeit unterstreicht, auch unsere Vertuo-Reihe erfolgreich zu verkaufen.

Mach weiter so, Johann! Deine konsequente Arbeit trägt einen großen Teil zu unserem gemeinsamen Erfolg bei und wir sind gespannt auf die Ergebnisse des nächsten Monats.

Liebe Grüße, dein Nespresso Team.`,
    // Template 3
    `Liebe Ulrike,

ich darf dir heute deine Mai KPIs zukommen lassen.

Trotz der stabilen Marktlage machst du das Beste draus und dafür ein großes Dankeschön unsererseits. 😊

Hier ein Rückblick auf deine Mai-Zahlen:

MC/ET: 7.3 (Platz 1)
TMA Anteil: 94%
VL Share: 23% (Platz 2)

Du hast im Mai mit deinem MC/ET den ersten Platz erreicht – eine wirklich beeindruckende Leistung! Deine hohe Verkaufszahl spiegelt dein Engagement wider und zeigt, dass du genau weißt, wie man Kunden begeistert. Auch dein VL Share ist mit Platz 2 bemerkenswert und zeigt, dass du einen hervorragenden Job machst. Beim TMA-Anteil gehörst du zu den Besten, was zeigt, wie effektiv du die Kundenbindung vor Ort gestaltest.

Mach weiter so, deine Arbeit ist inspirierend!

Liebe Grüße, dein Nespresso Team.`
  ]

  // Auto-scroll when feedback is opened
  useEffect(() => {
    if (feedbackOpen && feedbackRef.current) {
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 400)
    }
  }, [feedbackOpen])

  // Auto-hide info content after 7 seconds
  useEffect(() => {
    if (showInfoContent) {
      const timer = setTimeout(() => {
        setShowInfoContent(false)
      }, 7000)
      
      return () => clearTimeout(timer)
    }
  }, [showInfoContent])

  // Hide feedback card 5 seconds after being read
  useEffect(() => {
    if (feedbackRead) {
      const timer = setTimeout(() => {
        setShowNewFeedback(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [feedbackRead])
  
  const toggleFeedback = () => {
    setFeedbackOpen(!feedbackOpen)
  }

  const handleFeedbackRead = () => {
    setFeedbackRead(true)
  }

  // Generate mock history data - only once when component mounts
  const [historyData] = useState(() => {
    const data = []
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
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
        vl: parseInt(vl)
      })
    }
    
    return data
  })
  
  const currentPageData = historyData.slice(historyPage * entriesPerPage, (historyPage + 1) * entriesPerPage)
  
  const totalPages = Math.ceil(historyData.length / entriesPerPage)
  
  const navigateHistoryNext = () => {
    if (historyPage < totalPages - 1) {
      setHistoryPage(historyPage + 1)
    }
  }
  
  const navigateHistoryPrev = () => {
    if (historyPage > 0) {
      setHistoryPage(historyPage - 1)
    }
  }

  // Calculate statistics from history data
  const calculateStatsData = () => {
    // Calculate averages for all time
    const allTimeAvg = {
      mcet: historyData.reduce((sum, entry) => sum + entry.mcet, 0) / historyData.length,
      tma: historyData.reduce((sum, entry) => sum + entry.tma, 0) / historyData.length,
      vl: historyData.reduce((sum, entry) => sum + entry.vl, 0) / historyData.length
    }

    // Get current month (most recent entry) and comparison months
    const currentMonth = historyData[0] // Most recent
    const lastMonth = historyData[1] // Previous month  
    const sixMonthsAgo = historyData[6] // 6 months ago

    // Calculate averages for last 6 months
    const last6MonthsData = historyData.slice(0, 6)
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

  const statsData = calculateStatsData()

  // Helper function to determine color based on value
  const getColorForMcEt = (value: number) => {
    if (value >= 4.5) return "text-green-600 dark:text-green-400"
    if (value >= 4.0) return "custom-orange"
    return "text-red-600 dark:text-red-400"
  }

  const getColorForTma = (value: number) => {
    if (value >= 75) return "text-green-600 dark:text-green-400"
    if (value >= 65) return "custom-orange"
    return "text-red-600 dark:text-red-400"
  }

  const getColorForVlShare = (value: number) => {
    if (value >= 10) return "text-green-600 dark:text-green-400"
    if (value >= 6) return "custom-orange"
    return "text-red-600 dark:text-red-400"
  }

  // Helper function to get style for custom orange
  const getStyleForColor = (colorClass: string) => {
    if (colorClass === "custom-orange") {
      return { color: "#FD7E14" }
    }
    return {}
  }

  // Helper function to get pill color based on change type
  const getPillColor = (changePercent: string, timeFrame: string) => {
    if (timeFrame === "alltime") {
      // For all-time, green = positive (above optimal), red = negative (below optimal)
      return changePercent.startsWith('+') ? 'bg-green-600/30 dark:bg-green-500/30 text-green-800 dark:text-green-200' : 'bg-red-600/30 dark:bg-red-500/30 text-red-800 dark:text-red-200'
    } else {
      // For 30days and 6months, green = positive change, red = negative change
      return changePercent.startsWith('+') ? 'bg-green-600/30 dark:bg-green-500/30 text-green-800 dark:text-green-200' : 'bg-red-600/30 dark:bg-red-500/30 text-red-800 dark:text-red-200'
    }
  }

  const timeFrameLabels = {
    "30days": "Letzte 30 Tage",
    "6months": "Letzte 6 Monate",
    "alltime": "Gesamt"
  }

  const infoExplanations = {
    "30days": {
      title: "Letzter Monat",
      description: "Zeigt deine aktuellen Werte vom letzten Monat. Die bunten Pillen zeigen, wie viel Prozent sich im Vergleich zum Vormonat geändert hat.",
      examples: "Grün = Verbesserung, Rot = Verschlechterung"
    },
    "6months": {
      title: "Letzten 6 Monate", 
      description: "Zeigt den Durchschnitt der letzten 6 Monate. Die bunten Pillen zeigen die Veränderung von vor 6 Monaten zu heute.",
      examples: "Grün = Verbesserung, Rot = Verschlechterung"
    },
    "alltime": {
      title: "Gesamter Zeitraum",
      description: "Zeigt deinen Durchschnitt über alle verfügbaren Monate. Die bunten Pillen zeigen, wie weit du von den optimalen Werten entfernt bist.",
      examples: "Grün = Über Optimal (MC/ET: 4,5+, TMA: 75%+, VL: 10%+), Rot = Unter Optimal"
    }
  }

  const handlePrevTimeFrame = () => {
    if (timeFrame === "30days") setTimeFrame("alltime")
    else if (timeFrame === "6months") setTimeFrame("30days")
    else setTimeFrame("6months")
  }

  const handleNextTimeFrame = () => {
    if (timeFrame === "30days") setTimeFrame("6months")
    else if (timeFrame === "6months") setTimeFrame("alltime")
    else setTimeFrame("30days")
  }

  // Helper function to get feedback text for entry
  const getFeedbackText = (entryIndex: number) => {
    if (entryIndex === 0) return feedbackTexts[0] // Use existing feedback for newest month
    return feedbackTexts[((entryIndex - 1) % 3) + 1] // Cycle through templates 1-3 for older entries
  }

  return (
    <>
      {/* Header Section - New Design */}
      <section className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-1">Deine CA KPIs</h1>
        <div className="text-gray-600 dark:text-gray-400">
          <div className="inline-block typing-animation typing-container" style={{animationDuration: '2.5s', width: 'fit-content'}}>
            Erforsche deine persönlichen KPIs!
          </div>
        </div>
      </section>

      <div className="flex flex-col items-center mb-12">
        <div className="relative w-full max-w-md">
          <Card className="w-full shadow-md dark:shadow-slate-900/30 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden relative z-10">
            {/* Header with purple gradient */}
            <div className="py-3 px-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <h3 className="text-center font-medium text-white flex items-center justify-center">
                <BarChart2 className="h-4 w-4 mr-2" />
                {timeFrameLabels[timeFrame]}
              </h3>
            </div>
            
            <CardContent className="p-0">
              {/* Statistics section with navigation arrows on sides */}
              <div className="relative p-3 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-800/20">
                {!showInfoContent ? (
                  <>
                    {/* Info button - positioned in top-left corner */}
                    <button 
                      onClick={() => setShowInfoContent(true)}
                      className="absolute left-2 top-2 p-1 opacity-40 hover:opacity-80 transition-opacity z-10"
                    >
                      <Info className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                    </button>

                    {/* Left arrow */}
                    <button 
                      onClick={handlePrevTimeFrame}
                      className="absolute left-1 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>

                    <div className="space-y-1 mx-8">
                      {/* MC/ET */}
                      <div className="text-center py-0.5">
                        <div className="flex items-center justify-center">
                          <div className="text-right text-gray-500 dark:text-gray-400">Avg MC/</div>
                          <div className="text-right text-gray-500 dark:text-gray-400">ET:</div>
                          <div 
                            className={`font-semibold ${getColorForMcEt(statsData[timeFrame].mcet.value) !== "custom-orange" ? getColorForMcEt(statsData[timeFrame].mcet.value) : ""}`}
                            style={{marginLeft: '4px', ...getStyleForColor(getColorForMcEt(statsData[timeFrame].mcet.value))}}
                          >
                            {statsData[timeFrame].mcet.value.toFixed(1)}
                          </div>
                          <div className={`text-xs ${getPillColor(statsData[timeFrame].mcet.changePercent, timeFrame)} rounded-full px-1 py-0`} style={{marginLeft: '4px'}}>
                            {statsData[timeFrame].mcet.changePercent}
                          </div>
                        </div>
                      </div>
                      
                      {/* TMA */}
                      <div className="text-center py-0.5">
                        <div className="flex items-center justify-center">
                          <div className="text-right text-gray-500 dark:text-gray-400">Avg TMA:</div>
                          <div 
                            className={`font-semibold ${getColorForTma(statsData[timeFrame].tma.value) !== "custom-orange" ? getColorForTma(statsData[timeFrame].tma.value) : ""}`}
                            style={{marginLeft: '4px', ...getStyleForColor(getColorForTma(statsData[timeFrame].tma.value))}}
                          >
                            {statsData[timeFrame].tma.value.toFixed(1)}%
                          </div>
                          <div className={`text-xs ${getPillColor(statsData[timeFrame].tma.changePercent, timeFrame)} rounded-full px-1 py-0`} style={{marginLeft: '4px'}}>
                            {statsData[timeFrame].tma.changePercent}
                          </div>
                        </div>
                      </div>
                      
                      {/* VL Share */}
                      <div className="text-center py-0.5">
                        <div className="flex items-center justify-center">
                          <div className="text-right text-gray-500 dark:text-gray-400">Avg VL</div>
                          <div className="text-right text-gray-500 dark:text-gray-400">Share:</div>
                          <div 
                            className={`font-semibold ${getColorForVlShare(statsData[timeFrame].vlShare.value) !== "custom-orange" ? getColorForVlShare(statsData[timeFrame].vlShare.value) : ""}`}
                            style={{marginLeft: '4px', ...getStyleForColor(getColorForVlShare(statsData[timeFrame].vlShare.value))}}
                          >
                            {statsData[timeFrame].vlShare.value.toFixed(1)}%
                          </div>
                          <div className={`text-xs ${getPillColor(statsData[timeFrame].vlShare.changePercent, timeFrame)} rounded-full px-1 py-0`} style={{marginLeft: '4px'}}>
                            {statsData[timeFrame].vlShare.changePercent}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right arrow */}
                    <button 
                      onClick={handleNextTimeFrame}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  /* Info content displayed centered in the card */
                  <div className="flex items-center justify-center h-[100px] px-3">
                    <div className="text-center max-w-full">
                      <h4 className="font-semibold text-sm mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {infoExplanations[timeFrame].title}
                      </h4>
                      <p className="text-xs text-gray-700 dark:text-gray-200 mb-2 leading-tight">
                        {infoExplanations[timeFrame].description}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-tight">
                        <span className="text-green-600 dark:text-green-400 font-medium">Grün</span> = Gut, <span className="text-red-600 dark:text-red-400 font-medium">Rot</span> = Schlecht
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Feedback dropdown that peeks from behind the card - only visible when feedback is closed */}
          <div 
            className={`absolute left-1/2 transform -translate-x-1/2 -bottom-[1.65rem] z-0 flex justify-center w-full transition-all duration-500 ${
              feedbackOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <div 
              className="bg-white dark:bg-gray-900 shadow-sm rounded-b-xl px-8 py-1 border border-gray-100 dark:border-gray-800 cursor-pointer w-52 text-center filter drop-shadow-md"
              onClick={toggleFeedback}
            >
              <button className="flex items-center justify-center w-full">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent text-xs font-medium opacity-75">letztes feedback</span>
                <ChevronDown className="h-3.5 w-3.5 ml-1 text-pink-500 transform translate-y-[1px] opacity-75" />
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Card with CSS transition */}
        <div 
          className={`w-full max-w-[calc(100%-18px)] mt-1 transition-all duration-500 origin-top ${
            feedbackOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 absolute pointer-events-none'
          }`}
          ref={feedbackRef}
          style={{ 
            transformOrigin: 'top center',
            maxHeight: feedbackOpen ? '1000px' : '0px',
            marginTop: feedbackOpen ? '4px' : '0px'
          }}
        >
          <div className="relative">
            <Card className="shadow-md dark:shadow-slate-900/30 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="py-2 px-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-medium text-gray-600 dark:text-gray-300 text-sm text-center">
                  CA KPIs <span className="text-gray-400 dark:text-gray-500">Mai 2023</span>
                </h3>
              </div>
              
              <CardContent className="p-4">
                <ScrollArea className="h-[280px] pr-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed space-y-4">
                    <p>{getFeedbackText(selectedHistoryEntry || 0)}</p>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Schließen button peeking from behind the card */}
            <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-[1.65rem] z-0 flex justify-center w-full">
              <div 
                className="bg-white dark:bg-gray-900 shadow-sm rounded-b-xl px-8 py-1 border border-gray-100 dark:border-gray-800 cursor-pointer w-52 text-center filter drop-shadow-md"
                onClick={toggleFeedback}
              >
                <button className="flex items-center justify-center w-full">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent text-xs font-medium opacity-75">schließen</span>
                  <ChevronUp className="h-3.5 w-3.5 ml-1 text-pink-500 transform translate-y-[1px] opacity-75" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Feedback Notification Card */}
      {showNewFeedback && (
        <div className="w-full max-w-md mx-auto mb-6">
          <div className="relative">
            {/* Outer glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-lg blur-sm opacity-75 animate-pulse"></div>
            
            {/* Main card */}
            <Card className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 border-0 shadow-xl overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-red-500/20 animate-pulse"></div>
              
              {/* Header with icon */}
              {!feedbackRead && (
                <div className="relative py-4 px-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 animate-bounce">
                      <BarChart2 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-lg drop-shadow-lg">
                    Neues Feedback verfügbar!
                  </h3>
                  <p className="text-white/90 text-sm mt-1 drop-shadow">
                    Du hast ein neues CA KPI Feedback erhalten
                  </p>
                </div>
              )}
              
              {/* Content */}
              <CardContent className="relative p-6 pt-2">
                <div className="text-center">
                  {!feedbackRead ? (
                    <>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/20">
                        <div className="text-white text-xs leading-relaxed text-left whitespace-pre-line">
{`Liebe Ulrike,

ich darf dir heute deine Mai KPIs zukommen lassen.

Trotz der stabilen Marktlage machst du das Beste draus und dafür ein großes Dankeschön unsererseits. 😊

Hier ein Rückblick auf deine Mai-Zahlen:

MC/ET: 7.3 (Platz 1)
TMA Anteil: 94%
VL Share: 23% (Platz 2)

Du hast im Mai mit deinem MC/ET den ersten Platz erreicht – eine wirklich beeindruckende Leistung! Deine hohe Verkaufszahl spiegelt dein Engagement wider und zeigt, dass du genau weißt, wie man Kunden begeistert. Auch dein VL Share ist mit Platz 2 bemerkenswert und zeigt, dass du einen hervorragenden Job machst. Beim TMA-Anteil gehörst du zu den Besten, was zeigt, wie effektiv du die Kundenbindung vor Ort gestaltest.

Mach weiter so, deine Arbeit ist inspirierend!

Liebe Grüße, dein Nespresso Team`}
                        </div>
                      </div>
                      
                      {/* Read button - more distinct but smaller */}
                      <button 
                        onClick={handleFeedbackRead}
                        className="bg-white text-orange-600 font-medium py-2.5 px-5 rounded-lg shadow-md hover:bg-gray-50 hover:shadow-lg transform hover:scale-105 transition-all duration-200 border border-white/50"
                      >
                        ✓ Gelesen
                      </button>
                    </>
                  ) : (
                    /* Confirmation message when feedback is read */
                    <div className="py-4">
                      <div className="flex items-center justify-center mb-2">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-white font-medium text-sm drop-shadow">
                        Feedback wurde dem Verlauf hinzugefügt
                      </p>
                      <p className="text-white/80 text-xs mt-1">
                        Du kannst es jederzeit in deinem Verlauf einsehen
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* History Section */}
      <div className="w-full max-w-md mx-auto mb-8">
        <Card className="w-full border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Blue gradient header with rounded corners */}
          <div className="py-3 px-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
            <h3 className="text-center font-medium text-white flex items-center justify-center">
              <History className="h-4 w-4 mr-2" />
              Verlauf ({historyData.length})
            </h3>
          </div>
          
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {currentPageData.map((entry, index) => (
                <div 
                  key={index} 
                  className={`flex items-center p-3 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${
                    !historyExpanded && index > 4 ? 
                      (index === 4 ? 'opacity-50' : 'hidden') : ''
                  }`}
                  onClick={() => setSelectedHistoryEntry(historyPage * entriesPerPage + index)}
                >
                  <div className="flex-shrink-0 w-24">
                    <div className="flex items-center">
                      <span className="text-gray-500 dark:text-gray-400">
                        {entry.date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex justify-between ml-4">
                    <div 
                      className={`text-sm font-medium ${getColorForMcEt(entry.mcet) !== "custom-orange" ? getColorForMcEt(entry.mcet) : ""}`}
                      style={getStyleForColor(getColorForMcEt(entry.mcet))}
                    >
                      MC/ET: {entry.mcet}
                    </div>
                    
                    <div 
                      className={`text-sm font-medium ${getColorForTma(entry.tma) !== "custom-orange" ? getColorForTma(entry.tma) : ""}`}
                      style={getStyleForColor(getColorForTma(entry.tma))}
                    >
                      TMA: {entry.tma}%
                    </div>
                    
                    <div 
                      className={`text-sm font-medium ${getColorForVlShare(entry.vl) !== "custom-orange" ? getColorForVlShare(entry.vl) : ""}`}
                      style={getStyleForColor(getColorForVlShare(entry.vl))}
                    >
                      VL: {entry.vl}%
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Blurred overlay for collapsed state */}
              {!historyExpanded && currentPageData.length > 5 && (
                <div className="relative">
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none"></div>
                </div>
              )}
            </div>
            
            {/* Footer with Show more/less button and navigation */}
            <div className="p-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                {/* Left navigation arrow - only show if not on first page */}
                <div className="w-20">
                  {historyPage > 0 && (
                    <button 
                      onClick={() => navigateHistoryPrev()}
                      className="flex items-center text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1 text-blue-500" />
                      <span>Neuer</span>
                    </button>
                  )}
                </div>
                
                {/* Show more/less button */}
                <button 
                  onClick={() => setHistoryExpanded(!historyExpanded)}
                  className="flex items-center justify-center text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                >
                  {historyExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1 text-blue-500" />
                      Schließen
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1 text-blue-500" />
                      Show More
                    </>
                  )}
                </button>
                
                {/* Right navigation arrow - only show if not on last page */}
                <div className="w-20 text-right">
                  {historyPage < totalPages - 1 && (
                    <button 
                      onClick={() => navigateHistoryNext()}
                      className="flex items-center justify-end text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                    >
                      <span>Älter</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1 text-blue-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Feedback Popup */}
      {selectedHistoryEntry !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedHistoryEntry(null)}>
          <div className="w-full max-w-md">
            <Card className="shadow-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="py-2 px-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-medium text-gray-600 dark:text-gray-300 text-sm">
                  CA KPIs <span className="text-gray-400 dark:text-gray-500">
                    {historyData[selectedHistoryEntry]?.date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                  </span>
                </h3>
                <button 
                  onClick={() => setSelectedHistoryEntry(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              <CardContent className="p-4">
                <ScrollArea className="h-[280px] pr-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                    {getFeedbackText(selectedHistoryEntry)}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Additional stats components will be added here later */}
    </>
  )
} 