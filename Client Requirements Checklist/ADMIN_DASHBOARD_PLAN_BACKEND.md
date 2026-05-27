# Admin Dashboard — Plan 2: Backend Wiring (Shopify Admin API)
## Acme Lamp & Sign Co.

**Type:** Replace all mock data with live Shopify Admin API calls  
**Depends on:** Plan 1 (Frontend) must be 100% complete first  
**Estimated effort:** 3–5 days  
**Required before starting:** `SHOPIFY_ADMIN_API_TOKEN` from Shopify admin  

---

## What Changes From Plan 1

Every mock import in every page gets replaced with a real API call.  
No component structure changes. No design changes. Only data sources change.

```
Plan 1:  import { mockOrders } from '@/lib/admin/mockData'
Plan 2:  const orders = await getOrders()   ← hits Shopify Admin API
```

---

## New Environment Variables

Add to `.env.local` and Vercel production:

```bash
# Shopify Admin API — NEVER expose to browser
SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxx
SHOPIFY_STORE_DOMAIN=w061f6-k8.myshopify.com

# Admin dashboard auth
ADMIN_PASSWORD_HASH=bcrypt_hash_of_your_chosen_password
ADMIN_SESSION_SECRET=random_64_char_string_generated_with_openssl
```

**Critical security rules:**
- `SHOPIFY_ADMIN_API_TOKEN` starts with `shpat_` — this is a **private** token
- Never use it in client components or expose it to the browser
- Only used inside `app/api/admin/` route handlers — server-side only
- Different token from `SHOPIFY_STOREFRONT_ACCESS_TOKEN` used in the storefront

---

## Shopify Admin API — Setup

1. In Shopify admin → **Settings → Apps and sales channels → Develop apps**
2. Create a new private app: `Acme Admin Dashboard`
3. Under **Admin API access scopes**, enable:

```
read_orders           write_orders
read_products         write_products
read_inventory        write_inventory
read_customers
read_analytics
read_fulfillments     write_fulfillments
```

4. Copy the **Admin API access token** (starts with `shpat_`) — shown once
5. Add to `.env.local` as `SHOPIFY_ADMIN_API_TOKEN`

---

## Architecture

```
Browser (React components)
    ↓  fetch('/api/admin/orders')
Next.js API Routes  (/app/api/admin/*)
    ↓  validates session cookie
    ↓  calls Shopify Admin API with shpat_ token
Shopify Admin API   (admin.shopify.com/api/2025-01/graphql.json)
    ↓  returns data
Next.js API Route   → formats response
    ↓
Browser             → renders real data
```

**Why API routes and not direct server components?**  
Session validation happens in the API route — the Shopify token never reaches the client.  
Also allows future use from mobile or external tools without rewriting.

---

## Auth System

### Login Flow

```
POST /api/admin/auth/login
  body: { password: string }
  → bcrypt.compare(password, ADMIN_PASSWORD_HASH)
  → if match: set httpOnly cookie 'admin_session' (JWT, 8hr expiry)
  → if fail: 401 Unauthorized (no detail — prevents enumeration)
```

### Session Validation Middleware

```ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin/auth'

export async function middleware(req: NextRequest) {
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isLoginPage  = req.nextUrl.pathname === '/admin/login'
  const isApiAuth    = req.nextUrl.pathname.startsWith('/api/admin/auth')

  if (!isAdminRoute && !req.nextUrl.pathname.startsWith('/api/admin')) return NextResponse.next()
  if (isLoginPage || isApiAuth) return NextResponse.next()

  const session = req.cookies.get('admin_session')
  const valid   = session ? await verifyAdminSession(session.value) : false

  if (!valid) {
    const loginUrl = new URL('/admin/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
```

### Auth Library (`lib/admin/auth.ts`)

```ts
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET!)

export async function verifyPassword(password: string): Promise<boolean> {
  return bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH!)
}

export async function createAdminSession(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .setIssuedAt()
    .sign(SECRET)
}

export async function verifyAdminSession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET)
    return true
  } catch {
    return false
  }
}
```

Install:
```bash
npm install bcryptjs jose
npm install --save-dev @types/bcryptjs
```

---

## Shopify Admin API Client (`lib/admin/shopifyAdmin.ts`)

```ts
const ADMIN_ENDPOINT = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/graphql.json`

