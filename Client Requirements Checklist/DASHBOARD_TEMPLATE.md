# Universal Admin/Dashboard Layout Template

A reusable frontend layout system for any admin panel, management console, or
internal dashboard. Extracted and genericized from the Acme Vintage Supply
admin dashboard (`components/admin/`).

**Stack:** Plain React 18+ + Tailwind CSS v4. No framework-specific APIs —
works identically in **Vite** or **Next.js**. The two lines that differ
between them are called out inline (`<Link>`/`<a>`, and the `'use client'`
directive, which Vite simply ignores as a no-op comment).

---

## Why this exists

Every dashboard needs the same skeleton: a sidebar, a top bar, stat cards, a
revenue/trend chart, a data table, empty states, and a light/dark theme. Rebuild
that skeleton from this doc instead of re-deriving it (or copy-pasting a
business-specific implementation) each time a new project needs one.

---

## 1. Design tokens (do this first)

Everything below reads from CSS custom properties, not hardcoded colors. This
is what makes the components portable across projects/brands — reskin by
changing `globals.css`, not by touching component code.

```css
/* globals.css or index.css */
:root {
  --dash-bg:           #F6F6F7;
  --dash-surface:      #FFFFFF;
  --dash-surface-2:    #EDEDEF;
  --dash-border:       #E1E1E4;
  --dash-text:         #09090B;
  --dash-text-soft:    #62626A;
  --dash-text-muted:   #9898A3;
  --dash-accent:       #09090B;   /* primary brand color */
  --dash-accent-text:  #FFFFFF;   /* text/icon color on top of accent */

  --dash-green:        #16A34A;
  --dash-red:          #DC2626;
  --dash-amber:        #D97706;
  --dash-green-bg:     rgba(22, 163, 74, 0.08);
  --dash-red-bg:       rgba(220, 38, 38, 0.07);
  --dash-amber-bg:     rgba(217, 119, 6, 0.07);

  --dash-chip-green-bg:   #dcfce7;
  --dash-chip-green-text: #15803d;
  --dash-chip-red-bg:     #fee2e2;
  --dash-chip-red-text:   #b91c1c;

  --dash-sidebar-w:    240px;
  --dash-topbar-h:     56px;
}

[data-theme='dark'] {
  --dash-bg:           #000000;
  --dash-surface:      #0C0C0E;
  --dash-surface-2:    #161618;
  --dash-border:       #232326;
  --dash-text:         #F4F4F5;
  --dash-text-soft:    #A0A0AB;
  --dash-text-muted:   #62626A;
  --dash-accent:       #F4F4F5;
  --dash-accent-text:  #0C0C0E;

  --dash-green:        #22C55E;
  --dash-red:          #EF4444;
  --dash-amber:        #F59E0B;
  --dash-green-bg:     rgba(34, 197, 94, 0.1);
  --dash-red-bg:       rgba(239, 68, 68, 0.1);
  --dash-amber-bg:     rgba(245, 158, 11, 0.1);

  --dash-chip-green-bg:   rgba(34, 197, 94, 0.15);
  --dash-chip-green-text: #22C55E;
  --dash-chip-red-bg:     rgba(239, 68, 68, 0.15);
  --dash-chip-red-text:   #EF4444;
}
```

Swap `--dash-accent` (and its `-text` pair) to rebrand instantly — every
component below inherits from these two variables for its primary color.

**Tailwind v4 usage note:** these are consumed as `bg-(--dash-bg)`,
`text-(--dash-text)`, `border-(--dash-border)` etc. — Tailwind v4's arbitrary
CSS-variable syntax. If a project is still on Tailwind v3, use
`bg-[var(--dash-bg)]` instead.

---

## 2. Layout anatomy

