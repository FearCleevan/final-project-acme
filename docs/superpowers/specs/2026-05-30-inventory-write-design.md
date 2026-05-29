# Inventory Write — Design Spec
## Acme Lamp & Sign Co. — Admin Dashboard

**Date:** 2026-05-30  
**Scope:** Wire the Inventory page "Adjust" button to persist stock changes to Shopify  
**Effort:** Small — 3 files changed, 1 new file  
**Shopify app changes required:** None — `read_inventory`, `write_inventory`, `read_locations` are already enabled

---

## Problem Statement

Two separate issues both prevent stock from persisting to Shopify:

### Issue 1 — Silent bug in `setInventoryQuantity` (affects all stock saves)

`lib/admin/shopifyAdmin.ts:413` uses a non-standard GraphQL directive:

```graphql
inventorySetQuantities(input: $input) @idempotent(key: "${idempotencyKey}") {
```

`@idempotent` is not supported by Shopify's Admin API. It causes the GraphQL request to be rejected. The call is wrapped in a try/catch that logs the error but does not surface it, so all stock saves fail silently — stock always stays at 0 in Shopify regardless of what value is entered.

**This bug also affects product Create and Edit**, not just the Inventory page.

### Issue 2 — Adjust button is local-only (Inventory page only)

`commitEdit()` in `app/admin/inventory/page.tsx:83` only updates React state:

```ts
function commitEdit(id: string) {
  const n = parseInt(editVal, 10)
  if (!isNaN(n) && n >= 0) setStocks(s => ({ ...s, [id]: n }))
  setEditing(null)
}
```

No API call is made. Changes are lost on page refresh.

---

## Shopify App Scopes — No Changes Needed

Current app scopes already include everything required:

| Scope | Required For |
|---|---|
| `read_inventory` | Query `inventoryItem` and current `on_hand` quantity |
| `write_inventory` | Call `inventorySetQuantities` mutation |
| `read_locations` | Call `locations` query in `getPrimaryLocationId()` |

**No Shopify developer console changes are needed.**

---

## Solution

### Part 1 — Fix `setInventoryQuantity` (`lib/admin/shopifyAdmin.ts`)

Remove the `@idempotent` directive. The rest of the function logic is correct:
- Fetches primary location via `getPrimaryLocationId()` (cached)
- Queries current `on_hand` at that location for `changeFromQuantity` (required by API 2026-04)
- Calls `inventorySetQuantities` with `name: 'on_hand'`, `reason: 'correction'`

**Before:**
```ts
`mutation SetInventory($input: InventorySetQuantitiesInput!) {
  inventorySetQuantities(input: $input) @idempotent(key: "${idempotencyKey}") {
    userErrors { field message }
  }
}`
```

**After:**
```ts
`mutation SetInventory($input: InventorySetQuantitiesInput!) {
  inventorySetQuantities(input: $input) {
    userErrors { field message }
  }
}`
```

The `idempotencyKey` variable and construction logic are removed entirely — they served no purpose once the directive is gone.

**Impact:** Fixes stock saving for product Create, product Edit, and Inventory Adjust — all three were broken by this bug.

---

### Part 2 — New API route: `PATCH /api/admin/inventory/[id]`

**File:** `app/api/admin/inventory/[id]/route.ts` *(new)*

**Purpose:** A dedicated lightweight endpoint for stock-only updates. Does not touch product fields, metafields, images, collections, or publishing.

**Request:**
```
PATCH /api/admin/inventory/[id]
Content-Type: application/json
Body: { "quantity": 12 }
```

**Response (success):**
```json
{ "ok": true, "stock": 12 }
```

**Response (error):**
```json
{ "error": "..." }   // status 400, 401, or 500
```

**Internal flow:**
```
requireAuth()                          ← iron-session check
        ↓
Validate: quantity must be integer ≥ 0
        ↓
adminFetch: query product(id) → variants(first:1) → inventoryItem { id }
        ↓
setInventoryQuantity(inventoryItemId, quantity)
  ├── getPrimaryLocationId()           ← cached, single call
  ├── query current on_hand            ← required for changeFromQuantity
  └── inventorySetQuantities mutation  ← sets the stock
        ↓
Return { ok: true, stock: quantity }
```

**Auth:** iron-session cookie, same `requireAuth()` pattern as all other admin routes.

**Error cases:**
- `401` — not logged in
- `400` — quantity missing, not a number, or negative
- `404` — product not found in Shopify (no inventoryItem)
- `500` — Shopify API error (surfaced from `setInventoryQuantity` throw)

---

### Part 3 — Wire the Inventory page (`app/admin/inventory/page.tsx`)

**Changes to `commitEdit(id)`:**

Current (local-only):
```ts
function commitEdit(id: string) {
  const n = parseInt(editVal, 10)
  if (!isNaN(n) && n >= 0) setStocks(s => ({ ...s, [id]: n }))
  setEditing(null)
}
```

New (calls API, then updates local state on success):
```
1. Parse editVal → integer n
2. Validate: n must be ≥ 0 and a valid number
3. Set row into "saving" state (replaces ✓/✗ buttons with spinner)
4. PATCH /api/admin/inventory/[id] with { quantity: n }
5a. On success → setStocks({ [id]: n }), clear saving state, show brief "Saved ✓" on row
5b. On error   → revert editVal to original value, clear saving state, show error toast
6. setEditing(null)
```

**New state needed:**
- `savingId: string | null` — which row is currently being saved (drives spinner)
- `saveError: string | null` — last error message for the toast

**UI changes:**
- While saving: ✓ and ✗ buttons replaced with a small inline spinner on that row only
- On success: row shows a brief green "Saved" text for ~1.5s, then clears
- On error: toast appears at bottom of page (reuse the existing `Toast` component pattern from Products page)
- All other rows remain fully interactive during a save

**No other changes to the page** — tabs, search, filter, table structure, loading skeleton, summary chips all stay exactly as-is.

---

## Files Changed

| File | Change |
|---|---|
| `lib/admin/shopifyAdmin.ts` | Remove `@idempotent` directive and `idempotencyKey` variable from `setInventoryQuantity` |
| `app/api/admin/inventory/[id]/route.ts` | **New file** — `PATCH` handler for stock-only updates |
| `app/admin/inventory/page.tsx` | Wire `commitEdit` to call the new API; add saving/error UI states |

---

## What This Does NOT Change

- No changes to `AdminProduct` type — `stock` field stays as-is
- No changes to `updateAdminProduct` or `createAdminProduct` — they already call `setInventoryQuantity` and will work correctly once the bug is fixed
- No changes to any other admin page
- No new Shopify app scopes needed
- No new npm packages needed

---

## Verification Steps

After implementation:

1. Open `/admin/inventory`
2. Click "Adjust" on any product, enter a new stock number, press ✓
3. Spinner appears → "Saved ✓" appears → row updates
4. Go to Shopify Admin → Products → that product → Inventory tab
5. Confirm the stock number matches what was entered
6. Also verify: create a new product with stock = 5, check Shopify — should show 5 (not 0)
7. Also verify: edit an existing product, change stock, save — should reflect in Shopify

---

*Spec created: 2026-05-30 · Acme Lamp & Sign Co.*
