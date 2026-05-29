// lib/admin/shopify.ts

import type { AdminProduct, ProductStatus } from './types'

const DOMAIN  = process.env.SHOPIFY_STORE_DOMAIN!
const TOKEN   = process.env.SHOPIFY_ADMIN_TOKEN!
const VERSION = '2026-04'
const GQL_URL = `https://${DOMAIN}/admin/api/${VERSION}/graphql.json`

// ─── Core fetch ──────────────────────────────────────────────────────────────

export async function adminFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
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

interface MetafieldEdge {
  node: { namespace: string; key: string; value: string }
}

function metaValue(edges: MetafieldEdge[], key: string): string {
  return edges.find(e => e.node.namespace === 'acme' && e.node.key === key)?.node.value ?? ''
}

// ─── GraphQL Product Shape ───────────────────────────────────────────────────

interface ShopifyVariantNode {
  id: string
  price: string
  compareAtPrice?: string | null
  sku: string
  inventoryQuantity: number
  inventoryPolicy: string
  inventoryItem: { id: string } | null
}

interface ShopifyProductNode {
  id: string
  title: string
  description: string
  vendor: string
  productType: string
  status: string
  tags: string[]
  images: { edges: { node: { url: string } }[] }
  collections: { edges: { node: { handle: string } }[] }
  variants: { edges: { node: ShopifyVariantNode }[] }
  metafields: { edges: MetafieldEdge[] } | null
  category?: { id: string; name: string; fullName: string } | null
}

// ─── Shopify → AdminProduct ───────────────────────────────────────────────────

