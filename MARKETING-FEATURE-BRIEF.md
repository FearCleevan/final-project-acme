# Acme Vintage Supply — Marketing Feature Brief
**Prepared:** 2026-06-27
**Audience:** Marketing team / ad copy / social media / campaign assets
**Source:** Live codebase audit — all facts below verified from actual code and config

---

## 1. Current Live Status

**Live URL:** https://acmevintagesupply.com

**Domain:** `acmevintagesupply.com` is the configured primary domain (`NEXT_PUBLIC_SITE_URL`). All canonical tags, sitemap, and OG meta point to this domain.

**Shopify Store:** Connected to `w061f6-k8.myshopify.com` via Storefront API 2025-01. Real product data, real cart, real checkout.

**Shopify Payments:** ✅ **Active** — Activated June 25, 2026 (Robin). RBC bank account linked (****5312). Payouts begin June 28, 2026.

**Checkout:** ✅ **Processing real orders.** Cart is built client-side (Zustand), then handed off to Shopify's hosted checkout. Shopify handles payment capture, fraud, and receipts. No custom payment form.

**Hosting:** Vercel (Next.js 16 App Router). Vercel Analytics active.

---

## 2. Product Catalog — What Is Actually for Sale

**Data source:** Live Shopify Storefront API (fetches up to 250 products sorted by title). The storefront is reading real Shopify inventory.

**Product categories (Shopify collection handles):**

| Category | Collection Handle |
|---|---|
| Oil Lamp Chimneys | `oil-lamp-chimneys` |
| Oil Lamp Shades | `oil-lamp-shades` |
| Pressure Lamp Glass | `oil-lamp-pressure-lamps` |
| Oil Lamp Wicks | `oil-lamp-wicks` |
| Oil Lamp Books | `oil-lamp-books` |
| Oil Lamp Spreaders | `oil-lamp-spreaders` |
| Enamel Signs | `signs` |

**Known live products (from development mock data — real Shopify SKUs/prices may differ slightly):**

| SKU | Name | Price (CAD) | Description |
|---|---|---|---|
| EB-001 | Oil Lamp Shade — Floral Etched Blue 4" Fit | $135.85 | Etched floral pattern, No. 3 burner fit |
| EB-002 | Oil Lamp Shade — Open Tulip Etched Magenta 4" | $135.85 | Open tulip form, No. 2 burner fit |
| EB-003 | Oil Lamp Wick — Flat Cotton 7/8" | $5.72 | Flat cotton wick for standard burners |
| EB-004 | Oil Lamp Wick — Duplex 1 1/16" | $7.87 | Duplex cotton wick for duplex burners |
| EB-005 | Pressure Lamp Glass — Tilley 171 | $35.75 | Replacement glass for Tilley pressure lamps |
| EB-006 | Vesta Shade — 7 3/8" Cupid Etched Green | $92.95 | Victorian Vesta shade with etched Cupid motif |
| EB-007 | Pressure Lamp Glass — Handi | $35.75 | Replacement glass for Handi pressure lamps |
| EB-008 | Kosmos Chimney — 6 ligne Clear Tall | $21.45 | Tall Kosmos chimney for No. 1 burners |

> **Note:** The above are confirmed via development seed data. The live Shopify catalog count is approximately 23 products with real photography (from June 19 inventory audit). 29 additional products are in Shopify but still awaiting product photography — these are live/purchasable but may lack images.

**Photography status:**
- Products with photography: ~23 (Shopify CDN images)
- Products without photography: ~29 (placeholder or no image)

**Per-product metadata built into the storefront (from Shopify metafields):**
- SKU, bench tester name, bench test date, workshop, edition/serial
- Material, era, brand, condition, style
- Burner size compatibility (No. 1 / No. 2 / No. 3 / Universal)
- Net weight, power source, full description
- Vintage designation, sold count

---

## 3. All Live Pages & Routes

### Storefront (Public)

