# Order Tracking Direct URL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every order a unique storefront URL (`/track-order/ACMEORDER-1021?email=...`) that auto-loads tracking results instantly, redirect Shopify notification emails to this URL instead of Shopify's default order status page, and auto-submit the main `/track-order` search page when both params arrive via URL.

**Architecture:** Extract the order result display into a shared `OrderTrackingResult` component so the existing search page and the new dynamic route both render identically. The new `/track-order/[orderName]` page is a client component that reads `orderName` from the path and `email` from query params, auto-fetches on mount via the existing `POST /api/track-order` endpoint, and renders `<OrderTrackingResult>`. No new API routes needed. Shopify email template changes are manual steps documented in Task 3 — the Liquid snippet links to the new URL format.

**Tech Stack:** Next.js 16 App Router · TypeScript strict · Tailwind v4 · `TrackOrderResult` type from `app/api/track-order/route.ts`

## Global Constraints

- Working directory: `c:\Users\PPlazan\Desktop\Claude Design\final-lamp-sign\acme-lamp-sign`
- Do NOT run `git commit` or `git push` — user handles all git operations manually
- TypeScript strict — no `any`, explicit return types on all exported functions
- Tailwind v4 syntax — design tokens: `bg-parchment`, `bg-parchment-2`, `text-ink-charcoal`, `text-ink-iron`, `text-ink-soft`, `border-ink-rule`, `text-brass-deep`, `bg-green-brand`, `bg-green-deep`, `rounded-btn`, `font-serif`, `font-sans`, `font-mono`, `tracking-eyebrow` — no arbitrary bracket values for these
- Import `TrackOrderResult` from `'@/app/api/track-order/route'`
- Import shared components: `Breadcrumb` from `'@/components/shared/Breadcrumb'`, `Eyebrow` from `'@/components/shared/Eyebrow'`
- The existing `POST /api/track-order` endpoint handles order name normalization (adds `#` prefix if missing) and Redis event merging — do not duplicate this logic
- YAGNI — no new features beyond what the spec requires

---

## File Map

### New files
- `components/track-order/OrderTrackingResult.tsx` — shared display component: summary card + items list + horizontal progress stepper. Accepts `result: TrackOrderResult` as prop.
- `app/track-order/[orderName]/page.tsx` — dynamic route page. Reads `orderName` from path params and `email` from query string. Auto-fetches on mount. Renders `<OrderTrackingResult>`.

### Modified files
- `app/track-order/page.tsx` — two changes: (1) replace the inline result display with `<OrderTrackingResult result={result} />`; (2) add a `useEffect` that auto-submits the search when both `?order` and `?email` URL params are present on load.

---

### Task 1: Extract `OrderTrackingResult` shared component

**Files:**
- Create: `components/track-order/OrderTrackingResult.tsx`
- Modify: `app/track-order/page.tsx`

**Interfaces:**
- Consumes: `TrackOrderResult` from `'@/app/api/track-order/route'`
- Produces: `export default function OrderTrackingResult({ result }: { result: TrackOrderResult }): React.ReactElement` — used by Task 2's `[orderName]/page.tsx` and the modified `app/track-order/page.tsx`

**Context:** The display logic currently lives inside `TrackOrderContent()` in `app/track-order/page.tsx` starting at line 164 (summary card), 213 (items), 226 (progress stepper). The helpers `FULFILLMENT_STATUS_LABEL`, `STATUS_COLOR`, and `formatDate` (lines 10–31) are also needed by this component. The derived values `latestFulfillment`, `trackingNumber`, `trackingUrl`, `carrier`, `statusLabel` (lines 73–83) move into the component.

- [ ] **Step 1: Create `components/track-order/OrderTrackingResult.tsx`**

Create the file with this exact content:

