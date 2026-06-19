# Product Reviews & Ratings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock product reviews with a real, self-hosted review + rating system — customers can submit reviews (verified purchase), the admin can moderate them, and all data lives in Supabase.

**Architecture:** Supabase (PostgreSQL) stores all reviews. Next.js API routes handle submission, helpful votes, and admin moderation. `CustomerReviews.tsx` is converted from a mock-data server component to a real async server component that reads Supabase directly and passes props down to client components for the form and helpful vote buttons. No third-party review widgets.

**Tech Stack:** Next.js 16 App Router, Supabase (`@supabase/supabase-js`), iron-session (customer + admin auth), Shopify Admin GraphQL API (purchase verification), Tailwind v4, `react-icons/bi`

## Global Constraints

- Tailwind v4 only — use `bg-(--admin-*)` CSS variable syntax; no `tailwind.config.ts`; no `@apply`
- Admin auth: `getIronSession<AdminSession>(await cookies(), sessionOptions)` from `lib/admin/session`
- Customer auth: `getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions)` from `lib/customerSession`
- Shopify Admin API version: `2026-04`
- All Supabase calls are server-side only — never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- No new npm packages except `@supabase/supabase-js`
- No comments unless the WHY is genuinely non-obvious
- `tsc --noEmit` must pass after each task before committing
- Session cookie names: `acme_admin_session` (admin), `acme_customer_session` (customer)

---

## File Map

### New Files
| File | Purpose |
|---|---|
| `lib/supabase.ts` | Supabase server-only client (service role) |
| `lib/reviews.ts` | All review data functions (CRUD + aggregates) |
| `app/api/reviews/route.ts` | POST — submit review (customer auth) |
| `app/api/reviews/helpful/route.ts` | POST — mark review helpful (no auth) |
| `app/api/admin/reviews/route.ts` | GET — list all reviews (admin auth) |
| `app/api/admin/reviews/[id]/route.ts` | PATCH — approve or reject (admin auth) |
| `components/product/ReviewsClient.tsx` | "use client" wrapper: renders review list + form |
| `components/product/ReviewForm.tsx` | "use client" interactive star-picker + submit form |
| `components/product/HelpfulButton.tsx` | "use client" helpful vote button (cookie-deduped) |
| `app/admin/reviews/page.tsx` | Admin moderation page |

### Modified Files
| File | What Changes |
|---|---|
| `components/product/CustomerReviews.tsx` | Replace mock data with Supabase fetch; add session check; render ReviewsClient |
| `components/product/ProductInfo.tsx` | Accept optional `reviewSummary` prop; remove mockReviews import |
| `app/catalog/[slug]/page.tsx` | Fetch review summary; pass to ProductInfo; add `aggregateRating` to JSON-LD |
| `lib/admin/shopifyAdmin.ts` | Add `hasCustomerPurchasedProduct(email, productHandle)` |
| `components/admin/layout/AdminSidebar.tsx` | Add Reviews nav item with pending count badge |
| `components/admin/layout/AdminBottomNav.tsx` | Add Reviews to MORE_ITEMS |

---

## Task 1: Supabase Schema + Client Setup

**Files:**
- Create: `lib/supabase.ts`
- Env: `.env.local` (add 2 vars)

**Interfaces:**
- Produces: `supabaseAdmin` — default export from `lib/supabase.ts`, typed as `SupabaseClient`

---

- [ ] **Step 1: Install Supabase client**

```bash
cd "c:/Users/PPlazan/Desktop/Claude Design/final-lamp-sign/acme-lamp-sign"
npm install @supabase/supabase-js
```

Expected: `added 1 package` (or similar). No errors.

- [ ] **Step 2: Create the Supabase project and get credentials**

Go to supabase.com → New Project → name it `acme-reviews`. Once created:
- Copy **Project URL** (looks like `https://xyzabc.supabase.co`)
- Go to Settings → API → copy **service_role key** (secret key, not anon)

- [ ] **Step 3: Add env vars to `.env.local`**

