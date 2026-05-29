# Shopify Cart API Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Zustand-only cart with a Zustand store backed by the Shopify Storefront Cart API — cart persists to Shopify via localStorage cartId, all existing components unchanged.

**Architecture:** Optimistic updates — Zustand state changes immediately for instant UI, then Shopify is synced in the background. Cart ID stored in Zustand persist (localStorage). On mount, `initCart()` fetches the existing Shopify cart and patches `cartLineId`s into items. Five dedicated cart functions in `lib/shopifyCart.ts` call the Storefront API using `NEXT_PUBLIC_` env vars (the Storefront token is a public token by design).

**Tech Stack:** Next.js 16 App Router, TypeScript, Zustand 5, Shopify Storefront API 2025-01, `fetch` (browser-side, no caching)

**Spec:** `docs/superpowers/specs/2026-05-30-shopify-cart-design.md`

> **Note:** No automated test runner in this project. `npm run build` verifies types. Manual browser steps verify behaviour.

---

## Task 1: Update data types and Shopify adapter

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/shopify.ts`

**Context:** `Product` needs a `variantId` field (the Shopify ProductVariant GID) so the cart API knows which variant to add. `CrateItem` needs a `cartLineId` field (the Shopify CartLine GID) so lines can be updated or removed. The `variantId` is already available in `shopifyProductToProduct` as `firstVar.id` — it just needs to be exposed.

---

- [ ] **Step 1: Add `variantId` to `Product` and `cartLineId` to `CrateItem` in `lib/types.ts`**

Read the file first. Then add `variantId` as the last field of `Product`, and `cartLineId` as the last field of `CrateItem`:

```ts
export interface Product {
  id: string
  slug: string
  sku: string
  patent: string
  name: string
  shortDescription: string
  fullDescription: string
  price: number
  category: 'oil-lamp-chimneys' | 'oil-lamp-shades' | 'oil-lamp-pressure-lamps' | 'oil-lamp-books' | 'oil-lamp-spreaders' | 'oil-lamp-wicks'
  burnerSize: 'No. 1' | 'No. 2' | 'No. 3' | 'Universal' | null
  stockQuantity: number
  material: string
  finish: string[]
  fits: string
  benchTesterName: string
  benchTestDate: string
  workshop: string
  edition: string
  netWeight: string
  era: string
  powerSource: string
  productType: string
  condition: string
  style: string
  colour: string
  brand: string
  vintage: string
  images: string[]
  inStock: boolean
  featured: boolean
  collection: string
  variantId: string   // Shopify ProductVariant GID e.g. "gid://shopify/ProductVariant/12345"
}

export interface CrateItem {
  product:            Product
  quantity:           number
  selectedFinish:     string
  selectedBurnerSize: string
  cartLineId:         string | null  // Shopify CartLine GID — null until synced
}
```

Keep `FilterState` exactly as-is.

---

- [ ] **Step 2: Map `variantId` in `shopifyProductToProduct` in `lib/shopify.ts`**

Read `lib/shopify.ts`. Find `shopifyProductToProduct`. Inside the returned object, add `variantId` after `collection`:

```ts
  variantId:        firstVar?.id ?? '',
```

`firstVar` is already declared as `const firstVar = p.variants.edges[0]?.node`. Its `.id` is the full Shopify ProductVariant GID.

---

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: no new TypeScript errors. The build will complain about `cartLineId` being missing from all existing places where `CrateItem` objects are constructed (specifically in `store/crateStore.ts`'s `addItem`). Note those errors — they will be fixed in Task 3.

---

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts lib/shopify.ts
git commit -m "feat: add variantId to Product, cartLineId to CrateItem"
```

---

## Task 2: Create `lib/shopifyCart.ts` and add env vars

**Files:**
- Create: `lib/shopifyCart.ts`
- Modify: `.env.local` (add two `NEXT_PUBLIC_` vars)

