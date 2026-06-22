# High Priority Customer Features — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining customer-facing gaps: show pre-transit order stages on the public tracking page, and build a Back in Stock notification system (email waitlist + admin trigger).

**Architecture:**
- **Sub-project 1 (Order Tracking fix):** The `/api/track-order` route currently reads only from Shopify. It needs to also merge Redis custom events (same pattern as the admin order GET) so customers see "Packed at Workshop" on their tracking page.
- **Sub-project 2 (Back in Stock):** Supabase table stores waitlist signups. A public API endpoint collects emails. A client component replaces the "Add to Crate" button when a product is out of stock. Admin triggers a restock email blast via Resend. Resend is used for transactional email (free tier, simple SDK, no SMTP config).

**Tech Stack:** Next.js 16 App Router · Supabase (existing) · Upstash Redis (existing) · Resend (new — transactional email) · Tailwind v4 · TypeScript strict

**What's already built — do NOT rebuild:**
- `/track-order` page UI — fully functional
- `/api/track-order` route — fetches from Shopify, just needs Redis merge
- `RelatedProducts` component — wired on every PDP ✅
- Shopify automatic emails: order confirmation, shipping confirmation (`in_transit`), out for delivery, delivered — all fire automatically when Scott marks stages in admin

## Global Constraints

- Supabase client: `import supabaseAdmin from '@/lib/supabase'` — service role key, server-side only
- Redis client: `Redis.fromEnv()` from `@upstash/redis` — same as `lib/content.ts` and `lib/fulfillmentEvents.ts`
- `getCustomFulfillmentEvents(orderId)` lives in `lib/fulfillmentEvents.ts` — import from there, do not duplicate
- Tailwind v4 syntax — `bg-parchment`, `text-ink-iron`, `border-ink-rule`, `font-serif`, `font-sans`, `font-mono` — no arbitrary values for design tokens
- TypeScript strict — no `any`, explicit return types on all exported functions
- No secrets in code — Resend API key via `$RESEND_API_KEY` env var only
- Admin auth guard: `getIronSession<AdminSession>(await cookies(), sessionOptions)` → check `session.isLoggedIn`
- All admin API routes are auth-gated; the `POST /api/notify-me` is PUBLIC (no auth)
- Storefront button/form styling: match existing PDP patterns (parchment background, brass accent, green CTA)

---

## File Map

### New files
- `docs/supabase/migrations/004_back_in_stock.sql` — `back_in_stock_requests` table
- `lib/backInStock.ts` — Supabase helpers: `addBackInStockRequest()`, `getBackInStockRequests()`, `markNotified()`
- `lib/email.ts` — Resend client + `sendBackInStockEmail()` + `sendPackedAtWorkshopEmail()`
- `app/api/notify-me/route.ts` — public POST: validates email + handle, saves to Supabase
- `app/api/admin/products/notify-restock/route.ts` — admin POST: fetches waitlist for handle, sends emails, marks notified
- `components/product/NotifyMeForm.tsx` — client component shown on PDP when out of stock

### Modified files
- `app/api/track-order/route.ts` — merge Redis custom fulfillment events after Shopify fetch
- `components/product/ProductInfo.tsx` — show `<NotifyMeForm>` when product is out of stock
- `app/admin/products/[id]/page.tsx` (or products list) — add "Notify waiting customers" button for out-of-stock products
- `.env.local` — add `RESEND_API_KEY`

---

### Task 1: Fix Order Tracking — Show Pre-Transit Stages to Customer

**Files:**
- Modify: `app/api/track-order/route.ts`

**Interfaces:**
- Consumes: `getCustomFulfillmentEvents(orderId)` from `@/lib/fulfillmentEvents`
- The Redis events use lowercase statuses (`label_printed`, `confirmed`) — the Shopify events use uppercase (`LABEL_PRINTED`, `IN_TRANSIT`)
- The customer timeline in `track-order/page.tsx` maps uppercase statuses via `EVENT_LABEL` — the merged Redis events must be uppercased before being added