Add these two lines to `.env.local`:
```
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

Also add both to **Vercel → Project → Settings → Environment Variables** (Production + Preview + Development). Redeploy after Task 6.

- [ ] **Step 4: Run the database migration via Supabase MCP**

Use the Supabase MCP `apply_migration` tool with this SQL:

```sql
-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS reviews (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_handle   TEXT        NOT NULL,
  product_id       TEXT        NOT NULL,
  customer_email   TEXT        NOT NULL,
  customer_name    TEXT        NOT NULL,
  rating           SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title            TEXT        NOT NULL CHECK (char_length(title) <= 100),
  body             TEXT        NOT NULL CHECK (char_length(body) >= 20 AND char_length(body) <= 2000),
  verified_purchase BOOLEAN    NOT NULL DEFAULT FALSE,
  approved         BOOLEAN     NOT NULL DEFAULT FALSE,
  helpful_count    INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_customer
  ON reviews (customer_email, product_handle);

CREATE INDEX IF NOT EXISTS reviews_handle_approved
  ON reviews (product_handle, approved);

CREATE INDEX IF NOT EXISTS reviews_pending
  ON reviews (approved, created_at DESC);

CREATE TABLE IF NOT EXISTS review_helpful_votes (
  review_id    UUID  NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  voter_token  TEXT  NOT NULL,
  PRIMARY KEY (review_id, voter_token)
);
```

- [ ] **Step 5: Create `lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default supabaseAdmin
```

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add lib/supabase.ts package.json package-lock.json
git commit -m "feat: add Supabase client for reviews system"
```

---

## Task 2: Data Layer — `lib/reviews.ts`

**Files:**
- Create: `lib/reviews.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface Review {
    id: string
    productHandle: string
    productId: string
    customerEmail: string
    customerName: string
    rating: number
    title: string
    body: string
    verifiedPurchase: boolean
    approved: boolean
    helpfulCount: number
    createdAt: string
  }

  export interface ReviewSummary {
    average: number
    count: number
    distribution: { 1: number; 2: number; 3: number; 4: number; 5: number }
  }

  export interface SubmitReviewInput {
    productHandle: string
    productId: string
    customerEmail: string
    customerName: string
    rating: number
    title: string
    body: string
    verifiedPurchase: boolean
  }

  export async function getApprovedReviews(productHandle: string): Promise<Review[]>
  export async function getReviewSummary(productHandle: string): Promise<ReviewSummary>
  export async function hasCustomerReviewed(email: string, productHandle: string): Promise<boolean>
  export async function submitReviewToDb(input: SubmitReviewInput): Promise<{ error?: string }>
  export async function markHelpful(reviewId: string, voterToken: string): Promise<{ alreadyVoted: boolean }>
  export async function getAllReviewsAdmin(filter: 'all' | 'pending' | 'approved'): Promise<Review[]>
  export async function setReviewApproved(id: string, approved: boolean): Promise<void>
  ```

---

- [ ] **Step 1: Create `lib/reviews.ts`**

```typescript
import supabaseAdmin from './supabase'

export interface Review {
  id: string
  productHandle: string
  productId: string
  customerEmail: string
  customerName: string
  rating: number
  title: string
  body: string
  verifiedPurchase: boolean
  approved: boolean
  helpfulCount: number
  createdAt: string
}

export interface ReviewSummary {
  average: number
  count: number
  distribution: { 1: number; 2: number; 3: number; 4: number; 5: number }
}

export interface SubmitReviewInput {
  productHandle: string
  productId: string
  customerEmail: string
  customerName: string
  rating: number
  title: string
  body: string
  verifiedPurchase: boolean
}

function toReview(row: Record<string, unknown>): Review {
  return {
    id:               row.id as string,
    productHandle:    row.product_handle as string,
    productId:        row.product_id as string,
    customerEmail:    row.customer_email as string,
    customerName:     row.customer_name as string,
    rating:           row.rating as number,
    title:            row.title as string,
    body:             row.body as string,
    verifiedPurchase: row.verified_purchase as boolean,
    approved:         row.approved as boolean,
    helpfulCount:     row.helpful_count as number,
    createdAt:        row.created_at as string,
  }
}

export async function getApprovedReviews(productHandle: string): Promise<Review[]> {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('product_handle', productHandle)
    .eq('approved', true)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(toReview)
}

export async function getReviewSummary(productHandle: string): Promise<ReviewSummary> {
  const reviews = await getApprovedReviews(productHandle)

  if (reviews.length === 0) {
    return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  }

  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as ReviewSummary['distribution']
  let total = 0
  for (const r of reviews) {
    dist[r.rating as keyof typeof dist]++
    total += r.rating
  }

  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count:   reviews.length,
    distribution: dist,
  }
}

export async function hasCustomerReviewed(email: string, productHandle: string): Promise<boolean> {
  const { count, error } = await supabaseAdmin
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('customer_email', email)
    .eq('product_handle', productHandle)

  if (error) return false
  return (count ?? 0) > 0
}

export async function submitReviewToDb(input: SubmitReviewInput): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from('reviews').insert({
    product_handle:    input.productHandle,
    product_id:        input.productId,
    customer_email:    input.customerEmail,
    customer_name:     input.customerName,
    rating:            input.rating,
    title:             input.title,
    body:              input.body,
    verified_purchase: input.verifiedPurchase,
    approved:          false,
  })

  if (error) {
    if (error.code === '23505') return { error: 'already_reviewed' }
    return { error: error.message }
  }
  return {}
}

export async function markHelpful(
  reviewId: string,
  voterToken: string
): Promise<{ alreadyVoted: boolean }> {
  const { error: voteError } = await supabaseAdmin
    .from('review_helpful_votes')
    .insert({ review_id: reviewId, voter_token: voterToken })

  if (voteError) {
    if (voteError.code === '23505') return { alreadyVoted: true }
    throw new Error(voteError.message)
  }

  await supabaseAdmin.rpc('increment_helpful', { row_id: reviewId })
  return { alreadyVoted: false }
}

export async function getAllReviewsAdmin(filter: 'all' | 'pending' | 'approved'): Promise<Review[]> {
  let query = supabaseAdmin.from('reviews').select('*').order('created_at', { ascending: false })

  if (filter === 'pending')  query = query.eq('approved', false)
  if (filter === 'approved') query = query.eq('approved', true)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(toReview)
}

export async function setReviewApproved(id: string, approved: boolean): Promise<void> {
  const { error } = await supabaseAdmin
    .from('reviews')
    .update({ approved })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
```

- [ ] **Step 2: Add the `increment_helpful` Postgres function via Supabase MCP**

Use `apply_migration` with:
```sql
CREATE OR REPLACE FUNCTION increment_helpful(row_id UUID)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = row_id;
$$;
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add lib/reviews.ts
git commit -m "feat: reviews data layer — Supabase CRUD + aggregates"
```

---

## Task 3: Purchase Verification

**Files:**
- Modify: `lib/admin/shopifyAdmin.ts` (add one function at the bottom)

**Interfaces:**
- Produces: `export async function hasCustomerPurchasedProduct(email: string, productHandle: string): Promise<boolean>`

---

- [ ] **Step 1: Open `lib/admin/shopifyAdmin.ts` and add this function at the bottom**

```typescript
export async function hasCustomerPurchasedProduct(
  email: string,
  productHandle: string
): Promise<boolean> {
  type OrdersResponse = {
    orders: {
      edges: Array<{
        node: {
          lineItems: {
            edges: Array<{
              node: { product: { handle: string } | null }
            }>
          }
        }
      }>
    }
  }

  const data = await adminFetch<OrdersResponse>(
    `query CheckPurchase($email: String!) {
      orders(first: 250, query: $email) {
        edges {
          node {
            lineItems(first: 50) {
              edges {
                node {
                  product { handle }
                }
              }
            }
          }
        }
      }
    }`,
    { email: `email:${email}` }
  )

  return data.orders.edges.some(({ node: order }) =>
    order.lineItems.edges.some(({ node: item }) =>
      item.product?.handle === productHandle
    )
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add lib/admin/shopifyAdmin.ts
git commit -m "feat: add hasCustomerPurchasedProduct for review verification"
```

---

## Task 4: API Routes

**Files:**
- Create: `app/api/reviews/route.ts`
- Create: `app/api/reviews/helpful/route.ts`
- Create: `app/api/admin/reviews/route.ts`
- Create: `app/api/admin/reviews/[id]/route.ts`

**Interfaces:**
- `POST /api/reviews` body: `{ handle, productId, customerName, rating, title, body }` → `{ ok: true } | { error: string }`
- `POST /api/reviews/helpful` body: `{ reviewId, voterToken }` → `{ alreadyVoted: boolean }`
- `GET /api/admin/reviews?filter=all|pending|approved` → `Review[]`
- `PATCH /api/admin/reviews/[id]` body: `{ action: 'approve' | 'reject' }` → `{ ok: true }`

---

- [ ] **Step 1: Create `app/api/reviews/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import type { CustomerSessionData } from '@/lib/customerSession'
import { customerSessionOptions } from '@/lib/customerSession'
import { submitReviewToDb, hasCustomerReviewed } from '@/lib/reviews'
import { hasCustomerPurchasedProduct } from '@/lib/admin/shopifyAdmin'

export async function POST(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions)
  if (!session.accessToken || !session.email) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  let body: {
    handle: string
    productId: string
    customerName: string
    rating: number
    title: string
    body: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { handle, productId, customerName, rating, title, body: reviewBody } = body

  if (!handle || !productId || !customerName || !rating || !title || !reviewBody) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: 'invalid_rating' }, { status: 400 })
  }
  if (title.length > 100) {
    return NextResponse.json({ error: 'title_too_long' }, { status: 400 })
  }
  if (reviewBody.length < 20 || reviewBody.length > 2000) {
    return NextResponse.json({ error: 'body_length_invalid' }, { status: 400 })
  }

  const alreadyReviewed = await hasCustomerReviewed(session.email, handle)
  if (alreadyReviewed) {
    return NextResponse.json({ error: 'already_reviewed' }, { status: 409 })
  }

  const verifiedPurchase = await hasCustomerPurchasedProduct(session.email, handle)

  const result = await submitReviewToDb({
    productHandle:    handle,
    productId,
    customerEmail:    session.email,
    customerName:     customerName.trim(),
    rating,
    title:            title.trim(),
    body:             reviewBody.trim(),
    verifiedPurchase,
  })

  if (result.error) {
    if (result.error === 'already_reviewed') {
      return NextResponse.json({ error: 'already_reviewed' }, { status: 409 })
    }
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create `app/api/reviews/helpful/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { markHelpful } from '@/lib/reviews'

export async function POST(req: NextRequest) {
  let reviewId: string
  let voterToken: string

  try {
    const body = await req.json()
    reviewId   = body.reviewId
    voterToken = body.voterToken
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!reviewId || !voterToken) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const result = await markHelpful(reviewId, voterToken)
  return NextResponse.json(result)
}
```

- [ ] **Step 3: Create `app/api/admin/reviews/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getAllReviewsAdmin } from '@/lib/reviews'

