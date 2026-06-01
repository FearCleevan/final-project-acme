# Session Handoff — June 1, 2026
## Acme Lamp & Sign Co. — Development Handoff Note

**Developer:** PPlazan (`jonathan.mauring17@gmail.com`)
**Live URL:** https://acmelampandsign.vercel.app/
**Admin URL:** https://acmelampandsign.vercel.app/admin (password: `acme2026`)
**Shopify Store:** `w061f6-k8.myshopify.com`

---

## What Was Done This Session (June 1)

### Admin Dashboard
- ✅ **Analytics page re-enabled** — Full Shopify Analytics-inspired layout: 4 stat cards, revenue chart + sales breakdown sidebar, 3 mini line charts (AOV / Sessions / Conversion), donut charts, top products bar, conversion funnel. Visible in sidebar.
- ✅ **Color accents applied** — Green pill-style TrendChips on all stat cards and mini charts. Green fills on RevenueChart, OrdersChart, HorizontalBarChart, MiniLineChart. New CSS tokens: `--admin-chart`, `--admin-chip-green-bg/text`, `--admin-chip-red-bg/text`.
- ✅ **Shared TrendChip component** — Extracted from 3 duplicate local functions into `components/admin/shared/TrendChip.tsx`. StatCard, Analytics page, MiniLineChart all use it.
- ✅ **Analytics added to mobile bottom nav** — Now in the "More" sheet between Collections and Settings.
- ✅ **ConversionFunnel mobile fix** — 2×2 grid on mobile, horizontal flex with arrows on sm+.
- ✅ **Admin dynamic order badge** — Orders sidebar badge now shows live unfulfilled count from Shopify API. Hides when count is 0. `NAV_MAIN` moved inside component to access state.

### Storefront
- ✅ **Checkout shipping data bug fixed** — `handleShippingComplete` now captures and stores `ShippingData` in state. Step 3 shows a "Shipping to" review card with full address, email, phone, and packer notes.
- ✅ **Currency label fixed** — `Total · USD` → `Total · CAD` in `OrderSummary.tsx`.
- ✅ **Tax line added** — "Taxes & duties · Calculated at checkout" row added to order summary.
- ✅ **Mobile QA fixes (3 bugs):**
  - `MobileDrawer` catalog sub-links had wrong category values (`lighting`, `glass-chimneys`). Fixed to actual Shopify handles (`oil-lamp-chimneys`, `oil-lamp-shades`, etc.).
  - `FilterBar` padding was `px-6` at all sizes. Fixed to `px-4 sm:px-6` to align with product grid.
  - `HeroSection` min-height was `min-h-[90vh]` on all sizes. Fixed to `min-h-[70vh] sm:min-h-[90vh]`.
- ✅ **Custom 404 page** — `app/not-found.tsx` — branded with faded "404" decoration, serif headline "This wick has burned out.", two CTA buttons. Renders inside storefront layout (nav included automatically).

### Documentation
- ✅ `DAILY_LOG_2026-06-01.md` — Full status report: what's done, what's not done, blockers.

---

## Current Status of Every Major Area

### Storefront Pages
| Page | Status |
|---|---|
| Homepage | ✅ Complete |
| Catalog | ✅ Complete |
| Product Detail | ✅ Complete |
| Cart (`/crate`) | ✅ Complete + Shopify-connected |
| Checkout | ✅ UI complete — mock payment, no real Shopify order creation yet |
| Order Confirmed | ✅ Complete — random order ref (not real Shopify ID yet) |
| Track Order | ✅ Complete — uses mock fulfillment data |
| Heritage / Our Story | ✅ Built — placeholder copy (waiting on client content) |
| Journal / Blog | ✅ Built — placeholder posts |
| FAQ / Returns / Shipping | ✅ Built — placeholder copy |
| Contact | ✅ Built — form present, not wired to email yet |
| Customer Account (`/account`) | ✅ UI built — auth not wired yet |
| 404 | ✅ Custom branded page |

### Admin Dashboard
| Section | Data Source | Status |
|---|---|---|
| Overview | Mock data | ✅ Complete |
| Orders | **Shopify API** | ✅ Live |
| Products | **Shopify API** | ✅ Live |
| Inventory | **Shopify API** | ✅ Live |
| Collections | **Shopify API** | ✅ Live |
| Customers | Mock data | ⚠️ Mock only — API route not built |
| Analytics | Mock data | ✅ Complete (always mock — traffic data) |
| Settings | Local | ✅ Complete |

---

## Three Safety Features — Honest Status

### 1. Error Handling ✅ (Mostly done)
- API routes wrap all Shopify calls in try/catch → return `{ error }` with 500
- Frontend shows red toast on save failures
- Shopify `userErrors` (field validation) are caught and thrown
- **Gap:** Specific Shopify error message (e.g. "Title too long") shows in server console but the toast shows a generic message. To fix: forward `err.message` from the API response to the toast.

