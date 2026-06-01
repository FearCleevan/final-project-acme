# Analytics Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-enable the admin Analytics page with a Shopify Analytics-inspired layout — 5 new chart components assembled into a full page rewrite, with the sidebar link re-enabled.

**Architecture:** All data from `lib/admin/mockData.ts` — no API routes needed. Five focused chart components are built first, then composed into the Analytics page. The existing `page.tsx.disabled` is deleted and replaced with a new `page.tsx`. The Analytics nav link in the sidebar is uncommented.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Recharts (already installed), react-icons/bi

---

## File Map

| Action | File |
|---|---|
| Create | `components/admin/charts/SalesBreakdownCard.tsx` |
| Create | `components/admin/charts/DonutChart.tsx` |
| Create | `components/admin/charts/HorizontalBarChart.tsx` |
| Create | `components/admin/charts/MiniLineChart.tsx` |
| Create | `components/admin/charts/ConversionFunnel.tsx` |
| Create | `app/admin/analytics/page.tsx` |
| Delete | `app/admin/analytics/page.tsx.disabled` |
| Modify | `components/admin/layout/AdminSidebar.tsx` |

---

## Task 1: SalesBreakdownCard

**Files:**
- Create: `components/admin/charts/SalesBreakdownCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/admin/charts/SalesBreakdownCard.tsx
'use client'

import { formatCurrency } from '@/lib/admin/utils'
import SectionCard from '@/components/admin/shared/SectionCard'

interface Props {
  grossSales: number
  discounts:  number
  returns:    number
  shipping:   number
  taxes:      number
}

export default function SalesBreakdownCard({ grossSales, discounts, returns, shipping, taxes }: Props) {
  const netSales   = grossSales - discounts - returns
  const totalSales = netSales + shipping + taxes

  const rows: { label: string; value: number; negative?: boolean }[] = [
    { label: 'Gross Sales', value: grossSales },
    { label: 'Discounts',   value: discounts,  negative: true },
    { label: 'Returns',     value: returns,    negative: true },
    { label: 'Net Sales',   value: netSales },
    { label: 'Shipping',    value: shipping },
    { label: 'Taxes',       value: taxes },
  ]

  return (
    <SectionCard className="h-full flex flex-col">
      <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted) mb-4">
        Sales Breakdown
      </p>
      <div className="flex-1 space-y-2.5">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-[12px] text-(--admin-text-muted)">{row.label}</span>
            <span className={`text-[13px] ${row.negative && row.value > 0 ? 'text-(--admin-red)' : 'text-(--admin-text)'}`}>
              {row.value === 0
                ? '—'
                : `${row.negative ? '-' : ''}${formatCurrency(row.value)}`}
            </span>
          </div>
        ))}
      </div>
      <div className="pt-3 mt-3 border-t border-(--admin-border) flex items-center justify-between">
        <span className="text-[13px] font-semibold text-(--admin-text)">Total Sales</span>
        <span className="text-[15px] font-semibold text-(--admin-text)">{formatCurrency(totalSales)}</span>
      </div>
    </SectionCard>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0 with no errors referencing `SalesBreakdownCard.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/admin/charts/SalesBreakdownCard.tsx
git commit -m "feat(admin): add SalesBreakdownCard component"
```

---

## Task 2: DonutChart

**Files:**
- Create: `components/admin/charts/DonutChart.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/admin/charts/DonutChart.tsx
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import SectionCard from '@/components/admin/shared/SectionCard'

export interface DonutSlice {
  label: string
  value: number
  color: string
}

interface Props {
  title: string
  data:  DonutSlice[]
}