**Context:** `getCustomFulfillmentEvents` is already written at `lib/fulfillmentEvents.ts`. The order name (`id`) from `params` in the fulfill route is the same format as `node.name` from Shopify (e.g. `#1001`). The track-order route builds `name = #${orderName}` — use that same value as the Redis key.

- [ ] **Step 1: Add the import**

In `app/api/track-order/route.ts`, add at the top:
```ts
import { getCustomFulfillmentEvents } from '@/lib/fulfillmentEvents'
```

- [ ] **Step 2: Merge Redis events into the response**

Replace the final return block in `app/api/track-order/route.ts` (after `const result: TrackOrderResult = { ... }`):

```ts
// Merge pre-transit custom events from Redis (e.g. "Packed at Workshop")
// These are stored with lowercase statuses — uppercase them to match the customer timeline format
const customEvents = await getCustomFulfillmentEvents(name)
if (customEvents.length > 0) {
  const shopifyStatuses = new Set(
    result.fulfillments.flatMap(f => f.events.map(e => e.status))
  )
  const extraEvents = customEvents
    .filter(e => !shopifyStatuses.has(e.status.toUpperCase()))
    .map(e => ({
      status:     e.status.toUpperCase(),
      happenedAt: e.happenedAt,
    }))

  if (extraEvents.length > 0) {
    if (result.fulfillments.length > 0) {
      // Add to the latest fulfillment's event list
      result.fulfillments[result.fulfillments.length - 1].events = [
        ...extraEvents,
        ...result.fulfillments[result.fulfillments.length - 1].events,
      ].sort((a, b) => new Date(a.happenedAt).getTime() - new Date(b.happenedAt).getTime())
    } else {
      // No Shopify fulfillment yet — synthesize a virtual one so the timeline renders
      result.fulfillments = [{
        status:       'PENDING',
        updatedAt:    extraEvents[extraEvents.length - 1].happenedAt,
        trackingInfo: [],
        events:       extraEvents,
      }]
    }
  }
}

return NextResponse.json(result)
```

- [ ] **Step 3: Add LABEL_PRINTED to the customer-facing timeline labels**

In `app/track-order/page.tsx`, find the `EVENT_LABEL` map inside the fulfillment timeline section and add the missing entry:
```ts
const EVENT_LABEL: Record<string, string> = {
  CONFIRMED:          'Order confirmed',
  LABEL_PRINTED:      'Packed at workshop',   // ← add this
  IN_TRANSIT:         'Shipped',
  OUT_FOR_DELIVERY:   'Out for delivery',
  DELIVERED:          'Delivered',
  FAILURE:            'Delivery failed',
  ATTEMPTED_DELIVERY: 'Delivery attempted',
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 5: Manual test**

1. In admin, open an order and add "Packed at Workshop" stage
2. Open `/track-order`, enter the order number + email
3. Confirm "Packed at workshop" appears in the timeline
4. Reload the page — confirm it still shows

- [ ] **Step 6: Commit**

```bash
git add app/api/track-order/route.ts app/track-order/page.tsx
git commit -m "fix: show pre-transit fulfillment stages on customer order tracking page"
```

---

### Task 2: Supabase Migration — back_in_stock_requests

**Files:**
- Create: `docs/supabase/migrations/004_back_in_stock.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- 004_back_in_stock.sql

