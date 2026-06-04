'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Nav from '@/components/nav/Nav'
import CrateDrawer from '@/components/crate/CrateDrawer'
import SearchOverlay from '@/components/shared/SearchOverlay'
import Footer from '@/components/shared/Footer'
import { useSearchOverlay } from '@/hooks/useSearchOverlay'
import { useCustomerStore } from '@/store/customerStore'
import { useLenis } from '@/hooks/useLenis'

interface ShellClientProps {
  children: React.ReactNode
}

export default function ShellClient({ children }: ShellClientProps) {
  const pathname = usePathname()
  const { isOpen, open, close, query, setQuery } = useSearchOverlay()

  useLenis()

  useEffect(() => {
    // hydrate() handles initCart internally for both guests and logged-in customers
    useCustomerStore.getState().hydrate()
  }, [])

  // Admin routes manage their own layout — skip the storefront shell entirely
  if (pathname.startsWith('/admin')) return <>{children}</>

  return (
    <>
      <Nav onSearchOpen={open} />

      <SearchOverlay
        isOpen={isOpen}
        onClose={close}
        query={query}
        onQueryChange={setQuery}
      />

      <CrateDrawer />

      <main id="main-content" className="flex-1 flex flex-col pt-16">
        {children}
      </main>

      <Footer />
    </>
  )
}
