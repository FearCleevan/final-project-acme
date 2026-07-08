# Cart Activity Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show, for logged-in customers only, what they currently have in their cart — as an "In Cart" column on the main Customers table and a full "Cart Activity" section on the customer detail page — so warm leads (registered, 0 orders, active cart) are visible for manual marketing follow-up.

**Architecture:** Cart-add/remove events are captured client-side in `crateStore` (which already knows when a customer is logged in) and sent fire-and-forget to a new `cart_activity` Supabase table via a new `/api/cart-activity` route. The existing `orders/paid` webhook is extended to flip matching rows to `converted` when a tracked item is actually purchased. Two existing admin read paths (`getAdminCustomers`, `getAdminCustomerById`) are extended to attach this data to `AdminCustomer`, and two existing admin pages render it.

**Tech Stack:** Next.js App Router route handlers, `@supabase/supabase-js`, Zustand (`crateStore`, `customerStore`), existing Shopify Storefront/Admin GraphQL clients.

## Global Constraints

- Matching key is **`customer_email`**, not the Shopify customer id. The Storefront API's customer id (`gid://shopify/Customer/…`) and the Admin API's numeric customer id refer to the same customer but need conversion to compare; email is already present and reliable on every surface involved (`CustomerProfile.email`, `AdminCustomer.email`, and the `orders/paid` webhook's `o.email`), so it's the simpler, more robust join key. `customer_id` is still stored on each row for reference but is never used in a `WHERE`/`.eq()` clause.
- Anonymous (not-logged-in) cart activity is **never tracked** — this is a hard scope boundary from the approved design, not an oversight.
- Supabase client creation must be a **lazy per-request function** (`function getSupabase() { return createClient(...) }`), never a module-level `createClient(...)` call — matches the existing project convention (see `app/api/admin/communications/bench-notes/route.ts`) and avoids breaking Vercel builds when env vars aren't present at build time.
- Use env vars `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (same pair the Communications Hub and Admin Settings routes use — do not use the older `lib/supabase.ts`, which predates this convention).
- `/api/cart-activity` (storefront-facing) requires **no admin auth** — it's a customer-facing action, same trust level as the existing `back_in_stock_requests` signup endpoint, which also takes an email from the client without verification.
- `/api/admin/customers` and `/api/admin/customers/[id]` already require admin auth via `requireAuth()` — the new Supabase reads ride inside those same handlers, no new auth surface.
- No new npm dependencies — `@supabase/supabase-js` is already installed.

---

## File Structure

- Create: `docs/supabase/migrations/009_cart_activity.sql` — new table.
- Create: `lib/cartActivity.ts` — server-side Supabase read/write helpers.
- Create: `app/api/cart-activity/route.ts` — `POST` (track/upsert) and `DELETE` (untrack) for the storefront.
- Create: `lib/cartActivityClient.ts` — client-side fire-and-forget fetch helpers, called from `crateStore`.
- Modify: `store/crateStore.ts` — track logged-in customer's email; call tracking helpers on add/update/remove.
- Modify: `store/customerStore.ts` — keep `crateStore`'s customer email in sync with login/profile/logout state.
- Modify: `app/api/webhooks/shopify/route.ts` — convert matching `cart_activity` rows to `converted` on `orders/paid`.
- Modify: `lib/admin/types.ts` — add `cartActivity` field to `AdminCustomer`.
- Modify: `lib/admin/shopifyAdmin.ts` — attach active cart activity to customers returned by `getAdminCustomers`/`getAdminCustomerById`.
- Modify: `app/api/admin/customers/[id]/route.ts` — also return converted cart-activity history.
- Modify: `app/admin/customers/page.tsx` — "In Cart" column (desktop table + mobile card).
- Modify: `app/admin/customers/[id]/page.tsx` — "Cart Activity" section (active + converted history).

---

### Task 1: Supabase migration for the `cart_activity` table

**Files:**
- Create: `docs/supabase/migrations/009_cart_activity.sql`

**Interfaces:**
- Produces: a Supabase table `cart_activity`. Columns consumed by Task 2's helpers: `customer_email, customer_id, product_id, product_title, variant_id, quantity, status, order_name, first_added_at, last_added_at, converted_at`. Unique on `(customer_email, product_id)`.

- [ ] **Step 1: Write the migration file**

```sql
-- 009_cart_activity.sql
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS cart_activity (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  customer_email text        NOT NULL,
  customer_id    text,

  product_id     text        NOT NULL,
  product_title  text        NOT NULL,
  variant_id     text,
  quantity       int         NOT NULL DEFAULT 1,

  status         text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted')),
  order_name     text,

  first_added_at timestamptz NOT NULL DEFAULT now(),
  last_added_at  timestamptz NOT NULL DEFAULT now(),
  converted_at   timestamptz
);

-- One row per customer+product — re-adding the same product upserts quantity
-- instead of creating a duplicate row.
CREATE UNIQUE INDEX IF NOT EXISTS cart_activity_email_product_idx
  ON cart_activity(customer_email, product_id);

CREATE INDEX IF NOT EXISTS cart_activity_status_idx
  ON cart_activity(status);

ALTER TABLE cart_activity ENABLE ROW LEVEL SECURITY;

-- Only service_role (our server) can access cart activity
DROP POLICY IF EXISTS "No public access to cart activity" ON cart_activity;
CREATE POLICY "No public access to cart activity"
  ON cart_activity
  USING (false);
```

- [ ] **Step 2: Run the migration**

Open the Supabase Dashboard → SQL Editor → paste the contents of `docs/supabase/migrations/009_cart_activity.sql` → Run.

Expected: query succeeds. `SELECT * FROM cart_activity;` returns an empty result set (table exists, no rows yet) with no error.

- [ ] **Step 3: Commit**

```bash
git add "docs/supabase/migrations/009_cart_activity.sql"
git commit -m "Add cart_activity table migration"
```

---

### Task 2: Server-side Supabase helpers

**Files:**
- Create: `lib/cartActivity.ts`

**Interfaces:**
- Consumes: `cart_activity` table from Task 1.
- Produces (used by Task 3, Task 6, Task 8, Task 9):
  ```ts
  interface CartActivityInput {
    customerEmail: string
    customerId:    string | null
    productId:     string
    productTitle:  string
    variantId:     string | null
    quantity:      number
  }
  interface ActiveCartItem { productTitle: string; quantity: number }
  interface CartActivityHistoryItem {
    productTitle: string; quantity: number
    orderName: string | null; convertedAt: string | null
  }

  function upsertCartActivity(input: CartActivityInput): Promise<void>
  function removeCartActivity(customerEmail: string, productId: string): Promise<void>
  function convertCartActivity(
    customerEmail: string,
    lineItems: { productId: string; variantId: string | null }[],
    orderName: string
  ): Promise<void>
  function getActiveCartActivityByEmails(emails: string[]): Promise<Map<string, ActiveCartItem[]>>
  function getCartActivityHistoryForEmail(email: string): Promise<CartActivityHistoryItem[]>
  ```

- [ ] **Step 1: Write the helpers**

```ts
// lib/cartActivity.ts
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface CartActivityInput {
  customerEmail: string
  customerId:    string | null
  productId:     string
  productTitle:  string
  variantId:     string | null
  quantity:      number
}

export interface ActiveCartItem {
  productTitle: string
  quantity:     number
}

export interface CartActivityHistoryItem {
  productTitle: string
  quantity:     number
  orderName:    string | null
  convertedAt:  string | null
}

export async function upsertCartActivity(input: CartActivityInput): Promise<void> {
  const { error } = await getSupabase()
    .from('cart_activity')
    .upsert(
      {
        customer_email: input.customerEmail,
        customer_id:    input.customerId,
        product_id:     input.productId,
        product_title:  input.productTitle,
        variant_id:     input.variantId,
        quantity:       input.quantity,
        status:         'active',
        order_name:     null,
        converted_at:   null,
        last_added_at:  new Date().toISOString(),
      },
      { onConflict: 'customer_email,product_id' }
    )
  if (error) console.error('[cartActivity] upsert error:', error)
}

export async function removeCartActivity(customerEmail: string, productId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('cart_activity')
    .delete()
    .eq('customer_email', customerEmail)
    .eq('product_id', productId)
    .eq('status', 'active')
  if (error) console.error('[cartActivity] remove error:', error)
}

export async function convertCartActivity(
  customerEmail: string,
  lineItems: { productId: string; variantId: string | null }[],
  orderName: string
): Promise<void> {
  const now = new Date().toISOString()
  for (const item of lineItems) {
    const { error } = await getSupabase()
      .from('cart_activity')
      .update({ status: 'converted', order_name: orderName, converted_at: now })
      .eq('customer_email', customerEmail)
      .eq('product_id', item.productId)
      .eq('status', 'active')
    if (error) console.error('[cartActivity] convert error:', error)
  }
}

export async function getActiveCartActivityByEmails(
  emails: string[]
): Promise<Map<string, ActiveCartItem[]>> {
  const map = new Map<string, ActiveCartItem[]>()
  if (emails.length === 0) return map

  const { data, error } = await getSupabase()
    .from('cart_activity')
    .select('customer_email, product_title, quantity')
    .in('customer_email', emails)
    .eq('status', 'active')

  if (error) { console.error('[cartActivity] batch fetch error:', error); return map }

  for (const row of data ?? []) {
    const list = map.get(row.customer_email) ?? []
    list.push({ productTitle: row.product_title, quantity: row.quantity })
    map.set(row.customer_email, list)
  }
  return map
}

export async function getCartActivityHistoryForEmail(
  email: string
): Promise<CartActivityHistoryItem[]> {
  const { data, error } = await getSupabase()
    .from('cart_activity')
    .select('product_title, quantity, order_name, converted_at')
    .eq('customer_email', email)
    .eq('status', 'converted')
    .order('converted_at', { ascending: false })

  if (error) { console.error('[cartActivity] history fetch error:', error); return [] }

  return (data ?? []).map(r => ({
    productTitle: r.product_title,
    quantity:     r.quantity,
    orderName:    r.order_name,
    convertedAt:  r.converted_at,
  }))
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/cartActivity.ts
git commit -m "Add server-side cart_activity Supabase helpers"
```

---

### Task 3: Storefront `/api/cart-activity` route

**Files:**
- Create: `app/api/cart-activity/route.ts`

**Interfaces:**
- Consumes: `upsertCartActivity`, `removeCartActivity` from Task 2.
- Produces (used by Task 4):
  - `POST /api/cart-activity` body `{ customerEmail, customerId, productId, productTitle, variantId, quantity }` → `200 { ok: true }` or `400 { error }`.
  - `DELETE /api/cart-activity` body `{ customerEmail, productId }` → `200 { ok: true }` or `400 { error }`.

- [ ] **Step 1: Write the route**

```ts
// app/api/cart-activity/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { upsertCartActivity, removeCartActivity } from '@/lib/cartActivity'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    customerEmail?: string
    customerId?:    string | null
    productId?:     string
    productTitle?:  string
    variantId?:     string | null
    quantity?:      number
  } | null

  if (!body?.customerEmail || !body.productId || !body.productTitle || !body.quantity) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  await upsertCartActivity({
    customerEmail: body.customerEmail,
    customerId:    body.customerId ?? null,
    productId:     body.productId,
    productTitle:  body.productTitle,
    variantId:     body.variantId ?? null,
    quantity:      body.quantity,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    customerEmail?: string
    productId?:     string
  } | null

  if (!body?.customerEmail || !body.productId) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  await removeCartActivity(body.customerEmail, body.productId)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify POST creates a row**

Start the dev server (`npm run dev`), then:

```bash
curl -s -X POST http://localhost:3000/api/cart-activity \
  -H "Content-Type: application/json" \
  -d '{"customerEmail":"test@example.com","customerId":"123","productId":"999","productTitle":"Test Lamp","variantId":"456","quantity":2}'
```

Expected: `200 {"ok":true}`. In the Supabase Dashboard, `SELECT * FROM cart_activity WHERE customer_email = 'test@example.com';` returns one row with `status = 'active'`, `quantity = 2`.

- [ ] **Step 3: Verify re-POSTing the same product upserts, not duplicates**

```bash
curl -s -X POST http://localhost:3000/api/cart-activity \
  -H "Content-Type: application/json" \
  -d '{"customerEmail":"test@example.com","customerId":"123","productId":"999","productTitle":"Test Lamp","variantId":"456","quantity":3}'
```

Expected: `200 {"ok":true}`. Re-run the same `SELECT` — still exactly **one** row for that email+product, now with `quantity = 3`.

- [ ] **Step 4: Verify DELETE removes it**

```bash
curl -s -X DELETE http://localhost:3000/api/cart-activity \
  -H "Content-Type: application/json" \
  -d '{"customerEmail":"test@example.com","productId":"999"}'
```

Expected: `200 {"ok":true}`. Re-run the `SELECT` — zero rows.

- [ ] **Step 5: Commit**

```bash
git add app/api/cart-activity/route.ts
git commit -m "Add storefront cart-activity tracking API route"
```

---

### Task 4: Client-side tracking helpers

**Files:**
- Create: `lib/cartActivityClient.ts`

**Interfaces:**
- Consumes: `Product` type from `@/lib/types`.
- Produces (used by Task 5):
  ```ts
  function trackCartActivity(email: string, product: Product, quantity: number): void
  function untrackCartActivity(email: string, product: Product): void
  ```
  Both are fire-and-forget (no return value, never throw — failures are console-warned only).

- [ ] **Step 1: Write the helpers**

```ts
// lib/cartActivityClient.ts
import { Product } from '@/lib/types'

function realProductId(product: Product): string {
  return product.id.replace(/^sp-/, '')
}

function realVariantId(product: Product): string | null {
  return product.variantId ? product.variantId.split('/').pop()! : null
}

export function trackCartActivity(email: string, product: Product, quantity: number): void {
  fetch('/api/cart-activity', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerEmail: email,
      productId:     realProductId(product),
      productTitle:  product.name,
      variantId:     realVariantId(product),
      quantity,
    }),
  }).catch(err => console.warn('[cartActivityClient] track failed:', err))
}

export function untrackCartActivity(email: string, product: Product): void {
  fetch('/api/cart-activity', {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerEmail: email,
      productId:     realProductId(product),
    }),
  }).catch(err => console.warn('[cartActivityClient] untrack failed:', err))
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/cartActivityClient.ts
git commit -m "Add client-side cart-activity tracking helpers"
```

---

### Task 5: Wire tracking into `crateStore`

**Files:**
- Modify: `store/crateStore.ts`

**Interfaces:**
- Consumes: `trackCartActivity`, `untrackCartActivity` from Task 4.
- Produces (used by Task 6): a new store field `_customerEmail: string | null` and action `setCustomerEmail(email: string | null): void`.

- [ ] **Step 1: Add the import**

At the top of `store/crateStore.ts`, add:

```ts
import { trackCartActivity, untrackCartActivity } from '@/lib/cartActivityClient'
```

- [ ] **Step 2: Add `_customerEmail` state and `setCustomerEmail` action to the interface**

Change:

```ts
  _customerToken:  string | null   // set by initCart so addItem can use it without circular imports
```

to:

```ts
  _customerToken:  string | null   // set by initCart so addItem can use it without circular imports
  _customerEmail:  string | null   // set by customerStore so addItem/removeItem can track cart activity
```

And change:

```ts
  initCart:           (customerAccessToken?: string | null) => Promise<void>
  updateCartCurrency: (currency: CurrencyCode) => Promise<void>
```

to:

```ts
  initCart:           (customerAccessToken?: string | null) => Promise<void>
  updateCartCurrency: (currency: CurrencyCode) => Promise<void>
  setCustomerEmail:   (email: string | null) => void
```

- [ ] **Step 3: Initialize the new state field and add the setter action**

Change:

```ts
      _cartCreating:  false,
      _customerToken: null,
```

to:

```ts
      _cartCreating:  false,
      _customerToken: null,
      _customerEmail: null,
```

And right after the `updateCartCurrency` action's closing `},` (just before the final `}),` that closes the store creator), add:

```ts

      setCustomerEmail: (email) => set({ _customerEmail: email }),
```

- [ ] **Step 4: Track new-item adds**

In `addItem`, inside the "New item" branch, change:

```ts
        } else {
          // ── New item — add to Zustand immediately ──────────────────────────
          set({
            items: [
              ...get().items,
              { product, quantity, selectedFinish: finish, selectedBurnerSize: burnerSize, selectedColour, cartLineId: null },
            ],
          })

          const { cartId } = get()
```

to:

```ts
        } else {
          // ── New item — add to Zustand immediately ──────────────────────────
          set({
            items: [
              ...get().items,
              { product, quantity, selectedFinish: finish, selectedBurnerSize: burnerSize, selectedColour, cartLineId: null },
            ],
          })

          const email = get()._customerEmail
          if (email) trackCartActivity(email, product, quantity)

          const { cartId } = get()
```

- [ ] **Step 5: Track quantity increments on existing items**

In `addItem`, inside the "Item already in cart" branch, change:

```ts
        if (existing) {
          // ── Item already in cart — increment quantity (capped at stock) ────
          const newQty = Math.min(existing.quantity + quantity, existing.product.stockQuantity)
          if (newQty === existing.quantity) return // already at stock limit
          set({
            items: get().items.map(i =>
              i.product.id === product.id ? { ...i, quantity: newQty } : i
            ),
          })
```

to:

```ts
        if (existing) {
          // ── Item already in cart — increment quantity (capped at stock) ────
          const newQty = Math.min(existing.quantity + quantity, existing.product.stockQuantity)
          if (newQty === existing.quantity) return // already at stock limit
          set({
            items: get().items.map(i =>
              i.product.id === product.id ? { ...i, quantity: newQty } : i
            ),
          })

          const email = get()._customerEmail
          if (email) trackCartActivity(email, product, newQty)
```

- [ ] **Step 6: Untrack on remove**

Change:

```ts
      removeItem: (productId) => {
        const item   = get().items.find(i => i.product.id === productId)
        const cartId = get().cartId
        // Remove from Zustand immediately
        set({ items: get().items.filter(i => i.product.id !== productId) })
        // Background sync
        if (cartId && item?.cartLineId) {
          cartLinesRemove(cartId, [item.cartLineId])
        }
      },
```

to:

```ts
      removeItem: (productId) => {
        const item   = get().items.find(i => i.product.id === productId)
        const cartId = get().cartId
        // Remove from Zustand immediately
        set({ items: get().items.filter(i => i.product.id !== productId) })
        // Background sync
        if (cartId && item?.cartLineId) {
          cartLinesRemove(cartId, [item.cartLineId])
        }
        const email = get()._customerEmail
        if (email && item) untrackCartActivity(email, item.product)
      },
```

- [ ] **Step 7: Track quantity changes from the stepper (debounced)**

In `updateQuantity`, inside the `setTimeout` callback, change:

```ts
        const timer = setTimeout(() => {
          _syncTimers.delete(productId)
          const { cartId, items } = get()
          const current = items.find(i => i.product.id === productId)
          if (!current || !cartId || !current.cartLineId) return
          cartLinesUpdate(cartId, [{ id: current.cartLineId, quantity: current.quantity }]).then(result => {
```

to:

```ts
        const timer = setTimeout(() => {
          _syncTimers.delete(productId)
          const { cartId, items, _customerEmail } = get()
          const current = items.find(i => i.product.id === productId)
          if (!current) return
          if (_customerEmail) trackCartActivity(_customerEmail, current.product, current.quantity)
          if (!cartId || !current.cartLineId) return
          cartLinesUpdate(cartId, [{ id: current.cartLineId, quantity: current.quantity }]).then(result => {
```

- [ ] **Step 8: Reset the email on `clearCrate`**

Change:

```ts
      clearCrate: () => set({ items: [], cartId: null, checkoutUrl: null, _customerToken: null }),
```

to:

```ts
      clearCrate: () => set({ items: [], cartId: null, checkoutUrl: null, _customerToken: null, _customerEmail: null }),
```

- [ ] **Step 9: Exclude `_customerEmail` from persistence**

In the `partialize` function at the bottom of the file, no change is needed — `_customerEmail` is already excluded because `partialize` only lists `items`, `cartId`, `checkoutUrl` explicitly. Confirm this by reading the current `partialize` block and leaving it as-is:

```ts
      partialize: (state) => ({
        items:       state.items,
        cartId:      state.cartId,
        checkoutUrl: state.checkoutUrl,
        // _customerToken is session-only — don't persist to localStorage
      }),
```

(No edit required — this step is a verification checkpoint, not a code change.)

- [ ] **Step 10: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add store/crateStore.ts
git commit -m "Track logged-in customer cart-add/remove activity from crateStore"
```

---

### Task 6: Keep `crateStore`'s customer email in sync from `customerStore`

**Files:**
- Modify: `store/customerStore.ts`

**Interfaces:**
- Consumes: `setCustomerEmail` action from Task 5.

- [ ] **Step 1: Set email to `null` on both guest paths in `hydrate`**

Change:

```ts
  hydrate: async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        set({ isLoggedIn: false, accessToken: null })
        useCrateStore.getState().initCart()
        return
      }
      const { accessToken, expiresAt } = await res.json()
      set({ isLoggedIn: true, accessToken, expiresAt })
      useCrateStore.getState().initCart(accessToken)
      get().fetchProfile()
    } catch {
      set({ isLoggedIn: false, accessToken: null })
      useCrateStore.getState().initCart()
    }
  },