export async function adminFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(ADMIN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type':         'application/json',
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',   // admin data must always be fresh
  })

  if (!res.ok) throw new Error(`Shopify Admin API error: ${res.status}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data
}
```

---

## API Routes

All routes live under `app/api/admin/` and are server-side only.

### Auth

```
POST   /api/admin/auth/login     — verify password, set session cookie
POST   /api/admin/auth/logout    — clear session cookie
GET    /api/admin/auth/me        — verify session is still valid
```

### Orders

```
GET    /api/admin/orders         — list orders (filter: status, search, date range)
GET    /api/admin/orders/[id]    — single order detail
PATCH  /api/admin/orders/[id]    — mark as fulfilled
```

### Products

```
GET    /api/admin/products       — list products (filter: collection, status, search)
POST   /api/admin/products       — create product
GET    /api/admin/products/[id]  — single product
PUT    /api/admin/products/[id]  — update product + metafields
DELETE /api/admin/products/[id]  — delete product
POST   /api/admin/products/[id]/images — upload image to Shopify CDN
```

### Inventory

```
GET    /api/admin/inventory      — all products with stock levels
PATCH  /api/admin/inventory      — bulk update stock quantities
```

### Collections

```
GET    /api/admin/collections             — list all collections
GET    /api/admin/collections/[handle]    — products in collection
POST   /api/admin/collections/[handle]/products    — add product
DELETE /api/admin/collections/[handle]/products/[id] — remove product
```

### Customers

```
GET    /api/admin/customers       — list customers
GET    /api/admin/customers/[id]  — customer detail + order history
```

### Analytics

```
GET    /api/admin/analytics/revenue   — revenue over time (period param)
GET    /api/admin/analytics/orders    — orders over time
GET    /api/admin/analytics/products  — top products by revenue
```

### Import / Export

```
POST   /api/admin/import/products     — bulk create from CSV rows (array)
GET    /api/admin/export/products     — returns CSV string
GET    /api/admin/export/orders       — returns CSV string (date range)
GET    /api/admin/export/customers    — returns CSV string
```

---

## Shopify GraphQL Queries (Key Examples)

### Get Orders

```graphql
query GetOrders($first: Int!, $query: String) {
  orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
    edges {
      node {
        id
        name
        createdAt
        displayFulfillmentStatus
        displayFinancialStatus
        totalPriceSet { shopMoney { amount currencyCode } }
        customer { firstName lastName email }
        lineItems(first: 10) {
          edges {
            node {
              title
              quantity
              originalUnitPriceSet { shopMoney { amount } }
            }
          }
        }
      }
    }
  }
}
```

### Create Product

```graphql
mutation CreateProduct($input: ProductInput!) {
  productCreate(input: $input) {
    product {
      id
      handle
      title
    }
    userErrors { field message }
  }
}
```

### Update Product Metafields

```graphql
mutation UpdateMetafields($input: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $input) {
    metafields { key value }
    userErrors { field message }
  }
}
```

### Upload Image

```graphql
mutation CreateStagedUpload($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets {
      url
      resourceUrl
      parameters { name value }
    }
  }
}
```
*(Image upload is a 3-step process: stage → PUT to CDN → attach to product)*

### Bulk Inventory Update

```graphql
mutation SetInventoryQuantities($input: SetQuantitiesInput!) {
  inventorySetQuantities(input: $input) {
    inventoryAdjustmentGroup { id }
    userErrors { field message }
  }
}
```

---

## Import — Bulk Product Creation

### CSV Template Columns

```
Title | ShortDescription | Price | CompareAtPrice | Collection | Tags |
Vendor | SKU | Patent | Material | Colour | Style | Brand | Vintage |
BurnerSize | Fits | Era | PowerSource | ProductType | Condition |
Workshop | BenchTester | BenchTestDate | NetWeight | Edition |
FullDescription | ImageURL1 | ImageURL2 | ImageURL3 | Stock
```

### Import Flow (server-side)

```
1. Receive CSV rows array from frontend
2. Validate: Title required, Price must be number, Collection must be valid handle
3. For each valid row:
   a. If ImageURL present → fetch image → stagedUploadsCreate → PUT to CDN
   b. productCreate mutation with all fields
   c. metafieldsSet mutation with all acme.* values
   d. Attach image to product (productAppendImages)
   e. Set inventory quantity
4. Return: { created: n, failed: n, errors: [{row, reason}] }
```

**Rate limiting:**  
Shopify Admin API allows 40 requests/second (leaky bucket).  
Import queues 1 product per 500ms to stay well within limits.

---

## Security Hardening

### Headers (`next.config.ts`)
```ts
headers: async () => [{
  source: '/admin/:path*',
  headers: [
    { key: 'X-Frame-Options',           value: 'DENY' },
    { key: 'X-Content-Type-Options',    value: 'nosniff' },
    { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  ],
}]
```

### Input Validation (all API routes)
```ts
import { z } from 'zod'

const UpdateInventorySchema = z.array(z.object({
  productId: z.string().min(1),
  quantity:  z.number().int().min(0).max(9999),
}))

// In route handler:
const parsed = UpdateInventorySchema.safeParse(body)
if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })
```

Install:
```bash
npm install zod
```

### What is Prevented

| Attack | Prevention |
|---|---|
| Unauthorized access | httpOnly JWT cookie + middleware on all /admin routes |
| Session hijacking | Secure + SameSite=Strict cookie flags |
| Token exposure | Admin token only in server-side API routes, never in client bundle |
| SQL / GraphQL injection | Parameterized GraphQL variables — never string interpolation |
| XSS | Next.js escapes all JSX output by default; no dangerouslySetInnerHTML |
| Clickjacking | X-Frame-Options: DENY header on all admin routes |
| Brute force login | bcrypt (cost 12) slows each attempt to ~300ms; can add rate limiting |
| CSRF | SameSite=Strict cookie prevents cross-origin requests |
| Mass assignment | Zod schema validates every field before touching Shopify API |
| CSV injection | Import strips leading `=`, `+`, `-`, `@` from cell values |

---

## Forgot Password Flow (Plan 2)

### Overview

Single-admin system — password recovery is done via a **time-limited email reset link** sent to a fixed `ADMIN_EMAIL` address using Resend (free tier: 3,000 emails/month).

### New Environment Variables

```bash
ADMIN_EMAIL="you@acmelamp.com"          # where the reset link is sent
RESEND_API_KEY="re_xxxxxxxxxxxx"         # from resend.com — free tier is enough
```

### Install

```bash
npm install resend
```

### Full Flow

```
1. User clicks "Forgot password?" on /admin/login
2. POST /api/admin/auth/forgot
   → Generates a crypto.randomUUID() token
   → Stores token + expiry (15 min) in memory or Redis (Plan 2)
   → Sends email to ADMIN_EMAIL with reset link via Resend
   → Always returns 200 (never reveals if email matched — prevents enumeration)
3. User clicks link → /admin/reset-password?token=xxx
4. User submits new password
5. POST /api/admin/auth/reset
   → Verifies token exists and hasn't expired
   → bcrypt hashes new password
   → Updates ADMIN_PASSWORD_HASH (in-memory for now, env update for persistence)
   → Destroys token (single-use)
   → Returns 200
6. Redirect to /admin/login with success message
```

### New Files

#### `app/api/admin/auth/forgot/route.ts`
```ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'

// In-memory store (Plan 2: swap to Redis/DB for persistence across restarts)
export const resetTokens = new Map<string, { expiry: number }>()

export async function POST(req: NextRequest) {
  // Always return 200 — never confirm whether email matched
  const token  = crypto.randomUUID()
  const expiry = Date.now() + 15 * 60 * 1000  // 15 minutes

  resetTokens.set(token, { expiry })

  const resend   = new Resend(process.env.RESEND_API_KEY)
  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/reset-password?token=${token}`

  await resend.emails.send({
    from:    'Acme Admin <no-reply@acmelamp.com>',
    to:      process.env.ADMIN_EMAIL!,
    subject: 'Admin Dashboard — Password Reset',
    html: `
      <p>A password reset was requested for the Acme Lamp & Sign admin dashboard.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in 15 minutes. If you did not request this, ignore this email.</p>
    `,
  })

  return NextResponse.json({ ok: true })
}
```

#### `app/api/admin/auth/reset/route.ts`
```ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { resetTokens } from '../forgot/route'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  const entry = resetTokens.get(token)
  if (!entry || entry.expiry < Date.now()) {
    return NextResponse.json({ error: 'Reset link is invalid or has expired.' }, { status: 400 })
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
  }

  // Hash new password
  const hash = await bcrypt.hash(password, 12)

  // Plan 2: persist hash to DB or trigger env update via Vercel API
  // For now: in-memory update (survives until next server restart)
  process.env.ADMIN_PASSWORD_HASH = hash

  // Invalidate token — single use
  resetTokens.delete(token)

  return NextResponse.json({ ok: true })
}
```

#### `app/admin/login/page.tsx` — add Forgot Password link
```tsx
// Below the Sign in button, add:
<button
  type="button"
  onClick={() => setView('forgot')}
  className="w-full text-center text-[11px] text-(--admin-text-muted) hover:text-(--admin-text) transition-colors mt-1"
