import { useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      const prev = window.history.scrollRestoration
      window.history.scrollRestoration = 'manual'
      return () => {
        window.history.scrollRestoration = prev
      }
    }
    return undefined
  }, [])

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' })
    document.body?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' })

    const scrollContainers = document.querySelectorAll('.main-content, .admin-main')
    scrollContainers.forEach((element) => {
      element.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
  }, [pathname, search, hash])

  return null
}
