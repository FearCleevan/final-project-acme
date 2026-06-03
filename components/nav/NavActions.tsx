'use client'

import { useEffect, useState } from 'react'
import { BiSearch, BiUser, BiPackage } from 'react-icons/bi'
import { useCrateStore } from '@/store/crateStore'
import { useCustomerStore } from '@/store/customerStore'
import { cn } from '@/lib/utils'
import AccountDropdown from './AccountDropdown'

interface NavActionsProps {
  onSearchOpen: () => void
}

export default function NavActions({ onSearchOpen }: NavActionsProps) {
  const { openCrate, itemCount } = useCrateStore()
  const { isLoggedIn, profile } = useCustomerStore()
  const [mounted, setMounted] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const count   = mounted ? itemCount() : 0
  const authed  = mounted ? isLoggedIn : false
  const initial = profile?.firstName ? profile.firstName[0].toUpperCase() : profile?.email?.[0]?.toUpperCase() ?? ''

  const iconBtn =
    'relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-ink-iron hover:bg-parchment-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass'

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onSearchOpen}
        className={iconBtn}
        aria-label="Open search"
      >
        <BiSearch size={22} />
      </button>

      {/* Account button — shows initial avatar when signed in */}
      <div className="relative">
        <button
          className={cn(iconBtn, authed && 'bg-parchment-2')}
          aria-label={authed ? `Account — ${userName}` : 'Sign in or create account'}
          aria-expanded={accountOpen}
          aria-haspopup="dialog"
          onMouseDown={(e) => {
            e.stopPropagation()
            setAccountOpen(o => !o)
          }}
        >
          {authed ? (
            <span className="w-7 h-7 rounded-full bg-green-brand text-[#F5F1E6] text-[13px] font-mono font-medium flex items-center justify-center">
              {initial}
            </span>
          ) : (
            <BiUser size={22} />
          )}
        </button>

        {accountOpen && (
          <AccountDropdown onClose={() => setAccountOpen(false)} />
        )}
      </div>

      {/* Crate button */}
      <button
        onClick={openCrate}
        className={cn(iconBtn, 'relative')}
        aria-label={`Open crate — ${count} ${count === 1 ? 'item' : 'items'}`}
      >
        <BiPackage size={22} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 flex items-center justify-center rounded-pill bg-green-brand text-parchment text-[10px] font-mono font-medium tabular-nums">
            {count}
          </span>
        )}
      </button>
    </div>
  )
}
