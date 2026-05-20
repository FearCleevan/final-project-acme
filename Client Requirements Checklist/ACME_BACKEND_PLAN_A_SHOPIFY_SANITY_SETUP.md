# Acme Lamp & Sign Co. — Backend Implementation Plan A
## Shopify + Sanity.io · External Systems Configuration
### Phase-by-Phase Setup Guide · Stop → Report → Proceed

> **Who this plan is for:** The developer or agency admin configuring the Shopify store and Sanity studio. This plan covers all work done *outside* the Next.js codebase — in the Shopify Admin dashboard, Shopify Partner dashboard, and Sanity Studio. Plan B covers the codebase integration.
>
> **Every phase ends with a STOP.** Provide a full report of what was completed. Ask: **"Continue with the next phase?"** — only proceed on explicit "Yes, Proceed."
>
> **Reference:** `ACME_LAMP_SIGN_PROCESS_FLOW.md` for the complete user journey this config must support.

---

## Memory Anchors (Read Before Starting)

```
PROJECT:        Acme Lamp & Sign Co. — Spring Release
SHOPIFY_PLAN:   Shopify Basic (minimum) or Shopify (recommended for reporting)
SANITY_PLAN:    Free tier (sufficient for this project scope)
PRODUCTS:       50 SKUs across 4 categories
CATEGORIES:     lighting | glass-chimneys | hardware | signs
VARIANTS:       Finish (per product) + Burner Size (per applicable product)
CHECKOUT:       Shopify hosted checkout (not custom)
AUTH:           Shopify Customer Account API (new Customer Accounts, not legacy)
CMS_SCOPE:      Journal posts, editorial copy, testimonials, Our Story, Heritage
CURRENCY:       USD
SHIPPING:       Free over $150 (Shopify shipping rule)
PHASE_GATE:     STOP after each phase. Report. Ask "Continue with the next phase?" — wait for "Yes, Proceed."
```

---

## Phase A0 — Accounts, Access & Credentials

### Objective
Create all required platform accounts, obtain API credentials, and document them securely before any configuration begins.

### A0.1 — Shopify Store Creation

