'use client'

import { useState, useEffect } from 'react'
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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={[
          'fixed top-0 left-0 right-0 z-30 bg-parchment border-b border-ink-rule transition-shadow duration-200',
          scrolled ? 'shadow-[0_1px_12px_-4px_rgba(30,32,34,0.12)]' : 'shadow-none',
        ].join(' ')}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand mark */}
          <Link href="/" className="flex flex-col leading-none group shrink-0" aria-label="Acme Vintage Supply — Home">
            <span className="font-serif text-[22px] sm:text-[26px] lg:text-[30px] font-bold text-ink-charcoal group-hover:text-brass-deep transition-colors whitespace-nowrap">
              Acme Vintage Supply
            </span>
            <span className="hidden sm:block text-[10px] font-mono uppercase tracking-eyebrow-wide text-ink-soft mt-0.5">
              Antique Oil Lamps &amp; Signs
            </span>
          </Link>

          {/* Desktop nav links — centered, only takes space when visible */}
          <nav
            className="hidden lg:flex flex-1 items-center justify-center gap-8"
            aria-label="Main navigation"
          >
            <NavLinks />
          </nav>

          {/* Actions — always pinned to the right */}
          <div className="flex items-center gap-1 shrink-0">
            <NavActions onSearchOpen={onSearchOpen} />

            {/* Hamburger — below lg only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-ink-iron hover:bg-parchment-2 transition-colors ml-1"
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