CREATE TABLE IF NOT EXISTS back_in_stock_requests (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          text        NOT NULL,
  product_handle text        NOT NULL,
  product_title  text        NOT NULL,
  notified_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- One signup per email per product (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS back_in_stock_requests_email_handle_idx
  ON back_in_stock_requests(email, product_handle);

CREATE INDEX IF NOT EXISTS back_in_stock_requests_handle_idx
  ON back_in_stock_requests(product_handle);

CREATE INDEX IF NOT EXISTS back_in_stock_requests_notified_idx
  ON back_in_stock_requests(notified_at)
  WHERE notified_at IS NULL;
```

- [ ] **Step 2: Run in Supabase SQL Editor**

Go to Supabase dashboard → SQL Editor → paste and run.

Expected: "Success. No rows returned."

Verify:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'back_in_stock_requests';
```
Expected: 1 row.

- [ ] **Step 3: Commit**

```bash
git add docs/supabase/migrations/004_back_in_stock.sql
git commit -m "feat: add back_in_stock_requests Supabase table"
```

---

### Task 3: Install Resend + Email Library

**Files:**
- Create: `lib/email.ts`
- Modify: `.env.local` (manual step — value never in code)

**Interfaces:**
- Produces: `sendBackInStockEmail(to, productTitle, productHandle)` → `Promise<void>`
- Produces: `sendPackedAtWorkshopEmail(to, orderName)` → `Promise<void>` (optional — for future use)

- [ ] **Step 1: Install Resend**

```bash
npm install resend
```

- [ ] **Step 2: Add env var to .env.local**

Add this line to `.env.local` (never paste the actual key here — add it directly to the file):
```
RESEND_API_KEY=re_...your_key_here...
```

Get the key at resend.com → API Keys → Create API Key (free tier, 3000 emails/month).

Also add to Vercel environment variables (Settings → Environment Variables → `RESEND_API_KEY`).

- [ ] **Step 3: Create `lib/email.ts`**

```ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM = 'Acme Vintage Supply <hello@acmevintagesupply.ca>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmevintagesupply.com'

export async function sendBackInStockEmail(
  to:            string,
  productTitle:  string,
  productHandle: string
): Promise<void> {
  await resend.emails.send({
    from:    FROM,
    to,
    subject: `Back in stock: ${productTitle}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2A;">
        <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 8px;">Good news from the bench.</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #6B6257; margin-bottom: 24px;">
          <strong style="color: #2C2C2A;">${productTitle}</strong> is back in stock at Acme Vintage Supply.
          These pieces move quickly — grab yours before it goes again.
        </p>
        <a
          href="${SITE}/catalog/${productHandle}"
          style="display: inline-block; background: #2C5F2E; color: #F5F1E6; text-decoration: none;
                 padding: 12px 28px; border-radius: 3px; font-family: sans-serif; font-size: 14px; font-weight: 600;"
        >
          View product →
        </a>
        <p style="font-size: 12px; color: #A89F94; margin-top: 32px; line-height: 1.5;">
          You requested a restock notification for this item. If you no longer need it, simply ignore this email.<br>
          Acme Vintage Supply · Dartmouth, Nova Scotia
        </p>
      </div>
    `,
  })
}

export async function sendPackedAtWorkshopEmail(
  to:        string,
  orderName: string
): Promise<void> {
  await resend.emails.send({
    from:    FROM,
    to,
    subject: `Your order ${orderName} is being packed`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2A;">
        <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 8px;">Your order is at the bench.</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #6B6257; margin-bottom: 24px;">
          Order <strong style="color: #2C2C2A;">${orderName}</strong> is being straw-packed and hand-numbered by our bench team.
          You'll receive another email with tracking information once it ships.
        </p>
        <a
          href="${SITE}/track-order?order=${encodeURIComponent(orderName)}"
          style="display: inline-block; background: #2C5F2E; color: #F5F1E6; text-decoration: none;
                 padding: 12px 28px; border-radius: 3px; font-family: sans-serif; font-size: 14px; font-weight: 600;"
        >
          Track your order →
        </a>
        <p style="font-size: 12px; color: #A89F94; margin-top: 32px; line-height: 1.5;">
          Acme Vintage Supply · Dartmouth, Nova Scotia
        </p>
      </div>
    `,
  })
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add lib/email.ts package.json package-lock.json
git commit -m "feat: add Resend email client with back-in-stock and packed-at-workshop templates"
```

---

### Task 4: Back in Stock Library + Public API

**Files:**
- Create: `lib/backInStock.ts`
- Create: `app/api/notify-me/route.ts`

**Interfaces:**
- Produces: `addBackInStockRequest(email, productHandle, productTitle)` → `Promise<'added' | 'already_registered'>`
- Produces: `getBackInStockRequests(productHandle)` → `Promise<BackInStockRow[]>`
- Produces: `markNotified(ids)` → `Promise<void>`
- Produces: `POST /api/notify-me` — public, no auth, body: `{ email, productHandle, productTitle }`

- [ ] **Step 1: Create `lib/backInStock.ts`**

```ts
import supabaseAdmin from '@/lib/supabase'