```

to:

```ts
  hydrate: async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        set({ isLoggedIn: false, accessToken: null })
        useCrateStore.getState().initCart()
        useCrateStore.getState().setCustomerEmail(null)
        return
      }
      const { accessToken, expiresAt } = await res.json()
      set({ isLoggedIn: true, accessToken, expiresAt })
      useCrateStore.getState().initCart(accessToken)
      get().fetchProfile()
    } catch {
      set({ isLoggedIn: false, accessToken: null })
      useCrateStore.getState().initCart()
      useCrateStore.getState().setCustomerEmail(null)
    }
  },
```

- [ ] **Step 2: Set email from the resolved profile in `fetchProfile`**

Change:

```ts
  fetchProfile: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/auth/profile')
      if (!res.ok) { set({ loading: false, profile: null }); return }
      const { profile } = await res.json()
      set({ loading: false, profile: profile ?? null })
    } catch {
      set({ loading: false, profile: null })
    }
  },
```

to:

```ts
  fetchProfile: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/auth/profile')
      if (!res.ok) {
        set({ loading: false, profile: null })
        useCrateStore.getState().setCustomerEmail(null)
        return
      }
      const { profile } = await res.json()
      set({ loading: false, profile: profile ?? null })
      useCrateStore.getState().setCustomerEmail(profile?.email ?? null)
    } catch {
      set({ loading: false, profile: null })
      useCrateStore.getState().setCustomerEmail(null)
    }
  },
