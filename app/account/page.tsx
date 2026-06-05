'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { BiShieldAlt2, BiLock, BiCheckShield } from 'react-icons/bi'
import {
  useCustomerStore,
  getCustomerOrders,
  getCustomerAddresses,
  getRefundedOrders,
  formatOrderStatus,
} from '@/store/customerStore'
import { useCrateStore } from '@/store/crateStore'
import type { CustomerOrder, CustomerAddress } from '@/lib/shopifyCustomer'
import {
  customerAddressCreateCA  as customerAddressCreate,
  customerAddressUpdateCA  as customerAddressUpdate,
  customerAddressDeleteCA  as customerAddressDelete,
  customerDefaultAddressUpdateCA as customerDefaultAddressUpdate,
} from '@/lib/shopifyCustomer'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'
import { cn } from '@/lib/utils'

type Tab = 'orders' | 'returns' | 'addresses' | 'crate'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: string, currency: string) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(parseFloat(amount))
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

const STATUS_COLOR: Record<string, string> = {
  Delivered:          'text-green-brand',
  'Partially Shipped':'text-brass-deep',
  Processing:         'text-ink-soft',
  'On Hold':          'text-ink-soft',
}

const STATUS_DOT: Record<string, string> = {
  Delivered:          'bg-green-brand',
  'Partially Shipped':'bg-brass-deep',
  Processing:         'bg-ink-soft',
  'On Hold':          'bg-ink-soft',
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: CustomerOrder }) {
  const status   = formatOrderStatus(order.fulfillmentStatus)
  const items    = order.lineItems.edges.map(e => e.node)
  const tracking = order.successfulFulfillments[0]?.trackingInfo[0]

  return (
    <div className="border border-ink-rule rounded-sm p-5 md:p-6 bg-parchment-2">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft mb-1">Order</p>
          <p className="font-mono text-[15px] text-ink-charcoal tracking-[0.06em]">{order.name}</p>
          <p className="font-mono text-[10px] text-ink-soft mt-0.5">{formatDate(order.processedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status] ?? 'bg-ink-soft'}`} />
          <span className={`font-mono text-[11px] uppercase tracking-eyebrow ${STATUS_COLOR[status] ?? 'text-ink-soft'}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="border-t border-ink-rule pt-4 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {item.variant?.image?.url && (
                <img
                  src={item.variant.image.url}
                  alt={item.title}
                  className="w-9 h-9 rounded-sm object-cover border border-ink-rule shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="font-sans text-[13px] text-ink-iron leading-snug truncate">{item.title}</p>
                {item.quantity > 1 && (
                  <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft mt-0.5">× {item.quantity}</p>
                )}
              </div>
            </div>
            {item.variant?.priceV2 && (
              <p className="font-serif text-[14px] text-brass-deep shrink-0">
                {formatPrice(item.variant.priceV2.amount, item.variant.priceV2.currencyCode)}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-ink-rule mt-4 pt-4 flex items-center justify-between gap-4 flex-wrap">
        <span className="font-serif text-[18px] text-brass-deep">
          {formatPrice(order.totalPriceV2.amount, order.totalPriceV2.currencyCode)}
        </span>
        <div className="flex gap-3">
          {tracking?.number && (
            <Link
              href={`/track-order?order=${order.name.replace('#', '')}&email=`}
              className="text-[11px] font-mono uppercase tracking-eyebrow text-brass-deep hover:text-brass transition-colors"
            >
              Track →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Address card ─────────────────────────────────────────────────────────────

interface AddressFormData {
  firstName: string; lastName: string
  address1: string; address2: string
  city: string; province: string; country: string; zip: string; phone: string
}

const EMPTY_ADDRESS: AddressFormData = {
  firstName: '', lastName: '', address1: '', address2: '',
  city: '', province: '', country: 'Canada', zip: '', phone: '',
}

function AddressCard({
  address, isDefault, onSetDefault, onEdit, onDelete,
}: {
  address: CustomerAddress
  isDefault: boolean
  onSetDefault: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className={cn('border rounded-sm p-5 bg-parchment-2', isDefault ? 'border-brass-deep/40' : 'border-ink-rule')}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-brass-deep">
          {isDefault ? 'Default address' : 'Address'}
        </span>
        <div className="flex gap-3">
          {!isDefault && (
            <button onClick={onSetDefault} className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft hover:text-brass-deep transition-colors">
              Set default
            </button>
          )}
          <button onClick={onEdit} className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft hover:text-brass-deep transition-colors">Edit</button>
          <button onClick={onDelete} className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft hover:text-error transition-colors">Remove</button>
        </div>
      </div>
      <address className="not-italic font-sans text-[14px] text-ink-iron leading-relaxed space-y-0.5">
        {(address.firstName || address.lastName) && (
          <p className="font-medium">{[address.firstName, address.lastName].filter(Boolean).join(' ')}</p>
        )}
        {address.address1 && <p>{address.address1}{address.address2 ? `, ${address.address2}` : ''}</p>}
        <p>{[address.city, address.province, address.zip].filter(Boolean).join(', ')}</p>
        <p>{address.country}</p>
        {address.phone && <p className="text-ink-soft text-[13px] pt-1">{address.phone}</p>}
      </address>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function AccountContent() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const { isLoggedIn, profile, accessToken, logout, fetchProfile, loading } = useCustomerStore()

  const crateItems    = useCrateStore(s => s.items)
  const crateTotal    = useCrateStore(s => s.total())
  const crateItemCount = useCrateStore(s => s.itemCount())
  const checkout      = useCrateStore(s => s.checkout)
  const checkoutUrl   = useCrateStore(s => s.checkoutUrl)

  const [mounted,     setMounted]     = useState(false)
  const [tab,         setTab]         = useState<Tab>((searchParams.get('tab') as Tab) ?? 'orders')
  const [editAddress, setEditAddress] = useState<CustomerAddress | null>(null)
  const [addingAddr,  setAddingAddr]  = useState(false)
  const [addrForm,    setAddrForm]    = useState<AddressFormData>(EMPTY_ADDRESS)
  const [addrSaving,  setAddrSaving]  = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !isLoggedIn) router.replace('/login?redirect=/account')
  }, [mounted, isLoggedIn, router])

  // Fetch profile on mount if we have a token but no profile yet
  useEffect(() => {
    if (mounted && isLoggedIn && !profile) fetchProfile()
  }, [mounted, isLoggedIn, profile, fetchProfile])

  if (!mounted || !isLoggedIn) return null

  const orders      = getCustomerOrders(profile)
  const addresses   = getCustomerAddresses(profile)
  const returns     = getRefundedOrders(profile)
  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'there'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const inputClass = 'w-full h-11 px-4 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron focus:outline-none focus:border-brass-deep transition-colors'
  const labelClass = 'block text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5'

  const tabBtn = (t: Tab, label: string, count?: number) => (
    <button
      onClick={() => setTab(t)}
      className={cn(
        'flex items-center gap-2 px-1 pb-3 text-[12px] font-mono uppercase tracking-eyebrow border-b-2 transition-colors whitespace-nowrap',
        tab === t ? 'text-ink-charcoal border-brass-deep' : 'text-ink-soft border-transparent hover:text-ink-iron'
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn(
          'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-mono',
          tab === t ? 'bg-brass-deep text-parchment' : 'bg-parchment-2 text-ink-soft'
        )}>{count}</span>
      )}
    </button>
  )

  // Address form handlers
  function openAddAddress() {
    setAddrForm(EMPTY_ADDRESS)
    setEditAddress(null)
    setAddingAddr(true)
  }

  function openEditAddress(addr: CustomerAddress) {
    setAddrForm({
      firstName: addr.firstName ?? '',
      lastName:  addr.lastName  ?? '',
      address1:  addr.address1  ?? '',
      address2:  addr.address2  ?? '',
      city:      addr.city      ?? '',
      province:  addr.province  ?? '',
      country:   addr.country   ?? 'Canada',
      zip:       addr.zip       ?? '',
      phone:     addr.phone     ?? '',
    })
    setEditAddress(addr)
    setAddingAddr(true)
  }

  async function saveAddress() {
    if (!accessToken) return
    setAddrSaving(true)
    if (editAddress) {
      await customerAddressUpdate(accessToken, editAddress.id, addrForm)
    } else {
      await customerAddressCreate(accessToken, addrForm)
    }
    await fetchProfile()
    setAddrSaving(false)
    setAddingAddr(false)
    setEditAddress(null)
  }

  async function deleteAddress(id: string) {
    if (!accessToken) return
    await customerAddressDelete(accessToken, id)
    await fetchProfile()
  }

  async function setDefaultAddress(id: string) {
    if (!accessToken) return
    await customerDefaultAddressUpdate(accessToken, id)
    await fetchProfile()
  }

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6 py-14">

        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-10 flex-wrap">
          <div>
            <Eyebrow className="mb-3">My account</Eyebrow>
            <h1 className="font-serif font-medium text-ink-charcoal leading-tight" style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
              {greeting}, {displayName.split(' ')[0]}.
            </h1>
            <p className="font-mono text-[12px] text-ink-soft mt-2 uppercase tracking-eyebrow">{profile?.email}</p>
          </div>
          <button
            onClick={async () => { await logout(); router.push('/') }}
            className="mt-2 min-h-11 px-6 border border-ink-rule text-ink-soft rounded-btn font-sans text-[14px] hover:border-ink-iron hover:text-ink-iron transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-ink-rule mb-10 overflow-x-auto scrollbar-none">
          {tabBtn('orders',    'Orders',    orders.length)}
          {tabBtn('returns',   'Returns',   returns.length)}
          {tabBtn('addresses', 'Addresses')}
          {tabBtn('crate',     'My Crate',  crateItemCount > 0 ? crateItemCount : undefined)}
        </div>

        {/* ── Orders tab ── */}
        {tab === 'orders' && (
          loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-40 rounded-sm bg-parchment-2 border border-ink-rule animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif italic text-[20px] text-ink-soft mb-6">No orders yet.</p>
              <Link href="/catalog" className="font-mono text-[12px] uppercase tracking-eyebrow text-brass-deep hover:text-brass transition-colors">
                Walk the catalog →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )
        )}

        {/* ── Returns tab ── */}
        {tab === 'returns' && (
          returns.length === 0 ? (
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
              {returns.map(order => <OrderCard key={order.id} order={order} />)}
              <div className="border-t border-ink-rule pt-6">
                <p className="font-sans text-[13px] text-ink-soft leading-relaxed max-w-[55ch]">
                  To initiate a new return, write to{' '}
                  <a href="mailto:hello@acmevintagesupply.ca" className="text-brass-deep hover:text-brass transition-colors">
                    hello@acmevintagesupply.ca
                  </a>
                  {' '}with your order reference. We respond within one business day.
                </p>
              </div>
            </div>
          )
        )}

        {/* ── Addresses tab ── */}
        {tab === 'addresses' && (
          <div className="max-w-130 space-y-6">

            {/* Address list */}
            {addresses.length === 0 && !addingAddr ? (
              <div className="py-14 text-center border border-dashed border-ink-rule rounded-sm">
                <p className="font-serif italic text-[20px] text-ink-soft mb-3">No address saved yet.</p>
                <p className="font-sans text-[14px] text-ink-soft max-w-[36ch] mx-auto leading-relaxed mb-6">
                  Add your shipping address here so checkout is faster next time.
                </p>
                <button
                  onClick={openAddAddress}
                  className="font-mono text-[12px] uppercase tracking-eyebrow text-brass-deep hover:text-brass transition-colors"
                >
                  + Add address
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map(addr => (
                  <AddressCard
                    key={addr.id}
                    address={addr}
                    isDefault={addr.id === profile?.defaultAddress?.id}
                    onSetDefault={() => setDefaultAddress(addr.id)}
                    onEdit={() => openEditAddress(addr)}
                    onDelete={() => deleteAddress(addr.id)}
                  />
                ))}
                {!addingAddr && (
                  <button
                    onClick={openAddAddress}
                    className="font-mono text-[12px] uppercase tracking-eyebrow text-brass-deep hover:text-brass transition-colors"
                  >
                    + Add another address
                  </button>
                )}
              </div>
            )}

            {/* Add / Edit form */}
            {addingAddr && (
              <div className="border border-brass-deep/40 rounded-sm p-5 md:p-6 bg-parchment-2">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-brass-deep">
                    {editAddress ? 'Edit address' : 'Add address'}
                  </span>
                  <button onClick={() => { setAddingAddr(false); setEditAddress(null) }}
                    className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft hover:text-ink-iron transition-colors">
                    Cancel
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>First name</label>
                      <input value={addrForm.firstName} onChange={e => setAddrForm(f => ({ ...f, firstName: e.target.value }))} className={inputClass} placeholder="Jane" />
                    </div>
                    <div>
                      <label className={labelClass}>Last name</label>
                      <input value={addrForm.lastName} onChange={e => setAddrForm(f => ({ ...f, lastName: e.target.value }))} className={inputClass} placeholder="Smith" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Street address</label>
                    <input value={addrForm.address1} onChange={e => setAddrForm(f => ({ ...f, address1: e.target.value }))} className={inputClass} placeholder="123 Main St" />
                  </div>
                  <div>
                    <label className={labelClass}>Apt / Suite <span className="normal-case tracking-normal text-ink-soft/60">(optional)</span></label>
                    <input value={addrForm.address2} onChange={e => setAddrForm(f => ({ ...f, address2: e.target.value }))} className={inputClass} placeholder="Unit 2" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>City</label>
                      <input value={addrForm.city} onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))} className={inputClass} placeholder="Toronto" />
                    </div>
                    <div>
                      <label className={labelClass}>Province</label>
                      <input value={addrForm.province} onChange={e => setAddrForm(f => ({ ...f, province: e.target.value }))} className={inputClass} placeholder="ON" />
                    </div>
                    <div>
                      <label className={labelClass}>Postal code</label>
                      <input value={addrForm.zip} onChange={e => setAddrForm(f => ({ ...f, zip: e.target.value }))} className={inputClass} placeholder="M5V 1A1" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Country</label>
                    <select value={addrForm.country} onChange={e => setAddrForm(f => ({ ...f, country: e.target.value }))}
                      className={inputClass + ' appearance-none'}>
                      {['Canada', 'United States', 'United Kingdom', 'Australia', 'New Zealand', 'Other'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Phone <span className="normal-case tracking-normal text-ink-soft/60">(optional)</span></label>
                    <input type="tel" value={addrForm.phone} onChange={e => setAddrForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} placeholder="4161234567" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveAddress} disabled={addrSaving}
                      className="flex-1 min-h-11 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[14px] font-semibold hover:bg-green-deep transition-colors disabled:opacity-60">
                      {addrSaving ? 'Saving…' : 'Save address'}
                    </button>
                    <button onClick={() => { setAddingAddr(false); setEditAddress(null) }}
                      className="min-h-11 px-5 border border-ink-rule text-ink-soft rounded-btn font-sans text-[14px] hover:border-ink-iron hover:text-ink-iron transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Trust section */}
            <div className="border border-ink-rule rounded-sm p-5 bg-parchment">
              <div className="flex items-center gap-2 mb-4">
                <BiShieldAlt2 size={16} className="text-brass-deep shrink-0" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Your data is protected</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {[
                  { icon: BiLock,       title: '256-bit TLS',    body: 'All data is encrypted in transit. No payment details are stored on our servers.' },
                  { icon: BiShieldAlt2, title: 'PCI DSS compliant', body: 'Payments are processed through Shopify Payments, certified to PCI DSS Level 1.' },
                  { icon: BiCheckShield, title: 'Never sold',    body: 'Your personal details are used solely for order fulfilment and delivery. Nothing else.' },
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
                Acme Vintage Supply is an authorised Shopify merchant. Transactions are governed by{' '}
                <a href="https://www.shopify.com/legal/privacy" target="_blank" rel="noopener noreferrer"
                  className="text-brass-deep hover:text-brass transition-colors underline">
                  Shopify&rsquo;s Privacy Policy
                </a>.
                We will never share, sell, or misuse your personal information.
              </p>
            </div>

          </div>
        )}

        {/* ── My Crate tab ── */}
        {tab === 'crate' && (
          crateItems.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-ink-rule flex items-center justify-center mx-auto mb-6">
                <span className="text-[26px] text-ink-soft font-mono">Ø</span>
              </div>
              <p className="font-serif italic text-[20px] text-ink-soft mb-3">Your crate is empty.</p>
              <p className="font-sans text-[14px] text-ink-soft mb-8">Add pieces from the catalog to start building your order.</p>
              <Link href="/catalog" className="font-mono text-[12px] uppercase tracking-eyebrow text-brass-deep hover:text-brass transition-colors">
                Walk the catalog →
              </Link>
            </div>
          ) : (
            <div className="max-w-[860px]">
              <div className="flex flex-col lg:flex-row gap-10">

                {/* Item list */}
                <div className="flex-1 divide-y divide-ink-rule">
                  {crateItems.map(item => (
                    <div key={item.product.id} className="flex items-center gap-4 py-5">
                      {item.product.images[0] && (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-sm border border-ink-rule shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-[13px] text-ink-iron leading-snug line-clamp-2">{item.product.name}</p>
                        {item.selectedFinish && item.selectedFinish !== 'Default' && (
                          <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft mt-1">{item.selectedFinish}</p>
                        )}
                        <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft mt-0.5">Qty {item.quantity}</p>
                      </div>
                      <p className="font-serif text-[15px] text-brass-deep shrink-0">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Order summary */}
                <div className="lg:w-[300px] shrink-0">
                  <div className="border border-ink-rule rounded-sm p-6 bg-parchment-2 space-y-4 sticky top-6">
                    <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Order summary</p>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex justify-between text-ink-soft font-sans">
                        <span>Subtotal ({crateItemCount} {crateItemCount === 1 ? 'item' : 'items'})</span>
                        <span className="font-serif text-ink-iron">${crateTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-ink-soft font-sans">
                        <span>Freight (straw-packed crate)</span>
                        <span className="font-mono text-[11px] uppercase tracking-eyebrow">
                          {crateTotal >= 150 ? 'Free' : '$18.00'}
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-ink-rule pt-4 flex justify-between items-baseline">
                      <span className="font-sans text-[13px] text-ink-iron font-semibold">Total · USD</span>
                      <span className="font-serif text-[22px] text-brass-deep">
                        ${(crateTotal >= 150 ? crateTotal : crateTotal + 18).toFixed(2)}
                      </span>
                    </div>
                    {crateTotal >= 150 && (
                      <p className="font-mono text-[10px] uppercase tracking-eyebrow text-green-brand">✓ Qualifies for free freight</p>
                    )}
                    <Button
                      variant="primary"
                      size="block"
                      disabled={!checkoutUrl}
                      onClick={checkout}
                    >
                      Proceed to checkout →
                    </Button>
                    <div className="space-y-1.5 pt-1">
                      {['30-day returns on whole pieces', 'Straw-packed, insured freight', 'Plain paper invoice, real return address'].map(t => (
                        <p key={t} className="flex items-center gap-2 font-sans text-[12px] text-ink-soft">
                          <span className="text-green-brand">✓</span> {t}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )
        )}

      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountContent />
    </Suspense>
  )
}