>
  Forgot password?
</button>
```

#### `app/admin/reset-password/page.tsx`
```tsx
// New page — reads ?token= from URL, shows new password + confirm fields
// POST /api/admin/auth/reset → on success redirect to /admin/login?reset=1
// On /admin/login: show "Password updated. Sign in with your new password." banner
```

### Security Rules for This Flow

| Rule | Implementation |
|---|---|
| Token is single-use | Deleted from store immediately after successful reset |
| Token expires in 15 min | `Date.now() + 15 * 60 * 1000` checked on every use |
| Response never confirms email | Always returns 200 on `/forgot` — prevents user enumeration |
| New password is bcrypt hashed | `bcrypt.hash(password, 12)` — cost factor 12 |
| Old sessions invalidated | `iron-session` cookie has no user state — old cookie won't match new password anyway |
| Reset link is HTTPS only | `NEXT_PUBLIC_SITE_URL` must be `https://` in production |

### Checklist

- [ ] Install `resend` — `npm install resend`
- [ ] Add `ADMIN_EMAIL` and `RESEND_API_KEY` to `.env.local` and Vercel
- [ ] Add `NEXT_PUBLIC_SITE_URL` to `.env.local` (e.g. `https://admin.acmelamp.com`)
- [ ] Create `app/api/admin/auth/forgot/route.ts`
- [ ] Create `app/api/admin/auth/reset/route.ts`
- [ ] Add "Forgot password?" link to `app/admin/login/page.tsx`
- [ ] Create `app/admin/reset-password/page.tsx` (token input + new password form)
- [ ] Test: request reset → receive email → click link → set new password → login succeeds → old link fails (single-use)
- [ ] Test: expired token (wait 15 min or manually set expiry to past) → link shows error
- [ ] Plan 2+: swap in-memory token store for Redis/Upstash for persistence across server restarts