```
┌─────────────────────────────────────────────────┐
│ Topbar (fixed, full width minus sidebar)         │  56px tall
├──────────┬────────────────────────────────────────┤
│          │                                        │
│ Sidebar  │  Main content                          │
│ (fixed,  │  - PageHeader (title + actions)        │
│  240px)  │  - StatCard grid (2 cols mobile,       │
│          │    4 cols desktop)                     │
│          │  - Chart panel + breakdown panel        │
│          │  - DataTable / list                    │
│          │                                        │
├──────────┴────────────────────────────────────────┤
│ BottomNav (mobile only, <lg breakpoint)           │
└─────────────────────────────────────────────────┘
```

Rules:
- Sidebar is `fixed`, desktop-only (`hidden lg:flex`), width = `--dash-sidebar-w`.
- Topbar is `fixed`, offset by the sidebar width on desktop (`lg:left-60`), height = `--dash-topbar-h`.
- Main content gets `padding-left: var(--dash-sidebar-w)` on desktop and `padding-top: var(--dash-topbar-h)` always.
- On mobile, sidebar disappears entirely in favor of a bottom tab bar (`BottomNav`) — don't try to collapse the sidebar into a hamburger drawer; a bottom nav is the better mobile pattern for admin tools.
- Every page's content area is wrapped in `p-4 sm:p-5 lg:p-6`.

### Shell component

```tsx
// DashboardShell.tsx
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-(--dash-bg)">
      <Sidebar />
      <Topbar />
      <main className="min-h-screen lg:pl-60" style={{ paddingTop: 'var(--dash-topbar-h)' }}>
        <div className="p-4 sm:p-5 lg:p-6 pb-20 lg:pb-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
```

---

## 3. Sidebar

```tsx
// Sidebar.tsx
// Next.js: import Link from 'next/link'  →  use <Link href={...}>
// Vite/plain React: use react-router-dom's <Link to={...}>, or a plain <a>

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

function NavLink({ label, href, icon: Icon, badge, active }: NavItem & { active: boolean }) {
  return (
    <a
      href={href}
      className={[
        'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors',
        active
          ? 'bg-(--dash-accent) text-(--dash-accent-text)'
          : 'text-(--dash-text-soft) hover:bg-(--dash-surface-2) hover:text-(--dash-text)',
      ].join(' ')}
    >
      <Icon size={16} className="shrink-0" />
      <span className="flex-1">{label}</span>
      {!!badge && (
        <span className={[
          'text-[10px] px-1.5 py-0.5 rounded-full',
          active ? 'bg-(--dash-accent-text)/20 text-(--dash-accent-text)' : 'bg-(--dash-border) text-(--dash-text-soft)',
        ].join(' ')}>
          {badge}
        </span>
      )}
    </a>
  )
}

export default function Sidebar({ items, storeName = 'Dashboard' }: { items: NavItem[]; storeName?: string }) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0 bottom-0 flex-col bg-(--dash-surface) border-r border-(--dash-border)"
      style={{ width: 'var(--dash-sidebar-w)' }}
    >
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-(--dash-border)" style={{ height: 'var(--dash-topbar-h)' }}>
        <div className="w-6 h-6 rounded-sm bg-(--dash-accent) flex items-center justify-center">
          <span className="text-(--dash-accent-text) text-[10px] font-bold">{storeName[0]}</span>
        </div>
        <p className="text-[12px] font-semibold text-(--dash-text) truncate">{storeName}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3 mb-1.5 text-[10px] uppercase tracking-widest text-(--dash-text-muted)">Main</p>
        {items.map(item => (
          <NavLink key={item.href} {...item} active={pathname === item.href} />
        ))}
      </nav>

      {/* theme toggle + user/logout footer goes here — see AdminSidebar.tsx for the full pattern */}
    </aside>
  )
}
```

**Key rules to keep:**
- Section labels above nav groups: `text-[10px] uppercase tracking-widest text-(--dash-text-muted)`.
- Active state = solid accent background + accent-text color, never just a left border or underline — it needs to read clearly in a dense icon+label list.
- Badge counts only render when `> 0` — never show a `0` badge.

---

## 4. Topbar

