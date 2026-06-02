'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { BiX, BiUser } from 'react-icons/bi'
import { useAuthStore } from '@/store/authStore'
import NavLinks from './NavLinks'
import Button from '@/components/shared/Button'

const catalogLinks = [
  { label: 'Oil Lamp Chimneys',    href: '/catalog?category=oil-lamp-chimneys'       },
  { label: 'Oil Lamp Shades',      href: '/catalog?category=oil-lamp-shades'         },
  { label: 'Pressure Lamps',       href: '/catalog?category=oil-lamp-pressure-lamps' },
  { label: 'Spreaders & Hardware', href: '/catalog?category=oil-lamp-spreaders'      },
  { label: 'Wicks',                href: '/catalog?category=oil-lamp-wicks'          },
  { label: 'Books & Guides',       href: '/catalog?category=oil-lamp-books'          },
  { label: 'Advertising Signs',    href: '/signs'                                    },
]

const workshopLinks = [
  { label: 'Our Story',         href: '/our-story' },
  { label: 'Heritage Timeline', href: '/heritage'  },
  { label: 'Bench Notes',       href: '/journal'   },
]

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { isAuthenticated, userName } = useAuthStore()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-ink-charcoal/40"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.nav
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.28, ease: [0.32, 0, 0.08, 1] }}
            className="fixed left-0 top-0 bottom-0 z-50 w-75 sm:w-80 bg-parchment shadow-[30px_0_60px_-30px_rgba(30,32,34,0.4)] flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-rule shrink-0">
              <div>
                <p className="font-serif text-[20px] font-bold text-ink-charcoal">
                  Acme Vintage Supply
                </p>
                <p className="text-[9px] font-mono uppercase tracking-eyebrow-wide text-ink-soft mt-0.5">
                  Antique Oil Lamps &amp; Signs
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-parchment-2 active:bg-parchment-3 transition-colors"
                aria-label="Close menu"
              >
                <BiX size={22} />
              </button>
            </div>

            {/* Main nav links */}
            <div className="flex flex-col px-6 py-5 gap-5 border-b border-ink-rule">
              <NavLinks onNavigate={onClose} />
            </div>

            {/* Catalog sub-links */}
            {/* Catalog sub-links */}
            <div className="px-6 py-5 border-b border-ink-rule">
              <p className="text-[9px] font-mono uppercase tracking-eyebrow-wide text-ink-soft mb-3">
                Browse by Category
              </p>
              <ul className="space-y-2">
                {catalogLinks.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className="text-[14px] font-sans text-ink-soft hover:text-brass-deep transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Workshop sub-links */}
            <div className="px-6 py-5 border-b border-ink-rule">
              <p className="text-[9px] font-mono uppercase tracking-eyebrow-wide text-ink-soft mb-3">
                The Workshop
              </p>
              <ul className="space-y-2">
                {workshopLinks.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className="text-[14px] font-sans text-ink-soft hover:text-brass-deep transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account section */}
            <div className="px-6 py-5 border-b border-ink-rule">
              {isAuthenticated ? (
                <Link
                  href="/account"
                  onClick={onClose}
                  className="flex items-center gap-3 group"
                >
                  <span className="w-8 h-8 rounded-full bg-green-brand flex items-center justify-center text-parchment text-[13px] font-serif font-medium shrink-0">
                    {userName ? userName[0].toUpperCase() : 'A'}
                  </span>
                  <div>
                    <p className="text-[14px] font-sans font-medium text-ink-charcoal group-hover:text-brass-deep transition-colors">
                      {userName || 'My Account'}
                    </p>
                    <p className="text-[11px] font-mono text-ink-soft uppercase tracking-eyebrow">
                      View orders &amp; addresses
                    </p>
                  </div>
                </Link>
              ) : (
                <Link
                  href="/account"
                  onClick={onClose}
                  className="flex items-center gap-3 text-ink-soft hover:text-brass-deep transition-colors"
                >
                  <BiUser size={18} />
                  <span className="text-[14px] font-sans">Sign in / Create account</span>
                </Link>
              )}
            </div>

            {/* CTA */}
            <div className="mt-auto px-6 pt-4 pb-8 flex flex-col gap-3 shrink-0">
              <Button variant="primary" size="block" href="/catalog" onClick={onClose}>
                Enter the Catalog
              </Button>
              <Button variant="ghost" size="block" href="/contact" onClick={onClose}>
                Contact a person
              </Button>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  )
}