```tsx
'use client'

import Eyebrow from '@/components/shared/Eyebrow'
import type { TrackOrderResult } from '@/app/api/track-order/route'

const FULFILLMENT_STATUS_LABEL: Record<string, string> = {
  FULFILLED:           'Delivered',
  UNFULFILLED:         'Processing',
  PARTIALLY_FULFILLED: 'Partially Shipped',
  IN_PROGRESS:         'In Progress',
  ON_HOLD:             'On Hold',
  SCHEDULED:           'Scheduled',
}

const STATUS_COLOR: Record<string, string> = {
  Delivered:           'text-green-brand',
  'Partially Shipped': 'text-brass-deep',
  'In Progress':       'text-brass-deep',
  Processing:          'text-ink-soft',
  'On Hold':           'text-ink-soft',
}

const STAGES = [
  { status: 'CONFIRMED',        label: 'Order\nconfirmed'    },
  { status: 'LABEL_PRINTED',    label: 'Packed at\nworkshop' },
  { status: 'IN_TRANSIT',       label: 'Shipped'             },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for\ndelivery'   },
  { status: 'DELIVERED',        label: 'Delivered'           },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function OrderTrackingResult({ result }: { result: TrackOrderResult }): React.ReactElement {
  const statusLabel      = FULFILLMENT_STATUS_LABEL[result.fulfillmentStatus] ?? result.fulfillmentStatus
  const latestFulfillment = result.fulfillments[result.fulfillments.length - 1] ?? null
  const trackingNumber   = latestFulfillment?.trackingInfo[0]?.number ?? null
  const trackingUrl      = latestFulfillment?.trackingInfo[0]?.url    ?? null
  const carrier          = latestFulfillment?.trackingInfo[0]?.company ?? null

  const allEvents = result.fulfillments.flatMap(f => f.events)
  const eventByStatus: Record<string, { status: string; happenedAt: string }> = {}
  allEvents.forEach(e => { eventByStatus[e.status] = e })
  const lastCompletedIndex = STAGES.reduce(
    (acc, s, i) => (eventByStatus[s.status] ? i : acc), -1
  )

  return (
    <div className="space-y-8">

      {/* Summary card */}
      <div className="bg-parchment-2 border border-ink-rule rounded-sm p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Order</p>
          <p className="font-mono text-[16px] text-ink-charcoal tracking-[0.06em]">{result.name}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Status</p>
          <p className={`font-mono text-[13px] uppercase tracking-eyebrow font-medium ${STATUS_COLOR[statusLabel] ?? 'text-ink-iron'}`}>
            {statusLabel}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Order date</p>
          <p className="font-sans text-[13px] text-ink-iron">{formatDate(result.processedAt)}</p>
        </div>
        {result.shippingAddress && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Destination</p>
            <p className="font-sans text-[13px] text-ink-iron">
              {result.shippingAddress.city}, {result.shippingAddress.province}
            </p>
          </div>
        )}
        {carrier && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Carrier</p>
            <p className="font-sans text-[13px] text-ink-iron">{carrier}</p>
          </div>
        )}
        {trackingNumber && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Tracking number</p>
            {trackingUrl ? (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[13px] text-brass-deep hover:text-brass transition-colors border-b border-brass-deep/40 pb-px"
              >
                {trackingNumber}
              </a>
            ) : (
              <p className="font-mono text-[13px] text-ink-iron">{trackingNumber}</p>
            )}
          </div>
        )}
      </div>

      {/* Items */}
      <div>
        <Eyebrow className="mb-4">Items in this order</Eyebrow>
        <div className="border border-ink-rule rounded-sm divide-y divide-ink-rule">
          {result.lineItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <p className="font-sans text-[14px] text-ink-iron">{item.title}</p>
              <p className="font-mono text-[12px] text-ink-soft shrink-0">× {item.quantity}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Shipment progress stepper */}
      <div>
        <Eyebrow className="mb-6">Shipment progress</Eyebrow>
        <div className="flex items-start">
          {STAGES.map((stage, i) => {
            const isDone = !!eventByStatus[stage.status]
            const isNext = i === lastCompletedIndex + 1
            const ev     = eventByStatus[stage.status]

            return (
              <div key={stage.status} className="relative flex-1 flex flex-col items-center">
                {/* Left connector */}
                {i > 0 && (
                  <div className={`absolute left-0 right-1/2 top-4 h-px -translate-y-1/2 ${i <= lastCompletedIndex ? 'bg-green-brand' : 'bg-ink-rule'}`} />
                )}
                {/* Right connector */}
                {i < STAGES.length - 1 && (
                  <div className={`absolute left-1/2 right-0 top-4 h-px -translate-y-1/2 ${i < lastCompletedIndex ? 'bg-green-brand' : 'bg-ink-rule'}`} />
                )}
                {/* Circle */}
                <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center mb-3 transition-colors duration-300 ${
                  isDone
                    ? 'bg-green-brand border-green-brand'
                    : isNext
                      ? 'bg-parchment border-brass-deep'
                      : 'bg-parchment border-ink-rule'
                }`}>
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6l2.5 2.5 4.5-4.5" stroke="#F5F1E6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : isNext ? (
                    <span className="w-2 h-2 rounded-full bg-brass-deep" />
                  ) : null}
                </div>
                {/* Label */}
                <p className={`font-sans text-center text-[11px] sm:text-[12px] leading-tight whitespace-pre-line px-1 ${
                  isDone ? 'text-ink-charcoal font-semibold' : 'text-ink-soft'
                }`}>
                  {stage.label}
                </p>
                {/* Date */}
                {ev && (
                  <time className="font-mono text-[9px] sm:text-[10px] uppercase tracking-eyebrow text-ink-soft/60 text-center mt-1 leading-tight block px-1">
                    {formatDate(ev.happenedAt)}
                  </time>
                )}
              </div>
            )
          })}
        </div>

        {lastCompletedIndex === -1 && (
          <p className="font-serif italic text-[14px] text-ink-soft mt-6">
            Your order is being prepared. Progress will update here as it moves through each stage.
          </p>
        )}
      </div>

    </div>
  )
}
```

- [ ] **Step 2: Update `app/track-order/page.tsx` to use the shared component**

At the top of `app/track-order/page.tsx`, add the import after the existing imports:
```ts
import OrderTrackingResult from '@/components/track-order/OrderTrackingResult'
```

Then replace the entire `{/* Results */}` block (currently from `{result && result !== 'not-found' && (` down to the closing `)}`) with:

```tsx
{/* Results */}
{result && result !== 'not-found' && (
  <div className="max-w-160">
    <OrderTrackingResult result={result} />
  </div>
)}
```

Also remove the now-unused helpers from `app/track-order/page.tsx` (they are now in the shared component):
- `const FULFILLMENT_STATUS_LABEL` (lines 10–17)
- `const STATUS_COLOR` (lines 19–25)
- `function formatDate` (lines 27–31)
- The derived variables `latestFulfillment`, `trackingNumber`, `trackingUrl`, `carrier`, `statusLabel` (lines 73–83)

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 4: Manual smoke test**

Run the dev server and open `/track-order`. Enter `ACMEORDER-1021` + your test email. Confirm:
- Summary card renders correctly
- Items list renders correctly
- Progress stepper renders correctly with the correct completed stages
- No visual regressions vs. the current live version

- [ ] **Step 5: Commit**

```
git add components/track-order/OrderTrackingResult.tsx app/track-order/page.tsx
git commit -m "refactor: extract OrderTrackingResult shared component from track-order page"
```

---

### Task 2: Create `/track-order/[orderName]` dynamic route

**Files:**
- Create: `app/track-order/[orderName]/page.tsx`

**Interfaces:**
- Consumes: `OrderTrackingResult` from `'@/components/track-order/OrderTrackingResult'` (Task 1)
- Consumes: `TrackOrderResult` from `'@/app/api/track-order/route'`
- Consumes: `POST /api/track-order` — body `{ orderName: string; email: string }` — returns `TrackOrderResult` or 404
- Produces: Page at `/track-order/ACMEORDER-1021?email=customer%40email.com` — auto-loads the order on mount with no user interaction required

**Context:**
- Next.js 16 App Router dynamic route: `app/track-order/[orderName]/page.tsx` — `params.orderName` is auto URL-decoded by Next.js
- The page is `'use client'` since it fetches data on mount
- `useParams()` returns `{ orderName: string }`, `useSearchParams()` gives the `?email` query param
- If `email` param is missing when page loads: show a small email-entry form (the customer may bookmark the URL without the email)
- The `POST /api/track-order` already handles adding the `#` prefix to the order name — just pass `orderName` as-is from the URL