Structure only (search/notifications/profile are business-specific — wire
your own data, keep the shell):

```tsx
<header
  className="fixed top-0 left-0 right-0 lg:left-60 flex items-center gap-3 px-4 sm:px-6 bg-(--dash-surface) border-b border-(--dash-border) z-20"
  style={{ height: 'var(--dash-topbar-h)' }}
>
  {/* search input, flex-1 max-w-sm on desktop, hidden/expandable on mobile */}
  {/* ml-auto: notification bell (badge = --dash-green pill) + profile avatar (rounded-full, accent bg) */}
</header>
```

---

## 5. Stat cards

The core "at a glance" metric row. Always 2 columns on mobile, 4 on desktop.

```tsx
// SectionCard.tsx — the base surface every panel/card wraps in
export function SectionCard({ children, className = '', noPadding = false }: {
  children: React.ReactNode; className?: string; noPadding?: boolean
}) {
  return (
    <div className={`bg-(--dash-surface) border border-(--dash-border) rounded-lg ${noPadding ? '' : 'p-5'} ${className}`}>
      {children}
    </div>
  )
}

// TrendChip.tsx — the +/- % pill
export function TrendChip({ change }: { change: number }) {
  if (change === 0) return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] text-(--dash-text-muted)">
      – 0%
    </span>
  )
  const up = change > 0
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-medium"
      style={{
        background: up ? 'var(--dash-chip-green-bg)' : 'var(--dash-chip-red-bg)',
        color:      up ? 'var(--dash-chip-green-text)' : 'var(--dash-chip-red-text)',
      }}
    >
      {up ? '▲' : '▼'} {up ? '+' : ''}{change}%
    </span>
  )
}

// StatCard.tsx
export function StatCard({ label, value, change, period, icon }: {
  label: string; value: string; change: number; period: string; icon: React.ReactNode
}) {
  return (
    <SectionCard className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-(--dash-text-muted)">{label}</p>
        <span className="text-(--dash-text-muted)">{icon}</span>
      </div>
      <p className="text-[26px] font-semibold text-(--dash-text) leading-none tracking-tight">{value}</p>
      <div className="flex items-center justify-between">
        <TrendChip change={change} />
        <p className="text-[11px] text-(--dash-text-muted)">{period}</p>
      </div>
    </SectionCard>
  )
}

// Usage
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <StatCard label="Revenue"   value="$6,613.00" change={12} period="Last 30 days" icon={<DollarIcon />} />
  <StatCard label="Orders"    value="29"        change={0}  period="Last 30 days" icon={<CartIcon />} />
  <StatCard label="Customers" value="4"          change={0}  period="0 repeat"     icon={<TrendIcon />} />
  <StatCard label="Pending"   value="20"          change={0}  period="Needs action" icon={<PackageIcon />} />
</div>
```

Attach a small red status dot (`absolute top-3 right-3 w-2 h-2 rounded-full
bg-(--dash-red)`) to any stat card that represents something needing action
(e.g. unfulfilled orders) — wrap the card in a `relative` div to position it.

---

## 6. Chart + breakdown panel

Two-column layout on large screens: a `SectionCard` with the trend line/bar
chart (any charting lib — Recharts is what Acme uses) on the left spanning 2/3
width, a plain list-style breakdown (`label ─── value`, each row separated by
nothing but consistent vertical rhythm) on the right spanning 1/3.

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <SectionCard className="lg:col-span-2">
    {/* chart title + period toggle (7/30/90 days) up top, chart body below */}
  </SectionCard>
  <SectionCard>
    {/* breakdown rows: flex justify-between per row, text-[13px] label, font-semibold value */}
  </SectionCard>
</div>
```

Chart line/bar color always reads from `--dash-chart` (falls back to
`--dash-green` if you don't define a separate token) — never hardcode a hex
in chart config.

---

## 7. Data table

Fully generic, typed, framework-agnostic — copy as-is, it has zero
Next.js-specific imports.

```tsx
// DataTable.tsx
export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  className?: string
  render?: (row: T) => React.ReactNode
}

