"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export function TimePicker({ value, onChange, placeholder = "--:--", className }: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [dropdownPosition, setDropdownPosition] = React.useState<'bottom' | 'top'>('bottom')
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  // Generate hours (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  
  // Generate minutes (00, 15, 30, 45)
  const minutes = ['00', '15', '30', '45']

  // Parse current value
  const [selectedHour, selectedMinute] = value ? value.split(':') : ['', '']

  // Handle time selection
  const handleTimeSelect = (hour: string, minute: string) => {
    const timeStr = `${hour}:${minute}`
    onChange?.(timeStr)
    setIsOpen(false)
  }

  // Calculate dropdown position
  const calculatePosition = React.useCallback(() => {
    if (!buttonRef.current) return

    const buttonRect = buttonRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const dropdownHeight = 300 // Approximate height of dropdown
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
          <span>{value || placeholder}</span>
          <Clock className="h-4 w-4 text-gray-400" />
        </div>
      </button>

      {isOpen && (
        <div className={cn(
          "absolute left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-[200px]",
          dropdownPosition === 'bottom' ? "top-full mt-1" : "bottom-full mb-1"
        )}>
          <div className="text-xs font-medium text-gray-500 mb-3 text-center">Zeit auswählen</div>
          
          <div className="grid grid-cols-4 gap-2">
            {/* Common time slots */}
            {[
              '08:00', '08:30', '09:00', '09:30',
              '10:00', '10:30', '11:00', '11:30', 
              '12:00', '12:30', '13:00', '13:30',
              '14:00', '14:30', '15:00', '15:30',
              '16:00', '16:30', '17:00', '17:30',
              '18:00', '18:30', '19:00', '19:30'
            ].map((time) => {
              const isSelected = value === time
              
              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => onChange?.(time)}
                  className={cn(
                    "px-2 py-1.5 text-xs rounded transition-colors text-center",
                    isSelected
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-50 border border-gray-200"
                  )}
                >
                  {time}
                </button>
              )
            })}
          </div>

          {/* Custom time input for other times */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2">Andere Zeit</div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedHour}
                onChange={(e) => {
                  const minute = selectedMinute || '00'
                  handleTimeSelect(e.target.value, minute)
                }}
                className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500/20"
              >
                <option value="">--</option>
                {hours.map(hour => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </select>
              
              <span className="text-gray-400">:</span>
              
              <select
                value={selectedMinute}
                onChange={(e) => {
                  const hour = selectedHour || '00'
                  handleTimeSelect(hour, e.target.value)
                }}
                className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500/20"
              >
                <option value="">--</option>
                {minutes.map(minute => (
                  <option key={minute} value={minute}>{minute}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 