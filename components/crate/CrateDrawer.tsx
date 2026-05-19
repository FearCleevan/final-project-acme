'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BiX } from 'react-icons/bi'
import { useCrateStore } from '@/store/crateStore'
import CrateItem from './CrateItem'
import CrateSummary from './CrateSummary'
import Button from '@/components/shared/Button'

export default function CrateDrawer() {
  const { isOpen, closeCrate, items } = useCrateStore()
  const closeRef = useRef<HTMLButtonElement>(null)

  /* Focus trap — move focus into drawer on open */
  useEffect(() => {
    if (isOpen) closeRef.current?.focus()
  }, [isOpen])

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeCrate()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, closeCrate])

  /* Lock body scroll while open */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Scrim */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-ink-charcoal/40"
            onClick={closeCrate}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Your crate"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.32, 0, 0.08, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[360px] bg-parchment shadow-search-overlay flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-rule">
              <div>
                <h2 className="font-serif text-[22px] font-medium text-ink-charcoal">
                  Your crate
                </h2>
                <p className="text-[10px] font-mono uppercase tracking-eyebrow text-brass-deep mt-0.5">
                  {items.length} {items.length === 1 ? 'piece' : 'pieces'} selected
                </p>
              </div>
              <button
                ref={closeRef}
                onClick={closeCrate}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-parchment-2 transition-colors text-ink-iron"
                aria-label="Close crate"
              >
                <BiX size={22} />
              </button>
            </div>

            {/* Items */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
                <div className="w-16 h-16 rounded-full border-2 border-ink-rule flex items-center justify-center">
                  <span className="text-[24px] text-ink-soft font-mono">Ø</span>
                </div>
                <p className="font-serif italic text-[15px] text-ink-soft leading-relaxed max-w-[26ch]">
                  Your crate is empty. Come back with something worth lighting tonight.
                </p>
                <Button variant="ghost" size="small" onClick={closeCrate}>
                  Continue browsing
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6">
                  {items.map(item => (
                    <CrateItem key={item.product.id} item={item} />
                  ))}
                </div>
                <CrateSummary onClose={closeCrate} />
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
