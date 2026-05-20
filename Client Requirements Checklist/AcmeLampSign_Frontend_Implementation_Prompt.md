# Acme Lamp & Sign — Frontend Implementation Prompt
## Full E-Commerce Frontend · Next.js · Phase-by-Phase Execution Guide

> **For Claude Code:** Before executing any phase, read this entire document and store the following as active memory:
> - Project name: **Acme Lamp & Sign**
> - Stack: **Next.js 14 (App Router)**, Tailwind CSS, React Icons / inline SVG
> - Design language: **Vintage editorial e-commerce** — parchment surfaces, brass accents, dark canvas sections, Playfair Display serif headings, Inter sans body, JetBrains Mono eyebrow labels
> - Color tokens (never deviate): `--parchment #FAF5EC`, `--parchment-2 #F2EBDB`, `--parchment-3 #E8DEC5`, `--charcoal #1E2022`, `--iron #2D2F31`, `--iron-soft #4A4D50`, `--brass #C29B47`, `--brass-deep #9C7A2E`, `--green #2E4A3F`, `--green-deep #233830`
> - Font stack: Serif = Playfair Display / Cormorant Garamond; Sans = Inter; Mono = JetBrains Mono
> - Cart terminology: **"Crate"** not "Cart"
> - Every phase ends with a **STOP**. Provide a full report of what was built. Ask: **"Continue with the next phase?"** — only proceed on explicit "Yes, Proceed."
> - No animated emojis. Use `react-icons` or inline SVG only.
> - No generic template aesthetics. Every component must feel handcrafted and editorial.

---

## Memory Anchors (Commit These Before Starting)

```
PROJECT: Acme Lamp & Sign e-commerce storefront
FRAMEWORK: Next.js 14 App Router + Tailwind CSS
BACKEND: Mock data layer only (Shopify integration deferred)
PAGES: Storefront (Home), Catalog, Product Detail, Our Story, Heritage, Contact, Crate (Cart), Checkout, Sign In / Create Account, Search Overlay
DESIGN_REF: Vintage editorial — parchment/brass/charcoal/green palette
SCROLL: Parallax sections on Storefront and Heritage pages
FILTER: Multi-axis filtering on Catalog (category pills, burner size, material, sort)
CRATE: Slide-in drawer panel (not a separate page)
SEARCH: Full-overlay search with live filtering
CHECKOUT: 3-step accordion (Crate → Details & Payment → Confirmed)
PHASE_GATE: STOP after each phase. Report. Ask "Continue with the next phase?" — wait for "Yes, Proceed."
```

---

## Project Structure (Target)

```
acme-lamp-sign/
├── app/
│   ├── layout.tsx                  # Root layout: fonts, global CSS, Nav, Crate drawer
│   ├── page.tsx                    # Storefront (Home)
│   ├── catalog/
│   │   └── page.tsx                # Full Catalog with filtering
│   ├── catalog/[slug]/
│   │   └── page.tsx                # Product Detail
│   ├── our-story/
│   │   └── page.tsx
│   ├── heritage/
│   │   └── page.tsx
│   ├── contact/
│   │   └── page.tsx
│   ├── checkout/
│   │   └── page.tsx
│   └── account/
│       └── page.tsx
├── components/
│   ├── nav/
│   │   ├── Nav.tsx
│   │   ├── NavLinks.tsx
│   │   ├── NavActions.tsx
│   │   └── MobileDrawer.tsx
│   ├── crate/
│   │   ├── CrateDrawer.tsx
│   │   ├── CrateItem.tsx
│   │   └── CrateSummary.tsx
│   ├── catalog/
│   │   ├── CatalogHeader.tsx
│   │   ├── FilterBar.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── ProductGrid.tsx
│   │   └── ProductCard.tsx
│   ├── product/
│   │   ├── ProductGallery.tsx
│   │   ├── ProductInfo.tsx
│   │   ├── FitmentBox.tsx
│   │   ├── SpecTable.tsx
│   │   └── RelatedProducts.tsx
│   ├── home/
│   │   ├── HeroSection.tsx
│   │   ├── ProvenanceSection.tsx
│   │   ├── CategoryGrid.tsx
│   │   ├── PickedOffTheBench.tsx
│   │   ├── TestimonialsBar.tsx
│   │   └── ParallaxLayer.tsx
│   ├── heritage/
│   │   ├── HeritageHero.tsx
│   │   ├── WorkshopSection.tsx
│   │   └── Timeline.tsx
│   ├── shared/
│   │   ├── Button.tsx
│   │   ├── Eyebrow.tsx
│   │   ├── PlateImage.tsx
│   │   ├── BenchNotesCTA.tsx
│   │   ├── Footer.tsx
│   │   ├── SearchOverlay.tsx
│   │   └── Breadcrumb.tsx
│   └── checkout/
│       ├── CheckoutSteps.tsx
│       ├── ContactShippingForm.tsx
│       ├── PaymentForm.tsx
│       └── OrderSummary.tsx
├── lib/
│   ├── mockData.ts                 # All product/catalog mock data
│   ├── types.ts                    # TypeScript interfaces
│   └── utils.ts                   # Formatters, slugify, etc.
├── hooks/
│   ├── useCrate.ts                 # Crate state (Zustand or Context)
│   ├── useParallax.ts
│   └── useSearchOverlay.ts
├── store/
│   └── crateStore.ts               # Zustand store for crate
├── styles/
│   └── globals.css                 # CSS custom properties, base reset
└── public/
    └── fonts/                      # Self-hosted Playfair Display, Inter, JetBrains Mono
```

---

## Phase 0 — Project Bootstrap & Design System

### Objective
Initialize the Next.js project, install all dependencies, configure Tailwind with the brand's custom tokens, set up global fonts, and establish the full CSS design system as custom properties. This is the foundation every subsequent phase builds on.

### 0.1 — Initialize Project

```bash
npx create-next-app@latest acme-lamp-sign \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
cd acme-lamp-sign
```

### 0.2 — Install Dependencies

```bash
npm install \
  zustand \
  react-icons \
  @next/font \
  clsx \
  tailwind-merge \
  framer-motion \
  react-intersection-observer \
  next-themes
```

> **Note for Claude Code:** `framer-motion` is used for parallax transforms, drawer slide animations, search overlay fade, and card lift effects — not decorative animation. Every motion must serve a purpose.

### 0.3 — Tailwind Config (`tailwind.config.ts`)