```

- [ ] **Step 3: Manually verify in the browser**

1. Start the dev server, log in as a real customer account on the storefront.
2. Open browser devtools → Application → Local Storage → confirm no `_customerEmail` key was added to the `acme-crate` entry (it should only ever hold `items`, `cartId`, `checkoutUrl` — confirms Task 5 Step 9's exclusion works).
3. Add a product to cart while logged in → check the Network tab for a `POST /api/cart-activity` request firing with your logged-in email in the body.
4. Log out → add a product to cart as a guest → confirm **no** `POST /api/cart-activity` request fires.

- [ ] **Step 4: Commit**

```bash
git add store/customerStore.ts
git commit -m "Sync crateStore customer email from customerStore login state"
```

---

### Task 7: Convert cart activity to `converted` on `orders/paid` webhook

**Files:**
- Modify: `app/api/webhooks/shopify/route.ts`

**Interfaces:**
- Consumes: `convertCartActivity` from Task 2.

- [ ] **Step 1: Add the import**

At the top of the file, add:

```ts
import { convertCartActivity } from '@/lib/cartActivity'
```

- [ ] **Step 2: Extend the parsed order type and call `convertCartActivity`**

Change:

```ts
      const o = JSON.parse(rawBody) as {
        name:              string
        total_price:       string
        email:             string
        customer?:         { first_name: string; last_name: string }
        line_items:        { title: string; quantity: number; price: string }[]
        shipping_address?: {
          address1: string; city: string; province: string; country: string
        }
      }
