'use client'

import { BiSearch, BiUser, BiPackage } from 'react-icons/bi'
import { useCrateStore } from '@/store/crateStore'
import { cn } from '@/lib/utils'

interface NavActionsProps {
  onSearchOpen: () => void
}

export default function NavActions({ onSearchOpen }: NavActionsProps) {
  const { openCrate, itemCount } = useCrateStore()
  const count = itemCount()

  const iconBtn =
    'relative w-12 h-12 flex items-center justify-center rounded-full text-ink-iron hover:bg-parchment-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass'

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onSearchOpen}
        className={iconBtn}
        aria-label="Open search"
      >
        <BiSearch size={22} />
      </button>

      <button
        className={iconBtn}
        aria-label="Sign in or view account"
        onClick={() => {/* Phase 8 */}}
      >
        <BiUser size={22} />
      </button>

      <button
        onClick={openCrate}
        className={cn(iconBtn, 'relative')}
        aria-label={`Open crate — ${count} ${count === 1 ? 'item' : 'items'}`}
      >
        <BiPackage size={22} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-pill bg-green-brand text-parchment text-[10px] font-mono font-medium tabular-nums">
            {count}
          </span>
        )}
      </button>
    </div>
  )
}