---

## Auth Infrastructure Already in Place (Plan 1 → Plan 2 Bridge)

The following files were pre-built during Plan 1 so that Plan 2 auth is a config swap, not a rewrite:

| File | Status | Plan 2 Change |
|---|---|---|
| `middleware.ts` | ✅ Live — iron-session cookie check | Swap `verifyPassword` body only |
| `lib/admin/auth.ts` | ✅ Live — `verifyPassword()` abstraction | Change body to `bcrypt.compare()` |
| `lib/admin/session.ts` | ✅ Live — iron-session config | Set `secure: true` (already conditional on `NODE_ENV`) |
| `app/api/admin/auth/route.ts` | ✅ Live — POST login API | No change needed |
| `app/api/admin/logout/route.ts` | ✅ Live — POST logout API | No change needed |
| `.env.local` | ✅ Live — `ADMIN_PASSWORD`, `SESSION_SECRET` | Swap to `ADMIN_PASSWORD_HASH`, fill Shopify vars |

### The Single Plan 2 Auth Swap

In `lib/admin/auth.ts`, replace the body of `verifyPassword`:

```ts
// Plan 1 (current):
export async function verifyPassword(input: string): Promise<boolean> {
  return input === process.env.ADMIN_PASSWORD
}

// Plan 2 (production):
export async function verifyPassword(input: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.compare(input, process.env.ADMIN_PASSWORD_HASH ?? '')
}
```

Then in `.env.local`:
```bash
# Comment out:
# ADMIN_PASSWORD="acme2026"

# Uncomment and fill:
ADMIN_PASSWORD_HASH="$2b$12$..."   # generate: node -e "require('bcryptjs').hash('yourpassword',12).then(console.log)"
```

That is the **entire auth migration**. Everything else is already wired.

---

## Checklist