async function requireAdmin(): Promise<boolean> {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return !!session.isLoggedIn
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const filter = (req.nextUrl.searchParams.get('filter') ?? 'all') as 'all' | 'pending' | 'approved'
  const reviews = await getAllReviewsAdmin(filter)
  return NextResponse.json(reviews)
}
```

- [ ] **Step 4: Create `app/api/admin/reviews/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { setReviewApproved } from '@/lib/reviews'

async function requireAdmin(): Promise<boolean> {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return !!session.isLoggedIn
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let action: 'approve' | 'reject'
  try {
    const body = await req.json()
    action = body.action
    if (action !== 'approve' && action !== 'reject') throw new Error()
  } catch {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  await setReviewApproved(id, action === 'approve')
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 6: Manual API test (after dev server is running)**

```bash
# Should return 401
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{"handle":"test","productId":"gid://shopify/Product/1","customerName":"Test","rating":5,"title":"Great","body":"Really great product love it"}'

# Should return 401
curl http://localhost:3000/api/admin/reviews
```

Expected: both return `{"error":"not_authenticated"}` and `{"error":"Unauthorized"}` respectively.

- [ ] **Step 7: Commit**

```bash
git add app/api/reviews/route.ts app/api/reviews/helpful/route.ts app/api/admin/reviews/route.ts "app/api/admin/reviews/[id]/route.ts"
git commit -m "feat: review API routes — submit, helpful vote, admin moderation"
```

---

## Task 5: Storefront Components

**Files:**
- Modify: `components/product/CustomerReviews.tsx`
- Create: `components/product/ReviewsClient.tsx`
- Create: `components/product/ReviewForm.tsx`
- Create: `components/product/HelpfulButton.tsx`
- Modify: `components/product/ProductInfo.tsx` (add `reviewSummary` prop, remove mockReviews)
- Modify: `app/catalog/[slug]/page.tsx` (fetch summary, pass to ProductInfo, add aggregateRating JSON-LD)

**Interfaces:**
- `CustomerReviews` remains `({ product }: { product: Product }) => JSX.Element` (same signature, now async server component)
- `ReviewSummary` type from `lib/reviews.ts`

---

- [ ] **Step 1: Rewrite `components/product/CustomerReviews.tsx`**

Replace the entire file with:

```typescript
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import type { CustomerSessionData } from '@/lib/customerSession'
import { customerSessionOptions } from '@/lib/customerSession'
import { getApprovedReviews, getReviewSummary, hasCustomerReviewed } from '@/lib/reviews'
import { Product } from '@/lib/types'
import Eyebrow from '@/components/shared/Eyebrow'
import ReviewsClient from './ReviewsClient'

interface CustomerReviewsProps {
  product: Product
}

export default async function CustomerReviews({ product }: CustomerReviewsProps) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions)
  const isLoggedIn   = !!session.accessToken
  const email        = session.email ?? null
  const customerName = ''

  const [reviews, summary, alreadyReviewed] = await Promise.all([
    getApprovedReviews(product.slug),
    getReviewSummary(product.slug),
    email ? hasCustomerReviewed(email, product.slug) : Promise.resolve(false),
  ])

  return (
    <section>
      <Eyebrow className="mb-3">Customer reviews</Eyebrow>
      <h2
        className="font-serif font-medium text-ink-charcoal leading-tight mb-10"
        style={{ fontSize: 'clamp(22px, 2.5vw, 36px)' }}
      >
        What buyers are saying.
      </h2>

      <ReviewsClient
        product={{ id: product.id, handle: product.slug, name: product.name }}
        reviews={reviews}
        summary={summary}
        isLoggedIn={isLoggedIn}
        alreadyReviewed={alreadyReviewed}
        defaultName={customerName}
      />
    </section>
  )
}
```

- [ ] **Step 2: Create `components/product/ReviewsClient.tsx`**

```typescript
'use client'

import { useState } from 'react'
import type { Review, ReviewSummary } from '@/lib/reviews'
import { BiCheck } from 'react-icons/bi'
import ReviewForm from './ReviewForm'
import HelpfulButton from './HelpfulButton'

interface ReviewsClientProps {
  product: { id: string; handle: string; name: string }
  reviews: Review[]
  summary: ReviewSummary
  isLoggedIn: boolean
  alreadyReviewed: boolean
  defaultName: string
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-[2px]" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.44L7 8.885l-3.09 1.625L4.5 7.07 2 4.635l3.455-.505L7 1z"
            fill={n <= rating ? '#C29B47' : 'none'}
            stroke={n <= rating ? '#C29B47' : '#B8AD9A'}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  )
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-mono text-ink-soft w-8 text-right">{label}</span>
      <div className="flex-1 h-[3px] bg-ink-rule rounded-full overflow-hidden">
        <div className="h-full bg-brass rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-mono text-ink-soft w-5">{count}</span>
    </div>
  )
}

export default function ReviewsClient({
  product, reviews, summary, isLoggedIn, alreadyReviewed, defaultName,
}: ReviewsClientProps) {
  const [submitted, setSubmitted] = useState(false)

  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: summary.distribution[star as keyof typeof summary.distribution],
  }))

  return (
    <>
      {/* Aggregate panel */}
      <div className="flex flex-col sm:flex-row gap-8 sm:gap-14 mb-12 pb-10 border-b border-ink-rule">
        <div className="flex flex-col items-start gap-2 shrink-0">
          <span className="font-serif text-[64px] leading-none text-ink-charcoal tabular-nums">
            {summary.count > 0 ? summary.average.toFixed(1) : '—'}
          </span>
          {summary.count > 0 && <StarRow rating={Math.round(summary.average)} size={16} />}
          <span className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mt-1">
            {summary.count} {summary.count === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        <div className="flex flex-col justify-center gap-2 flex-1 max-w-xs">
          {dist.map(({ star, count }) => (
            <RatingBar key={star} label={`${star}★`} count={count} total={summary.count} />
          ))}
        </div>
      </div>

      {/* Review list */}
      {reviews.length > 0 ? (
        <div className="space-y-8 mb-14">
          {reviews.map(review => (
            <article key={review.id} className="border-b border-ink-rule pb-8 last:border-none last:pb-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <StarRow rating={review.rating} />
                  <h3 className="font-serif text-[17px] text-ink-charcoal mt-2 leading-snug">
                    {review.title}
                  </h3>
                </div>
                <time dateTime={review.createdAt} className="text-[11px] font-mono text-ink-soft shrink-0 pt-1">
                  {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </time>
              </div>

              <p className="font-sans text-[15px] text-ink-soft leading-relaxed mb-3">
                {review.body}
              </p>

              <div className="flex items-center gap-4">
                <span className="text-[12px] font-mono text-ink-iron">{review.customerName}</span>
                {review.verifiedPurchase && (
                  <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-eyebrow text-green-brand">
                    <BiCheck size={13} aria-hidden="true" />
                    Verified purchase
                  </span>
                )}
                <HelpfulButton reviewId={review.id} initialCount={review.helpfulCount} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="font-sans text-[15px] text-ink-soft mb-14">
          No reviews yet. Be the first to share your experience.
        </p>
      )}

      {/* Write review section */}
      <div className="border-t border-ink-rule pt-10">
        <h3 className="font-serif text-[20px] text-ink-charcoal mb-6">Write a review</h3>

        {submitted ? (
          <p className="font-sans text-[15px] text-ink-iron bg-parchment-2 border border-ink-rule rounded-sm px-5 py-4">
            Thank you — your review has been submitted and will appear once approved.
          </p>
        ) : !isLoggedIn ? (
          <p className="font-sans text-[15px] text-ink-soft">
            <a href="/login" className="text-brass-deep underline underline-offset-2">Sign in</a> to write a review.
          </p>
        ) : alreadyReviewed ? (
          <p className="font-sans text-[15px] text-ink-soft">You have already reviewed this product.</p>
        ) : (
          <ReviewForm
            product={product}
            defaultName={defaultName}
            onSuccess={() => setSubmitted(true)}
          />
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 3: Create `components/product/ReviewForm.tsx`**

```typescript
'use client'

import { useState } from 'react'

interface ReviewFormProps {
  product: { id: string; handle: string; name: string }
  defaultName: string
  onSuccess: () => void
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  const display = hover || value

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n !== 1 ? 's' : ''}`}
          className="p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass/40 rounded"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
        >
          <svg width={24} height={24} viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.44L7 8.885l-3.09 1.625L4.5 7.07 2 4.635l3.455-.505L7 1z"
              fill={n <= display ? '#C29B47' : 'none'}
              stroke={n <= display ? '#C29B47' : '#B8AD9A'}
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  )
}

const labelClass = 'block text-[12px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5'
const inputClass = 'w-full h-[44px] px-3 bg-parchment-2 border border-ink-rule rounded-sm text-[14px] font-sans text-ink-charcoal focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors'
const textareaClass = 'w-full px-3 py-2.5 bg-parchment-2 border border-ink-rule rounded-sm text-[14px] font-sans text-ink-charcoal focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors resize-none'

export default function ReviewForm({ product, defaultName, onSuccess }: ReviewFormProps) {
  const [rating,    setRating]    = useState(0)
  const [name,      setName]      = useState(defaultName)
  const [title,     setTitle]     = useState('')
  const [body,      setBody]      = useState('')
  const [error,     setError]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (rating === 0) { setError('Please select a star rating.'); return }
    if (!name.trim())  { setError('Please enter your name.'); return }
    if (!title.trim()) { setError('Please enter a review title.'); return }
    if (body.trim().length < 20) { setError('Review must be at least 20 characters.'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle:       product.handle,
          productId:    product.id,
          customerName: name.trim(),
          rating,
          title:        title.trim(),
          body:         body.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'already_reviewed') {
          setError('You have already submitted a review for this product.')
        } else if (data.error === 'not_authenticated') {
          setError('Please sign in to submit a review.')
        } else {
          setError('Something went wrong. Please try again.')
        }
        return
      }

      onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className={labelClass}>Overall rating</label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div>
        <label htmlFor="review-name" className={labelClass}>Your name</label>
        <input
          id="review-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Margaret H."
          maxLength={60}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="review-title" className={labelClass}>Review title</label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Exactly as described — arrived in perfect condition."
          maxLength={100}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="review-body" className={labelClass}>
          Your review <span className="text-ink-muted normal-case tracking-normal">(min 20 characters)</span>
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Share your experience with this product..."
          maxLength={2000}
          rows={5}
          className={textareaClass}
        />
        <p className="text-[11px] font-mono text-ink-muted mt-1 text-right">
          {body.length}/2000
        </p>
      </div>

      {error && (
        <p className="text-[13px] font-sans text-red-600 bg-red-50 border border-red-200 rounded-sm px-4 py-2.5">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="h-[44px] px-7 bg-ink-charcoal text-parchment font-sans text-[13px] tracking-wide rounded-sm hover:bg-ink-iron transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Create `components/product/HelpfulButton.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'

interface HelpfulButtonProps {
  reviewId: string
  initialCount: number
}

function getVotedSet(): Set<string> {
  try {
    const raw = localStorage.getItem('acme_helpful_votes')
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function addVote(reviewId: string) {
  const set = getVotedSet()
  set.add(reviewId)
  localStorage.setItem('acme_helpful_votes', JSON.stringify([...set]))
}

export default function HelpfulButton({ reviewId, initialCount }: HelpfulButtonProps) {
  const [count,   setCount]   = useState(initialCount)
  const [voted,   setVoted]   = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setVoted(getVotedSet().has(reviewId))
  }, [reviewId])

  async function handleClick() {
    if (voted || loading) return
    setLoading(true)

    const voterToken = `local-${Math.random().toString(36).slice(2)}-${Date.now()}`

    try {
      const res = await fetch('/api/reviews/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, voterToken }),
      })
      const data = await res.json()
      if (!data.alreadyVoted) {
        setCount(c => c + 1)
        setVoted(true)
        addVote(reviewId)
      }
    } catch {
      // silent fail — helpful votes are low stakes
    } finally {
      setLoading(false)
    }
  }

  if (count === 0 && !voted) return null

  return (
    <button
      onClick={handleClick}
      disabled={voted || loading}
      className="text-[11px] font-mono text-ink-soft hover:text-ink-iron transition-colors disabled:cursor-default disabled:opacity-70"
    >
      {voted ? `Helpful (${count})` : `Helpful? (${count})`}
    </button>
  )
}
```

- [ ] **Step 5: Update `components/product/ProductInfo.tsx` — remove mockReviews, add optional reviewSummary prop**

Find and remove this import (line 9):
```typescript
import { getReviewsForProduct, getAggregateRating } from '@/lib/mockReviews'
```

Find where `getReviewsForProduct` and `getAggregateRating` are used in ProductInfo (search for these calls in the file) and replace them with the prop. Add `reviewSummary` to `ProductInfoProps`:

```typescript
import type { ReviewSummary } from '@/lib/reviews'

interface ProductInfoProps {
  product: Product
  reviewSummary?: ReviewSummary
}
```

Then replace any usage of `getReviewsForProduct(...)` or `getAggregateRating(...)` inside the component body with `reviewSummary?.average` and `reviewSummary?.count` respectively.

- [ ] **Step 6: Update `app/catalog/[slug]/page.tsx` — fetch summary, pass to ProductInfo, add aggregateRating**

Add import at the top:
```typescript
import { getReviewSummary } from '@/lib/reviews'
```

Inside `ProductPage`, after fetching the product, fetch the summary:
```typescript
export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductByHandle(slug)
  if (!product) notFound()

  const reviewSummary = await getReviewSummary(slug)
  // ... rest of component
```

Update the `productJsonLd` object to include aggregateRating when reviews exist:
```typescript
const productJsonLd = {
  '@context': 'https://schema.org',
  '@type':    'Product',
  name:        product.name,
  description: product.shortDescription || product.name,
  sku:         product.sku,
  image:       product.images,
  brand:       { '@type': 'Brand', name: 'Acme Vintage Supply' },
  offers: {
    '@type':        'Offer',
    url:            `${SITE_URL}/catalog/${slug}`,
    priceCurrency:  'CAD',
    price:          product.price,
    availability:   product.inStock
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    seller:         { '@type': 'Organization', name: 'Acme Vintage Supply' },
  },
  ...(reviewSummary.count > 0 && {
    aggregateRating: {
      '@type':      'AggregateRating',
      ratingValue:  reviewSummary.average.toFixed(1),
      reviewCount:  reviewSummary.count,
      bestRating:   5,
      worstRating:  1,
    },
  }),
}
```

Pass `reviewSummary` to `<ProductInfo>`:
```typescript
<ProductInfo product={product} reviewSummary={reviewSummary} />
```

- [ ] **Step 7: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 8: Manual smoke test**

1. Start the dev server: `npm run dev`
2. Navigate to any product page: `http://localhost:3000/catalog/[any-handle]`
3. Scroll to the reviews section — should show "—" average, 0 reviews, and the form or sign-in prompt
4. Sign in as a test customer, navigate back to the product — should show the form
5. Submit a review — should see the pending message
6. Check Supabase dashboard → Table Editor → reviews — should see the submitted row with `approved = false`

- [ ] **Step 9: Commit**

```bash
git add components/product/CustomerReviews.tsx components/product/ReviewsClient.tsx components/product/ReviewForm.tsx components/product/HelpfulButton.tsx components/product/ProductInfo.tsx "app/catalog/[slug]/page.tsx"
git commit -m "feat: storefront reviews — real data, write form, helpful votes, aggregateRating JSON-LD"
```

---

## Task 6: Admin Reviews Page + Navigation

**Files:**
- Create: `app/admin/reviews/page.tsx`
- Modify: `components/admin/layout/AdminSidebar.tsx`
- Modify: `components/admin/layout/AdminBottomNav.tsx`

---

- [ ] **Step 1: Create `app/admin/reviews/page.tsx`**

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { BiCheck, BiX, BiStar } from 'react-icons/bi'
import type { Review } from '@/lib/reviews'

type Filter = 'all' | 'pending' | 'approved'

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-[2px]">
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width={12} height={12} viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.44L7 8.885l-3.09 1.625L4.5 7.07 2 4.635l3.455-.505L7 1z"
            fill={n <= rating ? '#C29B47' : 'none'}
            stroke={n <= rating ? '#C29B47' : '#B8AD9A'}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  )
}

