# Sprint Timeline
## Acme Lamp & Sign Co. — Remaining Development

**Developer:** PPlazan
**Timeline Start:** May 26, 2026
**Target Launch:** Week of June 23, 2026

---

## Overview

| Week | Dates | Focus | Status |
|---|---|---|---|
| Week 1 | May 26 – May 30 | Product Data Entry | In Progress |
| Week 2 | Jun 2 – Jun 6 | Checkout & Payment Integration | Upcoming |
| Week 3 | Jun 9 – Jun 13 | Sanity CMS Integration | Upcoming |
| Week 4 | Jun 16 – Jun 20 | Reviews & Customer Accounts | Upcoming |
| Week 5 | Jun 23 – Jun 27 | Polish & Launch | Upcoming |

---

## Week 1 — Product Data Entry
**May 26 – May 30, 2026**

Enter the remaining 15 products into Shopify using the established process from the first product.

**Each product requires:**
- [ ] Title, price, description (short — 1–2 sentences)
- [ ] Collection assignment (Glass & Chimneys / Lighting Fixtures / Hardware / Signs)
- [ ] Tags (`featured` where applicable)
- [ ] Vendor: *Acme Lamp & Sign Co.*
- [ ] All `acme.*` metafields filled (SKU, material, era, power source, condition, type, etc.)
- [ ] Images uploaded (eBay CDN or local)

**Fix on first product:**
- [ ] Clear compare-at price (remove $135.85)
- [ ] Confirm `featured` tag is applied
- [ ] Confirm Vendor is set correctly

**Owner:** PPlazan (product entry) · Scott (image assets, product details)

---

## Week 2 — Checkout & Payment Integration
**Jun 2 – Jun 6, 2026**

Wire the existing cart and checkout UI to live Shopify checkout. The UI is already built — this week connects it to real transactions.

**Codebase tasks:**
- [ ] Implement Shopify Storefront API cart creation (`cartCreate` mutation)
- [ ] Add lines to cart (`cartLinesAdd`) on "Add to Crate"
- [ ] Redirect to Shopify-hosted checkout (`cart.checkoutUrl`)
- [ ] Handle cart persistence (replace Zustand-only state with Shopify cart ID)
- [ ] Test full flow: Add product → View crate → Proceed to checkout → Payment

**Shopify/Scott tasks (must be done before this week):**
- [ ] Shopify Payments activated
- [ ] Shipping zones and rates configured in Shopify
- [ ] Test payment with real card (Scott + PPlazan together)

---

## Week 3 — Sanity CMS Integration
**Jun 9 – Jun 13, 2026**

Connect the existing Sanity schema and client to live content. Sanity account access from Scott required before this week begins.

**Content types to wire:**
- [ ] Journal / Bench Notes (blog listing + individual post pages)
- [ ] Heritage timeline entries
- [ ] Testimonials (replace mock data in carousel)
- [ ] Homepage hero content (editable headline, subtext, CTA)
- [ ] Our Story page content

**Codebase tasks:**
- [ ] Verify Sanity client config (`lib/sanity.ts`)
- [ ] Replace static content with `sanity.fetch()` calls per content type
- [ ] GROQ queries for each content type
- [ ] Test in Sanity Studio — create one real entry per type
- [ ] ISR or on-demand revalidation for Sanity content updates

**Scott tasks (must be done before this week):**
- [ ] Sanity account created and project shared with PPlazan
- [ ] Content populated in Sanity Studio (or at least placeholder entries)

---

## Week 4 — Reviews & Customer Accounts
**Jun 16 – Jun 20, 2026**

Connect the existing reviews UI and auth modal to real data sources. Both UI shells are already built.

**Reviews:**
- [ ] Decide on reviews source: Sanity (manual entry) or third-party (Judge.me / Yotpo)
- [ ] Replace `mockReviews.ts` with live data fetch
- [ ] Wire aggregate rating + individual review cards to real data
- [ ] Optional: Review submission form

**Customer Accounts:**
- [ ] Shopify Customer API — sign in (`customerAccessTokenCreate`)
- [ ] Register (`customerCreate`)
- [ ] Fetch order history for logged-in customer
- [ ] Persist auth token (Zustand + `localStorage`)
- [ ] Wire auth state to nav account icon / dropdown
- [ ] Protected account dashboard (redirect if not logged in)

---

## Week 5 — Polish & Launch
**Jun 23 – Jun 27, 2026**

Final QA, performance pass, and production launch.

**QA checklist:**
- [ ] Full end-to-end purchase test (real product, real payment)
- [ ] Mobile QA across breakpoints (320px, 375px, 768px, 1280px)
- [ ] Keyboard navigation pass (all interactive elements reachable)
- [ ] Screen reader test (VoiceOver / NVDA)
- [ ] All pages load without console errors

**Performance:**
- [ ] Lighthouse score ≥ 90 on all key pages
- [ ] `next/image` optimization verified on all images
- [ ] Font loading — no FOUT on serif headings

**Pre-launch cleanup:**
- [ ] Remove `app/api/test-shopify/route.ts`
- [ ] Confirm all environment variables in Vercel production
- [ ] Confirm Sanity CORS origin includes production domain
- [ ] Confirm Shopify Storefront API token is production-scoped

**Go-live:**
- [ ] Domain pointed to Vercel (DNS propagation — allow 24–48 hrs)
- [ ] SSL certificate active (Vercel auto-provisions)
- [ ] Smoke test on production URL
- [ ] Announce to Scott ✓

**Scott tasks (must be done before go-live):**
- [ ] Domain purchased and DNS pointed to Vercel
- [ ] Shopify store name updated from "My Store"
- [ ] Shopify Payments fully activated and verified
- [ ] Real product photography delivered (if replacing eBay images)

---

## Critical Path — Scott's Tasks

These items are **blocked on the client** and will delay the schedule if not completed on time:

| Task | Needed By | Impact if Late |
|---|---|---|
| Shopify Payments activation | Before Week 2 (Jun 2) | Checkout integration cannot be tested |
| Sanity account access shared | Before Week 3 (Jun 9) | CMS integration cannot begin |
| Domain purchase + DNS setup | Before Week 5 (Jun 23) | Launch delayed |
| Real product photography | Before Week 5 (Jun 23) | eBay CDN images used at launch |
| Shopify store name updated | Before Week 5 (Jun 23) | "My Store" appears in receipts |

---

*Timeline created: 2026-05-26 · Developer: PPlazan*

---

## Phase 2 — Post-Launch Features
**July 2026 and beyond**

Features planned after the store is live and stable. These are not part of the launch scope.

---

### Custom Admin Dashboard
**Estimated effort:** 1–2 weeks

Build a protected `/admin` route inside this Next.js codebase that connects to the **Shopify Admin API** — giving Scott (and PPlazan) a personalized dashboard without needing to browse Shopify admin directly.

**Planned features:**
- [ ] Order tracking — live order list, status, fulfillment
- [ ] Revenue overview — daily/weekly/monthly charts
- [ ] Inventory levels — stock counts per product
- [ ] Add / edit products — form that writes directly to Shopify via Admin API
- [ ] Customer list — name, email, order count
- [ ] Protected login — password or token-gated, only accessible by owner

**Technical notes:**
- Uses Shopify **Admin API** (not Storefront API — separate token required)
- Dashboard route protected via middleware or session token
- Charts via a lightweight library (e.g. Recharts)
- Fully styled to match the Acme Lamp & Sign design system

**Why post-launch:**
Shopify admin already handles all of this reliably. Building a custom dashboard before launch would delay the go-live date. Once the store is live and Scott is comfortable, this becomes a high-value quality-of-life feature.
