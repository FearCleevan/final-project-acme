# ACME Lamp & Sign — Codebase Overview

> Complete codebase map for developers and AI agents. Covers architecture, data flow, features, functions, and known gaps.
> Last updated: 2026-05-30

---

## 1. Project Identity

**What it is:** A full-stack e-commerce storefront and internal admin panel for ACME Lamp & Sign — a curated shop selling vintage oil lamps, chimneys, shades, wicks, pressure lamps, spreaders, and related books.

**Deployed on:** Vercel  
**Backend:** Shopify (products, orders, inventory — no custom database)

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| UI | React 19, TypeScript 5, Tailwind CSS 4 |
| Animation | Framer Motion 12 |
| State | Zustand 5 (with `persist` middleware) |
| Forms | React Hook Form 7 |
| Charts | Recharts 3 |
| E-commerce | Shopify Storefront API 2025-01 + Admin API 2026-04 |
| Auth (admin) | iron-session 8 (encrypted cookie) |
| Rate limiting | Upstash Redis + @upstash/ratelimit (optional) |
| Email | Resend |
| Icons | react-icons 5 |

---

## 2. Directory Map

```
acme-lamp-sign/
├── app/                        # All Next.js routes (App Router)
│   ├── page.tsx                # Home page
│   ├── layout.tsx              # Root layout (Nav, Footer, Crate drawer, Auth modal)
│   ├── template.tsx            # Page transition wrapper
│   ├── catalog/
│   │   ├── page.tsx            # Catalog listing (SSR, fetches all products)
│   │   ├── CatalogClient.tsx   # Client component: filtering, sorting, search
│   │   ├── layout.tsx          # Catalog layout shell
│   │   └── [slug]/page.tsx     # Product detail page (SSG via generateStaticParams)
│   ├── crate/page.tsx          # Cart page (full crate view)
│   ├── checkout/
│   │   ├── page.tsx            # 3-step checkout accordion
│   │   └── confirmed/page.tsx  # Order confirmation page
│   ├── account/page.tsx        # Customer account (demo orders + saved address)
│   ├── track-order/page.tsx    # Order tracking
│   ├── contact/page.tsx        # Contact form page
│   ├── heritage/page.tsx       # Brand heritage / story
│   ├── our-story/page.tsx      # About page
│   ├── journal/page.tsx        # Blog/journal
│   ├── guides/page.tsx         # Usage guides
│   ├── restoration/page.tsx    # Restoration services
│   ├── shipping/page.tsx       # Shipping info
│   ├── returns/page.tsx        # Returns policy
│   ├── faq/page.tsx            # FAQ
│   ├── legal/                  # Privacy policy, Terms, Accessibility
│   ├── admin/                  # Admin panel (all routes protected by middleware)
│   │   ├── login/page.tsx      # Admin login (password only)
│   │   ├── forgot-password/    # Password reset flow
│   │   ├── reset-password/
│   │   ├── overview/page.tsx   # Dashboard (stats, charts, recent orders)
│   │   ├── products/
│   │   │   ├── page.tsx        # Product list
│   │   │   ├── new/page.tsx    # Create product form
│   │   │   └── [id]/page.tsx   # Edit product form
│   │   ├── orders/
│   │   │   ├── page.tsx        # Order list
│   │   │   └── [id]/page.tsx   # Order detail
│   │   ├── inventory/page.tsx  # Inventory management
│   │   ├── collections/page.tsx # Shopify collections
│   │   ├── customers/
│   │   │   ├── page.tsx        # Customer list
│   │   │   └── [id]/page.tsx   # Customer detail
│   │   └── settings/page.tsx   # Shop settings
│   └── api/
│       ├── test-shopify/route.ts        # Dev utility: test Shopify connection
│       └── admin/
│           ├── auth/route.ts            # POST: login
│           ├── auth/forgot/route.ts     # POST: send reset email
│           ├── auth/reset/route.ts      # POST: reset password
│           ├── logout/route.ts          # POST: destroy session
│           ├── products/route.ts        # GET: list, POST: create
│           ├── products/[id]/route.ts   # GET, PUT, DELETE: single product
│           ├── products/upload/route.ts # POST: image upload
│           ├── products/sync-publish/route.ts # POST: publish product to all channels
│           ├── orders/route.ts          # GET: list orders
│           ├── orders/[id]/route.ts     # GET: single order
│           ├── collections/route.ts     # GET: list Shopify collections
│           ├── shop/route.ts            # GET: shop owner info
│           └── taxonomy/route.ts        # GET: Shopify product categories
│
├── components/
│   ├── home/                   # Homepage sections
│   │   ├── HeroSection.tsx
│   │   ├── ProvenanceSection.tsx
│   │   ├── CategoryGrid.tsx
│   │   ├── PickedOffTheBench.tsx   # Featured products (3 items tagged 'featured')
│   │   ├── TestimonialsCarousel.tsx
│   │   ├── TestimonialsBar.tsx
│   │   └── ParallaxLayer.tsx
│   ├── nav/
│   │   ├── Nav.tsx             # Top navigation bar
│   │   ├── NavLinks.tsx        # Desktop nav links
│   │   ├── NavActions.tsx      # Search, auth, crate icons
│   │   ├── MobileDrawer.tsx    # Mobile hamburger menu
│   │   └── AccountDropdown.tsx # Signed-in user dropdown
│   ├── product/
│   │   ├── ProductGallery.tsx  # Image carousel/lightbox
│   │   ├── ProductInfo.tsx     # Price, variant selector, Add to Crate button
│   │   ├── SpecTable.tsx       # Technical specifications table
│   │   ├── CustomerReviews.tsx # Review display (mock data)
│   │   ├── FitmentBox.tsx      # Burner size compatibility callout
│   │   └── RelatedProducts.tsx # Products from same category
│   ├── catalog/
│   │   ├── CatalogHeader.tsx
│   │   ├── ProductGrid.tsx     # Grid of ProductCard components
│   │   ├── ProductCard.tsx     # Single product card
│   │   ├── FilterSidebar.tsx   # Desktop filter panel
│   │   └── FilterBar.tsx       # Mobile filter bar
│   ├── crate/
│   │   ├── CrateDrawer.tsx     # Slide-out cart drawer
│   │   ├── CrateItem.tsx       # Single item row in drawer
│   │   └── CrateSummary.tsx    # Subtotal + CTA in drawer
│   ├── checkout/
│   │   ├── CheckoutSteps.tsx   # Step indicator (1/2/3)
│   │   ├── ContactShippingForm.tsx
│   │   ├── PaymentForm.tsx
│   │   └── OrderSummary.tsx    # Sidebar: items + totals
│   ├── shared/
│   │   ├── AuthModal.tsx       # Sign in / sign up modal (demo login)
│   │   ├── SearchOverlay.tsx   # Full-screen search
│   │   ├── Footer.tsx
│   │   ├── Button.tsx          # Shared button component
│   │   ├── Breadcrumb.tsx
│   │   ├── Eyebrow.tsx         # Small uppercase label
│   │   ├── PlateImage.tsx      # Decorative image with plate frame
│   │   ├── BenchNotesCTA.tsx   # "Notes from the bench" promo block
│   │   ├── PageTransition.tsx  # Framer Motion page fade
│   │   ├── PageAnimator.tsx    # Scroll-reveal animation wrapper
│   │   └── ShellClient.tsx     # Client shell (Zustand hydration guard)
│   ├── contact/
│   │   ├── ContactForm.tsx
│   │   └── AddressCards.tsx
│   └── admin/
│       ├── layout/             # AdminShell, AdminSidebar, AdminTopbar, AdminBottomNav, AdminThemeProvider
│       ├── shared/             # DataTable, Pagination, StatCard, Badge, Toast, Spinner, SearchInput, etc.
│       ├── charts/             # RevenueChart, OrdersChart, TopProductsTable (Recharts)
│       ├── forms/              # ProductForm, ImageUploader, CollectionSelect, CategorySelect, MetafieldFields
│       └── orders/             # FulfillmentTimeline, AddFulfillmentEventModal
│
├── lib/
│   ├── types.ts                # Shared app types: Product, CrateItem, FilterState
│   ├── shopify.ts              # Storefront API: queries, adapter, public fetch
│   ├── utils.ts                # formatPrice, cn (clsx + tailwind-merge)
│   ├── mockData.ts             # Mock products (used as fallback / dev data)
│   ├── mockReviews.ts          # Mock customer reviews
│   └── admin/
│       ├── types.ts            # AdminProduct, AdminOrder, AdminOrderItem, ProductStatus, etc.
│       ├── shopifyAdmin.ts     # Admin API: full CRUD, inventory, image upload, orders
│       ├── auth.ts             # verifyPassword, AdminSession interface
│       ├── session.ts          # iron-session config (cookieName, password, ttl)
│       ├── ratelimit.ts        # Upstash rate limiter (5 attempts / 15 min per IP)
│       ├── utils.ts            # formatCurrency, formatDate, formatRelativeTime
│       └── mockData.ts         # Mock analytics, revenue stats, abandoned checkouts
│
├── store/
│   ├── crateStore.ts           # Zustand cart store (persisted to localStorage)
│   └── authStore.ts            # Zustand customer auth store (persisted to localStorage)
│
├── hooks/
│   ├── useSearchOverlay.ts     # Open/close search overlay state
│   └── useParallax.ts          # Scroll-based parallax offset
│
├── middleware.ts               # Protects /admin/* — redirects to /admin/login if no valid session
├── next.config.ts              # Next.js config
├── vercel.json                 # Vercel deployment config
└── package.json
```