### 2. Rate Limiting ⚠️ (Built but inactive)
- `lib/admin/ratelimit.ts` — Upstash Redis limiter: 5 login attempts / IP / 15 min
- **Currently OFF** — only activates when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set in Vercel environment variables
- Shopify API pacing: not needed at this scale (1 admin user, well under 40 req/sec limit)
- **Action needed before launch:** Add two Upstash env vars to Vercel to turn on login protection

### 3. Webhooks ❌ (Not built)
- No `/api/webhooks` route exists
- Dashboard fetches fresh data on every page load (`cache: 'no-store'`) — so it's always current when you visit
- If Scott changes something directly in Shopify, the dashboard won't show it until you refresh the page
- Real-time push alerts (new order ping) require webhooks — currently not implemented
- **Not urgent** for this use case — PPlazan is the only admin user

---

## Blockers — Waiting on Scott

| Blocker | Unlocks | Urgency |
|---|---|---|
| Shopify store domain + Storefront API token | Cart end-to-end testing, Checkout → Shopify redirect | NOW |
| Shopify Payments fully activated | Real checkout transactions | Week 2 |
| Domain purchase + DNS → Vercel | Go-live | Week 5 |
| Shopify store name updated (currently "My Store") | Correct name on receipts | Before launch |
| Client copy for Heritage, Our Story, Returns, Shipping, FAQ | Replace placeholder text | Week 3 |

**Sanity CMS → DROPPED.** Scott is not tech-savvy and didn't want to manage a Sanity account. Decision made June 1: Replace Sanity with **local JSON files** in `/data/`. PPlazan edits JSON → pushes to GitHub → Vercel auto-deploys. No client involvement needed.

---

## What to Implement Next (No Blockers)

### High Priority
1. **JSON content system** (~2–3 hrs) — Replace all placeholder/mock content with local JSON files:
   - `data/journal.json` — blog posts
   - `data/testimonials.json` — customer reviews
   - `data/heritage.json` — timeline entries
   - `data/story.json` — Our Story page copy
   Each page already has the UI built — just needs to import JSON instead of static copy.

2. **Customers → Shopify API route** (~2–3 hrs) — Build `/api/admin/customers` and `/api/admin/customers/[id]`. Same pattern as Products/Orders routes. Update `app/admin/customers/page.tsx` and `[id]/page.tsx` to fetch from API instead of `mockData`.

3. **Contact form → email** (~1 hr) — Resend is already installed (`npm install resend` already done for admin password reset). Wire `components/contact/ContactForm.tsx` to send email to Scott. Needs `RESEND_API_KEY` in env.

### Medium Priority
4. **Enable login rate limiter** (~15 min) — Add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to Vercel env vars. Sign up at upstash.com (free tier). Turns on brute-force login protection.

5. **Customer accounts auth** (~3–4 hrs) — Wire `/account` page to Shopify Storefront API:
   - `customerCreate` mutation → register
   - `customerAccessTokenCreate` mutation → sign in
   - Order history fetch for logged-in customer

6. **Forward specific error messages to toasts** (~30 min) — In API routes, return the specific `err.message` in the error response. In frontend mutation handlers, use `data.error` from the response in the toast instead of hardcoded "Failed to save product."

### Waiting on Shopify Credentials
7. Cart end-to-end testing
8. Checkout → real Shopify order creation
9. Admin live data verification (Products, Orders already wired — need credentials to confirm)

---

## Key File Locations

| What | Where |
|---|---|
| Admin Shopify API client | `lib/admin/shopifyAdmin.ts` |
| Admin CSS tokens | `app/globals.css` (lines 112–161) |
| Admin sidebar (nav, badge) | `components/admin/layout/AdminSidebar.tsx` |
| Admin bottom nav (mobile) | `components/admin/layout/AdminBottomNav.tsx` |
| Shared TrendChip | `components/admin/shared/TrendChip.tsx` |
| Analytics page | `app/admin/analytics/page.tsx` |
| Checkout page | `app/checkout/page.tsx` |
| Cart store (Shopify-connected) | `store/crateStore.ts` |
| Rate limiter | `lib/admin/ratelimit.ts` |
| 404 page | `app/not-found.tsx` |
| Sprint timeline | `Client Requirements Checklist/SPRINT_TIMELINE.md` |
| Admin dashboard plan (frontend) | `Client Requirements Checklist/ADMIN_DASHBOARD_PLAN_FRONTEND.md` |
| Today's daily log | `Client Requirements Checklist/DAILY_LOG_2026-06-01.md` |

---

## Sprint Timeline — Updated Outlook (as of June 1)

| Week | Dates | Focus | Outlook |
|---|---|---|---|
| Week 1 | May 26–30 | Cart + Admin Dashboard | ✅ Complete |
| Week 2 | Jun 2–6 | Checkout + Shopify Connection | ⚠️ Blocked on Scott's credentials |
| Week 3 | Jun 9–13 | Content (JSON replaces Sanity) | ✅ Unblocked — can start now |
| Week 4 | Jun 16–20 | Customer Accounts | On track |
| Week 5 | Jun 23–27 | Polish + Launch | On track if Weeks 2–4 land |

---

*Handoff created: 2026-06-01 · Acme Lamp & Sign Development Session*
*Next session: recall this file to resume with full context.*
