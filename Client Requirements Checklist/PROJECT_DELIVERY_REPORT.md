# Project Delivery Report
## Acme Lamp & Sign Co. — E-Commerce Storefront

**Developer:** Peter Paul Lazan
**Sprint Duration:** May 18 – May 26, 2026 (6 working days)
**Live Preview:** https://acmelampandsign.vercel.app/
**Tech Stack:** Next.js 16 · Tailwind CSS v4 · TypeScript · Shopify Storefront API · Sanity CMS · Vercel

---

## Executive Summary

A complete production-grade headless e-commerce storefront was designed, built, integrated with live backend services, and deployed to production. The deliverable covers everything from the design system foundation through to a live Shopify product with real data flowing end-to-end.

---

## What Was Delivered

### 1. Environment & Project Foundation

- Initialized full Next.js 16 project with TypeScript and Tailwind CSS v4
- Configured GitHub repository and version control workflow
- Set up local development environment, VS Code workspace, and tooling
- Integrated AI-assisted development workflow (Claude Code + Claude Design)
- Installed and configured all project dependencies
- Deployed to Vercel with automatic CI/CD on every push

**Technical decisions made:**
- Next.js App Router (server components + client components split)
- Tailwind CSS v4 with custom design tokens
- Zustand for client-side cart state
- Framer Motion for animations
- TypeScript strict mode throughout

---

### 2. Design System

A complete, custom design system built from scratch — not a template or theme.

**Color palette:**
- `parchment` / `parchment-2` — warm off-white backgrounds
- `ink-charcoal` / `ink-iron` / `ink-soft` — three-tier text hierarchy
- `brass` / `brass-deep` — primary brand accent (gold)
- `canvas-dark` — dark section backgrounds
- `green-brand` / `green-deep` — CTA button color

**Typography:**
- Serif font (editorial headings) — `font-serif`
- Sans-serif (body, UI) — `font-sans`
- Monospace (labels, badges, data) — `font-mono`
- Custom `tracking-eyebrow` utility for uppercase label spacing

**Shared components built:**
- `Button` — variants: brass, outline, ghost
- `Eyebrow` — small uppercase section label, light/dark variants
- `Breadcrumb` — accessible, with structured data support
- `PlateImage` — smart image wrapper with `objectFit` prop, placeholder states, and labels
- `PageTransition` / `PageAnimator` — smooth page-level entrance animations
- `SearchOverlay` — full top-sliding search drawer (described in detail below)
- `AuthModal` — sign in / register modal
- `ShellClient` — client shell wrapper for layout

---

### 3. Navigation & Header

**Component:** `Nav.tsx` + `NavActions.tsx` + `NavLinks.tsx` + `MobileDrawer.tsx` + `AccountDropdown.tsx`

- Heritage serif wordmark: *Acme Lamp & Sign Co. — Est. for the long burn.*
- Desktop navigation with hover states
- Mobile hamburger drawer with full menu, category links, and contact info
- Utility bar: Search icon, Account dropdown, Cart icon with live item count badge
- Sticky header with backdrop blur on scroll
- Fully keyboard accessible and screen-reader labelled

---

### 4. Search Drawer

**Component:** `SearchOverlay.tsx`

A premium top-sliding search experience — not a full-page overlay.

- Slides down from the navigation bar, page remains visible behind dark scrim
- **Idle state:** Category pills (Lighting Fixtures · Glass & Chimneys · Burners & Wicks · Signs) + "Just In" featured product grid
- **Active state:** Live product search filtering by name, SKU, and description
- **Recent Searches:** Up to 5 past terms stored in `localStorage`, displayed as removable pill chips. Clear all button included.
- Single `×` button: clears query on first press, closes drawer on second press
- `type="text"` (not `search`) to prevent browser-native clear control duplication
- Constrained width aligned to navigation bar for visual consistency

---

### 5. Storefront Home Page

