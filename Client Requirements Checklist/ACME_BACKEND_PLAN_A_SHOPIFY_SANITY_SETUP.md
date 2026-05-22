# Acme Lamp & Sign Co. — Backend Implementation Plan A
## Shopify + Sanity.io · External Systems Configuration
### Phase-by-Phase Setup Guide · Stop → Report → Proceed

> **Who this plan is for:** The developer or agency admin configuring the Shopify store and Sanity studio. This plan covers all work done *outside* the Next.js codebase — in the Shopify Admin dashboard and Sanity Studio. Plan B covers the codebase integration.
>
> **Every phase ends with a STOP.** Provide a full report of what was completed. Ask: **"Continue with the next phase?"** — only proceed on explicit "Yes, Proceed."
>
> **Reference:** Vercel guide — [Building E-commerce Sites with Next.js and Shopify](https://vercel.com/kb/guide/building-ecommerce-sites-with-next-js-and-shopify)

---

## Memory Anchors (Read Before Starting)

```
PROJECT:          Acme Lamp & Sign Co. — Spring Release
STORE_URL:        Not Yet Created
SHOPIFY_PLAN:     Basic (minimum) or Shopify (recommended for reporting)
SANITY_PLAN:      Free tier (sufficient for this project scope)
PRODUCTS:         16 SKUs currently (real eBay data) — expanding to 50 with real inventory
CATEGORIES:       lighting | glass-chimneys | hardware | signs
VARIANTS:         Finish (per product) + Burner Size (per applicable product)
CHECKOUT:         Shopify hosted checkout (not custom)
AUTH:             Shopify Customer Account API (new Customer Accounts, not legacy)
CMS_SCOPE:        Journal posts, editorial copy, testimonials, Our Story, Heritage
CURRENCY:         CAD (Canadian Dollar)
REGION:           Canada — Halifax, Nova Scotia (primary market: North America)
SHIPPING:         Free over $150 CAD (Shopify shipping rule)
API_VERSION:      2025-01  ← use this consistently everywhere
PHASE_GATE:       STOP after each phase. Report. Ask "Continue with the next phase?" — wait for "Yes, Proceed."
```

---

## Phase A0 — Accounts, Access & Credentials

### Objective
Obtain API credentials from the existing Shopify store and create the Sanity project before any configuration begins.

### A0.1 — Shopify Store (Already Created)

The store already exists:
- **Store URL:** `acme-lamp-and-sign.myshopify.com`
- **Admin URL:** `admin.shopify.com/store/acme-lamp-and-sign`
- **Store name:** Acme Lamp and Sign
- **Region:** Canada · **Currency:** CAD

> No new store creation needed. Proceed directly to A0.2.

### A0.2 — Create a Custom App for API Access

Shopify now routes custom app creation through **Settings**, not the Partner/Dev Dashboard.

1. Go to `admin.shopify.com/store/acme-lamp-and-sign/settings/apps`
2. Click **Develop apps for your store** → **Allow custom app development** → confirm
3. Click **Create an app**
4. App name: `Acme Lamp Frontend`
5. Click **Configure Storefront API scopes** → enable all scopes listed in A0.3
6. Click **Save** → **Install app**
7. Copy the **Storefront API access token** — it is shown only once

> **Why not the Dev Dashboard (`dev.shopify.com`)?** That is for building apps to publish in the Shopify App Store. Custom private tokens for a headless frontend come from Settings → Apps only.

### A0.3 — Storefront API Scopes Required

Enable all of the following on the Storefront API:

| Scope | Why |
|---|---|
| `unauthenticated_read_product_listings` | Product catalog, PDP |
| `unauthenticated_read_collection_listings` | Category/collection pages |
| `unauthenticated_read_checkouts` | Checkout flow |
| `unauthenticated_write_checkouts` | Cart mutations |
| `unauthenticated_read_customers` | Customer session reads |
| `unauthenticated_write_customers` | Sign in, create account |
| `unauthenticated_read_content` | Metaobjects / CMS data |

### A0.4 — Environment Variables (Vercel Guide naming convention)

Use **exactly** these variable names — they match the Vercel guide and the `lib/shopify.ts` file Plan B will create:

```bash
# .env.local
SHOPIFY_STORE_DOMAIN=acme-lamp-and-sign.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=          # from A0.2 — public, safe for client
SHOPIFY_ADMIN_TOKEN=                      # Admin API token — server-side only, never expose
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01
SANITY_READ_TOKEN=                        # viewer token — server-side reads
SHOPIFY_WEBHOOK_SECRET=                   # from A7.2
```

> **Important:** `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (not `SHOPIFY_STOREFRONT_TOKEN`) — the Vercel guide and our `shopifyFetch()` function both use this exact name.

### A0.5 — Core `shopifyFetch()` Pattern (Reference)

The Vercel guide establishes this pattern. Plan B will implement it in `lib/shopify.ts`:

```typescript
export async function shopifyFetch({ query, variables }: { query: string; variables?: object }) {
  const result = await fetch(
    `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2025-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
      },
      body: JSON.stringify({ query, variables }),
    }
  )
  return result.json()
}
```

### A0.6 — Sanity Project Creation

1. Go to [sanity.io](https://sanity.io) → **Create new project**
2. Project name: **Acme Lamp & Sign**
3. Dataset: `production`
4. Copy credentials into `.env.local` above

---

### PHASE A0 STOP ✋

> **Complete ALL steps above, then report:**
> 1. Store URL confirmed: `acme-lamp-and-sign.myshopify.com`
> 2. Custom app created via Settings → Apps (not Dev Dashboard)
> 3. Storefront API access token copied (shown only once)
> 4. All 7 Storefront API scopes enabled
> 5. `.env.local` file created with correct variable names
> 6. Sanity project created — project ID noted
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase A1 — Shopify Collections (Categories)

### Objective
Create the 4 product collections that map directly to the frontend category filter system.

### A1.1 — Create Collections

In Shopify Admin → **Products** → **Collections** → **Create collection**:

Create each as a **Manual collection** (not automated — precise control during launch):

| Collection Title | Handle (URL slug) | Frontend category key |
|---|---|---|
| Lighting Fixtures | `lighting` | `lighting` |
| Glass & Chimneys | `glass-chimneys` | `glass-chimneys` |
| Burners & Hardware | `hardware` | `hardware` |
| Advertising Signs | `signs` | `signs` |

### A1.2 — Collection Descriptions

| Collection | Description |
|---|---|
| Lighting Fixtures | Complete oil lamp assemblies — center-draft, side-draft, railroad, and parlor fixtures reproduced from original 1873–1934 patterns. Bench-tested for an 8-hour burn. |
| Glass & Chimneys | Mouth-blown replacement chimneys and shades. Each piece individually inspected; no fire-polish shortcuts. Sized to the original burner fitments. |
| Burners & Hardware | Replacement burners, cotton wicks, font caps, and trimming tools. Pressed on the original Pune tooling. Sized for No. 1, No. 2, No. 3, and Universal fitment. |
| Advertising Signs | Triple-fired porcelain-on-steel reproduction signs from the 1890s–1940s railroad and petroleum trade. Numbered and dated on the reverse. |

### A1.3 — Collection SEO

For each collection → **Search engine listing**:
- **Meta title:** e.g. `Glass & Chimneys — Acme Lamp & Sign Co.`
- **Meta description:** First 155 characters of the collection description above
- **URL handle:** Match exactly the handle in A1.1

---

### PHASE A1 STOP ✋

> **Report:** 4 collections created with exact handles, descriptions, and SEO meta filled.
> **Ask: "Continue with the next phase?"**

---

## Phase A2 — Shopify Product Metafields

### Objective
Define custom metafields for product data the frontend displays that has no standard Shopify field.

### A2.1 — Create Metafield Definitions

In Shopify Admin → **Settings** → **Metafields and metaobjects** → **Products** → **Add definition**:

| Name | Namespace + Key | Type | Purpose |
|---|---|---|---|
| SKU Code | `acme.sku` | Single-line text | e.g. `EB-204895` |
| Patent Year | `acme.patent` | Single-line text | e.g. `1873 PAT.` |
| Bench Tester Name | `acme.bench_tester` | Single-line text | e.g. `R.K. Patel` |
| Bench Test Date | `acme.bench_test_date` | Date | ISO 8601 date |
| Workshop | `acme.workshop` | Single-line text | `Pune Press Shop 4` |
| Edition | `acme.edition` | Single-line text | `Spring 2026` |
| Fits Description | `acme.fits` | Multi-line text | Fitment/dimensions note |
| Net Weight | `acme.net_weight` | Single-line text | e.g. `0.86 kg` |
| Full Description | `acme.full_description` | Rich text | Long-form product copy |
| Burner Size | `acme.burner_size` | Single-line text | `No. 1`, `No. 2`, `No. 3`, or blank |

### A2.2 — Expose Metafields via Storefront API

For each metafield definition → enable **"Storefront API access: Read"**.

Without this, the GraphQL queries in Plan B cannot read them.

### A2.3 — Current SKU Format

Real products from the eBay data use the format `EB-XXXXXX` (e.g. `EB-204895`). The metafield validation pattern should accept this:

```
[A-Z]{2,4}-[0-9]{4,6}
```

---

### PHASE A2 STOP ✋

> **Report:** All 10 metafield definitions created, Storefront API read access enabled on all 10.
> **Ask: "Continue with the next phase?"**

---

## Phase A3 — Shopify Product Data Entry

### Objective
Enter all products into Shopify with correct metafields, variants, collections, images, and SEO.

### A3.1 — Current Product Count

| Status | Count |
|---|---|
| Real products (from eBay scrape, in `mockData.ts`) | **16** |
| Target at full launch | **50** |

Enter all 16 now. Remaining 34 are added when Scott provides real inventory data and photos.

### A3.2 — Product Entry Template (per product)

**Standard Shopify fields:**

| Field | Value |
|---|---|
| Title | Full product name (e.g. `OIL LAMP SHADE - Vesta Shade 7 3/8" Cupid Etched Green`) |
| Description | `shortDescription` from `mockData.ts` |
| Status | Active |
| Price | As per `mockData.ts` (CAD) |
| SKU (variant level) | `sku` field from `mockData.ts` (e.g. `EB-390452`) |
| Track quantity | Yes — set to `1` per product (all current stock is 1 unit) |
| Requires shipping | Yes |
| Images | Upload from eBay CDN URLs in `mockData.ts` images array |

**Metafields (scroll to bottom of product page):**

Fill all applicable `acme.*` metafields. For eBay-sourced products, `benchTesterName`, `workshop`, and `edition` are blank until Scott provides real data.

**Collections:** Assign each product to exactly one collection matching its `category` field.

**Tags:** Add tags for filtering — e.g. `glass-chimneys`, `No. 3`, `oil lamp`, `victorian`, `borosilicate`

**SEO URL handle:** Must match the `slug` field in `mockData.ts` exactly.

### A3.3 — Category Distribution (current 16 products)

| Collection | Count |
|---|---|
| Lighting Fixtures | 1 (book) |
| Glass & Chimneys | 12 |
| Burners & Hardware | 3 |
| Advertising Signs | 0 (pending Scott's inventory) |
| **Total** | **16** |

### A3.4 — Featured Products

Tag these 3 products with the Shopify tag `featured` — they appear in the **"Picked off the bench this week"** section on the homepage:

| SKU | Product name |
|---|---|
| `EB-204895` | OIL LAMP SHADE - Floral Etched Large Ball Shade Blue 4" Fit |
| `EB-390452` | OIL LAMP SHADE - Vesta Shade 7 3/8" Cupid Etched Green |
| `EB-950466` | OIL LAMP SPREADER- Miller Flame Spreader #1 |

### A3.5 — Image Upload

For each product, download images from the eBay CDN URLs in `mockData.ts` and upload to Shopify's media library:
- Format: JPEG or WebP, minimum 1600px on longest side
- Alt text: `[Product Name] — Acme Lamp & Sign Co.`

> Once Scott provides professional product photography, replace the eBay CDN images before going live.

---

### PHASE A3 STOP ✋

> **Report:** Total products entered (target: 16), metafields populated, 3 featured products tagged, images uploaded.
> **Ask: "Continue with the next phase?"**

---

## Phase A4 — Shopify Checkout & Shipping Configuration

### Objective
Configure shipping rules, tax settings, checkout branding, and order notifications for the Canadian market.

### A4.1 — Shipping Rates

In Shopify Admin → **Settings** → **Shipping and delivery** → **Manage rates**:

**Zone: Canada**
- Flat rate: `Standard shipping` → $15.00 CAD
- Free shipping when order subtotal ≥ $150.00 CAD

**Zone: United States**
- Flat rate: `International freight` → $22.00 CAD
- Free when subtotal ≥ $150.00 CAD

**Zone: Rest of World**
- Flat rate: `International freight` → $35.00 CAD
- Free when subtotal ≥ $150.00 CAD

> These rates align with the `Free freight over $150` copy displayed on ProductInfo and the crate drawer in the frontend.

### A4.2 — Tax Configuration

In Shopify Admin → **Settings** → **Taxes and duties**:
- Canada: Enable Shopify's automatic Canadian GST/HST calculation
- International: Collect taxes at checkout based on customer location
- Mark all products as taxable

### A4.3 — Checkout Branding

In Shopify Admin → **Settings** → **Checkout** → **Customize**:

| Setting | Value |
|---|---|
| Logo | Upload Acme Lamp & Sign wordmark (SVG or PNG, max 500px wide) |
| Background color | `#FAF5EC` (parchment) |
| Button color | `#2E4A3F` (green-brand) |
| Button text color | `#F5F1E6` |
| Form background | `#F2EBDB` (parchment-2) |

### A4.4 — Customer Accounts

In Shopify Admin → **Settings** → **Customer accounts**:
- Select: **New customer accounts** (not legacy — required for Customer Account API in Plan B)
- Enable: **Require email verification**

### A4.5 — Order Confirmation Email

In Shopify Admin → **Settings** → **Notifications** → **Order confirmation**:
- Subject: `Your Acme Lamp & Sign order — [order_name]`
- Footer text:
  ```
  Your order is being carefully packed by hand at our Halifax workshop.
  You'll receive a dispatch confirmation within two business days.
  Questions? Write to hello@acmelampandsign.com
  ```

> Update contact email and address once Scott provides real business details.

### A4.6 — Abandoned Checkout

In Shopify Admin → **Marketing** → **Automations**:
- Enable: **Abandoned checkout** — send after 4 hours
- Subject: `"Your crate is still waiting — Acme Lamp & Sign"`

---

### PHASE A4 STOP ✋

> **Report:** Shipping zones set (Canada + US + ROW), Canadian tax enabled, checkout branded, New Customer Accounts on, order email customized.
> **Ask: "Continue with the next phase?"**

---

## Phase A5 — Sanity Studio Schema Setup

### Objective
Define the Sanity content schemas for all CMS-driven content: journal posts, testimonials, Our Story, Heritage timeline, and site settings.

### A5.1 — Sanity Studio Initialization

```bash
npm create sanity@latest -- \
  --project [YOUR_PROJECT_ID] \
  --dataset production \
  --template clean \
  --output-path acme-sanity-studio
```

### A5.2 — Schema: Journal Post

File: `schemas/journalPost.ts`

```typescript
export default {
  name: 'journalPost',
  title: 'Journal Post',
  type: 'document',
  fields: [
    { name: 'title',       type: 'string',   title: 'Title' },
    { name: 'slug',        type: 'slug',     title: 'Slug', options: { source: 'title' } },
    { name: 'publishDate', type: 'date',     title: 'Publish Date' },
    { name: 'eyebrow',     type: 'string',   title: 'Eyebrow label (e.g. BENCH NOTES · SPRING)' },
    { name: 'excerpt',     type: 'text',     title: 'Excerpt (shown in card/list)', rows: 3 },
    { name: 'body',        type: 'array',    title: 'Body', of: [{ type: 'block' }, { type: 'image' }] },
    { name: 'coverImage',  type: 'image',    title: 'Cover Image', options: { hotspot: true } },
    { name: 'author',      type: 'string',   title: 'Author name' },
    { name: 'readTime',    type: 'number',   title: 'Estimated read time (minutes)' },
    { name: 'tags',        type: 'array',    title: 'Tags', of: [{ type: 'string' }] },
  ],
  orderings: [
    { title: 'Publish date, newest', name: 'publishDateDesc', by: [{ field: 'publishDate', direction: 'desc' }] },
  ],
}
```

### A5.3 — Schema: Testimonial

File: `schemas/testimonial.ts`

```typescript
export default {
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    { name: 'quote',       type: 'text',    title: 'Quote text' },
    { name: 'attribution', type: 'string',  title: 'Attribution (name / role)' },
    { name: 'location',    type: 'string',  title: 'Location or source (optional)' },
    { name: 'featured',    type: 'boolean', title: 'Featured on homepage?' },
    { name: 'sortOrder',   type: 'number',  title: 'Sort order (lower = first)' },
  ],
}
```

### A5.4 — Schema: Our Story Page (Singleton)

File: `schemas/ourStoryPage.ts`

```typescript
export default {
  name: 'ourStoryPage',
  title: 'Our Story Page',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    { name: 'heroHeadline',        type: 'string', title: 'Hero Headline' },
    { name: 'heroBody',            type: 'text',   title: 'Hero Body' },
    { name: 'missionQuote',        type: 'text',   title: 'Mission Statement Quote' },
    { name: 'pillar1Title',        type: 'string', title: 'Pillar 01 Title' },
    { name: 'pillar1Body',         type: 'text',   title: 'Pillar 01 Body' },
    { name: 'pillar2Title',        type: 'string', title: 'Pillar 02 Title' },
    { name: 'pillar2Body',         type: 'text',   title: 'Pillar 02 Body' },
    { name: 'pillar3Title',        type: 'string', title: 'Pillar 03 Title' },
    { name: 'pillar3Body',         type: 'text',   title: 'Pillar 03 Body' },
    { name: 'foundersQuote',       type: 'text',   title: "Founder's quote" },
    { name: 'foundersAttribution', type: 'string', title: 'Founder attribution line' },
  ],
}
```

### A5.5 — Schema: Heritage Timeline Entry

File: `schemas/timelineEntry.ts`

```typescript
export default {
  name: 'timelineEntry',
  title: 'Heritage Timeline Entry',
  type: 'document',
  fields: [
    { name: 'year',        type: 'number', title: 'Year' },
    { name: 'title',       type: 'string', title: 'Event title' },
    { name: 'description', type: 'text',   title: 'Event description' },
    { name: 'image',       type: 'image',  title: 'Archive image (optional)', options: { hotspot: true } },
    { name: 'imageCaption',type: 'string', title: 'Image caption' },
  ],
  orderings: [
    { title: 'Year, ascending', name: 'yearAsc', by: [{ field: 'year', direction: 'asc' }] },
  ],
}
```

### A5.6 — Schema: Site Settings (Singleton)

File: `schemas/siteSettings.ts`

```typescript
export default {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    { name: 'newsletterHeading',    type: 'string', title: 'Newsletter section heading' },
    { name: 'newsletterBody',       type: 'text',   title: 'Newsletter section body' },
    { name: 'marqueeText',          type: 'string', title: 'Provenance marquee strip text' },
    { name: 'catalogSeasonEyebrow', type: 'string', title: 'Catalog season eyebrow' },
    { name: 'heroHeadline',         type: 'string', title: 'Homepage hero headline' },
    { name: 'heroBody',             type: 'text',   title: 'Homepage hero body' },
  ],
}
```

### A5.7 — Register Schemas in Studio

In `sanity.config.ts`:

```typescript
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import journalPost   from './schemas/journalPost'
import testimonial   from './schemas/testimonial'
import ourStoryPage  from './schemas/ourStoryPage'
import timelineEntry from './schemas/timelineEntry'
import siteSettings  from './schemas/siteSettings'

export default defineConfig({
  name: 'default',
  title: 'Acme Lamp & Sign',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: 'production',
  plugins: [structureTool()],
  schema: { types: [journalPost, testimonial, ourStoryPage, timelineEntry, siteSettings] },
})
```

### A5.8 — Deploy Studio

```bash
cd acme-sanity-studio
npx sanity deploy
```

Studio URL: `https://acme-lamp-sign.sanity.studio`

Add CORS origins in Sanity project settings → API → CORS origins:
- `http://localhost:3000`
- `https://acmelampandsign.vercel.app`

---

### PHASE A5 STOP ✋

> **Report:** All 5 schemas created, Studio deploys without errors, all document types visible in Studio sidebar, CORS origins configured.
> **Ask: "Continue with the next phase?"**

---

## Phase A6 — Sanity Content Population

### Objective
Seed all CMS-driven content that is currently hardcoded in Next.js components.

### A6.1 — Populate Testimonials

Create 3 testimonials in Sanity Studio, all marked `featured: true`:

| Quote | Attribution |
|---|---|
| "The Cattaraugus reproduction holds an extra flame — the bench test others won't run." | T. ALDRIDGE / LAMP COLLECTOR |
| "Acme Lamp & Sign's chimneys are the only ones we still recommend without an asterisk." | W. HOOPER / RESTORATION WORKSHOP |
| "The kind of shop that ships a hand-written invoice and means it." | B. SANTOS / INTERIOR ARCHITECT |

### A6.2 — Populate Heritage Timeline

Create 6 timeline entries:

| Year | Title | Description |
|---|---|---|
| 1873 | Cattaraugus patent | Bradley & Hubbard file the center-draft burner patent that anchors our entire fixtures collection. |
| 1881 | Pittsburgh railroad order | First gimbal-mounted caboose lamps roll out of the Pune works for the Indian railway. |
| 1898 | British Indian Lamp Co. closes | The dies stay. The Patel family buys the press shop for ₹140 and a promise. |
| 1934 | Porcelain signage line | A third firing process is developed for the advertising-sign trade. |
| 2003 | North American distribution opens | The first containers cross the Atlantic, arriving in Halifax. |
| 2026 | Spring release | Sixteen pieces available now. More to follow as inventory is catalogued. |

### A6.3 — Populate Our Story Page

Create the `ourStoryPage` singleton with all text currently hardcoded in `app/our-story/page.tsx`.

### A6.4 — Populate Site Settings

Create the `siteSettings` singleton with:
- Marquee text (from current `page.tsx` `MARQUEE_TEXT` constant)
- Newsletter heading + body (from current `Footer.tsx`)
- Catalog season eyebrow: `SPRING RELEASE · 16 PIECES`

### A6.5 — Create First Journal Post

- **Title:** `The night-burn test: what it means and why we run it`
- **Eyebrow:** `BENCH NOTES · SPRING 2026`
- **Excerpt:** `Every lamp we sell runs eight hours on No. 2 wick before it earns its tag. Here's what we're looking for — and what fails.`
- **Author:** `R.K. Patel`
- **Read time:** `5`

---

### PHASE A6 STOP ✋

> **Report:** 3 testimonials created, 6 timeline entries created, Our Story and Site Settings singletons populated, 1 journal post published.
> **Ask: "Continue with the next phase?"**

---

## Phase A7 — Shopify Admin API & Webhooks

### Objective
Configure Admin API scopes and webhooks for real-time order and inventory updates.

### A7.1 — Admin API Scopes

In the custom app settings → Admin API integration:

| Scope | Purpose |
|---|---|
| `read_orders` | Order history on account page |
| `read_customers` | Customer profile data |
| `write_customers` | Create/update customer records |
| `read_products` | Server-side product reads (ISR revalidation) |
| `read_inventory` | Stock level checks |
| `write_draft_orders` | Future: wholesale/custom orders |

### A7.2 — Webhooks

In Shopify Admin → **Settings** → **Notifications** → **Webhooks**:

| Event | URL endpoint | Format |
|---|---|---|
| `orders/create` | `https://acmelampandsign.vercel.app/api/webhooks/order-created` | JSON |
| `orders/fulfilled` | `https://acmelampandsign.vercel.app/api/webhooks/order-fulfilled` | JSON |
| `orders/cancelled` | `https://acmelampandsign.vercel.app/api/webhooks/order-cancelled` | JSON |
| `products/update` | `https://acmelampandsign.vercel.app/api/webhooks/product-updated` | JSON |
| `inventory_levels/update` | `https://acmelampandsign.vercel.app/api/webhooks/inventory-updated` | JSON |

Save the webhook signing secret to `.env.local` as `SHOPIFY_WEBHOOK_SECRET`.

### A7.3 — Order Status Mapping

| Shopify Status | Frontend Label | Color |
|---|---|---|
| `unfulfilled` | Processing | Yellow |
| `partial` | Packed at Workshop | Yellow |
| `fulfilled` | Dispatched | Green |
| `in_transit` | In Transit | Blue |
| `delivered` | Delivered | Green |
| `return_requested` | Return Requested | Orange |
| `returned` | Returned | Grey |

---

### PHASE A7 STOP ✋

> **Report:** All 6 Admin API scopes active, all 5 webhooks created, webhook secret saved.
> **Ask: "Continue with the next phase?"**

---

## Phase A8 — Go-Live Checklist & API Smoke Tests

### A8.1 — Shopify Verification Checklist

- [ ] 16 products live, all with status `Active`
- [ ] All products assigned to correct collections
- [ ] 3 products tagged `featured` (`EB-204895`, `EB-390452`, `EB-950466`)
- [ ] All metafields populated per product
- [ ] Shipping rates: Canada + US + Rest of World
- [ ] Free shipping at $150 CAD confirmed
- [ ] Checkout branded (logo, parchment bg, green button)
- [ ] New Customer Accounts enabled (not legacy)
- [ ] Test customer account: create one and verify email link works
- [ ] Currency set to CAD
- [ ] Storefront API token obtained and tested

### A8.2 — Sanity Verification Checklist

- [ ] Studio accessible at deployed URL
- [ ] All 5 schema types visible in sidebar
- [ ] 3+ testimonials marked `featured: true`
- [ ] 6 timeline entries published
- [ ] `ourStoryPage` singleton populated and published
- [ ] `siteSettings` singleton populated and published
- [ ] 1+ journal post published
- [ ] CORS origins include `localhost:3000` and `acmelampandsign.vercel.app`

### A8.3 — API Smoke Tests

Run these before Plan B starts to confirm both APIs return data.

**Shopify Storefront API** — POST to:
```
https://acme-lamp-and-sign.myshopify.com/api/2025-01/graphql.json
```
Header: `X-Shopify-Storefront-Access-Token: [your token]`
Body:
```graphql
{
  products(first: 3) {
    edges { node { title handle } }
  }
}
```

**Sanity GROQ via CDN:**
```
https://[projectId].api.sanity.io/v2025-01/data/query/production?query=*[_type=="testimonial"]
```

Both must return real data before Plan B begins.

---

### PHASE A8 STOP ✋ — PLAN A COMPLETE ✋

> **Final Plan A report:**
> 1. All A8.1 Shopify checklist items: pass/fail
> 2. All A8.2 Sanity checklist items: pass/fail
> 3. Both A8.3 smoke tests: confirmed (paste first result of each)
> 4. All credentials in `.env.local` template
> 5. Any deviations from this plan and reason
>
> **State: "External systems configuration complete. Ready to begin Plan B — Codebase Integration."**

---

*Acme Lamp & Sign Co. · Backend Implementation Plan A — External Systems*
*Shopify + Sanity.io Setup · Spring Release 2026*
*Reference: [Vercel — Building E-commerce Sites with Next.js and Shopify](https://vercel.com/kb/guide/building-ecommerce-sites-with-next-js-and-shopify)*
*Companion document: `ACME_BACKEND_PLAN_B_CODEBASE_INTEGRATION.md`*
