# Admin Overview Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two data bugs, add parallel Suspense loading with skeletons, add Quick Actions + Unfulfilled stat + Pending Items widgets, and wire the existing period toggle to real chart data — all scoped to the admin overview page.

**Architecture:** Split the monolithic async overview page into focused async sub-components, each wrapped in its own Suspense boundary. `React.cache()` deduplicates the analytics fetch across all components that need it. PendingItems hits Supabase directly as a server component. QuickActions is static and renders immediately.

**Tech Stack:** Next.js 16 App Router, React.cache, Tailwind v4 (`@theme {}` tokens), Supabase JS, `react-icons/bi`, existing shared admin components (`SectionCard`, `StatCard`, `Badge`, `PageHeader`).

## Global Constraints

- Tailwind v4 only — use CSS variable syntax like `bg-(--admin-surface)`, `text-(--admin-text)`. No `tailwind.config.ts` classes.
- Never `createClient()` at module level in server components or API routes — always wrap in `function getSupabase() { return createClient(...) }`.
- `React.cache()` only works in server components (App Router). Never import it in client components.
- All new component files go in `components/admin/overview/` unless specified otherwise.
- Do not push to git — user handles all git operations.
- Do not modify any admin page other than `app/admin/overview/page.tsx`.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/admin/shopifyAdmin.ts` | Modify | Add `totalRevenue` to `AnalyticsData` interface + return value |
| `lib/admin/mockData.ts` | Modify | Update mock order IDs to `ACMEORDER-` prefix |
| `lib/admin/overviewCache.ts` | Create | `getCachedAnalytics` via `React.cache()` |
| `components/admin/overview/skeletons.tsx` | Create | All pulse skeleton components for Suspense fallbacks |
| `components/admin/overview/QuickActions.tsx` | Create | Static 3-button quick action card |
| `components/admin/overview/StatCards.tsx` | Create | Async: Revenue · Orders · Customers · Unfulfilled stat cards |
| `components/admin/overview/ChartsRow.tsx` | Create | Async server wrapper — passes `chartData` to existing `RevenueChart` + `OrdersChart` |
| `components/admin/overview/RecentOrders.tsx` | Create | Async: last 8 orders list |
| `components/admin/overview/LowStock.tsx` | Create | Async: products with stock ≤ 3 |
| `components/admin/overview/TopProducts.tsx` | Create | Async: top 5 products by revenue |
| `components/admin/overview/AllTimeSummary.tsx` | Create | Async: all-time totals using real `totalRevenue` |
| `components/admin/overview/PendingItems.tsx` | Create | Async: Supabase unread contacts + pending reviews counts |
| `app/admin/overview/page.tsx` | Rewrite | Sync shell with all Suspense boundaries |

---

### Task 1: Fix Data Layer — totalRevenue + mock order IDs

**Files:**
- Modify: `lib/admin/shopifyAdmin.ts`
- Modify: `lib/admin/mockData.ts`

**Interfaces:**
- Produces: `AnalyticsData.totalRevenue: number` — consumed by Task 7 (`AllTimeSummary`)

- [ ] **Step 1: Add `totalRevenue` to the `AnalyticsData` interface**

In `lib/admin/shopifyAdmin.ts`, find the `interface AnalyticsData` block (around line 1488). Add `totalRevenue` after `avgOrderValue`:

```ts
interface AnalyticsData {
  revenue:         RevenueStats
  orderCount:      { today: number; week: number; month: number }
  fulfilledOrders: number
  totalOrders:     number
  totalRevenue:    number          // ← ADD THIS LINE
  totalShipping:   number
  totalTaxes:      number
  avgOrderValue:   number
  customers:       { total: number; repeat: number; returningRate: number }
  topProducts:     { title: string; revenue: number; unitsSold: number }[]
  chartData:       { date: string; revenue: number; orders: number }[]
}
```

- [ ] **Step 2: Return `totalRevenue` from `getAdminAnalytics()`**

In the `return { ... }` block of `getAdminAnalytics()` (around line 1588), add `totalRevenue`:

```ts
return {
  revenue:         { today: todayRev, week: weekRev, month: monthRev, todayChange: pctChange(todayRev, yesterdayRev), weekChange: pctChange(weekRev, lastWeekRev), monthChange: pctChange(monthRev, lastMonthRev) },
  orderCount:      { today: todayOrders.length, week: weekOrders.length, month: monthOrders.length },
  fulfilledOrders,
  totalOrders,
  totalRevenue,    // ← ADD THIS LINE (variable already computed above as sumRevenue(orders))
  totalShipping,
  totalTaxes,
  avgOrderValue:   Math.round(avgOrderValue * 100) / 100,
  customers:       { total: customers.length, repeat: repeatCustomers, returningRate },
  topProducts,
  chartData,
}
```

- [ ] **Step 3: Update mock order IDs to use ACMEORDER- prefix**

In `lib/admin/mockData.ts`, find all `id:` fields in the `mockOrders` array and update them to use the `ACMEORDER-` prefix. There are 5 mock orders (ORD-1001 through ORD-1005 and beyond — update all of them):

```ts
// Change every mock order id from e.g. 'ORD-1001' to 'ACMEORDER-1001'
// Find: id: 'ORD-1001'  →  Replace: id: 'ACMEORDER-1001'
// Find: id: 'ORD-1002'  →  Replace: id: 'ACMEORDER-1002'
// Find: id: 'ORD-1003'  →  Replace: id: 'ACMEORDER-1003'
// Find: id: 'ORD-1004'  →  Replace: id: 'ACMEORDER-1004'
// Find: id: 'ORD-1005'  →  Replace: id: 'ACMEORDER-1005'
// Continue for any remaining mock orders (ORD-1006, ORD-1007, etc.)
```

- [ ] **Step 4: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors related to `totalRevenue` or `AnalyticsData`.

---

### Task 2: React Cache + Skeletons

**Files:**
- Create: `lib/admin/overviewCache.ts`
- Create: `components/admin/overview/skeletons.tsx`

**Interfaces:**
- Produces: `getCachedAnalytics()` — returns `Promise<AnalyticsData>`, consumed by Tasks 4, 5, 7, 8
- Produces: `StatCardsSkeleton`, `ChartsSkeleton`, `RecentOrdersSkeleton`, `PendingItemsSkeleton`, `LowStockSkeleton`, `TopProductsSkeleton`, `AllTimeSummarySkeleton` — consumed by Task 9

- [ ] **Step 1: Create `lib/admin/overviewCache.ts`**

```ts
import { cache } from 'react'
import { getAdminAnalytics } from './shopifyAdmin'