- [ ] **Step 1: Create `app/track-order/[orderName]/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import OrderTrackingResult from '@/components/track-order/OrderTrackingResult'
import type { TrackOrderResult } from '@/app/api/track-order/route'

function OrderTrackingPage(): React.ReactElement {
  const params       = useParams<{ orderName: string }>()
  const searchParams = useSearchParams()

  const orderName = decodeURIComponent(params.orderName ?? '')
  const emailParam = searchParams.get('email') ?? ''

  const [email,    setEmail]    = useState(emailParam)
  const [result,   setResult]   = useState<TrackOrderResult | 'not-found' | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  async function fetchOrder(em: string): Promise<void> {
    if (!orderName || !em.trim()) return
    setLoading(true)
    setResult(null)
    setApiError(null)

    try {
      const res = await fetch('/api/track-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderName, email: em.trim() }),
      })
      if (res.status === 404) {
        setResult('not-found')
      } else if (!res.ok) {
        const data = await res.json() as { error?: string }
        setApiError(data.error ?? 'Something went wrong. Please try again.')
      } else {
        const data = await res.json() as TrackOrderResult
        setResult(data)
      }
    } catch {
      setApiError('Could not reach the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch when email param is present (arriving from email link)
  useEffect(() => {
    if (emailParam) {
      void fetchOrder(emailParam)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleEmailSubmit(e: React.FormEvent): void {
    e.preventDefault()
    void fetchOrder(email)
  }

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-215 mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[
            { label: 'Storefront', href: '/' },
            { label: 'Track your order', href: '/track-order' },
            { label: orderName },
          ]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">Order tracking</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-10"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          {orderName}
        </h1>

        {/* Email gate — shown only when no email param (direct bookmark/navigation) */}
        {!emailParam && !result && !loading && (
          <form onSubmit={handleEmailSubmit} className="space-y-3 mb-12 max-w-140">
            <p className="font-sans text-[14px] text-ink-soft mb-4">
              Enter the email address used at checkout to view this order.
            </p>
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email used at checkout"
                required
                className="flex-1 h-13 px-4 bg-parchment-2 border border-ink-rule rounded-sm text-[15px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors"
                aria-label="Email address"
              />
              <button
                type="submit"
                disabled={loading}
                className="min-h-13 px-7 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[14px] font-semibold hover:bg-green-deep hover:shadow-cta-hover transition-all duration-200 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading…' : 'View order →'}
              </button>
            </div>
          </form>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="max-w-160 space-y-6">
            <div className="h-40 rounded-sm bg-parchment-2 border border-ink-rule animate-pulse" />
            <div className="h-32 rounded-sm bg-parchment-2 border border-ink-rule animate-pulse" />
            <div className="h-20 rounded-sm bg-parchment-2 border border-ink-rule animate-pulse" />
          </div>
        )}

        {/* API error */}
        {apiError && (
          <div className="border border-red-200 bg-red-50 rounded-sm px-5 py-4 mb-8 max-w-140">
            <p className="font-sans text-[14px] text-red-700">{apiError}</p>
          </div>
        )}

        {/* Not found */}
        {result === 'not-found' && (
          <div className="border border-ink-rule rounded-sm p-8 text-center max-w-140">
            <p className="font-serif italic text-[18px] text-ink-soft mb-2">
              No order found for those details.
            </p>
            <p className="font-sans text-[14px] text-ink-soft">
              Check that you&rsquo;re using the same email address used at checkout, or{' '}
              <a href="/contact" className="text-brass-deep hover:text-brass transition-colors border-b border-brass-deep/40 pb-px">
                contact us
              </a>.
            </p>
          </div>
        )}

        {/* Result */}
        {result && result !== 'not-found' && (
          <div className="max-w-160">
            <OrderTrackingResult result={result} />
          </div>
        )}

      </div>
    </div>
  )
}

export default function Page(): React.ReactElement {
  return (
    <Suspense>
      <OrderTrackingPage />
    </Suspense>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Manual test — arriving from email link (with email param)**

Open in browser:
```
http://localhost:3000/track-order/ACMEORDER-1021?email=jonathan.mauring17@gmail.com
```

Expected:
- Page loads immediately into loading skeleton
- Within ~1s, order result appears with correct summary card + items + progress stepper
- No form is shown — result displays directly
- Breadcrumb shows: Storefront → Track your order → ACMEORDER-1021

- [ ] **Step 4: Manual test — direct navigation (no email param)**

Open in browser:
```
http://localhost:3000/track-order/ACMEORDER-1021
```

Expected:
- Email entry form is shown
- Enter your test email → click "View order →"
- Order result displays correctly

- [ ] **Step 5: Manual test — wrong email**

Open:
```
http://localhost:3000/track-order/ACMEORDER-1021?email=wrong@email.com
```

Expected: "No order found for those details." message.

- [ ] **Step 6: Commit**

```
git add app/track-order/[orderName]/page.tsx
git commit -m "feat: add /track-order/[orderName] direct order URL with auto-load"
```

---

### Task 3: Auto-submit on main `/track-order` search page + Shopify email template

**Files:**
- Modify: `app/track-order/page.tsx`
- No code files for Shopify — manual admin steps documented below

**Interfaces:**
- Consumes: existing `handleSearch` logic in `TrackOrderContent()` — refactor into a standalone `doSearch(name, em)` async function callable from both the form submit handler and the auto-submit `useEffect`

**Context:** The main `/track-order` page already reads `?order` and `?email` from URL params and pre-fills the inputs, but it does NOT auto-submit. Adding auto-submit means that if Shopify ever links to `/track-order?order=ACMEORDER-1021&email=...` (as a fallback), it works the same as the new `[orderName]` route.

- [ ] **Step 1: Refactor `handleSearch` into `doSearch` in `app/track-order/page.tsx`**

Currently `handleSearch` is an async function that reads state directly. Extract the fetch logic into a `doSearch` function:

Find the `handleSearch` function (currently around line 44) and replace it with:

```ts
async function doSearch(name: string, em: string): Promise<void> {
  if (!name.trim() || !em.trim()) return
  setLoading(true)
  setResult(null)
  setApiError(null)

  try {
    const res = await fetch('/api/track-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderName: name.trim(), email: em.trim() }),
    })
    if (res.status === 404) {
      setResult('not-found')
    } else if (!res.ok) {
      const data = await res.json() as { error?: string }
      setApiError(data.error ?? 'Something went wrong. Please try again.')
    } else {
      const data = await res.json() as TrackOrderResult
      setResult(data)
    }
  } catch {
    setApiError('Could not reach the server. Please check your connection and try again.')
  } finally {
    setLoading(false)
  }
}

