"use client";

import { useState, useEffect } from "react";
import AdminNavigation from "../../../components/AdminNavigation";
import AdminEddieAssistant from "../../../components/AdminEddieAssistant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Trophy, Users, Target, Gift, X, CheckSquare, Plus, Edit3, Clock } from "lucide-react";

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

export default function SalesChallengePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Challenge creation form state
  const [currentStep, setCurrentStep] = useState(1);
  const [challengeData, setChallengeData] = useState<{
    name: string;
    endDate: string;
    metric: string;
    participants: string[];
    rewards: { position: string; prize: string; rank: number }[];
    rules: string;
  }>({
    name: "",
    endDate: "",
    metric: "",
    participants: [],
    rewards: [
      { position: "1st", prize: "", rank: 1 },
      { position: "2nd", prize: "", rank: 2 },
      { position: "3rd", prize: "", rank: 3 }
    ],
    rules: ""
  });

  // Promotor selection modal state
  const [showPromotorSelection, setShowPromotorSelection] = useState(false);
  const [promotorSelectionSearch, setPromotorSelectionSearch] = useState("");
  const [activeRegionFilter, setActiveRegionFilter] = useState("all");

  // Created challenges state
  const [createdChallenges, setCreatedChallenges] = useState<Array<{
    id: string;
    name: string;
    endDate: string;
    metric: string;
    participants: Array<{ 
      name: string; 
      score: number;
      history?: Array<{ week: number; score: number; position: number; change: number }>;
    }>;
    rewards: { position: string; prize: string; rank: number }[];
    rules: string;
    finishedAt?: string; // Add timestamp for when challenge was finished
    weekCounter?: number; // Track which week we're on
  }>>([]);

  // Number input modal state
  const [showNumberInput, setShowNumberInput] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [numberInputs, setNumberInputs] = useState<Record<string, string>>({});

  // Tooltip state
  const [hoveredParticipant, setHoveredParticipant] = useState<{ challengeId: string; participantName: string } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Countdown state
  const [currentTime, setCurrentTime] = useState(new Date());

  const totalSteps = 4;

  // Update current time every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Update finishedAt timestamp for newly finished challenges
      setCreatedChallenges(prev => prev.map(challenge => {
        const endDate = new Date(challenge.endDate);
        const now = new Date();
        const isFinishedNow = endDate.getTime() <= now.getTime();
        if (isFinishedNow && !challenge.finishedAt) {
          return { ...challenge, finishedAt: new Date().toISOString() };
        }
        return challenge;
      }));
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);
  
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

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
    const filtered = allPromotors.filter(p => 
      (activeRegionFilter === "all" || p.region === activeRegionFilter) &&
      p.name.toLowerCase().includes(promotorSelectionSearch.toLowerCase())
    ).map(p => p.name);

    const currentlySelected = new Set(challengeData.participants);
    const allFilteredSelected = filtered.every(name => currentlySelected.has(name));

    if (allFilteredSelected) {
      // Deselect all filtered
      setChallengeData(prev => ({
        ...prev,
        participants: prev.participants.filter(name => !filtered.includes(name))
      }));
    } else {
      // Select all filtered
      const newSelection = [...new Set([...challengeData.participants, ...filtered])];
      setChallengeData(prev => ({ ...prev, participants: newSelection }));
    }
  };

  const addMoreReward = () => {
    const nextRank = challengeData.rewards.length + 1;
    const newReward = { 
      position: `${nextRank}${nextRank === 4 ? 'th' : nextRank === 5 ? 'th' : nextRank === 6 ? 'th' : nextRank === 7 ? 'th' : nextRank === 8 ? 'th' : nextRank === 9 ? 'th' : nextRank === 10 ? 'th' : 'th'}`, 
      prize: "", 
      rank: nextRank 
    };
    setChallengeData(prev => ({
      ...prev,
      rewards: [...prev.rewards, newReward]
    }));
  };



  const getRankIconStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { background: 'linear-gradient(135deg, #EEB34B 0%, #FFED99 25%, #FCD33D 50%, #FAF995 75%, #EFC253 100%)' };
      case 2:
        return { background: 'linear-gradient(135deg, #DEDFE1 0%, #BCBDC1 25%, #ECEEED 75%, #B6BCBC 100%)' };
      case 3:
        return { background: 'linear-gradient(135deg, #BD965D 0%, #99774A 25%, #DEBF93 75%, #AC9071 100%)' };
      default:
        return { background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' };
    }
  };

  const getRankInputStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'border-yellow-200/50 bg-gradient-to-r from-yellow-50/20 to-amber-50/20 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:from-yellow-50/40 hover:to-amber-50/40';
      case 2:
        return 'border-gray-200/50 bg-gradient-to-r from-gray-50/20 to-slate-50/20 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:from-gray-50/40 hover:to-slate-50/40';
      case 3:
        return 'border-amber-200/50 bg-gradient-to-r from-amber-50/20 to-orange-50/20 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:from-amber-50/40 hover:to-orange-50/40';
      default:
        return 'border-blue-200/50 bg-gradient-to-r from-blue-50/20 to-indigo-50/20 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:from-blue-50/40 hover:to-indigo-50/40';
    }
  };

  const getLeaderboardRowStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'border-yellow-200/50 bg-gradient-to-r from-yellow-50/20 to-amber-50/20 hover:from-yellow-50/40 hover:to-amber-50/40';
      case 2:
        return 'border-gray-200/50 bg-gradient-to-r from-gray-50/20 to-slate-50/20 hover:from-gray-50/40 hover:to-slate-50/40';
      case 3:
        return 'border-amber-200/50 bg-gradient-to-r from-amber-50/20 to-orange-50/20 hover:from-amber-50/40 hover:to-orange-50/40';
      default:
        return 'border-blue-200/50 bg-gradient-to-r from-blue-50/20 to-indigo-50/20 hover:from-blue-50/40 hover:to-indigo-50/40';
    }
  };

  const getRewardText = (challenge: any, rank: number) => {
    const reward = challenge.rewards.find((r: any) => r.rank === rank);
    return reward?.prize || "";
  };

  const getRewardColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-[#E0AA3E] via-[#F0D96A] to-[#E0AA3E] bg-clip-text text-transparent';
      case 2:
        return 'text-[#BCBDC1]';
      case 3:
        return 'text-[#BD965D]';
      default:
        return 'text-blue-600';
    }
  };

  const getCountdown = (endDate: string) => {
    const end = new Date(endDate);
    const now = currentTime;
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return "Beendet";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}T ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Function to get the appropriate drop shadow for a challenge card
  const getChallengeCardShadow = (challenge: any) => {
    const isFinished = getCountdown(challenge.endDate) === "Beendet";
    
    if (!isFinished) {
      // Active challenge - green gradient drop shadow (softer)
      return "shadow-lg shadow-green-500/15 hover:shadow-xl hover:shadow-green-500/20";
    } else {
      // Challenge is finished - check how long ago
      const finishedAt = challenge.finishedAt ? new Date(challenge.finishedAt) : new Date(challenge.endDate);
      const now = currentTime;
      const daysSinceFinished = Math.floor((now.getTime() - finishedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceFinished <= 7) {
        // First week after completion - gold gradient drop shadow (softer)
        return "shadow-lg shadow-yellow-500/15 hover:shadow-xl hover:shadow-yellow-500/20";
      } else {
        // More than a week after completion - normal drop shadow
        return "shadow-md hover:shadow-lg";
      }
    }
  };

  const handleCreateChallenge = () => {
    if (!challengeData.name || !challengeData.endDate || challengeData.participants.length === 0) return;
    
    const newChallenge = {
      id: Date.now().toString(),
      ...challengeData,
      participants: challengeData.participants.map(name => ({ 
        name, 
        score: 0,
        history: []
      })),
      weekCounter: 0
    };
    
    setCreatedChallenges(prev => [newChallenge, ...prev]);
    
    // Reset form
    setChallengeData({
      name: "",
      endDate: "",
      metric: "",
      participants: [],
      rewards: [
        { position: "1st", prize: "", rank: 1 },
        { position: "2nd", prize: "", rank: 2 },
        { position: "3rd", prize: "", rank: 3 }
      ],
      rules: ""
    });
    setCurrentStep(1);
  };

  const handleNumberInputOpen = (challengeId: string) => {
    const challenge = createdChallenges.find(c => c.id === challengeId);
    if (challenge) {
      setSelectedChallengeId(challengeId);
      const inputs: Record<string, string> = {};
      challenge.participants.forEach(p => {
        inputs[p.name] = p.score.toString();
      });
      setNumberInputs(inputs);
      setShowNumberInput(true);
    }
  };

  const handleSubmitNumbers = () => {
    if (!selectedChallengeId) return;
    
    setCreatedChallenges(prev => prev.map(challenge => {
      if (challenge.id === selectedChallengeId) {
        const currentWeek = (challenge.weekCounter || 0) + 1;
        
        // Get previous positions for comparison
        const previousParticipants = [...challenge.participants].sort((a, b) => b.score - a.score);
        const previousPositions = new Map(previousParticipants.map((p, index) => [p.name, index + 1]));
        
        // Update participants with new scores
        const updatedParticipants = challenge.participants.map(p => {
          const newScore = parseInt(numberInputs[p.name] || "0");
          const newHistory = [...(p.history || [])];
          
          return {
          ...p,
            score: newScore,
            history: newHistory
          };
        }).sort((a, b) => b.score - a.score); // Sort by highest score first
        
        // Calculate position changes and update history
        const finalParticipants = updatedParticipants.map((p, index) => {
          const newPosition = index + 1;
          const previousPosition = previousPositions.get(p.name) || newPosition;
          const positionChange = previousPosition - newPosition; // Positive = moved up, Negative = moved down
          
          const updatedHistory = [...(p.history || []), {
            week: currentWeek,
            score: p.score,
            position: newPosition,
            change: positionChange
          }];
          
          return {
            ...p,
            history: updatedHistory
          };
        });
        
        return { 
          ...challenge, 
          participants: finalParticipants,
          weekCounter: currentWeek
        };
      }
      return challenge;
    }));
    
    setShowNumberInput(false);
    setSelectedChallengeId(null);
    setNumberInputs({});
  };

  const handleParticipantMouseEnter = (e: React.MouseEvent, challengeId: string, participantName: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const tooltipWidth = 264; // w-64 = 16rem = 256px + padding
    
    // Check if there's enough space on the right
    const spaceOnRight = viewportWidth - rect.right;
    const shouldPositionLeft = spaceOnRight < tooltipWidth + 20; // 20px buffer
    
    setTooltipPosition({
      x: shouldPositionLeft ? rect.left - tooltipWidth - 10 : rect.right + 10,
      y: rect.top
    });
    setHoveredParticipant({ challengeId, participantName });
  };

  const handleParticipantMouseLeave = () => {
    setHoveredParticipant(null);
  };

  const getParticipantTooltipData = (challengeId: string, participantName: string) => {
    const challenge = createdChallenges.find(c => c.id === challengeId);
    if (!challenge) return null;
    
    const participant = challenge.participants.find(p => p.name === participantName);
    if (!participant || !participant.history) return null;
    
    return participant.history;
  };

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
              <h1 className="text-2xl font-semibold text-gray-900">Sales Challenge</h1>
              <p className="text-gray-500 text-sm">Verkaufs-Herausforderungen und Wettbewerbe</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create Challenge Card */}
            <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm relative">
              <CardContent className="relative p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)', opacity: 0.85}}>
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-base truncate">Challenge erstellen</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Schritt {currentStep} von {totalSteps}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div 
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(currentStep / totalSteps) * 100}%`,
                      background: 'linear-gradient(135deg, #22C55E, #105F2D)'
                    }}
                  ></div>
                </div>

                {/* Step Content */}
                <div className="space-y-4 min-h-[200px]">
                  {/* Step 1: Basic Info */}
                  {currentStep === 1 && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-3 w-3 text-green-600" />
                        <h4 className="text-xs font-medium text-gray-900">Challenge Details</h4>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="challengeName" className="text-xs font-medium text-gray-700">
                          Challenge Name
                        </Label>
                        <Input
                          id="challengeName"
                          placeholder="Q1 Verkaufs-Sprint"
                          value={challengeData.name}
                          onChange={(e) => setChallengeData(prev => ({ ...prev, name: e.target.value }))}
                          className="border-gray-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate" className="text-xs font-medium text-gray-700">
                          Ende der Challenge
                        </Label>
                        <DatePicker
                          value={challengeData.endDate}
                          onChange={(value) => setChallengeData(prev => ({ ...prev, endDate: value }))}
                          className="w-full text-sm [&_*]:focus-visible:ring-0 [&_*]:focus-visible:ring-offset-0"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Metric & Participants */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      {/* Metric */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="h-3 w-3 text-green-600" />
                          <h4 className="text-xs font-medium text-gray-900">Wettbewerbs-Metrik</h4>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="metric" className="text-xs font-medium text-gray-700">
                            Was wird gemessen?
                          </Label>
                          <Input
                            id="metric"
                            placeholder="Verkaufte Einheiten, Umsatz, Kundenkontakte..."
                            value={challengeData.metric}
                            onChange={(e) => setChallengeData(prev => ({ ...prev, metric: e.target.value }))}
                            className="border-gray-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                          />
                          <p className="text-xs text-gray-500">
                            Definiere die Kennzahl für den Wettbewerb
                          </p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-b border-gray-100"></div>

                      {/* Participants */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="h-3 w-3 text-green-600" />
                          <h4 className="text-xs font-medium text-gray-900">Teilnehmer</h4>
                        </div>
                        <div 
                          className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => setShowPromotorSelection(true)}
                        >
                          {challengeData.participants.length > 0 ? (
                            <div className="text-center">
                              <p className="text-sm font-medium text-green-600">
                                {challengeData.participants.length} Teilnehmer ausgewählt
                              </p>
                              <p className="text-xs text-gray-500">
                                Klicke zum Bearbeiten
                              </p>
                            </div>
                          ) : (
                            <div className="text-center text-gray-500">
                              <Users className="h-4 w-4 mx-auto mb-1" />
                              <p className="text-xs">Promotoren auswählen</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Rewards */}
                  {currentStep === 3 && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Gift className="h-3 w-3 text-green-600" />
                        <h4 className="text-xs font-medium text-gray-900">Belohnungen</h4>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {challengeData.rewards.map((reward, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div 
                              className="flex items-center justify-center w-6 h-6 rounded-full text-white font-semibold text-xs flex-shrink-0"
                              style={getRankIconStyle(reward.rank)}
                            >
                              {reward.rank}
                            </div>
                            <Input
                              placeholder={`${reward.position} Platz Belohnung`}
                              value={reward.prize}
                              onChange={(e) => {
                                const newRewards = [...challengeData.rewards];
                                newRewards[index].prize = e.target.value;
                                setChallengeData(prev => ({ ...prev, rewards: newRewards }));
                              }}
                              className={`text-xs transition-all duration-200 ${getRankInputStyle(reward.rank)}`}
                            />
                          </div>
                        ))}
                      </div>
                      {challengeData.rewards.length < 10 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={addMoreReward}
                          className="w-full text-xs h-7 text-gray-500 hover:text-gray-700 focus-visible:ring-0"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Weitere Belohnung hinzufügen
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Step 4: Rules */}
                  {currentStep === 4 && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Trophy className="h-3 w-3 text-green-600" />
                        <h4 className="text-xs font-medium text-gray-900">Regeln & Bedingungen</h4>
                      </div>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Regeln, Bewertungskriterien und Bedingungen..."
                          value={challengeData.rules}
                          onChange={(e) => setChallengeData(prev => ({ ...prev, rules: e.target.value }))}
                          className="border-gray-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-xs min-h-36 [&::-webkit-scrollbar]:hidden"
                          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                                {/* Navigation Buttons */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex justify-between space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className="flex-1 text-xs h-8 focus-visible:ring-0"
                    >
                      Zurück
                    </Button>
                    {currentStep < totalSteps ? (
                      <Button 
                        onClick={nextStep}
                        className="flex-1 text-xs h-8 text-white focus-visible:ring-0"
                        style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)', opacity: 0.85}}
                      >
                        Weiter
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleCreateChallenge}
                        className="flex-1 text-xs h-8 text-white focus-visible:ring-0"
                        style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)', opacity: 0.85}}
                      >
                        Erstellen
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Created Challenge Cards */}
            {createdChallenges.map((challenge) => (
              <Card key={challenge.id} className={`transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm relative ${getChallengeCardShadow(challenge)}`}>
                <CardContent className="relative p-6 space-y-5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)', opacity: 0.85}}>
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-base truncate">{challenge.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {challenge.participants.length} Teilnehmer • {challenge.metric}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleNumberInputOpen(challenge.id)}
                        className="h-7 w-7 text-gray-600 hover:text-gray-900 opacity-50 -ml-2.5"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <div className="w-px h-4 bg-gray-300 mx-2"></div>
                      <div className="flex items-center space-x-1 text-xs text-gray-600 opacity-50">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">{getCountdown(challenge.endDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Leaderboard */}
                  <div className="relative">
                    {getCountdown(challenge.endDate) === "Beendet" ? (
                      /* Finished Challenge - Winner Display */
                      <div className="max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden space-y-4 pt-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {/* Top 3 Podium */}
                        <div className="mb-4">
                          <div className="flex items-end justify-center space-x-2 mb-3">
                            {/* 2nd Place */}
                            {challenge.participants[1] && (
                              <div 
                                className="text-center flex-1 max-w-20 cursor-pointer"
                                onMouseEnter={(e) => handleParticipantMouseEnter(e, challenge.id, challenge.participants[1].name)}
                                onMouseLeave={handleParticipantMouseLeave}
                              >
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-1 shadow-md mx-auto" style={{background: 'linear-gradient(135deg, #DEDFE1 0%, #BCBDC1 25%, #ECEEED 75%, #B6BCBC 100%)'}}>
                                  <span className="text-white font-bold text-sm">2</span>
                                </div>
                                <div className="w-12 h-8 rounded-t-md flex items-center justify-center mx-auto" style={{background: 'linear-gradient(to top, #BCBDC1, #ECEEED)'}}>
                                  <span className="text-xs font-bold text-gray-600">{challenge.participants[1].score}</span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1 font-medium truncate px-1" title={challenge.participants[1].name}>{challenge.participants[1].name}</div>
                              </div>
                            )}
                            
                            {/* 1st Place */}
                            {challenge.participants[0] && (
                              <div 
                                className="text-center flex-1 max-w-24 cursor-pointer"
                                onMouseEnter={(e) => handleParticipantMouseEnter(e, challenge.id, challenge.participants[0].name)}
                                onMouseLeave={handleParticipantMouseLeave}
                              >
                                <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-1 shadow-lg transform scale-110 -translate-y-1 mx-auto" style={{background: 'linear-gradient(135deg, #EEB34B 0%, #FFED99 25%, #FCD33D 50%, #FAF995 75%, #EFC253 100%)'}}>
                                  <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M5 16L3 12L5.5 10L8 12L10 8L12 12L14 8L16 12L18.5 10L21 12L19 16H5ZM7 18H17C17.55 18 18 18.45 18 19C18 19.55 17.55 20 17 20H7C6.45 20 6 19.55 6 19C6 18.45 6.45 18 7 18Z"/>
                                  </svg>
                                </div>
                                <div className="w-14 h-12 rounded-t-md flex items-center justify-center mx-auto" style={{background: 'linear-gradient(to top, #FCD33D, #FFED99)'}}>
                                  <span className="text-sm font-bold" style={{color: '#8B6914'}}>{challenge.participants[0].score}</span>
                                </div>
                                <div className="text-xs text-gray-800 mt-1 font-bold truncate px-1" title={challenge.participants[0].name}>{challenge.participants[0].name}</div>
                              </div>
                            )}
                            
                            {/* 3rd Place */}
                            {challenge.participants[2] && (
                              <div 
                                className="text-center flex-1 max-w-20 cursor-pointer"
                                onMouseEnter={(e) => handleParticipantMouseEnter(e, challenge.id, challenge.participants[2].name)}
                                onMouseLeave={handleParticipantMouseLeave}
                              >
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-1 shadow-md mx-auto" style={{background: 'linear-gradient(135deg, #BD965D 0%, #99774A 25%, #DEBF93 75%, #AC9071 100%)'}}>
                                  <span className="text-white font-bold text-sm">3</span>
                                </div>
                                <div className="w-12 h-6 rounded-t-md flex items-center justify-center mx-auto" style={{background: 'linear-gradient(to top, #99774A, #DEBF93)'}}>
                                  <span className="text-xs font-bold text-amber-100">{challenge.participants[2].score}</span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1 font-medium truncate px-1" title={challenge.participants[2].name}>{challenge.participants[2].name}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Horizontal Divider */}
                        <div className="w-full h-px bg-gray-300 opacity-20"></div>

                        {/* All Other Places (4th+) */}
                        {challenge.participants.length > 3 && (
                          <div className="space-y-1">
                            {challenge.participants.slice(3).map((participant, index) => {
                              const rank = index + 4;
                              return (
                                <div 
                                  key={participant.name} 
                                  className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer ${getLeaderboardRowStyle(rank)}`}
                                  onMouseEnter={(e) => handleParticipantMouseEnter(e, challenge.id, participant.name)}
                                  onMouseLeave={handleParticipantMouseLeave}
                                >
                                  <div className="flex items-center space-x-3">
                                    {/* Rank Icon */}
                                    <div 
                                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
                                      style={getRankIconStyle(rank)}
                                    >
                                      {rank}
                                    </div>
                                    
                                    {/* Participant Info */}
                                    <div>
                                      <h4 className="text-sm font-medium text-gray-900">{participant.name}</h4>
                                      <p className="text-xs text-gray-500">{participant.score} {challenge.metric}</p>
                                    </div>
                                  </div>
                                  
                                  {/* Reward */}
                                  <div className="text-right">
                                    <div className={`text-sm font-bold ${getRewardColor(rank)}`}>
                                      {getRewardText(challenge, rank)}
                                    </div>
                                    {getRewardText(challenge, rank) && (
                                      <p className="text-xs text-gray-400">Belohnung</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {/* Bottom blur gradient */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/80 to-transparent pointer-events-none"></div>
                      </div>
                    ) : (
                      /* Active Challenge - Regular Leaderboard */
                      <div>
                        <div className="space-y-1 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          {challenge.participants.map((participant, index) => {
                            const rank = index + 1;
                            return (
                              <div 
                                key={participant.name} 
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer ${getLeaderboardRowStyle(rank)}`}
                                onMouseEnter={(e) => handleParticipantMouseEnter(e, challenge.id, participant.name)}
                                onMouseLeave={handleParticipantMouseLeave}
                              >
                                <div className="flex items-center space-x-3">
                                  {/* Rank Icon */}
                                  <div 
                                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
                                    style={getRankIconStyle(rank)}
                                  >
                                    {rank}
                                  </div>
                                  
                                  {/* Participant Info */}
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900">{participant.name}</h4>
                                    <p className="text-xs text-gray-500">{participant.score} {challenge.metric}</p>
                                  </div>
                                </div>
                                
                                {/* Reward */}
                                <div className="text-right">
                                  <div className={`text-sm font-bold ${getRewardColor(rank)}`}>
                                    {getRewardText(challenge, rank)}
                                  </div>
                                  {getRewardText(challenge, rank) && (
                                    <p className="text-xs text-gray-400">Belohnung</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Bottom blur gradient */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/80 to-transparent pointer-events-none"></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>

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
                {allPromotors
                .filter(promotor => 
                  (activeRegionFilter === "all" || promotor.region === activeRegionFilter) &&
                  promotor.name.toLowerCase().includes(promotorSelectionSearch.toLowerCase())
                )
                .map((promotor) => {
                  const isSelected = challengeData.participants.includes(promotor.name);
                  return (
                    <button
                      key={promotor.name}
                      onClick={() => {
                        setChallengeData(prev => {
                          const newParticipants = isSelected 
                            ? prev.participants.filter(name => name !== promotor.name)
                            : [...prev.participants, promotor.name];
                          return { ...prev, participants: newParticipants };
                        });
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
              {challengeData.participants.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {challengeData.participants.length} Promotor{challengeData.participants.length !== 1 ? 'en' : ''} ausgewählt
                    </span>
                    <Button
                      onClick={() => setShowPromotorSelection(false)}
                      className="text-white hover:opacity-90 transition-opacity"
                      style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)', opacity: 0.85}}
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

      {/* Number Input Modal */}
      {showNumberInput && selectedChallengeId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Zahlen eingeben</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNumberInput(false)}
                  className="h-8 w-8 text-gray-900 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {Object.keys(numberInputs).map((participantName) => (
                  <div key={participantName} className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">
                      {participantName}
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={numberInputs[participantName]}
                      onChange={(e) => setNumberInputs(prev => ({ ...prev, [participantName]: e.target.value }))}
                      className="border-gray-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => setShowNumberInput(false)}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSubmitNumbers}
                  className="flex-1 text-white"
                  style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)', opacity: 0.85}}
                >
                  Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Eddie KI Assistant */}
      <AdminEddieAssistant />

      {/* Participant Progress Tooltip */}
      {hoveredParticipant && (
        <div 
          className="fixed z-[60] pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-64">
            <div className="space-y-3">
              {/* Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {hoveredParticipant.participantName}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Fortschritt & Positionen</p>
              </div>

              {/* Weekly Progress */}
              <div className="space-y-2">
                {(() => {
                  const tooltipData = getParticipantTooltipData(hoveredParticipant.challengeId, hoveredParticipant.participantName);
                  
                  if (!tooltipData || tooltipData.length === 0) {
                    return (
                      <div className="text-xs text-gray-500 text-center py-2">
                        Noch keine Daten verfügbar
                      </div>
                    );
                  }

                  const totalScore = tooltipData[tooltipData.length - 1]?.score || 0;
                  
                  return (
                    <>
                      {/* Weekly breakdown */}
                      <div className="space-y-1">
                        {tooltipData.map((entry, index) => (
                          <div key={entry.week} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">
                              Woche {entry.week}:
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {entry.score}
                              </span>
                              {/* Position indicator */}
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-500 text-xs">#{entry.position}</span>
                                {entry.change !== 0 && (
                                  <span className={`text-xs font-medium ${
                                    entry.change > 0 
                                      ? 'text-green-600 dark:text-green-400' 
                                      : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {entry.change > 0 ? `↑${entry.change}` : `↓${Math.abs(entry.change)}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Gesamt:
                          </span>
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            {totalScore}
                          </span>
                        </div>
                      </div>

                      {/* Current position */}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Aktuelle Position:
                          </span>
                          <div className="flex items-center space-x-1">
                            <div 
                              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={getRankIconStyle(tooltipData[tooltipData.length - 1]?.position || 1)}
                            >
                              {tooltipData[tooltipData.length - 1]?.position || 1}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 