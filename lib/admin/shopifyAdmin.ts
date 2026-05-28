import type { AdminProduct, ProductStatus } from './types'

const DOMAIN  = process.env.SHOPIFY_STORE_DOMAIN!
const TOKEN   = process.env.SHOPIFY_ADMIN_TOKEN!
const VERSION = '2026-04'
const GQL_URL = `https://${DOMAIN}/admin/api/${VERSION}/graphql.json`

// ─── Core fetch ──────────────────────────────────────────────────────────────

async function adminFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(GQL_URL, {
    method:  'POST',
    headers: {
      'Content-Type':              'application/json',
      'X-Shopify-Access-Token':    TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Shopify Admin API error: ${res.status}`)
  const { data, errors } = await res.json()
  if (errors?.length) throw new Error(errors[0].message)
  return data as T
}

// ─── Metafield namespace ─────────────────────────────────────────────────────

const METAFIELD_FRAGMENT = `
  metafields(first: 20) {
    edges { node { namespace key value } }
  }
`

function metaValue(edges: { node: { namespace: string; key: string; value: string } }[], key: string): string {
  return edges.find(e => e.node.namespace === 'acme' && e.node.key === key)?.node.value ?? ''
}

// ─── Shopify → AdminProduct ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAdminProduct(p: any): AdminProduct {
  const mf = p.metafields?.edges ?? []
  const variant = p.variants?.edges?.[0]?.node ?? {}
  return {
    id:                 p.id.replace('gid://shopify/Product/', ''),
    title:              p.title ?? '',
    shortDescription:   p.description ?? '',
    fullDescription:    metaValue(mf, 'full_description'),
    price:              parseFloat(variant.price ?? '0'),
    compareAtPrice:     variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : null,
    sku:                variant.sku ?? '',
    patent:             metaValue(mf, 'patent'),
    stock:              variant.inventoryQuantity ?? 0,
    status:             (p.status?.toLowerCase() ?? 'draft') as ProductStatus,
    collections:        p.collections?.edges?.map((e: any) => e.node.handle) ?? [],
    tags:               p.tags ?? [],
    vendor:             p.vendor ?? '',
    images:             p.images?.edges?.map((e: any) => e.node.url) ?? [],
    sellWhenOutOfStock: variant.inventoryPolicy === 'CONTINUE',
    netWeight:          metaValue(mf, 'net_weight'),
    material:           metaValue(mf, 'material'),
    colour:             metaValue(mf, 'colour'),
    style:              metaValue(mf, 'style'),
    brand:              metaValue(mf, 'brand'),
    vintage:            metaValue(mf, 'vintage'),
    burnerSize:         metaValue(mf, 'burner_size'),
    fits:               metaValue(mf, 'fits'),
    era:                metaValue(mf, 'era'),
    powerSource:        metaValue(mf, 'power_source'),
    productType:        p.productType ?? '',
    condition:          metaValue(mf, 'condition'),
    edition:            metaValue(mf, 'edition'),
    workshop:           metaValue(mf, 'workshop'),
    benchTester:        metaValue(mf, 'bench_tester'),
    benchTestDate:      metaValue(mf, 'bench_test_date'),
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const PRODUCT_FIELDS = `
  id title description vendor productType status tags
  images(first: 10) { edges { node { url } } }
  collections(first: 10) { edges { node { handle } } }
  variants(first: 1) {
    edges { node {
      price compareAtPrice sku inventoryQuantity inventoryPolicy
    } }
  }
  ${METAFIELD_FRAGMENT}
`

export async function getAdminProducts(first = 50): Promise<AdminProduct[]> {
  const data = await adminFetch<{ products: { edges: { node: unknown }[] } }>(
    `query GetProducts($first: Int!) {
      products(first: $first) {
        edges { node { ${PRODUCT_FIELDS} } }
      }
    }`,
    { first }
  )
  return data.products.edges.map(e => toAdminProduct(e.node))
}

export async function getAdminProductById(shopifyId: string): Promise<AdminProduct | null> {
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Product/${shopifyId}`
  const data = await adminFetch<{ product: unknown | null }>(
    `query GetProduct($id: ID!) {
      product(id: $id) { ${PRODUCT_FIELDS} }
    }`,
    { id: gid }
  )
  return data.product ? toAdminProduct(data.product) : null
}

// ─── Mutations ────────────────────────────────────────────────────────────────

type ProductInput = {
  title:        string
  descriptionHtml?: string
  vendor?:      string
  productType?: string
  status?:      'ACTIVE' | 'DRAFT'
  tags?:        string[]
  variants?:    { price: string; compareAtPrice?: string; sku?: string; inventoryManagement?: string; inventoryPolicy?: string }[]
  metafields?:  { namespace: string; key: string; value: string; type: string }[]
}

export async function createAdminProduct(input: ProductInput): Promise<AdminProduct> {
  // productCreate no longer accepts variants in 2024-07+ — strip them out
  const { variants, ...productInput } = input

  const data = await adminFetch<{ productCreate: { product: unknown; userErrors: { message: string }[] } }>(
    `mutation CreateProduct($input: ProductInput!) {
      productCreate(input: $input) {
        product { ${PRODUCT_FIELDS} }
        userErrors { field message }
      }
    }`,
    { input: productInput }
  )
  if (data.productCreate.userErrors.length) {
    throw new Error(data.productCreate.userErrors[0].message)
  }
  const created = data.productCreate.product

  // Update the default variant Shopify auto-creates with price/sku
  if (variants?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productGid = (created as any).id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const variantId  = (created as any).variants?.edges?.[0]?.node?.id
    if (productGid && variantId) {
      await adminFetch(
        `mutation UpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            userErrors { field message }
          }
        }`,
        {
          productId: productGid,
          variants: variants.map(v => ({
            id: variantId,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            sku: v.sku,
            inventoryPolicy: v.inventoryPolicy,
          })),
        }
      )
    }
  }

  return toAdminProduct(created)
}

export async function updateAdminProduct(shopifyId: string, input: ProductInput): Promise<AdminProduct> {
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Product/${shopifyId}`

  // productUpdate no longer accepts variants in 2024-07+ — strip them out
  const { variants, ...productInput } = input

  const data = await adminFetch<{ productUpdate: { product: unknown; userErrors: { message: string }[] } }>(
    `mutation UpdateProduct($input: ProductInput!) {
      productUpdate(input: $input) {
        product { ${PRODUCT_FIELDS} }
        userErrors { field message }
      }
    }`,
    { input: { ...productInput, id: gid } }
  )
  if (data.productUpdate.userErrors.length) {
    throw new Error(data.productUpdate.userErrors[0].message)
  }
  const updated = data.productUpdate.product

  // Update variant (price, sku, etc.) separately if provided
  if (variants?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const variantId = (updated as any).variants?.edges?.[0]?.node?.id
    if (variantId) {
      await adminFetch(
        `mutation UpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            userErrors { field message }
          }
        }`,
        {
          productId: gid,
          variants: variants.map(v => ({
            id: variantId,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            sku: v.sku,
            inventoryPolicy: v.inventoryPolicy,
          })),
        }
      )
    }
  }

  return toAdminProduct(updated)
}

export async function deleteAdminProduct(shopifyId: string): Promise<void> {
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Product/${shopifyId}`
  const data = await adminFetch<{ productDelete: { userErrors: { message: string }[] } }>(
    `mutation DeleteProduct($id: ID!) {
      productDelete(input: { id: $id }) {
        userErrors { field message }
      }
    }`,
    { id: gid }
  )
  if (data.productDelete.userErrors.length) {
    throw new Error(data.productDelete.userErrors[0].message)
  }
}