- [ ] Generate `ADMIN_SESSION_SECRET` — `openssl rand -hex 32`
- [ ] Hash admin password — `node -e "const b=require('bcryptjs');console.log(b.hashSync('yourpassword',12))"`
- [ ] Add all env vars to `.env.local` and Vercel
- [ ] Create Shopify private app with correct API scopes
- [ ] Copy `shpat_` token to `SHOPIFY_ADMIN_API_TOKEN`
- [ ] Build `lib/admin/shopifyAdmin.ts` — adminFetch helper
- [ ] Build `lib/admin/auth.ts` — verifyPassword, createAdminSession, verifyAdminSession
- [ ] Update `middleware.ts` — real JWT verification replacing Plan 1 stub
- [ ] Build `POST /api/admin/auth/login`
- [ ] Build `POST /api/admin/auth/logout`
- [ ] Build `GET /api/admin/orders` + wire Orders page
- [ ] Build `GET /api/admin/orders/[id]` + wire Order detail
- [ ] Build `PATCH /api/admin/orders/[id]` — fulfill order
- [ ] Build `GET /api/admin/products` + wire Products page
- [ ] Build `POST /api/admin/products` — create product
- [ ] Build `PUT /api/admin/products/[id]` — update product + metafields
- [ ] Build `DELETE /api/admin/products/[id]`
- [ ] Build image upload (3-step: staged → PUT → attach)
- [ ] Build `GET /api/admin/inventory` + `PATCH` bulk update
- [ ] Build `/api/admin/collections` routes
- [ ] Build `/api/admin/customers` routes
- [ ] Build `/api/admin/analytics` routes
- [ ] Build `/api/admin/import/products` with rate limiter
- [ ] Build `/api/admin/export/*` CSV endpoints
- [ ] Add Zod validation to every mutating API route
- [ ] Add security headers to `next.config.ts`
- [ ] End-to-end test: login → view orders → edit product → import CSV → logout
- [ ] Remove `lib/admin/mockData.ts` imports from all pages
- [ ] Verify no `SHOPIFY_ADMIN_API_TOKEN` appears in browser network tab

---

---

## Frontend Security Audit — 2026-05-28

Full scan performed across all `app/admin/` and `components/admin/` files.

### Results

| Vector | Scan | Finding | Status |
|---|---|---|---|
| XSS — `dangerouslySetInnerHTML` | All admin TSX files | **0 instances** in admin. One instance in `app/layout.tsx` for JSON-LD structured data — safe, content is hardcoded server-side, no user input | ✅ Clean |
| XSS — `innerHTML` / `eval()` | All admin TSX files | **0 instances** | ✅ Clean |
| Open redirect | `router.push()` calls | All destinations are hardcoded `/admin/*` strings — no user-controlled redirect | ✅ Clean |
| Env var leakage | `process.env.*` in client components | **0 instances** — no env vars referenced in any `'use client'` admin file | ✅ Clean |
| Dynamic `src` / `href` injection | Image and link elements | `src` in ImageUploader uses `blob:` URLs from `URL.createObjectURL` — browser-local, not user text | ✅ Clean |
| CSV injection | `escapeCSV()` in Products, Orders, Customers | **Fixed 2026-05-28** — added `replace(/^[=+\-@\t\r]/, "'$&")` to prefix formula-starting chars | ✅ Fixed |
| SQL injection | N/A | No direct DB queries in frontend — all data is mock or will be via parameterized GraphQL variables | ✅ N/A |

### Dependency Vulnerabilities (`npm audit`)

```
2 moderate severity vulnerabilities
postcss < 8.5.10 — XSS via unescaped </style> in CSS Stringify Output
Affected via: next → postcss (bundled)
```

**Assessment:** This affects PostCSS's CSS **stringify output**, not HTML rendering. It would only be exploitable if untrusted CSS strings were passed directly through PostCSS stringify — which does not happen in this codebase (all CSS is authored, not user-supplied). The suggested fix (`npm audit fix --force`) would downgrade Next.js to 9.3.3, which is a catastrophic breaking change.

**Action:** No fix needed now. Monitor for a Next.js patch release that bumps its PostCSS dependency above 8.5.10. Check again before production deployment.

### Security Headers (Add Before Production)

Add to `next.config.ts` before going live:

```ts
async headers() {
  return [{
    source: '/admin/:path*',
    headers: [
      { key: 'X-Frame-Options',        value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }]
},
```

---

*Plan created: 2026-05-28 · Acme Lamp & Sign Co. Admin Dashboard Phase 2*
*Security audit appended: 2026-05-28*
