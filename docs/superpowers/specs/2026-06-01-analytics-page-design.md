# Analytics Page Redesign — Design Spec
## Acme Lamp & Sign Co. — Admin Dashboard

**Date:** 2026-06-01
**Scope:** Re-enable the disabled Analytics page (`app/admin/analytics/page.tsx.disabled`) with a full Shopify Analytics-inspired layout. Overview page is unchanged.
**Reference:** Shopify Analytics page layout extracted from inspect HTML (2026-06-01).
**Data:** All mock data from `lib/admin/mockData.ts` — no new API routes required.

---

## Decision: Option C

- **Overview** (`/admin/overview`) — no changes. Stays lean: 4 stat cards, revenue chart, recent orders, low stock alerts.
- **Analytics** (`/admin/analytics`) — full redesign matching Shopify Analytics grid structure. Re-enabled from `.disabled` and added back to the sidebar.

---

## Analytics Page Layout

### Section 1 — Top 4 Small Stat Cards

Four equal-width cards in a row (3-col each on a 12-col grid). Matches Shopify's top metric strip.

| Card | Value | Change |
|---|---|---|
| Gross Sales | `mockRevenueStats.month` formatted as CAD | `monthChange` vs last period |
| Returning Customer Rate | `repeatCustomers / totalCustomers * 100` % | static mock |
| Orders Fulfilled | count of `fulfilled` orders from `mockOrders` | static mock |
| Total Orders | `mockOrders.length` | `mockOrderCount.monthChange` |

Style: smaller than the Overview StatCards — compact label + large number + trend chip. Same design tokens.

---

### Section 2 — Total Sales Chart + Breakdown Sidebar (8/12 + 4/12)

**Left (8/12): Total Sales over time**
- Existing `RevenueChart` component — reused as-is.
- Date range toggle: Today / 7D / 30D / 90D (already built into RevenueChart).
- Label updated to "Total sales over time".

**Right (4/12): Sales Breakdown list**
A new `SalesBreakdownCard` component — a simple card with a labeled value list:

```
Gross Sales       $14,200
Discounts              —
Returns                —
Net Sales         $14,200
Shipping            $820
Taxes             $1,893
──────────────────────────
Total Sales       $16,913
```

Values derived from `mockOrders` (sum subtotals, shipping, tax). Discounts and returns show `—` (no mock data for those). A subtle divider before Total Sales. Total Sales row uses `font-semibold`.

---

### Section 3 — Three Equal Charts (4/12 each)

**Card 1: Average Order Value over time**
- New small line chart using `mockChartData` — render `revenue / orders` per day as AOV.
- Use existing Recharts `LineChart`. Same style as `RevenueChart` but smaller.
- Single line, no toggle needed. Label: "Avg. Order Value".

**Card 2: Sessions over time**
- Reuse `mockChartData` — plot a derived sessions curve (scale orders × 25 as a proxy).
- Single line. Label: "Sessions over time".
- Alternative: use `mockSessionCount` for the headline number and show a flat mock sparkline.

**Card 3: Conversion Rate over time**
- Line chart — static mock curve around 3.9% ± 0.5%.
- Label: "Conversion rate".

All three use the same compact chart card wrapper with a small headline stat + trend chip above the chart.

---

### Section 4 — Device + Top Products + Channel (4/12 each)

**Card 1: Sessions by device** (donut chart)
```
Desktop   65%   (813)
Mobile    28%   (347)
Tablet     7%    (87)
```
New `DonutChart` component using Recharts `PieChart`. Colors: `--admin-text`, `--admin-text-soft`, `--admin-border`. Legend below.

**Card 2: Top products by revenue** (horizontal bar)
- Reuse data from `mockTopProducts`.
- New `HorizontalBarChart` component using Recharts `BarChart` with `layout="vertical"`.
- Shows top 5 products, revenue as bar length, product title truncated.

**Card 3: Sales by channel** (donut chart)
```
Online Store   100%
```
Same `DonutChart` component. Single segment — clean placeholder until POS is added.

---

