# Analytics & Activity Logs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add storefront traffic analytics (page views per path and product, device, country) and an admin activity audit log (who did what and when) — both visible in the admin dashboard.

**Architecture:** Custom Supabase tables store raw page view events and admin action entries. A fire-and-forget client component tracks page views on every storefront route change. Admin API routes call a shared `logAction()` helper after mutating state. Two new admin pages surface the data. Vercel Analytics (`@vercel/analytics`) is installed alongside for Vercel's own dashboard.

**Tech Stack:** Next.js 16 App Router · Supabase (PostgreSQL) · Tailwind v4 · `@vercel/analytics` · `react-icons/bi` · iron-session (admin auth)

## Global Constraints

- Supabase client: `import supabaseAdmin from '@/lib/supabase'` — service role key, server-side only
- Admin auth guard pattern: `const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)` → check `session.isLoggedIn`
- Tailwind CSS variable syntax: `bg-(--admin-surface)`, `text-(--admin-text)`, etc. — no square bracket arbitrary values for admin tokens
- All admin pages: `export const dynamic = 'force-dynamic'` at top
- TypeScript strict — no `any`, no `as any`, explicit return types on all lib functions
- Never log admin passwords, session tokens, or Shopify API keys in activity log metadata
- `page_views` tracking must NOT fire on `/admin/*` routes
- Fire-and-forget tracking: never `await` page view calls from client — use `keepalive: true` and `.catch(() => {})`

---

## File Map

### New files
- `docs/supabase/migrations/003_analytics_activity.sql` — creates `page_views` and `admin_activity_log` tables
- `lib/admin/activityLog.ts` — `logAction()` write helper + `getActivityLog()` read helper
- `lib/analytics.ts` — server-side helpers to query `page_views` aggregates
- `app/api/track/pageview/route.ts` — public POST endpoint, no auth, inserts one page_view row
- `components/analytics/PageViewTracker.tsx` — client component, fires on every route change
- `app/admin/activity/page.tsx` — admin audit trail page (client component, filter tabs)

### Modified files
- `app/layout.tsx` — add `<Analytics />` (Vercel) + `<PageViewTracker />`
- `app/admin/analytics/page.tsx` — full rewrite from stub to real dashboard (server component)
- `app/api/admin/reviews/[id]/route.ts` — add `logAction()` on PATCH + DELETE
- `app/api/admin/content/[key]/route.ts` — add `logAction()` on PUT
- `app/api/admin/products/import/route.ts` — add `logAction()` on import complete
- `app/api/admin/products/bulk-status/route.ts` — add `logAction()` on bulk status change
- `components/admin/layout/AdminSidebar.tsx` — add Activity nav item
- `components/admin/layout/AdminBottomNav.tsx` — add Activity to MORE_ITEMS

---

### Task 1: Database Migration — page_views + admin_activity_log

**Files:**
- Create: `docs/supabase/migrations/003_analytics_activity.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- 003_analytics_activity.sql

-- ── Page views ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  path           text        NOT NULL,
  product_handle text,
  referrer       text,
  device         text        CHECK (device IN ('mobile', 'tablet', 'desktop')),
  country        text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_views_created_at_idx       ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_path_idx             ON page_views(path);
CREATE INDEX IF NOT EXISTS page_views_product_handle_idx   ON page_views(product_handle)
  WHERE product_handle IS NOT NULL;

-- ── Admin activity log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action       text        NOT NULL,
  entity_type  text        NOT NULL,
  entity_id    text,
  entity_label text,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_activity_log_created_at_idx  ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_activity_log_entity_type_idx ON admin_activity_log(entity_type);
```

- [ ] **Step 2: Run in Supabase SQL Editor**

Go to `supabase.com` → your project → SQL Editor → paste the file contents → Run.

Expected: "Success. No rows returned."

