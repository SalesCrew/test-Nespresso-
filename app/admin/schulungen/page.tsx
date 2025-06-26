"use client";

import { useState } from "react";
import { Settings, Plus, Video, FileText, HelpCircle, X, GripVertical, Trash2, Check } from "lucide-react";
import AdminNavigation from "@/components/AdminNavigation";
import AdminEddieAssistant from "@/components/AdminEddieAssistant";

export default function SchulungenPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState<Array<{type: 'video' | 'pdf' | 'quiz', id: string}>>([]);
  const [currentStep, setCurrentStep] = useState<'selection' | 'video-setup' | 'pdf-setup' | 'quiz-setup'>('selection');
  
  // Quiz setup state
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    id: string;
    type: 'multiple-choice' | 'eddies-frage';
    question: string;
    options?: string[];
    correctAnswer?: number;
    correctAnswers?: string;
    wrongAnswers?: string;
    position: number;
  }>>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState<'multiple-choice' | 'eddies-frage' | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [mcOptionsCount, setMcOptionsCount] = useState(4);

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Admin Navigation */}
      <AdminNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-14'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Schulungen</h1>
              <p className="text-gray-500 text-sm">Training und Weiterbildung Verwaltung</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button className="p-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {/* Add New Card */}
          <div 
            onClick={() => setShowCreateModal(true)}
            className="w-48 h-48 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 flex flex-col"
          >
            {/* Header */}
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold text-gray-800 tracking-tight">Schulung erstellen</h3>
            </div>
            
            {/* Plus Container */}
            <div className="flex-1 mb-1 -mx-4">
              <div className="w-full h-full bg-gray-100 border-t border-b border-gray-200 flex items-center justify-center">
                <div className="px-4 py-1 rounded-lg border border-gray-200" style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)', opacity: '0.65'}}>
                  <Plus className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            
            {/* Bottom Icons */}
            <div className="flex items-center justify-start space-x-1 mt-3">
              <Video className="h-4 w-4 text-gray-300" />
              <FileText className="h-4 w-4 text-gray-300" />
              <HelpCircle className="h-4 w-4 text-gray-300" />
            </div>
          </div>
        </main>
      </div>

      {/* AI Assistant */}
      <AdminEddieAssistant />

      {/* Create Training Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Neue Schulung erstellen</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedComponents([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {currentStep === 'selection' ? (
                <>
                  {/* Component Selection */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Schulungskomponenten auswählen</h3>
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={() => {
                          const newComponent = { type: 'video' as const, id: `video_${Date.now()}` };
                          setSelectedComponents(prev => [...prev, newComponent]);
                        }}
                        className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="h-8 w-8 mb-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <Video className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Video</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          const newComponent = { type: 'pdf' as const, id: `pdf_${Date.now()}` };
                          setSelectedComponents(prev => [...prev, newComponent]);
                        }}
                        className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                      >
                        <div className="h-8 w-8 mb-2 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}>
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">PDF</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          const newComponent = { type: 'quiz' as const, id: `quiz_${Date.now()}` };
                          setSelectedComponents(prev => [...prev, newComponent]);
                        }}
                        className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                      >
                        <div className="h-8 w-8 mb-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <HelpCircle className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Quiz</span>
                      </button>
                    </div>
                  </div>

                  {/* Selected Components */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Ausgewählte Komponenten</h3>
                    {selectedComponents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>Keine Komponenten ausgewählt</p>
                        <p className="text-sm">Klicke auf die Icons oben, um Komponenten hinzuzufügen</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                        {selectedComponents.map((component, index) => {
                          const getIcon = () => {
                            switch (component.type) {
                              case 'video':
                                return (
                                  <div className="h-6 w-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded flex items-center justify-center">
                                    <Video className="h-4 w-4 text-white" />
                                  </div>
                                );
                              case 'pdf':
                                return (
                                  <div className="h-6 w-6 rounded flex items-center justify-center" style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}>
                                    <FileText className="h-4 w-4 text-white" />
                                  </div>
                                );
                              case 'quiz':
                                return (
                                  <div className="h-6 w-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                                    <HelpCircle className="h-4 w-4 text-white" />
                                  </div>
                                );
                            }
                          };

                          const getLabel = () => {
                            switch (component.type) {
                              case 'video':
                                return 'Video';
                              case 'pdf':
                                return 'PDF Dokument';
                              case 'quiz':
                                return 'Quiz';
                            }
                          };

                          const getContainerStyle = () => {
                            switch (component.type) {
                              case 'video':
                                return {
                                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03), rgba(79, 70, 229, 0.03))',
                                  borderColor: 'rgba(59, 130, 246, 0.1)'
                                };
                              case 'pdf':
                                return {
                                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.03), rgba(16, 95, 45, 0.03))',
                                  borderColor: 'rgba(34, 197, 94, 0.1)'
                                };
                              case 'quiz':
                                return {
                                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.03), rgba(236, 72, 153, 0.03))',
                                  borderColor: 'rgba(168, 85, 247, 0.1)'
                                };
                            }
                          };

                          return (
                            <div
                              key={component.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                              style={getContainerStyle()}
                            >
                              <div className="flex items-center space-x-3">
                                {getIcon()}
                                <span className="font-medium text-gray-900">{getLabel()} {index + 1}</span>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedComponents(prev => prev.filter(c => c.id !== component.id));
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : currentStep === 'video-setup' ? (
                /* Video Setup Step */
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Video className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Video einrichten</h3>
                  </div>

                  {/* Video Upload */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Video-Datei</label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center transition-colors" style={{borderColor: 'rgba(59, 130, 246, 0.7)'}}>
                      <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Ziehe eine Video-Datei hierher oder</p>
                      <button className="text-blue-600 hover:text-blue-700 font-medium">durchsuche deine Dateien</button>
                      <p className="text-xs text-gray-500 mt-2">MP4, MOV, AVI (max. 2GB)</p>
                    </div>
                  </div>

                  {/* Thumbnail Upload */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Thumbnail</label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors" style={{borderColor: 'rgba(59, 130, 246, 0.7)'}}>
                      <div className="h-8 w-8 bg-gray-100 rounded mx-auto mb-3 flex items-center justify-center">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 mb-2">Thumbnail hochladen</p>
                      <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">Bild auswählen</button>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG (empfohlen: 16:9)</p>
                    </div>
                  </div>

                  {/* Transcript */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Transkript (optional)</label>
                    <textarea
                      placeholder="Füge hier das Transkript des Videos ein..."
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none [&::-webkit-scrollbar]:hidden"
                      style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                    />
                    <p className="text-xs text-gray-500 mt-1">Das Transkript hilft bei der Suche und Barrierefreiheit</p>
                  </div>
                </div>
              ) : currentStep === 'pdf-setup' ? (
                /* PDF Setup Step */
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}>
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">PDF Dokument einrichten</h3>
                  </div>

                  {/* PDF Upload */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">PDF-Datei</label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center transition-colors" style={{borderColor: 'rgba(34, 197, 94, 0.7)'}}>
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Ziehe eine PDF-Datei hierher oder</p>
                      <button className="text-green-600 hover:text-green-700 font-medium">durchsuche deine Dateien</button>
                      <p className="text-xs text-gray-500 mt-2">PDF (max. 50MB)</p>
                    </div>
                  </div>

                  {/* Document Title */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Dokumenttitel</label>
                    <input
                      type="text"
                      placeholder="z.B. Verkaufstechniken Handbuch"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Beschreibung (optional)</label>
                    <textarea
                      placeholder="Beschreibe kurz den Inhalt dieses Dokuments..."
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none [&::-webkit-scrollbar]:hidden"
                      style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                    />
                  </div>
                </div>
              ) : (
                /* Quiz Setup Step */
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <HelpCircle className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Quiz erstellen</h3>
                  </div>

                  {/* Two Column Layout */}
                  <div className="grid grid-cols-[auto_1fr] gap-6">
                    {/* Left Column - Question Type Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowQuestionForm('multiple-choice')}
                        className="w-32 flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                      >
                        <div className="h-8 w-8 mb-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <HelpCircle className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Multiple Choice</span>
                      </button>
                      
                      <button
                        onClick={() => setShowQuestionForm('eddies-frage')}
                        className="w-32 flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="h-8 w-8 mb-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <img
                            src="/icons/robot 1.svg"
                            alt="Eddie"
                            className="h-5 w-5 brightness-0 invert"
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Eddies Frage</span>
                      </button>
                    </div>

                    {/* Right Column - Question Creation Form */}
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      {!showQuestionForm ? (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm">Wähle einen Fragentyp</p>
                          <p className="text-xs">um eine neue Frage zu erstellen</p>
                        </div>
                      ) : showQuestionForm === 'multiple-choice' ? (
                        <div className="space-y-3 relative">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="h-5 w-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                                <HelpCircle className="h-3 w-3 text-white" />
                              </div>
                              <h4 className="text-sm font-medium text-gray-900">Multiple Choice Frage</h4>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  const questionInput = document.getElementById('mc-question') as HTMLInputElement;
                                  const optionInputs = Array.from({ length: mcOptionsCount }, (_, i) => 
                                    document.getElementById(`mc-option-${i}`) as HTMLInputElement
                                  );
                                  const correctRadio = document.querySelector('input[name="correct-answer"]:checked') as HTMLInputElement;
                                  
                                  if (questionInput.value.trim()) {
                                    const newQuestion = {
                                      id: `mc_${Date.now()}`,
                                      type: 'multiple-choice' as const,
                                      question: questionInput.value.trim(),
                                      options: optionInputs.map(input => input.value),
                                      correctAnswer: correctRadio ? parseInt(correctRadio.value) : 0,
                                      position: quizQuestions.length + 1
                                    };
                                    setQuizQuestions(prev => [...prev, newQuestion]);
                                    
                                    // Clear form
                                    questionInput.value = '';
                                    optionInputs.forEach(input => input.value = '');
                                    if (correctRadio) correctRadio.checked = false;
                                    setMcOptionsCount(4);
                                    setShowQuestionForm(null);
                                  }
                                }}
                                className="text-green-600 hover:text-green-700 transition-colors"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setMcOptionsCount(4);
                                  setShowQuestionForm(null);
                                }}
                                className="text-red-500 hover:text-red-600 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <input
                            type="text"
                            placeholder="Frage eingeben..."
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none text-sm"
                            id="mc-question"
                          />
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-gray-700">Antwortoptionen</label>
                              <button
                                type="button"
                                onClick={() => setMcOptionsCount(prev => prev + 2)}
                                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                + Weitere Optionen hinzufügen
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              {Array.from({ length: mcOptionsCount }, (_, index) => (
                                <div key={index} className="flex items-center space-x-1">
                                  <input
                                    type="radio"
                                    name="correct-answer"
                                    value={index}
                                    className="text-purple-500"
                                  />
                                  <input
                                    type="text"
                                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                    className="flex-1 p-1.5 border border-gray-300 rounded focus:outline-none text-xs"
                                    id={`mc-option-${index}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 relative">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="h-5 w-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center">
                                <img
                                  src="/icons/robot 1.svg"
                                  alt="Eddie"
                                  className="h-3 w-3 brightness-0 invert"
                                />
                              </div>
                              <h4 className="text-sm font-medium text-gray-900">Eddies Frage</h4>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  const questionInput = document.getElementById('eddie-question') as HTMLInputElement;
                                  const correctInput = document.getElementById('eddie-correct') as HTMLTextAreaElement;
                                  const wrongInput = document.getElementById('eddie-wrong') as HTMLTextAreaElement;
                                  
                                  if (questionInput.value.trim()) {
                                    const newQuestion = {
                                      id: `eddie_${Date.now()}`,
                                      type: 'eddies-frage' as const,
                                      question: questionInput.value.trim(),
                                      correctAnswers: correctInput.value,
                                      wrongAnswers: wrongInput.value,
                                      position: quizQuestions.length + 1
                                    };
                                    setQuizQuestions(prev => [...prev, newQuestion]);
                                    
                                    // Clear form
                                    questionInput.value = '';
                                    correctInput.value = '';
                                    wrongInput.value = '';
                                    setShowQuestionForm(null);
                                  }
                                }}
                                className="text-green-600 hover:text-green-700 transition-colors"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setShowQuestionForm(null)}
                                className="text-red-500 hover:text-red-600 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <input
                            type="text"
                            placeholder="Eddies Frage eingeben..."
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none text-sm"
                            id="eddie-question"
                          />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium text-gray-700 mb-1 block">Richtige Antworten</label>
                              <textarea
                                placeholder="Beschreibe was als richtige Antwort gilt..."
                                className="w-full h-18 p-2 border border-gray-300 rounded resize-none focus:outline-none text-xs [&::-webkit-scrollbar]:hidden"
                                style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                                id="eddie-correct"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700 mb-1 block">Falsche Antworten</label>
                              <textarea
                                placeholder="Beschreibe was als falsche Antwort gilt..."
                                className="w-full h-18 p-2 border border-gray-300 rounded resize-none focus:outline-none text-xs [&::-webkit-scrollbar]:hidden"
                                style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                                id="eddie-wrong"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Questions List */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Fragen ({quizQuestions.length})</h4>
                    {quizQuestions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>Keine Fragen erstellt</p>
                        <p className="text-sm">Erstelle Fragen mit den Buttons oben</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                        {quizQuestions
                          .sort((a, b) => a.position - b.position)
                          .map((question, index) => (
                          <div
                            key={question.id}
                            className="border rounded-lg transition-colors hover:bg-gray-50"
                            style={{
                              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.03), rgba(236, 72, 153, 0.03))',
                              borderColor: 'rgba(168, 85, 247, 0.1)'
                            }}
                          >
                            {/* Collapsed Row */}
                            <div 
                              className="p-3 cursor-pointer flex items-center justify-between"
                              onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
                            >
                              <div className="flex items-center space-x-3">
                                <GripVertical className="h-4 w-4 text-gray-400" />
                                <div className={`h-5 w-5 rounded flex items-center justify-center ${
                                  question.type === 'multiple-choice' 
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                                }`}>
                                  {question.type === 'multiple-choice' ? (
                                    <HelpCircle className="h-3 w-3 text-white" />
                                  ) : (
                                    <img
                                      src="/icons/robot 1.svg"
                                      alt="Eddie"
                                      className="h-3 w-3 brightness-0 invert"
                                    />
                                  )}
                                </div>
                                <span className="font-medium text-gray-900">Frage {question.position}</span>
                                <span className="text-sm text-gray-600 truncate max-w-xs">
                                  {question.question || 'Keine Frage eingegeben'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQuizQuestions(prev => {
                                      const filtered = prev.filter(q => q.id !== question.id);
                                      return filtered.map((q, i) => ({ ...q, position: i + 1 }));
                                    });
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                <span className="text-gray-400">
                                  {expandedQuestion === question.id ? '−' : '+'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Expanded Content */}
                            {expandedQuestion === question.id && (
                              <div className="px-6 pb-4 border-t border-gray-200">
                                {question.type === 'multiple-choice' ? (
                                  <div className="space-y-3 mt-3">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 block mb-1">Frage</label>
                                      <div className="text-sm text-gray-900">{question.question}</div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 block mb-1">Antwortoptionen</label>
                                      <div className="space-y-1">
                                        {question.options?.map((option, optionIndex) => (
                                          <div key={optionIndex} className={`text-sm p-2 rounded ${
                                            question.correctAnswer === optionIndex 
                                              ? 'bg-green-50 text-green-800 font-medium' 
                                              : 'text-gray-700'
                                          }`}>
                                            {String.fromCharCode(65 + optionIndex)}: {option || 'Keine Option eingegeben'}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3 mt-3">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 block mb-1">Frage</label>
                                      <div className="text-sm text-gray-900">{question.question}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-xs font-medium text-gray-700 mb-1 block">Richtige Antworten</label>
                                        <div className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                                          {question.correctAnswers || 'Nicht definiert'}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-gray-700 mb-1 block">Falsche Antworten</label>
                                        <div className="text-sm text-gray-700 bg-red-50 p-2 rounded">
                                          {question.wrongAnswers || 'Nicht definiert'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              {(currentStep === 'video-setup' || currentStep === 'pdf-setup' || currentStep === 'quiz-setup') && (
                <button
                  onClick={() => setCurrentStep('selection')}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Zurück
                </button>
              )}
              <div className={`flex items-center space-x-3 ${currentStep === 'selection' ? 'ml-auto' : ''}`}>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedComponents([]);
                    setCurrentStep('selection');
                    setQuizQuestions([]);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                {currentStep === 'selection' ? (
                  <button
                    disabled={selectedComponents.length === 0}
                    onClick={() => {
                      // Route to appropriate setup based on first component
                      const firstComponent = selectedComponents[0];
                      if (firstComponent?.type === 'video') {
                        setCurrentStep('video-setup');
                      } else if (firstComponent?.type === 'pdf') {
                        setCurrentStep('pdf-setup');
                      } else if (firstComponent?.type === 'quiz') {
                        setCurrentStep('quiz-setup');
                      }
                    }}
                    className="px-4 py-2 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    style={{
                      background: selectedComponents.length > 0 ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.85), rgba(16, 95, 45, 0.85))' : undefined
                    }}
                  >
                    Weiter
                  </button>
                ) : currentStep === 'video-setup' ? (
                  <button
                    className="px-4 py-2 text-white rounded-lg transition-colors"
                    style={{background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.85), rgba(79, 70, 229, 0.85))'}}
                  >
                    Video speichern
                  </button>
                ) : currentStep === 'pdf-setup' ? (
                  <button
                    className="px-4 py-2 text-white rounded-lg transition-colors"
                    style={{background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.85), rgba(16, 95, 45, 0.85))'}}
                  >
                    PDF speichern
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 text-white rounded-lg transition-colors"
                    style={{background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.85), rgba(236, 72, 153, 0.85))'}}
                  >
                    Quiz speichern
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}