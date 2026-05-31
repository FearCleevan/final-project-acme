'use client'

import { useEffect } from 'react'

let lockCount = 0

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    lockCount++
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    // Prevent layout shift from scrollbar disappearing
    document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`
    document.body.style.top = `-${scrollY}px`
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'

    return () => {
      lockCount--
      if (lockCount === 0) {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo({ top: scrollY, behavior: 'instant' })
      }
    }
  }, [locked])
}
