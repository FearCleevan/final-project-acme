---
name: plan-multicolour-cart
description: "Approved design for multi-colour selection + grouped cart — opt-in multi-select on PDP, grouped cart display for variant items. Ready to write spec + implementation plan."
metadata: 
  node_type: memory
  type: project
  originSessionId: 4f2c576e-d036-4609-a4a6-cbc9618b085b
---

## Multi-Colour Selection + Grouped Cart — Approved Design

**Status:** ✅ FULLY IMPLEMENTED — June 9, 2026. All 5 tasks complete, all reviews passed.
**Brainstorm session dir:** `acme-lamp-sign/.superpowers/brainstorm/1271-1781013653/`

**Related:** [[plan-color-variants]] [[project-acme-lamp-sign]]

---

## Decisions Made

| Decision | Choice | Reason |
|---|---|---|
| PDP layout | Option C — opt-in multi | Least disruptive; single-select default preserved |
| Expanded panel | C1 — full section replacement | One mental model at a time; cleaner than additive panel |
| Cart display | Y — grouped by product | Variant items group under product name; flat row = no variants |

---

## Section 1 — Product Page (`ProductInfo.tsx`)

**Non-variant products:** Zero change. Existing single qty stepper + Add to Crate flow untouched.

**Variant products — two modes:**

### Mode 1 (default, single-select)
Identical to current behaviour. Swatch radio buttons, single qty stepper.
A small `"+ Buying multiple colours?"` link sits below the swatches.

### Mode 2 (multi-select, opt-in)
Triggered by clicking the link. The entire swatch + qty stepper block is **replaced in-place** by a per-colour table:
- Header: `"Colour & Quantity"` + `"Single colour ✕"` link to revert
- One row per in-stock colour: `[colour dot] [name] [− qty +] [$subtotal]`
- Out-of-stock rows: greyed, no stepper, "Sold out" label
- Switching back resets to null selection, qty = 1
- If a colour was already selected when switching, it pre-populates with qty = 1

**CTA button (multi mode):** `"Add N items to crate — $X.XX"` summing all rows with qty > 0.
Disabled if zero quantities set.

---

## Section 2 — Cart Store (`crateStore.ts`)

- `addItem` gains optional `quantity` parameter (default 1)
- `cartLinesAdd` passes `quantity: qty` instead of always `quantity: 1`
- `handleAdd` (multi mode) calls `addItem(cartProduct, finish, burner, colour, qty)` once per selected colour
- Eliminates the current qty-loop hack in `ProductInfo.handleAdd`

---

## Section 3 — Cart Display

**Grouping rule:** `product.variantId` is set → grouped block. `product.variantId` null/undefined → flat row (unchanged).

**Grouped block renders as:**
```
[product image]  Hurricane Glass            3 items · $165.00
                   ● Clear    [− 2 +]        $110
                   ● Emerald  [− 1 +]         $55
```
- Product image shown once
- Colour rows indented, compact
- Each colour row has its own qty stepper (calls existing `updateQuantity`)
- Remove (×) per colour row

**Applies to:** `components/crate/CrateSummary.tsx` + `app/crate/page.tsx`

---

## Section 4 — What Does NOT Change

| Thing | Why |
|---|---|
| Checkout | Shopify receives separate line items per `variantId` — already correct |
| Admin orders | Shopify order already shows each colour as a separate line item |
| Customer account orders | Reads Shopify order data — already correct |
| `lib/types.ts` | No new types needed |
| API routes | No changes |
| Non-variant product pages | Completely untouched |

---

## Files to Touch

| File | Change |
|---|---|
| `components/product/ProductInfo.tsx` | Multi-select mode UI |
| `store/crateStore.ts` | `quantity` param on `addItem`, fix `cartLinesAdd` quantity |
| `components/crate/CrateSummary.tsx` | Grouped render for variant items |
| `app/crate/page.tsx` | Same grouping (check if it has its own item list) |

---

## How to Apply

When resuming: invoke `superpowers:writing-plans` skill and reference this memory.
Build in this order: (1) `crateStore.ts`, (2) `ProductInfo.tsx`, (3) cart display components.