Verify:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('page_views', 'admin_activity_log');
```
Expected: 2 rows returned.

- [ ] **Step 3: Commit**

```bash
git add docs/supabase/migrations/003_analytics_activity.sql
git commit -m "feat: add page_views and admin_activity_log Supabase tables"
```

---

### Task 2: Install Vercel Analytics

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Install the package**

```bash
npm install @vercel/analytics
```

Expected output includes: `added 1 package`

- [ ] **Step 2: Add `<Analytics />` to root layout**

In `app/layout.tsx`, add the import at the top:
```ts
import { Analytics } from '@vercel/analytics/react'
```

Inside `<body>`, immediately before `</body>`:
```tsx
<ShellClient>{children}</ShellClient>
<Analytics />
```

The final body should look like:
```tsx
<body className="bg-parchment text-ink-iron min-h-screen antialiased flex flex-col">
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
  />
  <a href="#main-content" className="skip-to-content">
    Skip to content
  </a>
  <ShellClient>{children}</ShellClient>
  <Analytics />
</body>
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx package.json package-lock.json
git commit -m "feat: add Vercel Analytics to root layout"
```

---

### Task 3: Page View Tracking — API Route + Client Component + Root Layout

**Files:**
- Create: `app/api/track/pageview/route.ts`
- Create: `components/analytics/PageViewTracker.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `POST /api/track/pageview` accepts `{ path: string; productHandle?: string }`, returns `{ ok: true }` (202)
- Produces: `<PageViewTracker />` — zero-prop client component, add once to root layout

- [ ] **Step 1: Create the API route**

