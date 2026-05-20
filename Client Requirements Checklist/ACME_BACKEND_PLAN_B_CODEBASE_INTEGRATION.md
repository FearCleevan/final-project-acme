# Acme Lamp & Sign Co. — Backend Implementation Plan B
## Next.js Codebase · Shopify + Sanity Integration
### Phase-by-Phase Execution Guide · Stop → Report → Proceed

> **Prerequisites:** Plan A must be fully complete before executing this plan. All Shopify products, collections, and metafields must be live. Sanity schemas must be deployed and content must be seeded. All API credentials must be in `.env.local`.
>
> **For Claude Code:** Before executing any phase, read `ACME_BACKEND_PLAN_A_SHOPIFY_SANITY_SETUP.md` to understand what the external systems look like. This plan modifies the existing Next.js codebase located at `acme-lamp-sign/`.
>
> **Every phase ends with a STOP.** Provide a full report of what was built. Ask: **"Continue with the next phase?"** — only proceed on explicit "Yes, Proceed."
>
> **Reference:** `ACME_LAMP_SIGN_PROCESS_FLOW.md` for the complete user journey. `AcmeLampSign_Frontend_Implementation_Prompt.md` for the existing component architecture.

---

## Memory Anchors (Commit Before Starting)

```
PROJECT:            Acme Lamp & Sign — Next.js 16.2.6 (App Router, Turbopack)
FRAMEWORK:          Next.js 16 · Tailwind CSS v4 · Zustand v5 · Framer Motion v12
SHOPIFY_API:        Storefront API 2024-04 (GraphQL) + Admin API (REST for webhooks)
SANITY_API:         @sanity/client v6 · GROQ query language
REPLACE_FILES:      lib/mockData.ts → Shopify queries | store/authStore.ts → Customer API
PRESERVE:           All existing components, design tokens, and UI — data sources only change
STRATEGY:           Fetch at build time (generateStaticParams) + ISR revalidation + client mutations
CRATE:              Migrate from Zustand localStorage → Shopify Cart API (cart ID in localStorage)
AUTH:               Migrate from mock Zustand → Shopify Customer Account API (access tokens)
PHASE_GATE:         STOP after each phase. Report. Ask "Continue with the next phase?" — wait for "Yes, Proceed."
```

---

## Phase B0 — Dependencies & Environment

### Objective
Install all required packages for Shopify and Sanity integration, set up the API client modules, and configure environment variables.

### B0.1 — Install Dependencies

```bash
cd acme-lamp-sign
npm install \
  @shopify/storefront-api-client \
  @sanity/client \
  next-sanity \
  groq \
  @portabletext/react
```

| Package | Purpose |
|---|---|
| `@shopify/storefront-api-client` | Official typed Shopify Storefront API GraphQL client |
| `@sanity/client` | Sanity data fetching (GROQ queries) |
| `next-sanity` | Next.js helpers: `SanityImage`, ISR integration, live preview |
| `groq` | GROQ query string helpers and type inference |
| `@portabletext/react` | Renders Sanity Portable Text (rich text body) in React |

### B0.2 — Environment Variables

Create `acme-lamp-sign/.env.local` with all real values from Plan A:

```bash
# Shopify Storefront API (public — safe for client-side)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=acme-lamp-sign.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_storefront_public_token

# Shopify Admin API (server-side only — NEVER expose to client)
SHOPIFY_ADMIN_TOKEN=your_admin_token
SHOPIFY_WEBHOOK_SECRET=your_webhook_signing_secret

# Sanity (public project ID + dataset are safe; read token is server-side)
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_READ_TOKEN=your_sanity_read_token
```

> **Security rule:** Any variable without `NEXT_PUBLIC_` prefix is server-side only. Never reference `SHOPIFY_ADMIN_TOKEN` or `SANITY_READ_TOKEN` inside a client component or `'use client'` file.

### B0.3 — Shopify Client Module

Create `lib/shopify/client.ts`:

```typescript
import { createStorefrontApiClient } from '@shopify/storefront-api-client'

export const shopifyClient = createStorefrontApiClient({
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!,
  apiVersion: '2024-04',
  publicAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!,
})
```

### B0.4 — Sanity Client Module

Create `lib/sanity/client.ts`:

```typescript
import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION!,
  useCdn:     true,   // CDN for public reads; set false for preview/mutations
})
```

Create `lib/sanity/image.ts`:

```typescript
import createImageUrlBuilder from '@sanity/image-url'
import { sanityClient } from './client'

const imageBuilder = createImageUrlBuilder(sanityClient)

export const urlFor = (source: any) => imageBuilder.image(source)
```

### B0.5 — TypeScript Types Update

Update `lib/types.ts` to add Shopify/Sanity-sourced types alongside the existing `Product` interface:

```typescript
// Shopify Cart types
export interface ShopifyCartLine {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    selectedOptions: { name: string; value: string }[]
    product: { id: string; title: string; handle: string }
  }
  cost: { totalAmount: { amount: string; currencyCode: string } }
}

export interface ShopifyCart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: {
    subtotalAmount: { amount: string; currencyCode: string }
    totalAmount: { amount: string; currencyCode: string }
  }
  lines: { edges: { node: ShopifyCartLine }[] }
}

// Sanity types
export interface JournalPost {
  _id: string
  title: string
  slug: { current: string }
  publishDate: string
  eyebrow: string
  excerpt: string
  body: any[]  // Portable Text
  coverImage: any  // Sanity image asset
  author: string
  readTime: number
  tags: string[]
}

export interface Testimonial {
  _id: string
  quote: string
  attribution: string
  location?: string
}

export interface TimelineEntry {
  _id: string
  year: number
  title: string
  description: string
  image?: any
  imageCaption?: string
}
```

### B0.6 — Verify Setup

```bash
npm run dev
```

Confirm: dev server starts, no missing environment variable errors in terminal.

---

### PHASE B0 STOP ✋

> **Complete ALL steps above, then report:**
> 1. All 5 packages installed — list versions
> 2. `.env.local` populated with real values
> 3. `lib/shopify/client.ts` created
> 4. `lib/sanity/client.ts` + `lib/sanity/image.ts` created
> 5. `lib/types.ts` updated with Shopify + Sanity types
> 6. `npm run dev` starts without errors
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase B1 — Shopify Product Queries (Replace mockData)