```

to:

```ts
      const o = JSON.parse(rawBody) as {
        name:              string
        total_price:       string
        email:             string
        customer?:         { first_name: string; last_name: string }
        line_items:        {
          title: string; quantity: number; price: string
          product_id: number | null; variant_id: number | null
        }[]
        shipping_address?: {
          address1: string; city: string; province: string; country: string
        }
      }
```

Then, right after the existing `await sendNewOrderAdminAlert({ ... })` call (still inside the `try` block), add:

```ts

      const trackedLineItems = o.line_items
        .filter(i => i.product_id != null)
        .map(i => ({
          productId: String(i.product_id),
          variantId: i.variant_id != null ? String(i.variant_id) : null,
        }))
      if (o.email && trackedLineItems.length > 0) {
        await convertCartActivity(o.email, trackedLineItems, o.name)
      }
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 4: Verify against a real order**

Using the same test customer/product from Task 3 Step 2 (re-`POST` that cart-activity row if you deleted it in Step 4), manually trigger the webhook locally:

```bash
curl -s -X POST http://localhost:3000/api/webhooks/shopify \
  -H "Content-Type: application/json" \
  -H "x-shopify-topic: orders/paid" \
  -H "x-shopify-hmac-sha256: <valid-hmac-for-this-body-and-SHOPIFY_WEBHOOK_SECRET>" \
  -d '{"name":"#TEST1001","total_price":"50.00","email":"test@example.com","line_items":[{"title":"Test Lamp","quantity":2,"price":"25.00","product_id":999,"variant_id":456}]}'
```

