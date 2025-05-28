"use client"

import { useState, useRef, useEffect } from "react"
import { 
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Send,
  Brain,
  Clock,
  Award,
  ChevronRight,
  CheckSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuizProps {
  quizTitle: string
  quizDescription: string
  currentStep: number
  totalSteps: number
  stepType: string // e.g., "Quiz", "Test"
  trainingStartTime?: number | null
  onBack: () => void
  onPause: (progress: number, completedPercentage: number) => void
  onComplete: () => void
}

interface Question {
  id: number
  type: 'multiple-choice' | 'text-input'
  question: string
  options?: string[]
  correctAnswer?: number // for multiple choice
  userAnswer?: number | string
  isCorrect?: boolean
  explanation?: string
}

export default function Quiz({ quizTitle, quizDescription, currentStep, totalSteps, stepType, trainingStartTime, onBack, onPause, onComplete }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [answers, setAnswers] = useState<Map<number, number | string>>(new Map())
  const [results, setResults] = useState<Map<number, boolean>>(new Map())
  const [showResults, setShowResults] = useState(false)
  const [startTime] = useState(trainingStartTime || Date.now()) // Use training start time if provided
  const [timeSpent, setTimeSpent] = useState(0)
  const [textInput, setTextInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [chatGptResponse, setChatGptResponse] = useState("")
  const [showTypingAnimation, setShowTypingAnimation] = useState(false)
  const [showCorrectAnimation, setShowCorrectAnimation] = useState(false)
  const [isNachprufung, setIsNachprufung] = useState(false)
  const [nachprufungQuestions, setNachprufungQuestions] = useState<number[]>([])
  const [correctedAnswers, setCorrectedAnswers] = useState<Set<number>>(new Set())
  
  // Mock quiz data - in real app this would come from props or API
  const questions: Question[] = [
    {
      id: 1,
      type: 'multiple-choice',
      question: 'Welche der folgenden Aussagen über Produktpräsentationen ist richtig?',
      options: [
        'Die Präsentation sollte immer länger als 10 Minuten dauern',
        'Kundennutzen sollte im Mittelpunkt stehen',
        'Technische Details sind am wichtigsten',
        'Der Preis sollte zuerst genannt werden'
      ],
      correctAnswer: 1,
      explanation: 'Der Kundennutzen sollte immer im Mittelpunkt einer erfolgreichen Produktpräsentation stehen.'
    },
    {
      id: 2,
      type: 'text-input',
      question: 'Beschreiben Sie in eigenen Worten, wie Sie einen skeptischen Kunden von einem Produkt überzeugen würden.',
      explanation: 'Diese Antwort wird von unserem KI-System bewertet.'
    },
    {
      id: 3,
      type: 'multiple-choice',
      question: 'Was ist der erste Schritt bei einer Produktpräsentation?',
      options: [
        'Produktvorteile auflisten',
        'Preis nennen',
        'Kundenbedürfnisse ermitteln',
        'Konkurrenz kritisieren'
      ],
      correctAnswer: 2,
      explanation: 'Zuerst sollten die Kundenbedürfnisse ermittelt werden, um die Präsentation darauf auszurichten.'
    },
    {
      id: 4,
      type: 'text-input',
      question: 'Welche drei wichtigsten Eigenschaften sollte ein erfolgreicher Promotor haben? Begründen Sie Ihre Antwort.',
      explanation: 'Diese Antwort wird von unserem KI-System bewertet.'
    },
    {
      id: 5,
      type: 'multiple-choice',
      question: 'Wie sollten Sie auf Einwände reagieren?',
      options: [
        'Einwände ignorieren',
        'Sofort widersprechen',
        'Zuhören und verstehen, dann antworten',
        'Den Kunden unterbrechen'
      ],
      correctAnswer: 2,
      explanation: 'Aktives Zuhören und Verstehen der Einwände ist der Schlüssel für eine erfolgreiche Behandlung.'
    }
  ]

  const totalQuestions = questions.length
  const minQuizTime = 120000 // 2 minutes minimum

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Date.now() - startTime)
    }, 100)

    return () => clearInterval(interval)
  }, [startTime])

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Reset selections when question changes
  useEffect(() => {
    const currentAnswer = answers.get(currentQuestion)
    if (questions[currentQuestion - 1].type === 'multiple-choice') {
      setSelectedOption(typeof currentAnswer === 'number' ? currentAnswer : null)
      setTextInput("")
    } else {
      setTextInput(typeof currentAnswer === 'string' ? currentAnswer : "")
      setSelectedOption(null)
    }
    
    // Reset text input states when changing questions
    // In Nachprüfung, questions are reset to default state, so clear all response states
    if (isNachprufung && !answers.has(currentQuestion)) {
      setChatGptResponse("")
      setShowTypingAnimation(false)
      setShowCorrectAnimation(false)
    } else if (!isSubmitting) {
      setChatGptResponse("")
      setShowTypingAnimation(false)
      setShowCorrectAnimation(false)
    }
  }, [currentQuestion, answers, isNachprufung])

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    return (answers.size / totalQuestions) * 100
  }

  // Check if quiz is completed (all questions answered)
  const isQuizCompleted = () => {
    if (!isNachprufung) {
      // First round: all questions must be answered
      return answers.size >= totalQuestions && timeSpent >= minQuizTime
    } else {
      // Nachprüfung: all incorrect questions must be answered correctly
      return nachprufungQuestions.every(qNum => correctedAnswers.has(qNum))
    }
  }

  // Get incorrect questions for Nachprüfung
  const getIncorrectQuestions = () => {
    const incorrect: number[] = []
    questions.forEach(q => {
      if (q.type === 'multiple-choice') {
        const userAnswer = answers.get(q.id)
        if (userAnswer !== q.correctAnswer) {
          incorrect.push(q.id)
        }
      } else {
        const result = results.get(q.id)
        if (result !== true) {
          incorrect.push(q.id)
        }
      }
    })
    return incorrect
  }

  // Start Nachprüfung if there are incorrect answers
  const startNachprufung = () => {
    const incorrectQuestions = getIncorrectQuestions()
    if (incorrectQuestions.length > 0) {
      setNachprufungQuestions(incorrectQuestions)
      setIsNachprufung(true)
      setCurrentQuestion(incorrectQuestions[0])
      
      // Clear answers and results for incorrect questions to reset them to default state
      setAnswers(prev => {
        const newAnswers = new Map(prev)
        incorrectQuestions.forEach(qNum => {
          newAnswers.delete(qNum)
        })
        return newAnswers
      })
      
      setResults(prev => {
        const newResults = new Map(prev)
        incorrectQuestions.forEach(qNum => {
          newResults.delete(qNum)
        })
        return newResults
      })
      
      // Clear current question states for fresh start
      setTextInput("")
      setSelectedOption(null)
      setChatGptResponse("")
      setShowTypingAnimation(false)
      setShowCorrectAnimation(false)
    } else {
      // No incorrect answers, show results
      setShowResults(true)
    }
  }

  // Handle multiple choice answer
  const handleMultipleChoiceAnswer = (optionIndex: number) => {
    setSelectedOption(optionIndex)
    setAnswers(prev => new Map(prev.set(currentQuestion, optionIndex)))
    
    // If in Nachprüfung and answer is correct, mark as corrected
    if (isNachprufung) {
      const currentQ = questions[currentQuestion - 1]
      if (optionIndex === currentQ.correctAnswer) {
        setCorrectedAnswers(prev => new Set([...prev, currentQuestion]))
      }
    }
  }

  // Handle text input submission
  const handleTextSubmission = async () => {
    if (!textInput.trim()) return
    
    // Save the answer and start loading immediately
    const userAnswer = textInput.trim()
    setAnswers(prev => new Map(prev.set(currentQuestion, userAnswer)))
    
    // Start loading state immediately
    setIsSubmitting(true)
    
    // Force a re-render to show loading screen
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Clear the input field
    setTextInput("")
    
    // Simulate AI evaluation with proper loading time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock evaluation result - make question 2 correct, question 4 incorrect for demo
    // In Nachprüfung, make question 4 correct so we can test the flow
    const isCorrect = currentQuestion === 2 || (currentQuestion === 4 && isNachprufung)
    setResults(prev => new Map(prev.set(currentQuestion, isCorrect)))
    
    // If in Nachprüfung and answer is correct, mark as corrected
    if (isNachprufung && isCorrect) {
      setCorrectedAnswers(prev => new Set([...prev, currentQuestion]))
    }
    
    // Stop loading
    setIsSubmitting(false)
    
    if (isCorrect) {
      // Show correct animation
      setShowCorrectAnimation(true)
    } else {
      // Show ChatGPT response with typing animation
      const mockResponse = "Ihre Antwort zeigt ein grundlegendes Verständnis, jedoch fehlen wichtige Aspekte wie die Bedeutung des aktiven Zuhörens und der Empathie. Ein erfolgreicher Promotor sollte zunächst die Bedenken des Kunden ernst nehmen, Verständnis zeigen und dann gezielt auf die spezifischen Vorteile eingehen, die für diesen Kunden relevant sind. Vertrauen aufzubauen ist dabei essentiell."
      
      setChatGptResponse("")
      setShowTypingAnimation(true)
      
      // Typing animation
      let i = 0
      const typingInterval = setInterval(() => {
        if (i < mockResponse.length) {
          setChatGptResponse(mockResponse.slice(0, i + 1))
          i++
        } else {
          clearInterval(typingInterval)
          setShowTypingAnimation(false)
        }
      }, 30) // Typing speed
    }
  }

  // Handle pause and save progress
  const handlePauseQuiz = () => {
    const progress = (currentQuestion / totalQuestions) * 100
    const completedPercentage = getCompletionPercentage()
    onPause(progress, completedPercentage)
  }

  // Navigate to specific question
  const goToQuestion = (questionNumber: number) => {
    if (!isNachprufung) {
      // Normal navigation
      if (questionNumber >= 1 && questionNumber <= totalQuestions) {
        setShowCorrectAnimation(false)
        setChatGptResponse("")
        setShowTypingAnimation(false)
        setCurrentQuestion(questionNumber)
      }
    } else {
      // Nachprüfung navigation - only navigate within incorrect questions
      const currentIndex = nachprufungQuestions.indexOf(currentQuestion)
      const targetIndex = nachprufungQuestions.indexOf(questionNumber)
      
      if (targetIndex !== -1) {
        setShowCorrectAnimation(false)
        setChatGptResponse("")
        setShowTypingAnimation(false)
        setCurrentQuestion(questionNumber)
      }
    }
  }

  // Get next question in sequence
  const getNextQuestion = () => {
    if (!isNachprufung) {
      return currentQuestion < totalQuestions ? currentQuestion + 1 : null
    } else {
      const currentIndex = nachprufungQuestions.indexOf(currentQuestion)
      return currentIndex < nachprufungQuestions.length - 1 ? nachprufungQuestions[currentIndex + 1] : null
    }
  }

  // Get previous question in sequence
  const getPreviousQuestion = () => {
    if (!isNachprufung) {
      return currentQuestion > 1 ? currentQuestion - 1 : null
    } else {
      const currentIndex = nachprufungQuestions.indexOf(currentQuestion)
      return currentIndex > 0 ? nachprufungQuestions[currentIndex - 1] : null
    }
  }

  // Check if we should show results or start another Nachprüfung round
  const handleQuizCompletion = () => {
    if (!isNachprufung && answers.size >= totalQuestions) {
      startNachprufung()
    } else if (isNachprufung) {
      // Check if there are still incorrect questions
      const stillIncorrect = getIncorrectQuestions()
      if (stillIncorrect.length > 0) {
        // Start another Nachprüfung round with remaining incorrect questions
        startNachprufung()
      } else {
        // All questions are now correct, show results
        setShowResults(true)
      }
    }
  }

  // Calculate final score
  const getFinalScore = () => {
    let correct = 0
    questions.forEach(q => {
      if (q.type === 'multiple-choice') {
        const userAnswer = answers.get(q.id)
        if (userAnswer === q.correctAnswer) correct++
      } else {
        const result = results.get(q.id)
        if (result) correct++
      }
    })
    return Math.round((correct / totalQuestions) * 100)
  }

  // Format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Show results if all questions answered
  if (showResults || (answers.size >= totalQuestions && currentQuestion > totalQuestions)) {
    const score = getFinalScore()
    const passed = score >= 70
    
    return (
      <div className="bg-gray-50 dark:bg-gray-950" style={{ minHeight: '100vh', maxHeight: 'calc(100vh + 0.4cm)' }}>
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm rounded-lg">
          <div className="flex h-14 items-center justify-between px-4 mx-auto max-w-4xl">
            <button
              onClick={handlePauseQuiz}
              className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            </button>
            
            <div className="flex-1 flex items-center justify-center mx-4 min-w-0">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {stepType} {currentStep}/{totalSteps} - Ergebnis
              </span>
            </div>
            
            <div className="relative w-8 h-8">
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="h-3 w-3 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Results Container */}
        <div className="mx-auto max-w-2xl px-6 py-12">
          <div className="text-center space-y-8">
            {/* Score Display */}
            <div className="space-y-4">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${
                passed ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'
              } text-white shadow-2xl`}>
                {passed ? (
                  <Award className="h-10 w-10" />
                ) : (
                  <X className="h-10 w-10" />
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {passed ? 'Quiz bestanden!' : 'Quiz nicht bestanden'}
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {passed ? 'Herzlichen Glückwunsch!' : 'Versuchen Sie es erneut'}
              </p>
              
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {score}%
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
              <div className="text-center">
                <Clock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <div className="text-sm text-gray-500 dark:text-gray-400">Zeit benötigt</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatTime(timeSpent)}
                </div>
              </div>
              <div className="text-center">
                <Brain className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <div className="text-sm text-gray-500 dark:text-gray-400">Fragen beantwortet</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {answers.size}/{totalQuestions}
                </div>
              </div>
            </div>

            {passed && (
              <button
                onClick={onComplete}
                className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-8 rounded-2xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span>Schulung abschließen</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion - 1]

  return (
    <div className="bg-gray-50 dark:bg-gray-950" style={{ minHeight: '100vh', maxHeight: 'calc(100vh + 0.4cm)' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm rounded-lg">
        <div className="flex h-14 items-center justify-between px-4 mx-auto max-w-4xl">
          {/* Left Section - Pause Button */}
          <button
            onClick={handlePauseQuiz}
            className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          </button>
          
          {/* Center Section - Step Info */}
          <div className="flex-1 flex items-center justify-center mx-4 min-w-0">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {isNachprufung ? `Nachprüfung - ${stepType}` : `${stepType} ${currentStep}/${totalSteps}`}
            </span>
          </div>
          
          {/* Right Section - Progress Circle */}
          <div className="relative w-8 h-8">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"></div>
            
            <svg className="absolute top-0 left-0 w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${(getCompletionPercentage() / 100) * 87.96} 87.96`}
                className={
                  getCompletionPercentage() >= 85 
                    ? "text-green-500" 
                    : getCompletionPercentage() >= 50 
                    ? "text-orange-500" 
                    : "text-red-500"
                }
              />
            </svg>
            
            <div className="absolute inset-0 flex items-center justify-center">
              {isQuizCompleted() ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <span className="text-[8px] font-bold text-gray-600 dark:text-gray-400">
                  {Math.round(getCompletionPercentage())}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Container */}
      <div className="mx-auto max-w-3xl px-6 py-6">
        <div className="space-y-6">
          {/* Question Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium">
              {currentQ.type === 'multiple-choice' ? (
                <>
                  <CheckSquare className="h-4 w-4 -ml-1.5" />
                  <span>Multiple Choice</span>
                </>
              ) : (
                <>
                  <img
                    src="/icons/robot 1.svg"
                    alt="Eddie"
                    className="h-4 w-4 -ml-1.5 brightness-0 invert"
                  />
                  <span>Eddies Frage</span>
                </>
              )}
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {isNachprufung 
                ? `Nachprüfung ${nachprufungQuestions.indexOf(currentQuestion) + 1} von ${nachprufungQuestions.length}`
                : `Frage ${currentQuestion} von ${totalQuestions}`
              }
            </h1>
          </div>

          {/* Question Text */}
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 leading-relaxed max-w-2xl mx-auto">
              {currentQ.question}
            </h2>
          </div>

          {/* Answer Section */}
          <div className="max-w-2xl mx-auto">
            {currentQ.type === 'multiple-choice' ? (
              /* Multiple Choice Options */
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {currentQ.options?.map((option, index) => {
                    const isSelected = selectedOption === index
                    const isAnswered = answers.has(currentQuestion) && (!isNachprufung || correctedAnswers.has(currentQuestion))
                    const isCorrect = index === currentQ.correctAnswer
                    
                    return (
                      <button
                        key={index}
                        onClick={() => !isAnswered && handleMultipleChoiceAnswer(index)}
                        disabled={isAnswered}
                        className={`w-full p-3 text-left rounded-lg border-2 transition-all duration-300 transform hover:scale-[1.01] relative ${
                          isAnswered
                            ? isCorrect
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 shadow-md shadow-green-500/20'
                              : isSelected
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 shadow-md shadow-red-500/20'
                              : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 opacity-50'
                            : isSelected
                            ? 'border-transparent bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 shadow-md shadow-purple-500/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 shadow-sm hover:shadow-md'
                        }`}
                        style={
                          isSelected && !isAnswered
                            ? {
                                background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, rgb(168 85 247), rgb(236 72 153)) border-box',
                                border: '2px solid transparent'
                              }
                            : undefined
                        }
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isAnswered
                              ? isCorrect
                                ? 'border-green-500 bg-green-500'
                                : isSelected
                                ? 'border-red-500 bg-red-500'
                                : 'border-gray-300 dark:border-gray-600'
                              : isSelected
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {(isAnswered && isCorrect) || (isSelected && !isAnswered) ? (
                              <Check className="h-3 w-3 text-white" />
                            ) : isAnswered && isSelected && !isCorrect ? (
                              <X className="h-3 w-3 text-white" />
                            ) : (
                              <span className="text-xs font-bold text-gray-400">
                                {String.fromCharCode(65 + index)}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-sm">{option}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                
                {answers.has(currentQuestion) && currentQ.explanation && (!isNachprufung || correctedAnswers.has(currentQuestion)) && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200 font-medium text-xs">
                      <strong>Erklärung:</strong> {currentQ.explanation}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Text Input */
              <div className="space-y-4">
                <div className="relative">
                  {(chatGptResponse || showTypingAnimation) && (!isNachprufung || correctedAnswers.has(currentQuestion)) ? (
                    /* ChatGPT Response Display */
                    <div className="h-40 p-4 border border-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl overflow-y-auto shadow-md shadow-red-500/20" ref={(el) => {
                      if (el && showTypingAnimation) {
                        el.scrollTop = el.scrollHeight;
                      }
                    }}>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                          <img
                            src="/icons/robot 1.svg"
                            alt="Eddie"
                            className="h-4 w-4 brightness-0"
                            style={{ filter: 'brightness(0) saturate(100%) invert(25%) sepia(15%) saturate(2498%) hue-rotate(316deg) brightness(99%) contrast(97%)' }}
                          />
                          <span className="text-sm font-medium">Eddies Feedback</span>
                        </div>
                        <p className="text-red-700 dark:text-red-300 text-sm leading-relaxed">
                          {chatGptResponse}
                        </p>
                      </div>
                    </div>
                  ) : isSubmitting ? (
                    /* Loading State */
                    <div className="flex items-center justify-center h-40 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-200 dark:border-purple-800 rounded-2xl">
                      <div className="text-center space-y-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
                        </div>
                        <p className="text-purple-600 dark:text-purple-400 font-medium text-sm">
                          Deine Antwort wird evaluiert...
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Input Field */
                    <div className="relative">
                      <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Geben Sie hier Ihre ausführliche Antwort ein..."
                        disabled={isSubmitting}
                        className="w-full h-40 p-4 pr-16 border-2 border-gray-200 dark:border-gray-600 rounded-2xl resize-none focus:ring-0 focus:border-purple-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm leading-relaxed transition-all duration-200 shadow-md focus:shadow-lg"
                      />
                      
                      {/* Submit Button Inside Input */}
                      <button
                        onClick={handleTextSubmission}
                        disabled={!textInput.trim() || isSubmitting}
                        className="absolute bottom-4 right-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      
                      {/* Character Counter */}
                      <div className="absolute bottom-4 left-4 text-xs text-gray-400">
                        {textInput.length} Zeichen
                      </div>
                    </div>
                  )}
                  
                  {/* Correct Answer Animation Overlay */}
                  {showCorrectAnimation && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/95 dark:bg-gray-800/95 rounded-2xl backdrop-blur-sm">
                      <div className="text-center space-y-4">
                        <svg className="h-16 w-16 mx-auto" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M20 6L9 17l-5-5"
                            stroke="#10b981"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="24"
                            strokeDashoffset="24"
                            className="animate-drawCheck"
                          />
                        </svg>
                        <p className="text-green-700 dark:text-green-300 font-semibold">
                          Ausgezeichnete Antwort!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center max-w-2xl mx-auto">
            <button
              onClick={() => {
                const prevQ = getPreviousQuestion()
                if (prevQ) goToQuestion(prevQ)
              }}
              disabled={getPreviousQuestion() === null}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors opacity-50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium text-sm">Zurück</span>
            </button>

            {(!isNachprufung && currentQuestion === totalQuestions && isQuizCompleted()) || (isNachprufung && isQuizCompleted()) ? (
              <button
                onClick={handleQuizCompletion}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  const nextQ = getNextQuestion()
                  if (nextQ) {
                    goToQuestion(nextQ)
                  } else if (!isNachprufung && answers.size >= totalQuestions) {
                    handleQuizCompletion()
                  }
                }}
                disabled={!answers.has(currentQuestion) && (!isNachprufung || !correctedAnswers.has(currentQuestion))}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 ${
                  (answers.has(currentQuestion) || (isNachprufung && correctedAnswers.has(currentQuestion)))
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Question Indicators */}
          <div className="flex justify-center">
            <div className="flex space-x-2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border border-gray-200 dark:border-gray-700">
              {Array.from({ length: totalQuestions }, (_, index) => {
                const questionNumber = index + 1
                const hasAnswer = answers.has(questionNumber)
                const isCurrentQuestion = questionNumber === currentQuestion
                
                let dotColor = 'bg-gray-300 dark:bg-gray-600' // default unanswered
                let shadowColor = ''
                
                if (hasAnswer) {
                  const question = questions[questionNumber - 1]
                  let isCorrect = false
                  
                  if (question.type === 'multiple-choice') {
                    const userAnswer = answers.get(questionNumber)
                    isCorrect = userAnswer === question.correctAnswer
                  } else {
                    isCorrect = results.get(questionNumber) === true
                  }
                  
                  // Check if this question was corrected during Nachprüfung
                  const wasCorrected = correctedAnswers.has(questionNumber)
                  
                  if (isCorrect || wasCorrected) {
                    dotColor = 'bg-green-500'
                    shadowColor = 'shadow-lg shadow-green-500/30'
                  } else {
                    dotColor = 'bg-red-500'
                    shadowColor = 'shadow-lg shadow-red-500/30'
                  }
                } else if (isCurrentQuestion) {
                  dotColor = 'bg-purple-500'
                  shadowColor = 'shadow-lg shadow-purple-500/30'
                }
                
                return (
                  <button
                    key={questionNumber}
                    onClick={() => goToQuestion(questionNumber)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${dotColor} ${shadowColor}`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-drawCheck {
          animation: drawCheck 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
} 