### Objective
Replace `lib/mockData.ts` as the data source for all product-related pages. The catalog, product detail, home page featured products, and related products all currently read from mock data — they will now fetch from Shopify via the Storefront API.

### B1.1 — GraphQL Fragments

Create `lib/shopify/fragments.ts`:

```typescript
export const PRODUCT_CARD_FRAGMENT = `#graphql
  fragment ProductCard on Product {
    id
    title
    handle
    featuredImage { url altText }
    priceRange { minVariantPrice { amount currencyCode } }
    tags
    metafields(identifiers: [
      { namespace: "acme", key: "sku" }
      { namespace: "acme", key: "patent" }
    ]) { namespace key value }
    variants(first: 1) {
      edges { node { id availableForSale } }
    }
  }
`

export const PRODUCT_DETAIL_FRAGMENT = `#graphql
  fragment ProductDetail on Product {
    id
    title
    handle
    description
    tags
    images(first: 4) { edges { node { url altText } } }
    priceRange { minVariantPrice { amount currencyCode } }
    variants(first: 20) {
      edges {
        node {
          id
          title
          availableForSale
          selectedOptions { name value }
          price { amount currencyCode }
        }
      }
    }
    metafields(identifiers: [
      { namespace: "acme", key: "sku" }
      { namespace: "acme", key: "patent" }
      { namespace: "acme", key: "bench_tester" }
      { namespace: "acme", key: "bench_test_date" }
      { namespace: "acme", key: "workshop" }
      { namespace: "acme", key: "edition" }
      { namespace: "acme", key: "fits" }
      { namespace: "acme", key: "net_weight" }
      { namespace: "acme", key: "full_description" }
      { namespace: "acme", key: "burner_size" }
    ]) { namespace key value }
  }
`
```

### B1.2 — Product Query Functions

Create `lib/shopify/products.ts`:

```typescript
import { shopifyClient } from './client'
import { PRODUCT_CARD_FRAGMENT, PRODUCT_DETAIL_FRAGMENT } from './fragments'

// All products (catalog page)
export async function getAllProducts() {
  const query = `#graphql
    ${PRODUCT_CARD_FRAGMENT}
    query AllProducts {
      products(first: 50, sortKey: TITLE) {
        edges { node { ...ProductCard } }
      }
    }
  `
  const { data } = await shopifyClient.request(query)
  return data.products.edges.map((e: any) => e.node)
}

// Products by collection handle (category filter)
export async function getProductsByCollection(handle: string) {
  const query = `#graphql
    ${PRODUCT_CARD_FRAGMENT}
    query CollectionProducts($handle: String!) {
      collection(handle: $handle) {
        products(first: 50) {
          edges { node { ...ProductCard } }
        }
      }
    }
  `
  const { data } = await shopifyClient.request(query, { variables: { handle } })
  return data.collection?.products.edges.map((e: any) => e.node) ?? []
}

// Single product by handle (PDP)
export async function getProductByHandle(handle: string) {
  const query = `#graphql
    ${PRODUCT_DETAIL_FRAGMENT}
    query ProductByHandle($handle: String!) {
      product(handle: $handle) { ...ProductDetail }
    }
  `
  const { data } = await shopifyClient.request(query, { variables: { handle } })
  return data.product
}

// Featured products (homepage PickedOffTheBench)
export async function getFeaturedProducts() {
  const query = `#graphql
    ${PRODUCT_CARD_FRAGMENT}
    query FeaturedProducts {
      products(first: 3, query: "tag:featured") {
        edges { node { ...ProductCard } }
      }
    }
  `
  const { data } = await shopifyClient.request(query)
  return data.products.edges.map((e: any) => e.node)
}

// All product handles (generateStaticParams)
export async function getAllProductHandles() {
  const query = `#graphql
    query AllHandles {
      products(first: 250) {
        edges { node { handle } }
      }
    }
  `
  const { data } = await shopifyClient.request(query)
  return data.products.edges.map((e: any) => ({ slug: e.node.handle }))
}
```

### B1.3 — Data Shape Adapter

Create `lib/shopify/adapters.ts` to transform Shopify's GraphQL shape into the existing `Product` interface so all existing components continue to work without modification:

```typescript
import { Product } from '@/lib/types'

function getMetafield(metafields: any[], key: string): string {
  return metafields?.find((m: any) => m?.key === key)?.value ?? ''
}

export function shopifyProductToProduct(shopifyProduct: any): Product {
  const meta = shopifyProduct.metafields ?? []
  const variants = shopifyProduct.variants?.edges?.map((e: any) => e.node) ?? []
  const finishOptions = variants
    .flatMap((v: any) => v.selectedOptions.filter((o: any) => o.name === 'Finish').map((o: any) => o.value))
  const uniqueFinishes = [...new Set(finishOptions)] as string[]

  return {
    id:               shopifyProduct.id,
    slug:             shopifyProduct.handle,
    sku:              getMetafield(meta, 'sku'),
    patent:           getMetafield(meta, 'patent'),
    name:             shopifyProduct.title,
    shortDescription: shopifyProduct.description,
    fullDescription:  getMetafield(meta, 'full_description'),
    price:            parseFloat(shopifyProduct.priceRange?.minVariantPrice?.amount ?? '0'),
    category:         shopifyProductToCategory(shopifyProduct.tags),
    burnerSize:       (getMetafield(meta, 'burner_size') as any) || null,
    material:         shopifyProduct.tags?.find((t: string) => ['brass','nickel','glass','porcelain','iron'].includes(t)) ?? '',
    finish:           uniqueFinishes,
    fits:             getMetafield(meta, 'fits'),
    benchTesterName:  getMetafield(meta, 'bench_tester'),
    benchTestDate:    getMetafield(meta, 'bench_test_date'),
    workshop:         getMetafield(meta, 'workshop'),
    edition:          getMetafield(meta, 'edition'),
    netWeight:        getMetafield(meta, 'net_weight'),
    images:           shopifyProduct.images?.edges?.map((e: any) => e.node.url) ?? [],
    inStock:          variants.some((v: any) => v.availableForSale),
    featured:         shopifyProduct.tags?.includes('featured') ?? false,
    collection:       shopifyProduct.tags?.find((t: string) => t.startsWith('collection:'))?.replace('collection:', '') ?? '',
  }
}

function shopifyProductToCategory(tags: string[]): Product['category'] {
  if (tags?.includes('lighting'))       return 'lighting'
  if (tags?.includes('glass-chimneys')) return 'glass-chimneys'
  if (tags?.includes('hardware'))       return 'hardware'
  if (tags?.includes('signs'))          return 'signs'
  return 'lighting'
}
```

