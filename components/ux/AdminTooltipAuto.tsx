"use client"

import React, { useEffect, useRef, useState } from "react"

type AdminTooltipAutoProps = {
  delayMs?: number
}

// Lightweight global tooltip that appears after a delay when hovering
// buttons or elements that look clickable. It prefers explicit text from
// data-tooltip / title / aria-label, and falls back to the element text.
export default function AdminTooltipAuto({ delayMs = 2000 }: AdminTooltipAutoProps) {
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState("")
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const timerRef = useRef<number | null>(null)
  const targetRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const isClickable = (el: HTMLElement | null) => {
      if (!el) return false
      const role = el.getAttribute("role")
      const tag = el.tagName.toLowerCase()
      const hasOnclick = (el as any).onclick || el.getAttribute("onClick")
      return (
        tag === "button" ||
        el.hasAttribute("data-tooltip") ||
        role === "button" ||
        hasOnclick ||
        el.closest("button,[role=button]") !== null
      )
    }

    const getTooltipText = (el: HTMLElement | null): string => {
      if (!el) return ""
      const explicit = el.getAttribute("data-tooltip") || el.getAttribute("title") || el.getAttribute("aria-label")
      if (explicit && explicit.trim()) return explicit.trim()
      // fallback to first non-empty word(s) of innerText
      const label = (el.innerText || "").trim().replace(/\s+/g, " ")
      // limit to ~24 chars to keep tooltip compact
      return label.length > 0 ? label.slice(0, 24) : ""
    }

    const clearTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const hide = () => {
      clearTimer()
      setVisible(false)
      setText("")
      targetRef.current = null
    }

    const showAfterDelay = (el: HTMLElement) => {
      clearTimer()
      const label = getTooltipText(el)
      if (!label) return
      targetRef.current = el
      timerRef.current = window.setTimeout(() => {
        // compute position (top-center of element)
        const rect = el.getBoundingClientRect()
        const x = Math.round(rect.left + rect.width / 2)
        const y = Math.round(Math.max(8, rect.top) - 8) // above element
        setPos({ x, y })
        setText(label)
        setVisible(true)
      }, delayMs)
    }

    const onMouseOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement) || null
      const clickable = (el && isClickable(el)) ? el : (el?.closest("button,[role=button],[data-tooltip]") as HTMLElement | null)
      if (clickable) {
        showAfterDelay(clickable)
      }
    }

    const onMouseOut = (e: MouseEvent) => {
      const fromEl = e.target as HTMLElement | null
      const toEl = e.relatedTarget as HTMLElement | null
      if (!targetRef.current) return hide()
      
      // Don't hide if moving within the same button or its children
      if (fromEl && targetRef.current.contains(fromEl) && toEl && targetRef.current.contains(toEl)) {
        return
      }
      
      // Don't hide if the target element still contains the mouse
      if (toEl && targetRef.current.contains(toEl)) {
        return
      }
      
      // Hide if we left the button entirely
      if (!toEl || !targetRef.current.contains(toEl)) {
        hide()
      }
    }

    const onScrollOrClick = () => hide()

    document.addEventListener("mouseover", onMouseOver, true)
    document.addEventListener("mouseout", onMouseOut, true)
    document.addEventListener("scroll", onScrollOrClick, true)
    document.addEventListener("click", onScrollOrClick, true)

    return () => {
      document.removeEventListener("mouseover", onMouseOver, true)
      document.removeEventListener("mouseout", onMouseOut, true)
      document.removeEventListener("scroll", onScrollOrClick, true)
      document.removeEventListener("click", onScrollOrClick, true)
      clearTimer()
    }
  }, [delayMs])

  if (!visible || !text) return null

  return (
    <div
      style={{ position: "fixed", left: pos.x, top: pos.y, transform: "translate(-50%, -100%)" }}
      className="z-[9999] pointer-events-none select-none px-2 py-1 rounded-md bg-black/85 text-white text-xs shadow-lg"
    >
      {text}
    </div>
  )
}


