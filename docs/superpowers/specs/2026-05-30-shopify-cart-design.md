# Shopify Cart API Integration — Design Spec
## Acme Lamp & Sign Co. — Storefront

**Date:** 2026-05-30
**Scope:** Replace Zustand-only cart with a Zustand store backed by Shopify Storefront Cart API. Cart persists across page refreshes via localStorage (cartId). All existing components unchanged.
**Shopify Payments required:** No — cart creation and management works independently of payment setup.
**Pipeline:** Sub-project A of the storefront checkout preparation.

---

## Current State

| Layer | Current behaviour |
|---|---|
| `store/crateStore.ts` | Zustand persist — items stored in localStorage only. No Shopify connection. Cart lost if localStorage is cleared. |
| `lib/types.ts` | `Product` has no `variantId`. `CrateItem` has no `cartLineId`. |
| `lib/shopify.ts` | Storefront API queries — does not expose variant GID. |
| All components | Use `useCrateStore()` — interface stays unchanged after this work. |

---

## Design

### Part 1 — Data Model (`lib/types.ts`)

Add two fields to existing interfaces:

```ts
export interface Product {
  // ... all existing fields ...
  variantId: string   // Shopify ProductVariant GID
                      // e.g. "gid://shopify/ProductVariant/12345678"
                      // populated from firstVar.id in shopifyProductToProduct()
}

export interface CrateItem {
  product:            Product
  quantity:           number
  selectedFinish:     string
  selectedBurnerSize: string
  cartLineId:         string | null   // Shopify CartLine GID
                                      // null until synced to Shopify
                                      // e.g. "gid://shopify/CartLine/abc..."
}
```

`variantId` is already available in `shopifyProductToProduct` as `firstVar.id` — it just needs to be mapped through. `cartLineId` starts as `null` on every new item and is patched in once the Shopify cart responds.

---

### Part 2 — `lib/shopify.ts` — expose `variantId`

In `shopifyProductToProduct`, add to the returned object:

```ts
variantId: firstVar?.id ?? '',
```

`firstVar.id` is the full Shopify variant GID: `"gid://shopify/ProductVariant/12345678"`. This is what the Cart API requires for `CartLineInput.merchandiseId`.

---

### Part 3 — New `lib/shopifyCart.ts`

All Shopify Storefront Cart API calls. Uses the existing `shopifyFetch` from `lib/shopify.ts`.

#### GraphQL fragment (reused across mutations)

```graphql
fragment CartLineFields on CartLine {
  id
  quantity
  merchandise {
    ... on ProductVariant {
      id
      product { handle }
    }
  }
}
```

#### Cart line shape returned from Shopify

```ts
interface ShopifyCartLine {
  id:       string          // CartLine GID
  quantity: number
  merchandise: {
    id:      string         // ProductVariant GID
    product: { handle: string }
  }
}
```

#### Five exported functions

```ts
/**
 * Create a new Shopify cart with initial line items.
 * Returns { cartId, lines } or null on failure.
 */
export async function cartCreate(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<{ cartId: string; lines: ShopifyCartLine[] } | null>

/**
 * Add one or more lines to an existing cart.
 * Returns updated lines or null on failure.
 */
export async function cartLinesAdd(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<ShopifyCartLine[] | null>

/**
 * Update quantity of existing cart lines.
 * Returns updated lines or null on failure.
 */
export async function cartLinesUpdate(
  cartId: string,
  lines: { id: string; quantity: number }[]
): Promise<ShopifyCartLine[] | null>

/**
 * Remove lines from a cart by their line GIDs.
 * Returns updated lines or null on failure.
 */
export async function cartLinesRemove(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCartLine[] | null>

/**
 * Fetch an existing cart. Returns null if cart not found (expired).
 */
export async function fetchCart(
  cartId: string
): Promise<{ cartId: string; lines: ShopifyCartLine[] } | null>
```

**Error handling:** All five functions catch errors internally and return `null` on failure. They never throw. Cart operations failing silently is acceptable — Zustand still holds the local state.

---

### Part 4 — `store/crateStore.ts`

#### New state and action

```ts
interface CrateStore {
  // --- existing fields (unchanged) ---
  items:       CrateItem[]
  isOpen:      boolean
  openCrate:   () => void
  closeCrate:  () => void
  addItem:     (product: Product, finish: string, burnerSize: string) => void
  removeItem:  (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCrate:  () => void
  total:       () => number
  itemCount:   () => number

  // --- new ---
  cartId:      string | null    // Shopify cart GID, persisted to localStorage
  initCart:    () => Promise<void>  // called once on app mount
}
```

#### `addItem` — optimistic update + background sync

