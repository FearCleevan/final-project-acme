'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { BiX } from 'react-icons/bi'
import NavLinks from './NavLinks'
import Button from '@/components/shared/Button'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
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
            className="fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-parchment shadow-[30px_0_60px_-30px_rgba(30,32,34,0.4)] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-rule">
              <div>
                <p className="font-serif text-[20px] font-medium text-ink-charcoal">
                  Acme Lamp<em className="italic text-brass-deep">&amp;</em>Sign
                </p>
                <p className="text-[9px] font-mono uppercase tracking-eyebrow-wide text-ink-soft mt-0.5">
                  Est. for the long burn
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-parchment-2 transition-colors"
                aria-label="Close menu"
              >
                <BiX size={22} />
              </button>
            </div>

            <div className="flex flex-col px-6 py-6 gap-6">
              <NavLinks onNavigate={onClose} />
            </div>

            <div className="mt-auto px-6 pb-8 flex flex-col gap-3">
              <Button variant="primary" size="block" href="/catalog" onClick={onClose}>
                Enter the Catalog
              </Button>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  )
}