(Compute the HMAC with `SHOPIFY_WEBHOOK_SECRET` from your `.env.local`, e.g. via `node -e "console.log(require('crypto').createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET).update(process.argv[1]).digest('base64'))" '<exact-json-body>'`.)

Expected: `200 {"ok":true}`. In Supabase, `SELECT * FROM cart_activity WHERE customer_email = 'test@example.com';` shows `status = 'converted'`, `order_name = '#TEST1001'`, `converted_at` set.

- [ ] **Step 5: Commit**

```bash
git add app/api/webhooks/shopify/route.ts
git commit -m "Convert matching cart_activity rows to converted on orders/paid webhook"
```

---

### Task 8: Attach cart activity to `AdminCustomer`

**Files:**
- Modify: `lib/admin/types.ts`
- Modify: `lib/admin/shopifyAdmin.ts`

**Interfaces:**
- Consumes: `getActiveCartActivityByEmails` from Task 2.
- Produces (used by Task 10, Task 11): `AdminCustomer.cartActivity?: { productTitle: string; quantity: number }[]`.

- [ ] **Step 1: Add the field to `AdminCustomer`**

In `lib/admin/types.ts`, change:

```ts
export interface AdminCustomer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  province: string
  country: string
  orders: number
  totalSpent: number
  joined: string
}
```

