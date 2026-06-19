'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BiHomeAlt,
  BiCart,
  BiPackage,
  BiArchive,
  BiCollection,
  BiUser,
  BiBarChartAlt2,
  BiCog,
  BiLogOut,
  BiSun,
  BiMoon,
  BiEditAlt,
  BiStar,
} from 'react-icons/bi'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import LogoutModal from '@/components/admin/shared/LogoutModal'

const NAV_STORE = [
  { label: 'Settings', href: '/admin/settings', icon: BiCog },
]

interface NavItemProps {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
  active: boolean
}

function NavItem({ label, href, icon: Icon, badge, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors group',
        active
          ? 'bg-(--admin-accent) text-(--admin-accent-text)'
          : 'text-(--admin-text-soft) hover:bg-(--admin-surface-2) hover:text-(--admin-text)'
      )}
    >
      <Icon size={16} className="shrink-0" />
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className={cn(
          'text-[10px] px-1.5 py-0.5 rounded-full',
          active
            ? 'bg-(--admin-accent-text)/20 text-(--admin-accent-text)'
            : 'bg-(--admin-border) text-(--admin-text-soft)'
        )}>
          {badge}
        </span>
      )}
    </Link>
  )
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  const [showLogout,   setShowLogout]   = useState(false)
  const [loggingOut,   setLoggingOut]   = useState(false)
  const [ownerName,    setOwnerName]    = useState('')
  const [ownerEmail,   setOwnerEmail]   = useState('')
  const [unfulfilledCount,   setUnfulfilledCount]   = useState(0)
  const [pendingReviewCount, setPendingReviewCount] = useState(0)

  useEffect(() => {
    fetch('/api/admin/shop')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setOwnerName(d.name); setOwnerEmail(d.email) } })
  }, [])

  useEffect(() => {
    fetch('/api/admin/orders')
      .then(r => r.ok ? r.json() : [])
      .then((orders: { fulfillmentStatus: string }[]) => {
        setUnfulfilledCount(orders.filter(o => o.fulfillmentStatus === 'unfulfilled').length)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/admin/reviews?filter=pending')
      .then(r => r.ok ? r.json() : [])
      .then((reviews: unknown[]) => setPendingReviewCount(reviews.length))
      .catch(() => {})
  }, [])

  const NAV_MAIN: Array<{ label: string; href: string; icon: React.ElementType; badge?: number; activePrefix?: string }> = [
    { label: 'Overview',    href: '/admin/overview',    icon: BiHomeAlt                                          },
    { label: 'Orders',      href: '/admin/orders',      icon: BiCart,        badge: unfulfilledCount || undefined },
    { label: 'Products',    href: '/admin/products',    icon: BiPackage                                          },
    { label: 'Inventory',   href: '/admin/inventory',   icon: BiArchive                                          },
    { label: 'Collections', href: '/admin/collections', icon: BiCollection                                       },
    { label: 'Content',     href: '/admin/content/home', icon: BiEditAlt,    activePrefix: '/admin/content'      },
    { label: 'Customers',   href: '/admin/customers',   icon: BiUser                                             },
    { label: 'Analytics',   href: '/admin/analytics',   icon: BiBarChartAlt2                                     },
    { label: 'Reviews',     href: '/admin/reviews',     icon: BiStar, badge: pendingReviewCount || undefined      },
  ]

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <>
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 flex-col bg-(--admin-surface) border-r border-(--admin-border)"
        style={{ width: 'var(--admin-sidebar-w)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-(--admin-border)" style={{ height: 'var(--admin-topbar-h)' }}>
          <div className="w-6 h-6 rounded-sm bg-(--admin-accent) flex items-center justify-center">
            <span className="text-(--admin-accent-text) text-[10px] font-bold">A</span>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-(--admin-text) leading-tight truncate">Acme Vintage Supply</p>
            <p className="text-[10px] text-(--admin-text-muted) uppercase tracking-wider">Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="px-3 mb-1.5 text-[10px] uppercase tracking-widest text-(--admin-text-muted)">Main</p>
          {NAV_MAIN.map(item => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname === item.href || (item.href !== '/admin/overview' && pathname.startsWith(item.activePrefix ?? item.href))}
            />
          ))}

          <div className="pt-4">
            <p className="px-3 mb-1.5 text-[10px] uppercase tracking-widest text-(--admin-text-muted)">Store</p>
            {NAV_STORE.map(item => (
              <NavItem
                key={item.href}
                {...item}
                active={pathname === item.href}
              />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-(--admin-border) space-y-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-(--admin-text-soft) hover:bg-(--admin-surface-2) hover:text-(--admin-text) transition-colors"
          >
            {mounted && theme === 'dark' ? <BiSun size={16} /> : <BiMoon size={16} />}
            <span>{mounted && theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <div className="flex items-center justify-between px-3 py-2">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-(--admin-text) truncate">{ownerName || 'Store Owner'}</p>
              <p className="text-[10px] text-(--admin-text-muted) truncate">{ownerEmail || 'Admin'}</p>
            </div>
            <button
              onClick={() => setShowLogout(true)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-(--admin-text-muted) hover:text-(--admin-red) hover:bg-(--admin-red-bg) transition-colors"
              aria-label="Log out"
            >
              <BiLogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {showLogout && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogout(false)}
          loading={loggingOut}
        />
      )}
    </>
  )
}