export default function DonutChart({ title, data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <SectionCard className="h-full">
      <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted) mb-3">{title}</p>

      <ResponsiveContainer width="100%" height={130}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={60}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => [`${Math.round((v / total) * 100)}%`, '']}
            contentStyle={{
              background:   'var(--admin-surface)',
              border:       '1px solid var(--admin-border)',
              borderRadius: 6,
              fontSize:     11,
              color:        'var(--admin-text)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2 mt-1">
        {data.map(d => (
          <div key={d.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-[12px] text-(--admin-text-soft)">{d.label}</span>
            </div>
            <span className="text-[12px] font-medium text-(--admin-text)">
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add components/admin/charts/DonutChart.tsx
git commit -m "feat(admin): add DonutChart component"
```

---

## Task 3: HorizontalBarChart

**Files:**
- Create: `components/admin/charts/HorizontalBarChart.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/admin/charts/HorizontalBarChart.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/admin/utils'
import SectionCard from '@/components/admin/shared/SectionCard'

export interface HBarItem {
  label: string
  value: number
}

interface Props {
  title:        string
  data:         HBarItem[]
  formatValue?: (v: number) => string
}

export default function HorizontalBarChart({ title, data, formatValue = formatCurrency }: Props) {
  const chartData = data.map(d => ({ name: d.label, value: d.value }))

  return (
    <SectionCard className="h-full">
      <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted) mb-3">{title}</p>

      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 32)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={88}
            tick={{ fontSize: 11, fill: 'var(--admin-text-soft)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => v.length > 13 ? `${v.slice(0, 13)}…` : v}
          />
          <Tooltip
            formatter={(v: number) => [formatValue(v), '']}
            contentStyle={{
              background:   'var(--admin-surface)',
              border:       '1px solid var(--admin-border)',
              borderRadius: 6,
              fontSize:     11,
              color:        'var(--admin-text)',
            }}
          />
          <Bar
            dataKey="value"
            fill="var(--admin-accent)"
            radius={[0, 3, 3, 0]}
            maxBarSize={12}
          />
        </BarChart>
      </ResponsiveContainer>
    </SectionCard>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add components/admin/charts/HorizontalBarChart.tsx
git commit -m "feat(admin): add HorizontalBarChart component"
```

---

## Task 4: MiniLineChart

**Files:**
- Create: `components/admin/charts/MiniLineChart.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/admin/charts/MiniLineChart.tsx
'use client'

import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { BiTrendingUp, BiTrendingDown, BiMinus } from 'react-icons/bi'
import SectionCard from '@/components/admin/shared/SectionCard'

export interface MiniChartPoint {
  date:  string
  value: number
}

interface Props {
  title:  string
  value:  string
  change: number
  data:   MiniChartPoint[]
  color?: string
}

function TrendChip({ change }: { change: number }) {
  if (change === 0) return (
    <span className="inline-flex items-center gap-0.5 text-[11px] text-(--admin-text-muted)">
      <BiMinus size={11} /> 0%
    </span>
  )
  const up = change > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] ${up ? 'text-(--admin-green)' : 'text-(--admin-red)'}`}>
      {up ? <BiTrendingUp size={12} /> : <BiTrendingDown size={12} />}
      {up ? '+' : ''}{change}%
    </span>
  )
}

export default function MiniLineChart({ title, value, change, data, color = 'var(--admin-accent)' }: Props) {
  return (
    <SectionCard className="h-full">
      <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted) mb-1">{title}</p>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-[22px] font-semibold text-(--admin-text) leading-none">{value}</span>
        <TrendChip change={change} />
      </div>
      <ResponsiveContainer width="100%" height={72}>
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <XAxis dataKey="date" hide />
          <Tooltip
            formatter={(v: number) => [v, '']}
            contentStyle={{
              background:   'var(--admin-surface)',
              border:       '1px solid var(--admin-border)',
              borderRadius: 6,
              fontSize:     11,
              color:        'var(--admin-text)',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </SectionCard>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add components/admin/charts/MiniLineChart.tsx
git commit -m "feat(admin): add MiniLineChart component"
```

---

## Task 5: ConversionFunnel

**Files:**
- Create: `components/admin/charts/ConversionFunnel.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/admin/charts/ConversionFunnel.tsx
'use client'

import SectionCard from '@/components/admin/shared/SectionCard'

export interface FunnelStage {
  label: string
  count: number
  total: number
}

interface Props {
  stages: FunnelStage[]
}

export default function ConversionFunnel({ stages }: Props) {
  return (
    <SectionCard>
      <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted) mb-4">
        Conversion Funnel
      </p>
      <div className="flex items-stretch gap-2">
        {stages.map((stage, i) => {
          const pct  = ((stage.count / stage.total) * 100).toFixed(1)
          const last = i === stages.length - 1
          return (
            <div key={stage.label} className="flex items-center flex-1 min-w-0">
              <div className="flex-1 min-w-0 rounded-lg bg-(--admin-surface-2) border border-(--admin-border) px-3 py-4 text-center">
                <p className="text-[22px] font-semibold text-(--admin-text) leading-none mb-1">
                  {stage.count.toLocaleString()}
                </p>
                <p className="text-[11px] text-(--admin-text-soft) leading-tight mb-1.5">
                  {stage.label}
                </p>
                <p className="text-[11px] font-medium text-(--admin-text-muted)">{pct}%</p>
              </div>
              {!last && (
                <div className="px-1 shrink-0 text-(--admin-border)">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 7h10M8 3l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add components/admin/charts/ConversionFunnel.tsx
git commit -m "feat(admin): add ConversionFunnel component"
```

---

## Task 6: Analytics Page — Delete old, write new

**Files:**
- Delete: `app/admin/analytics/page.tsx.disabled`
- Create: `app/admin/analytics/page.tsx`

- [ ] **Step 1: Delete the disabled file**

Use the shell or file system to delete `app/admin/analytics/page.tsx.disabled`.

PowerShell: `Remove-Item "app/admin/analytics/page.tsx.disabled"`

- [ ] **Step 2: Create the new Analytics page**

```tsx
// app/admin/analytics/page.tsx
'use client'

import {
  mockRevenueStats,
  mockOrderCount,
  mockSessionCount,
  mockConversionRate,
  mockTopProducts,
  mockCustomers,
  mockOrders,
  mockChartData,
} from '@/lib/admin/mockData'
import { formatCurrency } from '@/lib/admin/utils'
import { BiTrendingUp, BiTrendingDown, BiMinus } from 'react-icons/bi'
import PageHeader         from '@/components/admin/shared/PageHeader'
import SectionCard        from '@/components/admin/shared/SectionCard'
import RevenueChart       from '@/components/admin/charts/RevenueChart'
import SalesBreakdownCard from '@/components/admin/charts/SalesBreakdownCard'
import DonutChart         from '@/components/admin/charts/DonutChart'
import HorizontalBarChart from '@/components/admin/charts/HorizontalBarChart'
import MiniLineChart      from '@/components/admin/charts/MiniLineChart'
import ConversionFunnel   from '@/components/admin/charts/ConversionFunnel'

// ─── Derived values ───────────────────────────────────────────────────────────

const totalShipping    = mockOrders.reduce((s, o) => s + o.shipping, 0)
const totalTaxes       = mockOrders.reduce((s, o) => s + o.tax, 0)
const repeatCustomers  = mockCustomers.filter(c => c.orders > 1).length
const returningRate    = Math.round((repeatCustomers / mockCustomers.length) * 100)
const fulfilledOrders  = mockOrders.filter(o => o.fulfillmentStatus === 'fulfilled').length
const avgOrderValue    = mockRevenueStats.month / mockOrderCount.month

// ─── Mini chart data ──────────────────────────────────────────────────────────

const aovData = mockChartData.map(d => ({
  date:  d.date,
  value: d.orders > 0 ? Math.round(d.revenue / d.orders) : 0,
}))

const sessionsData = mockChartData.map(d => ({
  date:  d.date,
  value: d.orders * 25,
}))

const conversionData = mockChartData.map(d => ({
  date:  d.date,
  value: d.orders > 0 ? parseFloat(((1 / 25) * 100).toFixed(1)) : 0,
}))

// ─── Donut data ───────────────────────────────────────────────────────────────

const deviceData = [
  { label: 'Desktop', value: 813, color: 'var(--admin-text)'      },
  { label: 'Mobile',  value: 347, color: 'var(--admin-text-soft)' },
  { label: 'Tablet',  value: 80,  color: 'var(--admin-border)'    },
]

const channelData = [
  { label: 'Online Store', value: 100, color: 'var(--admin-text)' },
]

// ─── Funnel data ──────────────────────────────────────────────────────────────

const sessions     = mockSessionCount.week
const addedToCart  = Math.round(sessions * 0.15)
const reachedCheck = Math.round(sessions * 0.059)
const purchased    = mockOrderCount.week

const funnelStages = [
  { label: 'Sessions',          count: sessions,     total: sessions },
  { label: 'Added to Cart',     count: addedToCart,  total: sessions },
  { label: 'Reached Checkout',  count: reachedCheck, total: sessions },
  { label: 'Purchased',         count: purchased,    total: sessions },
]

// ─── Top products for horizontal bar ─────────────────────────────────────────

const topProductsBar = mockTopProducts.slice(0, 5).map(p => ({
  label: p.title.split('—')[0].trim(),
  value: p.revenue,
}))

// ─── Stat card trend chip ─────────────────────────────────────────────────────

function TrendChip({ change }: { change: number }) {
  if (change === 0) return (
    <span className="inline-flex items-center gap-0.5 text-[11px] text-(--admin-text-muted)">
      <BiMinus size={11} /> 0%
    </span>
  )
  const up = change > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] ${up ? 'text-(--admin-green)' : 'text-(--admin-red)'}`}>
      {up ? <BiTrendingUp size={12} /> : <BiTrendingDown size={12} />}
      {up ? '+' : ''}{change}%
    </span>
  )
}

// ─── Top stat cards ───────────────────────────────────────────────────────────

const topCards = [
  {
    label:  'Gross Sales',
    value:  formatCurrency(mockRevenueStats.month),
    change: mockRevenueStats.monthChange,
    sub:    'This month',
  },
  {
    label:  'Returning Customer Rate',
    value:  `${returningRate}%`,
    change: 0,
    sub:    `${repeatCustomers} of ${mockCustomers.length} customers`,
  },
  {
    label:  'Orders Fulfilled',
    value:  String(fulfilledOrders),
    change: 0,
    sub:    `of ${mockOrders.length} total orders`,
  },
  {
    label:  'Total Orders',
    value:  String(mockOrderCount.month),
    change: 5,
    sub:    'This month',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Store performance overview — demo data"
      />

      {/* ── Row 1: 4 small stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {topCards.map(card => (
          <SectionCard key={card.label} className="py-3 px-4">
            <p className="text-[11px] uppercase tracking-wider text-(--admin-text-muted) mb-1 leading-tight">
              {card.label}
            </p>
            <p className="text-[20px] font-semibold text-(--admin-text) leading-none mb-1.5">
              {card.value}
            </p>
            <div className="flex items-center gap-2">
              <TrendChip change={card.change} />
              <span className="text-[10px] text-(--admin-text-muted) truncate">{card.sub}</span>
            </div>
          </SectionCard>
        ))}
      </div>

      {/* ── Row 2: Revenue chart (8/12) + Sales breakdown (4/12) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <SectionCard className="h-full">
            <RevenueChart />
          </SectionCard>
        </div>
        <div>
          <SalesBreakdownCard
            grossSales={mockRevenueStats.month}
            discounts={0}
            returns={0}
            shipping={totalShipping * 6}
            taxes={totalTaxes * 6}
          />
        </div>
      </div>

      {/* ── Row 3: AOV / Sessions / Conversion mini line charts ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <MiniLineChart
          title="Avg. Order Value"
          value={formatCurrency(avgOrderValue)}
          change={+3}
          data={aovData}
        />
        <MiniLineChart
          title="Sessions over time"
          value={mockSessionCount.week.toLocaleString()}
          change={mockSessionCount.weekChange}
          data={sessionsData}
        />
        <MiniLineChart
          title="Conversion Rate"
          value={`${mockConversionRate.value}%`}
          change={mockConversionRate.change}
          data={conversionData}
        />
      </div>

      {/* ── Row 4: Device donut / Top products bar / Channel donut ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <DonutChart title="Sessions by Device" data={deviceData} />
        <HorizontalBarChart title="Top Products by Revenue" data={topProductsBar} />
        <DonutChart title="Sales by Channel" data={channelData} />
      </div>

      {/* ── Row 5: Conversion funnel (full width) ── */}
      <ConversionFunnel stages={funnelStages} />
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0 with no errors in `app/admin/analytics/page.tsx`

- [ ] **Step 4: Start dev server and visually verify the page**

Run: `npm run dev`
Navigate to `http://localhost:3000/admin` → log in with `acme2026`

At this point Analytics will NOT appear in the sidebar yet (Task 7). Navigate directly to `http://localhost:3000/admin/analytics`.

Verify:
- 4 small stat cards show correct values (Gross Sales: CA$14,200, Returning Rate: 50%, Orders Fulfilled: 5, Total Orders: 48)
- Revenue chart renders (RevenueChart component reused)
- Sales Breakdown card shows Gross Sales, Net Sales, Shipping, Taxes, Total Sales with correct figures
- 3 mini line charts render (AOV, Sessions, Conversion Rate)
- 2 donuts + 1 horizontal bar render
- Conversion Funnel shows 4 stages: 1,240 → 186 → 73 → 11

- [ ] **Step 5: Commit**

```bash
git add app/admin/analytics/page.tsx
git commit -m "feat(admin): add Analytics page with Shopify-inspired layout"
```

---

## Task 7: Re-enable Analytics Sidebar Link

**Files:**
- Modify: `components/admin/layout/AdminSidebar.tsx`

- [ ] **Step 1: Add the BiBarChartAlt2 import and uncomment the nav item**

In `components/admin/layout/AdminSidebar.tsx`, find the existing icon imports at the top:

```ts
import {
  BiHomeAlt,
  BiCart,
  BiPackage,
  BiArchive,
  BiCollection,
  BiUser,
  BiCog,
  BiLogOut,
  BiSun,
  BiMoon,
} from 'react-icons/bi'
```

Replace with:

```ts
import {
  BiHomeAlt,
  BiCart,
  BiPackage,
  BiArchive,
  BiCollection,
  BiUser,
  BiBarChartAlt2,
  BiCog,
  BiLogOut,
  BiSun,
  BiMoon,
} from 'react-icons/bi'
```

Then find the `NAV_MAIN` array:

```ts
const NAV_MAIN = [
  { label: 'Overview',       href: '/admin/overview',       icon: BiHomeAlt },
  { label: 'Orders',         href: '/admin/orders',         icon: BiCart,        badge: 4 },
  { label: 'Products',       href: '/admin/products',       icon: BiPackage },
  { label: 'Inventory',      href: '/admin/inventory',      icon: BiArchive },
  { label: 'Collections',    href: '/admin/collections',    icon: BiCollection },
  { label: 'Customers',      href: '/admin/customers',      icon: BiUser },
  // { label: 'Analytics',      href: '/admin/analytics',      icon: BiBarChartAlt2 }, // disabled — overlaps with Overview
  // { label: 'Import / Export', href: '/admin/import-export',  icon: BiImport },      // disabled — export already inline on Products/Orders/Customers
]
```

Replace with:

```ts
const NAV_MAIN = [
  { label: 'Overview',    href: '/admin/overview',    icon: BiHomeAlt },
  { label: 'Orders',      href: '/admin/orders',      icon: BiCart,       badge: 4 },
  { label: 'Products',    href: '/admin/products',    icon: BiPackage },
  { label: 'Inventory',   href: '/admin/inventory',   icon: BiArchive },
  { label: 'Collections', href: '/admin/collections', icon: BiCollection },
  { label: 'Customers',   href: '/admin/customers',   icon: BiUser },
  { label: 'Analytics',   href: '/admin/analytics',   icon: BiBarChartAlt2 },
  // { label: 'Import / Export', href: '/admin/import-export', icon: BiImport }, // disabled — export is inline on Products/Orders/Customers
]
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 3: Verify in browser**

With dev server running, navigate to `http://localhost:3000/admin/overview`.
Verify "Analytics" appears in the left sidebar between Customers and Settings.
Click it — should navigate to `/admin/analytics` and show the full page.
Verify active state highlights correctly on the Analytics link.
Toggle dark mode — all charts and cards should render correctly in both modes.

- [ ] **Step 4: Final commit**

```bash
git add components/admin/layout/AdminSidebar.tsx
git commit -m "feat(admin): re-enable Analytics nav link in sidebar"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Overview page unchanged | ✅ Not touched |
| Re-enable `page.tsx.disabled` → `page.tsx` | ✅ Task 6 Step 1 |
| 4 small stat cards (Gross Sales, Returning Rate, Orders Fulfilled, Total Orders) | ✅ Task 6 `topCards` array |
| Revenue chart (8/12) + Sales Breakdown list (4/12) | ✅ Task 6 Row 2, Task 1 |
| 3 mini line charts (AOV, Sessions, Conversion Rate) | ✅ Task 6 Row 3, Task 4 |
| Sessions by Device donut | ✅ Task 6 Row 4, Task 2 |
| Top Products horizontal bar | ✅ Task 6 Row 4, Task 3 |
| Sales by Channel donut | ✅ Task 6 Row 4, Task 2 |
| Conversion Funnel (full width) | ✅ Task 6 Row 5, Task 5 |
| Sidebar Analytics link re-enabled | ✅ Task 7 |
| No new API routes | ✅ All data from `mockData.ts` |
| Dark mode works | ✅ All CSS vars, verified in Task 7 Step 3 |

**Placeholder scan:** No TBDs, no "implement later", no incomplete steps. All component code is complete.

**Type consistency:**
- `DonutSlice` exported from `DonutChart.tsx` — not imported elsewhere (page uses inline object literals). ✅
- `HBarItem` exported from `HorizontalBarChart.tsx` — page uses inline object literals. ✅
- `FunnelStage` exported from `ConversionFunnel.tsx` — page uses `funnelStages` matching the interface. ✅
- `MiniChartPoint` exported from `MiniLineChart.tsx` — `aovData`, `sessionsData`, `conversionData` all match `{ date: string; value: number }`. ✅
- `SalesBreakdownCard` Props: `grossSales`, `discounts`, `returns`, `shipping`, `taxes` — all passed in Task 6. ✅

---

*Plan written: 2026-06-01 · Acme Lamp & Sign Co. Admin Dashboard — Analytics Redesign*