**Page:** `app/page.tsx`

Five distinct sections, each a standalone component:

#### HeroSection (`components/home/HeroSection.tsx`)
- Full-viewport editorial hero with product photography
- Parallax depth layer (`ParallaxLayer.tsx`)
- Headline, sub-copy, dual CTA buttons (primary + secondary)
- `objectFit="cover"` full-bleed image treatment

#### CategoryGrid (`components/home/CategoryGrid.tsx`)
- 4-tile editorial grid: Lighting · Glass & Chimneys · Hardware · Signs
- Hover-reveal overlay with category name and CTA
- Real eBay CDN product imagery per category tile
- Links to filtered catalog views

#### PickedOffTheBench (`components/home/PickedOffTheBench.tsx`)
- "Hand-selected" featured products section
- **Live Shopify data** — fetches products tagged `featured` via `getFeaturedProducts()`
- Async server component — no client-side loading state needed
- Staggered aspect ratios per card: `3/5` · `4/5` · `5/4`

#### TestimonialsCarousel (`components/home/TestimonialsCarousel.tsx`)
Infinite auto-scrolling marquee — no interaction required, content flows continuously:
- **Continuous horizontal scroll** — CSS `animation: scroll-x 50s linear infinite`
- Testimonials array doubled (`[...testimonials, ...testimonials]`) for seamless loop with no jump
- **Pauses on hover** — `animation-play-state: paused` on `.marquee-container:hover`
- Left/right edge fade via CSS mask (`linear-gradient` to transparent) for clean entry/exit
- Dark overlay on background image (`bg-ink-charcoal/85`) for readability
- Each card: quote icon · italic serif quote · 5-star rating · name + location in mono caps

#### Footer (`components/shared/Footer.tsx`)
- Newsletter signup strip with loading / success / error states
- Dark canvas 4-column grid: Brand info · Catalog links · Workshop links · Service links
- Nova Scotia, Canada address with phone
- Bottom micro-bar with legal page links (Privacy Policy · Terms & Conditions · Accessibility)

---

### 6. Catalog Page

**Page:** `app/catalog/page.tsx` (server) + `app/catalog/CatalogClient.tsx` (client)

- Server component fetches all products from Shopify via `getAllProducts()`
- Client component handles filtering and sorting state
- **Filters:** Category · Burner Size · Material
- **Sort:** Curator pick · Price low–high · Price high–low · Newest
- Live product count display
- Filter sidebar drawer (mobile) with overlay scrim
- Filter bar (desktop) with inline controls
- Responsive `ProductGrid` — 2 columns mobile, 3 columns desktop
- Result count updates reactively as filters change

---

### 7. Product Detail Page

**Page:** `app/catalog/[slug]/page.tsx`

The most complex page in the build — 6 distinct sections:

#### ProductGallery (`components/product/ProductGallery.tsx`)
- Main image with hover zoom (1.04× scale, 500ms ease)
- "Hover or tap to zoom" label overlay
- Thumbnail strip — 4-column grid, only renders real images (no empty placeholder frames)
- Active thumbnail highlighted with brass ring
- Radial depth vignette on main image hover
- SKU + View number label on each thumbnail

#### ProductInfo (`components/product/ProductInfo.tsx`)
- SKU badge (dark pill) + Patent badge (conditional — only when value exists)
- "Only X left" urgency badge (shows when stock ≤ 3)
- "Out of stock" badge
- Product name (clamp serif heading)
- Short description
- Live star rating aggregate with review count (links to reviews section)
- Price with currency + free freight threshold notice
- Fitment & compatibility box (conditional)
- Finish variant selector (when product has finish variants)
- Burner size selector (when product has burner size)
- Quantity stepper with stock cap enforcement (`disabled` when qty ≥ stockQuantity)
- "Add to crate" CTA with line total calculation + animated confirmation state
- Trust signals (30-day return · Hand-numbered · Real receipt)