Extend Tailwind with the brand's full design token set:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: '#FAF5EC',
          2: '#F2EBDB',
          3: '#E8DEC5',
        },
        ink: {
          charcoal: '#1E2022',
          iron: '#2D2F31',
          soft: '#4A4D50',
          rule: 'rgba(45, 47, 49, 0.18)',
        },
        brass: {
          DEFAULT: '#C29B47',
          deep: '#9C7A2E',
        },
        green: {
          brand: '#2E4A3F',
          deep: '#233830',
        },
        canvas: {
          body: '#E8E2D3',
          muted: '#B7B0A0',
          dim: '#82796A',
          heading: '#F5EFE0',
        },
        error: '#8C2A1C',
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Cormorant Garamond"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        btn: '2px',
        pill: '100px',
      },
      boxShadow: {
        'cta-hover': '0 8px 24px -10px rgba(46, 74, 63, 0.5)',
        'card-hover': '0 18px 40px -22px rgba(30,32,34,0.4)',
        'search-overlay': '0 30px 60px -30px rgba(30,32,34,0.35)',
        'focus-brass': '0 0 0 3px rgba(194,155,71,0.18)',
      },
      maxWidth: {
        container: '1280px',
        wide: '1440px',
      },
      letterSpacing: {
        eyebrow: '0.22em',
        'eyebrow-wide': '0.3em',
      },
    },
  },
  plugins: [],
}
export default config
```

### 0.4 — Global CSS (`styles/globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --parchment:   #FAF5EC;
  --parchment-2: #F2EBDB;
  --parchment-3: #E8DEC5;
  --charcoal:    #1E2022;
  --iron:        #2D2F31;
  --iron-soft:   #4A4D50;
  --brass:       #C29B47;
  --brass-deep:  #9C7A2E;
  --green:       #2E4A3F;
  --green-deep:  #233830;
  --ink-rule:    rgba(45, 47, 49, 0.18);

  --serif: "Playfair Display", "Cormorant Garamond", Georgia, serif;
  --sans:  "Inter", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
  --mono:  "JetBrains Mono", "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace;
}