**Context:** Cart mutations run client-side inside the Zustand store. Next.js only exposes env vars prefixed with `NEXT_PUBLIC_` to the browser. The Shopify Storefront Access Token is a **public** token by design — Shopify intends it to be used in the browser. Add the same domain and token values as `NEXT_PUBLIC_` counterparts. These cart functions use raw `fetch` (no caching) rather than the server-side `shopifyFetch` helper, because `shopifyFetch` uses ISR caching which is not appropriate for cart mutations.

---

- [ ] **Step 1: Add `NEXT_PUBLIC_` env vars to `.env.local`**

Open `.env.local`. Add these two lines (use the same values already set for `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_ACCESS_TOKEN`):

```bash
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_token_here
```

Copy the values from the existing `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_ACCESS_TOKEN` entries.

---

- [ ] **Step 2: Create `lib/shopifyCart.ts`**

Create this file with the exact content below:

```ts
/**
 * Shopify Storefront Cart API — client-side cart operations.
 *
 * Uses NEXT_PUBLIC_ env vars because these functions run in the browser
 * (called from the Zustand store). The Storefront token is a public token
 * by design — safe to expose to the browser.
 */

const DOMAIN   = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!
const TOKEN    = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!
const ENDPOINT = `https://${DOMAIN}/api/2025-01/graphql.json`

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShopifyCartLine {
  id:          string   // CartLine GID e.g. "gid://shopify/CartLine/abc"
  quantity:    number
  merchandise: {
    id:      string   // ProductVariant GID
    product: { handle: string }
  }
}

// ─── Internal fetch ───────────────────────────────────────────────────────────