to:

```ts
export interface AdminCustomer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  province: string
  country: string
  orders: number
  totalSpent: number
  joined: string
  cartActivity?: { productTitle: string; quantity: number }[]
}
```

- [ ] **Step 2: Add the import to `shopifyAdmin.ts`**

At the top of `lib/admin/shopifyAdmin.ts`, add:

```ts
import { getActiveCartActivityByEmails } from '@/lib/cartActivity'
```

- [ ] **Step 3: Attach cart activity in `getAdminCustomers`**

Change:

```ts
export async function getAdminCustomers(first = 250): Promise<AdminCustomer[]> {
  const data = await adminFetch<{ customers: { edges: { node: ShopifyCustomerNode }[] } }>(
    `query GetCustomers($first: Int!, $query: String!) {
      customers(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
        edges { node { ${CUSTOMER_FIELDS} } }
      }
    }`,
    { first, query: `created_at:>=${LAUNCH_DATE}` }
  )
  return data.customers.edges.map(e => toAdminCustomer(e.node))
}
```

to:

```ts
export async function getAdminCustomers(first = 250): Promise<AdminCustomer[]> {
  const data = await adminFetch<{ customers: { edges: { node: ShopifyCustomerNode }[] } }>(
    `query GetCustomers($first: Int!, $query: String!) {
      customers(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
        edges { node { ${CUSTOMER_FIELDS} } }
      }
    }`,
    { first, query: `created_at:>=${LAUNCH_DATE}` }
  )
  const customers = data.customers.edges.map(e => toAdminCustomer(e.node))
  const cartActivityByEmail = await getActiveCartActivityByEmails(customers.map(c => c.email))
  return customers.map(c => ({ ...c, cartActivity: cartActivityByEmail.get(c.email) ?? [] }))
}
```

- [ ] **Step 4: Attach cart activity in `getAdminCustomerById`**

Change:

```ts
export async function getAdminCustomerById(customerId: string): Promise<AdminCustomer | null> {
  const gid = customerId.startsWith('gid://') ? customerId : `gid://shopify/Customer/${customerId}`
  const data = await adminFetch<{ customer: ShopifyCustomerNode | null }>(
    `query GetCustomer($id: ID!) {
      customer(id: $id) { ${CUSTOMER_FIELDS} }
    }`,
    { id: gid }
  )
  return data.customer ? toAdminCustomer(data.customer) : null
}
```

to:

```ts
export async function getAdminCustomerById(customerId: string): Promise<AdminCustomer | null> {
  const gid = customerId.startsWith('gid://') ? customerId : `gid://shopify/Customer/${customerId}`
  const data = await adminFetch<{ customer: ShopifyCustomerNode | null }>(
    `query GetCustomer($id: ID!) {
      customer(id: $id) { ${CUSTOMER_FIELDS} }
    }`,
    { id: gid }
  )
  if (!data.customer) return null
  const customer = toAdminCustomer(data.customer)
  const cartActivityByEmail = await getActiveCartActivityByEmails([customer.email])
  return { ...customer, cartActivity: cartActivityByEmail.get(customer.email) ?? [] }
}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 6: Verify end-to-end with the test row from Task 3**

Re-`POST` a fresh active row for a real customer email from your admin Customers list (e.g. `ajeffery.ea@gmail.com` if still present):

```bash
curl -s -X POST http://localhost:3000/api/cart-activity \
  -H "Content-Type: application/json" \
  -d '{"customerEmail":"ajeffery.ea@gmail.com","customerId":"10264029167921","productId":"999","productTitle":"Test Lamp","variantId":null,"quantity":1}'
```

Then, logged into `/admin`:

```bash
curl -s http://localhost:3000/api/admin/customers -H "Cookie: acme_admin_session=<paste from browser devtools>"
```

Expected: the JSON array includes that customer with `"cartActivity":[{"productTitle":"Test Lamp","quantity":1}]`.

- [ ] **Step 7: Commit**

```bash
git add lib/admin/types.ts lib/admin/shopifyAdmin.ts
git commit -m "Attach active cart activity to AdminCustomer reads"
```

---

### Task 9: Return converted cart-activity history from the customer detail API

**Files:**
- Modify: `app/api/admin/customers/[id]/route.ts`

**Interfaces:**
- Consumes: `getCartActivityHistoryForEmail` from Task 2.
- Produces (used by Task 11): `GET /api/admin/customers/[id]` response gains a `cartActivityHistory: CartActivityHistoryItem[]` field alongside the existing `customer` and `orders`.