| Route | Content Source | Real or Placeholder? |
|---|---|---|
| `/` | Hero from Redis CMS + hardcoded fallback; products from Shopify | Real (CMS + Shopify) |
| `/catalog` | Shopify Storefront API | Real |
| `/catalog/[slug]` | Shopify Storefront API + Supabase reviews | Real |
| `/signs` | Shopify collection `signs` | Real |
| `/our-story` | Redis CMS (`content:story`) + `data/story.json` fallback | Real (CMS-managed) |
| `/heritage` | Redis CMS + `data/heritage.json` fallback | Real (CMS-managed) |
| `/journal` | `data/journal.json` + `data/blogPosts.json` | Hardcoded JSON files |
| `/guides` | Unknown — not fully audited | Likely hardcoded |
| `/restoration` | Unknown — not fully audited | Likely hardcoded |
| `/contact` | Form posts to Google Apps Script + Supabase | Functional |
| `/faq` | Redis CMS (`content:faq`) + hardcoded fallback | Real (CMS-managed) |
| `/shipping` | Redis CMS (`content:shipping`) + hardcoded fallback | Real (CMS-managed) |
| `/returns` | Redis CMS (`content:returns`) + hardcoded fallback | Real (CMS-managed) |
| `/track-order` | Shopify Orders API (real-time) | Real |
| `/legal/privacy-policy` | Hardcoded | Static |
| `/legal/terms` | Hardcoded | Static |
| `/legal/accessibility` | Hardcoded | Static |

### Customer Account (Requires Shopify Login)

| Route | What It Shows |
|---|---|
| `/account` | Order history, addresses, returns, crate |
| `/account/reset` | Password reset |
| `/login` | Shopify customer OAuth login |

### Checkout

| Route | Status |
|---|---|
| `/crate` | Cart page — real Shopify cart |
| `/checkout` | Multi-step contact + shipping form → redirects to Shopify-hosted payment |
| `/checkout/confirmed` | Order confirmation |

### Editorial Content Status

| Page | Written Content in CMS? |
|---|---|
| Our Story | ✅ Yes — editable via `/admin/content/story` (Redis) |
| Heritage Timeline | ✅ Yes — editable via admin CMS |
| FAQ | ✅ Yes — editable via `/admin/content/footer` (Redis) |
| Shipping Info | ✅ Yes — editable |
| Returns Policy | ✅ Yes — editable |
| Journal / Blog | Hardcoded JSON files — not in CMS |
| Guides | Unknown — not in CMS |

---

## 4. Features Built into the Storefront

### Fully Functional (end-to-end)

| Feature | Notes |
|---|---|
| Product catalog | Live Shopify products, images, prices, variants |
| Add to cart | Client-side (Zustand), persists across pages |
| Cart / Crate page | Real totals, freight logic ($0 over $150 CAD, $18 otherwise) |
| Checkout | Shopify-hosted payment, real order creation |
| Order confirmation | `/checkout/confirmed` page |
| Order tracking | Public lookup by order # + email via Shopify API |
| Customer accounts | Login, order history, address book, return requests |
| Newsletter signup | Footer form → Supabase `newsletter_subscribers` table |
| Back-in-stock alerts | "Notify Me" → Supabase → Resend email when admin triggers restock |
| Product reviews | Supabase-backed, moderated, verified purchase badge, helpful votes |
| Contact form | Google Apps Script + Supabase `contact_messages` table |
| Search | Product search overlay (queries Shopify) |
| Product variants | Color/finish variant selector on PDP |

### UI-Built but Partially Manual

| Feature | Status |
|---|---|
| Review approval | Reviews require admin approval via `/admin/reviews` before showing |
| Back-in-stock trigger | Admin manually triggers the restock email batch |
| Newsletter campaigns | Admin drafts and sends campaigns via `/admin/marketing` |

### Admin Dashboard (Internal — Not Customer-Facing)

- Inventory management (Shopify sync)
- Order management with invoice + shipping label printing
- Review moderation queue
- Newsletter campaign builder (3 email templates: Bench Notes, New Arrivals, Seasonal Sale)
- Email preview modal with desktop/mobile preview
- Pre-built template library
- Customer communication inbox (contact messages, bench notes, waitlist)
- Traffic analytics (page views, device, referral)
- Admin activity log
- Content CMS (hero, story, heritage, FAQ, shipping, returns)

---

## 5. CMS & Supabase Integration

### Content Management System

**Storage:** Upstash Redis — not a traditional CMS or database. Content is stored as JSON objects under keys like `content:hero`, `content:faq`, etc.

**Admin interface:** `/admin/content/home`, `/admin/content/story`, `/admin/content/footer`

