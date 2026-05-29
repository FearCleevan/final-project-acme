/**
 * Shopify Storefront API — integration layer
 *
 * All functions return the same `Product` type used throughout the app,
 * so no component code needs to change when swapping from mockData.
 *
 * Usage (replaces mockData imports):
 *   import { getAllProducts, getProductByHandle } from '@/lib/shopify'
 */

import { Product } from './types'

// ─── Config ──────────────────────────────────────────────────────────────────

const DOMAIN   = process.env.SHOPIFY_STORE_DOMAIN!
const TOKEN    = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!
const API_VER  = '2025-01'
const ENDPOINT = `https://${DOMAIN}/api/${API_VER}/graphql.json`

// ─── Raw Shopify types ────────────────────────────────────────────────────────

interface ShopifyMetafield {
  key:       string
  namespace: string
  value:     string
}

interface ShopifyProduct {
  id:             string
  handle:         string
  title:          string
  description:    string
  availableForSale: boolean
  tags:           string[]
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string }
  }
  images: {
    edges: { node: { url: string; altText: string | null } }[]
  }
  variants: {
    edges: {
      node: {
        id:                string
        sku:               string
        quantityAvailable: number
        selectedOptions:   { name: string; value: string }[]
      }
    }[]
  }
  metafields:  (ShopifyMetafield | null)[]
  collections: { edges: { node: { handle: string } }[] }
}

interface ShopifyResponse<T> {
  data:   T
  errors?: { message: string }[]
}

// ─── Core fetch (matches Vercel guide pattern) ────────────────────────────────

export async function shopifyFetch<T>({
  query,
  variables,
}: {
  query:      string
  variables?: Record<string, unknown>
}): Promise<{ status: number; body: ShopifyResponse<T> }> {
  try {
    const result = await fetch(ENDPOINT, {
      method:  'POST',
      headers: {
        'Content-Type':                      'application/json',
        'X-Shopify-Storefront-Access-Token': TOKEN,
      },
      body: query && variables
        ? JSON.stringify({ query, variables })
        : JSON.stringify({ query }),
      next: { revalidate: 60, tags: ['products'] },
    })

    return {
      status: result.status,
      body:   await result.json(),
    }
  } catch (error) {
    console.error('Shopify fetch error:', error)
    return {
      status: 500,
      body:   { data: null as unknown as T, errors: [{ message: 'Error receiving data' }] },
    }
  }
}

/** Internal helper — unwraps the fetch result and throws on API errors. */
async function query<T>(q: string, variables?: Record<string, unknown>): Promise<T> {
  const { status, body } = await shopifyFetch<T>({ query: q, variables })
  if (status !== 200 || body.errors?.length) {
    throw new Error(body.errors?.[0]?.message ?? `Shopify API returned ${status}`)
  }
  return body.data
}

// ─── GraphQL fragments ────────────────────────────────────────────────────────

const PRODUCT_FRAGMENT = `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    availableForSale
    tags
    priceRange {
      minVariantPrice { amount currencyCode }
    }
    images(first: 5) {
      edges { node { url altText } }
    }
    variants(first: 10) {
      edges {
        node {
          id
          sku
          quantityAvailable
          selectedOptions { name value }
        }
      }
    }
    metafields(identifiers: [
      { namespace: "acme", key: "sku"              }
      { namespace: "acme", key: "patent"           }
      { namespace: "acme", key: "bench_tester"     }
      { namespace: "acme", key: "bench_test_date"  }
      { namespace: "acme", key: "workshop"         }
      { namespace: "acme", key: "edition"          }
      { namespace: "acme", key: "fits"             }
      { namespace: "acme", key: "net_weight"       }
      { namespace: "acme", key: "full_description" }
      { namespace: "acme", key: "burner_size"      }
      { namespace: "acme", key: "material"         }
      { namespace: "acme", key: "era"              }
      { namespace: "acme", key: "power_source"     }
      { namespace: "acme", key: "product_type"     }
      { namespace: "acme", key: "condition"        }
      { namespace: "acme", key: "style"            }
      { namespace: "acme", key: "colour"           }
      { namespace: "acme", key: "brand"            }
      { namespace: "acme", key: "vintage"          }
    ]) {
      key
      namespace
      value
    }
    collections(first: 5) {
      edges { node { handle } }
    }
  }
`

// ─── Adapter: Shopify product → app Product type ──────────────────────────────

const CATEGORY_MAP: Record<string, Product['category']> = {
  'oil-lamp-chimneys':      'oil-lamp-chimneys',
  'oil-lamp-shades':        'oil-lamp-shades',
  'oil-lamp-pressure-lamps': 'oil-lamp-pressure-lamps',
  'oil-lamp-books':         'oil-lamp-books',
  'oil-lamp-spreaders':     'oil-lamp-spreaders',
  'oil-lamp-wicks':         'oil-lamp-wicks',
}

const VALID_BURNER_SIZES = ['No. 1', 'No. 2', 'No. 3', 'Universal'] as const

function meta(fields: (ShopifyMetafield | null)[], key: string): string {
  return fields.find(f => f?.key === key)?.value ?? ''
}

function parseBurnerSize(val: string): Product['burnerSize'] {
  return (VALID_BURNER_SIZES as readonly string[]).includes(val)
    ? val as Product['burnerSize']
    : null
}

