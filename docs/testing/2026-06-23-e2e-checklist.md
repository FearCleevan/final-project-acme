# End-to-End Testing Checklist
## High Priority Customer Features — June 23 2026

---

## Pre-Flight

- [x] Dev server is running (`npm run dev`)
- [x] `RESEND_API_KEY` is set in `.env.local`
- [x] Supabase migration 004 was applied (`back_in_stock_requests` table exists)
- [x] At least one product is marked **out of stock** (`stockQuantity = 0`) in Shopify
- [x] At least one order exists with a **pre-transit stage** (Packed at Workshop) set in admin

---

## 1. Order Tracking — Pre-Transit Stages Visible to Customer ✅ PASSED (June 23)

> Goal: Customer tracking page shows "Packed at workshop" when admin has set that stage.

**Setup**
- [x] Open an order in admin → Fulfillment section
- [x] Add stage: **Packed at Workshop** (if not already set)
- [x] Note the order number (e.g. `#1001`) and the customer email on the order

**Test**
- [x] Go to `/track-order`
- [x] Enter the order number and customer email → click Track
- [x] **PASS:** "Packed at workshop" appears in the fulfillment timeline
- [x] **PASS:** Timeline is in chronological order (oldest at top or bottom, consistent with existing events)
- [x] Reload the page → re-enter the same order
- [x] **PASS:** "Packed at workshop" still appears (not lost on reload)

**Edge cases**
- [x] Enter an order that has progressed to **In Transit** (has a Shopify fulfillment)
- [x] **PASS:** "Packed at workshop" still shows (not duplicated, not missing)
- [x] Enter an order that only has **Order Confirmed** (no packed stage yet)
- [x] **PASS:** No "Packed at workshop" — only shows what was actually set

---

## 2. Out-of-Stock Product — Notify Me Form ✅ PASSED (June 25)

> Goal: "Add to Crate" is replaced by the email capture form when a product is out of stock.

**Setup**
- [x] Identify a product that is out of stock in Shopify (or temporarily set one to 0 units)
- [x] Open that product's PDP on the storefront (e.g. `/catalog/your-product-slug`)

**Test: Form renders**
- [x] **PASS:** "Add to Crate" button is NOT visible
- [x] **PASS:** Quantity stepper is NOT visible
- [x] **PASS:** "Out of stock" label appears above the form
- [x] **PASS:** "Get an email the moment this piece is back on the bench." copy appears
- [x] **PASS:** Email input field and "Notify me" button are visible

**Test: First signup**
- [x] Enter a valid email address → click "Notify me"
- [x] **PASS:** Spinner shows during submit
- [x] **PASS:** "You're on the list." confirmation appears
- [x] **PASS:** The email address is echoed back in the confirmation text
- [x] Check Supabase: `SELECT * FROM back_in_stock_requests ORDER BY created_at DESC LIMIT 5;`
- [x] **PASS:** Row exists with correct email, product_handle, product_title, `notified_at = NULL`

**Test: Duplicate signup**
- [x] Reload the PDP → enter the SAME email → click "Notify me"
- [x] **PASS:** "You're already registered for restock notifications on this item." appears

**Test: Invalid input**
- [x] Submit with an empty email → **PASS:** browser validation blocks it (required field)
- [x] Submit with `notanemail` → **PASS:** browser email validation blocks it

**Test: In-stock products are unchanged**
- [x] Open any in-stock product PDP
- [x] **PASS:** "Add to Crate" button is present and works normally
- [x] **PASS:** Quantity stepper is present

---

## 3. Admin — Notify Waiting Customers Button ✅ PASSED (June 25)

> Goal: Admin can see the waitlist count and send a restock email blast.

**Setup**
- [x] Use the out-of-stock product from Section 2 (at least 1 signup in the waitlist)
- [x] Open that product in admin: `/admin/products/[id]`

**Test: Waitlist count loads**
- [x] **PASS:** "Notify X waiting" button appears in the product page header
- [x] **PASS:** The count matches the number of rows in Supabase for that handle with `notified_at IS NULL`

**Test: Send notifications**
- [x] Click "Notify X waiting"
- [x] **PASS:** Button shows "Sending…" during the request
- [x] **PASS:** Success toast: "Notified X customer(s)."
- [x] **PASS:** Button immediately updates to "Notify 0 waiting"
- [x] Check the inbox of the email address used in Section 2
- [x] **PASS:** Email received with subject "Back in stock: [Product Title]"
- [x] **PASS:** Email contains a "View product →" link pointing to the correct PDP URL
- [x] Check Supabase: `SELECT notified_at FROM back_in_stock_requests WHERE product_handle = 'your-handle';`
- [x] **PASS:** `notified_at` is now set (not NULL)

**Test: Button disabled when no waitlist**
- [x] Open any in-stock product with no signups
- [x] **PASS:** "Notify 0 waiting" button is disabled (greyed out, not clickable)

**Test: Double-send protection**
- [x] Click "Notify X waiting" a second time on a product just notified
- [x] **PASS:** API returns `{ ok: true, sent: 0 }` — no duplicate emails sent
- [x] (Already-notified customers are excluded by the `notified_at IS NULL` filter)

---

## 4. Email Content Verification ✅ PASSED (June 25)

> Goal: The back-in-stock email looks correct and links work.

- [x] Open the email received in Step 3
- [x] **PASS:** FROM address is `hello@acmevintagesupply.com` ✓
- [x] **PASS:** Subject: `Back in stock: OIL LAMP SHADE - 11" Sample Shade (Opal Glass)` ✓
- [x] **PASS:** Body mentions the product title in bold ✓
- [x] **PASS:** "View product →" button links to the correct storefront PDP ✓
- [x] **PASS:** Footer shows "Acme Vintage Supply · Dartmouth, Nova Scotia" ✓
- [x] Click "View product →"
- [x] **PASS:** Link opens the correct product page ✓

