"use client";

import { useState } from "react";
import { Settings, Plus, Video, FileText, HelpCircle, X, GripVertical, Trash2, Check, Edit, CheckSquare, BookOpen, Loader2, ArrowLeft, UserPlus, Play, Eye, ThumbsUp, ThumbsDown } from "lucide-react";
import AdminNavigation from "@/components/AdminNavigation";
import AdminEddieAssistant from "@/components/AdminEddieAssistant";

// Custom styles for 3D flip animation
const flipStyles = `
  .preserve-3d {
    transform-style: preserve-3d;
  }
  .backface-hidden {
    backface-visibility: hidden;
  }
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
  @keyframes wobble {
    0%, 100% { transform: rotate(0deg); }
    20% { transform: rotate(-8deg); }
    40% { transform: rotate(8deg); }
    60% { transform: rotate(-4deg); }
    80% { transform: rotate(4deg); }
  }
  .wobble {
    animation: wobble 0.5s ease-in-out;
  }
`;

export default function SchulungenPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState<Array<{type: 'video' | 'pdf' | 'quiz', id: string}>>([]);
  const [currentStep, setCurrentStep] = useState<'selection' | 'video-setup' | 'pdf-setup' | 'quiz-setup' | 'schulung-finalize'>('selection');
  const [completedComponents, setCompletedComponents] = useState<string[]>([]);
  const [currentComponentIndex, setCurrentComponentIndex] = useState(0);
  
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
  const [mcCorrectAnswer, setMcCorrectAnswer] = useState(0);
  const [clickCounts, setClickCounts] = useState<{ [key: number]: { count: number; timestamp: number } }>({});
  const [draggedQuestion, setDraggedQuestion] = useState<string | null>(null);
  const [dragOverQuestion, setDragOverQuestion] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editedOptions, setEditedOptions] = useState<string[]>([]);
  const [editedQuestionText, setEditedQuestionText] = useState('');
  const [editedCorrectAnswers, setEditedCorrectAnswers] = useState('');
  const [editedWrongAnswers, setEditedWrongAnswers] = useState('');

  // Component form data state
  const [videoFormData, setVideoFormData] = useState({ transcript: '', title: '', description: '', duration: 0 });
  const [pdfFormData, setPdfFormData] = useState({ title: '', description: '', duration: 0 });
  const [quizFormData, setQuizFormData] = useState({ duration: 0 });

  // Schulung finalization state
  const [schulungData, setSchulungData] = useState({ title: '', description: '' });
  const [selectedPromotors, setSelectedPromotors] = useState<string[]>([]);
  const [activeRegionFilter, setActiveRegionFilter] = useState<string>("all");
  const [promotorSelectionSearch, setPromotorSelectionSearch] = useState("");
  const [lastSelectedByIcon, setLastSelectedByIcon] = useState<string[]>([]);

  // Created schulungen state
  const [createdSchulungen, setCreatedSchulungen] = useState<Array<{
    id: string;
    title: string;
    description: string;
    components: Array<{type: 'video' | 'pdf' | 'quiz', id: string}>;
    promotors: string[];
    createdAt: Date;
  }>>([]);

  // Schulung details modal state
  const [showSchulungDetails, setShowSchulungDetails] = useState(false);
  const [selectedSchulung, setSelectedSchulung] = useState<any>(null);
  const [selectedCompletionFilter, setSelectedCompletionFilter] = useState<'alle' | 'erledigt' | 'unterbrochen' | 'nicht erledigt'>('alle');
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);
  
  // Promotor detailed view state
  const [showPromotorDetails, setShowPromotorDetails] = useState(false);
  const [selectedPromotor, setSelectedPromotor] = useState<any>(null);

  // Additional promotor assignment state
  const [showAssignPromotorDropdown, setShowAssignPromotorDropdown] = useState(false);
  const [assignPromotorSearch, setAssignPromotorSearch] = useState("");
  const [assignActiveRegionFilter, setAssignActiveRegionFilter] = useState<string>("all");
  const [assignSelectedPromotors, setAssignSelectedPromotors] = useState<string[]>([]);
  const [lastAssignSelectedByIcon, setLastAssignSelectedByIcon] = useState<string[]>([]);

  // Schulung search state
  const [schulungSearch, setSchulungSearch] = useState("");

  // Navigation state for Schulungen vs Videos
  const [activeSection, setActiveSection] = useState<"schulungen" | "videos">("schulungen");

  // Videos section state
  const [videosSearch, setVideosSearch] = useState("");
  const [flippedVideoId, setFlippedVideoId] = useState<number | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<number | null>(null);
  const [editedVideoTitle, setEditedVideoTitle] = useState("");
  const [editedVideoTranscript, setEditedVideoTranscript] = useState("");
  const [deleteConfirmVideoId, setDeleteConfirmVideoId] = useState<number | null>(null);

  // Mock videos data - now in state so it can be updated
  const [videos, setVideos] = useState([
    {
      id: 1,
      title: "Grundlagen des Verkaufs - Einführung",
      thumbnail: "/placeholder.jpg",
      likes: 45,
      dislikes: 2,
      views: 78,
      duration: "8:34",
      uploadDate: "vor 2 Tagen",
      transcript: "Willkommen zu unserem Verkaufstraining. In diesem Video lernen Sie die wichtigsten Grundlagen für erfolgreiche Verkaufsgespräche. Wir beginnen mit der richtigen Begrüßung und Kontaktaufnahme mit potenziellen Kunden. Ein freundliches Lächeln und selbstbewusstes Auftreten sind der Schlüssel zum Erfolg. Denken Sie daran, dass der erste Eindruck entscheidend ist."
    },
    {
      id: 2,
      title: "Produktpräsentation Masterclass",
      thumbnail: "/placeholder.jpg",
      likes: 62,
      dislikes: 3,
      views: 93,
      duration: "15:22",
      uploadDate: "vor 3 Tagen",
      transcript: "Eine überzeugende Produktpräsentation ist das Herzstück jeder erfolgreichen Promotion. In diesem ausführlichen Tutorial zeigen wir Ihnen, wie Sie Produkte so präsentieren, dass Kunden sofort überzeugt sind. Beginnen Sie immer mit den wichtigsten Vorteilen und arbeiten Sie sich zu den Details vor. Nutzen Sie Storytelling-Techniken, um emotionale Verbindungen zu schaffen."
    },
    {
      id: 3,
      title: "Kundeneinwände professionell behandeln",
      thumbnail: "/placeholder.jpg",
      likes: 38,
      dislikes: 1,
      views: 54,
      duration: "12:18",
      uploadDate: "vor 5 Tagen",
      transcript: "Kundeneinwände sind völlig normal und sogar ein Zeichen von Interesse. Lernen Sie in diesem Video, wie Sie typische Einwände wie 'Das ist zu teuer' oder 'Ich muss noch überlegen' professionell behandeln. Die HEARD-Methode hilft Ihnen dabei: Hören, Empathie zeigen, Anerkennen, Reagieren, Doppelt nachfragen."
    },
    {
      id: 4,
      title: "Teamwork und Kommunikation",
      thumbnail: "/placeholder.jpg",
      likes: 41,
      dislikes: 2,
      views: 67,
      duration: "18:45",
      uploadDate: "vor 1 Woche",
      transcript: "Erfolgreiche Promotionen funktionieren nur im Team. In diesem Video lernen Sie, wie Sie effektiv mit Ihren Kollegen kommunizieren und zusammenarbeiten. Klare Absprachen, regelmäßiger Austausch und gegenseitige Unterstützung sind die Grundpfeiler erfolgreicher Teamarbeit. Wir zeigen Ihnen praktische Kommunikationstechniken."
    },
    {
      id: 5,
      title: "Digitale Tools für Promotoren",
      thumbnail: "/placeholder.jpg",
      likes: 29,
      dislikes: 1,
      views: 48,
      duration: "6:52",
      uploadDate: "vor 1 Woche",
      transcript: "Die SalesCrew App und andere digitale Tools können Ihren Arbeitsalltag erheblich erleichtern. In diesem Tutorial zeigen wir Ihnen die wichtigsten Funktionen: Terminplanung, Kundenerfassung, Verkaufsstatistiken und Kommunikation mit dem Team. Nutzen Sie die Technologie zu Ihrem Vorteil."
    },
    {
      id: 6,
      title: "Sicherheit am Arbeitsplatz",
      thumbnail: "/placeholder.jpg",
      likes: 33,
      dislikes: 0,
      views: 42,
      duration: "10:15",
      uploadDate: "vor 2 Wochen",
      transcript: "Ihre Sicherheit hat oberste Priorität. In diesem wichtigen Video besprechen wir alle relevanten Sicherheitsrichtlinien für Promotionseinsätze. Dazu gehören: Verhalten in Notfällen, Umgang mit schwierigen Kunden, Arbeitsschutzbestimmungen und wichtige Kontaktnummern. Prägen Sie sich diese Informationen gut ein."
    }
  ]);

  // Filter videos based on search query
  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(videosSearch.toLowerCase())
  );

  // Video card helper functions
  const handleVideoCardFlip = (videoId: number) => {
    setFlippedVideoId(flippedVideoId === videoId ? null : videoId);
    setEditingVideoId(null); // Reset edit mode when flipping
  };

  const handleVideoEdit = (videoId: number) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      setEditingVideoId(videoId);
      setEditedVideoTitle(video.title);
      setEditedVideoTranscript(video.transcript);
    }
  };

  const handleVideoSave = (videoId: number) => {
    // Update the video in the state
    setVideos(prevVideos => prevVideos.map(video => 
      video.id === videoId 
        ? { ...video, title: editedVideoTitle, transcript: editedVideoTranscript }
        : video
    ));
    setEditingVideoId(null);
    // In a real app, this would also save to backend
  };

  const handleVideoCancel = () => {
    setEditingVideoId(null);
    setEditedVideoTitle("");
    setEditedVideoTranscript("");
  };

  const handleVideoDelete = (videoId: number) => {
    if (deleteConfirmVideoId === videoId) {
      // Second click - actually delete
      setVideos(prevVideos => prevVideos.filter(video => video.id !== videoId));
      setDeleteConfirmVideoId(null);
    } else {
      // First click - start wobble and set timer
      setDeleteConfirmVideoId(videoId);
      setTimeout(() => {
        setDeleteConfirmVideoId(null);
      }, 2000);
    }
  };

  // Mock completion data for promotors
  const getPromotorCompletionStatus = (promotorName: string, schulungId: string) => {
    // Mock random completion statuses
    const statuses = ['erledigt', 'unterbrochen', 'nicht erledigt'];
    const hash = promotorName.length + schulungId.length;
    return statuses[hash % 3];
  };

  // Generate detailed progress data for a promotor
  const getPromotorDetailedProgress = (promotorName: string, schulungId: string, components: any[]) => {
    const hash = promotorName.length + schulungId.length;
    const status = getPromotorCompletionStatus(promotorName, schulungId);
    
    if (status === 'nicht erledigt') {
      return null; // No progress for not started
    }

    // Generate progress for each individual component
    const componentProgress: Record<string, any> = {};
    
    components.forEach((component, index) => {
      const componentHash = hash + index;
      
      if (component.type === 'video') {
        let videoProgress = Math.min(100, Math.max(0, (componentHash * 7) % 101));
        // Ensure "erledigt" status has at least 85% video progress
        if (status === 'erledigt' && videoProgress < 85) {
          videoProgress = Math.min(100, 85 + (componentHash % 16)); // 85-100%
        }
        componentProgress[component.id] = {
          type: 'video',
          watchedPercentage: videoProgress,
          completed: videoProgress >= 85
        };
      } else if (component.type === 'pdf') {
        const pdfPagesRead = Math.min(24, Math.max(0, (componentHash * 3) % 25));
        componentProgress[component.id] = {
          type: 'pdf',
          pagesRead: pdfPagesRead,
          totalPages: 24,
          completed: pdfPagesRead >= 24
        };
      } else if (component.type === 'quiz') {
        // Generate quiz attempts (each question can have multiple attempts)
        const quizAttempts: Record<number, Array<'correct' | 'incorrect'>> = {};
        const totalQuestions = 5;
        
        for (let i = 0; i < totalQuestions; i++) {
          const questionHash = componentHash + i;
          const attempts: Array<'correct' | 'incorrect'> = [];
          
          if (status === 'erledigt' || (questionHash % 3 !== 0)) {
            // Generate 1-3 attempts per question
            const numAttempts = Math.min(3, Math.max(1, (questionHash % 3) + 1));
            
            for (let j = 0; j < numAttempts; j++) {
              const isCorrect = j === numAttempts - 1 || (questionHash + j) % 4 === 0;
              attempts.push(isCorrect ? 'correct' : 'incorrect');
            }
          }
          
          quizAttempts[i] = attempts;
        }
        
        componentProgress[component.id] = {
          type: 'quiz',
          attempts: quizAttempts,
          totalQuestions,
          completed: status === 'erledigt'
        };
      }
    });

    return componentProgress;
  };

  const handlePromotorClick = (promotorName: string) => {
    const status = getPromotorCompletionStatus(promotorName, selectedSchulung.id);
    
    // Only allow clicking for promotors who started training
    if (status === 'unterbrochen' || status === 'erledigt') {
      const detailedProgress = getPromotorDetailedProgress(promotorName, selectedSchulung.id, selectedSchulung.components);
      setSelectedPromotor({
        name: promotorName,
        status,
        progress: detailedProgress,
        schulung: selectedSchulung
      });
      setShowSchulungDetails(false); // Hide schulung details
      setShowPromotorDetails(true);
    }
  };

  const handleSchulungClick = (schulung: any) => {
    setSelectedSchulung(schulung);
    setSelectedCompletionFilter('alle');
    setExpandedComponent(null);
    setShowSchulungDetails(true);
    // Pre-select promotors who already have this schulung for the assign dropdown
    setAssignSelectedPromotors(schulung.promotors || []);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "erledigt":
        return <Check className="h-4 w-4 text-green-500" />;
      case "unterbrochen":
        return <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />;
      case "nicht erledigt":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const handleOptionClick = (index: number, e: React.MouseEvent) => {
    const now = Date.now();
    const currentClicks = clickCounts[index];
    
    if (!currentClicks || now - currentClicks.timestamp > 2000) {
      // First click or more than 2 seconds passed - reset count
      setClickCounts(prev => ({ ...prev, [index]: { count: 1, timestamp: now } }));
    } else {
      const newCount = currentClicks.count + 1;
      if (newCount >= 3) {
        // Triple click achieved - set as correct answer
        setMcCorrectAnswer(index);
        // Reset click count
        setClickCounts(prev => ({ ...prev, [index]: { count: 0, timestamp: now } }));
      } else {
        // Increment click count
        setClickCounts(prev => ({ ...prev, [index]: { count: newCount, timestamp: now } }));
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, questionId: string) => {
    setDraggedQuestion(questionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, questionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverQuestion(questionId);
  };

  const handleDragLeave = () => {
    setDragOverQuestion(null);
  };

  const handleDrop = (e: React.DragEvent, targetQuestionId: string) => {
    e.preventDefault();
    
    if (!draggedQuestion || draggedQuestion === targetQuestionId) {
      setDraggedQuestion(null);
      setDragOverQuestion(null);
      return;
    }

    setQuizQuestions(prev => {
      const draggedIndex = prev.findIndex(q => q.id === draggedQuestion);
      const targetIndex = prev.findIndex(q => q.id === targetQuestionId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      
      const newQuestions = [...prev];
      const [draggedItem] = newQuestions.splice(draggedIndex, 1);
      newQuestions.splice(targetIndex, 0, draggedItem);
      
      // Update positions
      return newQuestions.map((question, index) => ({
        ...question,
        position: index + 1
      }));
    });

    setDraggedQuestion(null);
    setDragOverQuestion(null);
  };

  const handleDragEnd = () => {
    setDraggedQuestion(null);
    setDragOverQuestion(null);
  };

  const handleEditQuestion = (questionId: string) => {
    const question = quizQuestions.find(q => q.id === questionId);
    if (question) {
      setEditingQuestion(questionId);
      setEditedQuestionText(question.question || '');
      
      if (question.type === 'multiple-choice') {
        setEditedOptions(question.options || []);
      } else if (question.type === 'eddies-frage') {
        setEditedCorrectAnswers(question.correctAnswers || '');
        setEditedWrongAnswers(question.wrongAnswers || '');
      }
    }
  };

  const handleSaveEdit = (questionId: string) => {
    setQuizQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        if (q.type === 'multiple-choice') {
          return { ...q, question: editedQuestionText, options: editedOptions };
        } else if (q.type === 'eddies-frage') {
          return { ...q, question: editedQuestionText, correctAnswers: editedCorrectAnswers, wrongAnswers: editedWrongAnswers };
        }
      }
      return q;
    }));
    setEditingQuestion(null);
    setEditedOptions([]);
    setEditedQuestionText('');
    setEditedCorrectAnswers('');
    setEditedWrongAnswers('');
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditedOptions([]);
    setEditedQuestionText('');
    setEditedCorrectAnswers('');
    setEditedWrongAnswers('');
  };

  const handleCompleteComponent = () => {
    const currentComponent = selectedComponents[currentComponentIndex];
    
    // Update component with form data
    setSelectedComponents(prev => prev.map((comp, index) => {
      if (index === currentComponentIndex) {
        if (comp.type === 'video') {
          // For videos, duration would be automatically detected from video file
          // For now, we'll use a default of 8 minutes as placeholder
          return { ...comp, formData: { ...videoFormData, duration: 8 } };
        } else if (comp.type === 'pdf') {
          return { ...comp, formData: pdfFormData };
        } else if (comp.type === 'quiz') {
          // Calculate quiz duration automatically
          let quizDuration = 0;
          quizQuestions.forEach(question => {
            if (question.type === 'multiple-choice') {
              quizDuration += 0.5; // 30 seconds per multiple choice
            } else if (question.type === 'eddies-frage') {
              quizDuration += 0.75; // 45 seconds per Eddie's question
            }
          });
          return { ...comp, formData: { questions: quizQuestions, duration: Math.ceil(quizDuration) } };
        }
      }
      return comp;
    }));
    
    setCompletedComponents(prev => [...prev, currentComponent.id]);
    
    // Check if there are more components to complete
    if (currentComponentIndex + 1 < selectedComponents.length) {
      // Move to next component
      const nextComponentIndex = currentComponentIndex + 1;
      const nextComponent = selectedComponents[nextComponentIndex];
      setCurrentComponentIndex(nextComponentIndex);
      
      // Navigate to the appropriate setup step
      if (nextComponent.type === 'video') {
        setCurrentStep('video-setup');
      } else if (nextComponent.type === 'pdf') {
        setCurrentStep('pdf-setup');
      } else if (nextComponent.type === 'quiz') {
        setCurrentStep('quiz-setup');
      }
      
      // Reset quiz state for new component
      setQuizQuestions([]);
      
      // Clear form data for new component
      setVideoFormData({ transcript: '', title: '', description: '', duration: 0 });
      setPdfFormData({ title: '', description: '', duration: 0 });
    } else {
      // All components completed, go to finalization step
      setCurrentStep('schulung-finalize');
    }
  };

  // Promotor selection helper functions
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

  // Calculate total duration of schulung
  const calculateTotalDuration = (components: any[]) => {
    let totalMinutes = 0;
    components.forEach(component => {
      if (component.formData?.duration) {
        totalMinutes += component.formData.duration;
      }
    });
    return totalMinutes;
  };

  const selectAllFiltered = () => {
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

  // Helper functions for assign promotor dropdown
  const selectAllFilteredAssign = () => {
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

    const filteredNames = allPromotors
      .filter(promotor => 
        (assignActiveRegionFilter === "all" || promotor.region === assignActiveRegionFilter) &&
        promotor.name.toLowerCase().includes(assignPromotorSearch.toLowerCase())
      )
      .map(promotor => promotor.name);
    
    // Check if we should deselect (if all filtered items are currently selected and match last selection)
    const allFilteredSelected = filteredNames.every(name => assignSelectedPromotors.includes(name));
    const matchesLastSelection = lastAssignSelectedByIcon.length > 0 && 
      filteredNames.every(name => lastAssignSelectedByIcon.includes(name)) &&
      lastAssignSelectedByIcon.every(name => filteredNames.includes(name));
    
    if (allFilteredSelected && matchesLastSelection) {
      // Deselect the ones that were selected by this icon
      setAssignSelectedPromotors(prev => prev.filter(name => !lastAssignSelectedByIcon.includes(name)));
      setLastAssignSelectedByIcon([]);
    } else {
      // Select all filtered
      setAssignSelectedPromotors(prev => [...new Set([...prev, ...filteredNames])]);
      setLastAssignSelectedByIcon(filteredNames);
    }
  };

    const handleFinalizeSchulung = () => {
    // Create new schulung object
    const newSchulung = {
      id: `schulung_${Date.now()}`,
      title: schulungData.title,
      description: schulungData.description,
      components: selectedComponents,
      promotors: selectedPromotors,
      createdAt: new Date()
    };

    // Add to created schulungen list
    setCreatedSchulungen(prev => [...prev, newSchulung]);
    
    // Close modal and reset all state
    setShowCreateModal(false);
    setSelectedComponents([]);
    setCurrentStep('selection');
    setCompletedComponents([]);
    setCurrentComponentIndex(0);
    setQuizQuestions([]);
    setVideoFormData({ transcript: '', title: '', description: '', duration: 0 });
    setPdfFormData({ title: '', description: '', duration: 0 });
    setQuizFormData({ duration: 0 });
    setSchulungData({ title: '', description: '' });
    setSelectedPromotors([]);
    setActiveRegionFilter("all");
    setPromotorSelectionSearch("");
    setLastSelectedByIcon([]);
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Custom CSS for 3D flip and wobble animation */}
      <style jsx>{flipStyles}</style>
      <style jsx>{`
        @keyframes wobble {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-8deg); }
          40% { transform: rotate(8deg); }
          60% { transform: rotate(-6deg); }
          80% { transform: rotate(6deg); }
        }
        
        .wobble {
          animation: wobble 0.5s ease-in-out;
        }
      `}</style>
      
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
            
            {/* Menu Buttons and Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Menu Buttons */}
              <button 
                onClick={() => setActiveSection("schulungen")}
                className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-lg transition-all duration-200 ${
                  activeSection === "schulungen" 
                    ? 'bg-gray-100 text-gray-900 border-gray-300 scale-[1.02] shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Schulungen</span>
              </button>
              <button 
                onClick={() => setActiveSection("videos")}
                className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-lg transition-all duration-200 ${
                  activeSection === "videos" 
                    ? 'bg-gray-100 text-gray-900 border-gray-300 scale-[1.02] shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Video className="h-4 w-4" />
                <span>Videos</span>
              </button>
              
              {/* Vertical Divider */}
              <div className="h-8 w-px bg-gray-300 opacity-60 mx-3"></div>
              
              <button className="p-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {activeSection === "schulungen" && (
            <>
              {/* Search Bar */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Schulung suchen..."
                  value={schulungSearch}
                  onChange={(e) => setSchulungSearch(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-200 bg-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-gray-200"
                />
              </div>

              <div className="flex flex-wrap gap-6">
            {/* Add New Card */}
            <div 
              onClick={() => setShowCreateModal(true)}
              className="w-48 h-48 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 flex flex-col"
              style={{boxShadow: '0 2px 6px rgba(34, 197, 94, 0.18)'}}
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

            {/* Created Schulungen */}
            {createdSchulungen
              .filter((schulung) => 
                schulung.title.toLowerCase().includes(schulungSearch.toLowerCase()) ||
                schulung.description.toLowerCase().includes(schulungSearch.toLowerCase())
              )
              .map((schulung) => (
              <div 
                key={schulung.id}
                className="w-48 h-48 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col cursor-pointer"
                style={{boxShadow: '0 2px 6px rgba(34, 197, 94, 0.18)'}}
                onClick={() => handleSchulungClick(schulung)}
              >
                {/* Header */}
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-800 tracking-tight truncate">{schulung.title}</h3>
                </div>
                
                {/* Description Container */}
                <div className="flex-1 mb-1 -mx-4">
                  <div className="w-full h-full bg-gray-100 border-t border-b border-gray-200 flex items-start justify-start overflow-hidden">
                    <div className="px-4 py-1">
                      <p className="text-sm text-gray-700 text-left leading-relaxed line-clamp-3 overflow-hidden">{schulung.description}</p>
                    </div>
                  </div>
                </div>
                
                {/* Component Icons and Completion Indicator */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-1">
                    {schulung.components.slice(0, 3).map((component, index) => {
                      const getIcon = () => {
                        switch (component.type) {
                          case 'video':
                            return <Video className="h-4 w-4 text-gray-300" />;
                          case 'pdf':
                            return <FileText className="h-4 w-4 text-gray-300" />;
                          case 'quiz':
                            return <HelpCircle className="h-4 w-4 text-gray-300" />;
                        }
                      };
                      
                      return (
                        <div key={`${component.id}-${index}`}>
                          {getIcon()}
                        </div>
                      );
                    })}
                    {schulung.components.length > 3 && (
                      <span className="text-sm text-gray-300 ml-1">...</span>
                    )}
                  </div>
                  
                  {/* Duration and Completion Indicator */}
                  <div className="flex items-center space-x-3">
                    {/* Duration */}
                    {(() => {
                      const totalMinutes = calculateTotalDuration(schulung.components);
                      if (totalMinutes > 0) {
                        return (
                          <div className="text-xs text-gray-500" style={{opacity: 0.7}}>
                            {totalMinutes} Min
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                    {/* Completion Indicator */}
                    <div className="text-xs text-gray-600" style={{opacity: 0.5}}>
                      {(() => {
                        const completedCount = schulung.promotors.filter((promotorName: string) => 
                          getPromotorCompletionStatus(promotorName, schulung.id) === 'erledigt'
                        ).length;
                        return `${completedCount}/${schulung.promotors.length}`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
            </>
          )}

          {activeSection === "videos" && (
            <>
              {/* Search Bar */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Video suchen..."
                  value={videosSearch}
                  onChange={(e) => setVideosSearch(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-200 bg-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-gray-200"
                />
              </div>

              {/* Videos List */}
              <div className="grid grid-cols-4 gap-4">
                {filteredVideos.length > 0 ? (
                  filteredVideos.map((video) => (
                    <div key={video.id} className="relative h-80 preserve-3d" style={{ perspective: '1000px' }}>
                      {/* Flip Container */}
                      <div 
                        className={`relative w-full h-full transition-transform duration-700 preserve-3d ${
                          flippedVideoId === video.id ? 'rotate-y-180' : ''
                        }`}
                        style={{ 
                          transformStyle: 'preserve-3d',
                          transform: flippedVideoId === video.id ? 'rotateY(180deg)' : 'rotateY(0deg)'
                        }}
                      >
                        {/* Front Side */}
                        <div 
                          className="absolute inset-0 w-full h-full backface-hidden bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          {/* Video Thumbnail */}
                          <div className="relative aspect-video bg-gray-200 flex-shrink-0 group">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                            {/* Duration Badge */}
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                              {video.duration}
                            </div>
                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Play className="h-12 w-12 text-white ml-0.5" />
                            </div>
                            
                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVideoDelete(video.id);
                              }}
                              className={`absolute top-2 right-2 text-black opacity-0 group-hover:opacity-100 transition-opacity ${
                                deleteConfirmVideoId === video.id ? 'wobble' : ''
                              }`}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M5 6v14a2 2 0 002 2h10a2 2 0 002-2V6M10 11v6M14 11v6" />
                              </svg>
                            </button>
                          </div>

                          {/* Video Info - Clickable Footer */}
                          <div 
                            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleVideoCardFlip(video.id)}
                          >
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                              {video.title}
                            </h3>
                            
                            {/* Stats Row */}
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center space-x-4">
                                {/* Views */}
                                <div className="flex items-center space-x-1">
                                  <Eye className="h-4 w-4" />
                                  <span>{video.views.toLocaleString()}</span>
                                </div>
                                
                                {/* Likes */}
                                <div className="flex items-center space-x-1">
                                  <ThumbsUp className="h-4 w-4" />
                                  <span>{video.likes}</span>
                                </div>
                                
                                {/* Dislikes */}
                                <div className="flex items-center space-x-1">
                                  <ThumbsDown className="h-4 w-4" />
                                  <span>{video.dislikes}</span>
                                </div>
                              </div>
                              
                              {/* Upload Date */}
                              <span className="text-xs">
                                {video.uploadDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Back Side */}
                        <div 
                          className={`absolute inset-0 w-full h-full bg-white border rounded-lg shadow-sm overflow-hidden cursor-pointer ${
                            editingVideoId === video.id ? 'border-green-500' : 'border-gray-200'
                          }`}
                          style={{ 
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            ...(editingVideoId === video.id ? {
                              boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)'
                            } : {})
                          }}
                          onClick={(e) => {
                            // Only flip back if not in edit mode and not clicking on edit controls
                            if (editingVideoId !== video.id && 
                                e.target instanceof Element &&
                                !e.target.closest('button') && 
                                !e.target.closest('input') && 
                                !e.target.closest('textarea')) {
                              handleVideoCardFlip(video.id);
                            }
                          }}
                        >
                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              if (editingVideoId === video.id) {
                                handleVideoSave(video.id);
                              } else {
                                handleVideoEdit(video.id);
                              }
                            }}
                            className="absolute top-3 right-3 z-10 text-gray-600 hover:text-gray-800 transition-colors opacity-50 hover:opacity-100"
                          >
                            {editingVideoId === video.id ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <Edit className="h-5 w-5" />
                            )}
                          </button>

                          {/* Back Content */}
                          <div className="p-4 h-full flex flex-col">
                            {/* Title */}
                            <div className="mb-3">
                              <h3 
                                className="text-sm font-semibold text-gray-900 line-clamp-2 outline-none"
                                contentEditable={editingVideoId === video.id}
                                suppressContentEditableWarning={true}
                                onBlur={(e) => {
                                  if (editingVideoId === video.id) {
                                    setEditedVideoTitle(e.currentTarget.textContent || '');
                                  }
                                }}
                              >
                                {editingVideoId === video.id ? editedVideoTitle : video.title}
                              </h3>
                              <div className="w-full h-px bg-gray-200 mt-3"></div>
                            </div>

                            {/* Transcript */}
                            <div className="flex-1 overflow-hidden">
                              <h4 className="text-xs font-medium text-gray-700 mb-2">Transkript:</h4>
                              <div 
                                className="h-full overflow-y-auto text-xs text-gray-600 leading-relaxed pr-1 outline-none [&::-webkit-scrollbar]:hidden"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                contentEditable={editingVideoId === video.id}
                                suppressContentEditableWarning={true}
                                onBlur={(e) => {
                                  if (editingVideoId === video.id) {
                                    setEditedVideoTranscript(e.currentTarget.textContent || '');
                                  }
                                }}
                              >
                                {editingVideoId === video.id ? editedVideoTranscript : video.transcript}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Keine Videos gefunden
                    </h3>
                    <p className="text-sm text-gray-600">
                      Versuchen Sie einen anderen Suchbegriff
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
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
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Video className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">Video einrichten</h3>
                    </div>
                    <div className="text-sm text-gray-500">
                      Schritt {currentComponentIndex + 1} von {selectedComponents.length}
                    </div>
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

                  {/* Video Title */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Videotitel</label>
                    <input
                      type="text"
                      placeholder="z.B. Verkaufstechniken Grundlagen"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none"
                      value={videoFormData.title}
                      onChange={(e) => setVideoFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  {/* Video Description */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Beschreibung</label>
                    <textarea
                      placeholder="Beschreibe kurz den Inhalt des Videos..."
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none [&::-webkit-scrollbar]:hidden"
                      style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                      value={videoFormData.description}
                      onChange={(e) => setVideoFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  {/* Transcript */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Transkript (optional)</label>
                    <textarea
                      placeholder="Füge hier das Transkript des Videos ein..."
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none [&::-webkit-scrollbar]:hidden"
                      style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                      value={videoFormData.transcript}
                      onChange={(e) => setVideoFormData(prev => ({ ...prev, transcript: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">Das Transkript hilft bei der Suche und Barrierefreiheit</p>
                  </div>
                </div>
              ) : currentStep === 'pdf-setup' ? (
                /* PDF Setup Step */
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}>
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">PDF Dokument einrichten</h3>
                    </div>
                    <div className="text-sm text-gray-500">
                      Schritt {currentComponentIndex + 1} von {selectedComponents.length}
                    </div>
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
                      value={pdfFormData.title}
                      onChange={(e) => setPdfFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Beschreibung (optional)</label>
                    <textarea
                      placeholder="Beschreibe kurz den Inhalt dieses Dokuments..."
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none [&::-webkit-scrollbar]:hidden"
                      style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                      value={pdfFormData.description}
                      onChange={(e) => setPdfFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Dauer (Minuten)</label>
                    <input
                      type="number"
                      placeholder="z.B. 15"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none"
                      value={pdfFormData.duration || ''}
                      onChange={(e) => setPdfFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Geschätzte Lesedauer in Minuten</p>
                  </div>
                </div>
              ) : currentStep === 'schulung-finalize' ? (
                /* Schulung Finalization Step */
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}>
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">Schulung abschließen</h3>
                    </div>
                    <div className="text-sm text-gray-500">
                      Letzter Schritt
                    </div>
                  </div>

                  {/* Schulung Title */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Schulungstitel</label>
                    <input
                      type="text"
                      placeholder="z.B. Verkaufstraining Komplett"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none"
                      value={schulungData.title}
                      onChange={(e) => setSchulungData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  {/* Schulung Description */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Beschreibung</label>
                    <textarea
                      placeholder="Beschreibe kurz den Inhalt und die Ziele dieser Schulung..."
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none [&::-webkit-scrollbar]:hidden"
                      style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                      value={schulungData.description}
                      onChange={(e) => setSchulungData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  {/* Promotor Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Promotoren auswählen</label>
                    
                    {/* Search and Filter Options */}
                    <div className="space-y-3 mb-4">
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

                    {/* Promotor Grid */}
                    <div className="max-h-64 overflow-auto [&::-webkit-scrollbar]:hidden p-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-2">
                        {[
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
                        ]
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

                    {/* Selected Promotors Count */}
                    {selectedPromotors.length > 0 && (
                      <div className="mt-3 text-sm text-gray-600">
                        {selectedPromotors.length} Promotor{selectedPromotors.length !== 1 ? 'en' : ''} ausgewählt
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Quiz Setup Step */
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <HelpCircle className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">Quiz erstellen</h3>
                    </div>
                    <div className="text-sm text-gray-500">
                      Schritt {currentComponentIndex + 1} von {selectedComponents.length}
                    </div>
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
                        <div className="text-center py-8 px-4">
                          <div className="mb-4">
                            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                              <HelpCircle className="h-6 w-6 text-purple-400" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Wähle einen Fragentyp</p>
                          <p className="text-xs text-gray-500">um eine neue Frage zu erstellen</p>
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
                                  
                                  if (questionInput.value.trim()) {
                                    // Filter out empty options and track original indices
                                    const filledOptions: string[] = [];
                                    const originalIndices: number[] = [];
                                    
                                    optionInputs.forEach((input, index) => {
                                      if (input.value.trim()) {
                                        filledOptions.push(input.value.trim());
                                        originalIndices.push(index);
                                      }
                                    });
                                    
                                    // Only save if we have at least 2 valid options
                                    if (filledOptions.length >= 2) {
                                      // Find the new index for the correct answer
                                      const newCorrectAnswer = originalIndices.indexOf(mcCorrectAnswer);
                                      
                                      const newQuestion = {
                                        id: `mc_${Date.now()}`,
                                        type: 'multiple-choice' as const,
                                        question: questionInput.value.trim(),
                                        options: filledOptions,
                                        correctAnswer: newCorrectAnswer >= 0 ? newCorrectAnswer : 0,
                                        position: quizQuestions.length + 1
                                      };
                                      setQuizQuestions(prev => [...prev, newQuestion]);
                                      
                                      // Clear form
                                      questionInput.value = '';
                                      optionInputs.forEach(input => input.value = '');
                                      setMcCorrectAnswer(0);
                                      setMcOptionsCount(4);
                                      setShowQuestionForm(null);
                                    }
                                  }
                                }}
                                className="text-green-600 hover:text-green-700 transition-colors"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setMcOptionsCount(4);
                                  setMcCorrectAnswer(0);
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
                                <input
                                  key={index}
                                  type="text"
                                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                  className={`w-full p-1.5 border rounded outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none text-xs transition-all duration-200 ${
                                    mcCorrectAnswer === index
                                      ? 'bg-green-50/80 border-green-300/70 shadow-sm shadow-green-200/50 focus:bg-green-50/80 focus:border-green-300/70'
                                      : 'border-gray-300 hover:border-gray-400 focus:border-gray-300'
                                  }`}
                                  id={`mc-option-${index}`}
                                  onClick={(e) => handleOptionClick(index, e)}
                                />
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
                                className="w-full h-18 p-2 border rounded resize-none focus:outline-none text-xs [&::-webkit-scrollbar]:hidden bg-green-50/60 border-green-300/50 shadow-sm shadow-green-200/50"
                                style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                                id="eddie-correct"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700 mb-1 block">Falsche Antworten</label>
                              <textarea
                                placeholder="Beschreibe was als falsche Antwort gilt..."
                                className="w-full h-18 p-2 border rounded resize-none focus:outline-none text-xs [&::-webkit-scrollbar]:hidden bg-rose-50/60 border-rose-300/50 shadow-sm shadow-rose-200/50"
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
                            draggable
                            onDragStart={(e) => handleDragStart(e, question.id)}
                            onDragOver={(e) => handleDragOver(e, question.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, question.id)}
                            onDragEnd={handleDragEnd}
                            className={`border rounded-lg transition-colors hover:bg-gray-50 ${
                              draggedQuestion === question.id ? 'opacity-50' : ''
                            } ${
                              dragOverQuestion === question.id ? 'border-purple-400 bg-purple-50' : ''
                            }`}
                            style={{
                              background: dragOverQuestion === question.id 
                                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))'
                                : 'linear-gradient(135deg, rgba(168, 85, 247, 0.03), rgba(236, 72, 153, 0.03))',
                              borderColor: dragOverQuestion === question.id 
                                ? 'rgba(168, 85, 247, 0.3)'
                                : 'rgba(168, 85, 247, 0.1)'
                            }}
                          >
                            {/* Collapsed Row */}
                            <div 
                              className="p-3 cursor-pointer flex items-center justify-between"
                              onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
                            >
                              <div className="flex items-center space-x-3">
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
                                    if (editingQuestion === question.id) {
                                      handleSaveEdit(question.id);
                                    } else {
                                      handleEditQuestion(question.id);
                                    }
                                  }}
                                  className={`transition-colors ${
                                    editingQuestion === question.id 
                                      ? 'text-green-500 hover:text-green-600' 
                                      : 'text-gray-400 hover:text-gray-600'
                                  }`}
                                >
                                  {editingQuestion === question.id ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Edit className="h-4 w-4" />
                                  )}
                                </button>
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
                              </div>
                            </div>
                            
                            {/* Expanded Content */}
                            {expandedQuestion === question.id && (
                              <div className="px-6 pb-4 border-t border-gray-200">
                                {question.type === 'multiple-choice' ? (
                                  <div className="space-y-3 mt-3">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 block mb-1">Frage</label>
                                      {editingQuestion === question.id ? (
                                        <input
                                          type="text"
                                          value={editedQuestionText}
                                          onChange={(e) => setEditedQuestionText(e.target.value)}
                                          className="w-full text-sm text-gray-900 p-3 bg-gray-50/50 border border-gray-200/50 rounded-lg outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none"
                                          placeholder="Frage eingeben..."
                                        />
                                      ) : (
                                        <div className="text-sm text-gray-900 p-3 bg-gray-50/50 border border-gray-200/50 rounded-lg">{question.question}</div>
                                      )}
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 block mb-1">Antwortoptionen</label>
                                      {editingQuestion === question.id ? (
                                        <div className="space-y-2">
                                          <div className="grid grid-cols-2 gap-2">
                                            {editedOptions.map((option, optionIndex) => (
                                              <input
                                                key={optionIndex}
                                                type="text"
                                                value={option}
                                                onChange={(e) => {
                                                  const newOptions = [...editedOptions];
                                                  newOptions[optionIndex] = e.target.value;
                                                  setEditedOptions(newOptions);
                                                }}
                                                className={`text-sm p-2 rounded border transition-all duration-200 break-words outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none ${
                                                  question.correctAnswer === optionIndex 
                                                    ? 'bg-green-50/20 border-green-300/20 text-green-800 font-medium shadow-sm shadow-green-200/50' 
                                                    : 'bg-rose-50/20 border-rose-300/20 text-red-600 shadow-sm shadow-rose-200/50'
                                                }`}
                                                placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                              />
                                            ))}
                                          </div>

                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                          {question.options?.map((option, optionIndex) => (
                                            <div key={optionIndex} className={`text-sm p-2 rounded border transition-all duration-200 break-words ${
                                              question.correctAnswer === optionIndex 
                                                ? 'bg-green-50/20 border-green-300/20 text-green-800 font-medium shadow-sm shadow-green-200/50' 
                                                : 'bg-rose-50/20 border-rose-300/20 text-red-600 shadow-sm shadow-rose-200/50'
                                            }`}>
                                              {String.fromCharCode(65 + optionIndex)}: {option || 'Keine Option eingegeben'}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3 mt-3">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 block mb-1">Frage</label>
                                      {editingQuestion === question.id ? (
                                        <input
                                          type="text"
                                          value={editedQuestionText}
                                          onChange={(e) => setEditedQuestionText(e.target.value)}
                                          className="w-full text-sm text-gray-900 p-3 bg-gray-50/50 border border-gray-200/50 rounded-lg outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none"
                                          placeholder="Frage eingeben..."
                                        />
                                      ) : (
                                        <div className="text-sm text-gray-900 p-3 bg-gray-50/50 border border-gray-200/50 rounded-lg">{question.question}</div>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-xs font-medium text-gray-700 mb-1 block">Richtige Antworten</label>
                                        {editingQuestion === question.id ? (
                                          <textarea
                                            value={editedCorrectAnswers}
                                            onChange={(e) => setEditedCorrectAnswers(e.target.value)}
                                            className="w-full text-sm p-2 rounded border transition-all duration-200 break-words outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none bg-green-50/20 border-green-300/20 shadow-sm shadow-green-200/50 resize-none h-24 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                                            style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                                            placeholder="Beschreibe was als richtige Antwort gilt..."
                                          />
                                        ) : (
                                          <div className="text-sm p-2 rounded border transition-all duration-200 break-words bg-green-50/20 border-green-300/20 text-green-800 font-medium shadow-sm shadow-green-200/50 max-h-24 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                                            {question.correctAnswers || 'Nicht definiert'}
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-gray-700 mb-1 block">Falsche Antworten</label>
                                        {editingQuestion === question.id ? (
                                          <textarea
                                            value={editedWrongAnswers}
                                            onChange={(e) => setEditedWrongAnswers(e.target.value)}
                                            className="w-full text-sm p-2 rounded border transition-all duration-200 break-words outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none bg-rose-50/20 border-rose-300/20 shadow-sm shadow-rose-200/50 resize-none h-24 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                                            style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                                            placeholder="Beschreibe was als falsche Antwort gilt..."
                                          />
                                        ) : (
                                          <div className="text-sm p-2 rounded border transition-all duration-200 break-words bg-rose-50/20 border-rose-300/20 text-red-600 shadow-sm shadow-rose-200/50 max-h-24 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                                            {question.wrongAnswers || 'Nicht definiert'}
                                          </div>
                                        )}
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
              {currentStep === 'schulung-finalize' && (
                <button
                  onClick={() => {
                    // Go back to the last component step
                    const lastComponent = selectedComponents[selectedComponents.length - 1];
                    if (lastComponent.type === 'video') {
                      setCurrentStep('video-setup');
                    } else if (lastComponent.type === 'pdf') {
                      setCurrentStep('pdf-setup');
                    } else if (lastComponent.type === 'quiz') {
                      setCurrentStep('quiz-setup');
                    }
                    setCurrentComponentIndex(selectedComponents.length - 1);
                  }}
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
                    setCompletedComponents([]);
                    setCurrentComponentIndex(0);
                    setQuizQuestions([]);
                    setVideoFormData({ transcript: '', title: '', description: '', duration: 0 });
                    setPdfFormData({ title: '', description: '', duration: 0 });
                    setQuizFormData({ duration: 0 });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                {currentStep === 'selection' ? (
                  <button
                    disabled={selectedComponents.length === 0}
                    onClick={() => {
                      // Reset state and start with first component
                      setCurrentComponentIndex(0);
                      setCompletedComponents([]);
                      setVideoFormData({ transcript: '', title: '', description: '', duration: 0 });
                      setPdfFormData({ title: '', description: '', duration: 0 });
                      setQuizFormData({ duration: 0 });
                      setSchulungData({ title: '', description: '' });
                      setSelectedPromotors([]);
                      setActiveRegionFilter("all");
                      setPromotorSelectionSearch("");
                      setLastSelectedByIcon([]);
                      
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
                    onClick={handleCompleteComponent}
                    className="px-4 py-2 text-white rounded-lg transition-colors"
                    style={{background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.85), rgba(79, 70, 229, 0.85))'}}
                  >
                    {currentComponentIndex + 1 < selectedComponents.length ? 'Video speichern & weiter' : 'Video speichern & abschließen'}
                  </button>
                ) : currentStep === 'pdf-setup' ? (
                  <button
                    onClick={handleCompleteComponent}
                    className="px-4 py-2 text-white rounded-lg transition-colors"
                    style={{background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.85), rgba(16, 95, 45, 0.85))'}}
                  >
                    {currentComponentIndex + 1 < selectedComponents.length ? 'PDF speichern & weiter' : 'PDF speichern & abschließen'}
                  </button>
                ) : currentStep === 'schulung-finalize' ? (
                  <button
                    onClick={handleFinalizeSchulung}
                    disabled={!schulungData.title.trim() || selectedPromotors.length === 0}
                    className="px-4 py-2 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    style={{background: schulungData.title.trim() && selectedPromotors.length > 0 ? 'linear-gradient(135deg, #22C55E, #105F2D)' : undefined}}
                  >
                    Schulung erstellen & versenden
                  </button>
                ) : (
                  <button
                    onClick={handleCompleteComponent}
                    className="px-4 py-2 text-white rounded-lg transition-colors"
                    style={{background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.85), rgba(236, 72, 153, 0.85))'}}
                  >
                    {currentComponentIndex + 1 < selectedComponents.length ? 'Quiz speichern & weiter' : 'Quiz speichern & abschließen'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Promotor Detailed View Modal */}
      {showPromotorDetails && selectedPromotor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl mx-4 max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setShowPromotorDetails(false);
                    setShowSchulungDetails(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedPromotor.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">Detailansicht - {selectedPromotor.schulung.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPromotorDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

                        {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Individual Component Progress Sections */}
              {selectedPromotor.schulung.components.map((component: any, index: number) => {
                const componentProgress = selectedPromotor.progress?.[component.id];
                if (!componentProgress) return null;

                if (component.type === 'video') {
                  return (
                    <div key={component.id} className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Video className="h-5 w-5 mr-2 text-blue-500" />
                        Video Fortschritt {selectedPromotor.schulung.components.filter((c: any) => c.type === 'video').length > 1 ? `${selectedPromotor.schulung.components.filter((c: any, i: number) => i <= index && c.type === 'video').length}` : ''}
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Angesehen</span>
                          <span className={`text-sm font-semibold ${
                            componentProgress.watchedPercentage >= 85 
                              ? 'text-green-500' 
                              : componentProgress.watchedPercentage >= 50 
                              ? 'text-orange-500' 
                              : 'text-red-500'
                          }`}>{componentProgress.watchedPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              componentProgress.watchedPercentage >= 85 
                                ? 'bg-green-500' 
                                : componentProgress.watchedPercentage >= 50 
                                ? 'bg-orange-500' 
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${componentProgress.watchedPercentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Status: {componentProgress.completed ? 'Vollständig angesehen' : 'In Bearbeitung'}
                        </p>
                      </div>
                    </div>
                  );
                }

                if (component.type === 'quiz') {
                  return (
                    <div key={component.id} className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <HelpCircle className="h-5 w-5 mr-2 text-purple-500" />
                        Quiz Fortschritt {selectedPromotor.schulung.components.filter((c: any) => c.type === 'quiz').length > 1 ? `${selectedPromotor.schulung.components.filter((c: any, i: number) => i <= index && c.type === 'quiz').length}` : ''}
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="grid gap-3">
                          {Array.from({ length: componentProgress.totalQuestions }, (_, i) => (
                            <div key={i} className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-700 w-16">Frage {i + 1}:</span>
                              <div className="flex items-center space-x-2">
                                {componentProgress.attempts[i]?.length > 0 ? (
                                  (componentProgress.attempts[i] as Array<'correct' | 'incorrect'>).map((attempt, attemptIndex) => (
                                    <div
                                      key={attemptIndex}
                                      className={`w-2 h-2 rounded-full shadow-sm ${
                                        attempt === 'correct' 
                                          ? 'bg-green-600 shadow-green-600/30' 
                                          : 'bg-red-500 shadow-red-500/30'
                                      }`}
                                      title={`Versuch ${attemptIndex + 1}: ${attempt === 'correct' ? 'Richtig' : 'Falsch'}`}
                                    />
                                  ))
                                ) : (
                                  <div 
                                    className="w-2 h-2 rounded-full bg-gray-300 shadow-sm shadow-gray-300/30" 
                                    title="Noch nicht beantwortet" 
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Status: {componentProgress.completed ? 'Quiz abgeschlossen' : 'In Bearbeitung'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Richtige Antworten beim ersten Versuch: {
                              Object.values(componentProgress.attempts).filter((attempts: any) => 
                                attempts.length > 0 && attempts[0] === 'correct'
                              ).length
                            } von {componentProgress.totalQuestions}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (component.type === 'pdf') {
                  return (
                    <div key={component.id} className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-green-500" />
                        PDF Fortschritt {selectedPromotor.schulung.components.filter((c: any) => c.type === 'pdf').length > 1 ? `${selectedPromotor.schulung.components.filter((c: any, i: number) => i <= index && c.type === 'pdf').length}` : ''}
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {componentProgress.pagesRead} von {componentProgress.totalPages} Seiten
                          </span>
                          <span className="text-xs text-gray-500">
                            {componentProgress.completed ? 'Vollständig gelesen' : 'In Bearbeitung'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-0.5">
                          {Array.from({ length: componentProgress.totalPages }, (_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full shadow-sm ${
                                i < componentProgress.pagesRead 
                                  ? 'bg-green-600 shadow-green-600/30' 
                                  : 'bg-gray-300 shadow-gray-300/30'
                              }`}
                              title={`Seite ${i + 1}: ${i < componentProgress.pagesRead ? 'Gelesen' : 'Nicht gelesen'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })}

              {/* Summary Section */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">Gesamtfortschritt</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedPromotor.schulung.components.map((component: any, index: number) => {
                    const componentProgress = selectedPromotor.progress?.[component.id];
                    if (!componentProgress) return null;

                    const getIcon = () => {
                      switch (component.type) {
                        case 'video':
                          return (
                            <div 
                              className="h-8 w-8 rounded-lg flex items-center justify-center"
                              style={{
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(79, 70, 229, 0.5))'
                              }}
                            >
                              <Video className="h-4 w-4 text-white" />
                            </div>
                          );
                        case 'pdf':
                          return (
                            <div 
                              className="h-8 w-8 rounded-lg flex items-center justify-center"
                              style={{
                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.5), rgba(16, 95, 45, 0.5))'
                              }}
                            >
                              <FileText className="h-4 w-4 text-white" />
                            </div>
                          );
                        case 'quiz':
                          return (
                            <div 
                              className="h-8 w-8 rounded-lg flex items-center justify-center"
                              style={{
                                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.5), rgba(236, 72, 153, 0.5))'
                              }}
                            >
                              <HelpCircle className="h-4 w-4 text-white" />
                            </div>
                          );
                      }
                    };

                    const getLabel = () => {
                      const sameTypeCount = selectedPromotor.schulung.components.filter((c: any) => c.type === component.type).length;
                      if (sameTypeCount > 1) {
                        const currentTypeIndex = selectedPromotor.schulung.components.filter((c: any, i: number) => i <= index && c.type === component.type).length;
                        return `${component.type === 'video' ? 'Video' : component.type === 'pdf' ? 'PDF' : 'Quiz'} ${currentTypeIndex}`;
                      }
                      return component.type === 'video' ? 'Video' : component.type === 'pdf' ? 'PDF' : 'Quiz';
                    };

                    const getStatusIcon = () => {
                      if (componentProgress.completed) {
                        return (
                          <>
                            <Check className="h-3 w-3 text-green-500" />
                            <span>Abgeschlossen</span>
                          </>
                        );
                      }
                      
                      const hasProgress = component.type === 'video' 
                        ? componentProgress.watchedPercentage > 0
                        : component.type === 'pdf'
                        ? componentProgress.pagesRead > 0
                        : Object.values(componentProgress.attempts || {}).some((attempts: any) => attempts.length > 0);

                      if (hasProgress) {
                        return (
                          <>
                            <Loader2 className="h-3 w-3 text-orange-500 animate-spin" />
                            <span>In Bearbeitung</span>
                          </>
                        );
                      }

                      return (
                        <>
                          <X className="h-3 w-3 text-red-500" />
                          <span>Nicht gestartet</span>
                        </>
                      );
                    };

                    return (
                      <div key={component.id} className="flex items-center space-x-2">
                        {getIcon()}
                        <div>
                          <p className="text-xs font-medium text-gray-700">{getLabel()}</p>
                          <p className="text-xs text-gray-500 flex items-center space-x-1">
                            {getStatusIcon()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schulung Details Modal */}
      {showSchulungDetails && selectedSchulung && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedSchulung.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedSchulung.description}
                  {(() => {
                    const totalMinutes = calculateTotalDuration(selectedSchulung.components);
                    if (totalMinutes > 0) {
                      return ` • ${totalMinutes} Minuten`;
                    }
                    return '';
                  })()}
                </p>
              </div>
              <button
                onClick={() => setShowSchulungDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Components Section */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Schulungskomponenten</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedSchulung.components.map((component: any, index: number) => {
                    const getIcon = () => {
                      switch (component.type) {
                        case 'video':
                          return (
                            <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                              <Video className="h-5 w-5 text-white" />
                            </div>
                          );
                        case 'pdf':
                          return (
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)'}}>
                              <FileText className="h-5 w-5 text-white" />
                            </div>
                          );
                        case 'quiz':
                          return (
                            <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                              <HelpCircle className="h-5 w-5 text-white" />
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

                    const isExpanded = expandedComponent === component.id;

                    return (
                      <div key={component.id} className="border border-gray-200 rounded-lg overflow-visible relative">
                        {/* Component Header - Clickable */}
                        <div 
                          onClick={() => setExpandedComponent(isExpanded ? null : component.id)}
                          className="flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors relative z-10 bg-white rounded-lg"
                        >
                          {getIcon()}
                          <span className="font-medium text-gray-900">{getLabel()} {index + 1}</span>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="absolute top-full left-0 right-0 bg-gray-50 border border-gray-200 rounded-b-lg shadow-lg z-20 p-4">
                            {component.type === 'video' && (
                              <div className="space-y-3">
                                <div className="bg-gray-200 rounded-lg h-32 flex items-center justify-center">
                                  <Video className="h-8 w-8 text-gray-500" />
                                  <span className="ml-2 text-sm text-gray-600">Video Preview</span>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-1">{component.formData?.title || 'Unbenanntes Video'}</h4>
                                  <p className="text-sm text-gray-600 mb-2">{component.formData?.description || 'Keine Beschreibung verfügbar.'}</p>
                                  <div className="text-xs text-gray-500">
                                    <p className="mb-1"><strong>Dauer:</strong> {component.formData?.duration || 0} Minuten</p>
                                    <p><strong>Transkript verfügbar:</strong> {component.formData?.transcript ? 'Ja' : 'Nein'}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {component.type === 'pdf' && (
                              <div className="space-y-3">
                                <div className="bg-gray-200 rounded-lg h-32 flex items-center justify-center">
                                  <FileText className="h-8 w-8 text-gray-500" />
                                  <span className="ml-2 text-sm text-gray-600">PDF Preview</span>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-1">{component.formData?.title || 'Unbenanntes PDF'}</h4>
                                  <p className="text-sm text-gray-600 mb-2">{component.formData?.description || 'Keine Beschreibung verfügbar.'}</p>
                                  <div className="text-xs text-gray-500">
                                    <p className="mb-1"><strong>Seiten:</strong> 24</p>
                                    <p className="mb-1"><strong>Dauer:</strong> {component.formData?.duration || 0} Minuten</p>
                                    <p><strong>Dateigröße:</strong> 2.3 MB</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {component.type === 'quiz' && (
                              <div className="space-y-3">
                                <h4 className="font-medium text-gray-900">Quiz Fragen</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                                  {(component.formData?.questions || []).map((q: any, qIndex: number) => (
                                    <div key={qIndex} className="bg-white rounded border p-3">
                                      <p className="font-medium text-sm text-gray-900 mb-2 truncate">Frage {qIndex + 1}: {q.question}</p>
                                      {q.type === 'multiple-choice' ? (
                                        <div className="grid grid-cols-2 gap-1">
                                          {q.options?.map((option: string, oIndex: number) => (
                                            <div key={oIndex} className={`text-xs p-1.5 rounded truncate ${
                                              oIndex === q.correctAnswer 
                                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                                : 'bg-gray-50 text-gray-600'
                                            }`}>
                                              {String.fromCharCode(65 + oIndex)}: {option}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="bg-green-50 text-green-700 border border-green-200 text-xs p-1.5 rounded truncate">
                                            <strong>Richtig:</strong> {q.correctAnswers || 'Nicht definiert'}
                                          </div>
                                          <div className="bg-red-50 text-red-700 border border-red-200 text-xs p-1.5 rounded truncate">
                                            <strong>Falsch:</strong> {q.wrongAnswers || 'Nicht definiert'}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div className="text-xs text-gray-500">
                                  <p className="mb-1"><strong>Fragen insgesamt:</strong> {component.formData?.questions?.length || 0}</p>
                                  <p><strong>Dauer:</strong> {component.formData?.duration || 0} Minuten</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Promotors Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Promotoren Status</h3>
                  
                                    <div className="flex items-center space-x-3">
                    {/* Assign Additional Promotors Icon */}
                    <div className="relative">
                      <UserPlus 
                        onClick={() => setShowAssignPromotorDropdown(!showAssignPromotorDropdown)}
                        className="h-4 w-4 text-black opacity-50 cursor-pointer hover:opacity-75 transition-opacity"
                      />
                      
                      {/* Dropdown Menu */}
                      {showAssignPromotorDropdown && (
                        <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4">
                          <div className="space-y-3">
                            {/* Search */}
                            <input
                              type="text"
                              placeholder="Promotor suchen..."
                              value={assignPromotorSearch}
                              onChange={(e) => setAssignPromotorSearch(e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-0 placeholder-gray-400"
                            />
                            
                            {/* Filter Options */}
                            <div className="flex items-center justify-between">
                                                             <div className="flex gap-1">
                                 <button
                                   onClick={() => setAssignActiveRegionFilter("all")}
                                   className={`px-1.5 py-1 rounded text-xs font-medium transition-all duration-200 bg-gray-100/70 text-gray-700 hover:bg-gray-200/80 ${
                                     assignActiveRegionFilter === "all" ? "scale-110" : ""
                                   }`}
                                 >
                                   Alle
                                 </button>
                                 <button
                                   onClick={() => setAssignActiveRegionFilter("wien-noe-bgl")}
                                   className={`px-1.5 py-1 rounded text-xs font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("wien-noe-bgl")} ${getRegionBorder("wien-noe-bgl")} ${
                                     assignActiveRegionFilter === "wien-noe-bgl" ? "scale-110" : ""
                                   }`}
                                 >
                                   W/NÖ/BGL
                                 </button>
                                 <button
                                   onClick={() => setAssignActiveRegionFilter("steiermark")}
                                   className={`px-1.5 py-1 rounded text-xs font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("steiermark")} ${getRegionBorder("steiermark")} ${
                                     assignActiveRegionFilter === "steiermark" ? "scale-110" : ""
                                   }`}
                                 >
                                   ST
                                 </button>
                                 <button
                                   onClick={() => setAssignActiveRegionFilter("salzburg")}
                                   className={`px-1.5 py-1 rounded text-xs font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("salzburg")} ${getRegionBorder("salzburg")} ${
                                     assignActiveRegionFilter === "salzburg" ? "scale-110" : ""
                                   }`}
                                 >
                                   SBG
                                 </button>
                                 <button
                                   onClick={() => setAssignActiveRegionFilter("oberoesterreich")}
                                   className={`px-1.5 py-1 rounded text-xs font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("oberoesterreich")} ${getRegionBorder("oberoesterreich")} ${
                                     assignActiveRegionFilter === "oberoesterreich" ? "scale-110" : ""
                                   }`}
                                 >
                                   OÖ
                                 </button>
                                 <button
                                   onClick={() => setAssignActiveRegionFilter("tirol")}
                                   className={`px-1.5 py-1 rounded text-xs font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("tirol")} ${getRegionBorder("tirol")} ${
                                     assignActiveRegionFilter === "tirol" ? "scale-110" : ""
                                   }`}
                                 >
                                   T
                                 </button>
                                 <button
                                   onClick={() => setAssignActiveRegionFilter("vorarlberg")}
                                   className={`px-1.5 py-1 rounded text-xs font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("vorarlberg")} ${getRegionBorder("vorarlberg")} ${
                                     assignActiveRegionFilter === "vorarlberg" ? "scale-110" : ""
                                   }`}
                                 >
                                   V
                                 </button>
                                 <button
                                   onClick={() => setAssignActiveRegionFilter("kaernten")}
                                   className={`px-1.5 py-1 rounded text-xs font-medium transition-all duration-200 border text-gray-700 hover:bg-gray-200/80 ${getRegionGradient("kaernten")} ${getRegionBorder("kaernten")} ${
                                     assignActiveRegionFilter === "kaernten" ? "scale-110" : ""
                                   }`}
                                 >
                                   K
                                 </button>
                               </div>
                              
                              {/* Select All Filtered Icon */}
                              <div 
                                onClick={selectAllFilteredAssign}
                                className="cursor-pointer"
                                title="Alle gefilterten auswählen/abwählen"
                              >
                                <CheckSquare className="h-5 w-5 text-black hover:text-gray-700 transition-colors" />
                              </div>
                            </div>

                            {/* Promotor Grid */}
                            <div className="max-h-48 overflow-auto [&::-webkit-scrollbar]:hidden p-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                              <div className="grid grid-cols-3 gap-2 pb-2">
                                {[
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
                                ]
                                .filter(promotor => 
                                  (assignActiveRegionFilter === "all" || promotor.region === assignActiveRegionFilter) &&
                                  promotor.name.toLowerCase().includes(assignPromotorSearch.toLowerCase())
                                )
                                .map((promotor) => {
                                  const isSelected = assignSelectedPromotors.includes(promotor.name);
                                  return (
                                    <button
                                      key={promotor.name}
                                      onClick={() => {
                                        if (isSelected) {
                                          setAssignSelectedPromotors(prev => prev.filter(name => name !== promotor.name));
                                        } else {
                                          setAssignSelectedPromotors(prev => [...prev, promotor.name]);
                                        }
                                      }}
                                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 w-full h-8 flex items-center justify-center border ${
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

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                              <div className="text-xs text-gray-600">
                                {assignSelectedPromotors.length} Promotor{assignSelectedPromotors.length !== 1 ? 'en' : ''} ausgewählt
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setShowAssignPromotorDropdown(false)}
                                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                  Abbrechen
                                </button>
                                <button
                                  onClick={() => {
                                    // Add selected promotors to the schulung
                                    setCreatedSchulungen(prev => 
                                      prev.map(schulung => 
                                        schulung.id === selectedSchulung.id 
                                          ? { ...schulung, promotors: [...new Set([...schulung.promotors, ...assignSelectedPromotors])] }
                                          : schulung
                                      )
                                    );
                                    
                                    // Update the selected schulung state
                                    setSelectedSchulung((prev: any) => ({
                                      ...prev,
                                      promotors: [...new Set([...prev.promotors, ...assignSelectedPromotors])]
                                    }));
                                    
                                    setShowAssignPromotorDropdown(false);
                                  }}
                                  className="px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors"
                                  style={{background: 'linear-gradient(135deg, #22C55E, #105F2D)', opacity: 0.85}}
                                >
                                  Zuweisen
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Status Filter Menu */}
                    <div className="flex bg-gray-100 rounded-lg p-0.5 relative">
                      {/* Sliding Indicator - matches exact button hover areas */}
                      <div className={`absolute bg-white rounded-md shadow-sm transition-all duration-300 ease-in-out ${
                        selectedCompletionFilter === 'alle' 
                          ? 'top-0.5 bottom-0.5 left-0.5 right-[78px]' 
                          : selectedCompletionFilter === 'erledigt'
                          ? 'top-0.5 bottom-0.5 left-[42px] right-[52px]'
                          : selectedCompletionFilter === 'unterbrochen'
                          ? 'top-0.5 bottom-0.5 left-[68px] right-[26px]'
                          : 'top-0.5 bottom-0.5 left-[94px] right-0.5'
                      }`} />
                      
                      <button
                        onClick={() => setSelectedCompletionFilter('alle')}
                        className="relative z-10 py-1.5 px-2.5 rounded-md text-xs font-medium transition-all duration-200 text-gray-600 hover:text-gray-900"
                      >
                        Alle
                      </button>
                      <button
                        onClick={() => setSelectedCompletionFilter('erledigt')}
                        className="relative z-10 p-1.5 rounded-md transition-all duration-200 hover:bg-gray-50"
                      >
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      </button>
                      <button
                        onClick={() => setSelectedCompletionFilter('unterbrochen')}
                        className="relative z-10 p-1.5 rounded-md transition-all duration-200 hover:bg-gray-50"
                      >
                        <Loader2 className="h-3.5 w-3.5 text-orange-500 animate-spin" />
                      </button>
                      <button
                        onClick={() => setSelectedCompletionFilter('nicht erledigt')}
                        className="relative z-10 p-1.5 rounded-md transition-all duration-200 hover:bg-gray-50"
                      >
                        <X className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filtered Promotors Grid */}
                <div className="max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedSchulung.promotors
                      .filter((promotorName: string) => {
                        if (selectedCompletionFilter === 'alle') return true;
                        const status = getPromotorCompletionStatus(promotorName, selectedSchulung.id);
                        return status === selectedCompletionFilter;
                      })
                      .map((promotorName: string) => {
                        const status = getPromotorCompletionStatus(promotorName, selectedSchulung.id);
                        
                        return (
                          <div 
                            key={promotorName} 
                            className={`flex items-center justify-between p-3 border border-gray-200 rounded-lg transition-colors ${
                              status === 'unterbrochen' || status === 'erledigt' 
                                ? 'cursor-pointer hover:bg-gray-50' 
                                : 'cursor-default'
                            }`}
                            onClick={() => handlePromotorClick(promotorName)}
                          >
                            <span className="font-medium text-gray-900 text-sm">{promotorName}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 capitalize">{status.replace('nicht erledigt', 'nicht erledigt').replace('unterbrochen', 'in bearbeitung')}</span>
                              {getStatusIcon(status)}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}