### Section 5 — Conversion Funnel (full width)

New `ConversionFunnel` component. Four stages shown as a horizontal funnel with step counts and drop-off percentages.

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Sessions   │ →  │ Added to Cart│ →  │  Checkout    │ →  │  Purchased   │
│    1,240     │    │     186      │    │      73      │    │      48      │
│    100%      │    │     15%      │    │     5.9%     │    │     3.9%     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

Mock values:
- Sessions: `mockSessionCount.week` = 1,240
- Added to cart: `Math.round(1240 * 0.15)` = 186
- Reached checkout: `Math.round(1240 * 0.059)` = 73
- Completed: `mockOrderCount.week` = 48 (or derived from conversion rate × sessions)

Each stage: large number, label below, percentage below that. Arrow connectors between stages. Percentages are relative to total sessions (not previous step). Background: `--admin-surface-2` per stage block.

---

## Sidebar — Re-enable Analytics Link

In `components/admin/layout/AdminSidebar.tsx`, uncomment the Analytics nav item and add the `BiBarChartAlt2` icon import:

```ts
// Before (commented out):
// { label: 'Analytics', href: '/admin/analytics', icon: BiBarChartAlt2 },

// After:
{ label: 'Analytics', href: '/admin/analytics', icon: BiBarChartAlt2 },
```

Add `BiBarChartAlt2` to the import from `react-icons/bi`.

---

## New Components Required

| Component | File | Description |
|---|---|---|
| `SalesBreakdownCard` | `components/admin/charts/SalesBreakdownCard.tsx` | Labeled value list: gross, net, shipping, taxes, total |
| `DonutChart` | `components/admin/charts/DonutChart.tsx` | Recharts PieChart wrapper — accepts `{ label, value, color }[]` |
| `HorizontalBarChart` | `components/admin/charts/HorizontalBarChart.tsx` | Recharts BarChart vertical layout — accepts `{ label, value }[]` |
| `MiniLineChart` | `components/admin/charts/MiniLineChart.tsx` | Compact line chart with headline stat + trend chip above |
| `ConversionFunnel` | `components/admin/charts/ConversionFunnel.tsx` | Four-stage horizontal funnel — pure JSX, no chart lib needed |

---

## Files Changed

| File | Action |
|---|---|
| `app/admin/analytics/page.tsx.disabled` | Rename to `page.tsx` — full rewrite with new layout |
| `components/admin/layout/AdminSidebar.tsx` | Uncomment Analytics nav link, add `BiBarChartAlt2` import |
| `components/admin/charts/SalesBreakdownCard.tsx` | New |
| `components/admin/charts/DonutChart.tsx` | New |
| `components/admin/charts/HorizontalBarChart.tsx` | New |
| `components/admin/charts/MiniLineChart.tsx` | New |
| `components/admin/charts/ConversionFunnel.tsx` | New |

Existing components reused unchanged: `RevenueChart`, `TopProductsTable`, `SectionCard`, `PageHeader`.

---

## Design Constraints

- All admin design tokens (`--admin-*` CSS variables) — no hardcoded colors.
- Dark mode works automatically via existing token system.
- No new dependencies — Recharts is already installed.
- No new API routes — all data from `mockData.ts`.
- The page is `'use client'` — no server component needed.
- `DonutChart` and `HorizontalBarChart` use `ResponsiveContainer` for fluid sizing.
- Funnel is pure JSX (no chart lib) — simpler and more controllable.

---

## What Stays the Same on the Disabled Page

The existing disabled file already has: KPI cards, `RevenueChart`, `OrdersChart`, customer metrics, `TopProductsTable`, abandoned checkouts.

The rewrite replaces the whole page with the new Shopify-mirror layout above. The existing `OrdersChart` is dropped in favor of the three compact line charts (AOV, Sessions, Conversion). `TopProductsTable` is replaced by `HorizontalBarChart`. The abandoned checkouts card is dropped — it belongs on Overview if needed.

---

*Spec written: 2026-06-01 · Acme Lamp & Sign Co. Admin Dashboard — Analytics Redesign*
