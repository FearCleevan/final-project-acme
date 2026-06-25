# Admin Overview Overhaul — Design Spec
**Date:** 2026-06-25  
**Author:** Peter Paul Abillar Lazan  
**Status:** Approved

---

## Goal

Fix two data bugs, improve perceived performance via parallel Suspense loading, add three new widgets (Quick Actions, Unfulfilled Orders stat, Pending Items card), and add a client-side revenue period toggle — all scoped to the admin overview page and its data layer.

---

## 1. Bug Fixes

### 1a. Order Name (GID vs Human-Readable)

**Problem:** `AdminOrder.id` holds the Shopify GID (`gid://shopify/Order/123`). The overview renders `order.id` as the order number, showing a raw GID instead of `ACMEORDER-1028`.

**Fix:**
- Add `name: string` to `AdminOrder` in `lib/admin/types.ts`
- Add `name` to `ORDER_FIELDS` in `lib/admin/shopifyAdmin.ts`
- Map it in `toAdminOrder`: `name: node.name ?? ''`
- Update `overview/page.tsx` to render `order.name` instead of `order.id`
- Update `lib/admin/mockData.ts`: add `name: 'ACMEORDER-1001'` etc. to all mock orders

### 1b. All-Time Revenue Calculation

**Problem:** Overview calculates `analytics.totalOrders * analytics.avgOrderValue` conditionally — this is an estimate, not the real figure. `AnalyticsData` does not expose `totalRevenue`.

**Fix:**
- Add `totalRevenue: number` to the `AnalyticsData` interface in `lib/admin/shopifyAdmin.ts`
- Return `totalRevenue: sumRevenue(orders)` from `getAdminAnalytics()`
- Update `overview/page.tsx` All-Time Summary row to use `formatCurrency(analytics.totalRevenue)` directly — no conditional

---

## 2. Performance — Parallel Suspense Architecture

### Problem

The current `overview/page.tsx` is a single async server component that blocks on three top-level `await Promise.all()` calls:
- `getAdminAnalytics()` → internally calls `getAdminOrders(250)` + `getAdminCustomers(250)`
- `getAdminOrders(8)` → duplicate orders fetch
- `getAdminProducts()` → products fetch

Nothing renders until all three resolve. The page shows blank for the full combined latency.

### Solution: Split into Async Sub-Components + React.cache

Break the page into focused async sub-components, each wrapped in its own `<Suspense>` boundary. They fire in parallel at the edge. `React.cache()` deduplicates the analytics call.

**New file: `lib/admin/overviewCache.ts`**
```ts
import { cache } from 'react'
import { getAdminAnalytics } from './shopifyAdmin'
export const getCachedAnalytics = cache(getAdminAnalytics)
```

**Sub-components** (all in `components/admin/overview/`):
| Component | Data source | Suspense fallback |
|---|---|---|
| `StatCards.tsx` | `getCachedAnalytics()` | `StatCardsSkeleton` |
| `ChartsRow.tsx` | `getCachedAnalytics()` | `ChartsSkeleton` |
| `RecentOrders.tsx` | `getAdminOrders(8)` | `RecentOrdersSkeleton` |
| `LowStock.tsx` | `getAdminProducts()` | `LowStockSkeleton` |
| `TopProducts.tsx` | `getCachedAnalytics()` | `TopProductsSkeleton` |
| `AllTimeSummary.tsx` | `getCachedAnalytics()` | `AllTimeSummarySkeleton` |
| `PendingItems.tsx` | Supabase (2 queries) | `PendingItemsSkeleton` |
| `QuickActions.tsx` | Static — no fetch | None needed |
| `UnfulfilledStat.tsx` | `getCachedAnalytics()` | `StatCardsSkeleton` |

**Page structure (`app/admin/overview/page.tsx`):**
```
OverviewPage (sync, renders immediately)
├── PageHeader (static)
├── QuickActions (static)
├── Suspense → StatCards + UnfulfilledStat (4 stat cards total)
├── Suspense → ChartsRow (revenue chart + orders chart + period toggle)
└── Grid: 2-col bottom row
    ├── Suspense → RecentOrders
    └── Right column
        ├── Suspense → PendingItems
        ├── Suspense → LowStock
        ├── Suspense → TopProducts
        └── Suspense → AllTimeSummary
```

`getCachedAnalytics()` is called by `StatCards`, `ChartsRow`, `TopProducts`, `AllTimeSummary`, and `UnfulfilledStat` — React deduplicates to a single network request.

---

## 3. Loading Skeletons

Each Suspense boundary has a matching skeleton. All skeletons use `animate-pulse` with `bg-(--admin-border)` rounded shapes.

