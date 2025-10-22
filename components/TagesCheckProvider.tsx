"use client"

import { useEffect, useState } from "react"
import TagesCheckModal from "@/components/TagesCheckModal"

export default function TagesCheckProvider() {
  const [assignment, setAssignment] = useState<{
    id: string
    title: string
    location_text: string
    start_time: string
  } | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    checkForDailyCheckin()
  }, [])

  const checkForDailyCheckin = async () => {
    if (isChecking) return
    setIsChecking(true)

    try {
      const res = await fetch('/api/promotors/assignments/daily-checkin/pending')
      const data = await res.json()

      if (data.needsCheckin && data.assignment) {
        setAssignment(data.assignment)
      }
    } catch (error) {
      console.error('Failed to check for daily check-in:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleComplete = () => {
    setAssignment(null)
    // Check if there are more assignments needing check-in
    setTimeout(() => {
      checkForDailyCheckin()
    }, 500)
  }

  return <TagesCheckModal assignment={assignment} onComplete={handleComplete} />
}

