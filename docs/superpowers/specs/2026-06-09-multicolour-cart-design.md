# Multi-Colour Selection + Grouped Cart — Design Spec

**Date:** 2026-06-09
**Status:** Approved — ready for implementation
**Scope:** Storefront product detail page + cart store + cart display

---

## Problem

Products with colour variants (e.g. Hurricane Glass: Clear / Emerald / Ruby Red) currently require a customer to add-to-crate once per colour — three separate visits to the product page. The feature adds an opt-in multi-colour selector so a customer can pick quantities for several colours in one action and add them all at once.

---

## What Does Not Change

- Non-variant products: untouched end-to-end
- Shopify checkout: already receives separate line items per `variantId` — no change
- Admin orders: Shopify already records each colour as its own order line — no change
- Customer account orders page: reads Shopify order data — no change
- All API routes: no changes
- `lib/types.ts`: no new types needed

---

## Section 1 — Product Detail Page

**File:** `components/product/ProductInfo.tsx`

### Non-variant products
No change. Single quantity stepper and Add to Crate button are identical to today.

### Variant products — two modes

#### Mode 1: Single-select (default)
Identical to current behaviour:
- Swatch buttons (radio — one active at a time)
- Single quantity stepper
- Add to Crate button with per-unit price
- A small link below the swatches: `"+ Buying multiple colours?"`

If a colour was already selected and the user clicks `"+ Buying multiple colours?"`, that colour pre-populates in the table with qty = 1.

#### Mode 2: Multi-select (opt-in)
Triggered by clicking `"+ Buying multiple colours?"`. The entire swatch block + quantity stepper is **replaced in-place** by a per-colour table. A `"Single colour ✕"` link at the top of the table reverts to Mode 1.

**Table structure (one row per colour variant):**

| Element | Detail |
|---|---|
| Colour dot | Small circle filled with the preset hex colour (matches admin swatch colours) |
| Colour name | e.g. "Clear", "Emerald Green" |
| Qty stepper | `[−] [n] [+]` — min 0, max = variant stock |
| Row subtotal | `$XX.XX` — price × qty, hidden when qty = 0 |
| Out-of-stock row | Greyed out, no stepper, "Sold out" label instead |

**CTA button (multi mode):**
- Label: `"Add N items to crate — $X.XX"` — N = sum of all qtys, price = sum of all row subtotals
- Disabled when no quantities are set (all rows at 0)

**Reverting to Mode 1:**
- Clicking `"Single colour ✕"` switches back
- Table state (all qtys) is discarded
- Swatch resets to null selection, qty stepper resets to 1

**State managed in component (no store changes for this):**
- `multiMode: boolean` — which mode is active
- `selectedVariants: Map<variantId, { cv: ColorVariant; qty: number }>` — multi-mode selections
- Existing `selectedVariant` / `qty` state retained for single-select mode

---

## Section 2 — Cart Store

**File:** `store/crateStore.ts`

### Change: `addItem` quantity parameter

```typescript
// Before
addItem(product, finish, burnerSize, selectedColour?)

// After
addItem(product, finish, burnerSize, selectedColour?, quantity = 1)
```

- Local state: set initial `quantity` to the passed value instead of always 1
- Shopify sync: pass `quantity` to `cartLinesAdd` instead of always `quantity: 1`
- Eliminates the `for (let i = 0; i < qty; i++) { addItem(...) }` loop in `ProductInfo.handleAdd`

### `handleAdd` in multi mode (ProductInfo)

```typescript
for (const [, { cv, qty }] of selectedVariants) {
  if (qty === 0) continue
  const cartProduct = {
    ...product,
    id: `${product.id}-${cv.id}`,
    variantId: cv.id,
    price: cv.price,
    stockQuantity: cv.stock,
  }
  addItem(cartProduct, selectedFinish, selectedBurner, cv.colour, qty)
}
```

Each colour becomes a separate cart line item with its own `variantId`. Shopify checkout and order system handle them as distinct lines automatically.

---

## Section 3 — Cart Display

**Files:** `components/crate/CrateSummary.tsx`, `app/crate/page.tsx`

### Grouping rule

- `product.variantId` is set → variant item → render in grouped block
- `product.variantId` is null/undefined → non-variant item → flat row (unchanged)

Items are grouped by base product name (all variant items sharing the same `product.name` collapse under one product header).

### Grouped block layout

```
[52px image]  Product Name                    N items · $XXX.XX
              ────────────────────────────────────────────────
              ● Colour 1   [− qty +]            $XX.XX   [×]
              ● Colour 2   [− qty +]            $XX.XX   [×]
```

- Product image shown once (from first item in the group)
- Product name + aggregate count + aggregate price in the header
- Colour rows are indented, compact (smaller stepper than the main product stepper)
- Each colour row calls existing `updateQuantity(cartKey, newQty)` for its stepper
- `[×]` remove button calls existing `removeItem(cartKey)`
- Removing the last colour in a group removes the group header automatically

### Flat row (non-variant products)
Unchanged — identical to today.

### Render order
Groups render in the order the first item of each group was added. Within a group, colours render in add order.

---

## Implementation Order

1. `store/crateStore.ts` — add `quantity` param (small, no UI, easy to verify)
2. `components/product/ProductInfo.tsx` — multi-select mode (main work)
3. `components/crate/CrateSummary.tsx` — grouped render
4. `app/crate/page.tsx` — same grouped render (verify if it has its own item list)

---

## Out of Scope

- Cart grouping for products that have the same name but are genuinely different products (not an issue for Acme's catalog)
- Multi-select on non-colour variants (size, material)
- Editing selected colours after adding to crate (user modifies qty per line in the cart, which already works)