> **Key design decision:** The adapter preserves the existing `Product` interface shape exactly. Zero changes needed to any component that already reads from `mockProducts`. Only the data source changes.

### B1.4 — Update generateStaticParams

In `app/catalog/[slug]/page.tsx`, replace the mock-data-based `generateStaticParams`:

```typescript
import { getAllProductHandles } from '@/lib/shopify/products'

export async function generateStaticParams() {
  return await getAllProductHandles()
}
```

### B1.5 — Update Catalog Page

In `app/catalog/page.tsx`, replace `import { mockProducts } from '@/lib/mockData'` with a server-side fetch:

```typescript
import { getAllProducts } from '@/lib/shopify/products'
import { shopifyProductToProduct } from '@/lib/shopify/adapters'

// In the page component:
const shopifyProducts = await getAllProducts()
const products = shopifyProducts.map(shopifyProductToProduct)
```

Pass `products` down to `<ProductGrid products={products} />` instead of importing mockProducts.

### B1.6 — Update Product Detail Page

In `app/catalog/[slug]/page.tsx`:

```typescript
import { getProductByHandle } from '@/lib/shopify/products'
import { shopifyProductToProduct } from '@/lib/shopify/adapters'

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const shopifyProduct = await getProductByHandle(params.slug)
  if (!shopifyProduct) notFound()
  const product = shopifyProductToProduct(shopifyProduct)
  // rest of page unchanged
}
```

### B1.7 — Update Homepage Featured Products

In `components/home/PickedOffTheBench.tsx`, convert to an async server component:

```typescript
import { getFeaturedProducts } from '@/lib/shopify/products'
import { shopifyProductToProduct } from '@/lib/shopify/adapters'

export default async function PickedOffTheBench() {
  const shopifyFeatured = await getFeaturedProducts()
  const featured = shopifyFeatured.map(shopifyProductToProduct)
  // rest of component unchanged
}
```

### B1.8 — ISR Revalidation

Add `revalidate` exports to pages that fetch from Shopify, so they rebuild periodically (not just at deploy time):

```typescript
// In app/catalog/page.tsx
export const revalidate = 3600  // rebuild every 1 hour

// In app/catalog/[slug]/page.tsx
export const revalidate = 3600
```

### B1.9 — Remove mockData Dependency

Once all pages are confirmed working with Shopify data:
- Comment out (do NOT delete yet) the import lines in any remaining files that reference `mockData.ts`.
- Verify `npm run build` succeeds with 0 TypeScript errors.
- Remove `lib/mockData.ts` only after full end-to-end test in Phase B9.

---

### PHASE B1 STOP ✋

> **Complete ALL steps above, then report:**
> 1. `lib/shopify/fragments.ts` created
> 2. `lib/shopify/products.ts` created — list all 5 query functions
> 3. `lib/shopify/adapters.ts` created
> 4. `app/catalog/page.tsx` updated to use Shopify data
> 5. `app/catalog/[slug]/page.tsx` updated
> 6. `PickedOffTheBench.tsx` updated
> 7. `generateStaticParams` returns real product handles
> 8. Dev server: catalog renders with real Shopify products
> 9. Product detail page: all metafields render correctly in SpecTable and FitmentBox
> 10. `npm run build` — total static pages count (should be ≥ 50 product pages)
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase B2 — Shopify Cart API (Replace Zustand Crate)

### Objective
Replace the Zustand localStorage crate store with a real Shopify Cart. Cart state lives in Shopify's backend — the only thing stored locally is the `cartId`. This enables real checkout via Shopify's hosted checkout URL.

### B2.1 — Cart Mutation Functions

Create `lib/shopify/cart.ts`:

```typescript
import { shopifyClient } from './client'

const CART_FRAGMENT = `#graphql
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
    }
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              selectedOptions { name value }
              product { id title handle featuredImage { url altText } }
              price { amount currencyCode }
            }
          }
          cost { totalAmount { amount currencyCode } }
        }
      }
    }
  }
`

export async function createCart() {
  const { data } = await shopifyClient.request(`#graphql
    ${CART_FRAGMENT}
    mutation CreateCart { cartCreate { cart { ...CartFields } } }
  `)
  return data.cartCreate.cart
}

export async function getCart(cartId: string) {
  const { data } = await shopifyClient.request(`#graphql
    ${CART_FRAGMENT}
    query GetCart($id: ID!) { cart(id: $id) { ...CartFields } }
  `, { variables: { id: cartId } })
  return data.cart
}

export async function addToCart(cartId: string, variantId: string, quantity: number) {
  const { data } = await shopifyClient.request(`#graphql
    ${CART_FRAGMENT}
    mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartFields } }
    }
  `, { variables: { cartId, lines: [{ merchandiseId: variantId, quantity }] } })
  return data.cartLinesAdd.cart
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number) {
  const { data } = await shopifyClient.request(`#graphql
    ${CART_FRAGMENT}
    mutation UpdateLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartFields } }
    }
  `, { variables: { cartId, lines: [{ id: lineId, quantity }] } })
  return data.cartLinesUpdate.cart
}

export async function removeFromCart(cartId: string, lineIds: string[]) {
  const { data } = await shopifyClient.request(`#graphql
    ${CART_FRAGMENT}
    mutation RemoveLines($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartFields } }
    }
  `, { variables: { cartId, lineIds } })
  return data.cartLinesRemove.cart
}
```

### B2.2 — Rewrite crateStore

Rewrite `store/crateStore.ts` to use Shopify Cart API instead of local mock state:

