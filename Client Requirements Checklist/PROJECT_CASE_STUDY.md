# Acme Vintage Supply — Full Project Case Study
## E-Commerce Platform Development: A Complete Technical Reference

**Developer:** Peter Paul Abillar Lazan  
**Client:** Scott Fraser — Acme Lamp & Sign / Acme Vintage Supply  
**Project Duration:** May 2026 – June 2026 (Active Development)  
**Live URL:** https://www.acmevintagesupply.com  
**Admin URL:** https://www.acmevintagesupply.com/admin  
**Repository:** `c:\Users\PPlazan\Desktop\Claude Design\final-lamp-sign\acme-lamp-sign`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Client Profile & Business Context](#2-client-profile--business-context)
3. [Project Scope](#3-project-scope)
4. [Technical Stack](#4-technical-stack)
5. [System Architecture](#5-system-architecture)
6. [Development Methodology](#6-development-methodology)
7. [Development Timeline — Phase by Phase](#7-development-timeline--phase-by-phase)
8. [Storefront Features](#8-storefront-features)
9. [Admin Dashboard Features](#9-admin-dashboard-features)
10. [Third-Party Integrations](#10-third-party-integrations)
11. [Shopify Integration Deep Dive](#11-shopify-integration-deep-dive)
12. [Authentication Systems](#12-authentication-systems)
13. [Database Architecture (Supabase)](#13-database-architecture-supabase)
14. [Caching Architecture (Upstash Redis)](#14-caching-architecture-upstash-redis)
15. [Email System Architecture](#15-email-system-architecture)
16. [CMS Architecture](#16-cms-architecture)
17. [Security Implementation](#17-security-implementation)
18. [SEO Implementation](#18-seo-implementation)
19. [Analytics & Monitoring](#19-analytics--monitoring)
20. [Scope & Limitations](#20-scope--limitations)
21. [Known Issues & Workarounds](#21-known-issues--workarounds)
22. [Lessons Learned](#22-lessons-learned)
23. [Future Roadmap](#23-future-roadmap)
24. [Key File Reference](#24-key-file-reference)

---

## 1. Executive Summary

Acme Vintage Supply is a full-stack e-commerce platform built from the ground up for Scott Fraser, an antique oil lamp and enamel sign supplier based in Dartmouth, Nova Scotia. The platform was designed to replace a non-existent online presence and give Scott a professional, fully functional storefront connected directly to Shopify's commerce infrastructure.

The project was built in approximately 6 weeks, delivering:

- A complete customer-facing storefront (Next.js 16, Tailwind v4)
- A full custom admin dashboard (inventory, orders, customers, analytics, marketing)
- Integration with Shopify as the commerce backend (products, cart, checkout, orders, customers)
- A custom CMS for managing homepage, story, and footer content
- A promotional email marketing system (newsletter, campaigns, templates)
- Security hardening (OTP 2FA, bcrypt, rate limiting, Redis-backed sessions)
- SEO implementation (structured data, sitemap, metadata)
- Google Analytics 4 + Google Search Console setup
- Product reviews, back-in-stock notifications, order tracking, and communications hub

The platform is live, production-ready, and processing real orders via Shopify Payments.

---

## 2. Client Profile & Business Context

**Client:** Scott Fraser  
**Business:** Acme Lamp & Sign / Acme Vintage Supply  
**Location:** Dartmouth, Nova Scotia, Canada  
**Email:** scottsfi@hotmail.com  
**Business Email (planned):** scott@acmevintagesupply.ca  

**What the business sells:**
- Antique and reproduction oil lamp parts (chimneys, shades, burners, wicks, pressure lamp glass)
- Reproduction Victorian enamel advertising signs (Cadbury's, Veritas, James Hinks & Sons)
- Oil lamp books and specialty glass
- Products sourced from Melbourne, Australia — shipped by sea to Halifax, NS

**Key staff:**
- **Scott Fraser** — owner. Not tech-savvy. Prefers phone calls over email.
- **Robin** — Scott's employee. More tech-knowledgeable. Handles Shopify admin tasks on Scott's behalf.

**Business model:**
- E-commerce only (no physical retail)
- Ships across Canada and North America
- Pricing in CAD
- Shopify Payments as payment processor (RBC account ******5312)
- Canada-first launch strategy, US expansion planned

**Domain:**
- `acmevintagesupply.com` (primary, live) — purchased via GoDaddy
- `acmevintagesupply.ca` — also purchased, redirects to .com
- DNS hosted on GoDaddy pointing to Vercel

---

## 3. Project Scope

### In Scope (Delivered)

| Category | Features |
|---|---|
| Storefront | Home, Catalog, PDP, Cart, Checkout (Shopify), Account, Login, Register, Track Order, Our Story, Heritage, Contact, FAQ, Shipping, Returns |
| Admin Dashboard | Overview, Orders, Inventory, Products, Customers, Analytics, Reviews, Communications Hub, Marketing, Content CMS |
| Commerce | Shopify cart sync, checkout redirect, variant support, multi-colour cart, sold count tracking |
| Auth — Customer | Shopify OAuth PKCE (New Customer Accounts), iron-session, passwordless OTP |
| Auth — Admin | Email/OTP 2FA, bcrypt, rate limiting, Redis-backed sessions, 7-day Remember Me |
| CMS | Home page, Our Story, Heritage Timeline, FAQ, Shipping, Returns — all editable via admin |
| Email | Order confirmation, fulfillment, back-in-stock, contact form alert, new-order admin alert, promotional campaigns |
| Marketing | Newsletter subscription, subscriber management, campaign builder (3 template types), template library, preview modal, weekly cron |
| SEO | Metadata, Open Graph, JSON-LD structured data (Store, Product, BreadcrumbList, FAQPage), sitemap, robots.txt |
| Analytics | Vercel Analytics, custom admin page view tracker, GA4, Google Search Console |
| Security | OTP 2FA, bcrypt password hashing, Upstash rate limiting, security headers (CSP, HSTS, etc.) |
| Reviews | Customer product reviews, admin moderation, helpful votes, verified purchase badge |
| Notifications | Back-in-stock notify me, admin bulk notify, Resend email delivery |
| Infrastructure | Vercel deployment, Upstash Redis, Supabase (PostgreSQL), Resend, Google Apps Script |

### Out of Scope (Deferred or Blocked)

| Item | Reason |
|---|---|
| Cancel / Return flow | Blocked — waiting on Scott's written return policy |
| Print label / invoice redesign | Deferred — waiting on Scott's sample format |
| US shipping / tax configuration | Deferred — Canada-first launch |
| Facebook / Instagram social setup | Robin handling |
| Business email activation | Scott/Robin — Microsoft 365 purchased, not activated |
| 29 product photos | Blocked — Australian suppliers dropped the ball |
| Competitive pricing research | Blocked — requires product specs from Scott/suppliers |

---

## 4. Technical Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16 (App Router) | Server Components, Server Actions, Route Handlers |
| Language | TypeScript | Latest | Strict mode |
| Styling | Tailwind CSS | v4 | `@theme {}` in globals.css — no tailwind.config.ts |
| UI Components | Custom | — | No shadcn, no component library |
| State Management | Zustand | Latest | Cart store (crateStore), customer store |
| Cart Persistence | localStorage | — | `acme-crate` key, synced to Shopify |
| Session (Customer) | iron-session | Latest | HTTP-only cookie, server-side |
| Session (Admin) | iron-session | Latest | Separate cookie from customer |
| Commerce Backend | Shopify | Storefront API 2024-07 + Admin API 2026-04 | Both APIs in use |
| Database | Supabase | PostgreSQL | Reviews, subscribers, campaigns, messages, analytics |
| Cache / KV Store | Upstash Redis | REST API | Rate limiting, CMS content, admin OTP, password hash |
| Email | Resend | Latest | Transactional + marketing emails |
| Contact Form | Google Apps Script | — | Logs to Google Sheets, emails recipients |
| Deployment | Vercel | — | Auto-deploy from main branch |
| Analytics | Vercel Analytics + GA4 | — | Dual tracking |
| Search Console | Google Search Console | — | Sitemap submitted, verified via HTML tag |
| Font | Playfair Display, Inter, JetBrains Mono, Geist | — | Google Fonts via next/font |

---

## 5. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Customer Browser                      │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                 Vercel (Next.js 16)                      │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │   Storefront     │  │      Admin Dashboard          │ │
│  │  /app/(routes)   │  │     /app/admin/(routes)       │ │
│  └──────────────────┘  └──────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐  │
│  │              API Routes /app/api/                  │  │
│  └────────────────────────────────────────────────────┘  │
└──────┬──────────┬──────────┬──────────┬──────────────────┘
       │          │          │          │
┌──────▼──┐  ┌───▼────┐ ┌───▼────┐ ┌──▼──────────┐
│ Shopify │  │Supabase│ │Upstash │ │   Resend    │
│Storefront│  │  (PG)  │ │ Redis  │ │   Email     │
│Admin API│  └────────┘ └────────┘ └─────────────┘
└─────────┘
```

### Request Flow (Storefront Page)

```
Browser Request
  → Vercel Edge (CDN cache check)
  → Next.js Server Component (async)
  → Shopify Storefront API (products/collections)
  → Redis (CMS content)
  → Supabase (reviews)
  → HTML rendered server-side → streamed to browser
  → Client hydration (Zustand stores, cart sync)
```

### Request Flow (Admin Action — e.g. Fulfill Order)

```
Admin clicks "Mark In Transit"
  → Client POST to /api/admin/orders/[id]/fulfill
  → iron-session validation (admin auth check)
  → Shopify Admin API (fulfillmentCreate)
  → lib/admin/shopifyAdmin.ts incrementSoldCount()
  → Shopify Admin API (metafieldUpdate on product)
  → Resend (fulfillment email to customer)
  → 200 OK → UI updates
```

---

## 6. Development Methodology

### Phase-Gated Development

The project used a phase-gated approach: each phase had a defined scope and required explicit approval before the next phase began. This prevented scope creep and gave the client clear checkpoints.

### Subagent-Driven Development (SDD)

For complex multi-file features, a structured SDD process was used:

1. **Brainstorm** — explore requirements, edge cases, design decisions
2. **Spec** — write a detailed feature specification
3. **Plan** — break into discrete numbered tasks with file-level detail
4. **Execute** — implement task-by-task, each reviewed before the next
5. **Review** — code review pass after completion
6. **E2E Test** — manual end-to-end test in production

SDD was used for: Communications Hub, Promotional Email System, Product Reviews, Back-in-Stock Notifications, Analytics & Activity Log, Order Tracking, and more.

### Code Review Standard

Every major feature went through a structured code review before merge, checking for:
- Security vulnerabilities (injection, auth bypass, data exposure)
- Race conditions
- Missing error handling at system boundaries
- TypeScript type correctness
- Performance issues (N+1 queries, missing cache)

### Key Engineering Rules (Learned During Project)

1. **Never module-level `createClient()` in Next.js API routes** — use `getSupabase()` lazy function to avoid Vercel build-time failures
2. **Always update both mock data files** when adding required fields to types — `lib/admin/mockData.ts` AND `lib/mockData.ts`
3. **Never put tokens/secrets in plan docs or specs** — use env var names only
4. **Never run git push/commit** — client handles all git operations manually
5. **`ADMIN_PASSWORD_HASH` in `.env.local` must use single quotes** — double quotes cause dotenv-expand to mangle `$` signs in bcrypt hashes

---

## 7. Development Timeline — Phase by Phase

### Phase 0 — Bootstrap & Design System (May 2026)
- Next.js 16 project scaffolded
- Tailwind v4 configured with custom design tokens (`@theme {}` in globals.css)
- Color palette established: parchment, brass, ink-iron, antique-gold
- Typography: Playfair Display (serif/headings), Inter (sans/body), JetBrains Mono (code)
- Custom CSS variables for fonts

### Phase 1 — Shared Components & Root Layout
- `ShellClient` wrapper (nav + footer)
- `NavLinks` with dropdown (Catalog categories)
- `CrateDrawer` (cart sidebar)
- `Footer` with newsletter subscribe
- `BenchNotesCTA` section
- Root `app/layout.tsx` with full metadata, Open Graph, JSON-LD

### Phase 2 — Storefront (Home Page)
- Hero section
- `CategoryGrid` (bento layout, local images)
- `PickedOffTheBench` (featured products from Shopify)
- `CategoryRows` (Oil Lamp Shades, Glass & Chimneys, Burners & Wicks)
- `TestimonialsWrapper`
- `SearchOverlay` (wired to real Shopify products via `/api/search`)

### Phase 3 — Catalog with Filtering
- `/catalog` page with sidebar filters (category, price range)
- `CatalogClient` — reactive URL-based filtering via `useSearchParams()`
- `ProductCard` with `line-clamp-2`, sold count badge
- `/signs` separate page (Enamel Advertising Signs category)
- Category nav dropdown wired to catalog filters

### Phase 4 — Product Detail Page (PDP)
- `ProductInfo` — title, price, description, colour swatches, quantity stepper
- Single-select and multi-select colour variant modes
- "Buying multiple colours?" opt-in multi-select mode
- `RelatedProducts` (5 products, uniform grid)
- `ProductReviews` section
- Sold count "X sold" pill badge
- JSON-LD Product structured data per PDP

### Phase 5 — Our Story & Heritage Pages
- `/our-story` — headline, intro, image, 3 pillars
- `/heritage` — timeline entries (year/title/body)
- Both CMS-editable via `/admin/content/story`

### Phase 6 — Contact Page
- `/contact` — contact form wired to `/api/contact`
- Newsletter subscribe wired to `/api/newsletter`
- Both proxy to Google Apps Script → Google Sheets + email notification

### Phase 7 — Checkout Flow
- Zustand `crateStore` — cart state, Shopify cart sync
- `cartCreate`, `cartLinesAdd`, `cartLinesUpdate`, `cartLinesRemove`, `cartBuyerIdentityUpdate`
- Cart linked to logged-in customer on login (`cartBuyerIdentityUpdate`)
- Race condition fix: batch-add items queued while `_cartCreating = true`
- Clear cart on logout and on checkout navigation
- `/crate` full page — grouped variant display

### Phase 8 — Account & Sign-In
- Shopify New Customer Accounts (OAuth PKCE, passwordless OTP)
- `/api/auth/authorize` — generates PKCE code_verifier + challenge, redirects to Shopify
- `/api/auth/callback` — exchanges code for access token, stores in iron-session
- `/api/auth/me` — hydrates session on page load
- `/api/auth/profile` — Admin API lookup by email (customer + orders)
- `app/account/page.tsx` — Profile, Orders, Addresses, My Crate tabs
- Address CRUD via Shopify Customer Account API
- Password reset — headless flow via `customerResetByUrl`

### Phase 9 — Polish, Responsiveness & Performance
- Mobile/tablet fixes across all pages
- `line-clamp-2` on ProductCard titles
- CategoryGrid responsive row heights
- CategoryRows horizontal scroll on mobile
- PickedOffTheBench 5th card hidden on mobile (2-col grid)
- Security headers added to `next.config.ts`

### June 5–6, 2026 — Live Wiring & Domain Connection
- Sold count metafield system (Shopify metafield, increments at In Transit)
- Customers page wired to real Shopify Admin API
- Analytics page — live revenue, orders, top products
- Domain `acmevintagesupply.com` connected via GoDaddy → Vercel DNS
- Coleman Pressure Lamp published to Storefront sales channel
- Admin overview dashboard — all real Shopify data

### June 9–10, 2026 — Products, Variants, Cart
- 11 new products added to Shopify via Admin API (with images from PDF)
- Color variant support — admin product form + storefront swatches + cart guard
- Multi-colour cart (opt-in, per-colour qty, grouped display)
- Catalog nav dropdown — Books & Guides + Signs added
- Contact form + newsletter wired to Google Apps Script
- Admin overview dashboard fully live (real Shopify data)

### June 11, 2026 — SEO Pass
- FAQPage JSON-LD structured data
- Server/client FAQ split (server component wraps client accordion)
- Shipping/Returns page metadata
- BreadcrumbList JSON-LD on all PDPs
- `robots.txt` fix (was blocking Googlebot)
- `sitemap.xml` — dynamic, all products + static routes
- Canonical tags

### June 11, 2026 — Security Hardening
- Admin OTP 2FA login (email code, 10-min expiry)
- bcrypt password hashing (cost factor 12)
- Upstash rate limiting (5 attempts/15min on login)
- Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy, Permissions-Policy
- COOP/CORP headers
- `poweredByHeader: false`

### June 12, 2026 — CMS Sub-projects 2 & 4
- Home page CMS — Hero, Bench, Testimonials editable via `/admin/content/home`
- Footer pages CMS — FAQ, Shipping, Returns editable via `/admin/content/footer`
- All content stored in Upstash Redis, falls back to `/data/*.json`

### June 16, 2026 — CMS Sub-project 3 + Auth Fixes + Homepage Overhaul
- Our Story + Heritage Timeline CMS — `/admin/content/story`
- Content sub-nav across all 3 content sections
- Admin login auth fixes (bcrypt hash env var, ADMIN_EMAIL multi-recipient, forgot password split)
- Admin password reset — Redis-backed (no redeploy needed), eye icons, strength bar, real-time match
- Search wired to real Shopify products (removed all mockProducts)
- CategoryGrid complete redesign (bento, local images 01–05)
- CategoryRows new section (3 category rows, 5 products each)
- RelatedProducts 5-product uniform grid

### June 18, 2026 — Cleanup & Corrections
- "Pune/50" references removed from 7 files (business was from Melbourne, not Pune)
- Hero redesign + dusty mosaic background
- Aladdin™ trademark fix (all non-hashtag references get ™ symbol)
- Hinks Globe lamp draft
- Acme Sign renames

### June 19, 2026 — Reviews + CSV Import
- Product Reviews system (Supabase)
- Admin review moderation (activate/deactivate/delete)
- 3-state status column (pending/active/inactive)
- Helpful votes
- Verified purchase badge
- CSV bulk import tool for products
- Shipping weights added to product form

### June 20, 2026 — CMS Cache Fix + Heritage Content
- `force-dynamic` added to 6 pages (CMS content wasn't updating after Redis write)
- Heritage page images + full text wired into admin CMS

### June 23, 2026 — Analytics + Activity Log + Back-in-Stock
- Traffic analytics page (page views, top pages, devices)
- Admin activity log (tracks all admin actions)
- Back-in-stock notification system (Supabase + Resend)
- Resend domain fix
- Horizontal progress stepper (order tracking)
- Order tracking direct URL (`/track-order/[orderName]?email=`)
- Email templates updated (4/5 done)

### June 24, 2026 — Email Templates + Auth Hardening
- Email duplicate button fix
- All 5 Shopify email templates confirmed
- Auth flow hardened (6 fixes, 1 commit)
- Client meeting with Scott

### June 25, 2026 — Payments + Communications Hub
- Shopify Payments activated (Robin)
- Upstash Redis token rotated (security incident — exposed in git)
- Supabase RLS policies applied (Migration 005)
- Notification bell upgraded (badge, severity colors, localStorage dismiss)
- New-order email webhook (Shopify → Vercel → Resend → admin email)
- Inline price editing on inventory page
- Communications Hub built via SDD (7 tasks):
  - Contact Inbox (Supabase)
  - Restock Waitlist
  - Bench Notes
- Vercel build error fixed (lazy Supabase client pattern)

### June 26, 2026 — Promotional Email System
- Newsletter subscribers table (Supabase Migration 007)
- Email campaigns table
- `sendNewsletter()` — batched Resend, personalized unsubscribe links
- Admin marketing page — Subscribers tab + Campaigns tab
- Campaign builder (compose, send, status tracking)
- Weekly auto-send cron (Monday 12:00 UTC, Vercel cron)
- Atomic send lock (prevents double-send race condition)
- E2E testing — all 7 sections passed

### June 27, 2026 — Email Preview + Template Library
- Full-screen email preview modal (desktop/mobile toggle, ESC close)
- Send from modal
- iframe sandbox hardened (maximum restriction)
- HTML escape helper for all user-typed content
- Template Library tab (4 pre-built branded templates)
- Live thumbnail previews (scaled-down iframe)
- "Use Template" prefills compose form
- Supabase Migration run (template + template_data columns)
- MARKETING-FEATURE-BRIEF.md created
- SOCIAL-CALENDAR-CORRECTIONS.md created

### June 29, 2026 (Today)
- Sold count metafields reset to 0 (script: `scripts/reset-sold-counts.mjs`)
- Google Analytics 4 installed (G-DNRSCCRHPN)
- Google Search Console verified + sitemap submitted (63 pages)
- Post-checkout GA4 purchase event added to Shopify order status page
- Security review request submitted to Google (deceptive pages false positive)

---

## 8. Storefront Features

### Navigation
- Sticky header with logo, nav links, search icon, account icon, cart icon
- Catalog dropdown with all 7 categories
- Mobile hamburger menu
- Skip to content link (accessibility)

### Search
- Full-screen overlay search
- Real-time search against all Shopify products
- Results cached in `fetchedRef` (re-opening is instant, no re-fetch)
- 60s CDN cache on `/api/search` route

### Home Page
**Hero Section**
- Headline, subheadline, CTA button
- CMS-editable via `/admin/content/home`

**CategoryGrid (Bento Layout)**
- 5 tiles: Lighting Fixtures, Glass Shades & Chimneys, Burners & Wicks, Reproduction Signs, Shop All CTA
- Desktop: 3-col, 2-row × 350px
- Tablet: 2-col, 3-row × 260px
- Mobile: 2-col, 3-row × 200px
- Local images in `/public/`

**PickedOffTheBench**
- 5 featured products from Shopify (tag: `featured`)
- Real-time Shopify data

**CategoryRows**
- 3 rows: Oil Lamp Shades, Glass & Chimneys, Burners & Wicks
- 5 products per row, fetched in parallel
- Horizontal scroll on mobile

**Testimonials**
- CMS-editable via `/admin/content/home`

**BenchNotesCTA**
- Newsletter subscribe CTA
- Wired to `/api/newsletter` → Google Apps Script → Supabase

### Catalog Page (`/catalog`)
- URL-based filtering via `useSearchParams()` (category, price)
- Sidebar with category pills + price range
- Reactive — URL changes update filter without page remount
- `ProductCard` with:
  - Aspect ratio `4/5`
  - `line-clamp-2` title
  - Sold count badge (bottom-left, green, shows only if > 0)
  - Price
  - "Add to Crate" button

### Product Detail Page (`/product/[handle]`)
- Title, price, description
- Colour swatches (single-select by default)
- "Buying multiple colours?" — opt-in multi-select mode with per-colour qty table
- Quantity stepper
- Add to Crate button
- Sold count "X sold" pill
- Variant error guard (prevents adding to cart if no variant selected)
- Related Products (5 products, grid)
- Product Reviews section
- JSON-LD Product structured data

### Cart (Crate)
**CrateDrawer (sidebar)**
- Opens on cart icon click
- Grouped variant display (colour items grouped under product name)
- Item count badge
- Order summary (subtotal, note)
- "View Full Crate" → `/crate` (or `/account?tab=crate` if logged in)
- "Proceed to Checkout" → Shopify checkout

**Crate Page (`/crate`)**
- Full cart page with grouped variant display
- Same checkout flow

### Account (`/account`)
- Tabs: Profile, Orders, Addresses, My Crate
- Profile: display name, email
- Orders: list with status, product images, prices, fulfillment status
- Addresses: add/edit/delete/set default (Shopify Customer Account API)
- My Crate: live cart items, order summary, checkout button

### Authentication (Customer)
- Passwordless OTP via Shopify New Customer Accounts
- OAuth PKCE flow
- No password forms — Shopify hosted auth page
- iron-session HTTP-only cookie

### Order Tracking (`/track-order`)
- Enter order number + email
- Fetches from Shopify Admin API
- Full fulfillment event timeline (IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, etc.)
- Direct URL: `/track-order/ACMEORDER-1027?email=...`
- Horizontal progress stepper

### Our Story (`/our-story`)
- Headline, intro paragraph, image, 3 content pillars
- Real OLC backstory content

### Heritage (`/heritage`)
- Timeline of historical entries (year/title/body)
- Sub-navigation between Our Story and Heritage

### Footer Pages
- FAQ (`/faq`) — accordion, FAQPage JSON-LD
- Shipping (`/shipping`) — policy content
- Returns (`/returns`) — policy content
- All CMS-editable

### Contact (`/contact`)
- Contact form → `/api/contact` → Supabase + admin email alert
- Name, email, subject, message fields

---

## 9. Admin Dashboard Features

All admin pages are protected by iron-session admin auth (OTP 2FA).

### Overview (`/admin`)
- Stat cards: revenue (30-day), orders (30-day), customers, avg order value
- Revenue chart (90-day, real Shopify data)
- Orders chart (90-day)
- Recent orders (8 most recent)
- Low stock alerts (stock ≤ 3)
- Top products (by revenue)
- All-time summary (total orders, fulfilled count, repeat customer rate)
- Notification bell (new orders, low stock — severity colors, badge count)

### Orders (`/admin/orders`)
- List of all orders from Shopify (real-time)
- Order detail page:
  - Customer info, line items (with variant colour), totals
  - Fulfillment timeline (add events: Confirmed → Packed → In Transit → Out for Delivery → Delivered)
  - Print shipping label (with CONTENTS section)
  - Print invoice
  - Send fulfillment email button
- **Sold count increments automatically when order marked "In Transit"**

### Inventory (`/admin/inventory`)
- All products with current stock levels
- Inline stock editing (click → type → Enter → Shopify updated)
- Inline price editing (same pattern)
- Sortable by stock level

### Products (`/admin/products`)
- Product list with sortable Sold column
- New product form:
  - Title, description, price, compare-at price, category, tags
  - Colour variant toggle (per-colour price + stock rows)
  - Image upload
  - Duplicate product detection (409 + amber warning banner)
- Edit product:
  - Existing variants → `productVariantsBulkUpdate`
  - New variants → `productVariantsBulkCreate`
  - (Bug fix: editing existing + adding new colours now both persist)
- All products published to Storefront sales channel on create

### Customers (`/admin/customers`)
- Customer list from Shopify Admin API
- Customer detail: profile + all orders filtered by email
- CSV export

### Analytics (`/admin/analytics`)
- Traffic analytics: page views, top pages, devices
- Revenue stats (live Shopify)
- Order counts (live Shopify)
- Top products (live Shopify)
- Admin activity log (all admin actions tracked)

### Reviews (`/admin/reviews`)
- All product reviews from Supabase
- 3-state status: pending / active / inactive
- Activate, deactivate, delete actions
- Star rating, review text, reviewer name, date

### Communications (`/admin/communications`)
- **Restock Waitlist tab** — grouped by product, pending count, collapsible subscribers, Notify button
- **Contact Inbox tab** — all contact form submissions, filter All/Unread/Replied, mark read/replied, delete, reply via mailto
- **Bench Notes tab** — internal team notes, pin/unpin, 3-column grid

### Marketing (`/admin/marketing`)
- **Subscribers tab** — full subscriber list from Supabase, subscriber count, CSV export
- **Campaigns tab** — compose + send campaigns
  - 3 builder types: Bench Notes, New Arrivals, Seasonal Sale
  - Product picker (pulls from Shopify)
  - Template selector
  - Full-screen preview modal (desktop/mobile toggle)
  - Send Now button (atomic lock prevents double-send)
  - Campaign history table (sent_at, recipient count, status)
- **Template Library tab** — 4 pre-built templates:
  - Monthly Bench Notes
  - New Arrivals Spotlight
  - Seasonal Sale
  - Restock Alert
  - Each shows live thumbnail preview, "Use Template" prefills compose

### Content CMS (`/admin/content`)
Sub-nav across 3 sections:

**Home Page** (`/admin/content/home`)
- Hero: headline, subheadline, CTA text + link
- Bench section: heading, body
- Testimonials: CRUD (add/edit/delete testimonials)

**Story & Heritage** (`/admin/content/story`)
- Our Story tab: headline, intro, image upload, pillars CRUD
- Heritage Timeline tab: year/title/body entry CRUD

**Footer Pages** (`/admin/content/footer`)
- FAQ tab: CRUD for question/answer pairs
- Shipping tab: rich text content
- Returns tab: rich text content

### Admin Auth (`/admin/login`)
- Email step → OTP step (6-digit code, 10-min expiry)
- Remember Me checkbox → 7-day session vs 8-hour default
- Forgot password flow → email with reset link
- Reset password page: strength bar, real-time match validation, eye icons
- Password stored in Upstash Redis (no redeploy needed to change)
- Rate limited: 5 attempts / 15 minutes (Upstash sliding window)

---

## 10. Third-Party Integrations

### Shopify
- **Store:** `w061f6-k8.myshopify.com`
- **Storefront API** — products, collections, cart, checkout, customer auth
- **Admin API** — orders, fulfillments, inventory, customers, analytics, metafields
- **Webhooks** — new order alert → admin email
- **New Customer Accounts** — OAuth PKCE, passwordless OTP
- **Shopify Payments** — activated June 25, payouts to RBC ******5312

### Supabase (PostgreSQL)
- **Tables:** reviews, review_helpful_votes, back_in_stock_requests, admin_activity_log, page_views, contact_messages, bench_notes, newsletter_subscribers, email_campaigns
- **RLS:** enabled on all tables (service_role only via `USING (false)`)
- **Auth:** not used (admin auth is custom; customer auth is Shopify)

### Upstash Redis
- **Rate limiting** — admin login (5 req/15min), unsubscribe (10 req/min)
- **CMS content storage** — home, story, heritage, footer pages
- **Admin OTP storage** — temporary codes with TTL
- **Admin password hash** — `acme:admin:password_hash` key (updateable without redeploy)
- **Pending OTP records** — `acme:pending_otp:{email}` with rememberMe flag

### Resend (Email)
- **Transactional emails:** order confirmation, fulfillment, back-in-stock, contact alert, new-order admin alert, admin reset password
- **Marketing emails:** newsletter campaigns (batched, personalized unsubscribe links)
- **From address:** `noreply@acmevintagesupply.com` (domain verified on Resend)
- **Recipients (admin):** jonathan.mauring17@gmail.com, scottsfi@hotmail.com, acmesign01@gmail.com

### Google Apps Script
- **Contact form proxy** — receives POST from `/api/contact`, logs to "ContactAcme" Google Sheet, emails both recipients
- **Newsletter proxy** — receives POST from `/api/newsletter`, logs to "Subscriber" Google Sheet
- Single Apps Script endpoint differentiates by `data.type === 'newsletter'`

### Vercel
- **Hosting** — auto-deploy from main branch
- **Cron jobs** — weekly newsletter send (Monday 12:00 UTC)
- **Analytics** — Vercel Analytics (page views, web vitals)
- **Environment Variables** — all secrets stored in Vercel dashboard

### Google Analytics 4
- **Property:** Acme Vintage Supply
- **Measurement ID:** G-DNRSCCRHPN
- **Installed via:** `next/script` with `strategy="afterInteractive"`
- **Purchase event:** fires on Shopify order status page (Liquid snippet)
- **Enhanced measurement:** on (scrolls, outbound clicks, etc.)

### Google Search Console
- **Property:** https://www.acmevintagesupply.com
- **Verified via:** HTML meta tag (`google-site-verification`)
- **Sitemap submitted:** `/sitemap.xml` — 63 pages discovered

### GoDaddy (DNS)
- Domains: `acmevintagesupply.com`, `acmevintagesupply.ca`
- DNS records point to Vercel (A → 216.198.79.1, CNAME → Vercel)
- Note: Domain NOT connected in Shopify → Domains (would overwrite GoDaddy DNS)

---

## 11. Shopify Integration Deep Dive

### Two APIs in Use

**Storefront API** (`lib/shopify.ts`, `lib/shopifyCustomer.ts`, `lib/shopifyCart.ts`)
- Public-facing, uses `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- Products, collections, search, cart operations, customer auth (legacy + password reset)
- Endpoint: `https://w061f6-k8.myshopify.com/api/2024-07/graphql.json`

**Admin API** (`lib/admin/shopifyAdmin.ts`)
- Server-side only, uses `SHOPIFY_ADMIN_TOKEN`
- Orders, fulfillments, inventory, customers, analytics, metafields, products CRUD, webhooks
- Endpoint: `https://w061f6-k8.myshopify.com/admin/api/2026-04/graphql.json`

### Cart Architecture
```
crateStore (Zustand + localStorage)
  ├── items[] — local cart state
  ├── shopifyCartId — Shopify cart GID
  ├── checkoutUrl — Shopify checkout URL
  └── _customerToken — set by initCart(token) after login

addItem() flow:
  1. Update local Zustand state
  2. If no shopifyCartId: cartCreate() → get ID + checkoutUrl
  3. If cartCreating: queue item, batch-add after cart resolves
  4. cartLinesAdd() to Shopify
  5. If user logged in: cartBuyerIdentityUpdate() → links cart to customer email
```

### Customer Auth (OAuth PKCE)
```
/api/auth/authorize
  → generateCodeVerifier() + generateCodeChallenge()
  → Store verifier in iron-session
  → Redirect to https://shopify.com/authentication/99152462129/oauth/authorize

Shopify hosted page:
  → Customer enters email → receives OTP code → authenticates

/api/auth/callback?code=...&state=...
  → Exchange code for access_token
  → Store in iron-session
  → Redirect to /account

/api/auth/profile
  → Admin API lookup by email (2 parallel queries: customer + orders)
  → Normalizes data → returns to customerStore
```

### Sold Count System
```
Shopify metafield: namespace="acme", key="sold_count", type="number_integer"

Flow:
  Admin marks order "In Transit"
  → AddFulfillmentEventModal sends lineItems (productId + quantity)
  → /api/admin/orders/[id]/fulfill
  → incrementSoldCount(lineItems)
  → For each product: read current sold_count → add quantity → write back
  → Storefront reads metafield → shows "X sold" badge if > 0
```

### Metafields on Products
All products have `acme` namespace metafields:
`material`, `colour`, `style`, `brand`, `vintage`, `fits`, `era`, `power_source`, `condition`, `net_weight`, `sold_count`

### Webhook Architecture
```
Shopify fires: POST https://acmelampandsign.vercel.app/api/webhooks/shopify
  (Must use Vercel URL, not storefront domain — Shopify webhooks don't follow custom domains)
  → HMAC-SHA256 signature verification (SHOPIFY_WEBHOOK_SECRET)
  → topic === 'orders/create' → sendNewOrderAdminAlert()
  → Resend email to all 3 admin recipients
```

---

## 12. Authentication Systems

### Customer Authentication
- **Type:** Shopify New Customer Accounts (OAuth PKCE)
- **Flow:** Passwordless — email OTP via Shopify hosted page
- **Token storage:** iron-session HTTP-only cookie
- **Session hydration:** `/api/auth/me` on page load → restores token → `fetchProfile()`
- **Profile fetch:** Admin API (2 parallel queries by email) — single strategy, no fallback

### Admin Authentication
- **Type:** Custom email + OTP 2FA
- **Step 1:** Enter email → system validates against `ADMIN_EMAIL` env var (comma-separated list)
- **Step 2:** 6-digit OTP code sent via Resend → user enters code → validated against Redis
- **Password:** bcrypt (cost 12) stored in Upstash Redis (`acme:admin:password_hash`)
- **Session:** iron-session, 8 hours default, 7 days with Remember Me
- **Rate limiting:** Upstash sliding window (5 attempts / 15 minutes)
- **Forgot password:** Resend email with reset link → `/admin/reset-password`
- **Reset:** New hash written to Redis — takes effect immediately, no redeploy needed

---

## 13. Database Architecture (Supabase)

### Tables

**`reviews`**
```sql
id uuid PRIMARY KEY
product_id text NOT NULL
product_handle text NOT NULL
reviewer_name text NOT NULL
reviewer_email text
rating integer (1-5)
title text
body text
status text DEFAULT 'pending' -- pending | active | inactive
verified_purchase boolean DEFAULT false
created_at timestamptz DEFAULT now()
```

**`review_helpful_votes`**
```sql
id uuid PRIMARY KEY
review_id uuid REFERENCES reviews
session_id text NOT NULL
created_at timestamptz DEFAULT now()
UNIQUE(review_id, session_id)
```

**`back_in_stock_requests`**
```sql
id uuid PRIMARY KEY
product_id text NOT NULL
product_handle text NOT NULL
product_title text NOT NULL
email text NOT NULL
notified_at timestamptz
created_at timestamptz DEFAULT now()
UNIQUE(product_id, email)
```

**`admin_activity_log`**
```sql
id uuid PRIMARY KEY
admin_email text NOT NULL
action text NOT NULL
resource_type text
resource_id text
details jsonb
created_at timestamptz DEFAULT now()
```

**`page_views`**
```sql
id uuid PRIMARY KEY
path text NOT NULL
referrer text
user_agent text
created_at timestamptz DEFAULT now()
```

**`contact_messages`**
```sql
id uuid PRIMARY KEY
name text NOT NULL
email text NOT NULL
subject text
message text NOT NULL
read_at timestamptz
replied_at timestamptz
created_at timestamptz DEFAULT now()
```

**`bench_notes`**
```sql
id uuid PRIMARY KEY
title text NOT NULL
body text
pinned boolean DEFAULT false
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

**`newsletter_subscribers`**
```sql
id uuid PRIMARY KEY
email text UNIQUE NOT NULL
subscribed_at timestamptz DEFAULT now()
unsubscribed_at timestamptz
source text DEFAULT 'footer'
```

**`email_campaigns`**
```sql
id uuid PRIMARY KEY
subject text NOT NULL
body text NOT NULL
status text DEFAULT 'draft' -- draft | sending | sent | failed
sent_at timestamptz
recipient_count integer DEFAULT 0
template text NOT NULL DEFAULT 'bench_notes'
template_data jsonb
created_at timestamptz DEFAULT now()
```

### Migrations Applied
| # | File | Description |
|---|---|---|
| 001 | `001_reviews.sql` | reviews + review_helpful_votes |
| 002 | `002_admin_activity_log.sql` | admin_activity_log |
| 003 | `003_page_views.sql` | page_views |
| 004 | `004_back_in_stock.sql` | back_in_stock_requests |
| 005 | `005_rls.sql` | RLS policies on all tables |
| 006 | `006_communications.sql` | contact_messages + bench_notes |
| 007 | `007_newsletter.sql` | newsletter_subscribers + email_campaigns |
| 008 | `008_email_template_columns.sql` | template + template_data on email_campaigns |

---

## 14. Caching Architecture (Upstash Redis)

### Key Patterns

| Key | Type | TTL | Purpose |
|---|---|---|---|
| `acme:admin:password_hash` | String | None | bcrypt hash of admin password |
| `acme:pending_otp:{email}` | JSON String | 10 min | OTP code + rememberMe flag |
| `acme:admin:session:{id}` | String | 8h / 7d | Admin session token |
| `acme_admin_login:::1:{bucket}` | Counter | Sliding 15min | Rate limit — login attempts |
| `acme_unsubscribe:::1:{bucket}` | Counter | Sliding 1min | Rate limit — unsubscribe |
| `content:home` | JSON String | None | CMS home page content |
| `content:story` | JSON String | None | CMS Our Story content |
| `content:heritage` | JSON String | None | CMS Heritage Timeline |
| `content:footer` | JSON String | None | CMS footer pages content |

### Content Fallback Strategy
```
Storefront reads CMS content:
  1. Try Upstash Redis (getContent('home'))
  2. If null/error: fall back to /data/home.json (static file)
  3. Render with whichever succeeds
```

---

## 15. Email System Architecture

### Transactional Emails (Resend)

| Email | Trigger | Template |
|---|---|---|
| Order Confirmation | Shopify auto | Shopify template (customized) |
| Order Fulfillment | Admin marks In Transit | Shopify template (customized) |
| Order Delivered | Admin marks Delivered | Shopify template (customized) |
| Back-in-Stock | Admin clicks "Notify Waiting" | Custom HTML (Resend) |
| Contact Form Alert | Customer submits contact form | Custom HTML (Resend) |
| New Order Admin Alert | Shopify webhook fires | Custom HTML (Resend) |
| Admin Password Reset | Forgot password flow | Custom HTML (Resend) |

### Marketing Email System

**Subscribe Flow:**
```
Customer enters email in footer/CTA
  → POST /api/newsletter
  → Supabase upsert newsletter_subscribers (atomic, handles duplicates)
  → Google Apps Script (log to Google Sheets)
```

**Campaign Send Flow:**
```
Admin composes campaign
  → POST /api/admin/marketing/campaigns/[id]/send
  → Atomic status update: 'draft' → 'sending' (prevents double-send)
  → Fetch all active subscribers from Supabase
  → Batch send via Resend (personalized unsubscribe link per email)
  → Update campaign: status → 'sent', sent_at, recipient_count
```

**Weekly Cron:**
```
Vercel cron: 0 12 * * 1 (Monday 12:00 UTC)
  → GET /api/cron/newsletter (CRON_SECRET header auth)
  → Finds oldest unsent 'draft' campaign
  → Triggers same send flow
```

**Unsubscribe Flow:**
```
Customer clicks unsubscribe link
  → GET /unsubscribe?token={email_hash}
  → Supabase update: unsubscribed_at = now()
  → Rate limited: 10 req/min (Upstash)
```

### Email Preview Security
- iframe `sandbox=""` (maximum restriction — no scripts, no same-origin)
- All user-typed content escaped via `esc()` helper before rendering into iframe
- Prevents XSS in preview

---

## 16. CMS Architecture

### Design Decision
Sanity CMS was evaluated and dropped. Replaced with local JSON files in `/data/` as fallback and Upstash Redis as the live content store.

**Reasons:**
- Sanity adds deployment complexity and cost
- Content is simple (text, images, lists) — no need for a full headless CMS
- Redis is already in the stack for rate limiting
- Admin can edit content directly in the custom dashboard

### Content Flow

```
Admin edits content in /admin/content/[section]
  → POST /api/admin/content/[section]
  → setContent(section, data) → Upstash Redis SET
  → 200 OK

Storefront renders page:
  → getContent(section) → Upstash Redis GET
  → If null: read /data/[section].json (static fallback)
  → Render with content
```

### Force-Dynamic Pages
All CMS-powered pages use `export const dynamic = 'force-dynamic'` to prevent Next.js from caching the page at build time and serving stale content after Redis updates.

---

## 17. Security Implementation

### Admin Login Security
- Email allowlist (`ADMIN_EMAIL` env var, comma-separated)
- 6-digit OTP (Resend email, 10-min TTL in Redis)
- bcrypt password verification (cost 12, Redis-backed)
- Rate limiting: 5 attempts / 15 minutes (Upstash)
- 7-day Remember Me sessions

### HTTP Security Headers
All applied in `next.config.ts`:

| Header | Value | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS |
| `X-Frame-Options` | `SAMEORIGIN` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer data |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable unused browser APIs |
| `Content-Security-Policy` | Custom policy | Prevent XSS/injection |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` | Allows Shopify checkout popup |
| `Cross-Origin-Resource-Policy` | `cross-origin` | Allows Shopify CDN assets |
| `X-Powered-By` | Removed | Hides framework fingerprint |

### Supabase RLS
All tables have Row Level Security enabled with `USING (false)` for public role — only `service_role` (server-side) can read/write.

### Security Incident
Upstash Redis REST token was accidentally exposed in a git push (PR #8286955). Token was immediately rotated, new token added to Vercel + `.env.local`. No unauthorized access confirmed.

---

## 18. SEO Implementation

### Metadata (Next.js Metadata API)
- Page titles: `%s | Acme Vintage Supply`
- Full keyword array (40+ keywords: oil lamp chimneys, shades, burners, signs, etc.)
- Open Graph (type, locale `en_CA`, images, description)
- Twitter card
- Canonical URLs
- `google-site-verification` meta tag

### Structured Data (JSON-LD)

| Schema Type | Applied To |
|---|---|
| `Store` | Root layout (all pages) |
| `Product` | Every PDP |
| `BreadcrumbList` | Every PDP |
| `FAQPage` | FAQ page |

### Technical SEO
- `sitemap.xml` — dynamic, regenerates with all products + static routes — 63 pages discovered
- `robots.txt` — allows Googlebot (was incorrectly blocking before fix)
- `force-dynamic` on CMS pages (prevents stale static HTML)
- Image `alt` tags on all product images
- Semantic HTML headings (h1, h2, h3 hierarchy)

### Google Search Console
- Property: https://www.acmevintagesupply.com
- Verified via HTML meta tag
- Sitemap submitted — 63 pages, Status: Success
- Security review requested (deceptive pages false positive on new domain)

---

## 19. Analytics & Monitoring

### Vercel Analytics
- Built-in, enabled via `<Analytics />` in root layout
- Tracks page views, Core Web Vitals, geographic breakdown

### Custom Admin Analytics
- `page_views` table in Supabase
- `PageViewTracker` component fires on every route change
- Admin analytics page shows: top pages, traffic over time, device breakdown

### Admin Activity Log
- Every admin action writes to `admin_activity_log`
- Tracks: who, what action, on which resource, when
- Visible in admin analytics page

### Google Analytics 4 (GA4)
- Measurement ID: `G-DNRSCCRHPN`
- Installed via `next/script` `afterInteractive` strategy
- Purchase event fires on Shopify order status page (Liquid snippet)
- Enhanced measurement: page views, scrolls, outbound clicks, file downloads

### Google Search Console
- Search performance (impressions, clicks, CTR, position)
- Coverage (indexed pages, errors)
- Core Web Vitals report

---

## 20. Scope & Limitations

### Technical Limitations

**Shopify Plan Constraints:**
- Sessions / Conversion Rate data not available (requires Shopify Plus)
- Abandoned Checkouts data not available (requires Shopify Plus)
- Real-time inventory sync has 1-2 second delay (API round-trip)

**Customer Account API:**
- Shopify's Customer Account API (CA API) was evaluated but abandoned — the OAuth token format doesn't start with `shcat_` consistently, causing 401 rejections. Single-strategy Admin API profile fetch is used instead.

**CMS Limitations:**
- Rich text editing is plain textarea — no WYSIWYG editor
- Image uploads in CMS are URL-based (no file upload for heritage images)
- Content changes require a Redis write — if Redis is down, content falls back to static JSON

**Email Limitations:**
- Google Apps Script contact proxy has a daily execution quota (Google limit)
- Resend free tier: 100 emails/day — sufficient for current scale, will need upgrade at volume
- Newsletter batch sending is sequential within Resend (not parallel) — large lists will be slow

**Analytics:**
- Admin analytics use Supabase page views, not GA4 data — two separate systems
- GA4 purchase events only fire once (protected by `first_time_accessed` Liquid guard)

### Business Limitations
- 29 products have no photos (waiting on Australian suppliers and Scott)
- 34 products have $0.00 price (waiting on Scott to confirm pricing)
- Cancel/return flow not built (waiting on Scott's written return policy)
- US shipping not configured (Canada-first launch)
- Business email (`scott@acmevintagesupply.ca`) not activated
- Logo not provided (email templates use text fallback)

---

## 21. Known Issues & Workarounds

| Issue | Workaround | Status |
|---|---|---|
| Shopify 401 Pixel Error in console | Harmless — Shopify's own checkout pixel script; disappears on paid plan | Ignored |
| `acmevintagesupply.com` not in Shopify → Domains | Must NOT connect — Shopify overwrites GoDaddy DNS. Next.js on Vercel IS the storefront | Permanent workaround |
| Shopify webhook URL must use Vercel URL | `acmelampandsign.vercel.app/api/webhooks/shopify` — custom domain doesn't work for webhooks | Permanent workaround |
| `revalidateTag()` requires 2 args in this Next.js build | Pass 2 tag strings: `revalidateTag('products', 'layout')` | Fixed |
| bcrypt hash in `.env.local` | Must use single quotes: `ADMIN_PASSWORD_HASH='$2b$12$...'` — double quotes mangle `$` | Documented |
| Supabase `createClient()` at module level breaks Vercel build | Always use `getSupabase()` lazy function in API routes | Fixed + documented |
| Coleman Pressure Lamp not appearing in checkout | Was not published to Storefront sales channel in Shopify | Fixed |
| Rate limit hit 429 on localhost during testing | Clear via Upstash REST API. Key pattern: `acme_admin_login:::1:{bucket}` | Documented |

---

## 22. Lessons Learned

### Architecture
1. **Tailwind v4 is a major paradigm shift** — no config file, everything in `@theme {}`. Don't assume v3 patterns work.
2. **Next.js 16 App Router has edge cases** — `useSearchParams()` requires Suspense, `revalidateTag()` signature changed, template.tsx caused layout warnings.
3. **Never module-level initialize clients** — Supabase, Redis, any async client should be wrapped in a lazy factory function for Next.js compatibility.
4. **Two Shopify APIs serve different purposes** — Storefront API for public data + cart + customer auth; Admin API for everything privileged.
5. **iron-session is simpler than JWT for this use case** — HTTP-only cookie, server-side validation, no client-side token management.

### Development Process
6. **Phase-gated development prevents scope creep** — explicit "Proceed?" before each phase kept the project focused.
7. **SDD (Subagent-Driven Development) works for complex features** — brainstorm → spec → plan → execute → review → E2E test is the right order for features spanning 5+ files.
8. **Code review before merge catches real bugs** — the race condition in newsletter send, the `metafieldUpdate` mutation name, the OTP rate limit — all caught in review.
9. **E2E testing in production is non-negotiable** — staging environments lie; production has different env vars, DNS, cookies.
10. **Mock data must stay in sync** — whenever a required field is added to a TypeScript interface, update BOTH `lib/admin/mockData.ts` AND `lib/mockData.ts` in the same commit.

### Client Management
11. **Non-technical clients need gradual reveals** — don't show everything at once. Show the homepage first, get approval, then reveal the admin dashboard.
12. **Delegate technical tasks to the client's tech-savvy staff** — Robin was more effective than Scott for Shopify Payments, DNS, etc.
13. **Document blockers clearly but gently** — a demanding email to a busy client can damage the relationship. Keep it friendly and solution-focused.
14. **Never hardcode client credentials anywhere** — use env var names only in documentation and code.

### Security
15. **Git history is permanent** — a secret committed even briefly should be rotated immediately, even if the PR is private.
16. **bcrypt hashes contain `$` signs** — single quotes required in `.env.local`, double quotes cause dotenv-expand to mangle the hash.
17. **New domains get false-positive security flags** — Google's "Deceptive pages" warning on a new domain is normal. Submit a review immediately.

---

## 23. Future Roadmap

### Immediate (Unblocked — Developer Can Do Now)
- [ ] 23 without-image products added to Shopify (CSV on Desktop)
- [ ] Submit sitemap to Google Search Console ✅ Done June 29
- [ ] GA4 purchase event on order status page ✅ Done June 29

### Short Term (Waiting on Scott/Robin)
- [ ] 29 product photos uploaded to Shopify
- [ ] 34 products priced (currently $0.00)
- [ ] Product descriptions from Australian suppliers
- [ ] Cancel/Return flow (needs Scott's written policy)
- [ ] Business email `scott@acmevintagesupply.ca` activation
- [ ] Logo file upload (email templates + branding)
- [ ] Facebook + Instagram official pages linked
- [ ] Competitive pricing research (BNP Lamps, Lehman's) — needs product specs

### Medium Term
- [ ] US shipping configuration
- [ ] Print invoice + shipping label redesign (Scott to provide sample format)
- [ ] Journal/Guides pages migrated to CMS
- [ ] WhatsApp Business setup for Scott
- [ ] Google Analytics goals/conversions configuration
- [ ] acmesign.ca website revamp (separate project)
- [ ] Frasco Industrial website reveal to Scott (separate project, built but not shown)

### Long Term
- [ ] US market launch
- [ ] Shopify Plus upgrade (if volume justifies — unlocks abandoned checkouts, sessions data)
- [ ] Full WYSIWYG CMS editor
- [ ] Automated restock from supplier feed
- [ ] Loyalty/rewards program

---

## 24. Key File Reference

### Core Architecture Files

| File | Purpose |
|---|---|
| `app/layout.tsx` | Root layout, metadata, JSON-LD, GA4, fonts |
| `app/page.tsx` | Home page (server component) |
| `next.config.ts` | Security headers, image domains |
| `lib/shopify.ts` | Storefront API — products, search, collections |
| `lib/shopifyCart.ts` | Cart operations (create, add, update, remove, buyer identity) |
| `lib/shopifyCustomer.ts` | Customer auth helpers, address mutations, password reset |
| `lib/admin/shopifyAdmin.ts` | Admin API — orders, products, inventory, customers, analytics, metafields |
| `lib/email.ts` | All Resend email send functions |
| `lib/types.ts` | Storefront TypeScript types |
| `lib/admin/types.ts` | Admin TypeScript types |
| `lib/utils.ts` | `cn()` utility, helpers |
| `lib/cartGrouping.ts` | Cart variant grouping logic, COLOUR_HEX map |
| `lib/customerSession.ts` | iron-session config (customer) |
| `lib/admin/auth.ts` | Admin auth — bcrypt verify, Redis password |
| `lib/admin/mockData.ts` | Admin mock data (fallback, testing) |
| `lib/mockData.ts` | Storefront mock data (fallback) |

### Store Files

| File | Purpose |
|---|---|
| `store/crateStore.ts` | Cart Zustand store — all cart state and Shopify sync |
| `store/customerStore.ts` | Customer Zustand store — auth state, profile |

### Key API Routes

| Route | Purpose |
|---|---|
| `app/api/auth/authorize/route.ts` | OAuth PKCE initiation |
| `app/api/auth/callback/route.ts` | OAuth code exchange |
| `app/api/auth/me/route.ts` | Session hydration |
| `app/api/auth/profile/route.ts` | Admin API profile fetch |
| `app/api/admin/auth/route.ts` | Admin login (email + OTP) |
| `app/api/admin/auth/otp/route.ts` | OTP validation |
| `app/api/admin/orders/[id]/fulfill/route.ts` | Order fulfillment + sold count increment |
| `app/api/admin/inventory/[id]/route.ts` | Inline stock/price update |
| `app/api/admin/marketing/campaigns/[id]/send/route.ts` | Campaign send (atomic lock) |
| `app/api/admin/communications/contacts/route.ts` | Contact inbox CRUD |
| `app/api/webhooks/shopify/route.ts` | New order webhook → admin email |
| `app/api/search/route.ts` | Storefront product search |
| `app/api/contact/route.ts` | Contact form → Supabase + admin alert |
| `app/api/newsletter/route.ts` | Newsletter subscribe → Supabase + Google Sheets |
| `app/api/cron/newsletter/route.ts` | Weekly newsletter cron |

### Scripts

| File | Purpose |
|---|---|
| `scripts/reset-sold-counts.mjs` | One-off: reset all sold_count metafields to 0 |

### Data Files (Static CMS Fallbacks)

| File | Content |
|---|---|
| `data/home.json` | Home page default content |
| `data/story.json` | Our Story default content |
| `data/heritage.json` | Heritage timeline default content |
| `data/footer.json` | FAQ, Shipping, Returns default content |

### Environment Variables Reference

| Variable | Used In | Purpose |
|---|---|---|
| `SHOPIFY_STORE_DOMAIN` | Server | Shopify store domain |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Server | Storefront API auth |
| `SHOPIFY_ADMIN_TOKEN` | Server | Admin API auth |
| `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID` | Server | OAuth PKCE client ID |
| `NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_ID` | Client | Shop ID for OAuth URLs |
| `NEXT_PUBLIC_SITE_URL` | Client + Server | Canonical URL |
| `NEXT_PUBLIC_GA_ID` | Client | GA4 Measurement ID |
| `IRON_SESSION_SECRET` | Server | iron-session encryption key |
| `ADMIN_EMAIL` | Server | Comma-separated admin email list |
| `ADMIN_PASSWORD_HASH` | Server | bcrypt hash (fallback if Redis empty) |
| `UPSTASH_REDIS_REST_URL` | Server | Upstash Redis endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Server | Upstash Redis auth |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase privileged key |
| `RESEND_API_KEY` | Server | Resend email API key |
| `CONTACT_SCRIPT_URL` | Server | Google Apps Script endpoint |
| `SHOPIFY_WEBHOOK_SECRET` | Server | Webhook HMAC verification |
| `CRON_SECRET` | Server | Vercel cron auth header |

---

*Document compiled June 29, 2026 by Peter Paul Abillar Lazan.*  
*For internal reference and future development sessions only.*