function toAdminProduct(p: ShopifyProductNode): AdminProduct {
  const mf = p.metafields?.edges ?? []
  const variant = p.variants?.edges?.[0]?.node ?? ({} as Partial<ShopifyVariantNode>)
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
    collections:        p.collections?.edges?.map(e => e.node.handle) ?? [],
    tags:               p.tags ?? [],
    vendor:             p.vendor ?? '',
    images:             p.images?.edges?.map(e => e.node.url) ?? [],
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
    category:           p.category ? { id: p.category.id, name: p.category.fullName ?? p.category.name } : null,
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const PRODUCT_FIELDS = `
  id title description vendor productType status tags
  images(first: 10) { edges { node { url } } }
  collections(first: 10) { edges { node { handle } } }
  category { id name fullName }
  variants(first: 1) {
    edges { node {
      id price compareAtPrice sku inventoryQuantity inventoryPolicy
      inventoryItem { id }
    } }
  }
  ${METAFIELD_FRAGMENT}
`

export async function getAdminProducts(first = 50): Promise<AdminProduct[]> {
  const data = await adminFetch<{ products: { edges: { node: ShopifyProductNode }[] } }>(
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
  const data = await adminFetch<{ product: ShopifyProductNode | null }>(
    `query GetProduct($id: ID!) {
      product(id: $id) { ${PRODUCT_FIELDS} }
    }`,
    { id: gid }
  )
  return data.product ? toAdminProduct(data.product) : null
}

// ─── Mutations ────────────────────────────────────────────────────────────────

type ProductInput = {
  title:               string
  descriptionHtml?:    string
  vendor?:             string
  productType?:        string
  status?:             'ACTIVE' | 'DRAFT'
  tags?:               string[]
  collectionsToJoin?:  string[]
  collectionsToLeave?: string[]
  category?:           { id: string } | null
  stock?:              number
  variants?:           { price: string; compareAtPrice?: string; inventoryPolicy?: string }[]
  metafields?:         { namespace: string; key: string; value: string; type: string }[]
}

export async function getProductCollectionGids(shopifyId: string): Promise<string[]> {
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Product/${shopifyId}`
  const data = await adminFetch<{ product: { collections: { edges: { node: { id: string } }[] } } | null }>(
    `query GetProductCollections($id: ID!) {
      product(id: $id) {
        collections(first: 50) { edges { node { id } } }
      }
    }`,
    { id: gid }
  )
  return data.product?.collections.edges.map(e => e.node.id) ?? []
}

export async function collectionHandlesToGids(handles: string[]): Promise<string[]> {
  if (!handles.length) return []
  const data = await adminFetch<{ collections: { edges: { node: { id: string; handle: string } }[] } }>(
    `query GetCollections($query: String!) {
      collections(first: 50, query: $query) {
        edges { node { id handle } }
      }
    }`,
    { query: handles.map(h => `handle:${h}`).join(' OR ') }
  )
  return data.collections.edges
    .filter(e => handles.includes(e.node.handle))
    .map(e => e.node.id)
}

export async function createAdminProduct(input: ProductInput): Promise<AdminProduct> {
  const { variants, stock, ...productInput } = input

  const data = await adminFetch<{ productCreate: { product: ShopifyProductNode; userErrors: { message: string }[] } }>(
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

  // Update the default variant: price, compareAt, inventory policy, enable tracking
  if (variants?.length) {
    const variantNode = created.variants?.edges?.[0]?.node
    if (variantNode) {
      const variantData = await adminFetch<{ productVariantsBulkUpdate: { userErrors: { field: string; message: string }[] } }>(
        `mutation UpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            userErrors { field message }
          }
        }`,
        {
          productId: created.id,
          variants: [{
            id: variantNode.id,
            price: variants[0].price,
            compareAtPrice: variants[0].compareAtPrice,
            inventoryPolicy: variants[0].inventoryPolicy,
            inventoryItem: { tracked: true },
          }],
        }
      )
      if (variantData.productVariantsBulkUpdate.userErrors.length) {
        console.error('[createAdminProduct] variant error:', variantData.productVariantsBulkUpdate.userErrors[0].message)
      }
    }
  }

  await publishToAllChannels(created.id)

  const result = toAdminProduct(created)

  if (stock != null && stock >= 0) {
    const inventoryItemId = created.variants?.edges?.[0]?.node?.inventoryItem?.id
    console.log('[createAdminProduct] inventoryItemId:', inventoryItemId, 'stock:', stock)
    if (inventoryItemId) {
      try {
        await setInventoryQuantity(inventoryItemId, stock)
        console.log('[createAdminProduct] inventory set OK')
      } catch (e) {
        console.error('[createAdminProduct] inventory error:', String(e))
      }
    } else {
      console.warn('[createAdminProduct] no inventoryItemId — skipping stock update')
    }
    result.stock = stock
  }

  return result
}

export async function updateAdminProduct(shopifyId: string, input: ProductInput): Promise<AdminProduct> {
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Product/${shopifyId}`
  const { variants, stock, ...productInput } = input

  const data = await adminFetch<{ productUpdate: { product: ShopifyProductNode; userErrors: { message: string }[] } }>(
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

  // Update variant: price, compareAt, inventory policy, enable tracking
  if (variants?.length) {
    const variantNode = updated.variants?.edges?.[0]?.node
    if (variantNode) {
      const variantData = await adminFetch<{ productVariantsBulkUpdate: { userErrors: { field: string; message: string }[] } }>(
        `mutation UpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            userErrors { field message }
          }
        }`,
        {
          productId: gid,
          variants: [{
            id: variantNode.id,
            price: variants[0].price,
            compareAtPrice: variants[0].compareAtPrice,
            inventoryPolicy: variants[0].inventoryPolicy,
            inventoryItem: { tracked: true },
          }],
        }
      )
      if (variantData.productVariantsBulkUpdate.userErrors.length) {
        console.error('[updateAdminProduct] variant error:', variantData.productVariantsBulkUpdate.userErrors[0].message)
      }
    }
  }

  if (productInput.status === 'ACTIVE') {
    await publishToAllChannels(gid)
  }

  const result = toAdminProduct(updated)

  if (stock != null && stock >= 0) {
    const inventoryItemId = updated.variants?.edges?.[0]?.node?.inventoryItem?.id
    console.log('[updateAdminProduct] inventoryItemId:', inventoryItemId, 'stock:', stock)
    if (inventoryItemId) {
      try {
        await setInventoryQuantity(inventoryItemId, stock)
        console.log('[updateAdminProduct] inventory set OK')
      } catch (e) {
        console.error('[updateAdminProduct] inventory error:', String(e))
      }
    } else {
      console.warn('[updateAdminProduct] no inventoryItemId — skipping stock update')
    }
    result.stock = stock
  }

  return result
}

// ─── Publications (Online Store channel) ─────────────────────────────────────

async function publishToAllChannels(productGid: string): Promise<void> {
  const pubData = await adminFetch<{ publications: { edges: { node: { id: string } }[] } }>(
    `{ publications(first: 20) { edges { node { id } } } }`
  )
  const ids = pubData.publications.edges.map(e => e.node.id)
  if (!ids.length) { console.warn('[publishToAllChannels] no publications found'); return }

  for (const pubId of ids) {
    try {
      const data = await adminFetch<{ publishablePublish: { userErrors: { field: string; message: string }[] } }>(
        `mutation Publish($id: ID!, $pubId: ID!) {
          publishablePublish(id: $id, input: [{ publicationId: $pubId }]) {
            userErrors { field message }
          }
        }`,
        { id: productGid, pubId }
      )
      const errs = data.publishablePublish?.userErrors
      if (errs?.length) console.warn(`[publishToAllChannels] ${pubId}: ${errs[0].message}`)
    } catch (e) {
      console.warn(`[publishToAllChannels] ${pubId}: ${String(e)}`)
    }
  }
}

// ─── Inventory ───────────────────────────────────────────────────────────────

let cachedLocationId: string | null = null

export async function getPrimaryLocationId(): Promise<string> {
  if (cachedLocationId) return cachedLocationId
  const data = await adminFetch<{ locations: { edges: { node: { id: string } }[] } }>(
    `{ locations(first: 1) { edges { node { id } } } }`
  )
  cachedLocationId = data.locations.edges[0]?.node?.id ?? ''
  return cachedLocationId
}

export async function setInventoryQuantity(
  inventoryItemId: string,
  quantity: number
): Promise<void> {
  if (!inventoryItemId || quantity < 0) return
  const locationId = await getPrimaryLocationId()
  if (!locationId) throw new Error('No Shopify location found')

  // Fetch current on_hand at our location (changeFromQuantity is required in 2026-04)
  const currentData = await adminFetch<{
    inventoryItem: {
      inventoryLevels: {
        edges: { node: { location: { id: string }; quantities: { name: string; quantity: number }[] } }[]
      }
    } | null
  }>(
    `query GetOnHand($id: ID!) {
      inventoryItem(id: $id) {
        inventoryLevels(first: 10) {
          edges {
            node {
              location { id }
              quantities(names: ["on_hand"]) { name quantity }
            }
          }
        }
      }
    }`,
    { id: inventoryItemId }
  )

  const levels = currentData.inventoryItem?.inventoryLevels?.edges ?? []
  const level  = levels.find(e => e.node.location.id === locationId)
  const changeFromQuantity = level?.node?.quantities?.find(q => q.name === 'on_hand')?.quantity ?? 0

  const idempotencyKey = `inv-${inventoryItemId.split('/').pop()}-${Date.now()}`

  const data = await adminFetch<{
    inventorySetQuantities: { userErrors: { field: string; message: string }[] }
  }>(
    `mutation SetInventory($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) @idempotent(key: "${idempotencyKey}") {
        userErrors { field message }
      }
    }`,
    {
      input: {
        name: 'on_hand',
        reason: 'correction',
        quantities: [{ inventoryItemId, locationId, quantity, changeFromQuantity }],
      },
    }
  )

  const errs = data.inventorySetQuantities?.userErrors
  if (errs?.length) throw new Error(`Inventory error: ${errs[0].message}`)
}

/**
 * Returns the inventoryItem GID for a product's first variant.
 * Returns null if the product has no variant or no inventory item.
 */
export async function getInventoryItemIdForProduct(shopifyId: string): Promise<string | null> {
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Product/${shopifyId}`
  const data = await adminFetch<{
    product: {
      variants: { edges: { node: { inventoryItem: { id: string } | null } }[] }
    } | null
  }>(
    `query GetInventoryItem($id: ID!) {
      product(id: $id) {
        variants(first: 1) {
          edges { node { inventoryItem { id } } }
        }
      }
    }`,
    { id: gid }
  )
  return data.product?.variants.edges[0]?.node?.inventoryItem?.id ?? null
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

// ─── Orders ───────────────────────────────────────────────────────────────────

import type { AdminOrder, AdminOrderItem, OrderStatus, PaymentStatus, AdminCollection } from './types'

interface ShopifyOrderNode {
  id: string
  name: string
  createdAt: string
  email: string
  phone: string | null
  displayFinancialStatus: string
  displayFulfillmentStatus: string
  note: string | null
  totalPriceSet:    { shopMoney: { amount: string } }
  subtotalPriceSet: { shopMoney: { amount: string } } | null
  totalShippingPriceSet: { shopMoney: { amount: string } }
  totalTaxSet:      { shopMoney: { amount: string } }
  shippingAddress: {
    firstName: string
    lastName:  string
    phone:     string | null
    address1:  string | null
    address2:  string | null
    city:      string
    province:  string
    country:   string
  } | null
  lineItems: {
    edges: {
      node: {
        id: string
        title: string
        sku: string | null
        quantity: number
        originalUnitPriceSet: { shopMoney: { amount: string } }
        variant: { image: { url: string } | null } | null
      }
    }[]
  }
  fulfillments: {
    trackingInfo: { number: string | null }[]
    estimatedDeliveryAt: string | null
  }[]
}

function toAdminOrder(o: ShopifyOrderNode): AdminOrder {
  const addr = o.shippingAddress

  const payMap: Record<string, PaymentStatus> = {
    PAID:               'paid',
    PENDING:            'pending',
    REFUNDED:           'refunded',
    PARTIALLY_REFUNDED: 'partially_paid',
    PARTIALLY_PAID:     'partially_paid',
    VOIDED:             'refunded',
  }
  const fulMap: Record<string, OrderStatus> = {
    FULFILLED:          'fulfilled',
    UNFULFILLED:        'unfulfilled',
    PARTIALLY_FULFILLED:'unfulfilled',
    RESTOCKED:          'cancelled',
    CANCELLED:          'cancelled',
    IN_PROGRESS:        'unfulfilled',
  }

  const items: AdminOrderItem[] = o.lineItems.edges.map(e => ({
    id:        e.node.id.replace('gid://shopify/LineItem/', ''),
    title:     e.node.title,
    sku:       e.node.sku ?? '',
    quantity:  e.node.quantity,
    unitPrice: parseFloat(e.node.originalUnitPriceSet.shopMoney.amount),
    image:     e.node.variant?.image?.url ?? '',
  }))

  const trackingRef = o.fulfillments[0]?.trackingInfo[0]?.number ?? ''
  const estimatedDelivery = o.fulfillments[0]?.estimatedDeliveryAt ?? undefined

  return {
    id:               o.name,
    customer: {
      name:     `${addr?.firstName ?? ''} ${addr?.lastName ?? ''}`.trim() || o.email,
      email:    o.email,
      phone:    addr?.phone ?? o.phone ?? '',
      address:  [addr?.address1, addr?.address2].filter(Boolean).join(', '),
      city:     addr?.city ?? '',
      province: addr?.province ?? '',
      country:  addr?.country ?? '',
    },
    date:              o.createdAt,
    items,
    subtotal:          parseFloat(o.subtotalPriceSet?.shopMoney.amount ?? '0'),
    shipping:          parseFloat(o.totalShippingPriceSet.shopMoney.amount),
    tax:               parseFloat(o.totalTaxSet.shopMoney.amount),
    total:             parseFloat(o.totalPriceSet.shopMoney.amount),
    paymentStatus:     payMap[o.displayFinancialStatus]    ?? 'pending',
    fulfillmentStatus: fulMap[o.displayFulfillmentStatus]  ?? 'unfulfilled',
    notes:             o.note ?? '',
    trackingRef,
    estimatedDelivery,
    fulfillmentEvents: [],
  }
}

const ORDER_FIELDS = `
  id name createdAt email phone
  displayFinancialStatus displayFulfillmentStatus
  note
  totalPriceSet    { shopMoney { amount } }
  subtotalPriceSet { shopMoney { amount } }
  totalShippingPriceSet { shopMoney { amount } }
  totalTaxSet      { shopMoney { amount } }
  shippingAddress {
    firstName lastName phone address1 address2 city province country
  }
  lineItems(first: 20) {
    edges { node {
      id title sku quantity
      originalUnitPriceSet { shopMoney { amount } }
      variant { image { url } }
    } }
  }
  fulfillments(first: 5) {
    trackingInfo { number }
    estimatedDeliveryAt
  }
`

export async function getAdminOrders(first = 50): Promise<AdminOrder[]> {
  const data = await adminFetch<{ orders: { edges: { node: ShopifyOrderNode }[] } }>(
    `query GetOrders($first: Int!) {
      orders(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges { node { ${ORDER_FIELDS} } }
      }
    }`,
    { first }
  )
  return data.orders.edges.map(e => toAdminOrder(e.node))
}

export async function getAdminOrderById(orderId: string): Promise<AdminOrder | null> {
  // orderId can be the display name (#1001) or a numeric Shopify ID
  const isGid = orderId.startsWith('gid://')
  const isNumeric = /^\d+$/.test(orderId)

  if (isGid || isNumeric) {
    const gid = isGid ? orderId : `gid://shopify/Order/${orderId}`
    const data = await adminFetch<{ order: ShopifyOrderNode | null }>(
      `query GetOrder($id: ID!) { order(id: $id) { ${ORDER_FIELDS} } }`,
      { id: gid }
    )
    return data.order ? toAdminOrder(data.order) : null
  }

  // Search by name (#1001)
  const name = orderId.startsWith('#') ? orderId : `#${orderId}`
  const data = await adminFetch<{ orders: { edges: { node: ShopifyOrderNode }[] } }>(
    `query GetOrderByName($query: String!) {
      orders(first: 1, query: $query) {
        edges { node { ${ORDER_FIELDS} } }
      }
    }`,
    { query: `name:${name}` }
  )
  const node = data.orders.edges[0]?.node
  return node ? toAdminOrder(node) : null
}