export function shopifyProductToProduct(p: ShopifyProduct): Product {
  const mf         = p.metafields
  const firstVar   = p.variants.edges[0]?.node
  const colHandle  = p.collections.edges.map(e => e.node.handle).find(h => CATEGORY_MAP[h]) ?? ''
  const category   = CATEGORY_MAP[colHandle] ?? 'lighting'

  // Collect finish values from variant options named "Finish"
  const finishes = [
    ...new Set(
      p.variants.edges
        .flatMap(e => e.node.selectedOptions)
        .filter(o => o.name.toLowerCase() === 'finish')
        .map(o => o.value)
    ),
  ]

  // Use Shopify GID numeric part as id (e.g. "gid://shopify/Product/12345" → "sp-12345")
  const numericId = p.id.split('/').pop() ?? p.id

  return {
    id:               `sp-${numericId}`,
    slug:             p.handle,
    sku:              meta(mf, 'sku') || firstVar?.sku || '',
    patent:           meta(mf, 'patent'),
    name:             p.title,
    shortDescription: p.description,
    fullDescription:  meta(mf, 'full_description') || p.description,
    price:            parseFloat(p.priceRange.minVariantPrice.amount),
    category,
    burnerSize:       parseBurnerSize(meta(mf, 'burner_size')),
    stockQuantity:    firstVar?.quantityAvailable ?? 0,
    material:         meta(mf, 'material'),
    finish:           finishes,
    fits:             meta(mf, 'fits'),
    benchTesterName:  meta(mf, 'bench_tester'),
    benchTestDate:    meta(mf, 'bench_test_date'),
    workshop:         meta(mf, 'workshop'),
    edition:          meta(mf, 'edition'),
    netWeight:        meta(mf, 'net_weight'),
    era:              meta(mf, 'era'),
    powerSource:      meta(mf, 'power_source'),
    productType:      meta(mf, 'product_type'),
    condition:        meta(mf, 'condition'),
    style:            meta(mf, 'style'),
    colour:           meta(mf, 'colour'),
    brand:            meta(mf, 'brand'),
    vintage:          meta(mf, 'vintage'),
    images:           p.images.edges.map(e => e.node.url),
    inStock:          p.availableForSale,
    featured:         p.tags.includes('featured'),
    collection:       colHandle,
    variantId:        firstVar?.id ?? null,
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetch all products (up to 250). Replaces `mockProducts` import. */
export async function getAllProducts(): Promise<Product[]> {
  const data = await query<{ products: { edges: { node: ShopifyProduct }[] } }>(
    `${PRODUCT_FRAGMENT}
     query GetAllProducts($first: Int!) {
       products(first: $first, sortKey: TITLE) {
         edges { node { ...ProductFields } }
       }
     }`,
    { first: 250 },
  )
  return data.products.edges.map((e: { node: ShopifyProduct }) => shopifyProductToProduct(e.node))
}

/** Fetch a single product by its URL handle. Used on /catalog/[slug]. */
export async function getProductByHandle(handle: string): Promise<Product | null> {
  const data = await query<{ productByHandle: ShopifyProduct | null }>(
    `${PRODUCT_FRAGMENT}
     query GetProduct($handle: String!) {
       productByHandle(handle: $handle) { ...ProductFields }
     }`,
    { handle },
  )
  return data.productByHandle
    ? shopifyProductToProduct(data.productByHandle)
    : null
}

/** Fetch all products in a given category collection. */
export async function getProductsByCategory(category: Product['category']): Promise<Product[]> {
  const data = await query<{
    collection: { products: { edges: { node: ShopifyProduct }[] } } | null
  }>(
    `${PRODUCT_FRAGMENT}
     query GetByCollection($handle: String!, $first: Int!) {
       collection(handle: $handle) {
         products(first: $first) {
           edges { node { ...ProductFields } }
         }
       }
     }`,
    { handle: category, first: 250 },
  )
  return (data.collection?.products.edges ?? []).map(
    (e: { node: ShopifyProduct }) => shopifyProductToProduct(e.node)
  )
}

/** Fetch the 3 products tagged 'featured'. Used by PickedOffTheBench. */
export async function getFeaturedProducts(): Promise<Product[]> {
  const data = await query<{ products: { edges: { node: ShopifyProduct }[] } }>(
    `${PRODUCT_FRAGMENT}
     query GetFeatured($first: Int!, $tag: String!) {
       products(first: $first, query: $tag) {
         edges { node { ...ProductFields } }
       }
     }`,
    { first: 3, tag: 'tag:featured' },
  )
  return data.products.edges.map((e: { node: ShopifyProduct }) => shopifyProductToProduct(e.node))
}

/** Fetch all products with a specific sort order. */
export async function getProductsSorted(
  sortKey: 'TITLE' | 'PRICE' | 'CREATED_AT' = 'TITLE',
  reverse = false,
): Promise<Product[]> {
  const data = await query<{ products: { edges: { node: ShopifyProduct }[] } }>(
    `${PRODUCT_FRAGMENT}
     query GetSorted($first: Int!, $sortKey: ProductSortKeys!, $reverse: Boolean!) {
       products(first: $first, sortKey: $sortKey, reverse: $reverse) {
         edges { node { ...ProductFields } }
       }
     }`,
    { first: 250, sortKey, reverse },
  )
  return data.products.edges.map((e: { node: ShopifyProduct }) => shopifyProductToProduct(e.node))
}
