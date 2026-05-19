'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Eyebrow from '@/components/shared/Eyebrow'
import PageTransition from '@/components/shared/PageTransition'
import { formatPrice } from '@/lib/utils'

const mockOrders = [
  {
    id: 'ACME-2614-SP',
    date: '2026-02-14',
    status: 'Delivered',
    items: [
      { name: 'Cattaraugus Brass Center-Draft Lamp', sku: 'L-1873-CB', price: 248 },
      { name: 'Clear Beaded Chimney, 7-inch', sku: 'G-0042-CB', price: 38 },
    ],
    total: 286,
  },
  {
    id: 'ACME-2591-SP',
    date: '2025-11-30',
    status: 'Delivered',
    items: [
      { name: 'Coleman Lantern Co. Porcelain Sign', sku: 'S-0014-PO', price: 195 },
    ],
    total: 195,
  },
  {
    id: 'ACME-2540-SP',
    date: '2025-09-08',
    status: 'Delivered',
    items: [
      { name: 'No. 2 Cold-Blast Lantern Burner', sku: 'H-0031-NI', price: 64 },
      { name: 'Milk-White Cased Shade, 10-inch', sku: 'G-0018-MW', price: 74 },
    ],
    total: 138,
  },
]

const mockAddresses = [
  {
    label: 'Default',
    name: 'Margaret H.',
    line1: '14 Pirie Street',
    line2: 'Adelaide, SA 5000',
    country: 'Australia',
  },
  {
    label: 'Workshop',
    name: 'Margaret H.',
    line1: '7 Light Square',
    line2: 'Adelaide, SA 5000',
    country: 'Australia',
  },
]

const statusColor: Record<string, string> = {
  Delivered: 'text-green-brand',
  Shipped: 'text-brass-deep',
  Processing: 'text-ink-soft',
}

export default function AccountPage() {
  const router = useRouter()
  const { isAuthenticated, userName, userEmail, signOut } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) router.replace('/')
  }, [mounted, isAuthenticated, router])

  if (!mounted || !isAuthenticated) return null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  function handleSignOut() {
    signOut()
    router.push('/')
  }

  return (
    <PageTransition>
      <div className="bg-parchment min-h-screen">
        <div className="max-w-[1280px] mx-auto px-6 py-14">

          {/* Header */}
          <div className="flex items-start justify-between gap-6 mb-14 flex-wrap">
            <div>
              <Eyebrow className="mb-3">My account</Eyebrow>
              <h1
                className="font-serif font-medium text-ink-charcoal leading-tight"
                style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
              >
                {greeting}.
              </h1>
              <p className="font-mono text-[12px] text-ink-soft mt-2 uppercase tracking-eyebrow">
                {userEmail}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="mt-2 min-h-[44px] px-6 bg-transparent border border-ink-rule text-ink-soft rounded-btn font-sans text-[14px] hover:border-ink-iron hover:text-ink-iron transition-colors"
            >
              Sign out
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 xl:gap-16 items-start">

            {/* Order history */}
            <div>
              <Eyebrow className="mb-6">Order history</Eyebrow>
              <div className="space-y-4">
                {mockOrders.map(order => (
                  <div
                    key={order.id}
                    className="border border-ink-rule rounded-sm p-5 md:p-6 bg-parchment-2"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-eyebrow text-ink-soft mb-1">
                          Order reference
                        </p>
                        <p className="font-mono text-[15px] text-ink-charcoal tracking-[0.06em]">
                          {order.id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono text-[11px] uppercase tracking-eyebrow ${statusColor[order.status] ?? 'text-ink-soft'}`}>
                          {order.status}
                        </p>
                        <p className="font-mono text-[11px] text-ink-soft mt-0.5">
                          {new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-ink-rule pt-4 space-y-2">
                      {order.items.map(item => (
                        <div key={item.sku} className="flex justify-between items-baseline gap-4">
                          <div>
                            <p className="font-sans text-[13px] text-ink-iron leading-snug">{item.name}</p>
                            <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft mt-0.5">{item.sku}</p>
                          </div>
                          <p className="font-serif text-[14px] text-brass-deep shrink-0">{formatPrice(item.price)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-ink-rule mt-4 pt-4 flex justify-between items-baseline">
                      <span className="font-mono text-[11px] uppercase tracking-eyebrow text-ink-soft">Order total</span>
                      <span className="font-serif text-[18px] text-brass-deep">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved addresses */}
            <div>
              <Eyebrow className="mb-6">Saved addresses</Eyebrow>
              <div className="space-y-4">
                {mockAddresses.map(addr => (
                  <div
                    key={addr.label}
                    className="border border-ink-rule rounded-sm p-5 bg-parchment-2"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-[10px] uppercase tracking-eyebrow text-brass-deep">
                        {addr.label}
                      </span>
                      <button className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft hover:text-ink-iron transition-colors">
                        Edit
                      </button>
                    </div>
                    <address className="not-italic font-sans text-[13px] text-ink-iron leading-relaxed">
                      <p className="font-medium">{addr.name}</p>
                      <p>{addr.line1}</p>
                      <p>{addr.line2}</p>
                      <p>{addr.country}</p>
                    </address>
                  </div>
                ))}

                <button className="w-full min-h-[48px] border border-dashed border-ink-rule rounded-sm text-[12px] font-mono uppercase tracking-eyebrow text-ink-soft hover:border-ink-iron hover:text-ink-iron transition-colors">
                  + Add address
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageTransition>
  )
}
