'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BiUser, BiPackage, BiRevision, BiMapPin, BiLogOut } from 'react-icons/bi'
import { useCustomerStore, getCustomerOrders } from '@/store/customerStore'

interface AccountDropdownProps {
  onClose: () => void
}

const profileLinks = [
  { icon: BiPackage,  label: 'Order history',  href: '/account?tab=orders'    },
  { icon: BiRevision, label: 'Returns',         href: '/account?tab=returns'   },
  { icon: BiMapPin,   label: 'Saved addresses', href: '/account?tab=addresses' },
  { icon: BiUser,     label: 'Track an order',  href: '/track-order'           },
]

export default function AccountDropdown({ onClose }: AccountDropdownProps) {
  const router  = useRouter()
  const { isLoggedIn, profile, logout } = useCustomerStore()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSignOut() {
    await logout()
    onClose()
    router.push('/')
  }

  const orders       = getCustomerOrders(profile)
  const activeOrders = orders.filter(o => o.fulfillmentStatus === 'UNFULFILLED' || o.fulfillmentStatus === 'IN_PROGRESS').length
  const displayName  = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || profile?.email || 'My Account'
  const initial      = profile?.firstName?.[0]?.toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div
      ref={panelRef}
      className="fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-32px)] sm:w-75 sm:absolute sm:left-auto sm:translate-x-0 sm:right-0 sm:top-[calc(100%+8px)] bg-parchment border border-ink-rule rounded-sm shadow-search-overlay z-50"
      role="dialog"
      aria-label="Account"
    >
      {isLoggedIn ? (
        /* ── Signed-in panel ── */
        <>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-rule">
            <div className="w-10 h-10 rounded-full bg-green-brand flex items-center justify-center text-[#F5F1E6] text-[16px] font-serif font-medium shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="font-serif text-[16px] font-medium text-ink-charcoal truncate">{displayName}</p>
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft truncate">{profile?.email}</p>
            </div>
          </div>

          <nav className="py-2" aria-label="Account navigation">
            {profileLinks.map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={onClose}
                className="flex items-center gap-3 px-5 py-2.5 text-[14px] font-sans text-ink-iron hover:bg-parchment-2 transition-colors"
              >
                <Icon size={16} className="text-brass-deep shrink-0" />
                <span>{label}</span>
                {label === 'Order history' && activeOrders > 0 && (
                  <span className="ml-auto text-[10px] font-mono text-brass-deep bg-parchment-2 px-2 py-0.5 rounded-pill">
                    {activeOrders} active
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="border-t border-ink-rule p-3 flex gap-2">
            <Link
              href="/account"
              onClick={onClose}
              className="flex-1 h-9 flex items-center justify-center rounded-sm bg-green-brand text-[#F5F1E6] text-[12px] font-mono uppercase tracking-eyebrow hover:bg-green-deep transition-colors"
            >
              View profile
            </Link>
            <button
              onClick={handleSignOut}
              className="h-9 px-3 flex items-center gap-1.5 rounded-sm border border-ink-rule text-ink-soft text-[12px] font-mono uppercase tracking-eyebrow hover:border-ink-iron hover:text-ink-iron transition-colors"
              aria-label="Sign out"
            >
              <BiLogOut size={14} />
              Sign out
            </button>
          </div>
        </>
      ) : (
        /* ── Not signed in ── */
        <div className="p-5 space-y-4">
          <p className="font-serif italic text-[16px] text-ink-soft leading-snug">
            Sign in to view your orders, track shipments, and manage your account.
          </p>
          <Link
            href="/login"
            onClick={onClose}
            className="flex items-center justify-center w-full min-h-12 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[14px] font-semibold hover:bg-green-deep transition-colors"
          >
            Sign in →
          </Link>
          <Link
            href="/login?tab=register"
            onClick={onClose}
            className="flex items-center justify-center w-full min-h-11 border border-ink-rule text-ink-iron rounded-btn font-sans text-[14px] hover:border-ink-iron hover:bg-parchment-2 transition-colors"
          >
            Create account
          </Link>
          <div className="border-t border-ink-rule pt-3">
            <Link
              href="/track-order"
              onClick={onClose}
              className="flex items-center gap-2 text-[12px] font-mono uppercase tracking-eyebrow text-brass-deep hover:text-brass transition-colors"
            >
              <BiPackage size={14} />
              Track an order
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