async function cartFetch<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T | null> {
  try {
    const res = await fetch(ENDPOINT, {
      method:  'POST',
      headers: {
        'Content-Type':                      'application/json',
        'X-Shopify-Storefront-Access-Token': TOKEN,
      },
      body:  JSON.stringify({ query, variables }),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const { data, errors } = await res.json()
    if (errors?.length) {
      console.error('[shopifyCart] GraphQL errors:', errors)
      return null
    }
    return data as T
  } catch (err) {
    console.error('[shopifyCart]', err)
    return null
  }
}

// ─── Shared fragment ──────────────────────────────────────────────────────────

const LINE_FIELDS = `
  id
  quantity
  merchandise {
    ... on ProductVariant {
      id
      product { handle }
    }
  }
`

const CART_LINES = `
  lines(first: 50) {
    edges { node { ${LINE_FIELDS} } }
  }
`

function toLines(
  cart: { lines: { edges: { node: ShopifyCartLine }[] } } | null | undefined
): ShopifyCartLine[] {
  return cart?.lines.edges.map(e => e.node) ?? []
}

// ─── Cart functions ───────────────────────────────────────────────────────────

/**
 * Create a new Shopify cart with one or more line items.
 * Returns { cartId, lines } or null on failure.
 */
export async function cartCreate(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<{ cartId: string; lines: ShopifyCartLine[] } | null> {
  const data = await cartFetch<{
    cartCreate: {
      cart: { id: string; lines: { edges: { node: ShopifyCartLine }[] } } | null
      userErrors: { field: string; message: string }[]
    }
  }>(
    `mutation cartCreate($lines: [CartLineInput!]!) {
      cartCreate(input: { lines: $lines }) {
        cart { id ${CART_LINES} }
        userErrors { field message }
      }
    }`,
    { lines }
  )
  const cart = data?.cartCreate?.cart
  if (!cart) return null
  return { cartId: cart.id, lines: toLines(cart) }
}

/**
 * Add line items to an existing cart.
 * Returns updated lines or null on failure.
 */
export async function cartLinesAdd(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<ShopifyCartLine[] | null> {
  const data = await cartFetch<{
    cartLinesAdd: {
      cart: { lines: { edges: { node: ShopifyCartLine }[] } } | null
      userErrors: { field: string; message: string }[]
    }
  }>(
    `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ${CART_LINES} }
        userErrors { field message }
      }
    }`,
    { cartId, lines }
  )
  return data?.cartLinesAdd?.cart ? toLines(data.cartLinesAdd.cart) : null
}

/**
 * Update quantity of existing cart lines.
 * Returns updated lines or null on failure.
 */
export async function cartLinesUpdate(
  cartId: string,
  lines: { id: string; quantity: number }[]
): Promise<ShopifyCartLine[] | null> {
  const data = await cartFetch<{
    cartLinesUpdate: {
      cart: { lines: { edges: { node: ShopifyCartLine }[] } } | null
      userErrors: { field: string; message: string }[]
    }
  }>(
    `mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ${CART_LINES} }
        userErrors { field message }
      }
    }`,
    { cartId, lines }
  )
  return data?.cartLinesUpdate?.cart ? toLines(data.cartLinesUpdate.cart) : null
}

/**
 * Remove lines from a cart by their CartLine GIDs.
 * Returns updated lines or null on failure.
 */
export async function cartLinesRemove(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCartLine[] | null> {
  const data = await cartFetch<{
    cartLinesRemove: {
      cart: { lines: { edges: { node: ShopifyCartLine }[] } } | null
      userErrors: { field: string; message: string }[]
    }
  }>(
    `mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ${CART_LINES} }
        userErrors { field message }
      }
    }`,
    { cartId, lineIds }
  )
  return data?.cartLinesRemove?.cart ? toLines(data.cartLinesRemove.cart) : null
}

/**
 * Fetch an existing cart by ID.
 * Returns { cartId, lines } or null if cart not found / expired.
 */
export async function fetchCart(
  cartId: string
): Promise<{ cartId: string; lines: ShopifyCartLine[] } | null> {
  const data = await cartFetch<{
    cart: { id: string; lines: { edges: { node: ShopifyCartLine }[] } } | null
  }>(
    `query getCart($cartId: ID!) {
      cart(id: $cartId) {
        id
        ${CART_LINES}
      }
    }`,
    { cartId }
  )
  const cart = data?.cart
  if (!cart) return null
  return { cartId: cart.id, lines: toLines(cart) }
}
```

---

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: no new TypeScript errors from `lib/shopifyCart.ts`.

---

- [ ] **Step 4: Commit**

```bash
git add lib/shopifyCart.ts
git commit -m "feat: add Shopify Storefront Cart API client (shopifyCart.ts)"
```

> Note: `.env.local` is gitignored — do not stage it.

---

## Task 3: Update `store/crateStore.ts`

**Files:**
- Modify: `store/crateStore.ts`

**Context:** Replace the entire file with the version below. The public interface (`useCrateStore` with the same actions) is preserved exactly — zero component changes needed. New additions: `cartId: string | null` state, `initCart()` async action, and background Shopify sync in `addItem`, `removeItem`, and `updateQuantity`. `clearCrate` sets `cartId = null` without calling Shopify (the cart expires naturally after 10 days).

---

- [ ] **Step 1: Read the current `store/crateStore.ts`**

Read it to understand the current state. Confirm the existing interface matches what you expect.

---

- [ ] **Step 2: Replace `store/crateStore.ts` with the new implementation**

Replace the entire file content with:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CrateItem, Product } from '@/lib/types'
import {
  cartCreate,
  cartLinesAdd,
  cartLinesUpdate,
  cartLinesRemove,
  fetchCart,
} from '@/lib/shopifyCart'

interface CrateStore {
  items:          CrateItem[]
  isOpen:         boolean
  cartId:         string | null
  openCrate:      () => void
  closeCrate:     () => void
  addItem:        (product: Product, finish: string, burnerSize: string) => void
  removeItem:     (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCrate:     () => void
  total:          () => number
  itemCount:      () => number
  initCart:       () => Promise<void>
}

export const useCrateStore = create<CrateStore>()(
  persist(
    (set, get) => ({
      items:  [],
      isOpen: false,
      cartId: null,

      openCrate:  () => set({ isOpen: true }),
      closeCrate: () => set({ isOpen: false }),

      addItem: (product, finish, burnerSize) => {
        const existing = get().items.find(i => i.product.id === product.id)

        if (existing) {
          // ── Item already in cart — increment quantity ──────────────────────
          const newQty = existing.quantity + 1
          set({
            items: get().items.map(i =>
              i.product.id === product.id ? { ...i, quantity: newQty } : i
            ),
          })
          // Background sync: update the Shopify line quantity
          const { cartId } = get()
          if (cartId && existing.cartLineId) {
            cartLinesUpdate(cartId, [{ id: existing.cartLineId, quantity: newQty }])
          }
        } else {
          // ── New item — add to Zustand immediately ──────────────────────────
          set({
            items: [
              ...get().items,
              { product, quantity: 1, selectedFinish: finish, selectedBurnerSize: burnerSize, cartLineId: null },
            ],
          })

          const { cartId } = get()

          if (!cartId) {
            // No cart yet — create one with ALL current items
            const allItems = get().items
            cartCreate(
              allItems.map(i => ({ merchandiseId: i.product.variantId, quantity: i.quantity }))
            ).then(result => {
              if (!result) return
              set(state => ({
                cartId: result.cartId,
                items:  state.items.map(item => {
                  const line = result.lines.find(l => l.merchandise.id === item.product.variantId)
                  return line ? { ...item, cartLineId: line.id } : item
                }),
              }))
            })
          } else {
            // Cart exists — add just this new line
            cartLinesAdd(cartId, [{ merchandiseId: product.variantId, quantity: 1 }]).then(lines => {
              if (!lines) return
              const line = lines.find(l => l.merchandise.id === product.variantId)
              if (!line) return
              set(state => ({
                items: state.items.map(i =>
                  i.product.id === product.id ? { ...i, cartLineId: line.id } : i
                ),
              }))
            })
          }
        }
      },

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

      updateQuantity: (productId, quantity) => {
        const item   = get().items.find(i => i.product.id === productId)
        const cartId = get().cartId
        // Update Zustand immediately
        set({
          items: get().items.map(i =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        })
        // Background sync
        if (cartId && item?.cartLineId) {
          cartLinesUpdate(cartId, [{ id: item.cartLineId, quantity }])
        }
        // If cartLineId is null the item hasn't been synced yet — the next
        // successful addItem will carry the correct quantity.
      },

      clearCrate: () => set({ items: [], cartId: null }),
      // No Shopify call on clear — cart expires naturally after 10 days.

      total: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      initCart: async () => {
        const { cartId } = get()
        if (!cartId) return

        const result = await fetchCart(cartId)

        if (!result) {
          // Cart expired or invalid — reset cartId, keep local items
          set({ cartId: null })
          return
        }

        // Patch Shopify cartLineIds into existing Zustand items
        set(state => ({
          items: state.items.map(item => {
            const line = result.lines.find(l => l.merchandise.id === item.product.variantId)
            return { ...item, cartLineId: line?.id ?? null }
          }),
        }))
      },
    }),
    { name: 'acme-crate' }
  )
)
```

---

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: clean build with no TypeScript errors. If there are errors about `cartLineId` being missing from object literals elsewhere in the codebase, find them and add `cartLineId: null` to fix each one.

---

- [ ] **Step 4: Commit**

```bash
git add store/crateStore.ts
git commit -m "feat: back crateStore with Shopify Cart API — optimistic sync"
```

---

## Task 4: Call `initCart` on mount in `ShellClient`

**Files:**
- Modify: `components/shared/ShellClient.tsx`

**Context:** `ShellClient` is the outermost client component — it wraps the entire storefront in `app/layout.tsx`. A single `useEffect` here calls `initCart()` once after hydration. This fires before the user sees the page, so `cartLineId`s are patched in before any cart mutation the user might trigger.

---

- [ ] **Step 1: Read `components/shared/ShellClient.tsx`**

Read the current file. It imports `usePathname`, `Nav`, `CrateDrawer`, `SearchOverlay`, `Footer`, `useSearchOverlay`.

---

- [ ] **Step 2: Add `useEffect` and `useCrateStore` import**

Add `useEffect` to the React import and import `useCrateStore`. Then add the effect inside the component body, before the early return for admin routes:

```ts
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Nav from '@/components/nav/Nav'
import CrateDrawer from '@/components/crate/CrateDrawer'
import SearchOverlay from '@/components/shared/SearchOverlay'
import Footer from '@/components/shared/Footer'
import { useSearchOverlay } from '@/hooks/useSearchOverlay'
import { useCrateStore } from '@/store/crateStore'

interface ShellClientProps {
  children: React.ReactNode
}

export default function ShellClient({ children }: ShellClientProps) {
  const pathname = usePathname()
  const { isOpen, open, close, query, setQuery } = useSearchOverlay()

  useEffect(() => {
    useCrateStore.getState().initCart()
  }, [])

  // Admin routes manage their own layout — skip the storefront shell entirely
  if (pathname.startsWith('/admin')) return <>{children}</>

  return (
    <>
      <Nav onSearchOpen={open} />

      <SearchOverlay
        isOpen={isOpen}
        onClose={close}
        query={query}
        onQueryChange={setQuery}
      />

      <CrateDrawer />

      <main id="main-content" className="flex-1 flex flex-col pt-16">
        {children}
      </main>

      <Footer />
    </>
  )
}
```

---

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: clean build.

---

- [ ] **Step 4: Manual end-to-end verification**

Start the dev server:
```bash
npm run dev
```

**Test 1 — Add to cart:**
1. Go to any product page (e.g. `/catalog/floral-etched-ball-shade-blue`)
2. Click "Add to crate"
3. Open browser DevTools → Application → Local Storage → `acme-crate`
4. Expected: `cartId` field now contains a value like `"gid://shopify/Cart/abc..."` and the item has a `cartLineId` set

**Test 2 — Cart persistence:**
1. Add an item to the cart
2. Close the browser tab
3. Reopen the site
4. Expected: item still in cart, `cartLineId` populated (patched in by `initCart`)

**Test 3 — Quantity update:**
1. Add an item, then adjust quantity in the drawer
2. Check DevTools Network tab — should see a `cartLinesUpdate` GraphQL mutation firing

**Test 4 — Remove item:**
1. Remove an item from the cart
2. Check Network tab — should see a `cartLinesRemove` mutation

**Test 5 — Expired cart:**
1. Manually edit localStorage `acme-crate` — change `cartId` to `"gid://shopify/Cart/invalid123"`
2. Refresh the page
3. Expected: cart items remain visible in the drawer, `cartId` is reset to `null`, a new cart is created on the next `addItem`

---

- [ ] **Step 5: Commit**

```bash
git add components/shared/ShellClient.tsx
git commit -m "feat: call initCart on mount to sync Shopify cart line IDs"
```

---

## Summary

| Task | Files | Commit |
|---|---|---|
| 1 | `lib/types.ts`, `lib/shopify.ts` | `feat: add variantId to Product, cartLineId to CrateItem` |
| 2 | `lib/shopifyCart.ts`, `.env.local` | `feat: add Shopify Storefront Cart API client (shopifyCart.ts)` |
| 3 | `store/crateStore.ts` | `feat: back crateStore with Shopify Cart API — optimistic sync` |
| 4 | `components/shared/ShellClient.tsx` | `feat: call initCart on mount to sync Shopify cart line IDs` |

After all tasks: the cart is backed by real Shopify data. Cart ID persists in localStorage. All components that use `useCrateStore()` are unchanged. The checkout flow (Pipeline B) can now read the real `cartId` to create a draft order.