#### FitmentBox (`components/product/FitmentBox.tsx`)
- Conditional compatibility card — only renders when burnerSize, material, or fits is populated
- Displays Burner Size · Material · Fits in a structured grid
- Styled as a soft parchment card with checkmark header

#### Notes from the Bench
- Inline section on the PDP
- Renders `product.fullDescription` split by double newline into paragraphs
- Only shown when `fullDescription` has content

#### SpecTable (`components/product/SpecTable.tsx`)
- Full specification table — 13 possible rows, only populated rows rendered
- Row order: Catalog Number · Type · Condition · Era · Primary Material · Power Source · Burner Size · Fits · Net Weight · Edition · Pattern of Origin · Workshop · Bench Tester's Name
- Mono uppercase labels, readable values
- Border-separated rows

#### CustomerReviews (`components/product/CustomerReviews.tsx`)
- Aggregate star rating display
- Individual review cards with name, date, rating, and body
- Sourced from `mockReviews.ts` (Sanity integration pending)

#### RelatedProducts (`components/product/RelatedProducts.tsx`)
- **Live Shopify data** — fetches by category via `getProductsByCategory()`
- Excludes current product
- 3-card grid, same aspect ratio cycle as homepage

---

### 8. Cart (The Crate)

**Components:** `CrateDrawer.tsx` · `CrateItem.tsx` · `CrateSummary.tsx`
**State:** `store/crateStore.ts` (Zustand)
**Page:** `app/crate/page.tsx`

- Slide-out drawer from the right with backdrop scrim
- Cubic-bezier entry/exit animation
- Per-item quantity stepper with stock cap (`disabled` when qty ≥ stockQuantity)
- Line total per item
- Order summary: subtotal · estimated shipping · total
- Free freight progress indicator
- Empty state with CTA to catalog
- Persistent across page navigation (Zustand store)

---

### 9. Checkout Flow

**Page:** `app/checkout/page.tsx`
**Components:** `CheckoutSteps.tsx` · `ContactShippingForm.tsx` · `PaymentForm.tsx` · `OrderSummary.tsx`

3-step accordion checkout:
- **Step 1 — Contact & Shipping:** Name, email, phone, address (Halifax NS placeholders), shipping method selection
- **Step 2 — Payment:** Card number, expiry, CVV, billing address toggle
- **Step 3 — Review & Place Order:** Full order summary before confirmation

Persistent order summary sidebar (desktop) showing cart items, subtotal, shipping, total.

---

### 10. Order Confirmation & Tracking

**Pages:** `app/checkout/confirmed/page.tsx` · `app/track-order/page.tsx`

- Confirmation page with order number, summary, and expected delivery date
- Order tracking timeline — 5-stage visual progress indicator (Order placed → Processing → Dispatched → In transit → Delivered)
- Estimated delivery date display

---

### 11. Customer Account

**Page:** `app/account/page.tsx`
**Store:** `store/authStore.ts` (Zustand)
**Component:** `AuthModal.tsx`

- Sign in / Register modal (Zustand auth state)
- Account dashboard: order history, saved addresses, account settings
- Demo address: Halifax, Nova Scotia, Canada

---

### 12. Editorial & Content Pages

All pages built with full layout, typography, and content structure:

| Page | Path | Description |
|---|---|---|
| Heritage | `/heritage` | Dark-themed brand history timeline with animated connecting paths |
| Our Story | `/our-story` | Brand narrative, founder story, workshop photography |
| Journal | `/journal` | Bench Notes editorial blog listing |
| Lamp-Lighting Guide | `/guides` | Product care and usage editorial |
| Restoration Services | `/restoration` | Service offering page |
| Contact | `/contact` | Contact form + address cards |
| FAQ | `/faq` | Accordion FAQ |
| Shipping | `/shipping` | Shipping zones and policies |
| Returns | `/returns` | 30-day return policy detail |

---