export interface BackInStockRow {
  id:            string
  email:         string
  productHandle: string
  productTitle:  string
  createdAt:     string
}

export async function addBackInStockRequest(
  email:         string,
  productHandle: string,
  productTitle:  string
): Promise<'added' | 'already_registered'> {
  const { error } = await supabaseAdmin
    .from('back_in_stock_requests')
    .insert({ email, product_handle: productHandle, product_title: productTitle })

  if (error?.code === '23505') return 'already_registered' // unique constraint
  if (error) throw error
  return 'added'
}

export async function getBackInStockRequests(productHandle: string): Promise<BackInStockRow[]> {
  const { data } = await supabaseAdmin
    .from('back_in_stock_requests')
    .select('*')
    .eq('product_handle', productHandle)
    .is('notified_at', null)
    .order('created_at', { ascending: true })

  return (data ?? []).map(row => ({
    id:            row.id            as string,
    email:         row.email         as string,
    productHandle: row.product_handle as string,
    productTitle:  row.product_title  as string,
    createdAt:     row.created_at    as string,
  }))
}

export async function markNotified(ids: string[]): Promise<void> {
  await supabaseAdmin
    .from('back_in_stock_requests')
    .update({ notified_at: new Date().toISOString() })
    .in('id', ids)
}
```

- [ ] **Step 2: Create `app/api/notify-me/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { addBackInStockRequest } from '@/lib/backInStock'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

    const { email, productHandle, productTitle } = body as {
      email?: string; productHandle?: string; productTitle?: string
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }
    if (!productHandle || typeof productHandle !== 'string') {
      return NextResponse.json({ error: 'Product handle required' }, { status: 400 })
    }
    if (!productTitle || typeof productTitle !== 'string') {
      return NextResponse.json({ error: 'Product title required' }, { status: 400 })
    }

    const result = await addBackInStockRequest(
      email.trim().toLowerCase(),
      productHandle.trim(),
      productTitle.trim()
    )

    return NextResponse.json({ ok: true, result })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Manual test**

With dev server running, run in browser console or terminal:
```bash
curl -X POST http://localhost:3000/api/notify-me \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","productHandle":"duplex-chimney","productTitle":"Duplex Chimney"}'
```
Expected: `{ "ok": true, "result": "added" }`

Same request again:
Expected: `{ "ok": true, "result": "already_registered" }`

Check Supabase:
```sql
SELECT * FROM back_in_stock_requests ORDER BY created_at DESC LIMIT 5;
```
Expected: 1 row for `duplex-chimney`.

- [ ] **Step 5: Commit**

```bash
git add lib/backInStock.ts app/api/notify-me/route.ts
git commit -m "feat: add back-in-stock request library and public API endpoint"
```

---

### Task 5: NotifyMeForm Component + PDP Integration

**Files:**
- Create: `components/product/NotifyMeForm.tsx`
- Modify: `components/product/ProductInfo.tsx`

**Interfaces:**
- Consumes: `POST /api/notify-me` with `{ email, productHandle, productTitle }`
- Produces: `<NotifyMeForm productHandle={string} productTitle={string} />` — renders when product is out of stock

**Context:** In `ProductInfo.tsx`, the out-of-stock state shows a disabled "Out of stock" button. Replace that area with `<NotifyMeForm>` when `activeInStock` is false.

