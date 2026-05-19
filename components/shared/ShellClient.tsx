'use client'

import Nav from '@/components/nav/Nav'
import CrateDrawer from '@/components/crate/CrateDrawer'
import SearchOverlay from '@/components/shared/SearchOverlay'
import Footer from '@/components/shared/Footer'
import { useSearchOverlay } from '@/hooks/useSearchOverlay'

interface ShellClientProps {
  children: React.ReactNode
}

export default function ShellClient({ children }: ShellClientProps) {
  const { isOpen, open, close, query, setQuery } = useSearchOverlay()

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

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <Footer />
    </>
  )
}