```typescript
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ShopifyCart } from '@/lib/types'
import { createCart, getCart, addToCart, updateCartLine, removeFromCart } from '@/lib/shopify/cart'

interface CrateStore {
  cartId: string | null
  cart: ShopifyCart | null
  isOpen: boolean
  isLoading: boolean
  openCrate: () => void
  closeCrate: () => void
  initCart: () => Promise<void>
  addItem: (variantId: string, quantity?: number) => Promise<void>
  updateItem: (lineId: string, quantity: number) => Promise<void>
  removeItem: (lineId: string) => Promise<void>
  itemCount: () => number
  subtotal: () => number
}

export const useCrateStore = create<CrateStore>()(
  persist(
    (set, get) => ({
      cartId: null,
      cart: null,
      isOpen: false,
      isLoading: false,

      openCrate:  () => set({ isOpen: true }),
      closeCrate: () => set({ isOpen: false }),

      itemCount: () => get().cart?.totalQuantity ?? 0,
      subtotal:  () => parseFloat(get().cart?.cost?.subtotalAmount?.amount ?? '0'),

      initCart: async () => {
        const { cartId } = get()
        if (cartId) {
          const cart = await getCart(cartId)
          if (cart) { set({ cart }); return }
        }
        const newCart = await createCart()
        set({ cartId: newCart.id, cart: newCart })
      },

      addItem: async (variantId, quantity = 1) => {
        set({ isLoading: true })
        const { cartId } = get()
        const id = cartId ?? (await createCart()).id
        const cart = await addToCart(id, variantId, quantity)
        set({ cartId: id, cart, isLoading: false, isOpen: true })
      },

      updateItem: async (lineId, quantity) => {
        set({ isLoading: true })
        const cart = await updateCartLine(get().cartId!, lineId, quantity)
        set({ cart, isLoading: false })
      },

      removeItem: async (lineId) => {
        set({ isLoading: true })
        const cart = await removeFromCart(get().cartId!, [lineId])
        set({ cart, isLoading: false })
      },
    }),
    { name: 'acme-crate', partialize: (s) => ({ cartId: s.cartId }) }
  )
)
```

> **Key change:** `partialize` persists only `cartId` (not the full cart) — the cart data is always fetched fresh from Shopify, preventing stale state.

### B2.3 — Update CrateDrawer

In `components/crate/CrateDrawer.tsx`, update to use the new Shopify cart shape:
- Replace `items.map(item => ...)` with `cart?.lines.edges.map(({ node }) => ...)`
- Replace `item.product.name` with `node.merchandise.product.title`
- Replace `item.quantity` with `node.quantity`
- Replace `item.product.price * item.quantity` with `parseFloat(node.cost.totalAmount.amount)`
- Replace `addItem(product, finish, burner)` calls with `addItem(variantId)`
- The `checkoutUrl` from the cart (`cart.checkoutUrl`) becomes the "Proceed to Checkout" button href — it redirects to Shopify's hosted checkout.

### B2.4 — Update ProductInfo Add-to-Crate Button

In `components/product/ProductInfo.tsx`:
- The selected variant's ID (`selectedVariantId`) is now passed to `addItem(selectedVariantId)`.
- Get the variant ID from `shopifyProduct.variants` based on the selected `selectedFinish` and `selectedBurner` option combination.
- Show a loading spinner on the button while `isLoading` is true.

### B2.5 — Update Checkout Flow

In `app/checkout/page.tsx`:
- The "Proceed to checkout" step now redirects to `cart.checkoutUrl` (Shopify hosted checkout).
- The existing 3-step accordion form (`ContactShippingForm`, `PaymentForm`, order review) becomes a **pre-checkout step** for Acme's own shipping notes and saved address — then the user is sent to Shopify checkout for payment.
- Alternative: remove the local payment form entirely and use Shopify checkout for everything.

> **Recommended approach:** Keep Step 1 (contact & shipping notes) as a local form so Acme can store delivery notes (handled via Shopify Order Notes API). For payment, redirect to `cart.checkoutUrl`.

### B2.6 — Initialize Cart on App Load

In `components/shared/ShellClient.tsx`, add cart initialization:

```typescript
useEffect(() => {
  initCart()
}, [initCart])
```

This ensures a cart is created (or restored from `cartId`) on first load.

---

### PHASE B2 STOP ✋

> **Complete ALL steps above, then report:**
> 1. `lib/shopify/cart.ts` created — all 5 mutation functions
> 2. `store/crateStore.ts` rewritten to Shopify Cart API
> 3. `CrateDrawer.tsx` updated to use new cart shape
> 4. `ProductInfo.tsx` add-to-crate passes real variant ID
> 5. Cart initializes on app load (test: open app, check Shopify Admin → `Orders` → `Carts`)
> 6. Add a product to crate — verify it appears in Shopify admin as a cart
> 7. `checkoutUrl` redirects to Shopify hosted checkout
> 8. Item count badge updates correctly
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase B3 — Shopify Customer Accounts (Replace Mock Auth)

### Objective
Replace the Zustand mock auth store with real Shopify Customer Account API authentication. Users can sign in, create accounts, and have their session persisted via a real Shopify customer access token.

### B3.1 — Customer Auth Functions

Create `lib/shopify/customer.ts`:

```typescript
import { shopifyClient } from './client'

export async function customerSignIn(email: string, password: string) {
  const { data, errors } = await shopifyClient.request(`#graphql
    mutation SignIn($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code message field }
      }
    }
  `, { variables: { input: { email, password } } })
  if (errors || data.customerAccessTokenCreate.customerUserErrors.length > 0) {
    return { success: false, error: data.customerAccessTokenCreate.customerUserErrors[0]?.message ?? 'Sign in failed' }
  }
  return { success: true, token: data.customerAccessTokenCreate.customerAccessToken }
}

export async function customerSignUp(firstName: string, lastName: string, email: string, password: string) {
  const { data, errors } = await shopifyClient.request(`#graphql
    mutation CreateCustomer($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id email firstName lastName }
        customerUserErrors { code message field }
      }
    }
  `, { variables: { input: { firstName, lastName, email, password } } })
  if (errors || data.customerCreate.customerUserErrors.length > 0) {
    return { success: false, error: data.customerCreate.customerUserErrors[0]?.message ?? 'Account creation failed' }
  }
  return { success: true, customer: data.customerCreate.customer }
}

export async function getCustomer(accessToken: string) {
  const { data } = await shopifyClient.request(`#graphql
    query GetCustomer($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id firstName lastName email phone
        defaultAddress { id address1 address2 city province zip country phone }
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id name processedAt financialStatus fulfillmentStatus
              totalPrice { amount currencyCode }
              lineItems(first: 10) {
                edges {
                  node {
                    title quantity
                    variant { sku price { amount } product { handle } }
                  }
                }
              }
            }
          }
        }
        addresses(first: 5) {
          edges {
            node { id address1 address2 city province zip country phone firstName lastName }
          }
        }
      }
    }
  `, { variables: { customerAccessToken: accessToken } })
  return data.customer
}

export async function signOut(accessToken: string) {
  await shopifyClient.request(`#graphql
    mutation SignOut($customerAccessToken: String!) {
      customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
        deletedAccessToken
        userErrors { field message }
      }
    }
  `, { variables: { customerAccessToken: accessToken } })
}

export async function updateCustomerAddress(accessToken: string, addressId: string, address: any) {
  const { data } = await shopifyClient.request(`#graphql
    mutation UpdateAddress($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
      customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
        customerAddress { id }
        customerUserErrors { message }
      }
    }
  `, { variables: { customerAccessToken: accessToken, id: addressId, address } })
  return data.customerAddressUpdate
}
```

