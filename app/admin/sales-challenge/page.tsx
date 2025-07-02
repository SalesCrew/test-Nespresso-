"use client";

import { useState } from "react";
import AdminNavigation from "../../../components/AdminNavigation";
import AdminEddieAssistant from "../../../components/AdminEddieAssistant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Trophy, Users, Target, Gift, X, CheckSquare } from "lucide-react";

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
    rewards: { position: string; prize: string }[];
    rules: string;
  }>({
    name: "",
    endDate: "",
    metric: "",
    participants: [],
    rewards: [
      { position: "1st", prize: "" },
      { position: "2nd", prize: "" },
      { position: "3rd", prize: "" }
    ],
    rules: ""
  });

  // Promotor selection modal state
  const [showPromotorSelection, setShowPromotorSelection] = useState(false);
  const [promotorSelectionSearch, setPromotorSelectionSearch] = useState("");
  const [activeRegionFilter, setActiveRegionFilter] = useState("all");

  const totalSteps = 5;
  
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
                      <div className="space-y-2">
                        {challengeData.rewards.map((reward, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-semibold text-xs">
                              {index + 1}
                            </div>
                            <Input
                              placeholder={`${reward.position} Platz`}
                              value={reward.prize}
                              onChange={(e) => {
                                const newRewards = [...challengeData.rewards];
                                newRewards[index].prize = e.target.value;
                                setChallengeData(prev => ({ ...prev, rewards: newRewards }));
                              }}
                              className="border-gray-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-xs"
                            />
                          </div>
                        ))}
                      </div>
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
                          className="border-gray-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-xs min-h-20"
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

      {/* Eddie KI Assistant */}
      <AdminEddieAssistant />
    </div>
  );
} 