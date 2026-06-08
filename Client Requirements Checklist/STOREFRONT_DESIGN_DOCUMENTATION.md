# Acme Vintage Supply — Storefront Design Documentation

**Live URL:** https://www.acmevintagesupply.com
**Admin URL:** https://www.acmevintagesupply.com/admin (password: `acme2026`)
**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · TypeScript

---

## Table of Contents

1. [Design Theme & Aesthetic](#1-design-theme--aesthetic)
2. [Color Palette](#2-color-palette)
3. [Typography](#3-typography)
4. [Spacing, Sizing & Tokens](#4-spacing-sizing--tokens)
5. [Page Routes & Structure](#5-page-routes--structure)
6. [User Flows](#6-user-flows)
7. [Features](#7-features)
8. [Components](#8-components)
9. [Tech Stack](#9-tech-stack)
10. [File Structure](#10-file-structure)

---

## 1. Design Theme & Aesthetic

**Concept:** Vintage hardware catalog meets premium editorial retail. Every decision reinforces Acme's identity as a heritage brand dealing in antique lamps and signs from another era.

**Key aesthetic decisions:**

- **Parchment background** — Warmed off-white (`#FAF5EC`) evokes aged paper and antique catalogs
- **Serif-forward typography** — Playfair Display for headings signals luxury and craft
- **Brass accents** — Secondary brand color references the brass hardware on the products themselves
- **Minimal border radius** — 2px on buttons (not rounded) maintains a formal, period-appropriate feel
- **Monospace eyebrow labels** — All-caps, wide-tracked labels create visual hierarchy and suggest technical specs
- **Dark canvas sections** — High-contrast ink-dark backgrounds for featured quotes and testimonials
- **Diagonal plate pattern** — Placeholder image uses angled stripes that mimic physical product photography

> **Note:** Shopify `theme.liquid` has a redirect script in `<head>` that bounces any visitor landing on `acmevintagesupply.myshopify.com` to `www.acmevintagesupply.com`. This handles the post-checkout "Continue Shopping" redirect.

---

## 2. Color Palette

### Storefront (Light Theme)

| Token | Name | Hex | Usage |
|---|---|---|---|
| `--color-parchment` | Parchment | `#FAF5EC` | Primary background |
| `--color-parchment-2` | Parchment 2 | `#F2EBDB` | Cards, secondary surfaces |
| `--color-parchment-3` | Parchment 3 | `#E8DEC5` | Tertiary backgrounds |
| `--color-ink-charcoal` | Charcoal | `#1E2022` | Dark text, dark sections |
| `--color-ink-iron` | Iron | `#2D2F31` | Primary body text |
| `--color-ink-soft` | Iron Soft | `#4A4D50` | Muted/secondary text |
| `--color-brass` | Brass | `#C29B47` | Accent color, highlights |
| `--color-brass-deep` | Brass Deep | `#9C7A2E` | Brass hover state |
| `--color-green-brand` | Green Brand | `#2E4A3F` | Primary CTA, buttons |
| `--color-green-deep` | Green Deep | `#233830` | Button hover state |
| `--color-error` | Error Red | `#8C2A1C` | Form errors |
| `--color-ink-rule` | Ink Rule | `rgba(45,47,49,0.18)` | Borders, dividers |

### Canvas (Dark Sections)

| Token | Name | Hex | Usage |
|---|---|---|---|
| `--color-canvas-body` | Canvas Body | `#E8E2D3` | Body text on dark bg |
| `--color-canvas-muted` | Canvas Muted | `#B7B0A0` | Secondary text on dark |
| `--color-canvas-dim` | Canvas Dim | `#82796A` | Tertiary text on dark |
| `--color-canvas-heading` | Canvas Heading | `#F5EFE0` | Headings on dark bg |

### Admin Dashboard (Separate Theme)

| Role | Light | Dark |
|---|---|---|
| Background | `#F6F6F7` | `#000000` |
| Surface | `#FFFFFF` | `#0C0C0E` |
| Text | `#09090B` | `#F4F4F5` |
| Success | `#16A34A` | `#16A34A` |
| Danger | `#DC2626` | `#DC2626` |
| Warning | `#D97706` | `#D97706` |

---

## 3. Typography

### Font Families

| Role | Primary | Fallbacks |
|---|---|---|
| **Serif** (Display/Headings) | Playfair Display | Cormorant Garamond → Georgia → Times New Roman |
| **Sans** (Body/UI) | Inter | system-ui → Arial → Helvetica |
| **Mono** (Labels/Technical) | JetBrains Mono | IBM Plex Mono → SF Mono → Menlo |

### Weights Loaded

- Serif: 400, 500, 600, 700
- Sans: 400, 500, 600, 700
- Mono: 400, 500

### Key Typography Rules

- Base body: **17px**, line-height **1.6**
- Fluid headings use `clamp()` for responsive scaling
- `.eyebrow` utility — 12px monospace, uppercase, `0.22em` letter-spacing
- Wide eyebrow — `0.3em` letter-spacing for hero labels
- All fonts loaded via `next/font/google` for zero layout shift

---

## 4. Spacing, Sizing & Tokens

| Token | Value | Usage |
|---|---|---|
| `--radius-btn` | `2px` | Button corners (intentionally sharp) |
| `--radius-pill` | `100px` | Badge/tag chips |
| `--tracking-eyebrow` | `0.22em` | Standard eyebrow labels |
| `--tracking-eyebrow-wide` | `0.3em` | Hero eyebrow labels |
| Nav height | `64px` | Fixed header |
| Max container | `1280px` | Default content width |
| Wide container | `1440px` | Full-bleed sections |
| Scroll offset | `4rem` | Anchor link offset for fixed nav |

### Shadows

| Name | Value |
|---|---|
| CTA hover | `0 8px 24px -10px rgba(46,74,63,0.5)` |
| Card hover | `0 18px 40px -22px rgba(30,32,34,0.4)` |
| Search overlay | `0 30px 60px -30px rgba(30,32,34,0.35)` |
| Brass focus ring | `0 0 0 3px rgba(194,155,71,0.18)` |

---

## 5. Page Routes & Structure

### Public Storefront

| Route | Page | Description |
|---|---|---|
| `/` | Homepage | Hero, bento category grid, featured picks, testimonials, newsletter |
| `/catalog` | Catalog | Full product grid with search and category filtering |
| `/products/[handle]` | Product Detail | Gallery, specs table, notes, reviews, related products |
| `/crate` | Cart | Persistent cart with quantity controls and order summary |
| `/login` | Sign In | Shopify passwordless auth (email OTP via Shopify-hosted page) |
| `/account` | Account Dashboard | Tabs: Orders, Returns, Addresses, My Crate |
| `/account/reset` | Password Reset | Headless Storefront API reset (legacy fallback) |
| `/track-order` | Order Tracking | Fulfillment timeline lookup by order ID + email |
| `/checkout/confirmed` | Order Confirmed | Post-purchase confirmation page |

### Info & Content Pages

| Route | Page |
|---|---|
| `/our-story` | Brand story with mission, beliefs, testimonial |
| `/heritage` | Brand heritage timeline |
| `/journal` | Bench Notes blog |
| `/guides` | Lamp lighting guide |
| `/restoration` | Restoration services |
| `/contact` | Contact form + address cards |
| `/shipping` | Shipping info and costs |
| `/returns` | Return policy |
| `/faq` | Frequently asked questions |
| `/signs` | Signs category showcase |

### Legal

| Route |
|---|
| `/legal/privacy-policy` |
| `/legal/terms` |
| `/legal/accessibility` |

### Admin Dashboard

| Route | Description |
|---|---|
| `/admin/login` | Admin authentication (bcrypt, separate from storefront auth) |
| `/admin/overview` | Dashboard with stats and recent activity |
| `/admin/products` | Product management (create, edit, sortable sold count) |
| `/admin/collections` | Collection management |
| `/admin/orders` | Order list with fulfillment |
| `/admin/orders/[id]` | Order detail, fulfillment timeline, add event |
| `/admin/customers` | Customer list (live from Shopify) |
| `/admin/customers/[id]` | Customer profile + order history |
| `/admin/analytics` | Revenue, order count, top products (live), sessions (estimated) |
| `/admin/inventory` | Stock management |
| `/admin/settings` | Admin configuration |

---

## 6. User Flows

### Browse & Purchase

```
Homepage
  └── Walk the Catalog (CTA)
        └── /catalog — filter by category, search
              └── Product Card click
                    └── /products/[handle] — gallery, specs, add to crate
                          └── Add to Crate → Crate Drawer opens
                                └── Proceed to Checkout
                                      └── Shopify Checkout (hosted)
                                            └── Payment complete → Thank You page
                                                  └── Continue Shopping → Homepage
```

### Authentication

```
Sign In / Account icon
  └── /login
        └── Click "Sign in / Create account"
              └── Redirect to Shopify-hosted OTP page
                    └── Enter email → receive 6-digit code
                          └── Shopify redirects to /api/auth/callback
                                └── iron-session cookie set
                                      └── Redirect to /account
```

### Account Dashboard

```
/account
  ├── Orders tab — order history from Shopify Admin API
  ├── Returns tab — return request form
  ├── Addresses tab — saved addresses (add, edit, delete, set default)
  └── My Crate tab — live cart items, proceed to checkout
```

### Admin Order Fulfillment

```
/admin/orders
  └── Click order row
        └── /admin/orders/[id]
              └── Add Fulfillment Event modal
                    └── Select stage: Packed → Shipped → In Transit → Delivered
                          └── "In Transit" triggers soldCount increment on Shopify metafield
```

---

## 7. Features

### Shopping Cart ("My Crate")

- Persistent cart via Zustand + localStorage (`acme-crate` key)
- Syncs to Shopify Storefront Cart API (`cartCreate`, `cartLinesAdd/Update/Remove`)
- `cartBuyerIdentityUpdate` links cart to logged-in customer so Shopify checkout pre-fills their email
- Race condition handling — items queued while cart is being created are batch-added on resolve
- Cart cleared on logout and after checkout completion
- Free shipping threshold logic displayed in summary
- "My Crate" tab on account page for logged-in users
- CrateDrawer: "View Full Crate" → `/account?tab=crate` (logged in) or `/crate` (guest)

### Product Catalog

- Full-text search with overlay
- Category filtering: lighting, glass chimneys, hardware, signs
- Product cards with stock badges: Sold Out, Low Stock, "X sold" pill
- Sold count reads from `acme.sold_count` Shopify metafield (set when order reaches In Transit)
- Sortable admin products table with Sold column

### Product Detail

- Multi-image gallery
- Technical specs table
- "Notes from the Bench" long-form description
- Customer reviews section
- Related products
- Patent / SKU metadata display
- Price in CAD

### Authentication

- Shopify Customer Account API (passwordless OTP)
- OAuth/PKCE flow — no passwords stored on our servers
- iron-session for server-side session storage
- Hydration on page load via `/api/auth/me`
- Profile sourced from Shopify Admin API (two parallel queries by email)

### Customer Account

- Order history with status, items, images, prices
- Fulfillment timeline per order
- Saved addresses: create, edit, delete, set default (CA API mutations)
- Return request management
- Live cart in "My Crate" tab

### Order Tracking

- Public track-order page (no login required)
- Full event timeline: IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, etc.

### Admin Dashboard

- Real Shopify data: orders, customers, analytics, products
- Revenue stats, order counts, top products — live
- Sessions/device/conversion — estimated (Shopify Plus required for real data)
- CSV export on customer list
- Fulfillment event modal with stage progression
- Sold count auto-incremented at "In Transit" stage
- Dark mode support

### Contact & Newsletter

- Contact form (not yet wired to email — planned: Google Apps Script → Sheets)
- Newsletter signup in footer and BenchNotesCTA section (planned: same)

---

## 8. Components

### Navigation

| Component | Description |
|---|---|
| `Nav.tsx` | Fixed header, scroll shadow, search + cart + account |
| `NavLinks.tsx` | Desktop dropdown menu |
| `NavActions.tsx` | Search icon, crate icon with count badge, account dropdown |
| `MobileDrawer.tsx` | Full-height slide-in mobile menu |
| `AccountDropdown.tsx` | Signed-in profile menu |

### Shared / Primitives

| Component | Description |
|---|---|
| `Button.tsx` | Variants: `primary` (green), `ghost` (outline), `brass` |
| `Eyebrow.tsx` | Monospace uppercase label, light variant for dark backgrounds |
| `PlateImage.tsx` | Image with diagonal pattern fallback (light + dark variants) |
| `Breadcrumb.tsx` | Navigation trail |
| `Footer.tsx` | Newsletter signup, site links, legal links |

### Product

| Component | Description |
|---|---|
| `ProductCard.tsx` | Grid card with sold badge, quick-add |
| `ProductGallery.tsx` | Multi-image viewer |
| `ProductInfo.tsx` | Title, price, "X sold" badge, Add to Crate |
| `SpecTable.tsx` | Technical specifications table |
| `RelatedProducts.tsx` | Horizontal scroll of related items |
| `CustomerReviews.tsx` | Star rating + review list |

### Catalog

| Component | Description |
|---|---|
| `CatalogClient.tsx` | Filter state + product grid |
| `FilterBar.tsx` | Category filter chips |
| `ProductGrid.tsx` | Responsive CSS grid |

### Cart (Crate)

| Component | Description |
|---|---|
| `CrateItem.tsx` | Line item with quantity stepper and remove |
| `CrateSummary.tsx` | Subtotal, shipping estimate, checkout CTA |
| `CrateDrawer.tsx` | Slide-in cart panel triggered from nav |

### Homepage Sections

| Component | Description |
|---|---|
| `HeroSection.tsx` | Full-viewport hero with CTA |
| `CategoryGrid.tsx` | Asymmetric bento grid of 4 categories |
| `PickedOffTheBench.tsx` | Curated product picks |
| `TestimonialsCarousel.tsx` | Auto-advancing dark-bg testimonials |
| `BenchNotesCTA.tsx` | Newsletter signup inline section |

### Admin

| Component | Description |
|---|---|
| `AdminSidebar.tsx` | Left nav with icon links |
| `AdminTopBar.tsx` | Page header, breadcrumb, user info |
| `AddFulfillmentEventModal.tsx` | Stage selector + submit |
| `RevenueChart.tsx` | Recharts line chart, accepts live or mock data |
| `ProductForm.tsx` | Create/edit product form |

---

## 9. Tech Stack

| Layer | Library | Version |
|---|---|---|
| Framework | Next.js | 16.2.6 |
| UI | React | 19.2.4 |
| Language | TypeScript | — |
| Styling | Tailwind CSS v4 | PostCSS-based, `@theme {}` tokens in `globals.css` |
| State | Zustand | — |
| Animation | Framer Motion | 12.39.0 |
| Accessible UI | Radix UI Select | — |
| Icons | React Icons | 5.6.0 |
| Forms | React Hook Form | — |
| Auth (customer) | Shopify Customer Account API | OAuth/PKCE, iron-session |
| Auth (admin) | bcryptjs | — |
| E-commerce | Shopify Storefront API + Admin API | GraphQL |
| Charts | Recharts | 3.8.1 |
| Rate limiting | Upstash Redis | — |
| Email | Resend | — |
| CSV | Papa Parse | — |
| Class utils | clsx + tailwind-merge | — |

### Tailwind v4 Note

No `tailwind.config.ts` file. All design tokens are defined directly in `app/globals.css` using the `@theme {}` block. This is a breaking change from Tailwind v3.

---

## 10. File Structure

```
acme-lamp-sign/
├── app/
│   ├── globals.css                  ← Design tokens, @theme {}, utilities
│   ├── layout.tsx                   ← Root layout, fonts, metadata, Nav + Footer
│   ├── page.tsx                     ← Homepage
│   ├── catalog/
│   │   └── page.tsx                 ← Product grid + filtering
│   ├── products/[handle]/
│   │   └── page.tsx                 ← Product detail
│   ├── crate/page.tsx               ← Cart page
│   ├── login/page.tsx               ← Auth entry (Shopify OTP)
│   ├── account/
│   │   ├── page.tsx                 ← Customer dashboard (tabs)
│   │   └── reset/page.tsx           ← Password reset
│   ├── track-order/page.tsx
│   ├── (info)/                      ← Info pages group
│   │   ├── our-story/page.tsx
│   │   ├── heritage/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── shipping/page.tsx
│   │   ├── returns/page.tsx
│   │   ├── faq/page.tsx
│   │   └── ...
│   ├── admin/                       ← Admin section (separate layout)
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── overview/page.tsx
│   │   ├── products/page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── analytics/page.tsx
│   └── api/
│       ├── auth/
│       │   ├── authorize/route.ts   ← PKCE challenge + redirect
│       │   ├── callback/route.ts    ← Token exchange + session
│       │   ├── me/route.ts          ← Hydrate session
│       │   ├── logout/route.ts
│       │   └── reset/route.ts
│       ├── admin/
│       │   ├── orders/[id]/fulfill/route.ts
│       │   ├── customers/route.ts
│       │   ├── customers/[id]/route.ts
│       │   └── analytics/route.ts
│       └── track-order/route.ts
│
├── components/
│   ├── nav/                         ← Header, links, mobile drawer
│   ├── shared/                      ← Button, Eyebrow, PlateImage, Footer
│   ├── product/                     ← Cards, gallery, specs, reviews
│   ├── catalog/                     ← Filter bar, grid
│   ├── crate/                       ← Cart items, summary, drawer
│   ├── home/                        ← Hero, category grid, testimonials
│   └── admin/                       ← Sidebar, topbar, forms, charts
│
├── lib/
│   ├── shopify.ts                   ← Storefront API GraphQL queries
│   ├── shopifyCustomer.ts           ← Customer mutations + CA API
│   ├── shopifyCart.ts               ← Cart API mutations
│   ├── admin/
│   │   ├── shopifyAdmin.ts          ← Admin API client
│   │   ├── types.ts                 ← Admin TypeScript interfaces
│   │   └── mockData.ts              ← Fallback mock data
│   ├── customerSession.ts           ← iron-session config
│   ├── types.ts                     ← Storefront TypeScript interfaces
│   ├── mockData.ts                  ← Storefront mock products
│   └── utils.ts                     ← formatPrice, cn()
│
├── store/
│   ├── crateStore.ts                ← Zustand cart state
│   └── customerStore.ts             ← Auth + profile state
│
├── data/                            ← Local JSON (replaces Sanity CMS)
│
└── next.config.ts                   ← Image domains config
```

---

## Quick Reference

### Brand Colors at a Glance

```
Parchment  #FAF5EC  ██  Background
Iron       #2D2F31  ██  Body text
Green      #2E4A3F  ██  Buttons / CTAs
Brass      #C29B47  ██  Accents / highlights
Charcoal   #1E2022  ██  Dark sections
```

### Font Roles at a Glance

```
Playfair Display  →  Page titles, product names, section headings
Inter             →  Body copy, UI labels, buttons, form fields
JetBrains Mono    →  Eyebrow labels (VINTAGE HARDWARE · EST. 1900s)
```

### Environment Variables Required

```env
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=
SHOPIFY_ADMIN_TOKEN=
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID=
NEXT_PUBLIC_SITE_URL=https://acmevintagesupply.com
SESSION_SECRET=
ADMIN_PASSWORD_HASH=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RESEND_API_KEY=
```
