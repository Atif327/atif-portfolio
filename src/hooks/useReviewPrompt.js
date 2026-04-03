import { useEffect, useRef, useState } from 'react'

export const REVIEW_KEY = 'atif_review_submitted'
export const REVIEW_DISMISSED_KEY = 'atif_review_dismissed'

function hasWindow() {
  return typeof window !== 'undefined'
}

function getStorageFlag(key) {
  if (!hasWindow()) return false
  return window.localStorage.getItem(key) === 'true'
}

export default function useReviewPrompt({
  delayRangeMs = [30000, 60000],
  enableDismissMemory = true,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const hasTriggeredRef = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!hasWindow()) return undefined

    const hasReviewed = getStorageFlag(REVIEW_KEY)
    const dismissed = getStorageFlag(REVIEW_DISMISSED_KEY)

    if (hasReviewed) return undefined
    if (enableDismissMemory && dismissed) return undefined

    const [minDelay, maxDelay] = Array.isArray(delayRangeMs) && delayRangeMs.length === 2
      ? delayRangeMs
      : [30000, 60000]

    const safeMinDelay = Math.max(0, Number(minDelay) || 30000)
    const safeMaxDelay = Math.max(safeMinDelay, Number(maxDelay) || 60000)
    const delay = Math.floor(safeMinDelay + Math.random() * (safeMaxDelay - safeMinDelay))

    timerRef.current = window.setTimeout(() => {
      hasTriggeredRef.current = true
      setIsOpen(true)
    }, delay)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [delayRangeMs, enableDismissMemory])

  const markReviewed = () => {
    if (!hasWindow()) return
    window.localStorage.setItem(REVIEW_KEY, 'true')
    setIsOpen(false)
  }

  const dismissPrompt = () => {
    if (hasWindow() && enableDismissMemory) {
      window.localStorage.setItem(REVIEW_DISMISSED_KEY, 'true')
    }
    setIsOpen(false)
  }

  return {
    isOpen,
    markReviewed,
    dismissPrompt,
  }
}