| Skeleton | Shape |
|---|---|
| `StatCardsSkeleton` | 4 × `h-24 rounded-lg` boxes in a grid |
| `ChartsSkeleton` | `h-56 rounded-lg` (2/3 wide) + `h-56 rounded-lg` (1/3) |
| `RecentOrdersSkeleton` | 5 × `h-12` shimmer rows with left/right placeholder blobs |
| `PendingItemsSkeleton` | 2 × `h-10` rows |
| `LowStockSkeleton` | 4 × `h-9` rows |
| `TopProductsSkeleton` | 5 × `h-8` rows |
| `AllTimeSummarySkeleton` | 4 × `h-8` rows |

Skeletons live alongside their components in `components/admin/overview/`.

---

## 4. New Widgets

### 4a. Quick Actions (static)

A small card rendered immediately (no fetch, no skeleton) placed between the page header and stat cards.

Three buttons in a horizontal row:
- **Add Product** → `/admin/products/new` (icon: BiPlus)
- **View Unfulfilled** → `/admin/orders?status=unfulfilled` (icon: BiPackage)
- **Go to Inbox** → `/admin/communications` (icon: BiEnvelope)

Each button: outlined style, small text, icon + label.

### 4b. Unfulfilled Orders Stat Card

Replace the current "Avg. Order" stat card (which shows `change: 0` and "All time" — not useful at a glance) with an **Unfulfilled** count card.

- Value: count of orders where `fulfillmentStatus !== 'fulfilled'` and `fulfillmentStatus !== 'cancelled'`
- Derived from analytics data (no extra fetch)
- Icon: `BiPackage`
- Period label: "Needs fulfillment"
- `change` prop: 0 (no trend needed)
- Value colour: red (`text-(--admin-red)`) if count > 0, otherwise default

Stat cards row becomes: Revenue · Orders · Customers · **Unfulfilled**

### 4c. Pending Items Card

Async component above Low Stock in the right column. Fetches from Supabase in parallel:

```ts
const [unreadCount, pendingReviews] = await Promise.all([
  supabase.from('contact_messages').select('id', { count: 'exact', head: true }).is('read_at', null),
  supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
])
```

Uses `getSupabase()` lazy pattern (never module-level).

Renders as two rows:
- "Unread messages" → count badge → link to `/admin/communications`
- "Pending reviews" → count badge → link to `/admin/reviews`

If both counts are 0, the card is hidden entirely (returns `null`).

Badge colour: amber if count > 0, grey if 0.

---

## 5. Revenue Period Toggle

`ChartsRow` is a **client component** (`'use client'`). It receives the full 90-day `chartData` array as a prop from the server sub-component wrapper.

Toggle state: `const [period, setPeriod] = useState<7 | 30 | 90>(30)`

On render, slice `chartData` to the last N entries:
```ts
const visible = chartData.slice(-period)
```

Toggle UI: three small buttons `[7d] [30d] [90d]` in the top-right corner of the charts card. Active button has `bg-(--admin-accent)` fill; inactive is outlined.

No additional API calls — all filtering is client-side from the already-loaded 90-day dataset.

---

## 6. Files Changed

| File | Change |
|---|---|
| `lib/admin/types.ts` | Add `name: string` to `AdminOrder` |
| `lib/admin/shopifyAdmin.ts` | Add `name` to ORDER_FIELDS + toAdminOrder mapper; add `totalRevenue` to AnalyticsData |
| `lib/admin/mockData.ts` | Add `name` field to all mock orders |
| `lib/admin/overviewCache.ts` | NEW — `getCachedAnalytics` via React.cache |
| `app/admin/overview/page.tsx` | Rewrite as sync shell with Suspense boundaries |
| `components/admin/overview/StatCards.tsx` | NEW async sub-component |
| `components/admin/overview/ChartsRow.tsx` | NEW client component with period toggle |
| `components/admin/overview/RecentOrders.tsx` | NEW async sub-component |
| `components/admin/overview/LowStock.tsx` | NEW async sub-component |
| `components/admin/overview/TopProducts.tsx` | NEW async sub-component |
| `components/admin/overview/AllTimeSummary.tsx` | NEW async sub-component |
| `components/admin/overview/PendingItems.tsx` | NEW async sub-component (Supabase) |
| `components/admin/overview/QuickActions.tsx` | NEW static component |
| `components/admin/overview/UnfulfilledStat.tsx` | NEW async sub-component |
| `components/admin/overview/skeletons.tsx` | NEW — all skeleton components in one file |

---

## 7. Out of Scope

- Revenue period toggle does NOT re-fetch from Shopify — client-side slice only
- Pending Items card does NOT auto-refresh — loads once per page visit
- No changes to any other admin page
- No changes to the analytics page (`/admin/analytics`)