Create `app/api/track/pageview/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

function getDevice(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/mobile/i.test(ua)) return 'mobile'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  return 'desktop'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body.path !== 'string') {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const { path, productHandle } = body as { path: string; productHandle?: string }

    // Block admin page tracking at the server level too
    if (path.startsWith('/admin')) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const ua      = req.headers.get('user-agent') ?? ''
    const referrer = req.headers.get('referer') ?? null
    const country  = req.headers.get('x-vercel-ip-country') ?? null
    const device   = getDevice(ua)

    await supabaseAdmin.from('page_views').insert({
      path,
      product_handle: productHandle ?? null,
      referrer,
      country,
      device,
    })

    return NextResponse.json({ ok: true }, { status: 202 })
  } catch {
    // Never let tracking errors surface to the user
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create the client tracker component**

Create `components/analytics/PageViewTracker.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Never track admin routes
    if (pathname.startsWith('/admin')) return

    // Detect product handle from /catalog/[handle]
    const productMatch = pathname.match(/^\/catalog\/([^/]+)$/)
    const productHandle = productMatch?.[1] ?? undefined

    fetch('/api/track/pageview', {
      method:    'POST',
      headers:   { 'Content-Type': 'application/json' },
      body:      JSON.stringify({ path: pathname, productHandle }),
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}
```

- [ ] **Step 3: Add `<PageViewTracker />` to root layout**

In `app/layout.tsx`, add the import:
```ts
import PageViewTracker from '@/components/analytics/PageViewTracker'
```

Add it inside `<body>` alongside `<Analytics />`:
```tsx
<ShellClient>{children}</ShellClient>
<Analytics />
<PageViewTracker />
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 5: Manual test**

Run `npm run dev`, visit `/`, `/catalog`, and a product page. Then check Supabase:
```sql
SELECT path, product_handle, device, country, created_at
FROM page_views ORDER BY created_at DESC LIMIT 10;
```
Expected: rows appear for each page visited. Admin pages at `/admin/*` should NOT appear.

- [ ] **Step 6: Commit**

```bash
git add app/api/track/pageview/route.ts components/analytics/PageViewTracker.tsx app/layout.tsx
git commit -m "feat: add page view tracking API and client tracker component"
```

---

### Task 4: Admin Activity Log Library

**Files:**
- Create: `lib/admin/activityLog.ts`
- Create: `lib/analytics.ts`

**Interfaces:**
- Produces: `logAction(action, entityType, entityId?, entityLabel?, metadata?)` — void, fire-and-forget safe
- Produces: `getActivityLog(limit, offset, entityType?)` → `ActivityLogEntry[]`
- Produces: `getAnalyticsSummary()` → `AnalyticsSummary`
- Produces: `getTopProducts(days, limit)` → `{ handle: string; views: number }[]`
- Produces: `getTopPages(days, limit)` → `{ path: string; views: number }[]`
- Produces: `getDeviceBreakdown(days)` → `{ mobile: number; tablet: number; desktop: number }`
- Produces: `getRecentViews(limit)` → `PageViewRow[]`

- [ ] **Step 1: Create `lib/admin/activityLog.ts`**

```ts
import supabaseAdmin from '@/lib/supabase'

export type ActivityEntityType = 'review' | 'product' | 'content' | 'order'

export interface ActivityLogEntry {
  id:          string
  action:      string
  entityType:  ActivityEntityType
  entityId:    string | null
  entityLabel: string | null
  metadata:    Record<string, unknown> | null
  createdAt:   string
}

export async function logAction(
  action:       string,
  entityType:   ActivityEntityType,
  entityId?:    string,
  entityLabel?: string,
  metadata?:    Record<string, unknown>
): Promise<void> {
  await supabaseAdmin.from('admin_activity_log').insert({
    action,
    entity_type:  entityType,
    entity_id:    entityId    ?? null,
    entity_label: entityLabel ?? null,
    metadata:     metadata    ?? null,
  })
}

function toEntry(row: Record<string, unknown>): ActivityLogEntry {
  return {
    id:          row.id          as string,
    action:      row.action      as string,
    entityType:  row.entity_type as ActivityEntityType,
    entityId:    row.entity_id   as string | null,
    entityLabel: row.entity_label as string | null,
    metadata:    row.metadata    as Record<string, unknown> | null,
    createdAt:   row.created_at  as string,
  }
}

export async function getActivityLog(
  limit      = 50,
  offset     = 0,
  entityType?: ActivityEntityType
): Promise<ActivityLogEntry[]> {
  let q = supabaseAdmin
    .from('admin_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (entityType) q = q.eq('entity_type', entityType)

  const { data } = await q
  return (data ?? []).map(row => toEntry(row as Record<string, unknown>))
}
```

- [ ] **Step 2: Create `lib/analytics.ts`**

```ts
import supabaseAdmin from '@/lib/supabase'

export interface AnalyticsSummary {
  today:   number
  week:    number
  month:   number
  allTime: number
}

export interface PageViewRow {
  path:          string
  productHandle: string | null
  device:        string
  country:       string | null
  createdAt:     string
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function startOfToday(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [today, week, month, allTime] = await Promise.all([
    supabaseAdmin.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday()),
    supabaseAdmin.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(7)),
    supabaseAdmin.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(30)),
    supabaseAdmin.from('page_views').select('*', { count: 'exact', head: true }),
  ])
  return {
    today:   today.count   ?? 0,
    week:    week.count    ?? 0,
    month:   month.count   ?? 0,
    allTime: allTime.count ?? 0,
  }
}

export async function getTopProducts(days = 30, limit = 10): Promise<{ handle: string; views: number }[]> {
  const { data } = await supabaseAdmin
    .from('page_views')
    .select('product_handle')
    .not('product_handle', 'is', null)
    .gte('created_at', daysAgo(days))

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const h = row.product_handle as string
    counts[h] = (counts[h] ?? 0) + 1
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([handle, views]) => ({ handle, views }))
}

export async function getTopPages(days = 30, limit = 10): Promise<{ path: string; views: number }[]> {
  const { data } = await supabaseAdmin
    .from('page_views')
    .select('path')
    .gte('created_at', daysAgo(days))

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const p = row.path as string
    counts[p] = (counts[p] ?? 0) + 1
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([path, views]) => ({ path, views }))
}

export async function getDeviceBreakdown(days = 30): Promise<{ mobile: number; tablet: number; desktop: number }> {
  const { data } = await supabaseAdmin
    .from('page_views')
    .select('device')
    .gte('created_at', daysAgo(days))

  const result = { mobile: 0, tablet: 0, desktop: 0 }
  for (const row of data ?? []) {
    const d = row.device as string
    if (d === 'mobile' || d === 'tablet' || d === 'desktop') result[d]++
  }
  return result
}

export async function getRecentViews(limit = 20): Promise<PageViewRow[]> {
  const { data } = await supabaseAdmin
    .from('page_views')
    .select('path, product_handle, device, country, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map(row => ({
    path:          row.path          as string,
    productHandle: row.product_handle as string | null,
    device:        row.device        as string,
    country:       row.country       as string | null,
    createdAt:     row.created_at    as string,
  }))
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add lib/admin/activityLog.ts lib/analytics.ts
git commit -m "feat: add activity log and analytics query helpers"
```

---

### Task 5: Hook Activity Logging Into Existing Admin APIs

**Files:**
- Modify: `app/api/admin/reviews/[id]/route.ts`
- Modify: `app/api/admin/content/[key]/route.ts`
- Modify: `app/api/admin/products/import/route.ts`
- Modify: `app/api/admin/products/bulk-status/route.ts`

**Interfaces:**
- Consumes: `logAction(action, entityType, entityId?, entityLabel?, metadata?)` from `@/lib/admin/activityLog`

- [ ] **Step 1: Add logging to reviews API**

In `app/api/admin/reviews/[id]/route.ts`, add the import at the top:
```ts
import { logAction } from '@/lib/admin/activityLog'
```

In the PATCH handler, after the status update succeeds, add before the return:
```ts
const actionLabels: Record<string, string> = {
  approve:    'review.approve',
  deactivate: 'review.deactivate',
  activate:   'review.activate',
  reject:     'review.reject',
}
await logAction(
  actionLabels[action] ?? `review.${action}`,
  'review',
  id,
  undefined,
  { action }
).catch(() => {})
```

In the DELETE handler, after the delete succeeds, add before the return:
```ts
await logAction('review.delete', 'review', id).catch(() => {})
```

- [ ] **Step 2: Add logging to content API**

In `app/api/admin/content/[key]/route.ts`, add the import:
```ts
import { logAction } from '@/lib/admin/activityLog'
```

In the PUT handler, after `await setContent(...)`, add:
```ts
await logAction('content.save', 'content', undefined, key as string).catch(() => {})
```

- [ ] **Step 3: Add logging to products import API**

In `app/api/admin/products/import/route.ts`, add the import:
```ts
import { logAction } from '@/lib/admin/activityLog'
```

After the import loop completes and before returning the response, add:
```ts
const createdCount = results.filter((r: { status: string }) => r.status === 'created').length
await logAction('product.import', 'product', undefined, `${createdCount} products imported`, {
  total:   rows.length,
  created: createdCount,
}).catch(() => {})
```

- [ ] **Step 4: Add logging to bulk status API**

In `app/api/admin/products/bulk-status/route.ts`, add the import:
```ts
import { logAction } from '@/lib/admin/activityLog'
```

After the bulk status update succeeds, add:
```ts
await logAction('product.bulk-status', 'product', undefined, `${ids.length} products → ${status}`, {
  count: ids.length,
  status,
}).catch(() => {})
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 6: Manual test**

Approve a review in the admin. Check Supabase:
```sql
SELECT action, entity_type, entity_label, created_at
FROM admin_activity_log ORDER BY created_at DESC LIMIT 5;
```
Expected: a row with `action = 'review.approve'`.

- [ ] **Step 7: Commit**

```bash
git add app/api/admin/reviews/[id]/route.ts app/api/admin/content/[key]/route.ts \
        app/api/admin/products/import/route.ts app/api/admin/products/bulk-status/route.ts
git commit -m "feat: hook activity logging into reviews, content, and product admin APIs"
```

---

### Task 6: Admin Analytics Dashboard Page

**Files:**
- Modify: `app/admin/analytics/page.tsx` (full rewrite from stub)

**Interfaces:**
- Consumes: `getAnalyticsSummary()`, `getTopProducts()`, `getTopPages()`, `getDeviceBreakdown()`, `getRecentViews()` from `@/lib/analytics`

- [ ] **Step 1: Rewrite `app/admin/analytics/page.tsx`**

```tsx
export const dynamic = 'force-dynamic'

import { getAnalyticsSummary, getTopProducts, getTopPages, getDeviceBreakdown, getRecentViews } from '@/lib/analytics'
import { BiMobile, BiDesktop, BiTablet, BiTrendingUp, BiTime } from 'react-icons/bi'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-5">
      <p className="text-[11px] font-mono uppercase tracking-wider text-(--admin-text-muted) mb-2">{label}</p>
      <p className="text-[28px] font-semibold text-(--admin-text) leading-none">{value.toLocaleString()}</p>
    </div>
  )
}

