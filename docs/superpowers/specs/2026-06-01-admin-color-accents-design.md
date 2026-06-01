# Admin Dashboard Color Accents — Design Spec
## Acme Lamp & Sign Co. — Admin Dashboard

**Date:** 2026-06-01
**Scope:** Add green color accents to the admin dashboard — filled trend chip pills and green chart fills — in both light and dark mode. Inspired by the Ecomora dashboard reference image.
**Approach:** Green accent (warm, complements existing neutral palette). No structural changes.

---

## Motivation

The current admin uses a near-monochromatic palette (black accent in light, white accent in dark). The trend chips are plain colored text and chart fills are black/white. Adding a vivid green for chips and charts brings the dashboard closer to the reference — more readable, more visually alive — without breaking the warm heritage brand tone.

---

## New CSS Tokens

Added to `app/globals.css` alongside existing `--admin-*` tokens.

### Light Mode

```css
--admin-chart:           #16a34a;
--admin-chip-green-bg:   #dcfce7;
--admin-chip-green-text: #15803d;
--admin-chip-red-bg:     #fee2e2;
--admin-chip-red-text:   #b91c1c;
```

### Dark Mode

```css
--admin-chart:           #4ADE80;
--admin-chip-green-bg:   rgba(74, 222, 128, 0.15);
--admin-chip-green-text: #4ADE80;
--admin-chip-red-bg:     rgba(248, 113, 113, 0.15);
--admin-chip-red-text:   #F87171;
```

---

## Change 1 — Shared TrendChip Component

### Problem
`TrendChip` / `ChangeChip` is duplicated as a local function in three files:
- `app/admin/overview/page.tsx` (called `ChangeChip`)
- `app/admin/analytics/page.tsx` (called `TrendChip`)
- `components/admin/charts/MiniLineChart.tsx` (called `TrendChip`)

### Solution
Extract to `components/admin/shared/TrendChip.tsx`. All three files import from there.

### New component

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

### Visual result

```
Before:  ↑ +8%   ← green text only, no background
After:   [↑ +8%] ← light green pill background, darker green text
         [↓ -2%] ← light red pill background, darker red text
```

### Files to update (remove local TrendChip/ChangeChip, import shared one)

| File | Local name to remove | Import to add |
|---|---|---|
| `app/admin/overview/page.tsx` | `ChangeChip` function | `import TrendChip from '@/components/admin/shared/TrendChip'` |
| `app/admin/analytics/page.tsx` | `TrendChip` function | same |
| `components/admin/charts/MiniLineChart.tsx` | `TrendChip` function | same |

In each file: delete the local function definition, replace all call sites with `<TrendChip change={...} />`.

---

## Change 2 — Chart Fill Color

Switch chart fills/strokes from `var(--admin-accent)` (black light / white dark) to `var(--admin-chart)` (green).

| File | Current value | New value |
|---|---|---|
| `components/admin/charts/RevenueChart.tsx` | line `stroke` — hardcoded or `--admin-accent` | `var(--admin-chart)` |
| `components/admin/charts/MiniLineChart.tsx` | default `color = 'var(--admin-accent)'` | `color = 'var(--admin-chart)'` |
| `components/admin/charts/HorizontalBarChart.tsx` | `fill="var(--admin-accent)"` on `<Bar>` | `fill="var(--admin-chart)"` |
| `components/admin/charts/OrdersChart.tsx` | `fill` on `<Bar>` — hardcoded or `--admin-accent` | `var(--admin-chart)` |

`DonutChart` — no change. Colors are passed per-slice by the caller (`deviceData`, `channelData` in analytics page). The caller can update slice colors separately if desired.

---

## What Does NOT Change

- The `--admin-accent` token itself (stays black/white — used for buttons, active nav, table row hover)
- Badge components (`Badge.tsx`) — status colors are already correct
- `--admin-green` and `--admin-red` tokens — kept as-is (used for stock alerts, order status)
- All layout, spacing, typography
- Overview page layout
- Any storefront pages

---

## File Summary

| Action | File |
|---|---|
| Modify | `app/globals.css` — add 5 new tokens per mode |
| Create | `components/admin/shared/TrendChip.tsx` |
| Modify | `app/admin/overview/page.tsx` — remove `ChangeChip`, import `TrendChip` |
| Modify | `app/admin/analytics/page.tsx` — remove `TrendChip`, import shared |
| Modify | `components/admin/charts/MiniLineChart.tsx` — remove `TrendChip`, import shared, update default color |
| Modify | `components/admin/charts/RevenueChart.tsx` — update line stroke |
| Modify | `components/admin/charts/HorizontalBarChart.tsx` — update bar fill |
| Modify | `components/admin/charts/OrdersChart.tsx` — update bar fill |

---

*Spec written: 2026-06-01 · Acme Lamp & Sign Co. Admin Dashboard Color Accents*
