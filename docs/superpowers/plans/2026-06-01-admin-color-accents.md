# Admin Dashboard Color Accents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add green color accents to the admin dashboard — filled pill trend chips and green chart fills — across both light and dark mode.

**Architecture:** Add 5 new CSS tokens to `globals.css`, extract a shared `TrendChip` component with pill styling, update `StatCard` to use pill styling, then wire 4 chart components to the new `--admin-chart` token. No structural changes to any page layouts.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Recharts, react-icons/bi

---

## File Map

| Action | File |
|---|---|
| Modify | `app/globals.css` |
| Create | `components/admin/shared/TrendChip.tsx` |
| Modify | `components/admin/shared/StatCard.tsx` |
| Modify | `app/admin/analytics/page.tsx` |
| Modify | `components/admin/charts/MiniLineChart.tsx` |
| Modify | `components/admin/charts/RevenueChart.tsx` |
| Modify | `components/admin/charts/HorizontalBarChart.tsx` |
| Modify | `components/admin/charts/OrdersChart.tsx` |

---

## Task 1: Add CSS Tokens to globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add tokens to the light-mode `:root` admin block**

In `app/globals.css`, find the line `--admin-sidebar-w: 240px;` inside the first `:root` block (the admin block, around line 129). Add these 5 lines directly above it:

```css
  --admin-chart:           #16a34a;
  --admin-chip-green-bg:   #dcfce7;
  --admin-chip-green-text: #15803d;
  --admin-chip-red-bg:     #fee2e2;
  --admin-chip-red-text:   #b91c1c;
```

The block should end like:

```css
  --admin-chart:           #16a34a;
  --admin-chip-green-bg:   #dcfce7;
  --admin-chip-green-text: #15803d;
  --admin-chip-red-bg:     #fee2e2;
  --admin-chip-red-text:   #b91c1c;
  --admin-sidebar-w:       240px;
  --admin-topbar-h:        56px;
}
```

- [ ] **Step 2: Add tokens to the dark-mode `.dark` block**

In `app/globals.css`, find the `.dark` block. Find the line `--admin-amber-bg: rgba(245, 158, 11, 0.1);` (last state line in dark block). Add these 5 lines directly after it, before the closing `}`:

```css
  --admin-chart:           #22C55E;
  --admin-chip-green-bg:   rgba(34, 197, 94, 0.15);
  --admin-chip-green-text: #22C55E;
  --admin-chip-red-bg:     rgba(239, 68, 68, 0.15);
  --admin-chip-red-text:   #EF4444;
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(admin): add chart and chip color tokens"
```

---

## Task 2: Create Shared TrendChip Component

**Files:**
- Create: `components/admin/shared/TrendChip.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/admin/shared/TrendChip.tsx
'use client'

import { BiTrendingUp, BiTrendingDown, BiMinus } from 'react-icons/bi'

interface Props {
  change: number
}

export default function TrendChip({ change }: Props) {
  if (change === 0) return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] text-(--admin-text-muted)">
      <BiMinus size={11} /> 0%
    </span>
  )
  const up = change > 0
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-medium"
      style={{
        background: up ? 'var(--admin-chip-green-bg)' : 'var(--admin-chip-red-bg)',
        color:      up ? 'var(--admin-chip-green-text)' : 'var(--admin-chip-red-text)',
      }}
    >
      {up ? <BiTrendingUp size={11} /> : <BiTrendingDown size={11} />}
      {up ? '+' : ''}{change}%
    </span>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add components/admin/shared/TrendChip.tsx
git commit -m "feat(admin): add shared TrendChip component with pill styling"
```

---

## Task 3: Update StatCard to Use Pill Styling

**Files:**
- Modify: `components/admin/shared/StatCard.tsx`

Current content of `StatCard.tsx`:

```tsx
import { BiTrendingUp, BiTrendingDown } from 'react-icons/bi'
import { cn } from '@/lib/utils'
import SectionCard from './SectionCard'

interface StatCardProps {
  label: string
  value: string
  change: number
  period: string
  icon: React.ReactNode
}

export default function StatCard({ label, value, change, period, icon }: StatCardProps) {
  const positive = change >= 0

  return (
    <SectionCard className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted)">
          {label}
        </p>
        <span className="text-(--admin-text-muted)">{icon}</span>
      </div>

      <p className="text-[26px] font-semibold text-(--admin-text) leading-none tracking-tight">
        {value}
      </p>

      <div className="flex items-center justify-between">
        <div className={cn(
          'flex items-center gap-1 text-[11px]',
          positive ? 'text-(--admin-green)' : 'text-(--admin-red)'
        )}>
          {positive
            ? <BiTrendingUp size={13} />
            : <BiTrendingDown size={13} />
          }
          <span>{positive ? '+' : ''}{change}%</span>
        </div>
        <p className="text-[11px] text-(--admin-text-muted)">{period}</p>
      </div>
    </SectionCard>
  )
}
```

- [ ] **Step 1: Replace the file with the updated version**

```tsx
// components/admin/shared/StatCard.tsx
import SectionCard from './SectionCard'
import TrendChip from './TrendChip'

interface StatCardProps {
  label:  string
  value:  string
  change: number
  period: string
  icon:   React.ReactNode
}

export default function StatCard({ label, value, change, period, icon }: StatCardProps) {
  return (
    <SectionCard className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted)">
          {label}
        </p>
        <span className="text-(--admin-text-muted)">{icon}</span>
      </div>

      <p className="text-[26px] font-semibold text-(--admin-text) leading-none tracking-tight">
        {value}
      </p>

      <div className="flex items-center justify-between">
        <TrendChip change={change} />
        <p className="text-[11px] text-(--admin-text-muted)">{period}</p>
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
git add components/admin/shared/StatCard.tsx
git commit -m "feat(admin): update StatCard to use shared TrendChip pill"
```

---

## Task 4: Update Analytics Page — Remove Local TrendChip

**Files:**
- Modify: `app/admin/analytics/page.tsx`

The analytics page has a local `TrendChip` function starting at line 86 and imports `BiTrendingUp, BiTrendingDown, BiMinus` from react-icons/bi (line 15).

- [ ] **Step 1: Remove the react-icons import line**

Find and remove this line (line 15):
```tsx
import { BiTrendingUp, BiTrendingDown, BiMinus } from 'react-icons/bi'
```

- [ ] **Step 2: Add the shared TrendChip import**

After the `import ConversionFunnel` line, add:
```tsx
import TrendChip from '@/components/admin/shared/TrendChip'
```

- [ ] **Step 3: Remove the local TrendChip function**

Find and delete this entire block (lines 84–98 approximately):
```tsx
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
```

The `<TrendChip change={card.change} />` call sites in the JSX remain unchanged — they already use the right name and prop.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 5: Commit**

```bash
git add app/admin/analytics/page.tsx
git commit -m "feat(admin): use shared TrendChip in analytics page"
```

---

## Task 5: Update MiniLineChart — Remove Local TrendChip + Green Default

**Files:**
- Modify: `components/admin/charts/MiniLineChart.tsx`

The file has a local `TrendChip` function and imports `BiTrendingUp, BiTrendingDown, BiMinus`. The `color` prop defaults to `'var(--admin-accent)'`.

- [ ] **Step 1: Replace the full file**

```tsx
// components/admin/charts/MiniLineChart.tsx
'use client'

import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import SectionCard from '@/components/admin/shared/SectionCard'
import TrendChip from '@/components/admin/shared/TrendChip'

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

export default function MiniLineChart({ title, value, change, data, color = 'var(--admin-chart)' }: Props) {
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

Key changes vs old version:
- Removed `BiTrendingUp, BiTrendingDown, BiMinus` import
- Removed local `TrendChip` function
- Added `import TrendChip from '@/components/admin/shared/TrendChip'`
- Default `color` changed from `'var(--admin-accent)'` → `'var(--admin-chart)'`

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add components/admin/charts/MiniLineChart.tsx
git commit -m "feat(admin): use shared TrendChip and green default in MiniLineChart"
```

---

## Task 6: Update RevenueChart Line Color

**Files:**
- Modify: `components/admin/charts/RevenueChart.tsx`