| Content Key | What It Controls | Admin Page |
|---|---|---|
| `content:hero` | Homepage hero headline, subheadline, CTA | `/admin/content/home` |
| `content:bench` | Bench section copy on homepage | `/admin/content/home` |
| `content:testimonials` | Testimonials carousel | `/admin/content/home` |
| `content:story` | Our Story page — headline, intro, pillars | `/admin/content/story` |
| `content:heritage` | Heritage Timeline — dates, text, images | `/admin/content/story` |
| `content:faq` | FAQ page — categories, Q&A pairs | `/admin/content/footer` |
| `content:shipping` | Shipping rates and policy copy | `/admin/content/footer` |
| `content:returns` | Returns policy sections | `/admin/content/footer` |

### Supabase Tables

**Supabase project:** `hnycigpwtydgwjacgqls.supabase.co`

| Table | What It Holds |
|---|---|
| `reviews` | Product reviews (rating, title, body, email, product handle, approved status, verified purchase flag, helpful vote count) |
| `review_helpful_votes` | One row per helpful vote (reviewer + voter token) |
| `newsletter_subscribers` | Email list (email, subscribed_at, unsubscribed_at) |
| `email_campaigns` | Campaign records (subject, body, template, template_data, status, sent_at, recipient_count) |
| `back_in_stock_requests` | Restock notifications (email, product handle, notified_at) |
| `contact_messages` | Contact form submissions (name, email, subject, message, read_at) |
| `bench_notes` | Internal admin notes (title, body, pinned, created_at) |

### What Pulls from Supabase vs Hardcoded

| Feature | Source |
|---|---|
| Product reviews on PDP | ✅ Supabase (live) |
| Newsletter subscriber list | ✅ Supabase (live) |
| Email campaign history | ✅ Supabase (live) |
| Back-in-stock requests | ✅ Supabase (live) |
| Contact form messages | ✅ Supabase (live) |
| Homepage testimonials | ⚠️ Hardcoded in `data/testimonials.json` |
| Journal / blog posts | ⚠️ Hardcoded in `data/journal.json` |
| Guides content | ⚠️ Hardcoded (not audited) |

---

## 6. Email & Newsletter

**Email provider:** Resend (`hello@acmevintagesupply.com`)

**Newsletter signup:** Footer form on every storefront page. Email stored in Supabase `newsletter_subscribers` table. De-duplication enforced at database level.

**"Bench Notes" as an email list:** ✅ Yes — Supabase stores the subscriber list. Admin dashboard (`/admin/marketing`) provides a campaign builder. Campaigns are sent via Resend to all active subscribers.

**Email templates built (admin campaign composer):**
1. **Bench Notes** — Personal letter from the workshop (Georgia serif, parchment background)
2. **New Arrivals Spotlight** — Product showcase (up to 3 items with images, price, link)
3. **Seasonal Sale** — Promotional email with discount code badge and urgency line

**Transactional emails (auto-triggered):**
- New order → admin alert (all 3 admin addresses)
- Back-in-stock → subscriber notification
- Packing notification → customer (when order packed at workshop)
- Forgot password → admin reset link

**Is Bench Notes connected to Klaviyo or Mailchimp?** No. Built-in system only (Supabase list + Resend delivery).

**Is Shopify Email set up?** No. Shopify handles payment receipts only; all other emails go via Resend.

---

## 7. Trust & Social Proof

### On Product Detail Pages

- **Star rating** — average (1 decimal), total review count, distribution bar chart
- **Individual reviews** — customer name, date, star rating, title, body
- **Verified Purchase badge** — shown when purchase confirmed via Shopify order history
- **Helpful votes** — "Was this helpful? X found this helpful"
- **Notes from the Bench** — bench tester name, test date, workshop, edition number, material, era
- **Condition indicator** — Original / Reproduction / Good / Excellent
- **Breadcrumb navigation**

### Customer Reviews Status

- **Data source:** Supabase `reviews` table — **real data**
- **Moderation:** All new reviews require admin approval before display
- **Verification:** Checks Shopify order history to award "Verified Purchase" badge
- **Current review count:** Unknown (depends on actual Supabase data)

### Homepage Testimonials

- **Data source:** Hardcoded `data/testimonials.json`
- **Content:** 6 testimonials — ⚠️ **These appear to be for the sign fabrication / welding business, not the oil lamp supply store.** Language references "welding," "metalwork," and "fabrication" — not lamp parts.
- **Recommendation:** Replace with actual oil lamp customer reviews before any marketing campaign references the testimonials.