@layer base {
  html { scroll-behavior: smooth; }
  body {
    background-color: var(--parchment);
    color: var(--iron);
    font-family: var(--sans);
    font-size: 17px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* Plate image placeholder pattern */
  .plate {
    background-color: var(--parchment-2);
    background-image: repeating-linear-gradient(
      45deg,
      rgba(45,47,49,0.04) 0px,
      rgba(45,47,49,0.04) 1px,
      transparent 1px,
      transparent 8px
    );
    position: relative;
    overflow: hidden;
  }
  .plate--dark {
    background-color: #2A2C2E;
    background-image: repeating-linear-gradient(
      45deg,
      rgba(194,155,71,0.06) 0px,
      rgba(194,155,71,0.06) 1px,
      transparent 1px,
      transparent 8px
    );
  }
}

@layer utilities {
  .eyebrow {
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }
  .canvas-dark {
    background-color: var(--charcoal);
    color: #E8E2D3;
  }
  .canvas-dark h1,
  .canvas-dark h2,
  .canvas-dark h3 {
    color: #F5EFE0;
  }
  .canvas-dark .eyebrow { color: var(--brass); }
}
```

### 0.5 — TypeScript Types (`lib/types.ts`)

```typescript
export interface Product {
  id: string
  slug: string
  sku: string           // e.g. "OL-1873-CB"
  patent: string        // e.g. "1873 PAT."
  name: string
  shortDescription: string
  fullDescription: string
  price: number
  category: 'lighting' | 'glass-chimneys' | 'hardware' | 'signs'
  burnerSize: 'No. 1' | 'No. 2' | 'No. 3' | 'Universal' | null
  material: string
  finish: string[]
  fits: string
  benchTesterName: string
  benchTestDate: string
  workshop: string
  edition: string
  netWeight: string
  images: string[]      // paths under /public/products/
  inStock: boolean
  featured: boolean
  collection: string
}

export interface CrateItem {
  product: Product
  quantity: number
  selectedFinish: string
  selectedBurnerSize: string
}

export interface FilterState {
  category: string
  burnerSize: string
  material: string
  sortBy: 'curator' | 'price-asc' | 'price-desc' | 'newest'
}
```

### 0.6 — Mock Data (`lib/mockData.ts`)

Seed 50 products covering all 4 categories. Each product must have all fields in the `Product` type populated. Naming should feel authentic to the era — e.g. "Cattaraugus Brass Center-Draft Lamp", "Pittsburgh Railroad Caboose Lamp", "Aladdin Mantle Library Lamp", "Milk-White Cased Shade, 10-inch", "Clear Beaded Chimney, 7-inch", "Cranberry Cut-Crystal Shade", "No. 2 Cold-Filled Lantern", "Dietz No. 2 Cold-Filled Lantern", "Coleman Lantern Co. Porcelain Sign", "Railway Crossing Reflector Sign", etc. Distribute across categories: ~15 lighting, ~12 glass/chimneys, ~10 hardware, ~13 signs.

### 0.7 — Zustand Crate Store (`store/crateStore.ts`)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CrateItem, Product } from '@/lib/types'

interface CrateStore {
  items: CrateItem[]
  isOpen: boolean
  openCrate: () => void
  closeCrate: () => void
  addItem: (product: Product, finish: string, burnerSize: string) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCrate: () => void
  total: () => number
  itemCount: () => number
}

export const useCrateStore = create<CrateStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCrate: () => set({ isOpen: true }),
      closeCrate: () => set({ isOpen: false }),
      addItem: (product, finish, burnerSize) => {
        const existing = get().items.find(i => i.product.id === product.id)
        if (existing) {
          set({ items: get().items.map(i =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )})
        } else {
          set({ items: [...get().items, { product, quantity: 1, selectedFinish: finish, selectedBurnerSize: burnerSize }] })
        }
        set({ isOpen: true })
      },
      removeItem: (productId) =>
        set({ items: get().items.filter(i => i.product.id !== productId) }),
      updateQuantity: (productId, quantity) =>
        set({ items: get().items.map(i =>
          i.product.id === productId ? { ...i, quantity } : i
        )}),
      clearCrate: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'acme-crate' }
  )
)
```

### 0.8 — Utility Functions (`lib/utils.ts`)

```typescript
export const slugify = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)

export const cn = (...classes: (string | undefined | false)[]) =>
  classes.filter(Boolean).join(' ')
```

---

### PHASE 0 STOP ✋

> **Claude Code must:**
> 1. Complete ALL steps in Phase 0 above.
> 2. Verify the dev server starts (`npm run dev`) with no errors.
> 3. Confirm Tailwind custom colors resolve (check in browser DevTools).
> 4. Output a report:
>    - Files created (list every file)
>    - Dependencies installed (with versions)
>    - Any deviations from spec and why
>    - Dev server status
> 5. Ask: **"Continue with the next phase?"** — do not proceed until the user replies "Yes, Proceed."

---

## Phase 1 — Shared Components & Root Layout

### Objective
Build every reusable component that appears across all pages: Nav, Footer, Eyebrow, Button, Plate image placeholder, Crate drawer, Search overlay, and Breadcrumb. The Root Layout wires them all together.

### 1.1 — Root Layout (`app/layout.tsx`)

- Load fonts via `next/font/google`: Playfair Display (weights 400, 500), Inter (weights 400, 500, 600), JetBrains Mono (weights 400, 500). Apply as CSS variables on `<html>`.
- Mount `<Nav />`, `<CrateDrawer />`, `<SearchOverlay />` as persistent shell components.
- Pass font CSS variables into `:root` so Tailwind's `font-serif`, `font-sans`, `font-mono` utilities resolve to them.
- Apply `bg-parchment text-ink-iron min-h-screen`.

### 1.2 — Nav Component (`components/nav/Nav.tsx`)

Visual reference: Screenshot `HomePage.png` and `CatalogCompact.png` top bar.

**Behavior:**
- Sticky. Translucent parchment (92% opacity) + `backdrop-blur-sm` (8px).
- 3-column CSS Grid: `[brand] [nav-links] [actions]`
- Brand mark: `Acme Lamp&Sign` in Playfair Display 24px/500 weight. `&` rendered as `<em>` in italic. Sub-mark below: `EST. FOR THE LONG BURN` in JetBrains Mono 10px/400 uppercase, 0.3em tracking.
- Nav links (desktop): Storefront · The Catalog · Our Story · Heritage · Contact — Inter 15px/500. Active link gets `text-brass-deep` + 2px underline in `--brass`.
- Actions (right): Search icon button (48×48px circle, `bg-parchment-2` on hover) + Account icon button (same) + Crate icon button with count badge (`bg-green-brand text-white` pill).
- On mobile (≤1024px): hamburger replaces inline links. Slide-in `MobileDrawer` from left, `shadow-[30px_0_60px_-30px_rgba(30,32,34,0.4)]`.
- Use `react-icons/bi` for BiSearch, BiUser, BiPackage (crate icon). Size 22px.

### 1.3 — Shared Button (`components/shared/Button.tsx`)

```typescript
// Props: variant ('primary' | 'ghost' | 'brass'), size ('default' | 'block' | 'small'), children, onClick, href, type
```

- `primary`: `bg-green-brand text-[#F5F1E6]` hover `bg-green-deep shadow-cta-hover -translate-y-px`
- `ghost`: transparent, 1px `border-ink-iron`, hover `bg-ink-iron text-parchment`
- `brass`: transparent, 1px `border-brass-deep text-brass-deep`, hover `bg-brass text-ink-iron`
- All buttons: `min-h-[52px] px-[26px] rounded-btn font-sans text-[16px] font-semibold tracking-[0.02em] transition-all duration-200`
- Block size: `w-full min-h-[60px] text-[17px]`
- Small size: `min-h-[44px] text-[14px]`
- If `href` is provided, render as `<Link>`. Otherwise `<button>`.

### 1.4 — Eyebrow Component (`components/shared/Eyebrow.tsx`)

```typescript
// Props: children, light? (boolean — for dark canvas sections), className?
```

- Always: JetBrains Mono, 12px, 500 weight, uppercase, 0.22em tracking
- Light (default): `text-brass-deep`
- Dark canvas: `text-brass`

### 1.5 — Plate Image (`components/shared/PlateImage.tsx`)

The parchment/diagonal-hatching placeholder rendered whenever a product image is absent or loading.

```typescript
// Props: src?, alt, aspectRatio ('4/5' | '5/4' | '3/5' | '1/1'), dark?, label?, className?
```

- If `src` provided: render `<Image>` from `next/image` with `object-cover`
- If no `src`: render the `.plate` or `.plate--dark` div
- `label` (optional): renders a mono-caps caption chip pinned bottom-left: translucent `bg-parchment/80` with 8px padding, 10px mono uppercase — e.g. "OL-1873-CB · OILED BRASS"
- Aspect ratios via `aspect-[4/5]`, `aspect-[5/4]`, `aspect-[3/5]`

### 1.6 — Crate Drawer (`components/crate/CrateDrawer.tsx`)

Visual reference: `Crate.png` and `Crate1.png` screenshots.

**Behavior:**
- Fixed-position panel sliding in from the right. Width: 360px desktop, full-width mobile.
- `framer-motion` `AnimatePresence` + `motion.div` with `x: '100%'` → `x: 0` on open, `duration: 0.32s`.
- Dark scrim overlay behind it (`bg-ink-charcoal/40`) fades in simultaneously.
- Header: "Your crate" (Playfair Display 22px) + item count in JetBrains Mono eyebrow + ✕ close button.
- Empty state: Ø icon (react-icons `BiX` or custom SVG ring-slash), italic serif message "Your crate is empty. Come back with something worth lighting tonight." + ghost Button "Continue browsing".
- Item list: `CrateItem` component per item — thumbnail `PlateImage` (60×72px, 4:5 ratio) + SKU eyebrow + product name in serif 14px/500 + price in `text-brass-deep` + `−` qty `+` controls + "REMOVE" mono link.
- Footer (sticky bottom): subtotal row, "Freight (straw-packed crate): Free", Total in Playfair Display 22px `text-brass-deep`, "✓ QUALIFIES FOR FREE FREIGHT" in 10px mono, "Proceed to checkout →" primary block button, "View full crate →" ghost button, "+ CONTINUE BROWSING THE CATALOG" in 11px mono link.

### 1.7 — Search Overlay (`components/shared/SearchOverlay.tsx`)

Visual reference: `SearchOverlay.png`.

**Behavior:**
- Full-viewport overlay, `bg-parchment/96 backdrop-blur-md`.
- `framer-motion` fade in `opacity: 0 → 1` over 0.25s. Closes on Escape key.
- Top bar: search input with Playfair Display 22px placeholder "Search the catalog — burner number, pattern, SKU…" + ✕ close.
- Below input: category filter pills — Lighting Fixtures · Glass & Chimneys · Burners & Wicks · Reproduction Signs — in dark-pill style (`bg-ink-iron text-canvas-heading`).
- "JUST IN A COLLECTION" eyebrow header + horizontally scrollable featured product row.
- Live results list (filtered from mock data as user types): each result shows product name + SKU + price, mono metadata.
- No results state: italic serif "Nothing in the catalog matches that yet."
- Implement with `useSearchOverlay` hook managing open state and query string.

### 1.8 — Footer (`components/shared/Footer.tsx`)

Visual reference: Bottom of every page screenshot.

**Structure:**
- Top strip: "A LETTER, NOT A MARKETING LIST" eyebrow (brass) + "Bench notes, once a month." Playfair Display serif heading + body copy "One letter each season, plus a head-start on the next crate of fifty. Real writing from the workshop. No promo codes shouted in all caps." + email input + "Subscribe →" brass button.
- Dark canvas section (`.canvas-dark`): 4-column grid desktop.
  - Col 1: Logo + brand description copy + "ADELAIDE HOUSE" eyebrow + address block (brass phone number link).
  - Col 2: "CATALOG" eyebrow + links: Lighting Fixtures, Glass & Chimneys, Burners & Wicks, Advertising Signs, The Full Catalog →
  - Col 3: "THE WORKSHOP" eyebrow + links: Our Story, Heritage Timeline, Bench Notes (Journal), Lamp-Lighting Guide, Restoration Services
  - Col 4: "SERVICE" eyebrow + links: Track your order, Contact a person, Shipping & Freight, 30-Day Returns, FAQ
- Bottom micro-bar: `© 1873–2026 · ACME LAMP & SIGN CO. · ALL MARKS HONORED.` left, `CRATE NO. 014 · SPRING RELEASE` right — both in JetBrains Mono 11px `text-canvas-dim`.

### 1.9 — Breadcrumb (`components/shared/Breadcrumb.tsx`)

```typescript
// Props: crumbs: Array<{ label: string, href?: string }>
```

- JetBrains Mono 10px/400 uppercase, 0.22em tracking, `text-iron-soft`
- Separator: ` / ` in same style
- Last crumb (current page): `text-iron` (slightly darker)

---

### PHASE 1 STOP ✋

> **Claude Code must:**
> 1. Complete ALL 9 sub-steps above.
> 2. Render each component in isolation and confirm no TypeScript errors.
> 3. Verify Nav is sticky, crate drawer slides correctly, search overlay opens/closes on Escape.
> 4. Output a report:
>    - Every component file created
>    - Font loading confirmation (check in browser)
>    - Crate store persistence working (add item, refresh, item persists)
>    - Any visual deviations from the screenshots and the reason
> 5. Ask: **"Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase 2 — Storefront (Home Page)

### Objective
Build the full home page (`app/page.tsx`) with all sections, parallax scrolling, and live interactivity. This is the primary brand statement page.

Visual reference: `HomePage.png` and `SearchOverlay.png` (storefront visible behind).

### 2.1 — Hero Section (`components/home/HeroSection.tsx`)

**Layout:** Two-column split. Left: editorial text block. Right: dark-canvas image plate with overlay caption.

**Left column content:**
- Small eyebrow: "No. 01 · SPRING · FIFTY/FIFTY"
- Headline (Playfair Display, clamp 48–96px, weight 500, line-height 0.96): "Authentic light from a *forgotten* era." — the word *forgotten* rendered in `italic text-brass-deep`.
- Body: "Fifty crates of precision-reproduced antique oil lamp parts, hand-blown chimneys, and porcelain advertising signs — sourced from a 4-cycle vulcan workshop, distributed out of Adelaide, and offered here for the first time." (Inter 19px max-width 56ch)
- Two CTAs: "Enter the Catalog" primary green button + "Read the Story" ghost button
- Stats row below CTAs: `50 IN SUITS` · `101 (98+1/1)` · `Pune → Adelaide` in JetBrains Mono 10px with thin dividers between them.

**Right column:**
- Large dark `PlateImage` (aspect 5/4 or 4/5)
- Caption chip bottom-left: "ARCHIVE PHOTO · ORIGINAL 1898 DIE SET, PUNE PRESS SHOP"

**Parallax behavior:** On scroll, the right image plate translates at 40% the scroll speed (slower = deeper). Use `useParallax` hook with `framer-motion`'s `useScroll` + `useTransform`.

### 2.2 — Provenance Marquee Strip

- Full-width dark canvas bar between Hero and next section.
- Horizontally scrolling text marquee (CSS `@keyframes scroll-x` infinite): "CATTARAUGUS PATENT 1873 · TESTED FOR THE NIGHT BURN · BENCH-NUMBERED · HAND-FINISHED · PUNE WORKSHOP · PRESSED ON ORIGINAL DIES · PLAIN PAPER INVOICE ·" repeating.
- JetBrains Mono 11px uppercase, brass text on charcoal.
- No JS library — pure CSS animation.

### 2.3 — Workshop Provenance Section (`components/home/ProvenanceSection.tsx`)

Visual reference: "Spun in Pune…" dark section on `HomePage.png`.

**Layout:** Dark canvas (`.canvas-dark`). Left: two dark `PlateImage` plates stacked/offset with mono captions. Right: editorial text.

**Right column:**
- Eyebrow: "A CATALOG 125 YEARS IN THE MAKING"
- Headline: "Spun in Pune. Shipped from Adelaide. Wired for a longer century."
- Two-paragraph body copy (Inter 17px, `text-canvas-body`)
- Three numbered proof-points in a row below:
  - `01.` **Pressed on original dies** — "Eight of our nine brass parts come off tooling first cut between 1901 and 1908."
  - `02.` **Tested for the night burn** — "Every lamp runs an 8-hour bench test on No. 2 wick before it earns its tag."
  - `03.` **Plain paper invoice** — "A real receipt, a real return address, and a real person at the other end of the phone."

### 2.4 — Category Grid (`components/home/CategoryGrid.tsx`)

Visual reference: "A small catalog, chosen with care." section on `HomePage.png`.

**Layout:** Asymmetric 2×2 bento grid. Categories:
1. **Complete Lighting Fixtures** — large plate (5:4), serif category name, short body, "Browse the collection →" brass link
2. **Replacement Glass Shades & Chimneys** — tall plate (3:5)
3. **Burners, Wicks & Operational Hardware** — medium plate (4:5)
4. **Vintage Reproduction Advertising Signs** — wide plate (5:4)

Each category card: hover lifts `-3px` with `shadow-card-hover`, brass underline animates in on hover.

**Parallax:** The grid itself scrolls slightly slower than the page (parallax layer at 20% offset).

### 2.5 — Picked Off The Bench (`components/home/PickedOffTheBench.tsx`)

Visual reference: "Picked off the bench this week." section on `HomePage.png`.

**Layout:** Section header "Picked off the bench this week." left-aligned serif heading + "See all 50 →" brass link right-aligned. Below: horizontal 3-column product card row (featured products from mock data).

**Product Card (`components/catalog/ProductCard.tsx`):**
- `PlateImage` (aspect 4:5) with hover zoom effect
- SKU eyebrow (`text-brass-deep`, 10px mono)
- Product name (Playfair Display 22px/500, `text-ink-iron`)
- Meta row: price in `text-brass-deep` (Playfair 22px) · category tag in mono 10px
- Short description line (Inter 13px `text-iron-soft`, max 2 lines, truncated)
- "View details →" brass link appears on hover

### 2.6 — Testimonials / Proof Bar

3-column testimonials (mock data). Dark canvas strip.
Each: large open-quote `"` in brass (Playfair 48px), quote body (italic serif 17px `text-canvas-body`), attribution in mono 11px uppercase `text-canvas-dim`.

Example quotes:
- "The Cattaraugus reproduction holds an extra flame just laser-shrieve — the bench test others won't run."
- "Acme Lamp & Sign's chimneys are the only ones we still recommend without an asterisk."
- "The kind of shop that ships a hand-written invoice and means it."

### 2.7 — Bench Notes CTA (`components/shared/BenchNotesCTA.tsx`)

Reusable section (appears on multiple pages). Parchment background.
- Eyebrow: "A LETTER, NOT A MARKETING LIST"
- Heading: "Bench notes, once a month."
- Body: the standard subscription copy
- Email input + "Subscribe →" brass button side by side

### 2.8 — Parallax Hook (`hooks/useParallax.ts`)

```typescript
import { useScroll, useTransform, MotionValue } from 'framer-motion'
import { useRef } from 'react'

export function useParallax(offset: number = 0.3) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [`-${offset * 100}px`, `${offset * 100}px`])
  return { ref, y }
}
```

Apply to: hero right plate, category grid, heritage page image blocks.

---

### PHASE 2 STOP ✋

> **Claude Code must:**
> 1. Build all 8 home page sections.
> 2. Verify parallax behavior in browser (scroll and observe plate motion).
> 3. Verify marquee scrolls continuously without gaps.
> 4. Verify "Enter the Catalog" CTA routes to `/catalog`.
> 5. Output a report:
>    - All section components created
>    - Parallax frames-per-second (should be smooth, no jank)
>    - Any layout deviations from `HomePage.png`
>    - Mobile responsiveness check (≤640px breakpoint)
> 6. Ask: **"Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase 3 — Catalog Page with Advanced Filtering

### Objective
Build the full catalog page with multi-axis filtering, a sidebar filter panel, category pill tabs, product grid in masonry-style offset layout, and responsive behavior.

Visual reference: `CatalogCompacted.png`, `CatalogUncompact.png`, `Crate.png` (catalog visible behind drawer).

### 3.1 — Catalog Header (`components/catalog/CatalogHeader.tsx`)

- Breadcrumb: `STOREFRONT / CATALOG`
- Eyebrow: "SPRING RELEASE · 50 PIECES" in brass
- Headline: "The Full Catalog." — Playfair Display clamp(36px, 4vw, 60px)
- Right column descriptor: "Filter by burner size, material, or collection. Every piece has been hand-numbered, bench-tested, and packed in straw — there is no second batch." (Inter 17px, `text-iron-soft`, max-width 44ch)

### 3.2 — Category Filter Pills

Pill tabs: `All Pieces` · `Lighting` · `Glass & Chimneys` · `Hardware` · `Signs`

- Active pill: dark oval (`bg-ink-iron text-parchment`) with `rounded-pill`
- Inactive pill: `border border-ink-rule text-iron-soft` with `rounded-pill`, hover `border-ink-iron`
- Clicking a pill updates filter state and re-renders grid (client-side filtering, no navigation)

### 3.3 — Filter Bar + Sidebar (`components/catalog/FilterBar.tsx`)

**Desktop inline filter bar (below pills):**
Three dropdowns: BURNER (Any size · No. 1 · No. 2 · No. 3 · Universal) · MATERIAL (Any material · Brass · Nickel · Glass · Porcelain · Iron) · SORT BY (Curator's order · Price: low to high · Price: high to low · Newest first)

Custom-styled selects: parchment-2 fill, ink-rule border, 2px radius, custom CSS chevron in right gutter, brass focus ring.

**Right-side count display:** "51 PIECES" in JetBrains Mono 11px uppercase, brass — updates reactively as filters apply.

**"Refine the catalog" sidebar panel (right drawer style in compacted view):**
- Opens on "Refine" button click.
- Slide-in from right (same framer-motion pattern as crate drawer).
- Filter groups with accordion expand/collapse:
  - PIECE TYPE — checkboxes
  - FITS / SIZE — checkboxes
  - IN STOCK — toggle
  - MATERIAL — checkboxes
  - Curator's order — radio

**"Show N pieces" sticky button at bottom of sidebar** — dark green primary, updates live count as checkboxes change.

### 3.4 — Product Grid (`components/catalog/ProductGrid.tsx`)

- CSS Grid, 3-column desktop / 2-column tablet / 1-column mobile.
- **Offset/masonry aesthetic:** Every 3rd item is a "large" card (double height or wider) for visual rhythm. Alternate plate orientations: 4:5 normal, 5:4 squat, 3:5 tall.
- Items are filtered and sorted from `mockData` client-side using `useMemo`.
- Animate grid reorder with `framer-motion` layout animations (`layout="position"` on each card).
- Empty state when no filters match: large italic serif center-aligned "Nothing in the catalog matches those filters. Try broadening your search."

### 3.5 — Filter State Management

```typescript
// In catalog/page.tsx (client component)
const [filters, setFilters] = useState<FilterState>({
  category: 'all',
  burnerSize: '',
  material: '',
  sortBy: 'curator',
})

const filteredProducts = useMemo(() => {
  let items = mockProducts
  if (filters.category !== 'all') items = items.filter(p => p.category === filters.category)
  if (filters.burnerSize) items = items.filter(p => p.burnerSize === filters.burnerSize)
  if (filters.material) items = items.filter(p => p.material.toLowerCase().includes(filters.material.toLowerCase()))
  if (filters.sortBy === 'price-asc') items = [...items].sort((a, b) => a.price - b.price)
  if (filters.sortBy === 'price-desc') items = [...items].sort((a, b) => b.price - a.price)
  return items
}, [filters])
```

---

### PHASE 3 STOP ✋

> **Claude Code must:**
> 1. Build all catalog components.
> 2. Test every filter: category pills, all three dropdowns, sidebar panel.
> 3. Verify grid re-renders correctly (no stale state) when filters change.
> 4. Verify "Refine the catalog" drawer opens/closes correctly.
> 5. Output a report:
>    - Components built
>    - Filter combinations tested (list 5 tested combinations)
>    - Product count per category
>    - Any performance concerns (large grid re-renders)
> 6. Ask: **"Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase 4 — Product Detail Page

### Objective
Build the full product detail page with image gallery, fitment box, spec table, variant selectors, add-to-crate, and "More from this collection" row.

Visual reference: `ProductDetails.png`, `Crate1.png` (product detail visible behind open crate drawer).

### 4.1 — Product Gallery (`components/product/ProductGallery.tsx`)

- Main image: large `PlateImage` (aspect 4:5 or 5:4 depending on product type) with "HOVER OR TAP TO ZOOM" mono caption in top-right corner.
- Thumbnail strip below: 4 small `PlateImage` thumbnails (numbered 01–04). Active thumb gets brass border. Click switches main image.
- "GLIDE PLATE · KEROSENE LAMP · 2626" mono caption pinned bottom-left of main image.

### 4.2 — Product Info Panel (`components/product/ProductInfo.tsx`)

**Layout:** Right column alongside gallery.

**Top:**
- SKU badge: dark iron pill (`bg-ink-iron text-canvas-heading`) + patent year pill (lighter, outline)
- Product name: Playfair Display clamp(28px, 3vw, 48px) weight 500
- Short description: Inter 17px, `text-iron-soft`

**Price row:**
- `$248.00` — Playfair Display 28px, `text-brass-deep`. `USD · FREE FREIGHT OVER $150` in 11px mono `text-iron-soft` appended.

**Fitment Box (`components/product/FitmentBox.tsx`):**
- Parchment-2 bordered box with checkmark icon (react-icons `BiCheck`).
- "Fitment & compatibility" heading in serif 16px.
- Rows: `BURNER SIZE:` · `MATERIAL:` · `FITS:` · `TESTED:` — each label in 11px mono uppercase `text-iron-soft`, value in 13px sans `text-ink-iron`.

**Variant Selectors:**
- BURNER SIZE dropdown (same custom select style as FilterBar)
- FINISH dropdown
- Both update state and are passed to `addItem` in crate store.

**Quantity + Add to Crate:**
- `−` / qty number / `+` stepper (44px tall, ink-rule bordered, 2px radius)
- "Add to cart — $248.00" primary green block button (full width, shows live total based on qty)

**Trust signals row (below button):**
- 3 rows: `↺ 30-day return` / `# Hand-numbered` / `✉ Real receipt`
- Each: small react-icon + 12px sans description. Colors `text-iron-soft`.

### 4.3 — Notes From The Bench

Below gallery (full-width):
- "NOTES FROM THE BENCH" eyebrow
- Body copy paragraph (product's `fullDescription`)

### 4.4 — Spec Table (`components/product/SpecTable.tsx`)

Visual reference: "The numbered details." section on `ProductDetails.png`.

- Section eyebrow: "FULL SPECIFICATION"
- Heading: "The numbered details."
- 2-column table grid: left column = label (11px mono uppercase `text-iron-soft`), right column = value (13px sans `text-ink-iron`).
- Fields: Catalog Number · Burner Size · Payment · Workshop · Bench Tester's Name · Pattern of Origin · Primary Material · Net Weight · Distribution · Edition
- Hairline dividers (`border-b border-ink-rule`) between rows.

### 4.5 — Related Products (`components/product/RelatedProducts.tsx`)

- Eyebrow: "FROM THE SAME ROOM"
- Heading: "More from this collection."
- "See all in [Category] →" brass link right-aligned.
- 3-column grid of `ProductCard` components (same category, filtered from mock data, excluding current product).

---

### PHASE 4 STOP ✋

> **Claude Code must:**
> 1. Build all product detail components.
> 2. Test: thumbnail click switches main image; variant selectors update add-to-crate button total; clicking "Add to crate" opens crate drawer with item.
> 3. Verify fitment box data populates from mock product.
> 4. Output a report:
>    - Components built
>    - Add-to-crate flow tested end-to-end (describe flow)
>    - Responsive layout check (mobile: gallery stacks above info panel)
> 5. Ask: **"Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase 5 — Our Story & Heritage Pages

### Objective
Build the two editorial/narrative pages: Our Story (brand values and philosophy) and Heritage (workshop history + timeline).

### 5.1 — Our Story Page (`app/our-story/page.tsx`)

Visual reference: `OurStory.png`.

**Hero:**
- Left: Eyebrow "OUR STORY" + Headline "A family that *refused to* turn off the light." — "refused to" rendered italic brass. Body: "Most companies that made kerosene lamps shut their doors a hundred years ago. We never did. This is the story of why."
- Right: Dark `PlateImage` (aspect 4:5) + date badge chip "EST. 1898 / PUNE · ADELAIDE" pinned bottom.

**Mission Statement (full-width centered):**
- Eyebrow: "OUR MISSION, IN PLAIN WORDS"
- Large centered serif quote (Playfair 28–36px): "We make lamps the way they were made when lamps mattered — by hand, on the same dies, with no pretense that we've improved on the originals."
- Two-column body copy below.

**Three Pillars:**
- Eyebrow: "THREE THINGS WE BELIEVE"
- Heading: "What we'll do for you, and what we won't."
- 3-column grid with brass numbered labels:
  - `01.` **Craft over convenience.** — "Every burner is hand-fitted. Every shade is mouth-blown. Every sign is triple-fired. If a piece fails the 8-hour bench test, it never leaves the bench. We don't ship near-misses."
  - `02.` **Provenance over inventory.** — "We make 50 pieces a season, then we stop, then we make 50 more. There is no warehouse of yellowing surplus, no algorithmic restock. When this crate is empty, it's empty."
  - `03.` **Honesty over marketing.** — "Our invoices are plain paper. Our phone rings to a person. Our returns policy fits in one sentence: if it arrives less than whole, send it back, on us, for thirty days."

**Full-width Dark Testimonial:**
- Canvas dark section. Large brass open-quote glyph.
- Italic serif quote (Playfair 22px): "My grandfather bought the press shop for a hundred and forty rupees and a promise. The promise was that we would still be running the same dies in a hundred years. We are. The next hundred is paid for."
- Attribution: "R.K. PATEL / THIRD-GENERATION PRESS OPERATOR · PUNE WORKSHOP" in mono 11px.

**Read On row:** Heading "More of the workshop." + "The full heritage timeline →" primary button + "Walk the catalog" ghost button.

### 5.2 — Heritage Page (`app/heritage/page.tsx`)

Visual reference: `Heritage.png`.

**Hero (dark canvas):**
- Eyebrow: "A NOTE FROM THE BENCH"
- Large serif heading (clamp 36–72px): "A workshop that has not changed its method in 125 years."
- Body + dark `PlateImage` right side.

**Workshop Section (dark canvas continued):**
- Eyebrow: "A CATALOG 125 YEARS IN THE MAKING"
- Heading: "Spun in Pune. Shipped from Adelaide. Wired for a longer century."
- Two `PlateImage` plates left (stacked, offset), editorial copy right with caption "WORKSHOP INTERIOR · PUNE BRASS FURNACES AT THE LATHE, 1940'S OFFICE FURNACE BEFORE".
- Same 3-point proof row as Storefront.

**Timeline Section (light parchment):**
- Eyebrow: "A WORKING TIMELINE"
- Heading: "One hundred and fifty years, one method."
- Vertical timeline component:
  - Year in large Playfair Display brass (32px): `1873`
  - Small circle dot (ink-rule outlined, 8px)
  - Event title: serif 18px `text-ink-iron`
  - Event description: Inter 14px `text-iron-soft`
  - Timeline entries:
    - **1873** — Cattaraugus patent / "Bradley & Hubbard file the center-draft burner patent that anchors our entire fixtures collection."
    - **1881** — Pittsburgh railroad order / "First gimbal-mounted caboose lamps roll out of the Pune works for the Indian railway."
    - **1898** — British Indian Lamp Co. closes / "The dies stay. The Patel family buys the press shop for ₹140 and a promise."
    - **1934** — Porcelain signage line / "A third firing process is developed for the advertising-sign trade."
    - **2003** — Adelaide distribution opens / "The first containers cross the Indian Ocean, ending up on Pirie Street."
    - **2026** — Spring liquidation / "Fifty surplus pieces. This is the website you are reading. No catalog will repeat exactly."

**CTA Section (parchment):**
- Eyebrow: "BEGIN WHERE THE LIGHT IS"
- Heading: "Walk the catalog. Light the parlor."
- "Enter the Catalog" primary button + "Back to storefront" ghost button.

---

### PHASE 5 STOP ✋

> **Claude Code must:**
> 1. Build both editorial pages.
> 2. Verify parallax on heritage hero image.
> 3. Verify timeline renders correctly at mobile sizes.
> 4. Output a report:
>    - Pages and components built
>    - Font rendering check on large display headings
>    - Any editorial copy adjustments made
> 5. Ask: **"Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase 6 — Contact Page

### Objective
Build the Contact page with a contact form, dual workshop address cards, and order tracking widget.

Visual reference: `Contact.png`.

### 6.1 — Contact Hero

- Breadcrumb: `STOREFRONT / CONTACT`
- Eyebrow: "CONTACT"
- Large serif heading (3 lines):
  - Line 1: "A real phone."
  - Line 2: "A real person."
  - Line 3: "*A real answer.*" — italic in `text-brass-deep`
- Right column body: "We don't do support tickets. We do conversations. If your chimney cracked, your burner won't draw, or you can't tell a No. 1 from a No. 2 — call us, write us, or come down to Pirie Street."

### 6.2 — Contact Form Panel

- Panel in `bg-parchment-2 border border-ink-rule` with 2px radius. Heading: "Send us a note."
- Eyebrow: "WRITE TO THE WORKSHOP"
- Form fields (all styled per Design Tokens):
  - YOUR NAME (text)
  - EMAIL (email)
  - WHAT'S THIS ABOUT? (select: General question · Part compatibility · Order issue · Wholesale inquiry · Other)
  - YOUR MESSAGE (textarea, placeholder "Tell us what you're trying to light — or what's gone dark.")
  - "Send the note →" primary green block button
  - Fine print below: "WE ANSWER EVERY MESSAGE OURSELVES. NO MARKETING LIST. NO RESALE. NO AUTOREPLIES." in 10px mono `text-iron-soft`.
- Client-side validation: show error state (red border + error message) if required fields empty on submit.

### 6.3 — Workshop Address Cards

Two cards with parchment-2 fill, ink-rule border:
**Card 01 — Adelaide House · Distribution:**
- Eyebrow: "ADELAIDE HOUSE · DISTRIBUTION" + brass "01"
- Address: 14 Pirie Street, Crate Row 14 / Adelaide, SA 5000 — Australia
- PHONE: `+61 8 7000 1873` (brass link)
- EMAIL: `hello@acmeandlamp.co`
- HOURS: Mon–Fri · 9:00–17:00 ACST

**Card 02 — Pune Workshop · Press Shop 4:**
- Eyebrow: "PUNE WORKSHOP · PRESS SHOP 4" + brass "02"
- Address + PHONE + EMAIL + HOURS

**Dark tracking card:**
- Dark canvas (charcoal background)
- "Already placed an order?" bold sans
- "Use the tracking page to skip the queue." `text-canvas-muted`
- Text input + arrow button for tracking number

---

### PHASE 6 STOP ✋

> **Claude Code must:**
> 1. Build the contact page.
> 2. Test form validation (try submitting empty form — errors must appear).
> 3. Verify all three sub-sections display correctly.
> 4. Output a report:
>    - Components built
>    - Validation behavior described
>    - Responsive layout check
> 5. Ask: **"Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase 7 — Checkout Flow

### Objective
Build the 3-step checkout: Crate review → Details & Payment → Confirmed. Uses data from the Zustand crate store.

Visual reference: `CheckOut.png`.

### 7.1 — Checkout Page (`app/checkout/page.tsx`)

- Breadcrumb: `YOUR CRATE / CHECKOUT`
- Eyebrow: "STEP 2 OF 3 · DETAILS & PAYMENT"
- Heading: "Checkout."

**Progress bar:**
3-step indicator: `① CRATE ————— 2 DETAILS ————— 3 CONFIRMED`
- Completed steps: green filled circle + label
- Current step: brass numbered circle + bold label
- Future steps: ghost circle + muted label

### 7.2 — Checkout Accordion Panels

Three accordion items, only active one expanded:

**Panel 01 — Contact & shipping:**
- Brass numbered badge `01` + "Contact & shipping" heading
- Form fields (all per Design Tokens): FULL NAME, EMAIL, PHONE (FOR FREIGHT), STREET ADDRESS, APT / SUITE / HOMESTEAD, CITY / TOWN, STATE / REGION, ZIP / POSTAL, COUNTRY (select), NOTES FOR THE PACKER (OPTIONAL, textarea)
- "Continue to payment →" primary green button (right-aligned below form)

**Panel 02 — Payment (collapsed, locked until step 1 complete):**
- `02` badge + "Payment" heading (greyed out until accessible)
- Mock payment form: card number, expiry, CVV (no real payment processing — this is frontend only)

**Panel 03 — Review & place order (collapsed):**
- `03` badge + "Review & place order"

### 7.3 — Order Summary Sidebar

- Sticky right sidebar (desktop).
- "ORDER SUMMARY" eyebrow
- Line items: each crate item with small thumbnail (PlateImage 48×56px) + name + SKU + price.
- Rows: Subtotal · Freight · Estimated tax · **Total · USD** (bold serif, brass deep price).

### 7.4 — Order Confirmation Page (`app/checkout/confirmed/page.tsx`)

- Dark canvas hero: "Order confirmed." serif heading + "We'll have it straw-packed and on its way. Check your email for the real invoice." body.
- Order number display: large mono code.
- "Walk the catalog again →" primary button.

---

### PHASE 7 STOP ✋

> **Claude Code must:**
> 1. Build all checkout components.
> 2. Test: accordion steps advance correctly; order summary populates from crate store; completing step 1 unlocks step 2.
> 3. Verify sticky sidebar behavior on desktop.
> 4. Output a report:
>    - All checkout components built
>    - Multi-step flow tested end-to-end
>    - Edge case: empty crate redirects to catalog
> 5. Ask: **"Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase 8 — Account & Sign-In

### Objective
Build the sign-in / create account dropdown and the account page (mock auth state, no real backend).

Visual reference: `UserSignInCreateAccount.png`.

### 8.1 — Sign-In Dropdown (in Nav)

- Triggered by Account icon button in Nav actions.
- Positioned dropdown panel (not a page) drops below the nav bar, right-aligned.
- Two tabs: **Sign in** | **Create account** — tabbed, switching without navigation.
- **Sign in tab:** Italic serif welcome "Welcome back. We'll keep the lamp lit." + EMAIL field + PASSWORD field + "Sign in" primary green button + "FORGOT YOUR PASSWORD?" mono link.
- **Create account tab:** EMAIL + PASSWORD + CONFIRM PASSWORD + "Create account" primary green button.
- Close on click outside or Escape.
- Mock auth: on "Sign in" click, set `isAuthenticated: true` in simple Context. Show user avatar initial in nav icon instead of generic user icon.

### 8.2 — Account Page (`app/account/page.tsx`)

- "MY ACCOUNT" eyebrow + "Good evening." serif heading (can use a static name since mock).
- Two columns: left = order history mock list; right = saved addresses mock.
- "Sign out" ghost button.

---

### PHASE 8 STOP ✋

> **Claude Code must:**
> 1. Build the sign-in dropdown and account page.
> 2. Test: dropdown opens/closes; switching tabs works; mock sign-in updates nav icon.
> 3. Output a report:
>    - Components built
>    - Auth state tested
> 4. Ask: **"Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase 9 — Polish, Responsiveness & Performance

### Objective
Complete all responsive breakpoints, micro-interactions, accessibility, and performance optimizations. This phase has no new features — only quality elevation.

### 9.1 — Responsive QA Checklist

For every page, verify at: 380px · 640px · 1024px · 1280px · 1440px+

- [ ] Nav: hamburger at ≤1024px, mobile drawer opens/closes, all links work
- [ ] Storefront hero: stacks vertically at ≤640px; text scale readable
- [ ] Category grid: 2-column at tablet, 1-column at mobile
- [ ] Catalog: filter pills scroll horizontally at mobile; sidebar drawer full-width
- [ ] Product detail: gallery above info at mobile; quantity stepper touch-friendly
- [ ] Heritage timeline: single-column at mobile
- [ ] Checkout: sidebar below form at mobile
- [ ] Footer: 4-col → 2-col → 1-col
- [ ] Icon buttons: minimum 44×44px tap targets on mobile

### 9.2 — Micro-Interactions

- Product card: on hover, brass category tag fades in + card lifts −3px
- Nav active link: 2px brass underline slides in from left (CSS `transform: scaleX(0) → 1`)
- Primary button: on hover, green-deep fill + shadow-cta-hover + translateY(−1px)
- Crate badge: on item added, badge does a brief scale pulse (0.15s) in framer-motion
- Search overlay: staggered fade-in for result rows (each delayed by 30ms)
- Form inputs: on focus, border transitions to `--brass-deep` + brass glow ring
- Plate image: on card hover, subtle scale(1.03) with overflow:hidden clip

### 9.3 — Accessibility

- All interactive elements have `aria-label` (icon-only buttons especially)
- Search overlay: focus trapped inside when open; closes on Escape
- Crate drawer: focus trapped; Escape closes it
- Form labels properly associated with inputs (`htmlFor` / `id`)
- `prefers-reduced-motion`: wrap all framer-motion animations in a conditional — if reduced motion preferred, skip parallax and use instant transitions
- Color contrast: verify brass text on parchment passes WCAG AA (4.5:1 minimum)
- Skip-to-content link in root layout (visually hidden until focused)

### 9.4 — Performance

- All `PlateImage` components use `next/image` with explicit `width`/`height` and `priority` on above-fold images
- Catalog page: use `React.memo` on `ProductCard` to prevent unnecessary re-renders during filter changes
- Search overlay: debounce input handler by 150ms
- Parallax: use `will-change: transform` on parallax elements; remove on non-parallax elements
- Font loading: `display: swap` on all Google Fonts
- Add `loading="lazy"` to below-fold images

### 9.5 — Final Checklist

- [ ] No console errors in development
- [ ] No TypeScript errors (`npm run build` completes cleanly)
- [ ] All navigation links route correctly
- [ ] Crate persists across page refreshes (Zustand persist middleware)
- [ ] Filters reset correctly when category pill is changed
- [ ] Back button behavior correct on all pages
- [ ] Dark canvas sections: text contrast verified
- [ ] No animated emojis anywhere in the codebase
- [ ] All react-icons used at consistent sizes (20–24px in nav, 16–18px in body content)
- [ ] JetBrains Mono eyebrows render at correct tracking (0.22em)
- [ ] Playfair Display loaded and rendering correctly at all heading sizes

---

### PHASE 9 STOP ✋ — FINAL PHASE

> **Claude Code must:**
> 1. Complete all responsive QA, accessibility fixes, and performance optimizations listed above.
> 2. Run `npm run build` and confirm it succeeds with zero errors.
> 3. Run the complete checklist in 9.5 and report pass/fail for each item.
> 4. Output a **FINAL PROJECT REPORT** containing:
>    - Total files created (complete list)
>    - Total components built
>    - All pages implemented
>    - Known limitations (e.g. no real Shopify connection, no real auth)
>    - Shopify integration notes — what would need to change in Phase 10 (for future reference)
>    - Any deviations from the design screenshots and reasoning
>    - Build output size and performance notes
> 5. State: **"Frontend implementation complete. Ready for Shopify integration phase when instructed."**

---

## Appendix A — Shopify Integration Notes (Future Phase)

When the client is ready to connect Shopify, the following changes apply:

| Current (Mock) | Shopify Replacement |
|---|---|
| `lib/mockData.ts` products | Shopify Storefront API (GraphQL) |
| Zustand crate store | Shopify Cart API |
| Mock checkout form | Shopify Checkout (redirect or embedded) |
| Mock auth (Context) | Shopify Customer Account API |
| Static product slugs | Shopify product handles |
| Manual image paths | Shopify CDN image URLs |

The component architecture is intentionally abstracted so that swapping the data layer only requires updating `lib/` files and API calls — no component rewrites needed.

---

## Appendix B — Design Reference Quick-Look

| Screenshot | What it shows |
|---|---|
| `HomePage.png` | Full storefront layout, all sections, parallax plates |
| `CatalogCompacted.png` | Catalog with filter sidebar open (compacted/drawer mode) |
| `CatalogUncompact.png` | Catalog with inline filter bar visible |
| `ProductDetails.png` | Full product detail page |
| `Crate.png` | Empty crate drawer open |
| `Crate1.png` | Crate drawer with item, showing proceed to checkout |
| `CheckOut.png` | Checkout step 2 (Details & Payment) |
| `Contact.png` | Contact page with form and address cards |
| `Heritage.png` | Heritage page with timeline |
| `OurStory.png` | Our Story page |
| `SearchOverlay.png` | Search overlay open over storefront |
| `UserSignInCreateAccount.png` | Sign-in dropdown in nav |
| `Design-Pattern.MD` | Full design token reference — colors, typography, spacing, components |

---

*Document prepared for Claude Code execution · Acme Lamp & Sign Frontend Build · Spring 2026*
*Total phases: 0–9 (10 phases) · Estimated components: 45+ · Pages: 10*