Current `<Line>` element (lines 97–104):
```tsx
<Line
  type="monotone"
  dataKey="revenue"
  stroke="var(--admin-accent)"
  strokeWidth={1.5}
  dot={false}
  activeDot={{ r: 4, fill: 'var(--admin-accent)', strokeWidth: 0 }}
/>
```

- [ ] **Step 1: Update stroke and activeDot fill**

Replace the `<Line>` element with:
```tsx
<Line
  type="monotone"
  dataKey="revenue"
  stroke="var(--admin-chart)"
  strokeWidth={1.5}
  dot={false}
  activeDot={{ r: 4, fill: 'var(--admin-chart)', strokeWidth: 0 }}
/>
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add components/admin/charts/RevenueChart.tsx
git commit -m "feat(admin): switch RevenueChart line to --admin-chart green"
```

---

## Task 7: Update HorizontalBarChart Fill

**Files:**
- Modify: `components/admin/charts/HorizontalBarChart.tsx`

Current `<Bar>` element:
```tsx
<Bar
  dataKey="value"
  fill="var(--admin-accent)"
  radius={[0, 3, 3, 0]}
  maxBarSize={12}
/>
```

- [ ] **Step 1: Update Bar fill**

Replace with:
```tsx
<Bar
  dataKey="value"
  fill="var(--admin-chart)"
  radius={[0, 3, 3, 0]}
  maxBarSize={12}
/>
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add components/admin/charts/HorizontalBarChart.tsx
git commit -m "feat(admin): switch HorizontalBarChart bars to --admin-chart green"
```

---

## Task 8: Update OrdersChart Fill

**Files:**
- Modify: `components/admin/charts/OrdersChart.tsx`

Current `<Bar>` element (line 59–65):
```tsx
<Bar
  dataKey="orders"
  fill="var(--admin-accent)"
  radius={[2, 2, 0, 0]}
  maxBarSize={20}
  opacity={0.75}
/>
```

- [ ] **Step 1: Update Bar fill**

Replace with:
```tsx
<Bar
  dataKey="orders"
  fill="var(--admin-chart)"
  radius={[2, 2, 0, 0]}
  maxBarSize={20}
  opacity={0.75}
/>
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add components/admin/charts/OrdersChart.tsx
git commit -m "feat(admin): switch OrdersChart bars to --admin-chart green"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Add `--admin-chart` token (light + dark) | ✅ Task 1 |
| Add `--admin-chip-green-bg/text` tokens (light + dark) | ✅ Task 1 |
| Add `--admin-chip-red-bg/text` tokens (light + dark) | ✅ Task 1 |
| Create shared `TrendChip` with filled pill background | ✅ Task 2 |
| Update `StatCard` to use shared `TrendChip` | ✅ Task 3 |
| Remove local `TrendChip` from analytics page | ✅ Task 4 |
| Remove local `TrendChip` from `MiniLineChart` | ✅ Task 5 |
| Update `MiniLineChart` default color to `--admin-chart` | ✅ Task 5 |
| Update `RevenueChart` line stroke to `--admin-chart` | ✅ Task 6 |
| Update `HorizontalBarChart` bar fill to `--admin-chart` | ✅ Task 7 |
| Update `OrdersChart` bar fill to `--admin-chart` | ✅ Task 8 |
| `DonutChart` unchanged | ✅ Not touched |
| `--admin-accent` token unchanged | ✅ Not touched |

**Placeholder scan:** No TBDs, all code blocks complete, all file paths exact.

**Type consistency:**
- `TrendChip` exported as default from `components/admin/shared/TrendChip.tsx` ✓
- `StatCard` imports `TrendChip` from `'./TrendChip'` ✓
- `MiniLineChart` imports `TrendChip` from `'@/components/admin/shared/TrendChip'` ✓
- Analytics page imports `TrendChip` from `'@/components/admin/shared/TrendChip'` ✓
- All chart `fill`/`stroke` changes use the string `'var(--admin-chart)'` consistently ✓

---

*Plan written: 2026-06-01 · Acme Lamp & Sign Co. Admin Dashboard Color Accents*