```
1. Zustand update (immediate):
   - If item already exists: increment quantity, cartLineId stays as-is
   - If new item: push { ...item, cartLineId: null }

2. Background (fire-and-forget):
   - If cartId is null:
       result = cartCreate([{ merchandiseId: product.variantId, quantity: newQty }])
       if result: set cartId = result.cartId
                  patch cartLineId into ALL items from result.lines
   - If cartId exists and item is new (cartLineId: null):
       result = cartLinesAdd(cartId, [{ merchandiseId: product.variantId, quantity: 1 }])
       if result: patch cartLineId from result.lines into the new item
   - If cartId exists and item already existed (cartLineId known):
       cartLinesUpdate(cartId, [{ id: cartLineId, quantity: newQty }])
```

#### `removeItem` — optimistic update + background sync

```
1. Zustand update (immediate):
   - Remove item from items array

2. Background (fire-and-forget):
   - If cartLineId is not null:
       cartLinesRemove(cartId, [cartLineId])
```

#### `updateQuantity` — optimistic update + background sync

```
1. Zustand update (immediate):
   - Set item.quantity = quantity

2. Background (fire-and-forget):
   - If cartLineId is not null:
       cartLinesUpdate(cartId, [{ id: cartLineId, quantity }])
   - If cartLineId is null (item not yet synced):
       skip — next addItem sync will carry correct quantity
```

#### `clearCrate` — local only (no Shopify call)

```
1. Zustand: items = [], cartId = null
2. No Shopify call — the cart expires naturally on Shopify's side (10 days)
```

#### `initCart` — called once on mount

```
1. Read cartId from state
2. If cartId is null: return (nothing to restore)
3. result = fetchCart(cartId)
4. If result is null (cart expired or invalid):
   - Set cartId = null
   - Keep existing Zustand items (user still sees their cart)
   - A new cart is created on the next addItem
5. If result exists:
   - For each Shopify cart line, find matching item in Zustand items
     by comparing merchandise.id (variantId) to product.variantId
   - Patch cartLineId into matched items
   - Items that exist locally but not in Shopify get cartLineId = null
     (will be re-synced on next mutation)
```

---

### Part 5 — Mount Initialization (`components/shared/ShellClient.tsx`)

Add a single `useEffect` to the existing `ShellClient` component:

```ts
useEffect(() => {
  useCrateStore.getState().initCart()
}, [])
```

This fires once after hydration. No other component needs to change.

---

## Files Changed

| File | Action |
|---|---|
| `lib/types.ts` | Add `variantId: string` to `Product`, add `cartLineId: string \| null` to `CrateItem` |
| `lib/shopify.ts` | Map `variantId: firstVar?.id ?? ''` in `shopifyProductToProduct` |
| `lib/shopifyCart.ts` | **New file** — 5 cart functions using Shopify Storefront Cart API |
| `store/crateStore.ts` | Add `cartId`, `initCart`, update all 4 mutating actions to background-sync |
| `components/shared/ShellClient.tsx` | Add `useEffect` calling `initCart()` on mount |

---

## What Does NOT Change

- All components using `useCrateStore()` — zero changes required
- `CrateDrawer`, `CrateItem`, `CrateSummary`, `app/crate/page.tsx`, `app/checkout/page.tsx`, `ProductInfo` — untouched
- The drawer open/close logic — untouched
- `total()` and `itemCount()` — still computed from Zustand items, not from Shopify
- The `finish` and `burnerSize` selectors — still local-only (Shopify single-variant products don't have these as true variants)

---

## Cart Persistence Behaviour

| Scenario | Result |
|---|---|
| User adds item, refreshes page | Items restored from Zustand (localStorage). `initCart` patches `cartLineId`s from Shopify. |
| User clears localStorage manually | Cart lost locally. Shopify cart still exists but unreachable — expires in 10 days. |
| Shopify cart expires (10 days) | `initCart` returns null, sets `cartId = null`. Items still in Zustand. New cart created on next `addItem`. |
| User adds item on phone, opens laptop | Cart not shared (anonymous guest cart, device-local). Shared cart requires customer auth (future). |
| `addItem` Shopify call fails | Zustand updated (UI works). `cartLineId` stays null. Next successful mutation re-syncs. |

---

## Verification Steps

1. Add product to cart — appears in drawer immediately
2. Refresh page — item still in drawer (Zustand persist)
3. Add same product again — quantity increments
4. Open Shopify Admin → Sales Channels → Online Store → no cart there (Storefront API carts don't appear in admin, but they can be verified via the Storefront API test endpoint)
5. Open browser DevTools → Application → localStorage → `acme-crate` — should contain `cartId` matching a `gid://shopify/Cart/...` GID
6. Remove item — removed immediately, Shopify line removed in background
7. Update quantity to 0 — item removed (existing `removeItem` logic handles qty ≤ 1 → remove)
8. Clear crate (place order or manual clear) — `cartId` set to null, Zustand empty

---

*Spec created: 2026-05-30 · Acme Lamp & Sign Co.*
