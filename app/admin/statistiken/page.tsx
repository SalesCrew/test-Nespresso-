"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Settings, Send, FileText, Download, Phone, Crown, Check, Zap, Mail, ChevronDown, Copy, Edit } from "lucide-react";
import { IoColorWandOutline } from "react-icons/io5";
import { FiSliders, FiSmile, FiThumbsUp, FiTrendingUp, FiMessageSquare, FiTrendingDown } from 'react-icons/fi';
import { CgSpinner } from 'react-icons/cg';
import AdminNavigation from "@/components/AdminNavigation";
import AdminEddieAssistant from "@/components/AdminEddieAssistant";

export default function StatistikenPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<'outreach' | 'history'>('outreach');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [magicTouchCategories, setMagicTouchCategories] = useState<Record<string, string>>({});
  const [generatingStates, setGeneratingStates] = useState<Record<string, boolean>>({});
  const [generatedStates, setGeneratedStates] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<Record<string, boolean>>({});
  const [editingStates, setEditingStates] = useState<Record<string, boolean>>({});
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});

  const handleEmailCopy = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => {
        setCopiedEmail(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  const handleGenerateEmail = (cardId: string) => {
    setGeneratingStates(prev => ({ ...prev, [cardId]: true }));
    
    setTimeout(() => {
      setGeneratingStates(prev => ({ ...prev, [cardId]: false }));
      setGeneratedStates(prev => ({ ...prev, [cardId]: true }));
    }, 3000);
  };

  const handleCopyGeneratedText = async (cardId: string) => {
    try {
      const textToCopy = editedTexts[cardId] || getGeneratedEmailText();
      await navigator.clipboard.writeText(textToCopy);
      setCopiedText(prev => ({ ...prev, [cardId]: true }));
      setTimeout(() => {
        setCopiedText(prev => ({ ...prev, [cardId]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy generated text:', err);
    }
  };

  const handleEditText = (cardId: string) => {
    if (editingStates[cardId]) {
      // Save changes
      setEditingStates(prev => ({ ...prev, [cardId]: false }));
    } else {
      // Start editing
      if (!editedTexts[cardId]) {
        setEditedTexts(prev => ({ ...prev, [cardId]: getGeneratedEmailText() }));
      }
      setEditingStates(prev => ({ ...prev, [cardId]: true }));
    }
  };

  const handleTextChange = (cardId: string, newText: string) => {
    setEditedTexts(prev => ({ ...prev, [cardId]: newText }));
  };

  const getGeneratedEmailText = () => {
    return `Liebe Ulrike,

ich darf dir heute deine Mai KPIs zukommen lassen.

Trotz der stabilen Marktlage machst du das Beste draus und dafür ein großes Dankeschön unsererseits. 😊

Hier ein Rückblick auf deine Mai-Zahlen:

MC/ET: 7.3 (Platz 1)
TMA Anteil: 94%
VL Share: 23% (Platz 2)

Du hast im Mai mit deinem MC/ET den ersten Platz erreicht – eine wirklich beeindruckende Leistung! Deine hohe Verkaufszahl spiegelt dein Engagement wider und zeigt, dass du genau weißt, wie man Kunden begeistert. Auch dein VL Share ist mit Platz 2 bemerkenswert und zeigt, dass du einen hervorragenden Job machst. Beim TMA-Anteil gehörst du zu den Besten, was zeigt, wie effektiv du die Kundenbindung vor Ort gestaltest.

Mach weiter so, deine Arbeit ist inspirierend!

Liebe Grüße, dein Nespresso Team`;
  };

  const categories = [
    { name: 'Neutral', color: '#f8f9fa', bgColor: '#f8f9fa', borderColor: '#e9ecef', icon: <FiSliders className="h-3 w-3" /> },
    { name: 'Beeindruckt', color: '#d1f7eb', bgColor: '#d1f7eb', borderColor: '#a7f3d0', icon: <FiSmile className="h-3 w-3" /> },
    { name: 'Zufrieden', color: '#fff0c7', bgColor: '#fff0c7', borderColor: '#fde68a', icon: <FiThumbsUp className="h-3 w-3" /> },
    { name: 'Verbesserung', color: '#d7ecfb', bgColor: '#d7ecfb', borderColor: '#bfdbfe', icon: <FiTrendingUp className="h-3 w-3" /> },
    { name: 'Motivierend (unzufrieden)', color: '#eadaff', bgColor: '#eadaff', borderColor: '#ddd6fe', icon: <FiMessageSquare className="h-3 w-3" /> },
    { name: 'Verschlechterung', color: '#ffe3e3', bgColor: '#ffe3e3', borderColor: '#fecaca', icon: <FiTrendingDown className="h-3 w-3" /> }
  ];

  const handleMagicTouchClick = (cardId: string) => {
    setOpenDropdown(openDropdown === cardId ? null : cardId);
  };

  const handleCategorySelect = (cardId: string, category: string) => {
    setMagicTouchCategories(prev => ({ ...prev, [cardId]: category }));
    setOpenDropdown(null);
  };

  const getMagicTouchStyle = (cardId: string) => {
    const selectedCategory = magicTouchCategories[cardId];
    if (!selectedCategory) return {};
    
    // If Neutral is selected, return empty object to use default styling
    if (selectedCategory === 'Neutral') return {};
    
    const category = categories.find(c => c.name === selectedCategory);
    if (!category) return {};
    
    // Convert hex to rgba with 80% opacity for background
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    return { 
      backgroundColor: hexToRgba(category.bgColor, 0.8),
      borderColor: category.borderColor,
      boxShadow: `0 1px 3px 0 ${category.borderColor}40, 0 1px 2px 0 ${category.borderColor}60`
    };
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.magic-touch-dropdown')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdown]);

  return (
    <div className="min-h-screen bg-gray-50/30">
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        textarea.scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        textarea.scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* Admin Navigation */}
      <AdminNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-14'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Statistiken</h1>
                <p className="text-gray-500 text-sm">CA KPIs und Mystery Shops Verwaltung</p>
              </div>
              
              {/* Menu Buttons - Outreach and History */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setSelectedMenu('outreach')}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-lg transition-all duration-200 ${
                    selectedMenu === 'outreach' 
                      ? 'bg-gray-100 text-gray-900 border-gray-300 scale-[1.02] shadow-sm' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  <span>Outreach</span>
                </button>
                <button 
                  onClick={() => setSelectedMenu('history')}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-lg transition-all duration-200 ${
                    selectedMenu === 'history' 
                      ? 'bg-gray-100 text-gray-900 border-gray-300 scale-[1.02] shadow-sm' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>History (0)</span>
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 text-sm border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200">
                <Download className="h-4 w-4" />
                <span>Import</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 bg-purple-50 text-purple-600 text-sm border border-gray-200 rounded-lg hover:bg-purple-100 transition-all duration-200 opacity-80">
                <Phone className="h-4 w-4" />
                <span>Calls (0)</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 bg-amber-50 text-amber-600 text-sm border border-gray-200 rounded-lg hover:bg-amber-100 transition-all duration-200 opacity-80">
                <Crown className="h-4 w-4" />
                <span>Ranks</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-600 text-sm border border-gray-200 rounded-lg hover:bg-green-100 transition-all duration-200 opacity-80">
                <Zap className="h-4 w-4" />
                <span>Generate All Emails</span>
              </button>
              <button className="p-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {/* Promoter Cards Grid */}
          <div className="grid grid-cols-5 gap-4">
            {/* Card 1 - Max Mustermann */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Max Mustermann</h3>
                <button className="text-red-500 hover:text-red-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M5 6v14a2 2 0 002 2h10a2 2 0 002-2V6M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center space-x-2 mb-3 cursor-pointer" onClick={() => handleEmailCopy('max.mustermann@example.com')}>
                {copiedEmail === 'max.mustermann@example.com' ? (
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
                <p className="text-sm text-gray-600 truncate">max.mustermann@example.com</p>
              </div>
              
              {/* KPI Metrics */}
              <div className="bg-gray-100 border border-gray-200 rounded px-3 py-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-center">
                    <div className="text-gray-500">MC/ET:</div>
                    <div className="font-semibold text-red-600">3.2</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">TMA:</div>
                    <div className="font-semibold text-orange-600">79%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">VL:</div>
                    <div className="font-semibold text-red-600">13%</div>
                  </div>
                </div>
              </div>

              {/* Separator Line */}
              <hr className="border-gray-200 mb-3" />

              {/* Magic Touch Section */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  <IoColorWandOutline className="h-3 w-3 text-gray-600" />
                  <span className="text-xs text-gray-600 font-semibold">Magic Touch</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  {generatedStates['max'] && (
                    <>
                      <button 
                        className={`${copiedText['max'] ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => handleCopyGeneratedText('max')}
                      >
                        {copiedText['max'] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button 
                        className={`${editingStates['max'] ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => handleEditText('max')}
                      >
                        {editingStates['max'] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="relative magic-touch-dropdown">
                <div 
                  className="flex items-center justify-between mb-3 px-2 py-1 rounded-md border border-gray-300 shadow-sm text-xs bg-gray-50 text-gray-600 cursor-pointer"
                  style={getMagicTouchStyle('max')}
                  onClick={() => handleMagicTouchClick('max')}
                >
                  <div className="flex items-center space-x-1">
                    <span>
                      {magicTouchCategories['max'] ? (
                        <div className="flex items-center space-x-1">
                          {categories.find(c => c.name === magicTouchCategories['max'])?.icon}
                          <span>{magicTouchCategories['max']}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <FiSliders className="h-3 w-3" />
                          <span>Neutral</span>
                        </div>
                      )}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </div>
                
                {openDropdown === 'max' && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1">
                    {categories.map((category) => (
                      <div
                        key={category.name}
                        className="px-3 py-2 text-xs cursor-pointer transition-colors"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = category.color;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '';
                        }}
                        onClick={() => handleCategorySelect('max', category.name)}
                      >
                        <div className="flex items-center space-x-2">
                          {category.icon}
                          <span>{category.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-2 py-1 rounded-md border border-gray-200 text-xs bg-gray-100 text-gray-600 mb-3 mt-2.5 opacity-80">
                <span>Subject: Juni KPIs</span>
              </div>

              <div className={`bg-gray-100 border border-dashed rounded-lg overflow-hidden ${
                generatedStates['max'] ? 'max-h-96 p-4' : 'p-6 h-24'
              } ${editingStates['max'] ? 'border-green-500' : 'border-gray-300'}`}>
                {!generatingStates['max'] && !generatedStates['max'] && (
                  <div className="flex justify-center items-center h-full">
                    <button 
                      onClick={() => handleGenerateEmail('max')}
                      className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-white rounded-lg transition-all duration-200 opacity-85" 
                      style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Generate Email</span>
                    </button>
                  </div>
                )}
                
                {generatingStates['max'] && (
                  <div className="flex justify-center items-center">
                    <div className="flex flex-col items-center space-y-1">
                      <CgSpinner className="h-4 w-4 text-gray-500 animate-spin" />
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500">Generating</span>
                        <span className="text-xs text-gray-500 animate-bounce" style={{animationDelay: '0ms'}}>.</span>
                        <span className="text-xs text-gray-500 animate-bounce" style={{animationDelay: '150ms'}}>.</span>
                        <span className="text-xs text-gray-500 animate-bounce" style={{animationDelay: '300ms'}}>.</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {generatedStates['max'] && (
                  <div className="text-xs text-gray-600 leading-relaxed h-full overflow-y-auto scrollbar-hide w-full">
                    {editingStates['max'] ? (
                      <textarea
                        className="w-full h-full min-h-64 text-xs text-gray-600 leading-relaxed resize-none bg-transparent border-none outline-none font-sans scrollbar-hide"
                        value={editedTexts['max'] || getGeneratedEmailText()}
                        onChange={(e) => handleTextChange('max', e.target.value)}
                        style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans">{editedTexts['max'] || getGeneratedEmailText()}</pre>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card 2 - Anna Schmidt */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Anna Schmidt</h3>
                <button className="text-red-500 hover:text-red-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M5 6v14a2 2 0 002 2h10a2 2 0 002-2V6M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center space-x-2 mb-3 cursor-pointer" onClick={() => handleEmailCopy('anna.schmidt@example.com')}>
                {copiedEmail === 'anna.schmidt@example.com' ? (
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
                <p className="text-sm text-gray-600 truncate">anna.schmidt@example.com</p>
              </div>
              
              {/* KPI Metrics */}
              <div className="bg-gray-100 border border-gray-200 rounded px-3 py-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-center">
                    <div className="text-gray-500">MC/ET:</div>
                    <div className="font-semibold text-green-600">4.7</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">TMA:</div>
                    <div className="font-semibold text-green-600">82%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">VL:</div>
                    <div className="font-semibold text-red-600">15%</div>
                  </div>
                </div>
              </div>

              {/* Separator Line */}
              <hr className="border-gray-200 mb-3" />

              {/* Magic Touch Section */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  <IoColorWandOutline className="h-3 w-3 text-gray-600" />
                  <span className="text-xs text-gray-600 font-semibold">Magic Touch</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  {generatedStates['anna'] && (
                    <>
                      <button 
                        className={`${copiedText['anna'] ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => handleCopyGeneratedText('anna')}
                      >
                        {copiedText['anna'] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button 
                        className={`${editingStates['anna'] ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => handleEditText('anna')}
                      >
                        {editingStates['anna'] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="relative magic-touch-dropdown">
                <div 
                  className="flex items-center justify-between mb-3 px-2 py-1 rounded-md border border-gray-300 shadow-sm text-xs bg-gray-50 text-gray-600 cursor-pointer"
                  style={getMagicTouchStyle('anna')}
                  onClick={() => handleMagicTouchClick('anna')}
                >
                  <div className="flex items-center space-x-1">
                    <span>
                      {magicTouchCategories['anna'] ? (
                        <div className="flex items-center space-x-1">
                          {categories.find(c => c.name === magicTouchCategories['anna'])?.icon}
                          <span>{magicTouchCategories['anna']}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <FiSliders className="h-3 w-3" />
                          <span>Neutral</span>
                        </div>
                      )}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </div>
                
                {openDropdown === 'anna' && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1">
                    {categories.map((category) => (
                      <div
                        key={category.name}
                        className="px-3 py-2 text-xs cursor-pointer transition-colors"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = category.color;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '';
                        }}
                        onClick={() => handleCategorySelect('anna', category.name)}
                      >
                        <div className="flex items-center space-x-2">
                          {category.icon}
                          <span>{category.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-2 py-1 rounded-md border border-gray-200 text-xs bg-gray-100 text-gray-600 mb-3 mt-2.5 opacity-80">
                <span>Subject: Juni KPIs</span>
              </div>

              <div className={`bg-gray-100 border border-dashed rounded-lg overflow-hidden ${
                generatedStates['anna'] ? 'max-h-96 p-4' : 'p-6 h-24'
              } ${editingStates['anna'] ? 'border-green-500' : 'border-gray-300'}`}>
                {!generatingStates['anna'] && !generatedStates['anna'] && (
                  <div className="flex justify-center items-center h-full">
                    <button 
                      onClick={() => handleGenerateEmail('anna')}
                      className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-white rounded-lg transition-all duration-200 opacity-85" 
                      style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Generate Email</span>
                    </button>
                  </div>
                )}
                
                {generatingStates['anna'] && (
                  <div className="flex justify-center items-center">
                    <div className="flex flex-col items-center space-y-1">
                      <CgSpinner className="h-4 w-4 text-gray-500 animate-spin" />
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500">Generating</span>
                        <span className="text-xs text-gray-500 animate-bounce" style={{animationDelay: '0ms'}}>.</span>
                        <span className="text-xs text-gray-500 animate-bounce" style={{animationDelay: '150ms'}}>.</span>
                        <span className="text-xs text-gray-500 animate-bounce" style={{animationDelay: '300ms'}}>.</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {generatedStates['anna'] && (
                  <div className="text-xs text-gray-600 leading-relaxed h-full overflow-y-auto scrollbar-hide w-full">
                    {editingStates['anna'] ? (
                      <textarea
                        className="w-full h-full min-h-64 text-xs text-gray-600 leading-relaxed resize-none bg-transparent border-none outline-none font-sans scrollbar-hide"
                        value={editedTexts['anna'] || getGeneratedEmailText()}
                        onChange={(e) => handleTextChange('anna', e.target.value)}
                        style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans">{editedTexts['anna'] || getGeneratedEmailText()}</pre>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card 3 - Peter Weber */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Peter Weber</h3>
                <button className="text-red-500 hover:text-red-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M5 6v14a2 2 0 002 2h10a2 2 0 002-2V6M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center space-x-2 mb-3 cursor-pointer" onClick={() => handleEmailCopy('peter.weber@example.com')}>
                {copiedEmail === 'peter.weber@example.com' ? (
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
                <p className="text-sm text-gray-600 truncate">peter.weber@example.com</p>
              </div>
              
              {/* KPI Metrics */}
              <div className="bg-gray-100 border border-gray-200 rounded px-3 py-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-center">
                    <div className="text-gray-500">MC/ET:</div>
                    <div className="font-semibold text-red-600">2.1</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">TMA:</div>
                    <div className="font-semibold text-red-600">66%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">VL:</div>
                    <div className="font-semibold text-red-600">9%</div>
                  </div>
                </div>
              </div>

              {/* Separator Line */}
              <hr className="border-gray-200 mb-3" />

              {/* Magic Touch Section */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  <IoColorWandOutline className="h-3 w-3 text-gray-600" />
                  <span className="text-xs text-gray-600 font-semibold">Magic Touch</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  {generatedStates['peter'] && (
                    <>
                      <button 
                        className={`${copiedText['peter'] ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => handleCopyGeneratedText('peter')}
                      >
                        {copiedText['peter'] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button 
                        className={`${editingStates['peter'] ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => handleEditText('peter')}
                      >
                        {editingStates['peter'] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="relative magic-touch-dropdown">
                <div 
                  className="flex items-center justify-between mb-3 px-2 py-1 rounded-md border border-gray-300 shadow-sm text-xs bg-gray-50 text-gray-600 cursor-pointer"
                  style={getMagicTouchStyle('peter')}
                  onClick={() => handleMagicTouchClick('peter')}
                >
                  <div className="flex items-center space-x-1">
                    <span>
                      {magicTouchCategories['peter'] ? (
                        <div className="flex items-center space-x-1">
                          {categories.find(c => c.name === magicTouchCategories['peter'])?.icon}
                          <span>{magicTouchCategories['peter']}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <FiSliders className="h-3 w-3" />
                          <span>Neutral</span>
                        </div>
                      )}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </div>
                
                {openDropdown === 'peter' && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1">
                    {categories.map((category) => (
                      <div
                        key={category.name}
                        className="px-3 py-2 text-xs cursor-pointer transition-colors"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = category.color;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '';
                        }}
                        onClick={() => handleCategorySelect('peter', category.name)}
                      >
                        <div className="flex items-center space-x-2">
                          {category.icon}
                          <span>{category.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-2 py-1 rounded-md border border-gray-200 text-xs bg-gray-100 text-gray-600 mb-3 mt-2.5 opacity-80">
                <span>Subject: Juni KPIs</span>
              </div>

              <div className={`bg-gray-100 border border-dashed rounded-lg overflow-hidden ${
                generatedStates['peter'] ? 'max-h-96 p-4' : 'p-6 h-24'
              } ${editingStates['peter'] ? 'border-green-500' : 'border-gray-300'}`}>
                {!generatingStates['peter'] && !generatedStates['peter'] && (
                  <div className="flex justify-center items-center h-full">
                    <button 
                      onClick={() => handleGenerateEmail('peter')}
                      className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-white rounded-lg transition-all duration-200 opacity-85" 
                      style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Generate Email</span>
                    </button>
                  </div>
                )}
                
                {generatingStates['peter'] && (
                  <div className="flex justify-center items-center">
                    <div className="flex flex-col items-center space-y-1">
                      <CgSpinner className="h-4 w-4 text-gray-500 animate-spin" />
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500">Generating</span>
                        <span className="text-xs text-gray-500 animate-bounce" style={{animationDelay: '0ms'}}>.</span>
                        <span className="text-xs text-gray-500 animate-bounce" style={{animationDelay: '150ms'}}>.</span>
                        <span className="text-xs text-gray-500 animate-bounce" style={{animationDelay: '300ms'}}>.</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {generatedStates['peter'] && (
                  <div className="text-xs text-gray-600 leading-relaxed h-full overflow-y-auto scrollbar-hide w-full">
                    {editingStates['peter'] ? (
                      <textarea
                        className="w-full h-full min-h-64 text-xs text-gray-600 leading-relaxed resize-none bg-transparent border-none outline-none font-sans scrollbar-hide"
                        value={editedTexts['peter'] || getGeneratedEmailText()}
                        onChange={(e) => handleTextChange('peter', e.target.value)}
                        style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans">{editedTexts['peter'] || getGeneratedEmailText()}</pre>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card 4 - Lisa Mueller */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Lisa Mueller</h3>
                <button className="text-red-500 hover:text-red-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M5 6v14a2 2 0 002 2h10a2 2 0 002-2V6M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center space-x-2 mb-3 cursor-pointer" onClick={() => handleEmailCopy('lisa.mueller@example.com')}>
                {copiedEmail === 'lisa.mueller@example.com' ? (
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
                <p className="text-sm text-gray-600 truncate">lisa.mueller@example.com</p>
              </div>
              
              {/* KPI Metrics */}
              <div className="bg-gray-100 border border-gray-200 rounded px-3 py-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-center">
                    <div className="text-gray-500">MC/ET:</div>
                    <div className="font-semibold text-green-600">5.1</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">TMA:</div>
                    <div className="font-semibold text-green-600">88%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">VL:</div>
                    <div className="font-semibold text-green-600">22%</div>
                  </div>
                </div>
              </div>

              {/* Separator Line */}
              <hr className="border-gray-200 mb-3" />

              {/* Magic Touch Section */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  <IoColorWandOutline className="h-3 w-3 text-gray-600" />
                  <span className="text-xs text-gray-600 font-semibold">Magic Touch</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  {generatedStates['lisa'] && (
                    <>
                      <button 
                        className={`${copiedText['lisa'] ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => handleCopyGeneratedText('lisa')}
                      >
                        {copiedText['lisa'] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button 
                        className={`${editingStates['lisa'] ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => handleEditText('lisa')}
                      >
                        {editingStates['lisa'] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="relative magic-touch-dropdown">
                <div 
                  className="flex items-center justify-between mb-3 px-2 py-1 rounded-md border border-gray-300 shadow-sm text-xs bg-gray-50 text-gray-600 cursor-pointer"
                  style={getMagicTouchStyle('lisa')}
                  onClick={() => handleMagicTouchClick('lisa')}
                >
                  <div className="flex items-center space-x-1">
                    <span>
                      {magicTouchCategories['lisa'] ? (
                        <div className="flex items-center space-x-1">
                          {categories.find(c => c.name === magicTouchCategories['lisa'])?.icon}
                          <span>{magicTouchCategories['lisa']}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <FiSliders className="h-3 w-3" />
                          <span>Neutral</span>
                        </div>
                      )}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </div>
                
                {openDropdown === 'lisa' && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1">
                    {categories.map((category) => (
                      <div
                        key={category.name}
                        className="px-3 py-2 text-xs cursor-pointer transition-colors"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = category.color;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '';
                        }}
                        onClick={() => handleCategorySelect('lisa', category.name)}
                      >
                        <div className="flex items-center space-x-2">
                          {category.icon}
                          <span>{category.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-2 py-1 rounded-md border border-gray-200 text-xs bg-gray-100 text-gray-600 mb-3 mt-2.5 opacity-80">
                <span>Subject: Juni KPIs</span>
              </div>

              <div className={`bg-gray-100 border border-dashed rounded-lg overflow-hidden ${
                generatedStates['lisa'] ? 'max-h-96 p-4' : 'p-6 h-24'
              } ${editingStates['lisa'] ? 'border-green-500' : 'border-gray-300'}`}>
                {!generatingStates['lisa'] && !generatedStates['lisa'] && (
                  <div className="flex justify-center items-center h-full">
                    <button 
                      onClick={() => handleGenerateEmail('lisa')}
                      className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-white rounded-lg transition-all duration-200 opacity-85" 
                      style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Generate Email</span>
                    </button>
                  </div>
                )}
                
                {generatingStates['lisa'] && (
                  <div className="flex justify-center items-center">
                    <div className="flex flex-col items-center space-y-1">
                      <CgSpinner className="h-4 w-4 text-gray-500 animate-spin" />
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500">Generating</span>
                        <span className="text-xs text-gray-500 animate-bounce" style={{animationDelay: '0ms'}}>.</span>
                        <span className="text-xs text-gray-500 animate-bounce" style={{animationDelay: '150ms'}}>.</span>
                        <span className="text-xs text-gray-500 animate-bounce" style={{animationDelay: '300ms'}}>.</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {generatedStates['lisa'] && (
                  <div className="text-xs text-gray-600 leading-relaxed h-full overflow-y-auto scrollbar-hide w-full">
                    {editingStates['lisa'] ? (
                      <textarea
                        className="w-full h-full min-h-64 text-xs text-gray-600 leading-relaxed resize-none bg-transparent border-none outline-none font-sans scrollbar-hide"
                        value={editedTexts['lisa'] || getGeneratedEmailText()}
                        onChange={(e) => handleTextChange('lisa', e.target.value)}
                        style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans">{editedTexts['lisa'] || getGeneratedEmailText()}</pre>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card 5 - Tom Fischer */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Tom Fischer</h3>
                <button className="text-red-500 hover:text-red-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M5 6v14a2 2 0 002 2h10a2 2 0 002-2V6M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center space-x-2 mb-3 cursor-pointer" onClick={() => handleEmailCopy('tom.fischer@example.com')}>
                {copiedEmail === 'tom.fischer@example.com' ? (
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
                <p className="text-sm text-gray-600 truncate">tom.fischer@example.com</p>
              </div>
              
              {/* KPI Metrics */}
              <div className="bg-gray-100 border border-gray-200 rounded px-3 py-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-center">
                    <div className="text-gray-500">MC/ET:</div>
                    <div className="font-semibold text-orange-600">3.8</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">TMA:</div>
                    <div className="font-semibold text-orange-600">75%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">VL:</div>
                    <div className="font-semibold text-green-600">18%</div>
                  </div>
                </div>
              </div>

              {/* Separator Line */}
              <hr className="border-gray-200 mb-3" />

              {/* Magic Touch Section */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  <IoColorWandOutline className="h-3 w-3 text-gray-600" />
                  <span className="text-xs text-gray-600 font-semibold">Magic Touch</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  {generatedStates['tom'] && (
                    <>
                      <button 
                        className={`${copiedText['tom'] ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => handleCopyGeneratedText('tom')}
                      >
                        {copiedText['tom'] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button 
                        className={`${editingStates['tom'] ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => handleEditText('tom')}
                      >
                        {editingStates['tom'] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="relative magic-touch-dropdown">
                <div 
                  className="flex items-center justify-between mb-3 px-2 py-1 rounded-md border border-gray-300 shadow-sm text-xs bg-gray-50 text-gray-600 cursor-pointer"
                  style={getMagicTouchStyle('tom')}
                  onClick={() => handleMagicTouchClick('tom')}
                >
                  <div className="flex items-center space-x-1">
                    <span>
                      {magicTouchCategories['tom'] ? (
                        <div className="flex items-center space-x-1">
                          {categories.find(c => c.name === magicTouchCategories['tom'])?.icon}
                          <span>{magicTouchCategories['tom']}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <FiSliders className="h-3 w-3" />
                          <span>Neutral</span>
                        </div>
                      )}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </div>
                
                {openDropdown === 'tom' && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1">
                    {categories.map((category) => (
                      <div
                        key={category.name}
                        className="px-3 py-2 text-xs cursor-pointer transition-colors"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = category.color;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '';
                        }}
                        onClick={() => handleCategorySelect('tom', category.name)}
                      >
                        <div className="flex items-center space-x-2">
                          {category.icon}
                          <span>{category.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-2 py-1 rounded-md border border-gray-200 text-xs bg-gray-100 text-gray-600 mb-3 mt-2.5 opacity-80">
                <span>Subject: Juni KPIs</span>
              </div>

              <div className={`bg-gray-100 border border-dashed rounded-lg overflow-hidden ${
                generatedStates['tom'] ? 'max-h-96 p-4' : 'p-6 h-24'
              } ${editingStates['tom'] ? 'border-green-500' : 'border-gray-300'}`}>
                {!generatingStates['tom'] && !generatedStates['tom'] && (
                  <div className="flex justify-center items-center h-full">
                    <button 
                      onClick={() => handleGenerateEmail('tom')}
                      className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-white rounded-lg transition-all duration-200 opacity-85" 
                      style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Generate Email</span>
                    </button>
                  </div>
                )}
                
                {generatingStates['tom'] && (
                  <div className="flex justify-center items-center">
                    <div className="flex flex-col items-center space-y-1">
                      <CgSpinner className="h-4 w-4 text-gray-500 animate-spin" />
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500">Generating</span>
                        <span className="text-xs text-gray-500 animate-bounce" style={{animationDelay: '0ms'}}>.</span>
                        <span className="text-xs text-gray-500 animate-bounce" style={{animationDelay: '150ms'}}>.</span>
                        <span className="text-xs text-gray-500 animate-bounce" style={{animationDelay: '300ms'}}>.</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {generatedStates['tom'] && (
                  <div className="text-xs text-gray-600 leading-relaxed h-full overflow-y-auto scrollbar-hide w-full">
                    {editingStates['tom'] ? (
                      <textarea
                        className="w-full h-full min-h-64 text-xs text-gray-600 leading-relaxed resize-none bg-transparent border-none outline-none font-sans scrollbar-hide"
                        value={editedTexts['tom'] || getGeneratedEmailText()}
                        onChange={(e) => handleTextChange('tom', e.target.value)}
                        style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans">{editedTexts['tom'] || getGeneratedEmailText()}</pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Eddie KI Assistant */}
      <AdminEddieAssistant />
    </div>
  );
} 