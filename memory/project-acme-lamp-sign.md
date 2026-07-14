---
name: project-acme-lamp-sign
description: "Acme Vintage Supply e-commerce frontend — Next.js 16 + Tailwind v4 build status, key decisions, client context, and blockers"
metadata: 
  node_type: memory
  type: project
  originSessionId: 15273374-f8dd-4bc6-bd2f-2e8c22dcae84
---

Phased build of the **Acme Vintage Supply** storefront. Working directory: `c:\Users\PPlazan\Desktop\Claude Design\final-lamp-sign\acme-lamp-sign`.

**Live URL:** https://www.acmevintagesupply.com
**Admin URL:** https://acmelampandsign.vercel.app/admin (password: `acme2026`)
**Shopify Store:** `w061f6-k8.myshopify.com`

**Why:** User wants full e-commerce frontend built phase-by-phase with STOP gates between each phase.

**How to apply:** Always ask "Continue with the next phase?" after completing a phase. Wait for explicit "Yes, Proceed." before starting the next.

## Key Technical Decisions

- **Tailwind v4** (not v3): Use `@theme {}` in `app/globals.css` for all design tokens. No `tailwind.config.ts`.
- **Next.js 16** App Router
- **Storefront Auth:** Shopify Storefront API `customerAccessTokenCreate` (email + password). Token stored in iron-session (HTTP-only cookie, server-side). No OAuth redirect. Files: `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`, `app/api/auth/me/route.ts`, `lib/customerSession.ts`.
- **Cart:** Zustand + localStorage persist (`acme-crate` key). Syncs to Shopify Storefront cart API. `cartBuyerIdentityUpdate` links cart to logged-in customer so Shopify checkout pre-fills their email.
- **Sanity CMS → DROPPED:** Replaced with local JSON files in `/data/`.

## Client Context

- **Scott Fraser** (`scottsfi@hotmail.com`) — client/owner. Not tech-savvy.
- **Domain:** Both `acmevintagesupply.com` and `acmevintagesupply.ca` purchased on GoDaddy (June 2026). Waiting on GoDaddy delegate access from Scott. Recommended primary: `.com`.
- Microsoft 365 Email Essentials purchased — `scott@acmevintagesupply.ca` planned.

## Phase Status (as of June 5, 2026)

| Phase | Name | Status |
|-------|------|--------|
| 0 | Bootstrap & Design System | ✅ Complete |
| 1 | Shared Components & Root Layout | ✅ Complete |
| 2 | Storefront (Home Page) | ✅ Complete |
| 3 | Catalog with Filtering | ✅ Complete |
| 4 | Product Detail Page | ✅ Complete |
| 5 | Our Story & Heritage Pages | ✅ Built |
| 6 | Contact Page | ✅ Built (form not wired to email yet) |
| 7 | Checkout Flow | ✅ Fully wired to Shopify cart |
| 8 | Account & Sign-In | ✅ Live — Storefront API auth |
| 9 | Polish, Responsiveness & Performance | ⏳ In progress |

## Completed June 5, 2026

### Storefront Auth — Reverted to Storefront API (email/password)
OAuth PKCE migration attempted but abandoned — user wants email+password on their own pages, no Shopify redirect. Final approach:
- **Login:** POST `/api/auth/login` → `customerAccessTokenCreate` → iron-session cookie
- **Register:** `customerCreate` → auto POST `/api/auth/login` → iron-session
- **Logout:** `/api/auth/logout` → session destroy + `clearCrate()`
- **Hydrate:** `/api/auth/me` → restores token from session on page load → calls `initCart(token)`
- **Profile:** `getCustomerProfile(token)` from Storefront API (not CA API)
- **Address CRUD:** Storefront API mutations (`customerAddressCreate/Update/Delete/DefaultUpdate`)

Key files: `app/api/auth/login/route.ts` (NEW), `store/customerStore.ts`, `app/login/page.tsx`, `app/account/page.tsx`, `lib/customerSession.ts`

### Cart — Buyer Identity + Race Condition Fix + Checkout Clear
- `cartBuyerIdentityUpdate` added to `lib/shopifyCart.ts` — links cart to customer after login so Shopify checkout uses their email (not a cached browser session)
- `cartCreate` now accepts optional `customerAccessToken` (passes `buyerIdentity`)
- `_customerToken` field in crateStore — set by `initCart(token)`, read by `addItem` when creating new cart (avoids circular import)
- **Race condition fixed:** After `cartCreate` resolves, batch-adds any items that were queued while `_cartCreating = true`
- **Clear on logout:** `logout()` calls `clearCrate()` so next user starts fresh
- **Clear on checkout:** `checkout()` action captures URL → clears cart → navigates (prevents 404 on old checkout URL)
- `console.warn` added when product has `variantId: null` (not synced to Shopify cart)

### Track Order — Fulfillment Timeline Fix
- `app/api/track-order/route.ts` — added `events(first: 10)` to fulfillments GraphQL query
- `app/track-order/page.tsx` — renders full event timeline (IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, etc.) instead of single status