// ─── Collections ──────────────────────────────────────────────────────────────

interface ShopifyCollectionNode {
  id: string
  title: string
  handle: string
  description: string | null
  productsCount: { count: number } | null
}

function toAdminCollection(c: ShopifyCollectionNode): AdminCollection {
  return {
    id:           c.id.replace('gid://shopify/Collection/', ''),
    title:        c.title,
    handle:       c.handle,
    description:  c.description ?? '',
    productCount: c.productsCount?.count ?? 0,
  }
}

const COLLECTION_FIELDS = `id title handle description productsCount { count }`

export async function getAdminCollections(first = 50): Promise<AdminCollection[]> {
  const data = await adminFetch<{
    collections: { edges: { node: ShopifyCollectionNode }[] }
  }>(
    `query GetCollections($first: Int!) {
      collections(first: $first) {
        edges { node { ${COLLECTION_FIELDS} } }
      }
    }`,
    { first }
  )
  return data.collections.edges.map(e => toAdminCollection(e.node))
}

export async function createAdminCollection(input: {
  title: string
  handle?: string
  descriptionHtml?: string
}): Promise<AdminCollection> {
  const data = await adminFetch<{
    collectionCreate: {
      collection: ShopifyCollectionNode | null
      userErrors: { field: string; message: string }[]
    }
  }>(
    `mutation CreateCollection($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection { ${COLLECTION_FIELDS} }
        userErrors { field message }
      }
    }`,
    { input }
  )
  if (data.collectionCreate.userErrors.length) {
    throw new Error(data.collectionCreate.userErrors[0].message)
  }
  if (!data.collectionCreate.collection) throw new Error('collectionCreate returned no collection')
  return toAdminCollection(data.collectionCreate.collection)
}