export function DataTable<T extends Record<string, unknown>>({
  columns, data, keyField, onRowClick, emptyMessage, emptyDescription, loading,
}: {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  onRowClick?: (row: T) => void
  emptyMessage?: string
  emptyDescription?: string
  loading?: boolean
}) {
  // sort state + handleSort, identical to Acme's implementation —
  // see components/admin/shared/DataTable.tsx for the full version.
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-(--dash-border)">
            {columns.map(col => (
              <th key={String(col.key)} className="px-4 py-3 text-[11px] uppercase tracking-wider text-(--dash-text-muted) whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length}><Spinner /></td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length}><EmptyState message={emptyMessage} description={emptyDescription} /></td></tr>
          ) : (
            data.map(row => (
              <tr
                key={String(row[keyField])}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-(--dash-border) transition-colors ${onRowClick ? 'cursor-pointer hover:bg-(--dash-surface-2)' : ''}`}
              >
                {columns.map(col => (
                  <td key={String(col.key)} className="px-4 py-3 text-[13px] text-(--dash-text) whitespace-nowrap">
                    {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
```

---

## 8. Empty state

Use this identical pattern for every empty list/table in the system —
consistency here matters more than cleverness.

```tsx
export function EmptyState({
  message = 'No results found',
  description = 'Try adjusting your filters or search query.',
}: { message?: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <BoxIcon size={32} className="text-(--dash-text-muted) mb-3" />
      <p className="text-[14px] font-medium text-(--dash-text-soft)">{message}</p>
      <p className="text-[12px] text-(--dash-text-muted) mt-1">{description}</p>
    </div>
  )
}
```

---

## 9. Page header

Every top-level page starts with this — title + optional subtitle on the
left, action buttons on the right.

```tsx
export function PageHeader({ title, subtitle, actions }: {
  title: string; subtitle?: string; actions?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[20px] font-semibold text-(--dash-text) leading-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-(--dash-text-soft) mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
```

---

## 10. Typography & spacing scale (memorize these, reuse everywhere)

| Use | Class |
|---|---|
| Page title | `text-[20px] font-semibold` |
| Section/card label (uppercase) | `text-[11px] uppercase tracking-widest text-(--dash-text-muted)` |
| Stat value (big number) | `text-[26px] font-semibold tracking-tight` |
| Table header | `text-[11px] uppercase tracking-wider text-(--dash-text-muted)` |
| Table cell / body text | `text-[13px] text-(--dash-text)` |
| Secondary/meta text | `text-[12px] text-(--dash-text-soft)` or `text-[11px] text-(--dash-text-muted)` |
| Card padding | `p-5` (SectionCard default) |
| Card radius | `rounded-lg` (cards), `rounded-md` (buttons/inputs), `rounded-full` (chips/avatars) |
| Page content padding | `p-4 sm:p-5 lg:p-6` |
| Grid gaps | `gap-4` (cards), `gap-2`–`gap-3` (inline items) |

---

## 11. Checklist for starting a new dashboard from this template

1. Copy the CSS token block (section 1) into the new project's global stylesheet, rename `--dash-*` if you want a different prefix, set the brand accent color.
2. Build `DashboardShell`, `Sidebar`, `Topbar`, `BottomNav` — swap nav items/icons for the new domain.
3. Copy `SectionCard`, `StatCard`, `TrendChip`, `DataTable`, `EmptyState`, `PageHeader`, `Spinner` verbatim — these are already framework-agnostic.
4. Build the Overview page: `PageHeader` → stat card grid → chart/breakdown row → recent-activity table.
5. If Next.js: swap `<a>` → `next/link`'s `<Link>`, add `'use client'` to any component using hooks/state. If Vite: keep `<a>` or swap for `react-router-dom`'s `<Link>` — no other changes needed.

---

*Extracted from the Acme Vintage Supply admin dashboard, July 8, 2026.*