---

## 5. Public API — Security & Validation

> Goal: The public `/api/notify-me` endpoint rejects bad input gracefully.

Run these in terminal or browser dev tools console:

**Missing email**
```bash
curl -X POST http://localhost:3000/api/notify-me \
  -H "Content-Type: application/json" \
  -d '{"productHandle":"test","productTitle":"Test"}'
```
- [x] **PASS:** `400` with `{ "error": "Valid email required" }`

**Invalid email**
```bash
curl -X POST http://localhost:3000/api/notify-me \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","productHandle":"test","productTitle":"Test"}'
```
- [x] **PASS:** `400` with `{ "error": "Valid email required" }`

**Missing handle**
```bash
curl -X POST http://localhost:3000/api/notify-me \
  -H "Content-Type: application/json" \
  -d '{"email":"a@b.com","productTitle":"Test"}'
```
- [x] **PASS:** `400` with `{ "error": "Product handle required" }`

**Valid request**
```bash
curl -X POST http://localhost:3000/api/notify-me \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","productHandle":"duplex-chimney","productTitle":"Duplex Chimney"}'
```
- [x] **PASS:** `200` with `{ "ok": true, "result": "added" }`

---

## 6. Admin Notify-Restock API — Auth Guard

> Goal: Unauthenticated requests to the admin endpoint are rejected.

```bash
curl -X POST http://localhost:3000/api/admin/products/notify-restock \
  -H "Content-Type: application/json" \
  -d '{"productHandle":"duplex-chimney"}'
```
- [x] **PASS:** `401` with `{ "error": "Unauthorized" }`

```bash
curl http://localhost:3000/api/admin/products/notify-restock?handle=duplex-chimney
```
- [x] **PASS:** `401` with `{ "error": "Unauthorized" }`

---

## Sign-Off

| Section | Result | Notes |
|---------|--------|-------|
| 1. Order tracking pre-transit | ✅ Pass | Tested June 23 |
| 2. Notify me form (storefront) | ✅ Pass | Tested June 25 — OIL LAMP SHADE (Opal Glass) |
| 3. Admin notify button | ✅ Pass | Tested June 25 — send + count reset + double-send guard |
| 4. Email content | ✅ Pass | Tested June 25 — hello@acmevintagesupply.com, correct layout |
| 5. Public API validation | ✅ Pass | Tested June 25 — all 4 cases correct |
| 6. Auth guard | ✅ Pass | Tested June 25 — POST + GET both 401 |
| 7. Promotional Email System | ✅ Pass | Tested June 26 — subscribe, compose, send, email received ✓ |

**Tested by:** Peter Paul Abillar Lazan  
**Date:** June 23–25, 2026  
**Build / commit:** Post-PR #13 (analytics + activity log)

---

## 7. Promotional Email System ✅ PASSED (June 26)

> Goal: Newsletter subscribe, admin marketing page, campaign send, and cron all work end-to-end.

**Pre-flight**
- [x] Migration 007 applied in Supabase Dashboard (`docs/supabase/migrations/007_newsletter.sql`)
- [x] `CRON_SECRET` added to Vercel environment variables
- [x] Deploy latest `develop` branch to Vercel

**Test: Footer subscribe form**
- [x] Go to storefront → scroll to footer → enter email → click Subscribe
- [x] **PASS:** "Subscribed!" confirmation + "You are on the workshop dispatch list"
- [x] Check Supabase: `SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC LIMIT 5;`
- [x] **PASS:** Row exists with correct email, `unsubscribed_at = NULL`

**Test: Duplicate subscribe (resubscribe)**
- [x] Submit same email again
- [x] **PASS:** No error shown — upsert handles it silently

**Test: Admin marketing page loads**
- [x] Go to `/admin/marketing`
- [x] **PASS:** "Marketing" appears in sidebar between Communications and Reviews
- [x] **PASS:** Subscribers tab shows 1 active subscriber
- [x] **PASS:** Campaigns tab shows + New Campaign button

**Test: Compose and send a campaign**
- [x] Click Campaigns tab → + New Campaign
- [x] Fill in Subject, Body (multi-line), CTA label + URL
- [x] Click Send Now
- [x] **PASS:** Campaign appears in list — "Sent Jun 26, 2026 · 1 recipient" with green Sent badge

**Test: Newsletter email received**
- [x] **PASS:** Email received from `Acme Vintage Supply <hello@acmevintagesupply.com>`
- [x] **PASS:** Subject: "June Bench Notes — What's New at Acme Vintage Supply"
- [x] **PASS:** Body paragraphs render correctly
- [x] **PASS:** "Browse the Catalog →" CTA button — green, correct URL
- [x] **PASS:** Footer: "Acme Vintage Supply · Dartmouth, Nova Scotia" + Unsubscribe link

**Test: Unsubscribe**
- [x] Click the Unsubscribe link in the email footer
- [x] **PASS:** Browser shows "You've been unsubscribed" HTML page
- [x] Check Supabase: `SELECT unsubscribed_at FROM newsletter_subscribers WHERE email = 'your@email.com';`
- [x] **PASS:** `unsubscribed_at` is now set

**Test: Double-send protection**
- [x] Attempt to send the same campaign again (click Send on a "Sent" campaign)
- [x] **PASS:** API returns 400 — campaign already sent, no duplicate emails