### My Crate Tab on Account Page
- `/account?tab=crate` — 4th tab on account page showing live cart items, order summary, Proceed to Checkout
- **View Full Crate** in CrateDrawer: logged-in → `/account?tab=crate`, guest → `/crate`
- **Checkout button:** shows "Preparing…" while `_cartCreating` is true, enables when `checkoutUrl` arrives

### Coleman Pressure Lamp — variantId null (Shopify Admin fix needed)
The Coleman product is not showing in checkout because `variantId` is null — product is likely not published to the Storefront sales channel in Shopify Admin. Fix: Shopify Admin → Products → Coleman → Sales channels → enable Online Store → set Active.

## Auth Flow Summary (current)

| Action | What happens |
|---|---|
| Sign in | POST `/api/auth/login` → Storefront API → iron-session cookie |
| Register | `customerCreate` → POST `/api/auth/login` → iron-session |
| Page load | `hydrate()` → GET `/api/auth/me` → restore token → `initCart(token)` → `fetchProfile()` |
| Logout | POST `/api/auth/logout` + `clearCrate()` |
| Checkout | `checkout()` → capture URL → `clearCrate()` → `window.location.href` |

## Domain Connection Flow (when GoDaddy access arrives)

1. **Vercel first** — Project → Settings → Domains → add → copy DNS records → add to GoDaddy → wait propagation
2. **Shopify second** — Settings → Domains → Connect existing → set as primary → checkout URLs auto-switch
3. **Env var last** — Update `NEXT_PUBLIC_SITE_URL` in Vercel → redeploy

Recommended primary: `acmevintagesupply.com`. Set `.ca` to redirect.

## Blockers (Waiting on Scott)

| Blocker | Urgency |
|---|---|
| GoDaddy delegate access | NOW — domain connection blocked |
| Confirm .com or .ca as primary | NOW |
| Coleman product published to Storefront | Soon — missing from checkout |
| Business email (scott@acmevintagesupply.ca) | Go-live — fixes notification sender |
| Logo file | Before launch — email templates + branding |
| Shopify Payments fully activated | Week 2 |
| Shopify store name updated (currently "My Store") | Before launch |

## Completed June 5, 2026 (continued)

### Sold Count — Tracks units sold per product (triggers at Shipped/In Transit)

**How it works:**
- `acme.sold_count` Shopify metafield on each product (type: `number_integer`)
- Incremented when admin marks order as **In Transit** (industry standard — same as Amazon/Etsy/eBay)
- Storefront reads it via Storefront API metafields query and displays "X sold" badge

**Files changed:**
- `lib/types.ts` — Added `soldCount: number` to `Product` interface
- `lib/shopify.ts` — Added `{ namespace: "acme", key: "sold_count" }` to metafields query, mapped in `shopifyProductToProduct`
- `lib/admin/types.ts` — Added `soldCount: number` to `AdminProduct`, `productId: string` to `AdminOrderItem`
- `lib/admin/shopifyAdmin.ts` — Added `incrementSoldCount(lineItems)` function, added `product { id }` to ORDER_FIELDS lineItems query, mapped `productId` and `soldCount` in mappers
- `app/api/admin/orders/[id]/fulfill/route.ts` — Calls `incrementSoldCount(body.lineItems)` when stage = `in_transit`
- `components/admin/orders/AddFulfillmentEventModal.tsx` — Passes `lineItems` (productId + quantity) in request body when stage = `in_transit`
- `components/product/ProductInfo.tsx` — Shows green "X sold" pill badge (only if soldCount > 0)
- `components/catalog/ProductCard.tsx` — Shows green "X sold" overlay badge on product image (bottom-left, only if soldCount > 0)
- `app/admin/products/page.tsx` — Added sortable "Sold" column (shows count or "—")

**Important:** `sold_count` metafield must be created in Shopify Admin first (or it auto-creates on first fulfill). Initial value is 0 (treated as no metafield = 0).

## Completed June 5, 2026 (session 2)

### Customers + Analytics — Wired to Real Shopify API

**Customers (was mock, now live):**
- `app/api/admin/customers/route.ts` — NEW: GET list via `getAdminCustomers()`
- `app/api/admin/customers/[id]/route.ts` — NEW: GET customer + orders filtered by email
- `app/admin/customers/page.tsx` — replaced mockCustomers; loading skeleton; CSV export works
- `app/admin/customers/[id]/page.tsx` — replaced mockCustomers/mockOrders; loading + 404 handling
- `lib/admin/shopifyAdmin.ts` — added `getAdminCustomers()`, `getAdminCustomerById()`, `getAdminAnalytics()`

**Analytics (was all mock, key stats now live):**
- `app/api/admin/analytics/route.ts` — NEW: aggregates from real orders + customers
- `app/admin/analytics/page.tsx` — revenue stats, order counts, top products, chart = live; sessions/device/conversion = estimated (requires Shopify Plus for real data)
- `components/admin/charts/RevenueChart.tsx` — accepts optional `data` prop; falls back to mockChartData if not passed (overview page still uses mock)

**Build fixes (recurring pattern — new type fields need adding to ALL mock data):**
- `lib/admin/mockData.ts` — added `productId: ''` to all 10 mock order items (for `AdminOrderItem`)
- `lib/admin/mockData.ts` — added `soldCount: 0` to all 5 mock admin products (for `AdminProduct`)
- `lib/mockData.ts` — added `soldCount: 0` to all 16 storefront mock products (for `Product`)