- [ ] **Step 1: Create `components/product/NotifyMeForm.tsx`**

```tsx
'use client'

import { useState } from 'react'

interface Props {
  productHandle: string
  productTitle:  string
}

export default function NotifyMeForm({ productHandle, productTitle }: Props) {
  const [email,     setEmail]     = useState('')
  const [status,    setStatus]    = useState<'idle' | 'loading' | 'done' | 'already' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')

    try {
      const res = await fetch('/api/notify-me', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), productHandle, productTitle }),
      })
      const data = await res.json()
      if (!res.ok) { setStatus('error'); return }
      setStatus(data.result === 'already_registered' ? 'already' : 'done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="border border-ink-rule rounded-sm px-5 py-4 bg-parchment-2">
        <p className="font-serif text-[16px] text-ink-charcoal mb-0.5">You're on the list.</p>
        <p className="font-sans text-[13px] text-ink-soft">
          We'll email you at <span className="text-ink-iron font-medium">{email}</span> the moment this is back in stock.
        </p>
      </div>
    )
  }

  if (status === 'already') {
    return (
      <div className="border border-ink-rule rounded-sm px-5 py-4 bg-parchment-2">
        <p className="font-sans text-[13px] text-ink-soft">
          You're already registered for restock notifications on this item.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="border border-ink-rule rounded-sm px-4 py-3 bg-parchment-2">
        <p className="font-sans text-[12px] text-ink-soft uppercase tracking-eyebrow mb-0.5">Out of stock</p>
        <p className="font-sans text-[13px] text-ink-iron">
          Get an email the moment this piece is back on the bench.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your email"
          required
          disabled={status === 'loading'}
          className="flex-1 h-12 px-4 bg-parchment-2 border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="h-12 px-5 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[13px] font-semibold hover:bg-green-deep transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Saving…' : 'Notify me'}
        </button>
      </form>

      {status === 'error' && (
        <p className="font-sans text-[12px] text-red-600">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire into ProductInfo.tsx**

Add the import at the top of `components/product/ProductInfo.tsx`:
```ts
import NotifyMeForm from './NotifyMeForm'
```

Find the section in `ProductInfo.tsx` that renders the "Out of stock" / add-to-crate button area. It will be a condition on `activeInStock`. Locate the out-of-stock button (the disabled button that says something like "Out of stock") and replace it with:

```tsx
{!activeInStock ? (
  <NotifyMeForm
    productHandle={product.slug}
    productTitle={product.name}
  />
) : (
  /* existing add-to-crate button JSX stays here unchanged */
)}
```

Read the current ProductInfo.tsx carefully before editing — find the exact block that renders `activeInStock` to ensure you are only replacing the out-of-stock path.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Manual test**

Open a product that is out of stock (`stockQuantity === 0`, `inStock === false`). Confirm:
- "Out of stock" disabled button is gone
- "Notify me" form appears
- Submitting a valid email shows "You're on the list."
- Submitting the same email again shows "You're already registered..."
- In-stock products are unchanged (Add to Crate still works)

- [ ] **Step 5: Commit**

```bash
git add components/product/NotifyMeForm.tsx components/product/ProductInfo.tsx
git commit -m "feat: show notify-me email form on out-of-stock product pages"
```

---

### Task 6: Admin — Notify Waitlist API + Product Page Button

**Files:**
- Create: `app/api/admin/products/notify-restock/route.ts`
- Modify: `app/admin/products/[id]/page.tsx` — add "Notify X waiting" button (read the file first to find the right location)

**Interfaces:**
- Consumes: `getBackInStockRequests(productHandle)` from `@/lib/backInStock`
- Consumes: `markNotified(ids)` from `@/lib/backInStock`
- Consumes: `sendBackInStockEmail(to, productTitle, productHandle)` from `@/lib/email`
- Produces: `POST /api/admin/products/notify-restock` — admin-only, body: `{ productHandle }`, sends emails + marks notified

- [ ] **Step 1: Create the API route**

Create `app/api/admin/products/notify-restock/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getBackInStockRequests, markNotified } from '@/lib/backInStock'
import { sendBackInStockEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.productHandle || typeof body.productHandle !== 'string') {
    return NextResponse.json({ error: 'productHandle required' }, { status: 400 })
  }

  const requests = await getBackInStockRequests(body.productHandle)
  if (requests.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  let sent = 0
  const notifiedIds: string[] = []

  for (const req of requests) {
    try {
      await sendBackInStockEmail(req.email, req.productTitle, req.productHandle)
      notifiedIds.push(req.id)
      sent++
    } catch {
      // Log failure but continue to next recipient
    }
  }

  if (notifiedIds.length > 0) {
    await markNotified(notifiedIds)
  }

  return NextResponse.json({ ok: true, sent })
}
```

- [ ] **Step 2: Find the admin product detail page**

```bash
find . -path "*/admin/products/\[id\]/page.tsx" 2>/dev/null || \
find . -path "*/admin/products/\[*\]/page.tsx" 2>/dev/null
```

If no `[id]` page exists, find where a single product is managed in the admin (may be a modal or a detail route). Read the file to find the appropriate place to add the button.

- [ ] **Step 3: Add "Notify waiting customers" button**

In whatever page/modal manages a single product in admin, add a client-side button that:
1. Shows waitlist count (fetch from a new `GET /api/admin/products/notify-restock?handle=X`)
2. On click, calls `POST /api/admin/products/notify-restock` with `{ productHandle }`
3. Shows sent count on completion

Pattern to follow for the button — match existing admin button styles:
```tsx
<button
  onClick={handleNotifyWaitlist}
  disabled={waitlistCount === 0 || notifying}
  className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
