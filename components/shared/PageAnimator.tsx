'use client'

import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function PageAnimator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex-1 flex flex-col"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  )
}