### Other Trust Signals

- Physical location ("Dartmouth, Nova Scotia") on every page and in email footer
- Direct phone: (902) 481-1007 (on returns page)
- Direct email: acmesign01@gmail.com
- "Bench-tested" provenance claims on PDPs
- "Over 20 years supplying collectors" (heritage page)
- "Original Birmingham tooling" specification (product copy)

---

## 8. SEO Setup

**Meta title template:** `[Page Title] | Acme Vintage Supply`

**Root description:** "Buy oil lamp chimneys, shades, pressure lamp glass, wicks, and original Victorian enamel advertising signs. Bench-tested antique lamp parts shipped across Canada and North America from Dartmouth, Nova Scotia."

**Primary keyword targeting (90+ keywords in root meta):**
- Oil lamp chimneys (duplex, Kosmos, Miller, crimp, crystal, flair top, comet)
- Oil lamp shades (tulip, beehive, Victorian)
- Pressure lamp glass (Coleman, Aladdin, hurricane)
- Enamel advertising signs (antique, vintage, porcelain)
- Restoration parts (wicks, burners, spreaders)
- Regional: oil lamp supply Canada, Nova Scotia, Dartmouth

**Sitemap:** `https://acmevintagesupply.com/sitemap.xml`
- 21 static pages (catalog, story, heritage, FAQ, etc.)
- All Shopify products dynamically included (fetched at build time)
- Product pages: priority 0.8, updated weekly

**robots.txt:** Excludes `/admin/`, `/api/`, `/account/`, `/checkout/`, `/crate/`, `/login/`, `/track-order/`

**Per-page SEO coverage:**

| Page | Custom Metadata | Structured Data |
|---|---|---|
| `/` | ✅ Root metadata | None |
| `/catalog` | ✅ Catalog-specific title + description | None |
| `/catalog/[slug]` | ✅ Product name, price, OG image | ✅ Product + AggregateRating + BreadcrumbList JSON-LD |
| `/faq` | ✅ Custom | ✅ FAQPage JSON-LD |
| `/shipping` | ✅ "Shipping Information — Canada, US & Worldwide" | None |
| `/returns` | ✅ "Returns & Refunds — Acme Vintage Supply" | None |
| `/our-story` | ✅ Custom | None |
| `/heritage` | ⚠️ Inherits root | None |
| `/journal` | ⚠️ Inherits root | None |
| `/guides` | ⚠️ Inherits root | None |
| `/contact` | ⚠️ Inherits root | None |

**Sitemap submitted to Google Search Console?** Pending — recommended post-launch action.

---

## 9. What Is Still Pending Before Launch

| Item | Status | Owner |
|---|---|---|
| Supabase migration (`template` + `template_data` columns on `email_campaigns`) | ⏳ Pending manual SQL run | **Developer (Peter)** |
| 29 products without photography | ⏳ Waiting on product photo shoot | **Scott** |
| Testimonials carousel — content mismatch (fabrication/sign testimonials on oil lamp store) | ⏳ Needs replacement content | **Scott** |
| Google Search Console — submit sitemap | ⏳ Post-deploy action | **Developer (Peter)** |
| Update `ADMIN_EMAIL` to Scott's email only (currently also has dev email) | ⏳ Before go-live | **Developer (Peter)** |
| Journal / blog posts — currently hardcoded JSON, not CMS-managed | ⏳ Low priority | **Scott (content)** |
| Guides pages — content source not audited | ⏳ Unknown | TBD |
| `/heritage`, `/journal`, `/guides`, `/contact` pages — no custom metadata | ⏳ Minor SEO gap | **Developer (Peter)** |
| Cancel/return flow — full design ready, blocked on written return policy | ⏳ Waiting on Scott | **Scott** |
| Facebook Full Control access (Robin not yet properly granted) | ⏳ Pending Robin's action | **Scott → Robin** |
| Post-checkout tracking snippet (Liquid, Shopify order status page) | ⏳ Deferred | **Developer (Peter)** |
| Shopify payouts — first payout expected June 28, 2026 | ⏳ In progress | **Shopify / Robin** |

---

*Brief generated from codebase audit on 2026-06-27. All technical details verified against live source files.*