### B3.2 — Rewrite authStore

Rewrite `store/authStore.ts` to use real Shopify tokens:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { customerSignIn, customerSignUp, getCustomer, signOut } from '@/lib/shopify/customer'

interface AuthState {
  accessToken: string | null
  expiresAt: string | null
  customer: any | null  // Shopify customer object
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (firstName: string, lastName: string, email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  refreshCustomer: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      expiresAt: null,
      customer: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      signIn: async (email, password) => {
        set({ isLoading: true, error: null })
        const result = await customerSignIn(email, password)
        if (!result.success) { set({ isLoading: false, error: result.error }); return false }
        const customer = await getCustomer(result.token.accessToken)
        set({
          accessToken: result.token.accessToken,
          expiresAt: result.token.expiresAt,
          customer,
          isAuthenticated: true,
          isLoading: false,
        })
        return true
      },

      signUp: async (firstName, lastName, email, password) => {
        set({ isLoading: true, error: null })
        const result = await customerSignUp(firstName, lastName, email, password)
        if (!result.success) { set({ isLoading: false, error: result.error }); return false }
        // Auto sign in after account creation
        return get().signIn(email, password)
      },

      signOut: async () => {
        const { accessToken } = get()
        if (accessToken) await signOut(accessToken)
        set({ accessToken: null, expiresAt: null, customer: null, isAuthenticated: false })
      },

      refreshCustomer: async () => {
        const { accessToken } = get()
        if (!accessToken) return
        const customer = await getCustomer(accessToken)
        set({ customer })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'acme-auth',
      partialize: (s) => ({ accessToken: s.accessToken, expiresAt: s.expiresAt }),
    }
  )
)
```

### B3.3 — Update AccountDropdown

In `components/nav/AccountDropdown.tsx`:
- Replace `signIn(email)` mock call with `await signIn(email, password)` from the real store.
- Show loading state on the Sign In button while `isLoading` is true.
- Show `error` state below the button if `error` is not null.
- The `userName` becomes `customer?.firstName + ' ' + customer?.lastName`.
- The `userEmail` becomes `customer?.email`.

### B3.4 — Update Account Page

In `app/account/page.tsx`:
- Orders come from `customer.orders.edges.map(e => e.node)` — no more DEMO_ORDERS.
- Addresses come from `customer.addresses.edges.map(e => e.node)` — no more DEMO_ADDRESS.
- Map Shopify's `fulfillmentStatus` to the frontend's status labels (from Plan A A7.3 mapping table).
- The "Edit address" save action calls `updateCustomerAddress(accessToken, addressId, newAddress)`.

### B3.5 — Token Expiry Check

Add an effect in `ShellClient.tsx` (or a hook) that checks `expiresAt` on mount and signs the user out if the token has expired:

```typescript
useEffect(() => {
  if (expiresAt && new Date(expiresAt) < new Date()) {
    signOut()
  }
}, [expiresAt, signOut])
```

---

### PHASE B3 STOP ✋

> **Complete ALL steps above, then report:**
> 1. `lib/shopify/customer.ts` created — list all 5 functions
> 2. `store/authStore.ts` rewritten with real Shopify tokens
> 3. `AccountDropdown.tsx` uses real sign-in with loading + error states
> 4. `app/account/page.tsx` reads orders + addresses from `customer` object
> 5. End-to-end test: create new account → sign in → view orders on account page → sign out
> 6. Token expiry check in place
> 7. `npm run build` — zero TypeScript errors
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase B4 — Sanity: Journal Page & Editorial Content

### Objective
Replace all hardcoded editorial content (journal, testimonials, Our Story, Heritage timeline) with data fetched from Sanity via GROQ queries.

### B4.1 — Sanity GROQ Query Functions

Create `lib/sanity/queries.ts`:

```typescript
import { sanityClient } from './client'

export async function getJournalPosts() {
  return sanityClient.fetch(`
    *[_type == "journalPost"] | order(publishDate desc) {
      _id, title, slug, publishDate, eyebrow, excerpt,
      coverImage, author, readTime, tags
    }
  `)
}

export async function getJournalPostBySlug(slug: string) {
  return sanityClient.fetch(`
    *[_type == "journalPost" && slug.current == $slug][0] {
      _id, title, slug, publishDate, eyebrow, excerpt,
      body, coverImage, author, readTime, tags
    }
  `, { slug })
}

export async function getFeaturedTestimonials() {
  return sanityClient.fetch(`
    *[_type == "testimonial" && featured == true] | order(sortOrder asc) {
      _id, quote, attribution, location
    }
  `)
}

export async function getTimelineEntries() {
  return sanityClient.fetch(`
    *[_type == "timelineEntry"] | order(year asc) {
      _id, year, title, description, image, imageCaption
    }
  `)
}

export async function getOurStoryPage() {
  return sanityClient.fetch(`*[_type == "ourStoryPage"][0]`)
}

export async function getSiteSettings() {
  return sanityClient.fetch(`*[_type == "siteSettings"][0]`)
}
```

### B4.2 — Journal Page

Update `app/journal/page.tsx` to be an async server component:

```typescript
import { getJournalPosts } from '@/lib/sanity/queries'

export const revalidate = 3600

export default async function JournalPage() {
  const posts = await getJournalPosts()
  // map posts to existing card layout
}
```

Create `app/journal/[slug]/page.tsx` for individual post pages:

```typescript
import { getJournalPostBySlug, getJournalPosts } from '@/lib/sanity/queries'
import { PortableText } from '@portabletext/react'

export async function generateStaticParams() {
  const posts = await getJournalPosts()
  return posts.map((p: any) => ({ slug: p.slug.current }))
}

