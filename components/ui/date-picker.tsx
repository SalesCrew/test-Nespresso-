"use client"

import * as React from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ value, onChange, placeholder = "tt.mm.jjjj", className }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [dropdownPosition, setDropdownPosition] = React.useState<'bottom' | 'top'>('bottom')
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  // Parse the current value
  const selectedDate = value ? new Date(value) : null

  // Format date for display (German format)
  const formatDisplayDate = (date: Date | null) => {
    if (!date) return placeholder
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`
  }

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1) // Start from Monday
    
    const days = []
    for (let i = 0; i < 42; i++) { // 6 weeks
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      days.push(date)
    }
    return days
  }

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    onChange?.(dateStr)
    setIsOpen(false)
  }

  // Calculate dropdown position
  const calculatePosition = React.useCallback(() => {
    if (!buttonRef.current) return

    const buttonRect = buttonRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const dropdownHeight = 350 // Approximate height of calendar dropdown
    const spaceBelow = viewportHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top

    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition('top')
    } else {
      setDropdownPosition('bottom')
    }
  }, [])

  // Handle outside click and position calculation
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      calculatePosition()
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', calculatePosition)
      window.addEventListener('resize', calculatePosition)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', calculatePosition)
      window.removeEventListener('resize', calculatePosition)
    }
  }, [isOpen, calculatePosition])

  // Navigate months
  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-left transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300",
          "hover:border-gray-300",
          !value && "text-gray-400",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <span>{formatDisplayDate(selectedDate)}</span>
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
      </button>

      {isOpen && (
        <div className={cn(
          "absolute left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-[280px]",
          dropdownPosition === 'bottom' ? "top-full mt-1" : "bottom-full mb-1"
        )}>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div className="text-sm font-medium text-gray-900">
              {currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </div>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
              <div key={day} className="text-center text-xs text-gray-400 font-medium py-1">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {generateCalendarDays().map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
              const today = new Date()
              const isToday = date.toDateString() === today.toDateString()
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  className={cn(
                    "w-8 h-8 text-xs rounded transition-colors",
                    isSelected
                      ? "bg-gray-900 text-white"
                      : isToday
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : isCurrentMonth
                      ? "text-gray-700 hover:bg-gray-50"
                      : "text-gray-300 hover:bg-gray-25"
                  )}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
} 