**Rule learned:** Any time a required field is added to `AdminOrderItem`, `AdminProduct`, or `Product`, it must also be added to the corresponding mock arrays in `lib/admin/mockData.ts` AND `lib/mockData.ts`.

## Completed June 5, 2026 (session 3)

### Domain Connection — acmevintagesupply.com Live

Scott provided GoDaddy delegate access. Domain fully connected after resolving a DNS conflict between Shopify and Vercel (Shopify kept overwriting GoDaddy DNS records). Resolved by removing `acmevintagesupply.com` from Shopify → Domains entirely.

**Final DNS state (GoDaddy):**
- A → `@` → `216.198.79.1` (Vercel)
- CNAME → `www` → `faea003b85da4cbb.vercel-dns-017.com` (Vercel)

**Vercel:** Both `acmevintagesupply.com` and `www.acmevintagesupply.com` = Valid Configuration ✅

**Codebase updated:** All hardcoded `acmelampandsign.vercel.app` replaced with `acmevintagesupply.com` in:
- `app/layout.tsx`, `app/api/auth/callback/route.ts`, `app/api/auth/authorize/route.ts`
- `app/api/admin/auth/forgot/route.ts` (sender email also updated)
- `shopify.app.toml` (application_url + redirect_uris)

**Vercel env var:** `NEXT_PUBLIC_SITE_URL` = `https://acmevintagesupply.com` — redeployed.

**Important:** `acmevintagesupply.com` is NOT connected in Shopify → Domains. Shopify uses `w061f6-k8.myshopify.com` as its internal primary. Our Next.js app on Vercel IS the storefront. Do not reconnect domain in Shopify — it will overwrite GoDaddy DNS again.

### Coleman Pressure Lamp — Fixed
Published to Storefront sales channel. Confirmed working in checkout at $75.00 CAD.

### Product Inventory — Scott's Full Catalog Received
Scott emailed complete inventory manifest (52 items, shipped from Melbourne AU → Halifax NS by sea).
- 11 products already live on site
- 37 products still need photos, descriptions, and CAD pricing from Scott
- Email drafted: `Client Requirements Checklist/EMAIL_TO_SCOTT_PRODUCT_PHOTOS.md`
- 2 products on site not on manifest (Embossed Satin Shade, Gem Pine Chimney) — confirm with Scott

### Shopify Partners App URL Updated
App URL changed to `https://acmevintagesupply.com` in partners.shopify.com.

## Completed June 5, 2026 (session 4)

### Storefront Forgot Password — Added to Login Page

`customerRecover(email)` was already in `lib/shopifyCustomer.ts` (Shopify Storefront API mutation). Wired up the UI in `app/login/page.tsx`.

**Flow:**
- "Forgot password?" link sits next to the Password label on the sign-in form
- Clicking it prefills forgotEmail with whatever is in the email field and switches to the `forgot` view (tabs hidden)
- User enters email → `customerRecover(email)` called directly (uses NEXT_PUBLIC_ Storefront creds, same pattern as `customerCreate`)
- Shopify dispatches a reset email → link goes to `w061f6-k8.myshopify.com/account/reset/...` (Shopify-hosted reset page)
- Always shows generic success: "If [email] is linked to an account, you'll receive a reset link shortly" — never reveals if account exists
- Success state has "Back to sign in" link; error state has back button

**No new API route** — `customerRecover` runs client-side via Storefront API.

**Files changed:** `app/login/page.tsx` only.
- `type Tab` renamed to `type View = 'signin' | 'register' | 'forgot'`
- Tabs only render when view !== 'forgot'
- Breadcrumb label updates per view

### Customer Account API OAuth Migration (New Customer Accounts — passwordless OTP)

Store is on Shopify's New Customer Accounts (`shopify.com/99152462129/account`). No passwords — customers authenticate via one-time 6-digit email code. Legacy Storefront API email+password auth replaced with OAuth/PKCE flow.

**Client ID:** `e5c3544a-f124-4708-94fc-e8005bec01a8` (from Headless channel → Customer Account API → Manage)
**Client type:** Public (web app) — PKCE, no client secret needed
**Env var:** `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID=e5c3544a-f124-4708-94fc-e8005bec01a8` (in `.env.local`)
**Also fixed:** `NEXT_PUBLIC_SITE_URL` updated from old Vercel URL to `https://acmevintagesupply.com`

**CA API endpoint:** `https://shopify.com/99152462129/account/customer/api/2024-07/graphql.json`
**Auth header:** `Authorization: Bearer {access_token}`

**Callback URLs that MUST be registered in Shopify (Headless → Customer Account API → Manage → scroll down):**
- `https://acmevintagesupply.com/api/auth/callback`
- `http://localhost:3000/api/auth/callback`