### 13. Legal & Compliance Pages

Three full legal pages — required before taking real orders:

#### Privacy Policy (`/legal/privacy-policy`)
- PIPEDA (Canadian federal privacy law) compliant
- 10 sections: Who we are · Information collected · How used · Third-party services · Cookies · Data retention · Your rights · Security · Changes · Contact
- Third-party services table: Shopify · Vercel · Sanity · Canada Post
- 30-day response commitment
- Effective date: May 23, 2026

#### Terms & Conditions (`/legal/terms`)
- 11 sections: About us · Orders & pricing · Payment · Shipping · Returns · Product descriptions · Intellectual property · Limitation of liability · Governing law (Nova Scotia) · Changes · Contact
- CAD pricing · PCI DSS compliance noted · 30-day return policy

#### Accessibility Statement (`/legal/accessibility`)
- WCAG 2.1 Level AA commitment
- Accessible Canada Act reference
- Assistive technologies tested: NVDA + Chrome · VoiceOver + Safari · Keyboard-only
- Known limitations with remediation timeline
- Escalation path via Office of the Accessibility Commissioner of Canada

All three linked in the footer micro-bar.

---

### 14. Data Layer & Backend Integration

#### Product Type System (`lib/types.ts`)
Complete TypeScript interface for `Product` — 30+ fields covering:
- Identity: id, slug, sku, patent
- Content: name, shortDescription, fullDescription
- Commerce: price, category, burnerSize, stockQuantity, inStock
- Physical: material, finish, fits, netWeight
- Provenance: benchTesterName, benchTestDate, workshop, edition
- Display: images, featured, collection
- eBay-sourced: era, powerSource, productType, condition

#### Real Product Data Pipeline
- Scraped 16 real products from client's eBay store (`theoillampcompany`)
- Built `json_to_ts.py` conversion script
- Replaced all placeholder mock products with real product data (IDs `eb-001` through `eb-016`)
- Products: 12 glass shades/chimneys · 3 hardware items · 1 reference book
- Prices sourced from live eBay listings (converted AU$ → CA$)

#### Shopify Storefront API Integration (`lib/shopify.ts`)
Complete headless Shopify integration layer:

```
shopifyFetch()         — Core GraphQL fetch, matches Vercel guide pattern exactly
query()                — Internal helper, clean return values
shopifyProductToProduct() — Shopify response → app Product type adapter
getAllProducts()        — Fetch all products (up to 250), sorted by title
getProductByHandle()   — Single product by URL slug
getProductsByCategory() — Products filtered by collection handle
getFeaturedProducts()  — Products tagged 'featured' (homepage section)
getProductsSorted()    — Products with custom sort key
```

- ISR caching: `next: { revalidate: 60 }` on all Shopify fetch calls
- 19 custom `acme.*` metafield definitions in Shopify
- Zero TypeScript errors
- Public Storefront API token (Headless channel)

#### Shopify Store Configuration
- Store domain: `w061f6-k8.myshopify.com`
- Currency: Canadian Dollar (CAD)
- Region: Nova Scotia, Canada (Atlantic Time)
- Headless sales channel installed and configured
- 15 custom metafield definitions created (Products namespace: `acme.*`)
- First product live with full metafield data

#### Custom Metafield Schema (`acme.*` namespace)
| Key | Type | Purpose |
|---|---|---|
| `acme.sku` | Single line text | Catalog number |
| `acme.burner_size` | Single line text | Burner compatibility |
| `acme.material` | Single line text | Primary material |
| `acme.fits` | Single line text | Dimensional compatibility |
| `acme.full_description` | Multi-line text | Notes from the Bench content |
| `acme.era` | Single line text | Period/decade |
| `acme.power_source` | Single line text | Fuel type |
| `acme.product_type` | Single line text | Product classification |
| `acme.condition` | Single line text | Item condition |
| `acme.style` | Single line text | Style classification |
| `acme.colour` | Single line text | Colour description |
| `acme.brand` | Single line text | Brand or manufacturer |
| `acme.vintage` | Single line text | Vintage classification |
| `acme.patent` | Single line text | Patent reference |
| `acme.edition` | Single line text | Edition/series |
| `acme.workshop` | Single line text | Workshop of origin |
| `acme.bench_tester` | Single line text | QA tester name |
| `acme.bench_test_date` | Date | QA test date |
| `acme.net_weight` | Single line text | Shipping weight |

