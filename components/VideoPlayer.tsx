"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw,
  RotateCw,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Check,
  PauseCircle,
  ThumbsUp,
  ThumbsDown,
  Send,
  ArrowRight,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  videoTitle: string
  videoDescription: string
  currentStep: number
  totalSteps: number
  stepType: string // e.g., "Schulungsvideo", "Dokument", "Quiz"
  onBack: () => void
  onPause: (progress: number, watchedPercentage: number) => void
  onNextStep: () => void
}

export default function VideoPlayer({ videoTitle, videoDescription, currentStep, totalSteps, stepType, onBack, onPause, onNextStep }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(60) // 1 minute placeholder for testing
  const [volume, setVolume] = useState(1)
  const [watchedSegments, setWatchedSegments] = useState<Set<number>>(new Set())
  const [lastWatchedTime, setLastWatchedTime] = useState(0)
  const [liked, setLiked] = useState<boolean | null>(null)
  const [likeCount, setLikeCount] = useState(42) // Mock data
  const [dislikeCount, setDislikeCount] = useState(3) // Mock data
  const [viewCount, setViewCount] = useState(1247) // Mock data
  const [showPlayAnimation, setShowPlayAnimation] = useState(false)
  
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Simulate video progress and track watched segments
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev >= duration ? duration : prev + 1
          
          // Track watched segments (only if playing continuously)
          if (Math.abs(newTime - lastWatchedTime) <= 2) {
            setWatchedSegments(segments => new Set([...segments, Math.floor(newTime)]))
          }
          setLastWatchedTime(newTime)
          
          if (newTime >= duration) {
            setIsPlaying(false)
          }
          return newTime
        })
      }, 1000)
    }
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isPlaying, duration, lastWatchedTime])

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls, isPlaying])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    setShowControls(true)
    
    // Show YouTube-style play animation
    setShowPlayAnimation(true)
    setTimeout(() => {
      setShowPlayAnimation(false)
    }, 1200)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      playerRef.current?.requestFullscreen?.()
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * duration
    setCurrentTime(Math.floor(newTime))
  }

  const skip = (seconds: number) => {
    setCurrentTime(prev => Math.max(0, Math.min(duration, prev + seconds)))
    setShowControls(true)
    // Reset last watched time to prevent counting skipped segments
    setLastWatchedTime(prev => prev + seconds)
  }

  // Calculate watched percentage
  const getWatchedPercentage = () => {
    return (watchedSegments.size / duration) * 100
  }

  // Check if video is completed (85% or more)
  const isVideoCompleted = () => {
    return getWatchedPercentage() >= 85
  }

  // Handle pause and save progress
  const handlePauseSchulung = () => {
    const progress = (currentTime / duration) * 100
    const watchedPercentage = getWatchedPercentage()
    onPause(progress, watchedPercentage)
  }

  // Handle like/dislike
  const handleLike = () => {
    if (liked === true) {
      setLiked(null)
      setLikeCount(prev => prev - 1)
    } else {
      if (liked === false) {
        setDislikeCount(prev => prev - 1)
      }
      setLiked(true)
      setLikeCount(prev => prev + 1)
    }
  }

  const handleDislike = () => {
    if (liked === false) {
      setLiked(null)
      setDislikeCount(prev => prev - 1)
    } else {
      if (liked === true) {
        setLikeCount(prev => prev - 1)
      }
      setLiked(false)
      setDislikeCount(prev => prev + 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm rounded-lg">
        <div className="flex h-14 items-center justify-between px-4 mx-auto max-w-2xl">
          {/* Left Section - Pause Button */}
          <button
            onClick={handlePauseSchulung}
            className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200"
          >
            <PauseCircle className="h-4 w-4" />
          </button>
          
          {/* Center Section - Step Info Only */}
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
                strokeDasharray={`${(getWatchedPercentage() / 100) * 87.96} 87.96`}
                className={
                  getWatchedPercentage() >= 85 
                    ? "text-green-500" 
                    : getWatchedPercentage() >= 50 
                    ? "text-orange-500" 
                    : "text-red-500"
                }
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isVideoCompleted() ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <span className="text-[8px] font-bold text-gray-600 dark:text-gray-400">
                  {Math.round(getWatchedPercentage())}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Player Container */}
      <div className="mx-auto max-w-2xl px-3" style={{ paddingTop: '18px' }}>
        <div className="space-y-3">
          {/* Video Player */}
          <div 
            ref={playerRef}
            className={`relative bg-black rounded-lg overflow-hidden shadow-lg ${
              isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : 'aspect-video'
            }`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
          >
            {/* Video Placeholder (Black Rectangle) */}
            <div 
              ref={videoRef}
              className="w-full h-full bg-black flex items-center justify-center cursor-pointer"
              onClick={togglePlay}
            >
              {/* YouTube-style Play/Pause Animation */}
              {showPlayAnimation && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div 
                    className="relative"
                    style={{
                      animation: 'pulseOnce 1.2s ease-out forwards'
                    }}
                  >
                    {isPlaying ? (
                      <svg className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      <svg className="h-12 w-12 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </div>
                </div>
              )}

              <style jsx>{`
                @keyframes pulseOnce {
                  0% {
                    transform: scale(0.8);
                    opacity: 0;
                  }
                  30% {
                    transform: scale(1.1);
                    opacity: 1;
                  }
                  100% {
                    transform: scale(1);
                    opacity: 0;
                  }
                }
              `}</style>

              {/* Video Controls */}
              <div 
                className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
                  showControls ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* Progress Bar */}
                <div className="absolute bottom-10 left-2 right-2">
                  <div 
                    className="w-full h-0.5 bg-white/30 rounded-full cursor-pointer"
                    onClick={handleSeek}
                  >
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Control Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between text-white">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={togglePlay}
                      className="text-white rounded-full p-1.5"
                    >
                      {isPlaying ? (
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                        </svg>
                      ) : (
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </button>
                    
                    <button
                      onClick={() => skip(-10)}
                      className="text-white rounded-full p-2 relative"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[7px] font-bold">10</span>
                    </button>
                    
                    <button
                      onClick={() => skip(10)}
                      className="text-white rounded-full p-2 relative"
                    >
                      <RotateCw className="h-4 w-4" />
                      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[7px] font-bold">10</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={toggleMute}
                        className="text-white rounded-full p-1.5"
                      >
                        {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-12 h-0.5 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:h-2 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                      />
                    </div>

                    <span className="text-xs font-medium">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <button
                    onClick={toggleFullscreen}
                    className="text-white rounded-full p-1.5"
                  >
                    {isFullscreen ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Video Info */}
          {!isFullscreen && (
            <div className="space-y-3">
              {/* Video Title */}
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {videoTitle}
              </h2>

              {/* Like/Dislike and Next Step Row */}
              <div className="flex items-center justify-between">
                {/* Engagement Metrics (Left) */}
                <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800 rounded-full px-3 py-2">
                  {/* Views */}
                  <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{viewCount.toLocaleString()}</span>
                  </div>
                  
                  {/* Separator */}
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                  
                  {/* Likes */}
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-all duration-200 ${
                      liked === true 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{likeCount}</span>
                  </button>
                  
                  {/* Dislikes */}
                  <button
                    onClick={handleDislike}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-all duration-200 ${
                      liked === false 
                        ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{dislikeCount}</span>
                  </button>
                </div>

                {/* Next Step Button (Right) */}
                <button
                  onClick={onNextStep}
                  disabled={!isVideoCompleted()}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                    isVideoCompleted()
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-105 opacity-100'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-40'
                  }`}
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 