**Auth flow:**
1. User clicks "Sign in / Create account" → browser redirects to `/api/auth/authorize`
2. PKCE code_verifier+challenge generated → redirect to `https://shopify.com/authentication/99152462129/oauth/authorize`
3. Shopify hosted page → customer enters email → receives OTP code → authenticates
4. Shopify redirects to `/api/auth/callback?code=...&state=...`
5. Code exchanged for `access_token` at token endpoint → stored in iron-session
6. `hydrate()` → `/api/auth/me` → store gets token → `getCustomerProfileCA()` → account page renders

**Profile fetch strategy (3-layer fallback in `/api/auth/profile`):**
1. Customer Account API (`https://shopify.com/{shopId}/account/customer/api/unstable/graphql.json`) — full data
2. Shopify Admin API lookup by email (uses `SHOPIFY_ADMIN_TOKEN`, `email:{email}` query) — full name + orders + addresses
3. id_token JWT decode — email only (bare minimum)

The Admin API fallback normalizes `displayFulfillmentStatus` → `fulfillmentStatus`, `createdAt` → `processedAt`, `totalPriceSet.shopMoney` → `totalPriceV2`, `originalUnitPriceSet.shopMoney` → `variant.priceV2`. Admin addresses are a flat array (not connection), wrapped into edges/node format. `successfulFulfillments` is empty (tracking not available via Admin API orders query).

**Files changed:**
- `.env.local` — added `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID`, fixed `NEXT_PUBLIC_SITE_URL`
- `app/api/auth/authorize/route.ts` — env var renamed to `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID`
- `app/api/auth/callback/route.ts` — same
- `app/login/page.tsx` — replaced email/password form with single OAuth redirect button (no form, no tabs, passwordless)
- `store/customerStore.ts` — `login()` now does `window.location.href = '/api/auth/authorize'`, removed `register()` (Shopify handles both sign in + create account in same flow), `fetchProfile()` uses `getCustomerProfileCA`
- `lib/shopifyCustomer.ts` — added `customerAccountFetch()` helper, `getCustomerProfileCA()`, and CA API address mutations: `customerAddressCreateCA`, `customerAddressUpdateCA`, `customerAddressDeleteCA`, `customerDefaultAddressUpdateCA`
- `app/account/page.tsx` — imports CA address functions via alias (same local names, CA API underneath)

**Key difference from Storefront API address mutations:**
- CA API mutations DON'T pass token in mutation body — uses Bearer header instead
- Error field is `userErrors` not `customerUserErrors`
- Address input field `phone` → `phoneNumber` in CA API
- `customerDefaultAddressUpdate` → `customerAddressSetDefault` in CA API

**Note:** Legacy Storefront API functions remain in `lib/shopifyCustomer.ts` for catalog/cart (they use the public storefront token, not customer tokens). `customerRecover`, `customerResetByUrl`, and the old address functions are still there but unused for customer auth.

### Storefront Password Reset Page — Full Headless Flow

Shopify's `customerRecover` email was sending users to `shopify.com/{shop-id}/account/orders` (new customer accounts) instead of a reset form. Fixed with full headless implementation.

**How it works:**
1. User requests reset on our site → `customerRecover(email)` → Shopify sends email
2. Email reset button URL **must be changed** in Shopify Admin → Settings → Notifications → "Customer account password reset" → edit button URL to: `https://acmevintagesupply.com/account/reset?url={{ customer.reset_password_url | url_encode }}`
3. User clicks link → lands on `acmevintagesupply.com/account/reset?url=https%3A%2F%2F...` (our page)
4. User enters new password → POST `/api/auth/reset` → `customerResetByUrl(resetUrl, password)` (Storefront API) → returns accessToken → iron-session created → `hydrate()` → redirect to `/account`

**Files added/changed:**
- `lib/shopifyCustomer.ts` — added `customerResetByUrl(resetUrl, password)` mutation (Storefront API, `URL!` type for resetUrl)
- `app/api/auth/reset/route.ts` — NEW: POST, calls `customerResetByUrl`, creates iron-session (same pattern as login route)
- `app/account/reset/page.tsx` — NEW: password reset form page, reads `url` query param, handles invalid link + success + error states, auto-redirects to /account on success

**IMPORTANT — Shopify email template must be updated manually by someone with Shopify Admin access:**
Shopify Admin → Settings → Notifications → Customer account password reset → Edit → change the `href` of the "Reset your password" button from `{{ customer.reset_password_url }}` to `https://acmevintagesupply.com/account/reset?url={{ customer.reset_password_url | url_encode }}`

### Bug Fix — app/template.tsx deleted

Deleted `app/template.tsx` (framer-motion page fade wrapper). Was causing `OuterLayoutRouter` missing-key console warning due to Next.js 16 + React 19 rendering layout+template+page as an unkeyed array inside a context provider. Cosmetic only — no functional change.

## Completed June 6, 2026

### Account Page — Orders and Profile Now Working

Fixed 3 bugs in `app/api/auth/profile/route.ts` that were causing the storefront account page to show "Good morning, there." and "No orders yet." even though real orders existed.

**Bug 1 — CA API removed:** `getCustomerProfileCA()` was called with an OAuth token that doesn't start with `shcat_` — Shopify's Customer Account API rejects it every time with 401. Removed CA API strategy entirely.