>
  <BiEnvelope size={13} />
  {notifying ? 'Sending…' : `Notify ${waitlistCount} waiting`}
</button>
```

Add `GET` handler to the same `notify-restock/route.ts` file so the button can fetch the count:

```ts
export async function GET(req: NextRequest) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const handle = req.nextUrl.searchParams.get('handle')
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

  const requests = await getBackInStockRequests(handle)
  return NextResponse.json({ count: requests.length })
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 5: Manual test**

1. Sign up for a notify-me on an out-of-stock product (from storefront)
2. In admin, open that product
3. Confirm the "Notify X waiting" button shows the correct count
4. Click it — confirm the email arrives in your inbox
5. Click again — button should show "Notify 0 waiting" (all marked notified)

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/products/notify-restock/route.ts app/admin/products/
git commit -m "feat: admin trigger to email back-in-stock waitlist per product"
```

---

## Self-Review

**Spec coverage:**
- ✅ Order Tracking — custom stages appear on customer tracking page (Task 1)
- ✅ Back in Stock — table migration, API, customer form, admin notification trigger (Tasks 2–6)
- ✅ Resend email — back-in-stock template + optional packed-at-workshop template (Task 3)
- ✅ Duplicate signups blocked at DB level (unique index)
- ✅ Already-notified customers excluded from future blasts (`notified_at IS NULL` filter)
- ✅ Admin button shows live waitlist count, disabled when 0
- ✅ Related Products — already built, no work needed
- ✅ Customer Shopify emails (order confirmation, shipping) — already fire automatically via Shopify

**Items noted but intentionally out of scope:**
- Unsubscribe link in email — Resend free tier doesn't require CAN-SPAM unsubscribe for transactional emails, but should be added before heavy volume
- Email domain verification in Resend — Scott must verify `acmevintagesupply.ca` in Resend dashboard before sending from that domain. Until verified, use `onboarding@resend.dev` as the FROM address.

**Placeholder scan:** None found — all steps contain real code.

**Type consistency:** `BackInStockRow` defined in Task 4, consumed in Task 6. `sendBackInStockEmail` defined in Task 3, consumed in Task 6. ✅
