'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BiMenu } from 'react-icons/bi'
import NavLinks from './NavLinks'
import NavActions from './NavActions'
import MobileDrawer from './MobileDrawer'

interface NavProps {
  onSearchOpen: () => void
}

export default function Nav({ onSearchOpen }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 bg-parchment/92 backdrop-blur-sm border-b border-ink-rule">
        <div
          className="max-w-[1280px] mx-auto px-6 h-16 grid items-center gap-4"
          style={{ gridTemplateColumns: 'auto 1fr auto' }}
        >
          {/* Brand mark */}
          <Link href="/" className="flex flex-col leading-none group" aria-label="Acme Lamp & Sign — Home">
            <span className="font-serif text-[24px] font-medium text-ink-charcoal group-hover:text-brass-deep transition-colors">
              Acme Lamp<em className="italic text-brass-deep">&amp;</em> Sign
            </span>
            <span className="text-[10px] font-mono uppercase tracking-eyebrow-wide text-ink-soft mt-0.5">
              Est. for the long burn
            </span>
          </Link>

          {/* Desktop nav links — centered */}
          <nav
            className="hidden lg:flex items-center justify-center gap-8"
            aria-label="Main navigation"
          >
            <NavLinks />
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <NavActions onSearchOpen={onSearchOpen} />

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-12 h-12 flex items-center justify-center rounded-full text-ink-iron hover:bg-parchment-2 transition-colors ml-1"
              aria-label="Open navigation menu"
            >
              <BiMenu size={22} />
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