**Bug 2 — Admin API query corrected:** Old deployed code nested orders inside the customer query; `financialStatus` doesn't exist on `Order` in that context. New code uses two separate top-level queries (customer by email + orders by email), API version bumped to `2026-04`, field names corrected to `displayFulfillmentStatus` / `displayFinancialStatus` — matches `lib/admin/shopifyAdmin.ts` exactly.

**Bug 3 — Crash eliminated:** Strategy 3 was calling `.split()` on `claims?.sub` which is a number in Shopify JWTs, not a string. Removed JWT parsing entirely — session email is already stored cleanly by the OAuth callback. Entire GET handler wrapped in top-level try/catch.

**Result:** `[profile] ✓ Admin API — orders: 6` — account page shows real name, email, and all 6 orders with product images and prices. Response time: 364ms (two parallel Admin API calls).

**Key rule:** The profile route now has ONE strategy only — Admin API with two separate queries by email. No CA API, no JWT decoding.

## Completed June 9, 2026

### Contact Form + Newsletter — Wired to Google Apps Script

Both contact form and newsletter subscribe forms are live via a single Apps Script endpoint (no Resend).

**Architecture:**
- Browser → Next.js API route (same-origin, no CORS) → Google Apps Script (server-to-server)
- Contact: `POST /api/contact` → Apps Script → logs to "ContactAcme" sheet + emails both recipients
- Newsletter: `POST /api/newsletter` → Apps Script → logs to "Subscriber" sheet + emails both recipients
- Apps Script differentiates by `data.type === 'newsletter'`

**Env var:** `CONTACT_SCRIPT_URL` (server-side only, no NEXT_PUBLIC_)

**Email recipients:** `scottsfi@hotmail.com, acmesign01@gmail.com` (both get every notification)
**Sender name:** "Acme Vintage Supply"
**Reply-to:** customer's email (so Scott can reply directly to customer)

**Google Sheets:**
- Contact: `1xHzL1WR2Cdwi8V8d2HMDCZmT7rU296UTFPCbbGqggdc` → sheet "ContactAcme"
- Newsletter: `1Jd43sfOxkEo5lLJLbQZpo4Ief4kCq_lU79ZSLLxFAUc` → sheet "Subscriber"

**Files added/changed:**
- `app/api/contact/route.ts` — NEW: proxies contact form to Apps Script
- `app/api/newsletter/route.ts` — NEW: proxies newsletter subscribe to Apps Script
- `components/contact/ContactForm.tsx` — wired to `/api/contact`
- `components/shared/BenchNotesCTA.tsx` — wired to `/api/newsletter`
- `components/shared/Footer.tsx` — wired to `/api/newsletter`

## Completed June 9, 2026 (session 2)

### Admin Overview Dashboard — Fully Live

All mock data replaced with real Shopify API data. Page is now an async server component.

**Live data sources:**
- Stat cards: revenue (30-day), order count (30-day), total customers + repeat rate, avg order value
- Revenue chart + Orders chart: real 90-day `analytics.chartData`
- Recent orders: `getAdminOrders(8)` — 8 most recent real orders
- Low stock: `getAdminProducts()` filtered to `stock <= 3`
- Top products: `analytics.topProducts` from order line item aggregation
- All-time summary: total orders, fulfilled count, repeat customer rate

**Replaced with estimated/removed (requires Shopify Plus):**
- Sessions / Conversion Rate → replaced with Customers + Avg Order Value stat cards
- Abandoned Checkouts → replaced with All-Time Summary card

**Files changed:**
- `app/admin/overview/page.tsx` — async server component, all mock imports removed
- `components/admin/charts/OrdersChart.tsx` — added `data?: ChartDataPoint[]` prop
- `components/admin/charts/TopProductsTable.tsx` — replaced mock with `products` prop

## Completed June 9, 2026 (session 3)

### Catalog Nav Dropdown — Books & Guides + Signs Added

Added missing categories to the Catalog dropdown in the header. All 7 categories now match the sidebar.

**Files changed:**
- `components/nav/NavLinks.tsx` — added `Books & Guides` (`/catalog?category=oil-lamp-books`) and `Signs` (`/catalog?category=signs`) to `CATALOG_DROPS`
- `app/catalog/CatalogClient.tsx` — replaced `useState(initialCategory)` with `useSearchParams()` + `useEffect` so category filter updates reactively when URL changes without page remount. `initialCategory` kept as optional fallback prop.
- `app/catalog/page.tsx` — wrapped `CatalogClient` in `<Suspense>` (required for `useSearchParams()` at build time)
- `app/signs/page.tsx` — wrapped `CatalogClient` in `<Suspense>` (same reason)

**Key behavior:** Clicking any nav dropdown category now immediately activates the correct filter pill in the sidebar without needing a page refresh.

## Completed June 9, 2026 (session 4)

### Shopify Catalog — 11 New Products Added via API + Metafields Set

Used Shopify MCP tools (`create-product`, `set-inventory`, `graphql_mutation`) to bypass broken CSV import and create 11 new products directly.