export const getCachedAnalytics = cache(getAdminAnalytics)
```

- [ ] **Step 2: Create `components/admin/overview/skeletons.tsx`**

```tsx
function PulseBox({ className }: { className: string }) {
  return <div className={`animate-pulse bg-(--admin-border) rounded-lg ${className}`} />
}

function PulseRow({ className = 'h-9' }: { className?: string }) {
  return <div className={`animate-pulse bg-(--admin-border) rounded-md ${className}`} />
}

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => <PulseBox key={i} className="h-24" />)}
    </div>
  )
}

export function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <PulseBox className="lg:col-span-2 h-56" />
      <PulseBox className="h-56" />
    </div>
  )
}

export function RecentOrdersSkeleton() {
  return (
    <div className="rounded-xl border border-(--admin-border) bg-(--admin-surface) overflow-hidden">
      <div className="px-5 py-4 border-b border-(--admin-border)">
        <PulseRow className="h-4 w-32" />
      </div>
      <div className="divide-y divide-(--admin-border)">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center justify-between px-5 py-3 gap-4">
            <div className="flex-1 space-y-1.5">
              <PulseRow className="h-3 w-40" />
              <PulseRow className="h-3 w-28" />
            </div>
            <PulseRow className="h-4 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PendingItemsSkeleton() {
  return (
    <div className="rounded-xl border border-(--admin-border) bg-(--admin-surface) overflow-hidden">
      <div className="px-4 py-3.5 border-b border-(--admin-border)">
        <PulseRow className="h-4 w-28" />
      </div>
      <div className="divide-y divide-(--admin-border)">
        {[0, 1].map(i => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <PulseRow className="h-3 w-32" />
            <PulseRow className="h-5 w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function LowStockSkeleton() {
  return (
    <div className="rounded-xl border border-(--admin-border) bg-(--admin-surface) overflow-hidden">
      <div className="px-4 py-3.5 border-b border-(--admin-border)">
        <PulseRow className="h-4 w-20" />
      </div>
      <div className="divide-y divide-(--admin-border)">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <PulseRow className="h-3 w-36" />
            <PulseRow className="h-3 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TopProductsSkeleton() {
  return (
    <div className="rounded-xl border border-(--admin-border) bg-(--admin-surface) p-4 space-y-2">
      <PulseRow className="h-4 w-24 mb-3" />
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center justify-between">
          <PulseRow className="h-3 w-32" />
          <PulseRow className="h-3 w-14" />
        </div>
      ))}
    </div>
  )
}

export function AllTimeSummarySkeleton() {
  return (
    <div className="rounded-xl border border-(--admin-border) bg-(--admin-surface) overflow-hidden">
      <div className="px-4 py-3.5 border-b border-(--admin-border)">
        <PulseRow className="h-4 w-28" />
      </div>
      <div className="divide-y divide-(--admin-border)">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <PulseRow className="h-3 w-28" />
            <PulseRow className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

---

### Task 3: QuickActions (static component)

**Files:**
- Create: `components/admin/overview/QuickActions.tsx`

**Interfaces:**
- Produces: `<QuickActions />` — no props, no data fetch, consumed by Task 9

- [ ] **Step 1: Create `components/admin/overview/QuickActions.tsx`**

```tsx
import Link from 'next/link'
import { BiPlus, BiPackage, BiEnvelope } from 'react-icons/bi'

const ACTIONS = [
  { label: 'Add Product',       href: '/admin/products/new',    icon: <BiPlus size={14} /> },
  { label: 'View Unfulfilled',  href: '/admin/orders',          icon: <BiPackage size={14} /> },
  { label: 'Go to Inbox',       href: '/admin/communications',  icon: <BiEnvelope size={14} /> },
]

export default function QuickActions() {
  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      {ACTIONS.map(a => (
        <Link
          key={a.href}
          href={a.href}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-(--admin-border) text-[12px] text-(--admin-text-soft) hover:text-(--admin-text) hover:border-(--admin-text-muted) hover:bg-(--admin-surface-2) transition-colors"
        >
          {a.icon}
          {a.label}
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

---

### Task 4: StatCards async sub-component

**Files:**
- Create: `components/admin/overview/StatCards.tsx`

**Interfaces:**
- Consumes: `getCachedAnalytics()` from `lib/admin/overviewCache` (Task 2)
- Consumes: `StatCard` from `components/admin/shared/StatCard`
- Produces: `<StatCards />` — no props, consumed by Task 9

- [ ] **Step 1: Create `components/admin/overview/StatCards.tsx`**

```tsx
import { BiDollar, BiCart, BiTrendingUp, BiPackage } from 'react-icons/bi'
import StatCard from '@/components/admin/shared/StatCard'
import { getCachedAnalytics } from '@/lib/admin/overviewCache'
import { formatCurrency } from '@/lib/admin/utils'

export default async function StatCards() {
  const analytics = await getCachedAnalytics()

  const unfulfilled = analytics.totalOrders - analytics.fulfilledOrders

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Revenue"
        value={formatCurrency(analytics.revenue.month)}
        change={analytics.revenue.monthChange}
        period="Last 30 days"
        icon={<BiDollar size={16} />}
      />
      <StatCard
        label="Orders"
        value={String(analytics.orderCount.month)}
        change={0}
        period="Last 30 days"
        icon={<BiCart size={16} />}
      />
      <StatCard
        label="Customers"
        value={String(analytics.customers.total)}
        change={analytics.customers.returningRate}
        period={`${analytics.customers.repeat} repeat`}
        icon={<BiTrendingUp size={16} />}
      />
      <div className="relative">
        <StatCard
          label="Unfulfilled"
          value={String(unfulfilled)}
          change={0}
          period="Needs fulfillment"
          icon={<BiPackage size={16} />}
        />
        {unfulfilled > 0 && (
          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-(--admin-red)" />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

---

### Task 5: ChartsRow async sub-component

**Files:**
- Create: `components/admin/overview/ChartsRow.tsx`

**Interfaces:**
- Consumes: `getCachedAnalytics()` from `lib/admin/overviewCache` (Task 2)
- Consumes: existing `RevenueChart` from `components/admin/charts/RevenueChart` (already has period toggle + `data` prop)
- Consumes: existing `OrdersChart` from `components/admin/charts/OrdersChart`
- Produces: `<ChartsRow />` — no props, consumed by Task 9

Note: `RevenueChart` is already a `'use client'` component with its own built-in 7/30/90 day period toggle (via `useState`). This component just needs to pass the real `chartData` to it. No separate client component needed.

- [ ] **Step 1: Create `components/admin/overview/ChartsRow.tsx`**

```tsx
import SectionCard from '@/components/admin/shared/SectionCard'
import RevenueChart from '@/components/admin/charts/RevenueChart'
import OrdersChart from '@/components/admin/charts/OrdersChart'
import { getCachedAnalytics } from '@/lib/admin/overviewCache'

export default async function ChartsRow() {
  const analytics = await getCachedAnalytics()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <SectionCard className="lg:col-span-2">
        <RevenueChart data={analytics.chartData} />
      </SectionCard>
      <SectionCard>
        <OrdersChart data={analytics.chartData} />
      </SectionCard>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

---

### Task 6: RecentOrders async sub-component

**Files:**
- Create: `components/admin/overview/RecentOrders.tsx`

**Interfaces:**
- Consumes: `getAdminOrders(8)` from `lib/admin/shopifyAdmin`
- Consumes: `Badge`, `orderStatusVariant`, `paymentStatusVariant` from `components/admin/shared/Badge`
- Consumes: `SectionCard` from `components/admin/shared/SectionCard`
- Consumes: `formatCurrency`, `formatDate` from `lib/admin/utils`
- Produces: `<RecentOrders />` — no props, consumed by Task 9

- [ ] **Step 1: Create `components/admin/overview/RecentOrders.tsx`**

```tsx
import Link from 'next/link'
import { BiLinkExternal } from 'react-icons/bi'
import SectionCard from '@/components/admin/shared/SectionCard'
import Badge, { orderStatusVariant, paymentStatusVariant } from '@/components/admin/shared/Badge'
import { getAdminOrders } from '@/lib/admin/shopifyAdmin'
import { formatCurrency, formatDate } from '@/lib/admin/utils'

export default async function RecentOrders() {
  const orders = await getAdminOrders(8)

  return (
    <SectionCard noPadding className="lg:col-span-2">
      <div className="flex items-center justify-between px-5 py-4 border-b border-(--admin-border)">
        <p className="text-[13px] font-semibold text-(--admin-text)">Recent Orders</p>
        <Link
          href="/admin/orders"
          className="flex items-center gap-1 text-[11px] text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
        >
          View all <BiLinkExternal size={11} />
        </Link>
      </div>
      <div className="divide-y divide-(--admin-border)">
        {orders.length === 0 ? (
          <p className="px-5 py-4 text-[12px] text-(--admin-text-soft)">No orders yet.</p>
        ) : orders.map(order => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.id}`}
            className="flex items-center gap-4 px-5 py-3 hover:bg-(--admin-surface-2) transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[12px] font-medium text-(--admin-text)">{order.id}</p>
                <Badge label={order.fulfillmentStatus} variant={orderStatusVariant(order.fulfillmentStatus)} />
              </div>
              <p className="text-[11px] text-(--admin-text-soft) mt-0.5 truncate">
                {order.customer.name} · {formatDate(order.date)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[12px] font-semibold text-(--admin-text)">{formatCurrency(order.total)}</p>
              <Badge label={order.paymentStatus} variant={paymentStatusVariant(order.paymentStatus)} className="mt-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </SectionCard>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

---

### Task 7: Right column sub-components (LowStock, TopProducts, AllTimeSummary)

**Files:**
- Create: `components/admin/overview/LowStock.tsx`
- Create: `components/admin/overview/TopProducts.tsx`
- Create: `components/admin/overview/AllTimeSummary.tsx`

**Interfaces:**
- `LowStock` consumes: `getAdminProducts()` from `lib/admin/shopifyAdmin`
- `TopProducts` consumes: `getCachedAnalytics()` from `lib/admin/overviewCache`
- `AllTimeSummary` consumes: `getCachedAnalytics()` — uses `totalRevenue` (Task 1)
- All three produced for consumption by Task 9

- [ ] **Step 1: Create `components/admin/overview/LowStock.tsx`**

```tsx
import Link from 'next/link'
import SectionCard from '@/components/admin/shared/SectionCard'
import { getAdminProducts } from '@/lib/admin/shopifyAdmin'

export default async function LowStock() {
  const products = await getAdminProducts()
  const lowStockItems = products
    .filter(p => p.stock <= 3)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6)

  return (
    <SectionCard noPadding>
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-(--admin-border)">
        <p className="text-[13px] font-semibold text-(--admin-text)">Low Stock</p>
        <Link
          href="/admin/inventory"
          className="text-[11px] text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
        >
          Manage
        </Link>
      </div>
      {lowStockItems.length === 0 ? (
        <p className="px-4 py-4 text-[12px] text-(--admin-text-soft)">All items in stock.</p>
      ) : (
        <div className="divide-y divide-(--admin-border)">
          {lowStockItems.map(p => (
            <Link
              key={p.id}
              href={`/admin/products/${p.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-(--admin-surface-2) transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-(--admin-text) truncate">{p.title}</p>
                <p className="text-[10px] text-(--admin-text-muted) mt-0.5">{p.sku}</p>
              </div>
              <span className={`ml-3 shrink-0 text-[11px] font-semibold ${p.stock === 0 ? 'text-(--admin-red)' : 'text-(--admin-amber)'}`}>
                {p.stock === 0 ? 'Out' : `${p.stock} left`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
```

- [ ] **Step 2: Create `components/admin/overview/TopProducts.tsx`**

```tsx
import SectionCard from '@/components/admin/shared/SectionCard'
import TopProductsTable from '@/components/admin/charts/TopProductsTable'
import { getCachedAnalytics } from '@/lib/admin/overviewCache'

export default async function TopProducts() {
  const analytics = await getCachedAnalytics()

  return (
    <SectionCard>
      <TopProductsTable products={analytics.topProducts} />
    </SectionCard>
  )
}
```

- [ ] **Step 3: Create `components/admin/overview/AllTimeSummary.tsx`**

```tsx
import { BiPackage } from 'react-icons/bi'
import SectionCard from '@/components/admin/shared/SectionCard'
import { getCachedAnalytics } from '@/lib/admin/overviewCache'
import { formatCurrency } from '@/lib/admin/utils'

export default async function AllTimeSummary() {
  const analytics = await getCachedAnalytics()

  const rows = [
    { label: 'Total Orders',     value: String(analytics.totalOrders) },
    { label: 'Total Revenue',    value: formatCurrency(analytics.totalRevenue) },
    { label: 'Fulfilled',        value: String(analytics.fulfilledOrders) },
    { label: 'Repeat Customers', value: `${analytics.customers.returningRate}%` },
  ]

  return (
    <SectionCard noPadding>
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-(--admin-border)">
        <p className="text-[13px] font-semibold text-(--admin-text)">All-Time Summary</p>
        <BiPackage size={15} className="text-(--admin-text-muted)" />
      </div>
      <div className="divide-y divide-(--admin-border)">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3">
            <p className="text-[12px] text-(--admin-text-soft)">{row.label}</p>
            <p className="text-[12px] font-semibold text-(--admin-text)">{row.value}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

---

### Task 8: PendingItems async sub-component

**Files:**
- Create: `components/admin/overview/PendingItems.tsx`

**Interfaces:**
- Consumes: Supabase `contact_messages` (count `read_at IS NULL`) and `reviews` (count `status = 'pending'`)
- Consumes: `SectionCard` from `components/admin/shared/SectionCard`
- Produces: `<PendingItems />` — no props, consumed by Task 9. Returns `null` if both counts are 0.

- [ ] **Step 1: Create `components/admin/overview/PendingItems.tsx`**

```tsx
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import SectionCard from '@/components/admin/shared/SectionCard'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function PendingItems() {
  const supabase = getSupabase()

  const [{ count: unread }, { count: pendingReviews }] = await Promise.all([
    supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null),
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const unreadCount  = unread ?? 0
  const reviewCount  = pendingReviews ?? 0

  if (unreadCount === 0 && reviewCount === 0) return null

  const rows = [
    { label: 'Unread messages', count: unreadCount,  href: '/admin/communications' },
    { label: 'Pending reviews', count: reviewCount,  href: '/admin/reviews' },
  ]

  return (
    <SectionCard noPadding>
      <div className="px-4 py-3.5 border-b border-(--admin-border)">
        <p className="text-[13px] font-semibold text-(--admin-text)">Needs Attention</p>
      </div>
      <div className="divide-y divide-(--admin-border)">
        {rows.map(row => (
          <Link
            key={row.href}
            href={row.href}
            className="flex items-center justify-between px-4 py-3 hover:bg-(--admin-surface-2) transition-colors"
          >
            <p className="text-[12px] text-(--admin-text-soft)">{row.label}</p>
            {row.count > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-(--admin-amber)/15 text-(--admin-amber)">
                {row.count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </SectionCard>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

---

### Task 9: Rewrite overview page as sync Suspense shell

**Files:**
- Rewrite: `app/admin/overview/page.tsx`

**Interfaces:**
- Consumes: All sub-components from Tasks 3–8
- Consumes: All skeletons from Task 2

- [ ] **Step 1: Rewrite `app/admin/overview/page.tsx`**

Replace the entire file contents with:

```tsx
import { Suspense } from 'react'
import PageHeader from '@/components/admin/shared/PageHeader'
import QuickActions from '@/components/admin/overview/QuickActions'
import StatCards from '@/components/admin/overview/StatCards'
import ChartsRow from '@/components/admin/overview/ChartsRow'
import RecentOrders from '@/components/admin/overview/RecentOrders'
import LowStock from '@/components/admin/overview/LowStock'
import TopProducts from '@/components/admin/overview/TopProducts'
import AllTimeSummary from '@/components/admin/overview/AllTimeSummary'
import PendingItems from '@/components/admin/overview/PendingItems'
import {
  StatCardsSkeleton,
  ChartsSkeleton,
  RecentOrdersSkeleton,
  PendingItemsSkeleton,
  LowStockSkeleton,
  TopProductsSkeleton,
  AllTimeSummarySkeleton,
} from '@/components/admin/overview/skeletons'

const dateLabel = new Date().toLocaleDateString('en-CA', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
})

export default function OverviewPage() {
  return (
    <div>
      <PageHeader title="Overview" subtitle={`${dateLabel} — Live Data`} />

      <QuickActions />

      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCards />
      </Suspense>

      <Suspense fallback={<ChartsSkeleton />}>
        <ChartsRow />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Suspense fallback={<RecentOrdersSkeleton />}>
          <RecentOrders />
        </Suspense>

        <div className="space-y-4">
          <Suspense fallback={<PendingItemsSkeleton />}>
            <PendingItems />
          </Suspense>

          <Suspense fallback={<LowStockSkeleton />}>
            <LowStock />
          </Suspense>

          <Suspense fallback={<TopProductsSkeleton />}>
            <TopProducts />
          </Suspense>

          <Suspense fallback={<AllTimeSummarySkeleton />}>
            <AllTimeSummary />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run the dev server and navigate to `/admin/overview`**

```powershell
npm run dev
```

Open `http://localhost:3000/admin/overview` in the browser (log in first if needed). Verify:
- Page header and Quick Actions appear instantly (no wait)
- Each section appears individually as data loads (not all at once)
- Pulse skeletons show in place of each section while loading
- Stat cards show Revenue, Orders, Customers, Unfulfilled (red dot if > 0)
- Charts row shows RevenueChart with 7/30/90 toggle working
- Recent orders show `ACMEORDER-XXXX` names (not GIDs)
- Right column shows Pending Items (if any), Low Stock, Top Products, All-Time Summary
- All-Time Revenue shows the real sum (not `totalOrders × avgOrderValue`)
- Quick Actions links navigate correctly: Add Product, View Unfulfilled, Go to Inbox

- [ ] **Step 4: Build check**

```powershell
npm run build
```

Expected: build completes with no errors. Watch for any "use client" boundary violations (server-only imports in client components).