export async function updateAdminCollection(
  shopifyId: string,
  input: { title: string; handle?: string; descriptionHtml?: string }
): Promise<AdminCollection> {
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Collection/${shopifyId}`
  const data = await adminFetch<{
    collectionUpdate: {
      collection: ShopifyCollectionNode | null
      userErrors: { field: string; message: string }[]
    }
  }>(
    `mutation UpdateCollection($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        collection { ${COLLECTION_FIELDS} }
        userErrors { field message }
      }
    }`,
    { input: { id: gid, ...input } }
  )
  if (data.collectionUpdate.userErrors.length) {
    throw new Error(data.collectionUpdate.userErrors[0].message)
  }
  if (!data.collectionUpdate.collection) throw new Error('collectionUpdate returned no collection')
  return toAdminCollection(data.collectionUpdate.collection)
}

export async function deleteAdminCollection(shopifyId: string): Promise<void> {
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Collection/${shopifyId}`
  const data = await adminFetch<{
    collectionDelete: { userErrors: { field: string; message: string }[] }
  }>(
    `mutation DeleteCollection($id: ID!) {
      collectionDelete(input: { id: $id }) {
        userErrors { field message }
      }
    }`,
    { id: gid }
  )
  if (data.collectionDelete.userErrors.length) {
    throw new Error(data.collectionDelete.userErrors[0].message)
  }
}