---

### 15. Live Deployment

- **Platform:** Vercel (automatic deployment on push)
- **URL:** https://acmelampandsign.vercel.app/
- **Environment variables:** Configured in Vercel dashboard
- **Image optimization:** `next/image` with `remotePatterns` for `i.ebayimg.com` and `cdn.shopify.com`
- **ISR:** Incremental Static Regeneration on all Shopify-backed pages (60s revalidation)

---

### 16. Documentation Produced

| Document | Purpose |
|---|---|
| `ACME_BACKEND_PLAN_A_SHOPIFY_SANITY_SETUP.md` | Phase-gated plan for all Shopify + Sanity external setup |
| `ACME_BACKEND_PLAN_B_CODEBASE_INTEGRATION.md` | Phase-gated plan for all codebase integration work |
| `CLIENT_SETUP_GUIDE.md` | Plain-language guide for Scott — accounts, content submission, product photography brief |
| `DAILY_LOG_2026-05-18.md` | 5-day sprint log (May 18–22) with detailed daily accomplishments |
| `PROJECT_DELIVERY_REPORT.md` | This document |

---

## Bug Fixes & Technical Problem-Solving

| Problem | Root Cause | Fix |
|---|---|---|
| `python` command not found | Python 3.14 not on PATH | Used full path to executable |
| Unicode encode error in script | Windows CP1252 vs UTF-8 | Output file was written before crash — used the file directly |
| `mockReviews.ts` broken product IDs | Old placeholder IDs removed | Updated all `productId` references to real `eb-XXX` IDs |
| `next/image` hostname error (eBay) | `i.ebayimg.com` not in `remotePatterns` | Added to `next.config.ts` |
| `next/image` hostname error (Shopify) | `cdn.shopify.com` not in `remotePatterns` | Added to `next.config.ts` |
| PickedOffTheBench showing 0 products | No products had `featured: true` | Marked 3 products featured in mockData and Shopify tag |
| Shopify API 401 Unauthorized | Used private token instead of public token | Swapped to public Storefront API token |
| shopifyFetch signature mismatch | Old 2-argument call pattern after refactor | Routed all queries through internal `query()` helper |
| Empty gallery thumbnail frames | `buildSlots()` padded array to 4 | Replaced with `images.slice(0, 4)` — only real images rendered |
| Product card showing full description | Shopify Description field had long text | Separated: Description = short (1–2 sentences), `acme.full_description` = full |
| Australian address references | Placeholder data not updated | Full codebase sweep — all replaced with Halifax, Nova Scotia, Canada |

---

## What Remains Before Production Launch

| Item | Owner | Status |
|---|---|---|
| Remaining 15 products entered in Shopify | Peter Paul Lazan / Scott | In progress |
| Real product photography | Scott | Pending |
| Sanity CMS setup (journal, heritage, testimonials) | Peter Paul Lazan | Pending — awaiting Sanity account access |
| Domain purchase and DNS setup | Scott | Pending |
| Vercel production environment variables | Peter Paul Lazan | Ready to configure |
| Shopify Payments activation | Scott | Pending |
| End-to-end checkout test with real payment | Peter Paul Lazan + Scott | Pending |
| Remove test API route (`/api/test-shopify`) | Peter Paul Lazan | Before launch |

---

*Report generated: 2026-05-26 · Acme Lamp & Sign Development Sprint · Developer: Peter Paul Lazan*