**11 products created (with images from PDF):**
- Closed Tulip Etched Shade — `gid://shopify/Product/10688490078513`
- Ice Valentine Etched Shade — `gid://shopify/Product/10688490111281`
- Zodiac Ball Etched Shade — `gid://shopify/Product/10688490144049`
- Aladdin Sol Shade 501 — `gid://shopify/Product/10688490176817`
- Duplex Round 65mm — `gid://shopify/Product/10688490242353`
- Lip Chimney Large — `gid://shopify/Product/10688490275121`
- Lip Chimney Small — `gid://shopify/Product/10688490307889`
- Aladdin Pressure Glass — `gid://shopify/Product/10688490340657`
- Hurricane Glass Clear — `gid://shopify/Product/10688490373425`
- Hurricane Glass Emerald Green — `gid://shopify/Product/10688490406193`
- Hurricane Glass Ruby Red — `gid://shopify/Product/10688490438961`

All 11 have `acme` namespace metafields set: `material`, `colour`, `style`, `brand`, `vintage`, `fits`, `era`, `power_source`, `condition`, `net_weight`.

**Inventory location:** `gid://shopify/Location/112994681137` — "25 Raddall Ave"

**Still pending on Shopify:**
- 23 without-image products not yet added (CSV at `products-new-only-without-image.csv` on Desktop)
- Existing 15 products need stock quantity updates (via Shopify bulk edit — avoid CSV to prevent duplicates)
- Photos need uploading to the 11 new products in Shopify Admin

### Admin Dashboard — Duplicate Product Detection Added

`getProductByTitle()` added to `lib/admin/shopifyAdmin.ts`. POST `/api/admin/products` now returns HTTP 409 with `{ duplicate: true, existing: { id, title } }` if a product with the same title already exists (unless `force: true` is passed).

`app/admin/products/new/page.tsx` shows an amber warning banner with three options: "View existing", "Save as new anyway", "Cancel".

### Color Variant Support — ✅ Complete (June 9, 2026)

- Admin `ProductForm`: variant toggle, per-colour price + stock rows, `productVariantsBulkCreate` on save
- **Bug fixed (June 9):** Editing a product with existing colour variants and adding new colours was silently dropping new colours. `updateAdminProduct` else branch now splits into `toUpdate` (existing → `productVariantsBulkUpdate`) and `toCreate` (new → `productVariantsBulkCreate`). Fix is in `lib/admin/shopifyAdmin.ts` — requires deploy to take effect on live site.
- Storefront: single-select colour swatches on PDP, price/stock updates per variant, cart guard

## Completed June 9, 2026 (session 4+)

### Multi-Colour Cart — ✅ Fully Implemented

Customers can now select multiple colour variants with individual quantities on the product page. See `[[plan-multicolour-cart]]` for full design.

**Files changed:**
- `lib/cartGrouping.ts` — NEW: `COLOUR_HEX` map, `CartEntry` type, `groupCartItems()`, `getColourHex()` helper
- `store/crateStore.ts` — `addItem` accepts optional `quantity` param (default 1); eliminates the old loop hack
- `components/product/ProductInfo.tsx` — opt-in multi-select mode: "+ Buying multiple colours?" link replaces swatch+stepper block with per-colour qty table; double-add protection; variantError cleared on mode switch
- `components/crate/CrateDrawer.tsx` — `DrawerVariantGroup` component; variant items grouped under product name; `itemCount()` in header
- `app/crate/page.tsx` — same grouped rendering for full crate page

**Key behaviours:**
- Non-variant products: completely unchanged
- Multi-mode CTA: "Add N items to crate — $X.XX"
- Cart groups variant items under product name; flat rows for non-variant items
- Each colour = separate Shopify cart line item → checkout + admin orders correct automatically

### Admin Orders — variantTitle on Line Items

- `lib/admin/types.ts` — added `variantTitle?: string` to `AdminOrderItem`
- `lib/admin/shopifyAdmin.ts` — added `variantTitle` to `ORDER_FIELDS` GraphQL query + `ShopifyOrderNode` type + `toAdminOrder` mapper
- `app/admin/orders/[id]/page.tsx` — displays `variantTitle` (e.g. "Green", "Red") in accent colour below product title in line items list AND in invoice print layout
- `lib/admin/mockData.ts` — added `variantTitle: ''` to all 10 mock order items

### Shipping Label — CONTENTS Section Added

`app/admin/orders/[id]/page.tsx` shipping label print layout now includes a CONTENTS section showing each line item: product name, variant colour (if any), SKU, and quantity. Placeholder until Scott provides a preferred label format.

## Completed June 16, 2026

### Admin Login — Auth Fixes
- **`ADMIN_PASSWORD_HASH` was empty on Vercel** (both env vars cleared) — fixed and redeployed. Password is `Acme@2026!Scott`.
- **`ADMIN_EMAIL` was empty on Vercel** — fixed to `jonathan.mauring17@gmail.com,scottsfi@hotmail.com,acmesign01@gmail.com` (3 recipients).
- **`.env.local` bcrypt hash** must use single quotes: `ADMIN_PASSWORD_HASH='$2b$12$...'` — double quotes cause dotenv-expand to mangle the `$` signs.
- **Forgot password route** was doing exact string match against comma-separated `ADMIN_EMAIL` — fixed to split and check membership.
- **Rate limit** cleared via Upstash REST API when localhost hit 429 during testing. Key pattern: `acme_admin_login:::1:<bucket>`.

