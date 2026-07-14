---
name: plan-color-variants
description: "Color variant support — COMPLETE as of June 9, 2026. Admin variant toggle + productSet mutation + storefront swatch selector + cart guard all built."
metadata: 
  node_type: memory
  type: project
  originSessionId: 4f2c576e-d036-4609-a4a6-cbc9618b085b
---

## Color Variant Support — Full Implementation Plan

**Status:** Planned, not yet implemented. Ready to build.
**Trigger phrase:** "Acme recap" → include this plan summary.

### The Problem

`AdminProduct` currently has a single `colour: string` metafield. Products like Hurricane Glass (Clear / Emerald Green / Ruby Red) exist as three separate Shopify products. The goal is one product with real Shopify color variants — selected in admin on creation, shown as swatches on the storefront, and enforced before add-to-cart. Shopify orders automatically show the specific color variant chosen.

---

### Part 1 — Type: `lib/admin/types.ts`

Add new interface + extend `AdminProduct`:

```typescript
export interface AdminProductVariant {
  colour: string
  price: number
  compareAtPrice: number | null
  stock: number
}

// Added to AdminProduct:
hasVariants?: boolean           // toggle: single colour vs. variant list
variants?: AdminProductVariant[] // only used when hasVariants = true
```

---

### Part 2 — Admin UI: `components/admin/forms/ProductForm.tsx`

In the Metafields section near the existing `colour` field:
- Toggle switch: **"This product has color variants"**
- **OFF (default):** current single Colour text field — no change
- **ON:** hide single Colour field, show inline variant table:
  - Columns: Colour name | Price | Compare-at | Stock | [× remove]
  - Price defaults to product's main price
  - "+ Add colour" button appends a new empty row

---

### Part 3 — Admin Backend

**`lib/admin/shopifyAdmin.ts` — `createAdminProduct()`:**
- If `hasVariants = false`: existing behavior, one variant, `acme.colour` metafield set
- If `hasVariants = true`:
  1. Include `options: [{ name: "Colour", values: [...all colours] }]` in `productCreate`
  2. First variant created with the product (Shopify requirement)
  3. Call `productVariantsBulkCreate` for remaining variants (colour, price, compareAtPrice each)
  4. Set inventory per-variant using each `inventoryItem.id`
  5. Skip `acme.colour` metafield (colour lives in variant selectedOptions)

**`app/api/admin/products/route.ts`:**
- Destructure `hasVariants`, `variants` from request body
- Pass to `createAdminProduct`

---

### Part 4 — Storefront: `lib/types.ts` + `lib/shopify.ts`

**`lib/types.ts`** — extend `Product`:
```typescript
// New field (alongside existing finish: string[])
variants: { id: string; colour: string; price: number; stock: number }[]
```

**`lib/shopify.ts`** — Storefront API already fetches `variants.edges.node.selectedOptions`. Map the `Colour` option to the new `variants[]` shape in `shopifyProductToProduct()`.

---

### Part 5 — Storefront UI: `components/product/ProductInfo.tsx`

Replace the current static `finish` dropdown (which is not connected to real Shopify variant IDs) with a **colour swatch button group**:

```
Colour — Select one
[ Clear ]  [ Emerald Green ]  [ Ruby Red ]
```

- Clicking a swatch selects it (highlighted border/ring)
- Selected variant's **price updates** in the price display
- Selected variant's **stock** drives the quantity stepper max + "X left" badge
- Track `selectedVariantId: string | null` in state
- Products with no variants (single colour): swatch row hidden — no change to current UX

**Cart guard in `handleAdd()`:**
```typescript
if (product.variants.length > 1 && !selectedVariantId) {
  setVariantError(true)
  return
}
```
Inline warning directly above the "Add to crate" button:
> ⚠ Please select a colour before adding to your crate.

Disappears immediately on swatch selection. Button stays visible (not greyed out).

---

### Part 6 — Cart: `store/crateStore.ts`

Update `addItem` to carry `variantId`:
```typescript
addItem(product, selectedFinish, selectedBurner, variantId)
```
The checkout `cartLinesAdd` mutation passes `merchandiseId: variantId` to Shopify → orders show the specific colour automatically.

---

### Part 7 — Admin Product Detail: `app/admin/products/[id]/page.tsx`

Add a read-only **Variants card** listing each colour with price and stock. Clicking a variant row links to Shopify Admin for that variant. Full variant editing deferred.

---

### File Touch List

| File | Change |
|---|---|
| `lib/admin/types.ts` | Add `AdminProductVariant`, extend `AdminProduct` |
| `lib/types.ts` | Add `variants` to storefront `Product` |
| `lib/shopify.ts` | Map `selectedOptions` → `variants[]` |
| `components/product/ProductInfo.tsx` | Colour swatches, variant state, cart guard |
| `store/crateStore.ts` | Add `variantId` to cart item |
| `components/admin/forms/ProductForm.tsx` | Variant toggle + table UI |
| `lib/admin/shopifyAdmin.ts` | Multi-variant `createAdminProduct` |
| `app/api/admin/products/route.ts` | Pass `variants`/`hasVariants` |
| `app/admin/products/[id]/page.tsx` | Read-only variants card |
| `lib/admin/mockData.ts` | Add `hasVariants: false, variants: []` to all mock products |
| `lib/mockData.ts` | Add `variants: []` to all storefront mock products |

---

### Out of Scope (deferred)

- Editing variants on an existing product (add/remove colours post-creation)
- Merging the 3 existing Hurricane Glass products into one — user does this manually in Shopify
- Non-colour variants (size, material)

---

### Key payoff

When wired: an order for Hurricane Glass Ruby Red shows in Shopify Admin as:
> **OIL LAMP HURRICANE GLASS — Ruby Red Small · Colour: Red · $55.00 × 2**
Correct inventory deducted, correct price, no ambiguity.
