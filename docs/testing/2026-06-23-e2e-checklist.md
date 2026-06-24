# End-to-End Testing Checklist
## High Priority Customer Features — June 23 2026

---

## Pre-Flight

- [x] Dev server is running (`npm run dev`)
- [x] `RESEND_API_KEY` is set in `.env.local`
- [x] Supabase migration 004 was applied (`back_in_stock_requests` table exists)
- [ ] At least one product is marked **out of stock** (`stockQuantity = 0`) in Shopify
- [ ] At least one order exists with a **pre-transit stage** (Packed at Workshop) set in admin

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

## 2. Out-of-Stock Product — Notify Me Form

> Goal: "Add to Crate" is replaced by the email capture form when a product is out of stock.

**Setup**
- [ ] Identify a product that is out of stock in Shopify (or temporarily set one to 0 units)
- [ ] Open that product's PDP on the storefront (e.g. `/catalog/your-product-slug`)

**Test: Form renders**
- [ ] **PASS:** "Add to Crate" button is NOT visible
- [ ] **PASS:** Quantity stepper is NOT visible
- [ ] **PASS:** "Out of stock" label appears above the form
- [ ] **PASS:** "Get an email the moment this piece is back on the bench." copy appears
- [ ] **PASS:** Email input field and "Notify me" button are visible

**Test: First signup**
- [ ] Enter a valid email address → click "Notify me"
- [ ] **PASS:** Spinner shows during submit
- [ ] **PASS:** "You're on the list." confirmation appears
- [ ] **PASS:** The email address is echoed back in the confirmation text
- [ ] Check Supabase: `SELECT * FROM back_in_stock_requests ORDER BY created_at DESC LIMIT 5;`
- [ ] **PASS:** Row exists with correct email, product_handle, product_title, `notified_at = NULL`

**Test: Duplicate signup**
- [ ] Reload the PDP → enter the SAME email → click "Notify me"
- [ ] **PASS:** "You're already registered for restock notifications on this item." appears

**Test: Invalid input**
- [ ] Submit with an empty email → **PASS:** browser validation blocks it (required field)
- [ ] Submit with `notanemail` → **PASS:** browser email validation blocks it

**Test: In-stock products are unchanged**
- [ ] Open any in-stock product PDP
- [ ] **PASS:** "Add to Crate" button is present and works normally
- [ ] **PASS:** Quantity stepper is present

---

## 3. Admin — Notify Waiting Customers Button

> Goal: Admin can see the waitlist count and send a restock email blast.

**Setup**
- [ ] Use the out-of-stock product from Section 2 (at least 1 signup in the waitlist)
- [ ] Open that product in admin: `/admin/products/[id]`

**Test: Waitlist count loads**
- [ ] **PASS:** "Notify X waiting" button appears in the product page header
- [ ] **PASS:** The count matches the number of rows in Supabase for that handle with `notified_at IS NULL`

**Test: Send notifications**
- [ ] Click "Notify X waiting"
- [ ] **PASS:** Button shows "Sending…" during the request
- [ ] **PASS:** Success toast: "Notified X customer(s)."
- [ ] **PASS:** Button immediately updates to "Notify 0 waiting"
- [ ] Check the inbox of the email address used in Section 2
- [ ] **PASS:** Email received with subject "Back in stock: [Product Title]"
- [ ] **PASS:** Email contains a "View product →" link pointing to the correct PDP URL
- [ ] Check Supabase: `SELECT notified_at FROM back_in_stock_requests WHERE product_handle = 'your-handle';`
- [ ] **PASS:** `notified_at` is now set (not NULL)

**Test: Button disabled when no waitlist**
- [ ] Open any in-stock product with no signups
- [ ] **PASS:** "Notify 0 waiting" button is disabled (greyed out, not clickable)

**Test: Double-send protection**
- [ ] Click "Notify X waiting" a second time on a product just notified
- [ ] **PASS:** API returns `{ ok: true, sent: 0 }` — no duplicate emails sent
- [ ] (Already-notified customers are excluded by the `notified_at IS NULL` filter)

---

## 4. Email Content Verification

> Goal: The back-in-stock email looks correct and links work.

- [ ] Open the email received in Step 3
- [ ] **PASS:** FROM address is `Acme Vintage Supply <hello@acmevintagesupply.ca>` (or `onboarding@resend.dev` if domain not yet verified)
- [ ] **PASS:** Subject: `Back in stock: [Product Title]`
- [ ] **PASS:** Body mentions the product title in bold
- [ ] **PASS:** "View product →" button links to the correct storefront PDP
- [ ] **PASS:** Footer shows "Acme Vintage Supply · Dartmouth, Nova Scotia"
- [ ] Click "View product →"
- [ ] **PASS:** Link opens the correct product page

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
- [ ] **PASS:** `400` with `{ "error": "Valid email required" }`

**Invalid email**
```bash
curl -X POST http://localhost:3000/api/notify-me \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","productHandle":"test","productTitle":"Test"}'
```
- [ ] **PASS:** `400` with `{ "error": "Valid email required" }`

**Missing handle**
```bash
curl -X POST http://localhost:3000/api/notify-me \
  -H "Content-Type: application/json" \
  -d '{"email":"a@b.com","productTitle":"Test"}'
```
- [ ] **PASS:** `400` with `{ "error": "Product handle required" }`

**Valid request**
```bash
curl -X POST http://localhost:3000/api/notify-me \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","productHandle":"duplex-chimney","productTitle":"Duplex Chimney"}'
```
- [ ] **PASS:** `200` with `{ "ok": true, "result": "added" }`

---

## 6. Admin Notify-Restock API — Auth Guard

> Goal: Unauthenticated requests to the admin endpoint are rejected.

```bash
curl -X POST http://localhost:3000/api/admin/products/notify-restock \
  -H "Content-Type: application/json" \
  -d '{"productHandle":"duplex-chimney"}'
```
- [ ] **PASS:** `401` with `{ "error": "Unauthorized" }`

```bash
curl http://localhost:3000/api/admin/products/notify-restock?handle=duplex-chimney
```
- [ ] **PASS:** `401` with `{ "error": "Unauthorized" }`

---

## Sign-Off

| Section | Result | Notes |
|---------|--------|-------|
| 1. Order tracking pre-transit | ✅ Pass | Tested June 23 |
| 2. Notify me form (storefront) | ⬜ Pass / ⬜ Fail | |
| 3. Admin notify button | ⬜ Pass / ⬜ Fail | |
| 4. Email content | ⬜ Pass / ⬜ Fail | |
| 5. Public API validation | ⬜ Pass / ⬜ Fail | |
| 6. Auth guard | ⬜ Pass / ⬜ Fail | |

**Tested by:** Peter Paul Abillar Lazan  
**Date:** June 23–25, 2026  
**Build / commit:** Post-PR #13 (analytics + activity log)