export default function AdminReviewsPage() {
  const [filter,  setFilter]  = useState<Filter>('pending')
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [acting,  setActing]  = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews?filter=${filter}`)
      if (res.ok) setReviews(await res.json())
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setActing(id)
    try {
      await fetch(`/api/admin/reviews/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action }),
      })
      setReviews(prev => prev.filter(r => r.id !== id))
    } finally {
      setActing(null)
    }
  }

  const FILTERS: { label: string; value: Filter }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'All', value: 'all' },
  ]

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-(--admin-text)">Reviews</h1>
          <p className="text-[13px] text-(--admin-text-muted) mt-0.5">Approve or reject customer submissions</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-(--admin-surface-2) rounded-lg">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                filter === f.value
                  ? 'bg-(--admin-surface) text-(--admin-text) shadow-sm'
                  : 'text-(--admin-text-muted) hover:text-(--admin-text)'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-(--admin-surface-2) animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-(--admin-text-muted)">
          <BiStar size={36} className="mb-3 opacity-30" />
          <p className="text-[14px]">No {filter === 'all' ? '' : filter} reviews</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div
              key={review.id}
              className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <StarRow rating={review.rating} />
                    <span className="text-[12px] font-mono text-(--admin-text-muted)">
                      {review.productHandle}
                    </span>
                    {review.verifiedPurchase && (
                      <span className="text-[10px] font-mono text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        Verified
                      </span>
                    )}
                    {review.approved && (
                      <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        Live
                      </span>
                    )}
                  </div>

                  <p className="text-[14px] font-medium text-(--admin-text) mb-1">{review.title}</p>
                  <p className="text-[13px] text-(--admin-text-soft) line-clamp-2 mb-2">{review.body}</p>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-(--admin-text-muted)">
                    <span>{review.customerName}</span>
                    <span>·</span>
                    <span>{review.customerEmail}</span>
                    <span>·</span>
                    <span>{new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {!review.approved && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(review.id, 'reject')}
                      disabled={acting === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-(--admin-red) bg-(--admin-red-bg) hover:opacity-80 rounded-md transition-opacity disabled:opacity-40"
                    >
                      <BiX size={14} />
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(review.id, 'approve')}
                      disabled={acting === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) hover:opacity-90 rounded-md transition-opacity disabled:opacity-40"
                    >
                      <BiCheck size={14} />
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add Reviews to `components/admin/layout/AdminSidebar.tsx`**

Add `BiStar` to the existing import block at the top:
```typescript
import {
  BiHomeAlt, BiCart, BiPackage, BiArchive, BiCollection,
  BiUser, BiBarChartAlt2, BiCog, BiLogOut, BiSun, BiMoon,
  BiEditAlt, BiStar,
} from 'react-icons/bi'
```

Add a `pendingReviewsCount` state alongside `unfulfilledCount`:
```typescript
const [pendingReviewsCount, setPendingReviewsCount] = useState(0)
```

Add a `useEffect` to fetch it (after the existing unfulfilled count effect):
```typescript
useEffect(() => {
  fetch('/api/admin/reviews?filter=pending')
    .then(r => r.ok ? r.json() : [])
    .then((reviews: unknown[]) => setPendingReviewsCount(reviews.length))
    .catch(() => {})
}, [])
```

Add Reviews to `NAV_MAIN` array (after Analytics):
```typescript
{ label: 'Reviews', href: '/admin/reviews', icon: BiStar, badge: pendingReviewsCount || undefined },
```

- [ ] **Step 3: Add Reviews to `components/admin/layout/AdminBottomNav.tsx`**

Add `BiStar` to the import block:
```typescript
import {
  BiHomeAlt, BiCart, BiPackage, BiUser, BiDotsHorizontalRounded,
  BiArchive, BiCollection, BiBarChartAlt2, BiCog, BiX, BiEditAlt, BiStar,
} from 'react-icons/bi'
```

Add Reviews to `MORE_ITEMS` (after Analytics):
```typescript
{ label: 'Reviews', href: '/admin/reviews', icon: BiStar },
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Manual smoke test**

1. Sign in to admin dashboard at `http://localhost:3000/admin`
2. Sidebar should show "Reviews" with a badge count if any pending reviews exist
3. Click Reviews — should see the moderation page
4. If a review was submitted in Task 5, it should appear in the Pending tab
5. Click Approve — row disappears from Pending, review goes live on storefront
6. Navigate to the product page — approved review should now be visible

- [ ] **Step 6: Commit**

```bash
git add "app/admin/reviews/page.tsx" components/admin/layout/AdminSidebar.tsx components/admin/layout/AdminBottomNav.tsx
git commit -m "feat: admin reviews moderation page + sidebar nav with pending badge"
```

---

## What This Delivers

| Feature | Where |
|---|---|
| Real reviews stored in Supabase | `lib/reviews.ts` |
| Customers submit reviews (login required) | `/api/reviews` → `ReviewForm.tsx` |
| Verified purchase badge (Shopify order check) | `lib/admin/shopifyAdmin.ts` |
| Admin approves/rejects before going live | `/admin/reviews` |
| Star rating breakdown + aggregate score | `ReviewsClient.tsx` |
| Helpful vote button (cookie-deduped) | `HelpfulButton.tsx` |
| `aggregateRating` in Google rich results | `app/catalog/[slug]/page.tsx` JSON-LD |
| Pending review badge on admin sidebar | `AdminSidebar.tsx` |
| Zero third-party review apps | ✅ |
