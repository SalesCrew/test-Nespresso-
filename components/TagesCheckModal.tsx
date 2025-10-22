"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

interface TagesCheckModalProps {
  assignment: {
    id: string
    title: string
    location_text: string
    start_time: string
  } | null
  onComplete: () => void
}

export default function TagesCheckModal({ assignment, onComplete }: TagesCheckModalProps) {
  const [stage, setStage] = useState<'initial' | 'animating' | 'complete'>('initial')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!assignment) return null

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 11) return "Guten Morgen! ☀️"
    if (hour >= 11 && hour < 17) return "Hallo! 👋"
    if (hour >= 17 && hour < 22) return "Guten Abend! 🌙"
    return "Hey Nachtmensch! 🌃"
  }

  const getMotivation = () => {
    const messages = [
      "Viel Erfolg heute! 💪",
      "Du schaffst das! 🚀",
      "Zeig, was du drauf hast! ⭐",
      "Heute wird großartig! ✨",
      "Auf geht's! 🎯"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'UTC'
      })
    } catch {
      return ''
    }
  }

  const handleCheckIn = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    setStage('animating')

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50])
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      
      const response = await fetch('/api/promotors/assignments/daily-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignment.id,
          checkin_date: today
        })
      })

      if (!response.ok) {
        throw new Error('Check-in failed')
      }

      // Wait for animations to complete
      setTimeout(() => {
        setStage('complete')
        setTimeout(() => {
          onComplete()
        }, 300)
      }, 2000)

    } catch (error) {
      console.error('Tages-Check error:', error)
      setIsSubmitting(false)
      setStage('initial')
      alert('Check-in fehlgeschlagen. Bitte versuche es erneut.')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md animate-gradient" />
      
      {/* Modal Card */}
      <Card 
        className={`relative w-full max-w-md mx-4 border-none shadow-2xl overflow-hidden transition-all duration-300 ${
          stage === 'complete' ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        }}
      >
        {stage === 'initial' && (
          <div className="p-8 text-center text-white">
            {/* Animated Icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-white/40 rounded-full flex items-center justify-center animate-pulse-slow backdrop-blur-sm">
                  <span className="text-5xl animate-bounce-subtle">🌞</span>
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 w-20 h-20 bg-yellow-200/50 rounded-full blur-xl animate-pulse-slow" />
              </div>
            </div>

            {/* Greeting */}
            <h2 className="text-2xl font-bold mb-4 animate-fade-in">
              {getGreeting()}
            </h2>

            {/* Assignment Info */}
            <div className="mb-6 space-y-2 animate-fade-in-delay">
              <p className="text-white/90 font-medium">Heute geht's los:</p>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="font-semibold text-lg mb-1">📍 {assignment.title}</p>
                <p className="text-white/80 text-sm">{assignment.location_text}</p>
                {assignment.start_time && (
                  <p className="text-white/90 mt-2">🕐 {formatTime(assignment.start_time)} Uhr</p>
                )}
              </div>
            </div>

            {/* Main Button */}
            <Button
              onClick={handleCheckIn}
              disabled={isSubmitting}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-white/30 will-change-transform backface-hidden"
              style={{ WebkitFontSmoothing: 'antialiased' } as React.CSSProperties}
            >
              🎯 Tages-Check! ✓
            </Button>

            {/* Motivation */}
            <p className="mt-4 text-white/80 text-sm animate-fade-in-delay-long">
              {getMotivation()}
            </p>
          </div>
        )}

        {stage === 'animating' && (
          <div className="p-8 text-center text-white relative overflow-hidden">
            {/* Confetti Container */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-confetti"
                  style={{
                    left: `${50}%`,
                    top: `${50}%`,
                    background: ['#10b981', '#3b82f6', '#fbbf24', '#ef4444'][i % 4],
                    animationDelay: `${i * 0.02}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    '--tx': `${(Math.random() - 0.5) * 400}px`,
                    '--ty': `${(Math.random() - 0.5) * 400}px`,
                  } as React.CSSProperties}
                />
              ))}
            </div>

            {/* Checkmark Animation */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative">
                <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center animate-scale-in shadow-2xl">
                  <CheckCircle2 className="w-20 h-20 text-white animate-check-draw" />
                </div>
                {/* Glow */}
                <div className="absolute inset-0 w-32 h-32 bg-green-400 rounded-full blur-2xl animate-pulse-glow" />
              </div>

              <div className="mt-8 space-y-2 animate-fade-in-up">
                <h3 className="text-2xl font-bold">✅ Check-in erfolgreich!</h3>
                <p className="text-white/90">Viel Erfolg beim Einsatz! 🚀</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }

        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.95; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.5s ease-out 0.2s both;
        }

        .animate-fade-in-delay-long {
          animation: fade-in 0.5s ease-out 0.4s both;
        }

        @keyframes scale-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 1.5s ease-in-out infinite;
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out 0.3s both;
        }

        @keyframes confetti {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 1.5s ease-out forwards;
        }

        @keyframes check-draw {
          0% {
            stroke-dasharray: 0 100;
          }
          100% {
            stroke-dasharray: 100 100;
          }
        }
      `}</style>
    </div>
  )
}