- [ ] **Step 1: Add the import**

At the top of the file, add:

```ts
import { getCartActivityHistoryForEmail } from '@/lib/cartActivity'
```

- [ ] **Step 2: Fetch and return the history**

Change:

```ts
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const [customer, allOrders] = await Promise.all([
      getAdminCustomerById(id),
      getAdminOrders(250),
    ])
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    const orders = allOrders.filter(o => o.customer.email === customer.email)
    return NextResponse.json({ customer, orders })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

to:

```ts
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const [customer, allOrders] = await Promise.all([
      getAdminCustomerById(id),
      getAdminOrders(250),
    ])
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    const orders = allOrders.filter(o => o.customer.email === customer.email)
    const cartActivityHistory = await getCartActivityHistoryForEmail(customer.email)
    return NextResponse.json({ customer, orders, cartActivityHistory })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/api/admin/customers/[id]/route.ts"
git commit -m "Return converted cart-activity history from customer detail API"
```

---

### Task 10: "In Cart" column on the Customers table

**Files:**
- Modify: `app/admin/customers/page.tsx`

**Interfaces:**
- Consumes: `AdminCustomer.cartActivity` from Task 8.

- [ ] **Step 1: Add the mobile card line**

Change:

```tsx
                <p className="text-[11px] text-(--admin-text-muted) truncate">{c.email}</p>
                <p className="text-[11px] text-(--admin-text-muted) mt-0.5">
                  {c.city}, {c.province} · {c.orders} order{c.orders !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
```

to:

```tsx
                <p className="text-[11px] text-(--admin-text-muted) truncate">{c.email}</p>
                <p className="text-[11px] text-(--admin-text-muted) mt-0.5">
                  {c.city}, {c.province} · {c.orders} order{c.orders !== 1 ? 's' : ''}
                </p>
                {c.cartActivity && c.cartActivity.length > 0 && (
                  <p
                    className="text-[11px] text-(--admin-text-muted) mt-0.5 truncate"
                    title={c.cartActivity.map(i => `${i.productTitle} (${i.quantity})`).join(', ')}
                  >
                    In cart: {c.cartActivity[0].productTitle}
                    {c.cartActivity.length > 1 ? ` +${c.cartActivity.length - 1} more` : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
```

- [ ] **Step 2: Add the desktop table header column**

Change:

```tsx
                {['Customer', 'Location', 'Orders', 'Total Spent', 'Joined'].map(h => (
```

to:

```tsx
                {['Customer', 'Location', 'Orders', 'In Cart', 'Total Spent', 'Joined'].map(h => (
```

- [ ] **Step 3: Update the empty-state `colSpan`**

Change:

```tsx
                  <td colSpan={5} className="px-5 py-16 text-center">
```

to:

```tsx
                  <td colSpan={6} className="px-5 py-16 text-center">
```

- [ ] **Step 4: Add the desktop table cell**

Change:

```tsx
                  <td className="px-5 py-3">
                    <span className={cn(
                      'text-[13px] font-semibold',
                      c.orders > 1 ? 'text-(--admin-text)' : 'text-(--admin-text-soft)'
                    )}>
                      {c.orders}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      'text-[13px] font-semibold',
                      c.totalSpent > 0 ? 'text-(--admin-text)' : 'text-(--admin-text-muted)'
                    )}>
                      {c.totalSpent > 0 ? formatCurrency(c.totalSpent) : '—'}
                    </span>
                  </td>
```

to:

```tsx
                  <td className="px-5 py-3">
                    <span className={cn(
                      'text-[13px] font-semibold',
                      c.orders > 1 ? 'text-(--admin-text)' : 'text-(--admin-text-soft)'
                    )}>
                      {c.orders}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {c.cartActivity && c.cartActivity.length > 0 ? (
                      <span
                        className="text-[12px] text-(--admin-text-soft)"
                        title={c.cartActivity.map(i => `${i.productTitle} (${i.quantity})`).join(', ')}
                      >
                        {c.cartActivity[0].productTitle}
                        {c.cartActivity.length > 1 ? ` +${c.cartActivity.length - 1} more` : ''}
                      </span>
                    ) : (
                      <span className="text-[12px] text-(--admin-text-muted)">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      'text-[13px] font-semibold',
                      c.totalSpent > 0 ? 'text-(--admin-text)' : 'text-(--admin-text-muted)'
                    )}>
                      {c.totalSpent > 0 ? formatCurrency(c.totalSpent) : '—'}
                    </span>
                  </td>
```

- [ ] **Step 5: Manually verify in the browser**

1. With the test row from Task 8 Step 6 still present for a real customer email, load `/admin/customers`.
2. Confirm the "In Cart" column shows "Test Lamp" for that customer, and `—` for customers with no active cart activity.
3. Hover the cell — confirm the tooltip lists product + quantity.
4. Resize to mobile width — confirm the "In cart: Test Lamp" line appears under that customer's card.
5. Clean up: `DELETE` the test row via the Task 3 Step 4 curl command (or via Supabase Dashboard) so it doesn't linger as fake data.

- [ ] **Step 6: Commit**

```bash
git add app/admin/customers/page.tsx
git commit -m "Add In Cart column to the Customers table"
```

---

### Task 11: "Cart Activity" section on the customer detail page

**Files:**
- Modify: `app/admin/customers/[id]/page.tsx`

**Interfaces:**
- Consumes: `AdminCustomer.cartActivity` from Task 8, `cartActivityHistory` from Task 9.

- [ ] **Step 1: Add `cartActivityHistory` state and capture it from the fetch**

Change:

```tsx
  const [customer, setCustomer] = useState<AdminCustomer | null>(null)
  const [orders,   setOrders]   = useState<AdminOrder[]>([])
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/customers/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(d => {
        if (!d) return
        setCustomer(d.customer)
        setOrders(d.orders ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])
```

to:

```tsx
  const [customer, setCustomer] = useState<AdminCustomer | null>(null)
  const [orders,   setOrders]   = useState<AdminOrder[]>([])
  const [cartActivityHistory, setCartActivityHistory] = useState<
    { productTitle: string; quantity: number; orderName: string | null; convertedAt: string | null }[]
  >([])
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/customers/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(d => {
        if (!d) return
        setCustomer(d.customer)
        setOrders(d.orders ?? [])
        setCartActivityHistory(d.cartActivityHistory ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])
```

- [ ] **Step 2: Add the "Cart Activity" section**

Change (insert a new `SectionCard` right after the Stats grid and before Order History):

```tsx
          {/* Order history */}
          <SectionCard noPadding>
            <div className="px-5 py-4 border-b border-(--admin-border)">
              <p className="text-[13px] font-semibold text-(--admin-text)">
                Order History
```

to:

```tsx
          {/* Cart activity */}
          {(customer.cartActivity && customer.cartActivity.length > 0) || cartActivityHistory.length > 0 ? (
            <SectionCard noPadding>
              <div className="px-5 py-4 border-b border-(--admin-border)">
                <p className="text-[13px] font-semibold text-(--admin-text)">
                  Cart Activity
                  <span className="ml-2 text-[11px] font-normal text-(--admin-text-muted)">
                    {customer.cartActivity?.length ?? 0} active
                  </span>
                </p>
              </div>

              {customer.cartActivity && customer.cartActivity.length > 0 && (
                <div className="px-5 py-3 space-y-2">
                  {customer.cartActivity.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-[13px] text-(--admin-text)">{item.productTitle}</span>
                      <span className="text-[12px] text-(--admin-text-muted)">Qty {item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}

              {cartActivityHistory.length > 0 && (
                <div className="px-5 py-3 border-t border-(--admin-border) space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-(--admin-text-muted) mb-1">
                    Converted
                  </p>
                  {cartActivityHistory.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-[13px] text-(--admin-text-soft)">
                        {item.productTitle} <span className="text-(--admin-text-muted)">×{item.quantity}</span>
                      </span>
                      <span className="text-[12px] text-(--admin-text-muted)">{item.orderName}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          ) : null}

          {/* Order history */}
          <SectionCard noPadding>
            <div className="px-5 py-4 border-b border-(--admin-border)">
              <p className="text-[13px] font-semibold text-(--admin-text)">
                Order History
```

- [ ] **Step 3: Manually verify in the browser**

1. Re-create the test row from Task 8 Step 6 (`POST /api/cart-activity` for a real customer's email).
2. Open that customer's detail page (`/admin/customers/[id]`) → confirm the "Cart Activity" section appears above Order History, showing "Test Lamp — Qty 1".
3. Trigger the Task 7 Step 4 test webhook for that same email/product → refresh the page → confirm the item moves out of the active list and into a "Converted" sub-list showing the order name.
4. For a customer with no cart activity at all, confirm the whole "Cart Activity" section is omitted (not rendered as an empty card).
5. Clean up any leftover test rows in Supabase.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/customers/[id]/page.tsx"
git commit -m "Add Cart Activity section to the customer detail page"
```

---

## Self-Review

**Spec coverage:**
- Logged-in-only tracking, no anonymous tracking → Task 5/6 (email only ever set from `customerStore`'s real login/profile flow; `null` on every guest path).
- Log + display only, no auto-email segment → confirmed nowhere in this plan touches the Promotional Email System; explicitly out of scope per the design doc.
- Converted rows kept as history, not deleted → Task 7 (`convertCartActivity` updates `status`, never deletes) + Task 9/11 (history surfaced separately from active).
- Removed cart items hidden immediately → Task 5 Step 6 (`untrackCartActivity` fires from `removeItem`) + Task 2's `removeCartActivity` (hard delete, not soft-hide, since there's no "removed" display requirement).
- Displayed on both the Customers table and the detail page → Task 10 + Task 11.
- Item-name preview (not just a count) in the table column → Task 10 Step 4 (`{first title} +N more`).

**Placeholder scan:** no TBD/TODO markers; every step has complete, runnable code; no "similar to Task N" shortcuts — Task 10's mobile and desktop cells are both written out in full since they differ (mobile is a single line, desktop is a full `<td>`).

**Type consistency:** `CartActivityInput`/`ActiveCartItem`/`CartActivityHistoryItem` (Task 2) are the exact shapes consumed by Task 3's route body, Task 4's client helpers' fetch payloads, Task 8's `AdminCustomer.cartActivity`, and Task 11's `cartActivityHistory` state. `trackCartActivity`/`untrackCartActivity` signatures (Task 4) match every call site added in Task 5. `setCustomerEmail` (Task 5) matches every call site added in Task 6.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-08-cart-activity-tracking.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
