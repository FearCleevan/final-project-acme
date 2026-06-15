# Homepage Category Rows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Everything in stock, by collection" section to the home page — three horizontal rows of 5 real Shopify products each (Oil Lamp Shades, Glass & Chimneys, Burners & Wicks), with a "View all →" link per row, sitting between PickedOffTheBench and TestimonialsWrapper.

**Architecture:** A single async server component `CategoryRows` fetches three category product lists in parallel using `Promise.all` + the existing `getProductsByCategory()` function, then renders each as a labelled row of 5 `ProductCard` components. Mobile gets a horizontal scroll container so no cards are clipped. The home page `app/page.tsx` receives one new import and one new JSX line.

**Tech Stack:** Next.js 16 App Router (async server component), Tailwind v4, existing `getProductsByCategory` from `lib/shopify.ts`, existing `ProductCard` from `components/catalog/ProductCard.tsx`.

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `components/home/CategoryRows.tsx` | Async server component — fetches 3 category slices, renders 3 labelled product rows |
| Modify | `app/page.tsx` | Import + insert `<CategoryRows />` between `<PickedOffTheBench />` and `<TestimonialsWrapper />` |

---

## Task 1 — Create `CategoryRows` component

**Files:**
- Create: `components/home/CategoryRows.tsx`

### Row config

Three rows are hard-coded in the component. Each entry maps a display label, a Shopify collection handle (used by `getProductsByCategory`), and the catalog URL for the "View all" link.

| Label | Collection handle | View-all href |
|---|---|---|
| Oil Lamp Shades | `oil-lamp-shades` | `/catalog?category=oil-lamp-shades` |
| Glass & Chimneys | `oil-lamp-chimneys` | `/catalog?category=oil-lamp-chimneys` |
| Burners & Wicks | `oil-lamp-wicks` | `/catalog?category=oil-lamp-wicks` |

### Key behaviours

- **Parallel fetch:** all three `getProductsByCategory()` calls run inside a single `Promise.all` — no waterfall
- **Slice to 5:** each list is `.slice(0, 5)` after fetching
- **Empty rows hidden:** if a category returns 0 products after slicing, that row renders nothing (no blank space)
- **Mobile scroll:** the product grid wrapper uses `overflow-x-auto` with `grid-cols-5 min-w-[700px]` so all 5 cards stay full-size and the user swipes horizontally on small screens
- **`ProductCard` reuse:** uses the existing `ProductCard` with `aspectRatio="4/5"` — identical to the Related Products section

- [ ] **Step 1: Create the file**

```tsx
// components/home/CategoryRows.tsx
import Link from 'next/link'
import { getProductsByCategory } from '@/lib/shopify'
import type { Product } from '@/lib/types'
import Eyebrow from '@/components/shared/Eyebrow'
import ProductCard from '@/components/catalog/ProductCard'

const ROWS: { label: string; handle: Product['category']; href: string }[] = [
  { label: 'Oil Lamp Shades',  handle: 'oil-lamp-shades',   href: '/catalog?category=oil-lamp-shades' },
  { label: 'Glass & Chimneys', handle: 'oil-lamp-chimneys', href: '/catalog?category=oil-lamp-chimneys' },
  { label: 'Burners & Wicks',  handle: 'oil-lamp-wicks',    href: '/catalog?category=oil-lamp-wicks' },
]

export default async function CategoryRows() {
  const results = await Promise.all(
    ROWS.map(row => getProductsByCategory(row.handle).catch(() => []))
  )

  const rows = ROWS.map((row, i) => ({ ...row, products: results[i].slice(0, 5) }))
    .filter(row => row.products.length > 0)

  if (rows.length === 0) return null

  return (
    <section className="bg-parchment border-t border-ink-rule px-6 py-20">
      <div className="max-w-[1280px] mx-auto">

        <div className="mb-12">
          <Eyebrow className="mb-3">Shop by type</Eyebrow>
          <h2
            className="font-serif font-medium text-ink-charcoal leading-tight"
            style={{ fontSize: 'clamp(24px, 3vw, 40px)' }}
          >
            Everything in stock,<br />by collection.
          </h2>
        </div>

        <div className="flex flex-col gap-16">
          {rows.map(row => (
            <div key={row.handle}>
              {/* Row header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-ink-rule">
                <h3 className="font-serif text-[22px] font-medium text-ink-charcoal">
                  {row.label}
                </h3>
                <Link
                  href={row.href}
                  className="font-sans text-[12px] font-semibold uppercase tracking-widest text-brass-deep hover:text-brass transition-colors border-b border-brass-deep/40 hover:border-brass pb-px"
                >
                  View all →
                </Link>
              </div>

              {/* Product cards — horizontal scroll on mobile */}
              <div className="overflow-x-auto pb-2 -mx-1 px-1">
                <div className="grid grid-cols-5 gap-x-3 sm:gap-x-5 gap-y-6 items-start min-w-[680px]">
                  {row.products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      aspectRatio="4/5"
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify file saved** — check no TypeScript errors on imports (`Product`, `getProductsByCategory`, `ProductCard`, `Eyebrow` all exist at the import paths above)

---

## Task 2 — Wire into the home page

**Files:**
- Modify: `app/page.tsx:1-22`

Current `app/page.tsx`:
```tsx
import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import CategoryGrid from '@/components/home/CategoryGrid'
import PickedOffTheBench from '@/components/home/PickedOffTheBench'
import TestimonialsWrapper from '@/components/home/TestimonialsWrapper'

export const metadata: Metadata = {
  title: 'Oil Lamp Chimneys, Shades & Enamel Signs — Acme Vintage Supply',
  description: 'Buy oil lamp chimneys, shades, pressure lamp glass, and Victorian enamel advertising signs. Bench-tested antique lamp parts shipped across Canada and North America from Dartmouth, Nova Scotia.',
  alternates: { canonical: '/' },
}

export default function Home() {
  return (
    <>
      <HeroSection />
      <CategoryGrid />
      <PickedOffTheBench />
      <TestimonialsWrapper />
    </>
  )
}
```

- [ ] **Step 1: Add import and JSX**

Replace the entire file with:

```tsx
import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import CategoryGrid from '@/components/home/CategoryGrid'
import PickedOffTheBench from '@/components/home/PickedOffTheBench'
import CategoryRows from '@/components/home/CategoryRows'
import TestimonialsWrapper from '@/components/home/TestimonialsWrapper'

export const metadata: Metadata = {
  title: 'Oil Lamp Chimneys, Shades & Enamel Signs — Acme Vintage Supply',
  description: 'Buy oil lamp chimneys, shades, pressure lamp glass, and Victorian enamel advertising signs. Bench-tested antique lamp parts shipped across Canada and North America from Dartmouth, Nova Scotia.',
  alternates: { canonical: '/' },
}

export default function Home() {
  return (
    <>
      <HeroSection />
      <CategoryGrid />
      <PickedOffTheBench />
      <CategoryRows />
      <TestimonialsWrapper />
    </>
  )
}
```

- [ ] **Step 2: Verify page order** — final render order should be:
  1. `HeroSection`
  2. `CategoryGrid` (bento grid — existing)
  3. `PickedOffTheBench` (5 featured products — existing)
  4. `CategoryRows` (3 category rows — NEW)
  5. `TestimonialsWrapper` (existing)