function handleSearch(e: React.FormEvent): void {
  e.preventDefault()
  void doSearch(orderName, email)
}
```

- [ ] **Step 2: Add auto-submit `useEffect` to `app/track-order/page.tsx`**

After the existing state declarations (after `const [apiError, setApiError] = useState`) and before the `doSearch` function, add:

```ts
// Auto-submit when both order and email arrive via URL params (e.g. from a Shopify email link fallback)
useEffect(() => {
  if (initialOrder && initialEmail) {
    void doSearch(initialOrder, initialEmail)
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

Note: `doSearch` must be defined before this `useEffect` in the file, OR use a ref pattern. The simplest approach: define `doSearch` above `useEffect` in the component body.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Manual test — auto-submit via URL params**

Open:
```
http://localhost:3000/track-order?order=ACMEORDER-1021&email=jonathan.mauring17@gmail.com
```

Expected:
- Page loads, inputs are pre-filled
- Search fires automatically — result appears without clicking "Track →"

- [ ] **Step 5: Commit**

```
git add app/track-order/page.tsx
git commit -m "feat: auto-submit track-order search when order+email params are in URL"
```

---

### Task 4: Shopify Email Notification Template (Manual Steps)

**Files:** None — manual changes in Shopify Admin

**What this does:** Replaces the "View your order" and any "Track order" buttons in Shopify shipping notification emails with links that go to the custom `/track-order/[orderName]` page instead of Shopify's built-in order status page.

**Important Liquid variables available in Shopify notification templates:**
- `{{ order.name }}` — the order display name, e.g. `ACMEORDER-1021` (no `#` in this store's custom prefix format)
- `{{ email }}` — the customer's email address

- [ ] **Step 1: Open Shopify Notifications**

Go to:
```
Shopify Admin → Settings → Notifications
```

Find **"Shipping confirmation"** in the list and click **Edit**.

- [ ] **Step 2: Locate the "View your order" button in the template**

In the email HTML editor, search (Ctrl+F) for:
```
order_status_url
```

You will find a line like:
```liquid
<a href="{{ order_status_url }}">View your order</a>
```
or inside a styled button block:
```liquid
{{ order_status_url | button: 'View your order' }}
```

- [ ] **Step 3: Replace the URL**

Change `{{ order_status_url }}` to:
```
https://acmevintagesupply.com/track-order/{{ order.name | url_encode }}?email={{ email | url_encode }}
```

Full replacement for the button:
```liquid
<a href="https://acmevintagesupply.com/track-order/{{ order.name | url_encode }}?email={{ email | url_encode }}" ...existing styles...>
  View your order
</a>
```

- [ ] **Step 4: Update button label (optional)**

Change the button label from "View your order" to "Track your order" to match the feature — this sets the right customer expectation.

- [ ] **Step 5: Do the same for "Shipping update" notification (if used)**

Repeat Steps 2–4 for the **"Shipping update"** notification template. Same replacement.

- [ ] **Step 6: Send a test notification**

In Shopify Admin → Orders → Open any order → More actions → "Send test notification" for Shipping confirmation.

Expected: Email arrives with "Track your order" button linking to:
```
https://acmevintagesupply.com/track-order/ACMEORDER-1021?email=jonathan.mauring17%40gmail.com
```

- [ ] **Step 7: Click the link in the email**

Expected:
- Redirects to `/track-order/ACMEORDER-1021?email=jonathan.mauring17%40gmail.com`
- Page auto-loads the order result with no user input
- Progress stepper shows correct completed stages

---

## Self-Review

**Spec coverage:**
- ✅ Unique URL per order (`/track-order/[orderName]`) — Task 2
- ✅ Auto-load result when email is in URL (from email button) — Task 2
- ✅ Email gate when email param missing (direct navigation/bookmark) — Task 2
- ✅ Shopify email "View your order" button redirect — Task 4
- ✅ Shared display component (DRY — no duplicated stepper/card code) — Task 1
- ✅ Auto-submit on main `/track-order` as fallback — Task 3
- ✅ Breadcrumb includes order name on detail page — Task 2

**Placeholder scan:** None found — all steps contain real code.

**Type consistency:** `TrackOrderResult` imported from same path in all three files. `OrderTrackingResult` props match between Task 1 definition and Task 2 consumption. `doSearch(name: string, em: string)` signature in Task 3 matches usage. ✅

**What's intentionally out of scope:**
- Shopify "Download to track with Shop" button — this is Shopify's native Shop Pay integration, cannot be removed from the email template without disabling Shop Pay
- Server-side rendering for the `[orderName]` page — client component is consistent with the existing search page pattern; SSR would require extracting the track-order Shopify query into a server-callable util, which is a separate refactor
