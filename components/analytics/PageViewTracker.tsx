'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/admin')) return

    const productMatch = pathname.match(/^\/catalog\/([^/]+)$/)
    const productHandle = productMatch?.[1] ?? undefined

    fetch('/api/track/pageview', {
      method:    'POST',
      headers:   { 'Content-Type': 'application/json' },
      body:      JSON.stringify({ path: pathname, productHandle }),
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}
