# Sprint Timeline
## Acme Lamp & Sign Co. — Development Status

**Developer:** PPlazan
**Timeline Start:** May 26, 2026
**Last Updated:** June 10, 2026
**Target Launch:** TBD — pending Scott's confirmation

---

## Overall Status

| Phase | Focus | Status |
|---|---|---|
| Phase 1 | Core Storefront | ✅ Complete |
| Phase 2 | Checkout & Cart | ✅ Complete |
| Phase 3 | Admin Dashboard | ✅ Complete |
| Phase 4 | Colour Variants & Multi-Colour Cart | ✅ Complete |
| Phase 5 | Orders & Shipping | ✅ Complete |
| Phase 6 | Content & CMS | ⏳ Deferred — waiting on Scott |
| Phase 7 | Pre-Launch & Go-Live | ⏳ Blocked — waiting on Scott |

---

## ✅ Phase 1 — Core Storefront
**Complete**

- [x] Homepage, catalog page, product detail page (PDP)
- [x] Crate (cart) drawer + full crate page
- [x] Customer account (login, register, order history)
- [x] Contact form + newsletter → Google Apps Script
- [x] Breadcrumbs, reviews UI, related products, spec table
- [x] Mobile-responsive across all breakpoints
- [x] Deployed to Vercel — live at acmevintagesupply.com

---

## ✅ Phase 2 — Checkout & Cart
**Complete**

- [x] Shopify Storefront API cart (`cartCreate`, `cartLinesAdd`, `cartLinesUpdate`)
- [x] Redirect to Shopify-hosted checkout (`cart.checkoutUrl`)
- [x] Cart persistence via Zustand + Shopify cart ID
- [x] Full purchase flow: Add to Crate → View Crate → Proceed to Checkout → Payment

---

## ✅ Phase 3 — Admin Dashboard
**Complete** *(originally planned as post-launch; built early)*

- [x] Protected `/admin` route (iron-session password login)
- [x] Orders list — live order data from Shopify Admin API
- [x] Order detail page — line items, variant titles, customer info
- [x] Print Invoice + Print Shipping Label (CONTENTS section with item details)
- [x] Revenue overview (daily/weekly/monthly)
- [x] Inventory levels per product
- [x] Add product form — writes to Shopify via Admin API
- [x] Edit product form — updates Shopify
- [x] Customer list — name, email, order count
- [x] Fully styled to match Acme design system

---

## ✅ Phase 4 — Colour Variants & Multi-Colour Cart
**Complete**

- [x] Admin: colour variant toggle — create product with per-colour price + stock
- [x] Admin: edit product — add new colours to existing products (persists correctly)
- [x] Storefront: colour swatch selector on PDP — price + stock updates per variant
- [x] Cart guard — must select a colour before adding to crate
- [x] Multi-colour opt-in — "Buying multiple colours?" expands per-colour qty table
- [x] Grouped cart display — variant items grouped by product in drawer + crate page
- [x] Orders show `variantTitle` (e.g. Green, Ruby Red) on each line item

---

## ✅ Phase 5 — Orders & Shipping
**Complete**

- [x] Admin order detail: variant title shown on each line item
- [x] Print Invoice: variant title included in line item rows
- [x] Print Shipping Label: CONTENTS section lists item name, variant, SKU, and quantity

**Deferred:**
- [ ] Shipping label + invoice layout redesign — waiting on Scott's sample format
- [ ] Order prefix `ACME` — Scott sets in Shopify Admin → Settings → General → Order ID format

---

## ⏳ Phase 6 — Content & CMS
**Blocked — waiting on Scott**

### Sanity CMS Integration
- [ ] Sanity account created and project shared with PPlazan
- [ ] Journal / Bench Notes (blog listing + individual post pages)
- [ ] Heritage timeline entries
- [ ] Testimonials (replace mock data in carousel)
- [ ] Homepage hero content (editable headline, subtext, CTA)
- [ ] Our Story page content

### Product Data
- [ ] 23 remaining products added to Shopify (CSV: `products-new-only-without-image.csv` on Desktop)
- [ ] Photos uploaded for 11 products added June 9
- [ ] Photos uploaded for remaining products

### Analytics & Business Tools
- [ ] Google Analytics 4 — Scott creates GA4 property → provides Measurement ID
- [ ] Business email `scott@acmevintagesupply.ca` activation via Microsoft 365
- [ ] Shopify store name updated from "My Store" (appears in receipts)

---

## ⏳ Phase 7 — Pre-Launch & Go-Live
**Blocked — launch date TBD, pending Scott's confirmation**

### QA Checklist
- [ ] Full end-to-end purchase test (real product, real payment)
- [ ] Mobile QA across breakpoints (320px, 375px, 768px, 1280px)
- [ ] All pages load without console errors

### Performance
- [ ] Lighthouse score ≥ 90 on all key pages
- [ ] `next/image` optimization verified on all images

### Pre-Launch Cleanup
- [ ] Remove `app/api/test-shopify/route.ts`
- [ ] Confirm all environment variables in Vercel production
- [ ] Confirm Shopify Storefront API token is production-scoped

### Go-Live
- [ ] Domain DNS pointed to Vercel (propagation — allow 24–48 hrs)
- [ ] SSL certificate active (Vercel auto-provisions)
- [ ] Smoke test on production URL
- [ ] Announce to Scott ✓

---

## Critical Path — Blocked on Scott

These items will delay launch if not resolved:

| Task | Impact if Late |
|---|---|
| Confirm launch date | Cannot schedule final QA or go-live |
| Shopify Payments activation | Currently on test mode — real payments cannot be processed at launch |
| Product photos uploaded | Placeholder images at launch |
| 23 remaining products added | Incomplete catalog at launch |
| Google Analytics Measurement ID | No analytics at launch |
| Business email activated | No professional contact address |
| Shopify store name updated | "My Store" appears in receipts |
| Sample invoice/label format | Generic layout used |
| Return policy written | Cancel/return flow cannot be built |

---

## Deferred Features (Post-Launch)

| Feature | Notes |
|---|---|
| Cancel / return flow | Design ready — blocked on Scott's written return policy |
| Sanity CMS | Waiting on Scott's Sanity account access |
| Reviews (live data) | Currently mock — needs Judge.me / Yotpo / Sanity decision |

---

*Timeline created: 2026-05-26 · Last updated: 2026-06-10 · Developer: PPlazan*