export default async function JournalPostPage({ params }: { params: { slug: string } }) {
  const post = await getJournalPostBySlug(params.slug)
  return (
    <article>
      {/* heading, eyebrow, author, date */}
      <PortableText value={post.body} />
    </article>
  )
}
```

### B4.3 — Testimonials (Homepage)

`TestimonialsBar.tsx` has been replaced by `TestimonialsCarousel.tsx`, which is a `'use client'` component (required for Framer Motion animations and pointer/drag interaction). It cannot be made async directly.

Instead, create a server wrapper that fetches from Sanity and passes the data as a prop:

**Step 1 — Update `TestimonialsCarousel.tsx` to accept a `testimonials` prop:**

Replace the hardcoded `testimonials` array at the top of `components/home/TestimonialsCarousel.tsx` with a prop:

```typescript
// Remove the hardcoded const testimonials = [...] array

interface TestimonialData {
  name:   string
  role:   string
  quote:  string
  accent: string
  light:  boolean
}

interface Props {
  testimonials: TestimonialData[]
}

export default function TestimonialsCarousel({ testimonials }: Props) {
  // rest of component unchanged — testimonials array now comes from props
}
```

**Step 2 — Create a server wrapper `TestimonialsSection.tsx`:**

Create `components/home/TestimonialsSection.tsx`:

```typescript
import { getFeaturedTestimonials } from '@/lib/sanity/queries'
import TestimonialsCarousel from './TestimonialsCarousel'

export default async function TestimonialsSection() {
  const raw = await getFeaturedTestimonials()

  // Map Sanity testimonial shape → TestimonialsCarousel prop shape
  const testimonials = raw.map((t: any, i: number) => ({
    name:   t.attribution?.split('/')[0]?.trim() ?? '',
    role:   t.attribution?.split('/')[1]?.trim() ?? '',
    quote:  t.quote,
    accent: ['#2E4A3F', '#9C7A2E', '#C29B47', '#4A4D50', '#233830'][i % 5],
    light:  i % 3 !== 2,
  }))

  return <TestimonialsCarousel testimonials={testimonials} />
}
```

**Step 3 — Update `app/page.tsx`:**

Replace `import TestimonialsCarousel` with `import TestimonialsSection`:

```typescript
import TestimonialsSection from '@/components/home/TestimonialsSection'

// In JSX:
<TestimonialsSection />
```

> **Why this pattern:** `TestimonialsCarousel` must stay a client component for Framer Motion and pointer events. The server wrapper (`TestimonialsSection`) handles the async Sanity fetch at build time, then passes clean data down. This is the standard Next.js App Router pattern for passing server-fetched data into client components.

### B4.4 — Heritage Timeline

Update `app/heritage/page.tsx` (or `components/heritage/Timeline.tsx`) to fetch from Sanity:

```typescript
import { getTimelineEntries } from '@/lib/sanity/queries'

// In the page or component:
const entries = await getTimelineEntries()
// replace hardcoded timeline data with `entries`
```

### B4.5 — Our Story Page

Update `app/our-story/page.tsx`:

```typescript
import { getOurStoryPage } from '@/lib/sanity/queries'

export default async function OurStoryPage() {
  const content = await getOurStoryPage()
  // replace hardcoded strings with content.heroHeadline, content.missionQuote, etc.
}
```

### B4.6 — Site Settings (Marquee + Newsletter)

Update `components/home/ProvenanceSection.tsx` and `components/shared/Footer.tsx`:

```typescript
import { getSiteSettings } from '@/lib/sanity/queries'

// In each component:
const settings = await getSiteSettings()
// Replace hardcoded marquee text, newsletter copy, catalog eyebrow
```

### B4.7 — Sanity Image Rendering

For any component rendering Sanity images (journal cover, timeline, etc.), use the `urlFor` helper:

```typescript
import { urlFor } from '@/lib/sanity/image'

<img src={urlFor(post.coverImage).width(800).url()} alt={post.title} />
```

Or use `next-sanity`'s `SanityImage` component for full Next.js `<Image>` optimization.

---

### PHASE B4 STOP ✋

> **Complete ALL steps above, then report:**
> 1. `lib/sanity/queries.ts` created — list all 6 query functions
> 2. `app/journal/page.tsx` renders posts from Sanity
> 3. `app/journal/[slug]/page.tsx` renders rich text via PortableText
> 4. `TestimonialsCarousel.tsx` accepts `testimonials` prop (hardcoded array removed)
 4a. `TestimonialsSection.tsx` server wrapper created — fetches from Sanity, passes to carousel
 4b. `app/page.tsx` updated to use `<TestimonialsSection />`
> 5. Heritage timeline fetches from Sanity
> 6. Our Story page fetches from Sanity
> 7. Site settings drive marquee text and newsletter copy
> 8. All Sanity images render correctly (verify in browser)
> 9. `npm run build` — static pages count includes journal post pages
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase B5 — Order Tracking Integration

### Objective
Replace the demo-data-based order tracking with real Shopify order lookups. The `/track-order` page and account page order history both use live data.

### B5.1 — Order Lookup API Route

Create `app/api/orders/track/route.ts` (server-side Admin API call — keeps admin token off client):

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'No reference provided' }, { status: 400 })

  const response = await fetch(
    `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/admin/api/2024-04/orders.json?name=${encodeURIComponent(ref)}&fields=id,name,financial_status,fulfillment_status,created_at,line_items,shipping_address,tracking_numbers`,
    {
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN!,
        'Content-Type': 'application/json',
      },
    }
  )

  const data = await response.json()
  if (!data.orders || data.orders.length === 0) {
    return NextResponse.json({ found: false })
  }

  return NextResponse.json({ found: true, order: data.orders[0] })
}
```

### B5.2 — Update Track Order Page

In `app/track-order/page.tsx`, replace the demo-data lookup with a call to the API route above:

```typescript
const response = await fetch(`/api/orders/track?ref=${encodeURIComponent(ref)}`)
const { found, order } = await response.json()
```

Map `order.fulfillment_status` to the timeline stages using the Plan A A7.3 mapping table.

### B5.3 — Tracking Timeline States

The tracking timeline stages (Order Received → Packed → Dispatched → In Transit → Delivered) map to Shopify fulfillment states:

