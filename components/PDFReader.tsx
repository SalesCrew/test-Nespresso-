"use client"

import { useState, useRef, useEffect } from "react"
import { 
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface PDFReaderProps {
  pdfTitle: string
  pdfDescription: string
  currentStep: number
  totalSteps: number
  stepType: string // e.g., "Dokument", "PDF"
  onBack: () => void
  onPause: (progress: number, readPercentage: number) => void
  onNextStep: () => void
}

export default function PDFReader({ pdfTitle, pdfDescription, currentStep, totalSteps, stepType, onBack, onPause, onNextStep }: PDFReaderProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [readPages, setReadPages] = useState<Set<number>>(new Set())
  const [startTime] = useState(Date.now())
  const [timeSpent, setTimeSpent] = useState(0)
  const [pageStartTime, setPageStartTime] = useState(Date.now())
  const [pageTimeSpent, setPageTimeSpent] = useState(0)
  
  const totalPages = 10 // Dynamic for later
  const minReadTime = 60000 // 1 minute in milliseconds
  const pageReadDelay = 5000 // 5 seconds delay for gelesen button

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Date.now() - startTime)
      setPageTimeSpent(Date.now() - pageStartTime)
    }, 100) // Update more frequently for smooth countdown

    return () => clearInterval(interval)
  }, [startTime, pageStartTime])

  // Reset page timer when page changes
  useEffect(() => {
    setPageStartTime(Date.now())
    setPageTimeSpent(0)
  }, [currentPage])

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Calculate read percentage
  const getReadPercentage = () => {
    return (readPages.size / totalPages) * 100
  }

  // Check if reading is completed (all pages read)
  const isCompleted = () => {
    return readPages.size >= totalPages
  }

  // Check if gelesen button is ready (5 seconds passed)
  const isGelesenReady = () => {
    return pageTimeSpent >= pageReadDelay
  }

  // Get countdown for gelesen button
  const getGelesenCountdown = () => {
    const remaining = Math.max(0, pageReadDelay - pageTimeSpent)
    return Math.ceil(remaining / 1000)
  }

  // Handle marking page as read
  const handlePageRead = () => {
    setReadPages(prev => new Set([...prev, currentPage]))
    
    // Auto-navigate to next page if not the last page
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Handle pause and save progress
  const handlePausePDF = () => {
    const progress = getReadPercentage()
    const readPercentage = getReadPercentage()
    onPause(progress, readPercentage)
  }

  // Format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Navigate to specific page
  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950" style={{ minHeight: '100vh', maxHeight: 'calc(100vh + 0.4cm)' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm rounded-lg">
        <div className="flex h-14 items-center justify-between px-4 mx-auto max-w-4xl">
          {/* Left Section - Pause Button */}
          <button
            onClick={handlePausePDF}
            className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          </button>
          
          {/* Center Section - Step Info */}
          <div className="flex-1 flex items-center justify-center mx-4 min-w-0">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {stepType} {currentStep}/{totalSteps}
            </span>
          </div>
          
          {/* Right Section - Progress Circle */}
          <div className="relative w-8 h-8">
            {/* Background circle */}
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"></div>
            
            {/* Progress circle with color-coded segments */}
            <svg className="absolute top-0 left-0 w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${(getReadPercentage() / 100) * 87.96} 87.96`}
                className={
                  getReadPercentage() >= 85 
                    ? "text-green-500" 
                    : getReadPercentage() >= 50 
                    ? "text-orange-500" 
                    : "text-red-500"
                }
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isCompleted() ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <span className="text-[8px] font-bold text-gray-600 dark:text-gray-400">
                  {Math.round(getReadPercentage())}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Reader Container */}
      <div className="mx-auto max-w-4xl px-3" style={{ paddingTop: '18px', paddingBottom: '0.4cm' }}>
        <div className="space-y-4">
          {/* PDF Title */}
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center">
            {pdfTitle}
          </h2>

          {/* Current Page Display */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-w-2xl mx-auto">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
              <span className="text-sm font-medium">
                Seite {currentPage} von {totalPages}
              </span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                readPages.has(currentPage)
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/80'
              }`}>
                {readPages.has(currentPage) ? '✓ Gelesen' : 'Nicht gelesen'}
              </span>
            </div>
            
            {/* Page Content - Smaller and more rectangular */}
            <div className="p-6 h-[50vh] overflow-y-auto bg-white dark:bg-gray-800">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Dokument Seite {currentPage}
                </h3>
                <div className="space-y-3">
                  {Array.from({ length: 8 }, (_, lineIndex) => (
                    <div key={lineIndex} className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-5/6"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-4/5"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Page Footer with Back Button and Gelesen Button */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                {/* Back Button */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">Zurück</span>
                </button>

                {/* Gelesen Button or Next Step Button on last page */}
                {currentPage === totalPages ? (
                  // Show green next step button on last page if all pages are read
                  readPages.size >= totalPages ? (
                    <button
                      onClick={onNextStep}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  ) : (
                    // Show gelesen button if last page not read yet
                    <button
                      onClick={handlePageRead}
                      disabled={!isGelesenReady()}
                      className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 ${
                        !isGelesenReady() ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      <span>Gelesen</span>
                    </button>
                  )
                ) : (
                  // Regular gelesen button for non-last pages
                  !readPages.has(currentPage) ? (
                    <button
                      onClick={handlePageRead}
                      disabled={!isGelesenReady()}
                      className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 ${
                        !isGelesenReady() ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      <span>Gelesen</span>
                    </button>
                  ) : (
                    // Show minimalistic "Nächste" button for already read pages
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors opacity-50"
                    >
                      <span className="text-sm font-medium">Nächste</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Page Indicators - Moved below document */}
          <div className="flex justify-center">
            <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-full p-2 shadow-sm border border-gray-200 dark:border-gray-700">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => goToPage(index + 1)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    readPages.has(index + 1)
                      ? 'bg-green-500'
                      : index + 1 === currentPage
                      ? 'bg-blue-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 