### Admin Password Reset — Full Fix (June 16, 2026)
- **Redis-backed password**: `verifyPassword()` in `lib/admin/auth.ts` reads `acme:admin:password_hash` from Upstash Redis first, falls back to `ADMIN_PASSWORD_HASH` env var. Reset route writes new hash to Redis — password change takes effect immediately, no redeploy needed.
- **Eye icons**: show/hide toggle on both New Password and Confirm Password fields (independent state, `BiShow`/`BiHide`).
- **Real-time match error**: `useEffect` on `[password, confirm]` shows "Passwords do not match." below Confirm field as user types. Clears when they match.
- **Strength bar**: Weak (red) / Medium (amber) / Strong (green) below New Password field. Scoring: count character types (lower/upper/digit/special) + length ≥ 8 required for Medium+.
- **Submit disabled** when `matchError || password.length < 8`.
- **Success message** updated: "Password updated successfully. You can now log in with your new password."
- **Remember Me + 7-day session**: checkbox on admin login password step. Passes `rememberMe` → stored in `pendingOtps` record → OTP route applies `maxAge: 604800` (7 days) vs default 8 hours.

**Files changed:** `lib/admin/auth.ts`, `app/api/admin/auth/route.ts`, `app/api/admin/auth/otp/route.ts`, `app/api/admin/auth/reset/route.ts`, `app/api/admin/auth/forgot/route.ts`, `app/admin/reset-password/page.tsx`, `app/admin/login/page.tsx`

## Completed June 16, 2026 (continued)

### Our Story + Heritage — Real OLC Backstory + CMS Sub-project 3 Complete
Static pages live with real content (no placeholder). Now CMS-editable via `/admin/content/story`.

**Admin editor (`app/admin/content/story/page.tsx`):**
- "Our Story" tab: headline, intro, image upload, pillar CRUD (number/title/body)
- "Heritage Timeline" tab: year/title/body entry CRUD (add/edit/delete)
- Saves to Redis via `setContent('story'/'heritage')`. Storefront reads Redis, falls back to `data/story.json` / `data/heritage.json`.

**Content sub-nav added (`app/admin/content/layout.tsx`):** All three content admin pages (Home / Story & Heritage / Footer Pages) now share a top-tab sub-nav — no more dead-end after landing on Home Page content.

## Completed June 16, 2026 (session 2) — Homepage & Storefront Overhaul

### Search — Wired to Real Shopify Products
- `SearchOverlay.tsx` completely rewrote: removed `mockProducts` import, added fetch to `/api/search` on first open, result cached in `fetchedRef` (re-opening is instant). Loading skeleton while fetching.
- `app/api/search/route.ts` — NEW GET handler: calls `getAllProducts()`, returns slim product data with 60s CDN cache (`public, s-maxage=60, stale-while-revalidate=300`). Returns `[]` on error.
- Fixes: Zodiac Ball and other Shopify-only products now appear in search; product links use real slugs (no more 404s on click).

### Removed mockData / mockProducts from Storefront
- `PickedOffTheBench.tsx` — removed `mockProducts` import, fallback changed to `[]`
- All storefront search, featured, and related product sections now use real Shopify API data only.

### RelatedProducts — 5 Products, Uniform Grid
- `components/product/RelatedProducts.tsx` — `slice(0, 5)`, removed `ASPECT_CYCLE`, all cards use `aspectRatio="4/5"`, grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`.

### PickedOffTheBench — 5 Products
- `lib/shopify.ts` — `getFeaturedProducts` changed `first: 3` → `first: 5`.
- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`.

### CategoryGrid — Complete Redesign (Bento, Fixed-Height, Local Images)
- Fully rewrote `components/home/CategoryGrid.tsx` from aspect-ratio tiles to a fixed-height 2-row bento grid using `Image fill` + `object-cover`.
- **Desktop (≥ lg):** 3-col, 2 rows × 350px. Row 1: Lighting (col-span-2) + Glass. Row 2: Burners + Signs + CTA tile.
- **Tablet (sm–lg):** 2-col, 3 rows × 260px. Lighting full-width, Glass+Burners, Signs full-width. CTA hidden.
- **Mobile (< sm):** 2-col, 3 rows × 200px. Same layout as tablet.
- **CTA tile (desktop only):** Now uses `05-50+See-all-catalog.png` with dark overlay instead of flat brass background.
- **Local images (all 5 tiles):**
  - `01-antique-brass-oil-lamps.png` → Lighting Fixtures
  - `02-green-etched-glass-oil-lamp-shade.png` → Glass Shades & Chimneys
  - `03-brass-antique-lamp-burner.png` → Burners & Wicks
  - `04-vintage-enamel-signs-collection.png` → Reproduction Signs
  - `05-50+See-all-catalog.png` → CTA Shop Now tile

