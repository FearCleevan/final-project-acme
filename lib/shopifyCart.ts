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
