'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BiLock, BiShieldAlt2, BiCheckShield } from 'react-icons/bi'
import { useAuthStore, Order, SavedAddress } from '@/store/authStore'
import Eyebrow from '@/components/shared/Eyebrow'
import { formatPrice, cn } from '@/lib/utils'

type Tab = 'orders' | 'returns' | 'addresses'

const STATUS_COLOR: Record<string, string> = {
  Delivered:        'text-green-brand',
  Shipped:          'text-brass-deep',
  Processing:       'text-ink-soft',
  'Return Requested': 'text-error',
  Returned:         'text-ink-soft',
}

const STATUS_DOT: Record<string, string> = {
  Delivered:          'bg-green-brand',
  Shipped:            'bg-brass-deep',
  Processing:         'bg-ink-soft',
  'Return Requested': 'bg-error',
  Returned:           'bg-ink-soft',
}

function OrderCard({ order }: { order: Order }) {
  return (
    <div className="border border-ink-rule rounded-sm p-5 md:p-6 bg-parchment-2">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft mb-1">Order reference</p>
          <p className="font-mono text-[15px] text-ink-charcoal tracking-[0.06em]">{order.id}</p>
          <p className="font-mono text-[10px] text-ink-soft mt-0.5">
            {new Date(order.date).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[order.status] ?? 'bg-ink-soft'}`} />
          <span className={`font-mono text-[11px] uppercase tracking-eyebrow ${STATUS_COLOR[order.status] ?? 'text-ink-soft'}`}>
            {order.status}
          </span>
        </div>
      </div>

      <div className="border-t border-ink-rule pt-4 space-y-2">
        {order.items.map(item => (
          <div key={item.sku} className="flex justify-between items-baseline gap-4">
            <div className="min-w-0">
              <p className="font-sans text-[13px] text-ink-iron leading-snug truncate">{item.name}</p>
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft mt-0.5">
                {item.sku} {item.qty > 1 && `× ${item.qty}`}
              </p>
            </div>
            <p className="font-serif text-[14px] text-brass-deep shrink-0">{formatPrice(item.price * item.qty)}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-ink-rule mt-4 pt-4 flex items-center justify-between gap-4 flex-wrap">
        <span className="font-serif text-[18px] text-brass-deep">{formatPrice(order.total)}</span>
        <div className="flex gap-3">
          {order.trackingRef && (
            <Link
              href={`/track-order?ref=${order.trackingRef}`}
              className="text-[11px] font-mono uppercase tracking-eyebrow text-brass-deep hover:text-brass transition-colors"
            >
              Track →
            </Link>
          )}
        </div>
      </div>

      {order.returnReason && (
        <div className="mt-4 bg-parchment border border-ink-rule rounded-sm px-4 py-3">
          <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Return reason</p>
          <p className="font-sans text-[13px] text-ink-iron leading-snug">{order.returnReason}</p>
        </div>
      )}
    </div>
  )
}

export default function AccountPage() {
  const router = useRouter()
  const { isAuthenticated, userName, userEmail, savedAddress, orders, signOut, setSavedAddress } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<Tab>('orders')
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<SavedAddress | null>(null)

  function startEdit() {
    setEditData(savedAddress ? { ...savedAddress } : {
      fullName: '', email: userEmail, phone: '', street: '', apt: '', city: '', state: '', zip: '', country: '',
    })
    setEditing(true)
  }

  function saveEdit() {
    if (editData) setSavedAddress(editData)
    setEditing(false)
  }

  function setField(key: keyof SavedAddress, value: string) {
    setEditData(d => d ? { ...d, [key]: value } : d)
  }

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (mounted && !isAuthenticated) router.replace('/')
  }, [mounted, isAuthenticated, router])

  if (!mounted || !isAuthenticated) return null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const allOrders = orders
  const returnOrders = orders.filter(o => o.status === 'Return Requested' || o.status === 'Returned')

  const tabBtn = (t: Tab, label: string, count?: number) => (
    <button
      onClick={() => setTab(t)}
      className={cn(
        'flex items-center gap-2 px-1 pb-3 text-[12px] font-mono uppercase tracking-eyebrow border-b-2 transition-colors whitespace-nowrap',
        tab === t
          ? 'text-ink-charcoal border-brass-deep'
          : 'text-ink-soft border-transparent hover:text-ink-iron'
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn(
          'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-mono',
          tab === t ? 'bg-brass-deep text-parchment' : 'bg-parchment-2 text-ink-soft'
        )}>
          {count}
        </span>
      )}
    </button>
  )

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6 py-14">

        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-10 flex-wrap">
          <div>
            <Eyebrow className="mb-3">My account</Eyebrow>
            <h1 className="font-serif font-medium text-ink-charcoal leading-tight" style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
              {greeting}, {userName.split(' ')[0]}.
            </h1>
            <p className="font-mono text-[12px] text-ink-soft mt-2 uppercase tracking-eyebrow">{userEmail}</p>
          </div>
          <button
            onClick={() => { signOut(); router.push('/') }}
            className="mt-2 min-h-11 px-6 border border-ink-rule text-ink-soft rounded-btn font-sans text-[14px] hover:border-ink-iron hover:text-ink-iron transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-ink-rule mb-10 overflow-x-auto scrollbar-none">
          {tabBtn('orders', 'Orders', allOrders.length)}
          {tabBtn('returns', 'Returns', returnOrders.length)}
          {tabBtn('addresses', 'Addresses')}
        </div>

        {/* Orders tab */}
        {tab === 'orders' && (
          allOrders.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif italic text-[20px] text-ink-soft mb-6">No orders yet.</p>
              <Link href="/catalog" className="font-mono text-[12px] uppercase tracking-eyebrow text-brass-deep hover:text-brass transition-colors">
                Walk the catalog →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {allOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )
        )}

        {/* Returns tab */}
        {tab === 'returns' && (
          returnOrders.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif italic text-[20px] text-ink-soft mb-3">No returns on record.</p>
              <p className="font-sans text-[14px] text-ink-soft max-w-[40ch] mx-auto leading-relaxed">
                If you need to return something, visit the{' '}
                <Link href="/returns" className="text-brass-deep hover:text-brass transition-colors underline">Returns page</Link>
                {' '}or{' '}
                <Link href="/contact" className="text-brass-deep hover:text-brass transition-colors underline">contact us</Link>.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {returnOrders.map(order => <OrderCard key={order.id} order={order} />)}
              <div className="border-t border-ink-rule pt-6">
                <p className="font-sans text-[13px] text-ink-soft leading-relaxed max-w-[55ch]">
                  To initiate a new return, write to{' '}
                  <a href="mailto:hello@acmelamp.co" className="text-brass-deep hover:text-brass transition-colors">hello@acmelamp.co</a>
                  {' '}with your order reference. We respond within one business day.
                </p>
              </div>
            </div>
          )
        )}

        {/* Addresses tab */}
        {tab === 'addresses' && (
          <div className="max-w-130 space-y-6">

            {/* Address card / edit form */}
            {!savedAddress && !editing ? (
              <div className="py-14 text-center border border-dashed border-ink-rule rounded-sm">
                <p className="font-serif italic text-[20px] text-ink-soft mb-3">No address saved yet.</p>
                <p className="font-sans text-[14px] text-ink-soft max-w-[36ch] mx-auto leading-relaxed mb-6">
                  Add your billing address here, or tick &ldquo;Save for next time&rdquo; during checkout.
                </p>
                <button
                  onClick={startEdit}
                  className="font-mono text-[12px] uppercase tracking-eyebrow text-brass-deep hover:text-brass transition-colors"
                >
                  + Add address
                </button>
              </div>
            ) : editing && editData ? (
              /* ── Edit / Add form ── */
              <div className="border border-brass-deep/40 rounded-sm p-5 md:p-6 bg-parchment-2">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-brass-deep">
                    {savedAddress ? 'Edit billing address' : 'Add billing address'}
                  </span>
                  <button
                    onClick={() => setEditing(false)}
                    className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft hover:text-ink-iron transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Full name + email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5">Full name</label>
                      <input value={editData.fullName} onChange={e => setField('fullName', e.target.value)}
                        placeholder="Margaret H."
                        className="w-full h-11 px-4 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron focus:outline-none focus:border-brass-deep transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5">Email</label>
                      <input type="email" value={editData.email} onChange={e => setField('email', e.target.value)}
                        placeholder="you@example.com"
                        className="w-full h-11 px-4 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron focus:outline-none focus:border-brass-deep transition-colors" />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5">Phone</label>
                    <input type="tel" value={editData.phone} onChange={e => setField('phone', e.target.value)}
                      placeholder="+61 8 7000 1873"
                      className="w-full h-11 px-4 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron focus:outline-none focus:border-brass-deep transition-colors" />
                  </div>

                  {/* Street */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5">Street address</label>
                    <input value={editData.street} onChange={e => setField('street', e.target.value)}
                      placeholder="14 Pirie Street"
                      className="w-full h-11 px-4 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron focus:outline-none focus:border-brass-deep transition-colors" />
                  </div>

                  {/* Apt */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5">
                      Apt / Suite <span className="normal-case tracking-normal text-ink-soft/60">(optional)</span>
                    </label>
                    <input value={editData.apt} onChange={e => setField('apt', e.target.value)}
                      placeholder="Unit 2"
                      className="w-full h-11 px-4 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron focus:outline-none focus:border-brass-deep transition-colors" />
                  </div>

                  {/* City / State / ZIP */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5">City</label>
                      <input value={editData.city} onChange={e => setField('city', e.target.value)}
                        placeholder="Adelaide"
                        className="w-full h-11 px-4 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron focus:outline-none focus:border-brass-deep transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5">State</label>
                      <input value={editData.state} onChange={e => setField('state', e.target.value)}
                        placeholder="SA"
                        className="w-full h-11 px-4 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron focus:outline-none focus:border-brass-deep transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5">ZIP</label>
                      <input value={editData.zip} onChange={e => setField('zip', e.target.value)}
                        placeholder="5000"
                        className="w-full h-11 px-4 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron focus:outline-none focus:border-brass-deep transition-colors" />
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5">Country</label>
                    <div className="relative">
                      <select value={editData.country} onChange={e => setField('country', e.target.value)}
                        className="w-full h-11 pl-4 pr-8 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron appearance-none focus:outline-none focus:border-brass-deep transition-colors">
                        <option value="" disabled>Select a country</option>
                        {['Australia', 'United States', 'United Kingdom', 'Canada', 'New Zealand', 'India', 'Other'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft text-[11px]">▾</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={saveEdit}
                      className="flex-1 min-h-11 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[14px] font-semibold hover:bg-green-deep transition-colors"
                    >
                      Save changes
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="min-h-11 px-5 border border-ink-rule text-ink-soft rounded-btn font-sans text-[14px] hover:border-ink-iron hover:text-ink-iron transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : savedAddress ? (
              /* ── View mode ── */
              <div className="border border-ink-rule rounded-sm p-5 md:p-6 bg-parchment-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-brass-deep">Billing address</span>
                  <button
                    onClick={startEdit}
                    className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft hover:text-brass-deep transition-colors"
                  >
                    Edit
                  </button>
                </div>
                <address className="not-italic font-sans text-[14px] text-ink-iron leading-relaxed space-y-0.5">
                  <p className="font-medium">{savedAddress.fullName}</p>
                  <p>{savedAddress.street}{savedAddress.apt ? `, ${savedAddress.apt}` : ''}</p>
                  <p>{savedAddress.city}, {savedAddress.state} {savedAddress.zip}</p>
                  <p>{savedAddress.country}</p>
                  {savedAddress.phone && <p className="text-ink-soft text-[13px] pt-1">{savedAddress.phone}</p>}
                  {savedAddress.email && <p className="text-ink-soft text-[13px]">{savedAddress.email}</p>}
                </address>
              </div>
            ) : null}

            {/* Trust assurance */}
            <div className="border border-ink-rule rounded-sm p-5 bg-parchment">
              <div className="flex items-center gap-2 mb-4">
                <BiShieldAlt2 size={16} className="text-brass-deep shrink-0" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Your data is protected</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {[
                  { icon: BiLock, title: '256-bit TLS', body: 'All data is encrypted in transit. No payment details are stored on our servers.' },
                  { icon: BiShieldAlt2, title: 'PCI DSS compliant', body: 'Payments are processed through Shopify Payments, certified to PCI DSS Level 1.' },
                  { icon: BiCheckShield, title: 'Never sold', body: 'Your personal details are used solely for order fulfilment and delivery. Nothing else.' },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="flex gap-3 items-start">
                    <Icon size={15} className="text-green-brand mt-0.5 shrink-0" />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-iron mb-0.5">{title}</p>
                      <p className="font-sans text-[12px] text-ink-soft leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="font-sans text-[11px] text-ink-soft/70 border-t border-ink-rule pt-3 leading-relaxed">
                Acme Lamp &amp; Sign Co. is an authorised Shopify merchant. Transactions are governed by{' '}
                <a href="https://www.shopify.com/legal/privacy" target="_blank" rel="noopener noreferrer"
                  className="text-brass-deep hover:text-brass transition-colors underline">
                  Shopify&rsquo;s Privacy Policy
                </a>.
                We comply with the Australian Privacy Act 1988 and will never share, sell, or misuse your personal information.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