---

## 3. Data Flow & Shopify Integration

### Two Separate Shopify Connections

| Connection | File | Token | Cache | Used For |
|---|---|---|---|---|
| Storefront API 2025-01 | `lib/shopify.ts` | `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | ISR, revalidate: 60s, tag: `products` | Public product reads |
| Admin API 2026-04 | `lib/admin/shopifyAdmin.ts` | `SHOPIFY_ADMIN_TOKEN` | `no-store` | Full CRUD, inventory, orders |

### Storefront Data Flow

```
Shopify Storefront API (GraphQL)
        ↓
  shopifyFetch()          ← core fetch with ISR caching
        ↓
  query<T>()              ← unwraps response, throws on errors
        ↓
  getAllProducts()         ← fetches up to 250 products
  getProductByHandle()    ← single product by URL handle
  getProductsByCategory() ← products within a collection
  getFeaturedProducts()   ← products tagged 'featured' (max 3)
  getProductsSorted()     ← all products with sort key
        ↓
  shopifyProductToProduct() ← adapter: ShopifyProduct → Product
        ↓
  app Product type (lib/types.ts)
        ↓
  Page components (catalog, product detail, home)
```

### Admin Data Flow

```
Admin API route (app/api/admin/*)
        ↓  (requireAuth() checks iron-session cookie)
  adminFetch()            ← core fetch, no cache
        ↓
  getAdminProducts()      ← list with full metafields
  getAdminProductById()   ← single product
  createAdminProduct()    ← create + variant update + publish + stock
  updateAdminProduct()    ← update + variant update + publish + stock
  deleteAdminProduct()    ← delete
  getAdminOrders()        ← list orders (sorted newest first)
  getAdminOrderById()     ← single order (by GID, numeric ID, or name like #1001)
        ↓
  toAdminProduct() / toAdminOrder() ← adapters → AdminProduct / AdminOrder
        ↓
  JSON response to admin UI
```

### Product Metafields (`acme` namespace)

All rich product data beyond Shopify's default fields is stored as custom metafields:

| Metafield Key | Description |
|---|---|
| `sku` | Stock keeping unit |
| `patent` | Patent number/reference |
| `full_description` | Long-form "Notes from the bench" copy |
| `burner_size` | `No. 1`, `No. 2`, `No. 3`, or `Universal` |
| `material` | Material description |
| `fits` | Compatibility description |
| `bench_tester` | Name of person who bench-tested the piece |
| `bench_test_date` | Date of bench test |
| `workshop` | Workshop where piece was finished |
| `edition` | Edition label |
| `net_weight` | Net weight |
| `era` | Historical era |
| `power_source` | Power source type |
| `condition` | Item condition |
| `style` | Design style |
| `colour` | Colour description |
| `brand` | Brand name |
| `vintage` | Vintage designation |

---

## 4. Customer-Facing Features & Page Flow

### Full User Journey

```
/ (Home)
├── HeroSection          — full-bleed hero with CTA
├── Provenance marquee   — pure CSS scrolling text strip
├── ProvenanceSection    — brand story callout
├── CategoryGrid         — 6 product categories as clickable tiles
├── PickedOffTheBench    — 3 featured products (fetched by tag:featured)
└── TestimonialsCarousel — customer testimonials (mock data)

/catalog
├── CatalogHeader        — title + active filter count
├── FilterSidebar        — desktop: category, burner size, material, sort
├── FilterBar            — mobile: same filters in collapsible bar
└── ProductGrid          — grid of ProductCard components
    └── ProductCard      — image, name, price, inStock badge, link to /catalog/[slug]

/catalog/[slug]          — SSG (generateStaticParams pre-builds all product pages)
├── Breadcrumb
├── ProductGallery       — image carousel, thumbnail strip
├── ProductInfo          — price, finish/burner selector, Add to Crate, fitment box
├── Notes from the bench — fullDescription rendered as paragraphs
├── SpecTable            — all metafields in a two-column table
├── CustomerReviews      — star rating + review cards (mock data)
└── RelatedProducts      — other products in same category

/crate
└── CrateDrawer + full CratePage — item list, quantities, totals, proceed to checkout

/checkout               — client component, 3-step accordion
├── Step 1: Contact & Shipping  (ContactShippingForm)
├── Step 2: Payment             (PaymentForm — UI only, no real payment gateway)
└── Step 3: Review & Place      (clearCrate → redirect to /checkout/confirmed)

/checkout/confirmed     — static confirmation page

/account                — customer account (requires demo sign-in)
├── Saved address
└── Order history (demo orders from authStore)

/track-order            — order tracking form (UI only)
```

### Static Content Pages

| Route | Content |
|---|---|
| `/heritage` | Brand heritage page with HeritageHero, Timeline, WorkshopSection |
| `/our-story` | About the company |
| `/journal` | Blog-style journal |
| `/guides` | Usage/care guides |
| `/restoration` | Restoration services info |
| `/contact` | Contact form + address cards |
| `/shipping` | Shipping policy |
| `/returns` | Returns policy |
| `/faq` | Frequently asked questions |
| `/legal/privacy-policy` | Privacy policy |
| `/legal/terms` | Terms of service |
| `/legal/accessibility` | Accessibility statement |

---

## 5. State Management

### `crateStore` (`store/crateStore.ts`)

Persisted to `localStorage` under key `acme-crate`.

| Action | Signature | Behaviour |
|---|---|---|
| `openCrate()` | `() => void` | Sets `isOpen: true` |
| `closeCrate()` | `() => void` | Sets `isOpen: false` |
| `addItem()` | `(product, finish, burnerSize) => void` | Increments quantity if already in crate, otherwise appends |
| `removeItem()` | `(productId) => void` | Removes item by product ID |
| `updateQuantity()` | `(productId, quantity) => void` | Sets exact quantity |
| `clearCrate()` | `() => void` | Empties all items (called on order placement) |
| `total()` | `() => number` | Sum of `price × quantity` for all items |
| `itemCount()` | `() => number` | Sum of all quantities |

### `authStore` (`store/authStore.ts`)

Persisted to `localStorage` under key `acme-auth`.

| Action | Signature | Behaviour |
|---|---|---|
| `signIn()` | `(email, name?) => void` | If `demo@acmelamp.co`, loads demo address + demo orders. Otherwise sets email/name only. |
| `signOut()` | `() => void` | Clears all auth state |
| `setSavedAddress()` | `(addr) => void` | Saves shipping address for prefill |

**Demo credentials:** `demo@acmelamp.co` / `demo1234` (hardcoded in `authStore.ts`)

> Customer auth is UI-only (Zustand persist, no real backend). There is no real customer account system — only the demo mode.

---

## 6. Admin Panel

### Login & Session Flow

```
User visits /admin/* (any path)
        ↓
middleware.ts runs
├── If path is /admin/login, /admin/forgot-password, /admin/reset-password → allow
├── If no session cookie → redirect to /admin/login
├── If cookie exists but invalid/expired → redirect to /admin/login
└── If session.isLoggedIn === true → allow

POST /api/admin/auth
├── Rate limit: 5 attempts per IP per 15 min (via Upstash, optional)
├── Validates password against ADMIN_PASSWORD env var
└── Creates iron-session cookie (isLoggedIn: true)
```

### Admin Features

| Section | Route | Data Source | Notes |
|---|---|---|---|
| Overview | `/admin/overview` | Mock data (analytics) + real Shopify (orders) | Revenue, sessions, conversion rate use mockData |
| Products List | `/admin/products` | Shopify Admin API | Real-time, no cache |
| Create Product | `/admin/products/new` | — | Full ProductForm → POST /api/admin/products |
| Edit Product | `/admin/products/[id]` | Shopify Admin API | Full ProductForm → PUT /api/admin/products/[id] |
| Orders List | `/admin/orders` | Shopify Admin API | Real orders, sorted newest first |
| Order Detail | `/admin/orders/[id]` | Shopify Admin API | Line items, fulfillment timeline, tracking |
| Inventory | `/admin/inventory` | Shopify Admin API | Stock levels, edit in-place |
| Collections | `/admin/collections` | Shopify Admin API | List + manage Shopify collections |
| Customers | `/admin/customers` | Mock data | Customer list + detail (not real Shopify customers) |
| Settings | `/admin/settings` | Shopify Admin API (shop owner) | Shop name, contact email |

### Product Create/Edit Flow (Admin)

```
ProductForm (client component)
        ↓
POST or PUT /api/admin/products/[id]
        ↓
requireAuth() — checks session cookie
        ↓
collectionHandlesToGids() — resolves collection handles → Shopify GIDs
        ↓
createAdminProduct() or updateAdminProduct()
  ├── productCreate / productUpdate mutation (title, description, status, tags, metafields, category, collections)
  ├── productVariantsBulkUpdate mutation (price, compareAtPrice, inventoryPolicy)
  ├── publishToAllChannels() — iterates all publication channels, calls publishablePublish
  └── setInventoryQuantity() — fetches current on_hand, calls inventorySetQuantities with changeFromQuantity
        ↓
uploadProductImage() — per image URL, calls productCreateMedia mutation
        ↓
revalidateTag('products') — invalidates ISR cache for storefront
        ↓
Returns AdminProduct JSON
```

---

## 7. API Routes Reference

All admin API routes require a valid iron-session cookie (`requireAuth()`).

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/admin/auth` | No | Login — verify password, create session |
| `POST` | `/api/admin/auth/forgot` | No | Send password reset email (Resend) |
| `POST` | `/api/admin/auth/reset` | No | Reset password with token |
| `POST` | `/api/admin/logout` | Yes | Destroy session cookie |
| `GET` | `/api/admin/products` | Yes | List all products from Shopify |
| `POST` | `/api/admin/products` | Yes | Create product in Shopify |
| `GET` | `/api/admin/products/[id]` | Yes | Get single product by Shopify ID |
| `PUT` | `/api/admin/products/[id]` | Yes | Update product in Shopify |
| `DELETE` | `/api/admin/products/[id]` | Yes | Delete product from Shopify |
| `POST` | `/api/admin/products/upload` | Yes | Upload image to Shopify via staged upload |
| `POST` | `/api/admin/products/sync-publish` | Yes | Publish product to all sales channels |
| `GET` | `/api/admin/orders` | Yes | List all orders from Shopify |
| `GET` | `/api/admin/orders/[id]` | Yes | Get single order (by GID, numeric ID, or `#name`) |
| `GET` | `/api/admin/collections` | Yes | List Shopify collections |
| `GET` | `/api/admin/shop` | Yes | Get shop owner name + email |
| `GET` | `/api/admin/taxonomy` | Yes | Get Shopify product category taxonomy |
| `GET` | `/api/test-shopify` | No | Dev utility — tests Storefront API connection |

---

## 8. Key Functions Reference

### Storefront (`lib/shopify.ts`)

| Function | Returns | Description |
|---|---|---|
| `shopifyFetch<T>()` | `{ status, body }` | Core HTTP fetch to Storefront API with ISR caching |
| `shopifyProductToProduct()` | `Product` | Adapter: maps raw ShopifyProduct → app Product type |
| `getAllProducts()` | `Product[]` | Fetches up to 250 products, sorted by title |
| `getProductByHandle()` | `Product \| null` | Fetches one product by URL slug/handle |
| `getProductsByCategory()` | `Product[]` | Fetches all products within a collection handle |
| `getFeaturedProducts()` | `Product[]` | Fetches products tagged `featured` (max 3) |
| `getProductsSorted()` | `Product[]` | Fetches all products with a given sort key |

### Admin (`lib/admin/shopifyAdmin.ts`)

| Function | Returns | Description |
|---|---|---|
| `adminFetch<T>()` | `T` | Core HTTP fetch to Admin API (no-store cache) |
| `toAdminProduct()` | `AdminProduct` | Adapter: ShopifyProductNode → AdminProduct |
| `toAdminOrder()` | `AdminOrder` | Adapter: ShopifyOrderNode → AdminOrder |
| `getAdminProducts()` | `AdminProduct[]` | Fetches product list (default: first 50) |
| `getAdminProductById()` | `AdminProduct \| null` | Fetches single product by Shopify ID |
| `createAdminProduct()` | `AdminProduct` | Creates product + variant + publishes + sets stock |
| `updateAdminProduct()` | `AdminProduct` | Updates product + variant + publishes + sets stock |
| `deleteAdminProduct()` | `void` | Deletes product from Shopify |
| `publishToAllChannels()` | `void` | Publishes product to every Shopify publication |
| `getPrimaryLocationId()` | `string` | Gets (and caches) the primary Shopify location GID |
| `setInventoryQuantity()` | `void` | Sets on-hand stock via `inventorySetQuantities` mutation |
| `uploadProductImage()` | `string` | Attaches an image URL to a product via `productCreateMedia` |
| `deleteProductMedia()` | `void` | Removes media from a product |
| `getProductMediaWithIds()` | `{ id, url }[]` | Lists all media on a product with their GIDs |
| `getAdminOrders()` | `AdminOrder[]` | Fetches order list (default: first 50, newest first) |
| `getAdminOrderById()` | `AdminOrder \| null` | Fetches single order by GID, numeric ID, or `#name` |
| `getShopOwner()` | `{ name, email }` | Gets shop owner name + contact email |
| `collectionHandlesToGids()` | `string[]` | Resolves collection handles → Shopify GIDs |
| `getProductCollectionGids()` | `string[]` | Gets current collection GIDs for a product |

### Auth (`lib/admin/auth.ts`, `lib/admin/session.ts`, `lib/admin/ratelimit.ts`)

| Function / Export | Description |
|---|---|
| `verifyPassword(input)` | Compares input against `ADMIN_PASSWORD` env var (plain-text comparison) |
| `sessionOptions` | iron-session config: cookie name, encryption password, 7-day TTL |
| `loginRatelimit` | Upstash sliding window: 5 login attempts per IP per 15 minutes. `null` if Upstash not configured. |

---

## 9. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SHOPIFY_STORE_DOMAIN` | Yes | Shopify store domain, e.g. `your-store.myshopify.com` |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Yes | Public Storefront API token |
| `SHOPIFY_ADMIN_TOKEN` | Yes | Private Admin API access token |
| `ADMIN_PASSWORD` | Yes | Plain-text password for admin login |
| `SESSION_PASSWORD` | Yes | 32+ character secret for iron-session cookie encryption |
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash Redis URL — enables rate limiting on login |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Redis token — enables rate limiting on login |
| `RESEND_API_KEY` | Optional | Resend API key — enables password reset emails |

> If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are not set, `loginRatelimit` is `null` and rate limiting is silently skipped.

---

## 10. Known Gaps & Phase B Notes

These are items explicitly marked in the codebase as incomplete or planned for a future phase:

| Gap | Location | Notes |
|---|---|---|
| **Plain-text password comparison** | `lib/admin/auth.ts` | `verifyPassword` compares directly against `ADMIN_PASSWORD` env var. bcrypt hashing is planned for a future sprint. |
| **Multi-fit burner sizes** | `lib/types.ts` line 12 | `burnerSize` is currently a single enum value. Phase B: migrate to `string[]` to support products that fit multiple burner sizes (e.g. `['No. 2', 'No. 3']`). |
| **Stock from Shopify variants** | `lib/types.ts` line 13 | `stockQuantity` currently comes from `variant.quantityAvailable`. Phase B: replace with a dedicated Shopify `quantityAvailable` field on the variant. |
| **Real customer auth** | `store/authStore.ts` | Customer login is demo-only (hardcoded `demo@acmelamp.co / demo1234`). No real Shopify customer authentication is implemented. |
| **Real analytics on overview dashboard** | `app/admin/overview/page.tsx` | Revenue, sessions, conversion rate, top products, and abandoned checkouts all use `lib/admin/mockData.ts`. Only "Recent Orders" is real Shopify data. |
| **Customers section** | `app/admin/customers/*` | Customer list and detail pages use mock data — not connected to real Shopify customers. |
| **Payment gateway** | `app/checkout/page.tsx` | The PaymentForm is UI-only. No real payment is processed. Placing an order clears the crate and redirects — no Shopify order is created. |
| **`category` field typing** | `lib/shopify.ts` line 189 | `category` falls back to `'lighting'` if no matching collection is found, but `'lighting'` is not a valid `Product['category']` enum value — a TypeScript cast bypasses this. |
