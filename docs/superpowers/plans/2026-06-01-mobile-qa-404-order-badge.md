# Mobile QA, Custom 404 & Admin Order Badge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three confirmed mobile layout bugs in the storefront, add a branded 404 page, and replace the hardcoded admin Orders badge count with a live unfulfilled count.

**Architecture:** Three independent tasks — each produces a self-contained commit. No new dependencies. No API routes needed for the 404 or mobile fixes. The order badge fetches from the existing `/api/admin/orders` endpoint already in place.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, react-icons/bi (admin), framer-motion (storefront)

---

## File Map

| Action | File | Task |
|---|---|---|
| Modify | `components/nav/MobileDrawer.tsx` | A |
| Modify | `components/catalog/FilterBar.tsx` | A |
| Modify | `components/home/HeroSection.tsx` | A |
| Create | `app/not-found.tsx` | B |
| Modify | `components/admin/layout/AdminSidebar.tsx` | C |

---

## Task A: Mobile QA — Fix Three Storefront Bugs

### Bug 1 — MobileDrawer catalog links use wrong category values

**File:** `components/nav/MobileDrawer.tsx`

The drawer has hardcoded sub-links that use categories that don't exist (`lighting`, `glass-chimneys`, `hardware`, `signs`). The FilterBar uses the actual Shopify collection handles. Clicking these links takes the user to `/catalog?category=lighting` which matches nothing and shows all products as if no filter is applied.

**Current code (lines 10–15):**
```tsx
const catalogLinks = [
  { label: 'Lighting Fixtures', href: '/catalog?category=lighting' },
  { label: 'Glass & Chimneys', href: '/catalog?category=glass-chimneys' },
  { label: 'Burners & Hardware', href: '/catalog?category=hardware' },
  { label: 'Advertising Signs', href: '/catalog?category=signs' },
]
```

### Bug 2 — FilterBar padding doesn't match CatalogClient on mobile

**File:** `components/catalog/FilterBar.tsx`

`FilterBar` uses `px-6` (24px) at all breakpoints. The `CatalogClient` wrapper below it uses `px-4 sm:px-6` (16px on mobile, 24px on sm+). This makes the category pills and the product grid visually misaligned on phones.

**Current (line 30):**
```tsx
<div className="max-w-[1280px] mx-auto px-6">
```

### Bug 3 — Hero min-height is too tall on mobile

**File:** `components/home/HeroSection.tsx`

`min-h-[90vh]` means the hero section occupies at least 90% of the viewport height before any other content is visible. On mobile (375px), the image renders first (`order-1`) and the text block second (`order-2 lg:order-1`), so the stat strip, provenance section, and category grid are all pushed far below the fold. Reducing to `min-h-[70vh]` on mobile keeps the editorial intent without burying everything else.

**Current (line 13):**
```tsx
<section className="relative min-h-[90vh] flex items-center ...">
```

---

- [ ] **Step 1: Fix MobileDrawer catalog links**

In `components/nav/MobileDrawer.tsx`, replace lines 10–15 with:

```tsx
const catalogLinks = [
  { label: 'Oil Lamp Chimneys',       href: '/catalog?category=oil-lamp-chimneys'       },
  { label: 'Oil Lamp Shades',         href: '/catalog?category=oil-lamp-shades'         },
  { label: 'Pressure Lamps',          href: '/catalog?category=oil-lamp-pressure-lamps' },
  { label: 'Books & Guides',          href: '/catalog?category=oil-lamp-books'          },
  { label: 'Spreaders & Hardware',    href: '/catalog?category=oil-lamp-spreaders'      },
  { label: 'Wicks',                   href: '/catalog?category=oil-lamp-wicks'          },
]
```

- [ ] **Step 2: Fix FilterBar mobile padding**

In `components/catalog/FilterBar.tsx`, find line 30:
```tsx
<div className="max-w-[1280px] mx-auto px-6">
```
Replace with:
```tsx
<div className="max-w-[1280px] mx-auto px-4 sm:px-6">
```