```typescript
function getTrackingStages(fulfillmentStatus: string) {
  const stages = ['Order Received', 'Packed at Adelaide', 'Dispatched', 'In Transit', 'Delivered']
  const completedCount = {
    'unfulfilled':  1,
    'partial':      2,
    'fulfilled':    3,
    'in_transit':   4,
    'delivered':    5,
  }[fulfillmentStatus] ?? 1

  return stages.map((label, i) => ({
    label,
    state: i < completedCount ? 'done' : i === completedCount ? 'current' : 'upcoming',
  }))
}
```

---

### PHASE B5 STOP ✋

> **Complete ALL steps above, then report:**
> 1. `app/api/orders/track/route.ts` created
> 2. Track order page fetches from API route (Admin token never sent to client)
> 3. Valid order reference returns correct tracking timeline stages
> 4. Invalid reference shows "not found" error state
> 5. Test with a real Shopify test order
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase B6 — Shopify Webhooks Handler

### Objective
Handle incoming Shopify webhooks for order events and inventory changes, used to trigger ISR revalidation and (optionally) send transactional data to Sanity or a notification system.

### B6.1 — Webhook Verification Utility

Create `lib/shopify/webhooks.ts`:

```typescript
import crypto from 'crypto'

export function verifyShopifyWebhook(body: string, signature: string): boolean {
  const hmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET!)
    .update(body, 'utf8')
    .digest('base64')
  return hmac === signature
}
```

### B6.2 — Webhook Route Handlers

Create `app/api/webhooks/order-fulfilled/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyShopifyWebhook } from '@/lib/shopify/webhooks'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-shopify-hmac-sha256') ?? ''

  if (!verifyShopifyWebhook(body, signature)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Trigger revalidation of order-related pages
  revalidatePath('/account')
  revalidatePath('/track-order')

  return NextResponse.json({ ok: true })
}
```

Create identical handlers for:
- `app/api/webhooks/order-created/route.ts`
- `app/api/webhooks/order-cancelled/route.ts`
- `app/api/webhooks/product-updated/route.ts` → also `revalidatePath('/catalog')` and `revalidatePath('/catalog/[slug]')`
- `app/api/webhooks/inventory-updated/route.ts` → `revalidatePath('/catalog')`

### B6.3 — Update Shopify Webhook URLs

Go back to Shopify Admin → Webhooks (Plan A Phase A7.2) and update each webhook URL to your production domain if it was previously set to `localhost`.

---

### PHASE B6 STOP ✋

> **Complete ALL steps above, then report:**
> 1. `lib/shopify/webhooks.ts` created with HMAC verification
> 2. All 5 webhook route handlers created
> 3. Webhook signature verification tested (send a test webhook from Shopify Admin)
> 4. `revalidatePath` calls confirm pages rebuild on webhook trigger
> 5. Production webhook URLs updated in Shopify Admin
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase B7 — Saved Address via Shopify Customer API

### Objective
Replace the mock `savedAddress` in the auth store with a real Shopify customer default address. The checkout pre-fill and account page address editing both read/write to Shopify.

### B7.1 — Address Adapter

In `lib/shopify/adapters.ts`, add an address shape converter:

```typescript
export function shopifyAddressToSaved(addr: any) {
  return {
    id:       addr.id,
    fullName: `${addr.firstName ?? ''} ${addr.lastName ?? ''}`.trim(),
    email:    '',  // Shopify addresses don't store email — pull from customer
    phone:    addr.phone ?? '',
    street:   addr.address1 ?? '',
    apt:      addr.address2 ?? '',
    city:     addr.city ?? '',
    state:    addr.province ?? '',
    zip:      addr.zip ?? '',
    country:  addr.country ?? '',
  }
}
```

### B7.2 — Update ContactShippingForm Pre-fill

In `components/checkout/ContactShippingForm.tsx`:
- Replace `savedAddress` from the old auth store with `customer?.defaultAddress` from the new store.
- Convert using `shopifyAddressToSaved(customer.defaultAddress)`.

### B7.3 — Update Account Page Address Save

In `app/account/page.tsx`, the "Save changes" button in the address edit form now calls:

```typescript
await updateCustomerAddress(accessToken, address.id, {
  firstName: editData.fullName.split(' ')[0],
  lastName:  editData.fullName.split(' ').slice(1).join(' '),
  address1:  editData.street,
  address2:  editData.apt,
  city:      editData.city,
  province:  editData.state,
  zip:       editData.zip,
  country:   editData.country,
  phone:     editData.phone,
})
await refreshCustomer()
```

---

### PHASE B7 STOP ✋

> **Complete ALL steps above, then report:**
> 1. Address adapter created
> 2. Checkout form pre-fills from real Shopify default address
> 3. Account page "Save changes" writes to Shopify customer address
> 4. `refreshCustomer()` called after save — address updates immediately in UI
> 5. End-to-end test: edit address → save → re-open checkout → address pre-filled with new values
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase B8 — Search: Replace Mock with Shopify Predictive Search

### Objective
Replace the mock-data-based search overlay with Shopify's Predictive Search API for real-time product search results.

### B8.1 — Predictive Search Query

Create `lib/shopify/search.ts`:

```typescript
import { shopifyClient } from './client'

export async function predictiveSearch(query: string) {
  if (!query.trim()) return { products: [], collections: [] }

  const { data } = await shopifyClient.request(`#graphql
    query PredictiveSearch($query: String!) {
      predictiveSearch(query: $query, types: [PRODUCT]) {
        products {
          id title handle
          priceRange { minVariantPrice { amount currencyCode } }
          featuredImage { url altText }
          metafields(identifiers: [{ namespace: "acme", key: "sku" }]) {
            namespace key value
          }
        }
      }
    }
  `, { variables: { query } })

  return data.predictiveSearch
}
```

### B8.2 — Update SearchOverlay

In `components/shared/SearchOverlay.tsx`:
- Replace the `useMemo` filter over `mockProducts` with a debounced call to `predictiveSearch(query)`.
- Debounce delay: 200ms (keep existing 150ms or slightly higher for API calls).
- Show a loading skeleton while the fetch is in-flight.
- Map results using `shopifyProductToProduct(result)`.

---

### PHASE B8 STOP ✋

> **Complete ALL steps above, then report:**
> 1. `lib/shopify/search.ts` created
> 2. `SearchOverlay.tsx` uses Shopify Predictive Search
> 3. Search returns real products (test with product title, SKU, material)
> 4. Debouncing works — no request fired per keystroke
> 5. Empty query shows featured products (use `getFeaturedProducts()` as fallback)
>
> **Ask: "Continue with the next phase?"** — wait for "Yes, Proceed."