// ─── Shop owner ──────────────────────────────────────────────────────────────

export async function getShopOwner(): Promise<{ name: string; email: string }> {
  const data = await adminFetch<{ shop: { contactEmail: string; name: string; owner: { firstName: string; lastName: string; email: string } } }>(
    `{ shop { name contactEmail owner { firstName lastName email } } }`
  )
  const owner = data.shop.owner
  return {
    name:  `${owner.firstName} ${owner.lastName}`.trim() || data.shop.name,
    email: owner.email || data.shop.contactEmail,
  }
}

// ─── Media helpers ────────────────────────────────────────────────────────────

export async function getProductMediaWithIds(shopifyId: string): Promise<{ id: string; url: string }[]> {
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Product/${shopifyId}`
  const data = await adminFetch<{ product: { media: { edges: { node: { id: string; image?: { url: string } } }[] } } | null }>(
    `query GetProductMedia($id: ID!) {
      product(id: $id) {
        media(first: 20) {
          edges {
            node {
              id
              ... on MediaImage { image { url } }
            }
          }
        }
      }
    }`,
    { id: gid }
  )
  return (data.product?.media.edges ?? [])
    .map(e => ({ id: e.node.id, url: e.node.image?.url ?? '' }))
    .filter(m => m.url)
}

export async function deleteProductMedia(shopifyId: string, mediaIds: string[]): Promise<void> {
  if (!mediaIds.length) return
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Product/${shopifyId}`
  await adminFetch(
    `mutation DeleteMedia($productId: ID!, $mediaIds: [ID!]!) {
      productDeleteMedia(productId: $productId, mediaIds: $mediaIds) {
        mediaUserErrors { field message }
      }
    }`,
    { productId: gid, mediaIds }
  )
}

// ─── Image upload via Staged Uploads ─────────────────────────────────────────

export async function uploadProductImage(productId: string, imageUrl: string): Promise<string> {
  const gid = productId.startsWith('gid://') ? productId : `gid://shopify/Product/${productId}`
  const data = await adminFetch<{ productCreateMedia: { media: { preview: { image: { url: string } } }[]; mediaUserErrors: { message: string }[] } }>(
    `mutation AddProductImage($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media { preview { image { url } } }
        mediaUserErrors { field message }
      }
    }`,
    {
      productId: gid,
      media: [{ mediaContentType: 'IMAGE', originalSource: imageUrl }],
    }
  )
  if (data.productCreateMedia.mediaUserErrors.length) {
    throw new Error(data.productCreateMedia.mediaUserErrors[0].message)
  }
  return data.productCreateMedia.media[0]?.preview?.image?.url ?? ''
}