1. Go to [shopify.com](https://shopify.com) → Start free trial.
2. Store name: **Acme Lamp & Sign Co.**
3. Industry: **Home & Garden** (closest match).
4. Region: Australia (Adelaide HQ).
5. Currency: **USD**.
6. Note your store URL: `acme-lamp-sign.myshopify.com` (or chosen handle).

### A0.2 — Shopify Partner App (for Storefront API access)

1. Go to Shopify Partner Dashboard → **Apps** → **Create app**.
2. App name: `Acme Lamp Frontend`.
3. App type: **Custom app** (for your store only).
4. In the app settings, enable:
   - **Storefront API** — `unauthenticated_read_*` scopes (full list in A0.3).
   - **Admin API** — for order tracking and webhooks (Phase A4).
5. Save and copy the following credentials:
   ```
   SHOPIFY_STORE_DOMAIN=acme-lamp-sign.myshopify.com
   SHOPIFY_STOREFRONT_TOKEN=[public token]
   SHOPIFY_ADMIN_TOKEN=[admin token — keep server-side only]
   ```

### A0.3 — Storefront API Scopes Required

Enable all of the following unauthenticated read scopes on the Storefront API:

| Scope | Why |
|---|---|
| `unauthenticated_read_product_listings` | Product catalog, PDP |
| `unauthenticated_read_collection_listings` | Category/collection pages |
| `unauthenticated_read_checkouts` | Checkout flow |
| `unauthenticated_write_checkouts` | Cart mutations |
| `unauthenticated_read_customers` | Customer session reads |
| `unauthenticated_write_customers` | Sign in, create account |
| `unauthenticated_read_content` | Metaobjects / CMS data |

### A0.4 — Sanity Project Creation

1. Go to [sanity.io](https://sanity.io) → **Create new project**.
2. Project name: **Acme Lamp & Sign**.
3. Dataset: `production`.
4. Note credentials:
   ```
   SANITY_PROJECT_ID=[project id]
   SANITY_DATASET=production
   SANITY_API_VERSION=2024-01-01
   SANITY_READ_TOKEN=[viewer token — for server-side reads]
   ```
5. Plan: Free tier is sufficient (up to 100k API requests/month).

### A0.5 — Credential Storage

Store all credentials in a `.env.local` template file at the project root (values masked). Plan B Phase B0 populates the actual values.

```
# .env.local (template — no real values in version control)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=
SHOPIFY_ADMIN_TOKEN=
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
NEXT_PUBLIC_SANITY_API_VERSION=
SANITY_READ_TOKEN=
```

---

### PHASE A0 STOP ✋

> **Complete ALL steps above, then report:**
> 1. Shopify store URL confirmed
> 2. Custom app created — Storefront + Admin API tokens obtained
> 3. All 7 Storefront API scopes enabled
> 4. Sanity project created — project ID and read token obtained
> 5. `.env.local` template created
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase A1 — Shopify Collections (Categories)

### Objective
Create the 4 product collections that map directly to the frontend category filter system.

### A1.1 — Create Collections

In Shopify Admin → **Products** → **Collections** → **Create collection**:

Create each of the following as a **Manual collection** (not automated, so you control which products are in each):

| Collection Title | Handle (URL slug) | Frontend category key |
|---|---|---|
| Lighting Fixtures | `lighting` | `lighting` |
| Glass & Chimneys | `glass-chimneys` | `glass-chimneys` |
| Burners & Hardware | `hardware` | `hardware` |
| Advertising Signs | `signs` | `signs` |

> **Why manual?** Automated collections filter by tag or price. Manual gives precise control during the initial 50-piece launch.

### A1.2 — Collection Descriptions

Each collection needs a short description that feeds into the catalog header on the frontend.

| Collection | Description |
|---|---|
| Lighting Fixtures | Complete oil lamp assemblies — center-draft, side-draft, railroad, and parlor fixtures reproduced from original 1873–1934 patterns. Bench-tested for an 8-hour burn. |
| Glass & Chimneys | Mouth-blown replacement chimneys and shades. Each piece individually inspected; no fire-polish shortcuts. Sized to the original burner fitments. |
| Burners & Hardware | Replacement burners, wick tubes, galleries, and founts. Pressed on the original Pune tooling. Sized for No. 1, No. 2, No. 3, and Universal fitment. |
| Advertising Signs | Triple-fired porcelain-on-steel reproduction signs from the 1890s–1940s railroad and petroleum trade. Numbered and dated on the reverse. |

### A1.3 — Collection SEO

For each collection, in Shopify Admin → Collection → **Search engine listing**:

- **Meta title:** e.g. `Lighting Fixtures — Acme Lamp & Sign Co.`
- **Meta description:** First 155 characters of the collection description above.
- **URL handle:** Match exactly the handle in A1.1 (no auto-generated suffixes).

---

### PHASE A1 STOP ✋

> **Complete ALL steps above, then report:**
> 1. 4 collections created with exact handles
> 2. Descriptions added to each collection
> 3. SEO meta filled for each collection
> 4. Screenshot or confirmation of collections list in Shopify Admin
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase A2 — Shopify Product Metafields

### Objective
Define custom metafields that store the product data points the frontend displays (bench tester name, patent, workshop, edition number, fits description) — data that has no standard Shopify field.

### A2.1 — Create Metafield Definitions

In Shopify Admin → **Settings** → **Custom data** → **Products** → **Add definition**:

Create each metafield below:

| Name | Namespace + Key | Type | Purpose |
|---|---|---|---|
| SKU Code | `acme.sku` | Single-line text | e.g. `OL-1873-CB` |
| Patent Year | `acme.patent` | Single-line text | e.g. `1873 PAT.` |
| Bench Tester Name | `acme.bench_tester` | Single-line text | e.g. `R.K. Patel` |
| Bench Test Date | `acme.bench_test_date` | Date | ISO 8601 date |
| Workshop | `acme.workshop` | Single-line text | `Pune Press Shop 4` |
| Edition | `acme.edition` | Single-line text | `Spring 2026` |
| Fits Description | `acme.fits` | Multi-line text | Long fitment note |
| Net Weight | `acme.net_weight` | Single-line text | e.g. `0.86 kg` |
| Full Description | `acme.full_description` | Rich text | Long-form bench notes copy |
| Burner Size | `acme.burner_size` | Single-line text | `No. 2` or null |

> **Note:** Standard Shopify fields (title, description, price, variants, images, tags) do not need metafields. These metafields are for the spec table and fitment box only.

### A2.2 — Metafield Validation Rules

For `acme.bench_tester` and `acme.workshop`:
- Set validation: required, max 80 characters.

For `acme.sku`:
- Set validation: required, pattern `[A-Z]{2,4}-[0-9]{4}-[A-Z]{2,3}`.

### A2.3 — Expose Metafields via Storefront API

In Shopify Admin → Settings → Custom data → select each metafield → enable **"Storefront API access: Read"** for all 10 metafields above.

Without this, the Storefront API GraphQL queries in Plan B will not be able to read them.

---

### PHASE A2 STOP ✋

> **Complete ALL steps above, then report:**
> 1. All 10 metafield definitions created
> 2. Namespace + key matches table exactly (case-sensitive)
> 3. Storefront API read access enabled on all 10
> 4. Screenshot of metafield definitions list
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase A3 — Shopify Product Data Entry

### Objective
Enter all 50 products into Shopify with correct metafields, variants, collections, images, and SEO. This phase maps directly from `lib/mockData.ts` into the real Shopify catalogue.

### A3.1 — Product Entry Template (per product)

For each product, in Shopify Admin → **Products** → **Add product**, fill in:

**Standard Shopify fields:**

| Field | Value |
|---|---|
| Title | Full product name (e.g. `Cattaraugus Brass Center-Draft Lamp`) |
| Description | `shortDescription` from mock data |
| Status | Active |
| Category | Select from Shopify's product category taxonomy (closest match) |
| Price | As per mock data (USD) |
| SKU (Variant level) | `acme.sku` value |
| Barcode | Leave blank |
| Weight | Numeric value only (metafield stores formatted string) |
| Requires shipping | Yes |
| Track quantity | Yes (set starting inventory) |
| Images | Upload product images to Shopify CDN |

**Variant Setup (for products with Finish options):**

- Add variant option: **Finish** → values as per mock data (e.g. `Oiled Brass`, `Antique Nickel`, `Japanned Black`)
- Add second variant option (only for lamps): **Burner Size** → `No. 1`, `No. 2`, `No. 3`, `Universal`
- Price all variants the same (no price variance between finishes in this release)

**Metafields (scroll to bottom of product page):**

Fill all 10 `acme.*` metafields per product.

**Collections:**

Assign each product to exactly one collection (matching its category).

**Tags:**

Add tags matching material: `brass`, `nickel`, `glass`, `porcelain`, `iron` (used by filter).

**SEO:**

- Meta title: `[Product Name] — Acme Lamp & Sign Co.`
- URL handle: match `slug` field from mock data exactly.

### A3.2 — Category Distribution (50 products)

| Collection | Count |
|---|---|
| Lighting Fixtures | 15 |
| Glass & Chimneys | 12 |
| Burners & Hardware | 10 |
| Advertising Signs | 13 |
| **Total** | **50** |

### A3.3 — Featured Products

Tag the same 3 products that are `featured: true` in `mockData.ts` with the Shopify tag: `featured`. The frontend `PickedOffTheBench` section queries by this tag.

### A3.4 — Image Upload

For each product:
- Upload a minimum of 4 images per product to Shopify's media library.
- Alt text format: `[Product Name] — [Finish] — Acme Lamp & Sign Co.`
- Images must be: JPEG or WebP, minimum 1600px on longest side, sRGB color profile.

> **If real product images are not available yet:** Upload placeholder images (dark studio-tone square images with SKU text overlay) so the data structure is complete. Images can be swapped once photography is delivered.

---

### PHASE A3 STOP ✋

> **Complete ALL steps above, then report:**
> 1. Total products entered (target: 50)
> 2. All metafields populated per product
> 3. Variants configured (list products with Burner Size variants)
> 4. All products assigned to correct collections
> 5. 3 featured products tagged `featured`
> 6. Image upload status (real or placeholder)
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase A4 — Shopify Checkout & Shipping Configuration

### Objective
Configure the shipping rules, tax settings, checkout branding, and order notification emails to match the Acme Lamp & Sign brand.

### A4.1 — Shipping Rates

In Shopify Admin → **Settings** → **Shipping and delivery** → **Manage rates**:

**Zone: Australia**
- Flat rate: `Standard — Straw-packed crate` → $18.00 AUD
- Condition: Free shipping when order subtotal ≥ $150.00

**Zone: United States**
- Flat rate: `International freight` → $28.00 USD
- Free when subtotal ≥ $150.00

**Zone: Rest of World**
- Flat rate: `International freight` → $35.00 USD
- Free when subtotal ≥ $150.00

> These rates align with the copy on the frontend (`Free freight over $150` displayed on ProductInfo and the crate drawer).

### A4.2 — Tax Configuration

In Shopify Admin → **Settings** → **Taxes and duties**:
- Australia: Enable Shopify's automatic Australian GST calculation.
- International: Set to collect taxes at checkout based on customer location.
- Mark all products as taxable.

### A4.3 — Checkout Branding

In Shopify Admin → **Settings** → **Checkout** → **Customize**:

- **Logo:** Upload Acme Lamp & Sign wordmark (SVG or PNG, max 500px wide).
- **Background color:** `#FAF5EC` (parchment).
- **Button color:** `#2E4A3F` (green-brand).
- **Button text color:** `#F5F1E6`.
- **Font (heading):** Select closest to Playfair Display available (or leave default — the checkout page is Shopify-hosted).
- **Form background:** `#F2EBDB` (parchment-2).

### A4.4 — Customer Accounts

In Shopify Admin → **Settings** → **Customer accounts**:
- Select: **New customer accounts** (not legacy — required for the Customer Account API used in Plan B Phase B5).
- Enable: **Require email verification**.
- Login experience: **Sign in with email link** (passwordless is fine; Plan B handles UI).

### A4.5 — Order Confirmation Email

In Shopify Admin → **Settings** → **Notifications** → **Order confirmation**:
- Customize subject: `Your Acme Lamp & Sign order — [order_name]`
- Add plain-text footer:
  ```
  Your order is being straw-packed by hand at Adelaide House, 14 Pirie Street.
  You'll receive a dispatch confirmation within two business days.
  Questions? Write to hello@acmelamp.co or call +61 8 7000 1873.
  ```

### A4.6 — Abandoned Checkout

In Shopify Admin → **Marketing** → **Automations**:
- Enable: **Abandoned checkout** — send after 4 hours.
- Subject: `"Your crate is still waiting — Acme Lamp & Sign"`

---

### PHASE A4 STOP ✋

> **Complete ALL steps above, then report:**
> 1. Shipping zones and rates created (list all zones + rates)
> 2. Tax configuration verified (AU + international)
> 3. Checkout branded with correct colors and logo
> 4. New Customer Accounts enabled (not legacy)
> 5. Order confirmation email customized
> 6. Abandoned checkout automation enabled
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase A5 — Sanity Studio Schema Setup

### Objective
Define the Sanity content schemas for all CMS-driven content: journal posts, editorial copy, testimonials, and page sections for Our Story and Heritage.

### A5.1 — Sanity Studio Initialization

This creates the Studio app that the Acme team uses to edit content. It can be embedded at `/studio` in the Next.js app (handled in Plan B Phase B6), or run as a standalone admin.

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
    { name: 'author',      type: 'string',   title: 'Author name (e.g. R.K. Patel)' },
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

### A5.4 — Schema: Our Story Page

File: `schemas/ourStoryPage.ts`

```typescript
export default {
  name: 'ourStoryPage',
  title: 'Our Story Page',
  type: 'document',
  __experimental_actions: ['update', 'publish'],  // singleton — no create/delete
  fields: [
    { name: 'heroHeadline',       type: 'string', title: 'Hero Headline' },
    { name: 'heroBody',           type: 'text',   title: 'Hero Body' },
    { name: 'missionQuote',       type: 'text',   title: 'Mission Statement Quote' },
    { name: 'pillar1Title',       type: 'string', title: 'Pillar 01 Title' },
    { name: 'pillar1Body',        type: 'text',   title: 'Pillar 01 Body' },
    { name: 'pillar2Title',       type: 'string', title: 'Pillar 02 Title' },
    { name: 'pillar2Body',        type: 'text',   title: 'Pillar 02 Body' },
    { name: 'pillar3Title',       type: 'string', title: 'Pillar 03 Title' },
    { name: 'pillar3Body',        type: 'text',   title: 'Pillar 03 Body' },
    { name: 'foundersQuote',      type: 'text',   title: "Founder's testimonial quote" },
    { name: 'foundersAttribution',type: 'string', title: 'Founder attribution line' },
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
    { name: 'catalogSeasonEyebrow', type: 'string', title: 'Catalog season eyebrow (e.g. SPRING RELEASE · 50 PIECES)' },
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
import journalPost    from './schemas/journalPost'
import testimonial    from './schemas/testimonial'
import ourStoryPage   from './schemas/ourStoryPage'
import timelineEntry  from './schemas/timelineEntry'
import siteSettings   from './schemas/siteSettings'

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

Studio URL will be: `https://acme-lamp-sign.sanity.studio`

---

### PHASE A5 STOP ✋

> **Complete ALL steps above, then report:**
> 1. All 5 schemas created (list each file)
> 2. Studio starts locally without TypeScript errors (`npx sanity dev`)
> 3. Studio deployed — confirm URL accessible
> 4. All schema document types visible in the Studio sidebar
> 5. CORS origins configured (add `localhost:3000` and production domain in Sanity project settings → API → CORS origins)
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase A6 — Sanity Content Population

### Objective
Seed all CMS-driven content into Sanity. This mirrors the mock data currently hardcoded in the Next.js components.

### A6.1 — Populate Testimonials

Using the Sanity Studio at the deployed URL, create 3 testimonials (or more) that match the homepage testimonials bar:

| Quote | Attribution | Featured |
|---|---|---|
| "The Cattaraugus reproduction holds an extra flame — the bench test others won't run." | T. ALDRIDGE / LAMP COLLECTOR, VICTORIA | ✓ |
| "Acme Lamp & Sign's chimneys are the only ones we still recommend without an asterisk." | W. HOOPER / RESTORATION WORKSHOP, TASMANIA | ✓ |
| "The kind of shop that ships a hand-written invoice and means it." | B. SANTOS / INTERIOR ARCHITECT, SYDNEY | ✓ |

### A6.2 — Populate Heritage Timeline

Create 6 timeline entries matching the current hardcoded data in `app/heritage/page.tsx`:

| Year | Title | Description |
|---|---|---|
| 1873 | Cattaraugus patent | Bradley & Hubbard file the center-draft burner patent that anchors our entire fixtures collection. |
| 1881 | Pittsburgh railroad order | First gimbal-mounted caboose lamps roll out of the Pune works for the Indian railway. |
| 1898 | British Indian Lamp Co. closes | The dies stay. The Patel family buys the press shop for ₹140 and a promise. |
| 1934 | Porcelain signage line | A third firing process is developed for the advertising-sign trade. |
| 2003 | Adelaide distribution opens | The first containers cross the Indian Ocean, ending up on Pirie Street. |
| 2026 | Spring liquidation | Fifty surplus pieces. This is the website you are reading. No catalog will repeat exactly. |

### A6.3 — Populate Our Story Page

Create the `ourStoryPage` singleton document with all text currently hardcoded in `app/our-story/page.tsx`.

### A6.4 — Populate Site Settings

Create the `siteSettings` singleton with:
- Marquee text (copy from current `HeroSection.tsx` or `ProvenanceSection.tsx`)
- Newsletter heading + body (copy from current `Footer.tsx` / `BenchNotesCTA.tsx`)
- Catalog season eyebrow: `SPRING RELEASE · 50 PIECES`

### A6.5 — Create First Journal Post

Create at least 1 journal post as a content baseline (so the journal page renders with real data from day one):

- **Title:** `The night-burn test: what it means and why we run it`
- **Eyebrow:** `BENCH NOTES · SPRING 2026`
- **Excerpt:** `Every lamp we sell runs eight hours on No. 2 wick before it earns its tag. Here's what we're looking for — and what fails.`
- **Body:** Editorial copy (2–4 paragraphs, rich text)
- **Author:** `R.K. Patel`
- **Read time:** `5`

---

### PHASE A6 STOP ✋

> **Complete ALL steps above, then report:**
> 1. 3+ testimonials created and marked featured
> 2. 6 timeline entries created (confirm year order is correct)
> 3. Our Story page singleton populated
> 4. Site Settings singleton populated
> 5. At least 1 journal post created and published
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase A7 — Shopify Admin API & Webhooks

### Objective
Configure the Admin API scopes and set up webhooks so the Next.js backend can receive real-time order and inventory updates.

### A7.1 — Admin API Scopes

In Shopify Admin → App settings → Admin API integration, ensure these scopes are enabled on the custom app:

| Scope | Purpose |
|---|---|
| `read_orders` | Order history on account page |
| `read_customers` | Customer profile data |
| `write_customers` | Create/update customer records |
| `read_products` | Server-side product reads (ISR revalidation) |
| `read_inventory` | Stock level checks |
| `write_draft_orders` | (Future: wholesale/custom orders) |

### A7.2 — Webhooks

In Shopify Admin → **Settings** → **Notifications** → **Webhooks**:

Create the following webhooks pointing to your Next.js API routes (set up in Plan B Phase B7):

| Event | URL endpoint | Format |
|---|---|---|
| `orders/create` | `https://your-domain.com/api/webhooks/order-created` | JSON |
| `orders/fulfilled` | `https://your-domain.com/api/webhooks/order-fulfilled` | JSON |
| `orders/cancelled` | `https://your-domain.com/api/webhooks/order-cancelled` | JSON |
| `products/update` | `https://your-domain.com/api/webhooks/product-updated` | JSON |
| `inventory_levels/update` | `https://your-domain.com/api/webhooks/inventory-updated` | JSON |

> **Note:** The webhook URLs will only be active after Plan B Phase B7 deploys the API routes. Save the webhook secret key:
> ```
> SHOPIFY_WEBHOOK_SECRET=[webhook signing secret]
> ```

### A7.3 — Order Status Mapping

The frontend track-order page displays status labels. Map Shopify's fulfillment states to frontend display labels:

| Shopify Status | Frontend Label | Color |
|---|---|---|
| `unfulfilled` | Processing | Yellow |
| `partial` | Packed at Adelaide | Yellow |
| `fulfilled` | Dispatched | Green |
| `in_transit` | In Transit | Blue |
| `delivered` | Delivered | Green |
| `return_requested` | Return Requested | Orange |
| `returned` | Returned | Grey |

---

### PHASE A7 STOP ✋

> **Complete ALL steps above, then report:**
> 1. All 6 Admin API scopes confirmed active
> 2. All 5 webhooks created (list each with URL)
> 3. Webhook signing secret saved to `.env.local` template
> 4. Order status mapping table reviewed and confirmed
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase A8 — Go-Live Checklist & DNS

### Objective
Final verification before the codebase integration begins. Confirm all external systems are correctly configured and accessible.

### A8.1 — Shopify Verification Checklist

- [ ] 50 products live, all with status `Active`
- [ ] All products have at least 4 images
- [ ] All metafields populated on all products
- [ ] All products assigned to correct collections
- [ ] 3 products tagged `featured`
- [ ] Shipping rates created for AU + US + Rest of World
- [ ] Free shipping at $150 confirmed (test with a $149 cart and a $151 cart)
- [ ] Checkout branded (logo, parchment bg, green button)
- [ ] New Customer Accounts enabled
- [ ] Test customer account creation works (create one manually)
- [ ] Storefront API responds to a test query (use Shopify's API playground)

### A8.2 — Sanity Verification Checklist

- [ ] Studio accessible at deployed URL
- [ ] All 5 schema types visible
- [ ] Testimonials: 3+ documents, all marked `featured: true`
- [ ] Timeline: 6 entries, all published
- [ ] `ourStoryPage` singleton: all fields populated
- [ ] `siteSettings` singleton: all fields populated
- [ ] 1+ journal posts: published and publicly accessible via GROQ query
- [ ] CORS origin `localhost:3000` added in Sanity project settings

### A8.3 — API Smoke Tests

Before Plan B starts, verify each API is reachable:

**Shopify Storefront API (run in browser console or Insomnia):**
```graphql
{
  products(first: 3) {
    edges { node { title handle } }
  }
}
```
POST to: `https://[store].myshopify.com/api/2024-04/graphql.json`
Headers: `X-Shopify-Storefront-Access-Token: [token]`

**Sanity (GROQ via CDN):**
```
https://[projectId].api.sanity.io/v2024-01-01/data/query/production?query=*[_type=="testimonial"]
```

Both should return real data before proceeding to Plan B.

---

### PHASE A8 STOP ✋ — PLAN A COMPLETE ✋

> **Final Plan A report:**
> 1. All A8.1 Shopify checklist items: pass/fail
> 2. All A8.2 Sanity checklist items: pass/fail
> 3. Both A8.3 smoke tests: confirmed responses (paste first result of each)
> 4. All credentials documented in `.env.local` template
> 5. Any deviations from this plan and the reason
>
> **State: "External systems configuration complete. Ready to begin Plan B — Codebase Integration."**

---

*Acme Lamp & Sign Co. · Backend Implementation Plan A — External Systems*  
*Shopify + Sanity.io Setup · Spring Release 2026*  
*Companion document: `ACME_BACKEND_PLAN_B_CODEBASE_INTEGRATION.md`*
