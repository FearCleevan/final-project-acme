'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { BiSearch, BiBell, BiX, BiPackage, BiCog, BiLogOut, BiBox, BiReceipt, BiUser } from 'react-icons/bi'
import LogoutModal from '@/components/admin/shared/LogoutModal'
import { mockAdminProducts, mockCustomers } from '@/lib/admin/mockData'
import type { AdminOrder, AdminNotification } from '@/lib/admin/types'
import { formatCurrency } from '@/lib/admin/utils'

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onClose])
}

const MAX_RESULTS = 3

type SearchResult = {
  products: typeof mockAdminProducts
  orders:   AdminOrder[]
  customers: typeof mockCustomers
}

function SearchDropdown({
  results, hasResults, onResultClick, query,
}: {
  results: SearchResult
  hasResults: boolean
  onResultClick: (href: string) => void
  query: string
}) {
  return (
    <div className="absolute left-0 right-0 top-full mt-2 bg-(--admin-surface) border border-(--admin-border) rounded-xl shadow-xl z-50 overflow-hidden" onMouseDown={e => e.stopPropagation()}>
      {!hasResults ? (
        <div className="px-4 py-8 text-center">
          <p className="text-[13px] text-(--admin-text-soft)">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-[11px] text-(--admin-text-muted) mt-1">Try a product name, order number, or customer email.</p>
        </div>
      ) : (
        <div className="divide-y divide-(--admin-border)">
          {results.products.length > 0 && (
            <section>
              <p className="px-4 pt-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-(--admin-text-muted)">Products</p>
              {results.products.map(p => (
                <button
                  key={p.id}
                  onClick={() => onResultClick(`/admin/products/${p.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-(--admin-surface-2) transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-md bg-(--admin-surface-2) border border-(--admin-border) flex items-center justify-center shrink-0">
                    <BiBox size={13} className="text-(--admin-text-muted)" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-(--admin-text) truncate">{p.title}</p>
                    <p className="text-[11px] text-(--admin-text-muted)">{p.sku}</p>
                  </div>
                  <span className="text-[12px] font-semibold text-(--admin-text) shrink-0">{formatCurrency(p.price)}</span>
                </button>
              ))}
            </section>
          )}

          {results.orders.length > 0 && (
            <section>
              <p className="px-4 pt-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-(--admin-text-muted)">Orders</p>
              {results.orders.map(o => (
                <button
                  key={o.id}
                  onClick={() => onResultClick(`/admin/orders/${o.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-(--admin-surface-2) transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-md bg-(--admin-surface-2) border border-(--admin-border) flex items-center justify-center shrink-0">
                    <BiReceipt size={13} className="text-(--admin-text-muted)" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-(--admin-text)">{o.id}</p>
                    <p className="text-[11px] text-(--admin-text-muted) truncate">{o.customer.name}</p>
                  </div>
                  <span className="text-[12px] font-semibold text-(--admin-text) shrink-0">{formatCurrency(o.total)}</span>
                </button>
              ))}
            </section>
          )}

          {results.customers.length > 0 && (
            <section>
              <p className="px-4 pt-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-(--admin-text-muted)">Customers</p>
              {results.customers.map(c => (
                <button
                  key={c.id}
                  onClick={() => onResultClick(`/admin/customers/${c.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-(--admin-surface-2) transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-(--admin-surface-2) border border-(--admin-border) flex items-center justify-center shrink-0">
                    <BiUser size={13} className="text-(--admin-text-muted)" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-(--admin-text) truncate">{c.name}</p>
                    <p className="text-[11px] text-(--admin-text-muted) truncate">{c.email}</p>
                  </div>
                  <span className="text-[11px] text-(--admin-text-muted) shrink-0">{c.orders} orders</span>
                </button>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminTopbar() {
  const router = useRouter()
  const [search,      setSearch]      = useState('')
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [notifOpen,   setNotifOpen]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [showLogout,    setShowLogout]    = useState(false)
  const [loggingOut,    setLoggingOut]    = useState(false)
  const [ownerName,     setOwnerName]     = useState('')
  const [ownerEmail,    setOwnerEmail]    = useState('')
  const [notifications, setNotifications] = useState<(AdminNotification & { age: string })[]>([])

  useEffect(() => {
    fetch('/api/admin/shop')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setOwnerName(d.name); setOwnerEmail(d.email) } })
  }, [])

  useEffect(() => {
    function toAge(ts: string): string {
      const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60_000)
      if (mins < 1)    return 'just now'
      if (mins < 60)   return `${mins}m ago`
      if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
      return `${Math.floor(mins / 1440)}d ago`
    }
    function fetchNotifications() {
      fetch('/api/admin/notifications')
        .then(r => r.ok ? r.json() : [])
        .then((d: AdminNotification[]) => {
          if (Array.isArray(d)) setNotifications(d.map(n => ({ ...n, age: toAge(n.timestamp) })))
        })
        .catch(() => {})
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [])

  const notifRef    = useRef<HTMLDivElement>(null)
  const profileRef  = useRef<HTMLDivElement>(null)
  const searchRef   = useRef<HTMLDivElement>(null)

  useClickOutside(notifRef,   () => setNotifOpen(false))
  useClickOutside(profileRef, () => setProfileOpen(false))
  useClickOutside(searchRef,  () => setSearch(''))

  const notifCount = notifications.length

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return null
    const products = mockAdminProducts.filter(p =>
      p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    ).slice(0, MAX_RESULTS)
    const orders: AdminOrder[] = [] // live order search — wired in a future sprint
    const customers = mockCustomers.filter(c =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    ).slice(0, MAX_RESULTS)
    return { products, orders, customers }
  }, [search])

  const hasResults = searchResults && (
    searchResults.products.length + searchResults.orders.length + searchResults.customers.length > 0
  )

  function handleResultClick(href: string) {
    setSearch('')
    setSearchOpen(false)
    router.push(href)
  }

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <>
    <header
      className="fixed top-0 left-0 right-0 lg:left-60 flex items-center gap-3 px-4 sm:px-6 bg-(--admin-surface) border-b border-(--admin-border) z-20"
      style={{ height: 'var(--admin-topbar-h)' }}
    >
      {/* Mobile: store name */}
      {!searchOpen && (
        <p className="lg:hidden text-[13px] font-semibold text-(--admin-text) truncate flex-1">
          Acme Vintage Supply
        </p>
      )}

      {/* Desktop: search */}
      <div ref={searchRef} className="hidden lg:flex flex-1 max-w-sm relative">
        <BiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted) pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products, orders, customers…"
          className="w-full h-8 pl-8 pr-3 bg-(--admin-surface-2) border border-(--admin-border) rounded-md text-[12px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 transition-colors"
        />
        {searchResults && (
          <SearchDropdown
            results={searchResults}
            hasResults={!!hasResults}
            onResultClick={handleResultClick}
            query={search.trim()}
          />
        )}
      </div>

      {/* Mobile: expandable search */}
      {searchOpen && (
        <div className="lg:hidden flex-1 relative">
          <BiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted) pointer-events-none" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full h-8 pl-8 pr-3 bg-(--admin-surface-2) border border-(--admin-border) rounded-md text-[12px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
          />
          {searchResults && (
            <SearchDropdown
              results={searchResults}
              hasResults={!!hasResults}
              onResultClick={handleResultClick}
              query={search.trim()}
            />
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        {/* Mobile search toggle */}
        <button
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md text-(--admin-text-soft) hover:bg-(--admin-surface-2) transition-colors"
          onClick={() => { setSearchOpen(o => !o); setSearch('') }}
          aria-label="Search"
        >
          {searchOpen ? <BiX size={18} /> : <BiSearch size={18} />}
        </button>

        {/* ── Notifications ── */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(o => !o); setProfileOpen(false) }}
            className="relative w-8 h-8 flex items-center justify-center rounded-md text-(--admin-text-soft) hover:bg-(--admin-surface-2) hover:text-(--admin-text) transition-colors"
            aria-label="Notifications"
          >
            <BiBell size={18} />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-(--admin-green)" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-88 bg-(--admin-surface) border border-(--admin-border) rounded-xl shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-(--admin-border)">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-(--admin-text)">Notifications</p>
                  {notifCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-(--admin-green-bg) text-[10px] font-semibold text-(--admin-green)">
                      {notifCount}
                    </span>
                  )}
                </div>
                <button onClick={() => setNotifOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-md text-(--admin-text-muted) hover:bg-(--admin-surface-2) transition-colors">
                  <BiX size={15} />
                </button>
              </div>

              {/* Body */}
              {notifCount === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-[13px] text-(--admin-text-soft)">All caught up</p>
                  <p className="text-[11px] text-(--admin-text-muted) mt-1">No new orders, alerts, or customers.</p>
                </div>
              ) : (
                <div className="divide-y divide-(--admin-border) max-h-80 overflow-y-auto">
                  {notifications.map(n => {
                    const Icon      = n.type === 'new_order' ? BiReceipt : n.type === 'new_customer' ? BiUser : BiPackage
                    const iconBg    = n.type === 'new_order' ? 'bg-(--admin-green-bg)' : n.type === 'new_customer' ? 'bg-(--admin-accent)/10' : 'bg-(--admin-amber-bg)'
                    const iconColor = n.type === 'new_order' ? 'text-(--admin-green)' : n.type === 'new_customer' ? 'text-(--admin-accent)' : 'text-(--admin-amber)'
                    return (
                      <button
                        key={n.id}
                        onClick={() => { setNotifOpen(false); router.push(n.href) }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-(--admin-surface-2) transition-colors text-left"
                      >
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${iconBg}`}>
                          <Icon size={14} className={iconColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-(--admin-text) truncate">{n.title}</p>
                          <p className="text-[11px] text-(--admin-text-muted) truncate">{n.subtitle}</p>
                        </div>
                        <span className="text-[10px] text-(--admin-text-muted) shrink-0 ml-2">{n.age}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Footer */}
              {notifCount > 0 && (
                <div className="px-4 py-3 border-t border-(--admin-border) flex gap-4">
                  <button onClick={() => { setNotifOpen(false); router.push('/admin/orders') }}
                    className="text-[12px] text-(--admin-accent) hover:opacity-70 transition-opacity">
                    Orders →
                  </button>
                  <button onClick={() => { setNotifOpen(false); router.push('/admin/inventory') }}
                    className="text-[12px] text-(--admin-accent) hover:opacity-70 transition-opacity">
                    Inventory →
                  </button>
                  <button onClick={() => { setNotifOpen(false); router.push('/admin/customers') }}
                    className="text-[12px] text-(--admin-accent) hover:opacity-70 transition-opacity">
                    Customers →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Profile ── */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setProfileOpen(o => !o); setNotifOpen(false) }}
            className="w-7 h-7 rounded-full bg-(--admin-accent) flex items-center justify-center hover:opacity-80 transition-opacity"
            aria-label="Profile menu"
          >
            <span className="text-(--admin-accent-text) text-[11px] font-semibold">
              {ownerName ? ownerName[0].toUpperCase() : '?'}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-(--admin-surface) border border-(--admin-border) rounded-xl shadow-xl z-50 overflow-hidden">
              {/* User info */}
              <div className="px-4 py-3 border-b border-(--admin-border)">
                <p className="text-[13px] font-semibold text-(--admin-text)">{ownerName || 'Store Owner'}</p>
                <p className="text-[11px] text-(--admin-text-muted) truncate">{ownerEmail || 'Admin'}</p>
              </div>

              {/* Actions */}
              <div className="p-1">
                <button
                  onClick={() => { setProfileOpen(false); router.push('/admin/settings') }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-(--admin-text-soft) hover:bg-(--admin-surface-2) hover:text-(--admin-text) transition-colors"
                >
                  <BiCog size={15} className="shrink-0" />
                  Settings
                </button>
                <button
                  onClick={() => { setProfileOpen(false); setShowLogout(true) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-(--admin-red) hover:bg-(--admin-red-bg) transition-colors"
                >
                  <BiLogOut size={15} className="shrink-0" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

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
