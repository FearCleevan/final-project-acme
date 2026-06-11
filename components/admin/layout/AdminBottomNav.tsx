'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BiHomeAlt,
  BiCart,
  BiPackage,
  BiUser,
  BiDotsHorizontalRounded,
  BiArchive,
  BiCollection,
  BiBarChartAlt2,
  BiCog,
  BiX,
  BiEditAlt,
} from 'react-icons/bi'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Overview',  href: '/admin/overview',  icon: BiHomeAlt  },
  { label: 'Orders',    href: '/admin/orders',     icon: BiCart     },
  { label: 'Products',  href: '/admin/products',   icon: BiPackage  },
  { label: 'Customers', href: '/admin/customers',  icon: BiUser     },
]

const MORE_ITEMS = [
  { label: 'Inventory',   href: '/admin/inventory',   icon: BiArchive       },
  { label: 'Collections', href: '/admin/collections', icon: BiCollection    },
  { label: 'Content',     href: '/admin/content/home', icon: BiEditAlt      },
  { label: 'Analytics',   href: '/admin/analytics',   icon: BiBarChartAlt2  },
  { label: 'Settings',    href: '/admin/settings',    icon: BiCog           },
]

export default function AdminBottomNav() {
  const pathname  = usePathname()
  const router    = useRouter()
  const [open, setOpen] = useState(false)

  const moreActive = MORE_ITEMS.some(i => pathname.startsWith(i.href))

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-(--admin-surface) border-t border-(--admin-border) flex items-stretch">
        {TABS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin/overview' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-w-0 transition-colors"
            >
              <Icon size={22} className={cn('transition-colors', active ? 'text-(--admin-accent)' : 'text-(--admin-text-muted)')} />
              <span className={cn('text-[10px] font-medium truncate transition-colors', active ? 'text-(--admin-accent)' : 'text-(--admin-text-muted)')}>
                {label}
              </span>
            </Link>
          )
        })}

        {/* More tab */}
        <button
          onClick={() => setOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-w-0 transition-colors"
        >
          <BiDotsHorizontalRounded size={22} className={cn('transition-colors', moreActive ? 'text-(--admin-accent)' : 'text-(--admin-text-muted)')} />
          <span className={cn('text-[10px] font-medium transition-colors', moreActive ? 'text-(--admin-accent)' : 'text-(--admin-text-muted)')}>
            More
          </span>
        </button>
      </nav>

      {/* More drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

            {/* Sheet */}
            <motion.div
              className="relative bg-(--admin-surface) rounded-t-2xl border-t border-(--admin-border) pb-safe"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              {/* Handle + header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <div className="w-10 h-1 rounded-full bg-(--admin-border) mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                <p className="text-[13px] font-semibold text-(--admin-text)">More</p>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-(--admin-surface-2) text-(--admin-text-muted)"
                >
                  <BiX size={16} />
                </button>
              </div>

              {/* Items */}
              <div className="px-4 pb-6 space-y-1 mt-2">
                {MORE_ITEMS.map(({ label, href, icon: Icon }) => {
                  const active = pathname.startsWith(href)
                  return (
                    <button
                      key={href}
                      onClick={() => { setOpen(false); router.push(href) }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors',
                        active
                          ? 'bg-(--admin-accent) text-(--admin-accent-text)'
                          : 'text-(--admin-text-soft) hover:bg-(--admin-surface-2) hover:text-(--admin-text)'
                      )}
                    >
                      <Icon size={20} className="shrink-0" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