- [ ] **Step 3: Fix Hero mobile min-height**

In `components/home/HeroSection.tsx`, find line 13:
```tsx
<section className="relative min-h-[90vh] flex items-center bg-parchment px-4 sm:px-6 py-12 sm:py-20 overflow-hidden">
```
Replace with:
```tsx
<section className="relative min-h-[70vh] sm:min-h-[90vh] flex items-center bg-parchment px-4 sm:px-6 py-12 sm:py-20 overflow-hidden">
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 5: Commit**

```bash
git add components/nav/MobileDrawer.tsx components/catalog/FilterBar.tsx components/home/HeroSection.tsx
git commit -m "fix(mobile): correct drawer category links, FilterBar padding, hero min-height"
```

---

## Task B: Custom 404 Page

**Files:**
- Create: `app/not-found.tsx`

Next.js uses `app/not-found.tsx` as the global 404. Currently the default Next.js 404 appears — completely off-brand. This creates one that matches the Acme Lamp & Sign storefront design.

The 404 page must NOT show the admin shell. It renders within the main storefront `layout.tsx` (which includes the Nav), so it gets the nav automatically.

- [ ] **Step 1: Create the file**

```tsx
// app/not-found.tsx
import Link from 'next/link'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'

export default function NotFound() {
  return (
    <div className="bg-parchment min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center">

      {/* Decorative number */}
      <p
        className="font-serif font-medium text-parchment-3 select-none leading-none mb-0 pointer-events-none"
        style={{ fontSize: 'clamp(120px, 24vw, 240px)' }}
        aria-hidden="true"
      >
        404
      </p>

      <div className="-mt-6 relative z-10">
        <Eyebrow className="mb-5">Page not found</Eyebrow>

        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-6"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          This wick has burned out.
        </h1>

        <p className="font-sans text-[17px] text-ink-soft leading-relaxed mb-10 max-w-[44ch] mx-auto">
          The page you're looking for has been moved, removed, or never existed.
          The catalog is still lit — try starting there.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button href="/catalog" variant="primary">Walk the catalog →</Button>
          <Button href="/" variant="ghost">Back to storefront</Button>
        </div>
      </div>

    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 3: Verify the page renders**

Run the dev server: `npm run dev`
Navigate to any non-existent URL, e.g. `http://localhost:3000/does-not-exist`

Verify:
- Nav bar appears at top
- Large faded "404" number as background decoration
- "This wick has burned out." headline in serif
- Two CTA buttons — Walk the catalog + Back to storefront
- No admin shell shown

- [ ] **Step 4: Commit**

```bash
git add app/not-found.tsx
git commit -m "feat: add branded 404 page"
```

---

## Task C: Admin Dynamic Order Badge

**Files:**
- Modify: `components/admin/layout/AdminSidebar.tsx`

The Orders nav item has `badge: 4` hardcoded. It should show the live count of unfulfilled orders, fetched from the existing `/api/admin/orders` endpoint which already returns `AdminOrder[]` with a `fulfillmentStatus` field.

The sidebar already runs a `useEffect` fetch for `/api/admin/shop`. The pattern is the same.

**Current NAV_MAIN (line 22–31):**
```tsx
const NAV_MAIN = [
  { label: 'Overview',    href: '/admin/overview',    icon: BiHomeAlt },
  { label: 'Orders',      href: '/admin/orders',      icon: BiCart,       badge: 4 },
  { label: 'Products',    href: '/admin/products',    icon: BiPackage },
  { label: 'Inventory',   href: '/admin/inventory',   icon: BiArchive },
  { label: 'Collections', href: '/admin/collections', icon: BiCollection },
  { label: 'Customers',   href: '/admin/customers',   icon: BiUser },
  { label: 'Analytics',   href: '/admin/analytics',   icon: BiBarChartAlt2 },
]
```

The `badge` field is typed as `number | undefined` in the `NavItem` component. The plan is to:
1. Remove the hardcoded `badge: 4`
2. Add `unfulfilledCount` state (number, starts 0)
3. Fetch `/api/admin/orders` on mount, count those with `fulfillmentStatus === 'unfulfilled'`
4. Pass `unfulfilledCount` as the badge for the Orders item

- [ ] **Step 1: Add state and fetch to AdminSidebar**

In `components/admin/layout/AdminSidebar.tsx`, after the existing `const [ownerEmail, setOwnerEmail] = useState('')` line, add:

```tsx
const [unfulfilledCount, setUnfulfilledCount] = useState(0)
```

After the existing `useEffect` that fetches `/api/admin/shop`, add a second `useEffect`:

```tsx
useEffect(() => {
  fetch('/api/admin/orders')
    .then(r => r.ok ? r.json() : [])
    .then((orders: { fulfillmentStatus: string }[]) => {
      setUnfulfilledCount(orders.filter(o => o.fulfillmentStatus === 'unfulfilled').length)
    })
    .catch(() => {})
}, [])
```

- [ ] **Step 2: Update NAV_MAIN to use dynamic badge**

NAV_MAIN must become a value computed inside the component (after the state declarations), not a module-level constant, since it references `unfulfilledCount`.

Remove the module-level `const NAV_MAIN = [...]` and replace it with a variable declared inside the `AdminSidebar` function body, after the state declarations:

```tsx
const NAV_MAIN = [
  { label: 'Overview',    href: '/admin/overview',    icon: BiHomeAlt                                        },
  { label: 'Orders',      href: '/admin/orders',      icon: BiCart,        badge: unfulfilledCount || undefined },
  { label: 'Products',    href: '/admin/products',    icon: BiPackage                                        },
  { label: 'Inventory',   href: '/admin/inventory',   icon: BiArchive                                        },
  { label: 'Collections', href: '/admin/collections', icon: BiCollection                                     },
  { label: 'Customers',   href: '/admin/customers',   icon: BiUser                                           },
  { label: 'Analytics',   href: '/admin/analytics',   icon: BiBarChartAlt2                                   },
]
```

`badge: unfulfilledCount || undefined` means: show the badge when count > 0, hide it entirely when count is 0 (so the badge dot doesn't show "0").

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0

- [ ] **Step 4: Verify**

With dev server running, log in to `/admin`. Check:
- If there are unfulfilled orders: the Orders sidebar item shows a badge number matching the count
- If all orders are fulfilled: no badge shown on Orders
- Badge updates correctly (refresh page to re-fetch)

- [ ] **Step 5: Commit**

```bash
git add components/admin/layout/AdminSidebar.tsx
git commit -m "feat(admin): replace hardcoded order badge with live unfulfilled count"
```

---

## Self-Review

**Spec coverage:**

| Requirement | Task |
|---|---|
| Fix MobileDrawer category links | ✅ Task A Step 1 |
| Fix FilterBar mobile padding | ✅ Task A Step 2 |
| Fix hero min-height on mobile | ✅ Task A Step 3 |
| Custom 404 page — branded, matches storefront | ✅ Task B |
| 404 shows nav, no admin shell | ✅ Task B — uses app root layout automatically |
| Admin Orders badge shows live unfulfilled count | ✅ Task C |
| Badge hidden when count is 0 | ✅ Task C — `unfulfilledCount || undefined` |

**Placeholder scan:** No TBDs, all code complete, all file paths exact.

**Type consistency:**
- `unfulfilledCount: number` state → `badge: unfulfilledCount || undefined` passes `number | undefined` which matches the existing `NavItemProps.badge?: number` ✅
- `not-found.tsx` uses `Button` and `Eyebrow` — both already used throughout the storefront with identical import paths ✅
- Fetch response typed as `{ fulfillmentStatus: string }[]` — safe minimal type, only reads the one field needed ✅

---

*Plan written: 2026-06-01 · Acme Lamp & Sign Co.*