### CategoryRows — New Homepage Section
- `components/home/CategoryRows.tsx` — NEW async server component. Three rows: Oil Lamp Shades, Glass & Chimneys, Burners & Wicks. `Promise.all` parallel fetch via `getProductsByCategory()`, `slice(0, 5)` each, empty rows hidden.
- Each row: label + "View all →" link header, then 5 `ProductCard` at `aspectRatio="4/5"` in a `grid-cols-5`.
- **Mobile:** horizontal scroll via `overflow-x-auto` + `min-w-225` (900px) container so all 5 cards stay full-size.
- Inserted in `app/page.tsx` between `<PickedOffTheBench />` and `<TestimonialsWrapper />`.

### ProductCard — Title Capped at 2 Lines
- `components/catalog/ProductCard.tsx` — added `line-clamp-2` to product name `<h3>`. Applies everywhere ProductCard is used (bench, category rows, related products, catalog grid).

### Mobile / Tablet Fixes
- **CategoryGrid:** Responsive Tailwind classes for row heights (`grid-rows-[200px_200px_200px] sm:grid-rows-[260px_260px_260px] lg:grid-rows-[350px_350px]`). Signs tile `col-span-2 lg:col-span-1`.
- **CategoryRows:** Increased inner grid container from `min-w-[680px]` to `min-w-225` (900px) — each of 5 cards ~180px wide on mobile scroll.
- **PickedOffTheBench:** 5th card wrapped in `hidden sm:block` to avoid orphaned card in 2-col mobile grid. Section padding reduced from `py-24` to `py-14 md:py-24`.

## Completed June 16, 2026 (session 3) — Security Headers + ProductCard Fix

### Security Headers — 3 Additions to `next.config.ts`
All three are safe, score stays A+, zero impact on browsing/cart/checkout.

- **`poweredByHeader: false`** — Removes `X-Powered-By: Next.js` from all responses (information disclosure reduction)
- **`Cross-Origin-Opener-Policy: same-origin-allow-popups`** — Added to storefront headers. Isolates browsing context from cross-origin windows; `allow-popups` variant used (not `same-origin`) so Shopify checkout window/popup stays functional
- **`Cross-Origin-Resource-Policy: cross-origin`** — Added to storefront headers. Declares assets are loadable cross-origin (Shopify CDN, etc.). Does NOT affect our outbound fetches.
- Admin also got COOP `same-origin` + CORP `same-origin` (stricter, admin loads nothing external).

### ProductCard — Title line-clamp-2
- `components/catalog/ProductCard.tsx` — `line-clamp-2` on product name `<h3>`. Titles cap at 2 lines everywhere (bench, category rows, related products, catalog grid).

## PENDING SECURITY ACTION

~~**Upstash Redis token was exposed in a git push (PR #8286955).**~~ ✅ RESOLVED June 25 — token rotated, `.env.local` and Vercel updated.

## What's Next (Resume Here)

1. **Post-checkout tracking snippet** — paste Liquid into Shopify Admin → Settings → Checkout → Order status page → Additional scripts
2. **23 without-image products** — add to Shopify via API (CSV at `products-new-only-without-image.csv` on Desktop)
3. **Upload photos** — Scott uploads PDF product photos to Shopify Admin for the 11 products added June 9
4. **Google Analytics** — Scott creates GA4 property → provides Measurement ID → install on site
5. **Business email** — `scott@acmevintagesupply.ca` via Microsoft 365 (purchased, not yet activated)
6. **Print invoice + shipping label redesign** — deferred until Scott provides sample label/invoice format

## Already Done (remove from future lists)

- ✅ Shopify store name → "Acme Vintage Supply" (done before June 26)
- ✅ Order prefix → `ACME#{{number}}` (done before June 26)
- ✅ Delivered email template — tracking button URL updated (done before June 26)
- ✅ Promotional Email System — full newsletter platform live (June 26)
- ✅ E2E checklist Sections 1–7 — all passed (June 23–26)

## Blockers (Waiting on Scott)

| Blocker | Urgency |
|---|---|
| Product photos + prices (37 items) | High — catalog incomplete |
| Cancel/Return flow | Blocked on Scott's written return policy |
| Business email activation | Before go-live |
| Logo file | Before go-live |
| Google Analytics property creation | Soon |

## Live URLs

| What | URL |
|---|---|
| Storefront | https://www.acmevintagesupply.com |
| Admin Dashboard | https://www.acmevintagesupply.com/admin (password: `Acme@2026!Scott`) |
| Backup URL | https://acmelampandsign.vercel.app |
| Shopify Store | w061f6-k8.myshopify.com |

## Key File Locations

| What | Where |
|---|---|
| Auth login route | `app/api/auth/login/route.ts` |
| Auth me/logout routes | `app/api/auth/me/route.ts`, `app/api/auth/logout/route.ts` |
| iron-session config | `lib/customerSession.ts` |
| Customer store | `store/customerStore.ts` |
| Cart store | `store/crateStore.ts` |
| Shopify cart API | `lib/shopifyCart.ts` |
| Shopify customer API | `lib/shopifyCustomer.ts` |
| Account page | `app/account/page.tsx` |
| Login page | `app/login/page.tsx` |
| Crate summary drawer | `components/crate/CrateSummary.tsx` |
| Admin Shopify API client | `lib/admin/shopifyAdmin.ts` |
| Fulfill API route | `app/api/admin/orders/[id]/fulfill/route.ts` |
| Track order API | `app/api/track-order/route.ts` |