function DeviceBar({ label, count, total, icon: Icon }: { label: string; count: number; total: number; icon: React.ElementType }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <Icon size={14} className="text-(--admin-text-muted) shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-[12px] text-(--admin-text)">{label}</span>
          <span className="text-[12px] font-mono text-(--admin-text-muted)">{count.toLocaleString()} · {pct}%</span>
        </div>
        <div className="h-1.5 bg-(--admin-surface-2) rounded-full overflow-hidden">
          <div className="h-full bg-(--admin-accent) rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default async function AdminAnalyticsPage() {
  const [summary, topProducts, topPages, devices, recent] = await Promise.all([
    getAnalyticsSummary(),
    getTopProducts(30, 10),
    getTopPages(30, 10),
    getDeviceBreakdown(30),
    getRecentViews(20),
  ])

  const totalDevices = devices.mobile + devices.tablet + devices.desktop

  return (
    <div className="p-6 max-w-5xl space-y-8">

      <div>
        <h1 className="text-[20px] font-semibold text-(--admin-text)">Analytics</h1>
        <p className="text-[13px] text-(--admin-text-muted) mt-0.5">Storefront traffic — last 30 days</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today"    value={summary.today}   />
        <StatCard label="7 days"   value={summary.week}    />
        <StatCard label="30 days"  value={summary.month}   />
        <StatCard label="All time" value={summary.allTime} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top products */}
        <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <BiTrendingUp size={14} className="text-(--admin-text-muted)" />
            <p className="text-[13px] font-semibold text-(--admin-text)">Top Products (30 days)</p>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-[12px] text-(--admin-text-muted)">No product views yet.</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.handle} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-(--admin-text-muted) w-5 text-right shrink-0">{i + 1}</span>
                  <span className="flex-1 text-[12px] text-(--admin-text) truncate font-mono">{p.handle}</span>
                  <span className="text-[12px] font-mono text-(--admin-text-muted) shrink-0">{p.views.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top pages */}
        <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <BiTrendingUp size={14} className="text-(--admin-text-muted)" />
            <p className="text-[13px] font-semibold text-(--admin-text)">Top Pages (30 days)</p>
          </div>
          {topPages.length === 0 ? (
            <p className="text-[12px] text-(--admin-text-muted)">No page views yet.</p>
          ) : (
            <div className="space-y-2">
              {topPages.map((p, i) => (
                <div key={p.path} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-(--admin-text-muted) w-5 text-right shrink-0">{i + 1}</span>
                  <span className="flex-1 text-[12px] text-(--admin-text) truncate font-mono">{p.path}</span>
                  <span className="text-[12px] font-mono text-(--admin-text-muted) shrink-0">{p.views.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Device breakdown */}
        <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-5">
          <p className="text-[13px] font-semibold text-(--admin-text) mb-4">Device Breakdown (30 days)</p>
          <div className="space-y-4">
            <DeviceBar label="Mobile"  count={devices.mobile}  total={totalDevices} icon={BiMobile}  />
            <DeviceBar label="Desktop" count={devices.desktop} total={totalDevices} icon={BiDesktop} />
            <DeviceBar label="Tablet"  count={devices.tablet}  total={totalDevices} icon={BiTablet}  />
          </div>
        </div>

        {/* Recent views */}
        <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <BiTime size={14} className="text-(--admin-text-muted)" />
            <p className="text-[13px] font-semibold text-(--admin-text)">Recent Visitors</p>
          </div>
          <div className="space-y-2">
            {recent.map((v, i) => (
              <div key={i} className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-(--admin-text) truncate flex-1">{v.path}</span>
                <span className="text-(--admin-text-muted) shrink-0">{v.device}</span>
                {v.country && <span className="text-(--admin-text-muted) shrink-0">{v.country}</span>}
                <span className="text-(--admin-text-muted) shrink-0">{timeAgo(v.createdAt)}</span>
              </div>
            ))}
            {recent.length === 0 && (
              <p className="text-[12px] text-(--admin-text-muted)">No visitors yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Manual test**

Visit several storefront pages, then open `/admin/analytics`. Confirm:
- Summary cards show non-zero numbers
- Top Pages table lists visited paths
- Any `/catalog/[handle]` visits appear in Top Products
- Recent Visitors shows the last 20 rows

- [ ] **Step 4: Commit**

```bash
git add app/admin/analytics/page.tsx
git commit -m "feat: build admin analytics dashboard with views, top pages/products, device breakdown"
```

---

### Task 7: Admin Activity Log Page

**Files:**
- Create: `app/admin/activity/page.tsx`

**Interfaces:**
- Consumes: `getActivityLog(limit, offset, entityType?)` from `@/lib/admin/activityLog`
- Consumes: `ActivityLogEntry`, `ActivityEntityType` types

- [ ] **Step 1: Create `app/admin/activity/page.tsx`**

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { BiPackage, BiStar, BiEditAlt, BiCart, BiHistory } from 'react-icons/bi'
import type { ActivityLogEntry, ActivityEntityType } from '@/lib/admin/activityLog'

type Filter = ActivityEntityType | 'all'

const ENTITY_ICONS: Record<ActivityEntityType, React.ElementType> = {
  product: BiPackage,
  review:  BiStar,
  content: BiEditAlt,
  order:   BiCart,
}

const ACTION_LABELS: Record<string, string> = {
  'review.approve':      'Approved a review',
  'review.deactivate':   'Deactivated a review',
  'review.activate':     'Re-activated a review',
  'review.reject':       'Rejected a review',
  'review.delete':       'Deleted a review',
  'content.save':        'Saved content',
  'product.import':      'Bulk imported products',
  'product.bulk-status': 'Changed product status',
}

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All',      value: 'all'     },
  { label: 'Products', value: 'product' },
  { label: 'Reviews',  value: 'review'  },
  { label: 'Content',  value: 'content' },
  { label: 'Orders',   value: 'order'   },
]

export default function AdminActivityPage() {
  const [filter,  setFilter]  = useState<Filter>('all')
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [offset,  setOffset]  = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const PAGE = 30

  const load = useCallback(async (f: Filter, o: number, append = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE), offset: String(o) })
      if (f !== 'all') params.set('entityType', f)
      const res = await fetch(`/api/admin/activity?${params}`)
      if (!res.ok) return
      const data: ActivityLogEntry[] = await res.json()
      setEntries(prev => append ? [...prev, ...data] : data)
      setHasMore(data.length === PAGE)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setOffset(0)
    setEntries([])
    load(filter, 0)
  }, [filter, load])

  function loadMore() {
    const next = offset + PAGE
    setOffset(next)
    load(filter, next, true)
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-semibold text-(--admin-text)">Activity Log</h1>
          <p className="text-[13px] text-(--admin-text-muted) mt-0.5">All admin actions — most recent first</p>
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

      {loading && entries.length === 0 ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-(--admin-surface-2) animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-(--admin-text-muted)">
          <BiHistory size={36} className="mb-3 opacity-30" />
          <p className="text-[14px]">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => {
            const Icon = ENTITY_ICONS[entry.entityType] ?? BiHistory
            const label = ACTION_LABELS[entry.action] ?? entry.action
            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 bg-(--admin-surface) border border-(--admin-border) rounded-lg px-4 py-3"
              >
                <div className="w-7 h-7 rounded-md bg-(--admin-surface-2) flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={13} className="text-(--admin-text-muted)" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-(--admin-text) font-medium">{label}</p>
                  {entry.entityLabel && (
                    <p className="text-[11px] font-mono text-(--admin-text-muted) truncate mt-0.5">{entry.entityLabel}</p>
                  )}
                </div>
                <span className="text-[11px] font-mono text-(--admin-text-muted) shrink-0 mt-0.5">
                  {timeAgo(entry.createdAt)}
                </span>
              </div>
            )
          })}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-2.5 text-[13px] text-(--admin-text-muted) hover:text-(--admin-text) border border-(--admin-border) rounded-lg transition-colors disabled:opacity-40"
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create the API route for activity log**

Create `app/api/admin/activity/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getActivityLog } from '@/lib/admin/activityLog'
import type { ActivityEntityType } from '@/lib/admin/activityLog'

const VALID_ENTITY_TYPES: ActivityEntityType[] = ['review', 'product', 'content', 'order']

export async function GET(req: NextRequest) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params     = req.nextUrl.searchParams
  const limit      = Math.min(Number(params.get('limit')  ?? 30), 100)
  const offset     = Math.max(Number(params.get('offset') ?? 0),  0)
  const entityType = params.get('entityType') as ActivityEntityType | null

  if (entityType && !VALID_ENTITY_TYPES.includes(entityType)) {
    return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 })
  }

  const entries = await getActivityLog(limit, offset, entityType ?? undefined)
  return NextResponse.json(entries)
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Manual test**

Perform an admin action (approve a review, save content). Open `/admin/activity`. Confirm the action appears at the top of the timeline with the correct label and entity type icon.

- [ ] **Step 5: Commit**

```bash
git add app/admin/activity/page.tsx app/api/admin/activity/route.ts
git commit -m "feat: add admin activity log page and API route"
```

---

### Task 8: Add Activity to Admin Sidebar and Bottom Nav

**Files:**
- Modify: `components/admin/layout/AdminSidebar.tsx`
- Modify: `components/admin/layout/AdminBottomNav.tsx`

- [ ] **Step 1: Update AdminSidebar.tsx**

Add `BiHistory` to the existing react-icons import at the top:
```ts
import {
  BiHomeAlt, BiCart, BiPackage, BiArchive, BiCollection,
  BiUser, BiBarChartAlt2, BiCog, BiLogOut, BiSun, BiMoon,
  BiEditAlt, BiStar, BiHistory,
} from 'react-icons/bi'
```

Add Activity to the `NAV_MAIN` array after Reviews:
```ts
{ label: 'Activity', href: '/admin/activity', icon: BiHistory },
```

The full NAV_MAIN becomes:
```ts
const NAV_MAIN = [
  { label: 'Overview',    href: '/admin/overview',    icon: BiHomeAlt                                          },
  { label: 'Orders',      href: '/admin/orders',      icon: BiCart,        badge: unfulfilledCount || undefined },
  { label: 'Products',    href: '/admin/products',    icon: BiPackage                                          },
  { label: 'Inventory',   href: '/admin/inventory',   icon: BiArchive                                          },
  { label: 'Collections', href: '/admin/collections', icon: BiCollection                                       },
  { label: 'Content',     href: '/admin/content/home', icon: BiEditAlt,    activePrefix: '/admin/content'      },
  { label: 'Customers',   href: '/admin/customers',   icon: BiUser                                             },
  { label: 'Analytics',   href: '/admin/analytics',   icon: BiBarChartAlt2                                     },
  { label: 'Reviews',     href: '/admin/reviews',     icon: BiStar, badge: pendingReviewCount || undefined      },
  { label: 'Activity',    href: '/admin/activity',    icon: BiHistory                                          },
]
```

- [ ] **Step 2: Update AdminBottomNav.tsx**

Read the file, find the MORE_ITEMS array (or equivalent), and add:
```ts
{ label: 'Activity', href: '/admin/activity', icon: BiHistory }
```

Also add `BiHistory` to the import from `react-icons/bi`.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Manual test**

Open the admin sidebar. Confirm "Activity" appears after "Reviews" in the nav. Click it — the activity log page loads. Click "Analytics" — the analytics dashboard loads. On mobile, confirm both appear in the bottom nav.

- [ ] **Step 5: Commit**

```bash
git add components/admin/layout/AdminSidebar.tsx components/admin/layout/AdminBottomNav.tsx
git commit -m "feat: add Analytics and Activity links to admin sidebar and bottom nav"
```

---

## Self-Review

**Spec coverage:**
- ✅ Storefront traffic tracking (page views, device, country, product handle)
- ✅ Vercel Analytics for Vercel dashboard
- ✅ Admin analytics page (summary cards, top products, top pages, device breakdown, recent views)
- ✅ Admin activity log (all CRUD actions logged, filter by entity type, load more)
- ✅ Logging hooked into: reviews, content saves, product imports, bulk status
- ✅ Admin sidebar + bottom nav updated
- ✅ No tracking on admin routes (double-guarded: client + server)
- ✅ Fire-and-forget tracking (keepalive, .catch)

**Placeholder scan:** None found — all steps contain real code.

**Type consistency:**
- `ActivityEntityType` defined in Task 4, used in Tasks 5, 7 ✅
- `logAction` signature defined in Task 4, consumed in Task 5 ✅
- `getActivityLog` defined in Task 4, consumed via API in Task 7 ✅
- Analytics helpers defined in Task 4, consumed in Task 6 ✅