---

## Phase B9 — Final Migration, Cleanup & Build Verification

### Objective
Remove all mock data dependencies, run a full end-to-end test of every user flow from the process flow document, and produce a clean production build.

### B9.1 — Remove Mock Data Files

After confirming all pages work with real data:

```bash
# Verify nothing imports mockData anymore
grep -r "mockData" acme-lamp-sign/app acme-lamp-sign/components acme-lamp-sign/lib
# If only lib/mockData.ts shows up (its own content), it's safe to delete
rm acme-lamp-sign/lib/mockData.ts
```

Also remove `lib/mockReviews.ts` (if reviews are now sourced from Shopify or Sanity).

### B9.2 — Process Flow End-to-End Test

Test every flow from `ACME_LAMP_SIGN_PROCESS_FLOW.md`:

| Flow | Test | Pass |
|---|---|---|
| Browse storefront | Homepage loads, featured products from Shopify | |
| Search overlay | Typing product name returns real Shopify results | |
| Catalog + filtering | All 50 products show, category pills filter correctly | |
| Product detail | Metafields populate SpecTable, FitmentBox, images load | |
| Add to crate | Shopify cart created, badge updates | |
| View full crate | Drawer shows real cart lines, prices correct | |
| Proceed to checkout | Redirects to Shopify checkout URL | |
| Save address toggle (signed out) | AuthModal opens, no page navigation | |
| Save address toggle (signed in) | Address saves to Shopify customer | |
| Sign in (real account) | Shopify token returned, customer data loads | |
| Create account | New Shopify customer created, auto sign in | |
| Account orders tab | Real orders from Shopify API | |
| Account addresses tab | Real address, editable, saves to Shopify | |
| Sign out | Token invalidated, redirect to home | |
| Order tracking | Real order reference returns tracking timeline | |
| Invalid tracking | "Not found" error state shown | |
| Journal page | Posts from Sanity, slug pages work | |
| Testimonials | Real Sanity testimonials on homepage | |
| Heritage timeline | Real Sanity entries, ordered by year | |
| Our Story page | Content from Sanity singleton | |

### B9.3 — Performance Audit

```bash
npm run build
```

Check the build output:
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All static pages generated (≥ 50 product pages + 1+ journal pages)
- [ ] No page exceeds 500kB first load JS
- [ ] No `console.error` calls in production build

### B9.4 — Environment Variable Audit

Before deploying to Vercel:
- [ ] `.env.local` is in `.gitignore` — never committed
- [ ] All `NEXT_PUBLIC_` variables set in Vercel project settings
- [ ] All server-only variables set in Vercel project settings
- [ ] `SHOPIFY_ADMIN_TOKEN` not referenced in any `'use client'` component (grep to verify)

### B9.5 — Vercel Deployment

```bash
vercel deploy --prod
```

Or connect the GitHub repository in Vercel dashboard for automatic deploys on push.

Post-deploy:
1. Update Shopify webhook URLs from `localhost` to production domain.
2. Update Sanity CORS origins to add the production domain.
3. Run the full process flow test against the production URL.

---

### PHASE B9 STOP ✋ — PLAN B COMPLETE ✋

> **Final Plan B report:**
> 1. All B9.2 end-to-end test rows: pass/fail
> 2. `npm run build` result: zero errors confirmed
> 3. Total static pages generated (list count by type)
> 4. `lib/mockData.ts` deleted: yes/no (only delete after all tests pass)
> 5. Production deployment URL
> 6. Webhook URLs updated for production
> 7. Sanity CORS updated for production
> 8. Any deviations from this plan and why
>
> **State: "Backend integration complete. Shopify + Sanity fully connected. Ready for client handover or Phase 10 (advanced features)."**

---

## Appendix B — What Changes, What Stays

| Component / File | Status | Notes |
|---|---|---|
| All UI components | **Unchanged** | Design, tokens, layout untouched |
| `lib/mockData.ts` | **Removed** | Replaced by Shopify Storefront API |
| `lib/shopify/` | **New** | `client.ts`, `products.ts`, `cart.ts`, `customer.ts`, `search.ts`, `adapters.ts`, `webhooks.ts`, `fragments.ts` |
| `lib/sanity/` | **New** | `client.ts`, `image.ts`, `queries.ts` |
| `store/crateStore.ts` | **Rewritten** | Shopify Cart API + cartId persistence |
| `store/authStore.ts` | **Rewritten** | Shopify Customer Account API |
| `app/catalog/page.tsx` | **Updated** | Fetches from Shopify |
| `app/catalog/[slug]/page.tsx` | **Updated** | Fetches from Shopify |
| `app/account/page.tsx` | **Updated** | Real orders + addresses |
| `app/track-order/page.tsx` | **Updated** | Real Admin API lookup |
| `app/journal/page.tsx` | **Updated** | GROQ from Sanity |
| `app/api/` | **New** | Webhook handlers + order track route |
| `components/home/PickedOffTheBench.tsx` | **Updated** | Shopify `tag:featured` query |
| `components/home/TestimonialsCarousel.tsx` | **Updated** | Receives `testimonials` prop instead of hardcoded array |
| `components/home/TestimonialsSection.tsx` | **New** | Server wrapper — fetches from Sanity, passes to carousel |
| `components/shared/SearchOverlay.tsx` | **Updated** | Shopify Predictive Search |

---

## Appendix C — Future Phases (Optional)

| Phase | Feature | Effort |
|---|---|---|
| B10 | Shopify Discount Codes at checkout | Low |
| B11 | Sanity live preview (editor sees changes in real-time) | Medium |
| B12 | Shopify Product Reviews app (Judge.me or Okendo) → replaces `mockReviews.ts` | Medium |
| B13 | Newsletter integration (Klaviyo or Mailchimp) → replaces mock subscribe | Medium |
| B14 | International pricing via Shopify Markets | High |
| B15 | Shopify Plus: custom checkout extensions | High |

---

*Acme Lamp & Sign Co. · Backend Implementation Plan B — Codebase Integration*  
*Shopify Storefront API + Sanity.io · Next.js 16 App Router · Spring Release 2026*  
*Companion document: `ACME_BACKEND_PLAN_A_SHOPIFY_SANITY_SETUP.md`*
