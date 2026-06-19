// lib/admin/shopify.ts

import type { AdminProduct, ProductStatus } from './types'

const DOMAIN  = process.env.SHOPIFY_STORE_DOMAIN!
const TOKEN   = process.env.SHOPIFY_ADMIN_TOKEN!
const VERSION = '2026-04'
const GQL_URL = `https://${DOMAIN}/admin/api/${VERSION}/graphql.json`

// ─── Core fetch ──────────────────────────────────────────────────────────────

export async function adminFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const res = await fetch(GQL_URL, {
      method:  'POST',
      headers: {
        'Content-Type':           'application/json',
        'X-Shopify-Access-Token': TOKEN,
      },
      body:   JSON.stringify({ query, variables }),
      cache:  'no-store',
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[shopifyAdmin] HTTP ${res.status}:`, body)
      throw new Error(`Shopify Admin API error ${res.status}: ${body}`)
    }

    const { data, errors } = await res.json()
    if (errors?.length) {
      console.error('[shopifyAdmin] GraphQL errors:', errors)
      throw new Error(errors[0].message)
    }
    return data as T
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error('Shopify Admin API timeout (15s) — check store domain and token')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
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
  selectedOptions?: { name: string; value: string }[]
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
  const variantEdges = p.variants?.edges ?? []
  const variant = variantEdges[0]?.node ?? ({} as Partial<ShopifyVariantNode>)

  // Build colour variants from Shopify variant selectedOptions
  const colourEdges = variantEdges.filter(e =>
    e.node.selectedOptions?.some(o => o.name.toLowerCase() === 'colour')
  )
  const hasVariants = colourEdges.length >= 1
  const variants = colourEdges.map(e => ({
    colour:         e.node.selectedOptions?.find(o => o.name.toLowerCase() === 'colour')?.value ?? '',
    price:          parseFloat(e.node.price ?? '0'),
    compareAtPrice: e.node.compareAtPrice ? parseFloat(e.node.compareAtPrice) : null,
    stock:          e.node.inventoryQuantity ?? 0,
  }))

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
    soldCount:          parseInt(metaValue(mf, 'sold_count') || '0', 10),
    hasVariants,
    variants,
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const PRODUCT_FIELDS = `
  id title description vendor productType status tags
  images(first: 10) { edges { node { url } } }
  collections(first: 10) { edges { node { handle } } }
  category { id name fullName }
  variants(first: 10) {
    edges { node {
      id price compareAtPrice sku inventoryQuantity inventoryPolicy
      inventoryItem { id }
      selectedOptions { name value }
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

export async function getProductByTitle(title: string): Promise<AdminProduct | null> {
  const data = await adminFetch<{ products: { edges: { node: ShopifyProductNode }[] } }>(
    `query FindByTitle($query: String!) {
      products(first: 1, query: $query) {
        edges { node { ${PRODUCT_FIELDS} } }
      }
    }`,
    { query: `title:'${title.replace(/'/g, "\\'")}'` }
  )
  const node = data.products.edges[0]?.node
  return node ? toAdminProduct(node) : null
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
  category?:           string | null
  stock?:              number
  variants?:           { price: string; compareAtPrice?: string; inventoryPolicy?: string }[]
  metafields?:         { namespace: string; key: string; value: string; type: string }[]
  colourVariants?:     { colour: string; price: number; compareAtPrice: number | null; stock: number }[]
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
  const { variants, stock, colourVariants, ...productInput } = input
  const hasColourVariants = Array.isArray(colourVariants) && colourVariants.length >= 1

  // Declare the "Colour" option up-front so productVariantsBulkCreate can reference
  // optionValues: [{ optionName: 'Colour', name: '...' }]. Without this the API
  // returns "Option does not exist". DEFAULT strategy then removes the auto-created
  // "Default Title" standalone variant when we add the real colour variants.
  const createInput = hasColourVariants
    ? { ...productInput, options: ['Colour'] }
    : productInput

  const data = await adminFetch<{ productCreate: { product: ShopifyProductNode; userErrors: { message: string }[] } }>(
    `mutation CreateProduct($input: ProductInput!) {
      productCreate(input: $input) {
        product { ${PRODUCT_FIELDS} }
        userErrors { field message }
      }
    }`,
    { input: createInput }
  )
  if (data.productCreate.userErrors.length) {
    throw new Error(data.productCreate.userErrors[0].message)
  }
  const created = data.productCreate.product

  if (hasColourVariants) {
    // Replace the standalone default variant with all colour variants
    const bulkData = await adminFetch<{
      productVariantsBulkCreate: {
        productVariants: { id: string; inventoryItem: { id: string } | null }[]
        userErrors: { field: string; message: string }[]
      }
    }>(
      `mutation BulkCreateVariants(
        $productId: ID!
        $variants: [ProductVariantsBulkInput!]!
        $strategy: ProductVariantsBulkCreateStrategy
      ) {
        productVariantsBulkCreate(productId: $productId, variants: $variants, strategy: $strategy) {
          productVariants { id inventoryItem { id } }
          userErrors { field message }
        }
      }`,
      {
        productId: created.id,
        strategy:  'DEFAULT',
        variants:  colourVariants!.map(cv => ({
          price:           String(cv.price),
          ...(cv.compareAtPrice != null && { compareAtPrice: String(cv.compareAtPrice) }),
          inventoryPolicy: 'DENY',
          inventoryItem:   { tracked: true },
          optionValues:    [{ optionName: 'Colour', name: cv.colour }],
        })),
      }
    )
    if (bulkData.productVariantsBulkCreate.userErrors.length) {
      throw new Error('[createAdminProduct] colour variant error: ' + bulkData.productVariantsBulkCreate.userErrors[0].message)
    }

    // Set inventory per colour variant in parallel
    const createdVariants = bulkData.productVariantsBulkCreate.productVariants
    await Promise.all(
      colourVariants!.map((cv, i) => {
        const invId = createdVariants[i]?.inventoryItem?.id
        if (invId && cv.stock >= 0) {
          return setInventoryQuantity(invId, cv.stock).catch(e =>
            console.error(`[createAdminProduct] inventory error for ${cv.colour}:`, String(e))
          )
        }
      })
    )
  } else {
    // Single variant — update price, compareAt, policy, enable tracking
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
              id:              variantNode.id,
              price:           variants[0].price,
              compareAtPrice:  variants[0].compareAtPrice,
              inventoryPolicy: variants[0].inventoryPolicy,
              inventoryItem:   { tracked: true },
            }],
          }
        )
        if (variantData.productVariantsBulkUpdate.userErrors.length) {
          console.error('[createAdminProduct] variant error:', variantData.productVariantsBulkUpdate.userErrors[0].message)
        }
      }
    }

    if (stock != null && stock >= 0) {
      const inventoryItemId = created.variants?.edges?.[0]?.node?.inventoryItem?.id
      if (inventoryItemId) {
        try {
          await setInventoryQuantity(inventoryItemId, stock)
        } catch (e) {
          console.error('[createAdminProduct] inventory error:', String(e))
        }
      }
    }
  }

  await publishToAllChannels(created.id)

  const result = toAdminProduct(created)
  if (!hasColourVariants && stock != null) result.stock = stock

  return result
}

export async function updateAdminProduct(shopifyId: string, input: ProductInput): Promise<AdminProduct> {
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Product/${shopifyId}`
  const { variants, stock, colourVariants, ...productInput } = input
  const hasColourVariants = Array.isArray(colourVariants) && colourVariants.length >= 1

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

  if (hasColourVariants) {
    const existingColourEdges = (updated.variants?.edges ?? []).filter(e =>
      e.node.selectedOptions?.some(o => o.name.toLowerCase() === 'colour')
    )

    if (existingColourEdges.length === 0) {
      // ── First time adding colour variants: use productSet (atomic option + variants) ──
      const setData = await adminFetch<{
        productSet: {
          product: {
            variants: {
              edges: {
                node: {
                  id: string
                  inventoryItem: { id: string } | null
                  selectedOptions: { name: string; value: string }[]
                }
              }[]
            }
          } | null
          userErrors: { field: string; message: string }[]
        }
      }>(
        `mutation ProductSet($input: ProductSetInput!, $synchronous: Boolean!) {
          productSet(input: $input, synchronous: $synchronous) {
            product {
              variants(first: 10) {
                edges {
                  node {
                    id
                    inventoryItem { id }
                    selectedOptions { name value }
                  }
                }
              }
            }
            userErrors { field message }
          }
        }`,
        {
          synchronous: true,
          input: {
            id: gid,
            productOptions: [{
              name: 'Colour',
              values: colourVariants!.map(cv => ({ name: cv.colour })),
            }],
            variants: colourVariants!.map(cv => ({
              price:           String(cv.price),
              ...(cv.compareAtPrice != null && { compareAtPrice: String(cv.compareAtPrice) }),
              inventoryPolicy: 'DENY',
              inventoryItem:   { tracked: true },
              optionValues:    [{ optionName: 'Colour', name: cv.colour }],
            })),
          },
        }
      )
      if (setData.productSet.userErrors.length) {
        throw new Error('[updateAdminProduct] productSet error: ' + setData.productSet.userErrors[0].message)
      }
      // Match returned variants by colour name (more reliable than index)
      const createdEdges = setData.productSet.product?.variants.edges ?? []
      await Promise.all(
        colourVariants!.map(cv => {
          const edge = createdEdges.find(e =>
            e.node.selectedOptions.some(o => o.name.toLowerCase() === 'colour' && o.value === cv.colour)
          )
          const invId = edge?.node?.inventoryItem?.id
          if (invId && cv.stock >= 0) {
            return setInventoryQuantity(invId, cv.stock).catch(e =>
              console.error(`[updateAdminProduct] inventory error for ${cv.colour}:`, String(e))
            )
          }
        })
      )
    } else {
      // ── Colour variants already exist: split into update vs. create ──
      type CV = { colour: string; price: number; compareAtPrice: number | null; stock: number }
      const toUpdate: { cv: CV; edge: typeof existingColourEdges[0] }[] = []
      const toCreate: CV[] = []
      for (const cv of colourVariants!) {
        const edge = existingColourEdges.find(e =>
          e.node.selectedOptions?.some(o => o.name.toLowerCase() === 'colour' && o.value === cv.colour)
        )
        if (edge) toUpdate.push({ cv, edge })
        else toCreate.push(cv)
      }

      // Update existing variants (price + policy)
      if (toUpdate.length) {
        await adminFetch<{ productVariantsBulkUpdate: { userErrors: { message: string }[] } }>(
          `mutation UpdateColourVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
            productVariantsBulkUpdate(productId: $productId, variants: $variants) {
              userErrors { field message }
            }
          }`,
          {
            productId: gid,
            variants: toUpdate.map(({ cv, edge }) => ({
              id: edge.node.id,
              price: String(cv.price),
              ...(cv.compareAtPrice != null && { compareAtPrice: String(cv.compareAtPrice) }),
              inventoryPolicy: 'DENY' as const,
            })),
          }
        )
      }

      // Create brand-new colour variants and set their inventory
      if (toCreate.length) {
        const createData = await adminFetch<{
          productVariantsBulkCreate: {
            productVariants: { id: string; inventoryItem: { id: string } | null; selectedOptions: { name: string; value: string }[] }[]
            userErrors: { field: string; message: string }[]
          }
        }>(
          `mutation CreateColourVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
            productVariantsBulkCreate(productId: $productId, variants: $variants) {
              productVariants {
                id
                inventoryItem { id }
                selectedOptions { name value }
              }
              userErrors { field message }
            }
          }`,
          {
            productId: gid,
            variants: toCreate.map(cv => ({
              price:           String(cv.price),
              ...(cv.compareAtPrice != null && { compareAtPrice: String(cv.compareAtPrice) }),
              inventoryPolicy: 'DENY' as const,
              inventoryItem:   { tracked: true },
              optionValues:    [{ optionName: 'Colour', name: cv.colour }],
            })),
          }
        )
        if (createData.productVariantsBulkCreate.userErrors.length) {
          console.error('[updateAdminProduct] create variant error:', createData.productVariantsBulkCreate.userErrors[0].message)
        }
        // Set inventory for newly created variants
        await Promise.all(
          toCreate.map(cv => {
            const created = createData.productVariantsBulkCreate.productVariants.find(v =>
              v.selectedOptions.some(o => o.name.toLowerCase() === 'colour' && o.value === cv.colour)
            )
            const invId = created?.inventoryItem?.id
            if (invId && cv.stock >= 0) {
              return setInventoryQuantity(invId, cv.stock).catch(e =>
                console.error(`[updateAdminProduct] new variant stock error for ${cv.colour}:`, String(e))
              )
            }
          })
        )
      }

      // Update stock for existing matched variants
      await Promise.all(
        toUpdate.map(({ cv, edge }) => {
          const invId = edge.node.inventoryItem?.id
          if (invId && cv.stock >= 0) {
            return setInventoryQuantity(invId, cv.stock).catch(e =>
              console.error(`[updateAdminProduct] stock error for ${cv.colour}:`, String(e))
            )
          }
        })
      )
    }
  } else if (variants?.length) {
    // Single variant — update price, compareAt, policy, enable tracking
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

export async function updateProductStatus(shopifyId: string, status: 'ACTIVE' | 'DRAFT'): Promise<void> {
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Product/${shopifyId}`
  const data = await adminFetch<{ productUpdate: { userErrors: { message: string }[] } }>(
    `mutation UpdateProductStatus($input: ProductInput!) {
      productUpdate(input: $input) {
        userErrors { field message }
      }
    }`,
    { input: { id: gid, status } }
  )
  if (data.productUpdate.userErrors.length) {
    throw new Error(data.productUpdate.userErrors[0].message)
  }
}

// ─── Shop owner ──────────────────────────────────────────────────────────────

export async function getShopOwner(): Promise<{ name: string; email: string }> {
  const data = await adminFetch<{ shop: { contactEmail: string; name: string } }>(
    `{ shop { name contactEmail } }`
  )
  return {
    name:  data.shop.name,
    email: data.shop.contactEmail,
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

export async function reorderProductMedia(shopifyId: string, orderedMediaIds: string[]): Promise<void> {
  if (orderedMediaIds.length < 2) return
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Product/${shopifyId}`
  const moves = orderedMediaIds.map((mediaId, idx) => ({ id: mediaId, newPosition: String(idx) }))
  await adminFetch(
    `mutation ReorderMedia($id: ID!, $moves: [MoveInput!]!) {
      productReorderMedia(id: $id, moves: $moves) {
        mediaUserErrors { field message }
      }
    }`,
    { id: gid, moves }
  )
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

export async function uploadProductImage(
  productId: string,
  imageUrl: string,
): Promise<{ id: string; url: string }> {
  const gid = productId.startsWith('gid://') ? productId : `gid://shopify/Product/${productId}`
  const data = await adminFetch<{
    productCreateMedia: {
      media: { id: string; preview: { image: { url: string } } | null }[]
      mediaUserErrors: { message: string }[]
    }
  }>(
    `mutation AddProductImage($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media { id preview { image { url } } }
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
  const m = data.productCreateMedia.media[0]
  return { id: m?.id ?? '', url: m?.preview?.image?.url ?? '' }
}

// ─── Orders ───────────────────────────────────────────────────────────────────

import type { AdminOrder, AdminOrderItem, AdminCustomer, OrderStatus, PaymentStatus, AdminCollection, AdminNotification, FulfillmentEvent, FulfillmentEventStatus } from './types'

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
        variantTitle: string | null
        sku: string | null
        quantity: number
        originalUnitPriceSet: { shopMoney: { amount: string } }
        variant: {
          image: { url: string } | null
          product: { id: string; featuredImage: { url: string } | null } | null
        } | null
      }
    }[]
  }
  fulfillments: {
    id: string
    trackingInfo: { number: string | null; company: string | null }[]
    status: string
    events: {
      edges: { node: { id: string; status: string; happenedAt: string } }[]
    } | null
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
    id:           e.node.id.replace('gid://shopify/LineItem/', ''),
    productId:    e.node.variant?.product?.id ?? '',
    title:        e.node.title,
    variantTitle: e.node.variantTitle ?? undefined,
    sku:          e.node.sku ?? '',
    quantity:     e.node.quantity,
    unitPrice:    parseFloat(e.node.originalUnitPriceSet.shopMoney.amount),
    image:        e.node.variant?.image?.url ?? e.node.variant?.product?.featuredImage?.url ?? '',
  }))

  const trackingRef          = o.fulfillments[0]?.trackingInfo[0]?.number ?? ''
  const estimatedDelivery    = undefined
  const shopifyFulfillmentId = o.fulfillments[0]?.id ?? undefined

  const shopifyStatusMap: Record<string, FulfillmentEventStatus> = {
    LABEL_PRINTED:      'label_printed',
    IN_TRANSIT:         'in_transit',
    OUT_FOR_DELIVERY:   'out_for_delivery',
    DELIVERED:          'delivered',
    ATTEMPTED_DELIVERY: 'attempted_delivery',
    FAILURE:            'failure',
  }

  const confirmedEvent: FulfillmentEvent = {
    id:         `fe-${o.name}-confirmed`,
    status:     'confirmed',
    message:    'Payment verified, packing begins.',
    happenedAt: o.createdAt,
  }

  const fulfillment      = o.fulfillments[0]
  const trackingNumber   = fulfillment?.trackingInfo[0]?.number ?? undefined
  const carrier          = fulfillment?.trackingInfo[0]?.company ?? undefined

  const shopifyEvents: FulfillmentEvent[] = (fulfillment?.events?.edges ?? [])
    .map(e => {
      const mapped = shopifyStatusMap[e.node.status]
      if (!mapped) return null
      return {
        id:          e.node.id,
        status:      mapped,
        message:     '',
        happenedAt:  e.node.happenedAt,
        ...(mapped === 'in_transit' ? { trackingNumber, carrier } : {}),
      } satisfies FulfillmentEvent
    })
    .filter((e): e is FulfillmentEvent => e !== null)

  const fulfillmentEvents: FulfillmentEvent[] = [confirmedEvent, ...shopifyEvents]

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
    fulfillmentEvents,
    shopifyFulfillmentId,
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
      id title variantTitle sku quantity
      originalUnitPriceSet { shopMoney { amount } }
      variant {
        image { url }
        product { id featuredImage { url } }
      }
    } }
  }
  fulfillments {
    id
    trackingInfo { number company }
    status
    events(first: 10) {
      edges { node { id status happenedAt } }
    }
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
  // orderId can be a full GID, a large internal numeric ID (10+ digits), or a display name (e.g. "1001" or "#1001")
  const isGid = orderId.startsWith('gid://')
  // Shopify internal numeric IDs are very large (10+ digits). Display order numbers are short (≤6 digits).
  const isInternalId = /^\d{10,}$/.test(orderId)

  if (isGid || isInternalId) {
    const gid = isGid ? orderId : `gid://shopify/Order/${orderId}`
    const data = await adminFetch<{ order: ShopifyOrderNode | null }>(
      `query GetOrder($id: ID!) { order(id: $id) { ${ORDER_FIELDS} } }`,
      { id: gid }
    )
    return data.order ? toAdminOrder(data.order) : null
  }

  // Search by display name (#1001, #1002, etc.)
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

// ─── Fulfillment order ID lookup (requires read_merchant_managed_fulfillment_orders scope) ──

export async function getOrderFulfillmentOrderId(orderId: string): Promise<string | null> {
  const name = orderId.startsWith('#') ? orderId : `#${orderId}`
  try {
    const data = await adminFetch<{
      orders: { edges: { node: { id: string; fulfillmentOrders: { edges: { node: { id: string } }[] } } }[] }
    }>(
      `query GetFulfillmentOrderId($query: String!) {
        orders(first: 1, query: $query) {
          edges { node {
            id
            fulfillmentOrders(first: 1) { edges { node { id } } }
          } }
        }
      }`,
      { query: `name:${name}` }
    )
    return data.orders.edges[0]?.node?.fulfillmentOrders?.edges[0]?.node?.id ?? null
  } catch {
    return null
  }
}

// ─── Fulfillment mutations ────────────────────────────────────────────────────

export async function createFulfillment(
  fulfillmentOrderId: string,
  trackingNumber: string,
  carrier: string,
  notifyCustomer: boolean,
): Promise<string> {
  const data = await adminFetch<{
    fulfillmentCreateV2: {
      fulfillment: { id: string } | null
      userErrors: { field: string[]; message: string }[]
    }
  }>(
    `mutation FulfillmentCreate($fulfillment: FulfillmentV2Input!) {
      fulfillmentCreateV2(fulfillment: $fulfillment) {
        fulfillment { id }
        userErrors { field message }
      }
    }`,
    {
      fulfillment: {
        lineItemsByFulfillmentOrder: [{ fulfillmentOrderId }],
        trackingInfo: { number: trackingNumber, company: carrier },
        notifyCustomer,
      },
    }
  )
  const { fulfillment, userErrors } = data.fulfillmentCreateV2
  if (userErrors.length) throw new Error(userErrors[0].message)
  if (!fulfillment) throw new Error('Fulfillment not returned by Shopify')
  return fulfillment.id
}

const STAGE_TO_SHOPIFY_EVENT: Record<string, string> = {
  label_printed:      'LABEL_PRINTED',
  in_transit:         'IN_TRANSIT',
  out_for_delivery:   'OUT_FOR_DELIVERY',
  delivered:          'DELIVERED',
  attempted_delivery: 'ATTEMPTED_DELIVERY',
  failure:            'FAILURE',
}

export async function createFulfillmentEvent(
  fulfillmentId: string,
  status: string,
): Promise<void> {
  const shopifyStatus = STAGE_TO_SHOPIFY_EVENT[status]
  if (!shopifyStatus) return
  const data = await adminFetch<{
    fulfillmentEventCreate: {
      fulfillmentEvent: { id: string } | null
      userErrors: { field: string[]; message: string }[]
    }
  }>(
    `mutation FulfillmentEventCreate($fulfillmentEvent: FulfillmentEventInput!) {
      fulfillmentEventCreate(fulfillmentEvent: $fulfillmentEvent) {
        fulfillmentEvent { id }
        userErrors { field message }
      }
    }`,
    { fulfillmentEvent: { fulfillmentId, status: shopifyStatus } }
  )
  const { userErrors } = data.fulfillmentEventCreate
  if (userErrors.length) throw new Error(userErrors[0].message)
}

// ─── Collections ──────────────────────────────────────────────────────────────

interface ShopifyCollectionNode {
  id: string
  title: string
  handle: string
  description: string | null
  productsCount: { count: number } | null
  products?: {
    edges: {
      node: {
        id: string
        title: string
        status: string
        images: { edges: { node: { url: string } }[] }
      }
    }[]
  }
}

function toAdminCollection(c: ShopifyCollectionNode): AdminCollection {
  return {
    id:           c.id.replace('gid://shopify/Collection/', ''),
    title:        c.title,
    handle:       c.handle,
    description:  c.description ?? '',
    productCount: c.productsCount?.count ?? 0,
    products:     (c.products?.edges ?? []).map(e => ({
      id:     e.node.id.replace('gid://shopify/Product/', ''),
      title:  e.node.title,
      status: e.node.status?.toLowerCase() ?? 'draft',
      image:  e.node.images?.edges?.[0]?.node?.url,
    })),
  }
}

const COLLECTION_FIELDS = `
  id title handle description
  productsCount { count }
  products(first: 30) {
    edges { node {
      id title status
      images(first: 1) { edges { node { url } } }
    } }
  }
`

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

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  const notifications: AdminNotification[] = []

  // ── New orders (last 48 h) ────────────────────────────────────────────────
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const data = await adminFetch<{ orders: { edges: { node: ShopifyOrderNode }[] } }>(
      `query GetRecentOrders($first: Int!, $query: String!) {
        orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
          edges { node { ${ORDER_FIELDS} } }
        }
      }`,
      { first: 5, query: `created_at:>'${cutoff}'` }
    )
    for (const { node } of data.orders.edges) {
      const order = toAdminOrder(node)
      const itemCount = order.items.reduce((s, i) => s + i.quantity, 0)
      notifications.push({
        id:        `order-${order.id}`,
        type:      'new_order',
        title:     `New order from ${order.customer.name || order.customer.email}`,
        subtitle:  `${order.id} · $${order.total.toFixed(2)} · ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`,
        href:      `/admin/orders/${order.id.replace('#', '')}`,
        amount:    order.total,
        timestamp: order.date,
      })
    }
  } catch { /* Shopify not configured */ }

  // ── Low stock (≤ 3 units) ─────────────────────────────────────────────────
  try {
    const products = await getAdminProducts(100)
    for (const p of products.filter(p => p.stock <= 3)) {
      notifications.push({
        id:        `stock-${p.id}`,
        type:      'low_stock',
        title:     p.title,
        subtitle:  `${p.sku} · ${p.stock === 0 ? 'Out of stock' : `${p.stock} left`}`,
        href:      '/admin/inventory',
        timestamp: new Date().toISOString(),
      })
    }
  } catch { /* Shopify not configured */ }

  // ── New customers (last 7 days) ───────────────────────────────────────────
  try {
    const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const data = await adminFetch<{
      customers: {
        edges: {
          node: {
            id: string; firstName: string; lastName: string
            email: string; createdAt: string; numberOfOrders: number
          }
        }[]
      }
    }>(
      `query GetRecentCustomers($first: Int!, $query: String!) {
        customers(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
          edges { node { id firstName lastName email createdAt numberOfOrders } }
        }
      }`,
      { first: 5, query: `created_at:>'${cutoff7d}'` }
    )
    for (const { node } of data.customers.edges) {
      const name = `${node.firstName} ${node.lastName}`.trim() || node.email
      notifications.push({
        id:        `customer-${node.id}`,
        type:      'new_customer',
        title:     `New customer: ${name}`,
        subtitle:  `${node.email} · ${node.numberOfOrders} ${node.numberOfOrders === 1 ? 'order' : 'orders'}`,
        href:      '/admin/customers',
        timestamp: node.createdAt,
      })
    }
  } catch { /* Shopify not configured */ }

  // Sort all notifications newest-first
  return notifications.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

// ─── Customers ───────────────────────────────────────────────────────────────

interface ShopifyCustomerNode {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  numberOfOrders: number
  amountSpent: { amount: string }
  createdAt: string
  defaultAddress: {
    address1: string | null
    address2: string | null
    city: string
    province: string
    country: string
  } | null
}

function toAdminCustomer(c: ShopifyCustomerNode): AdminCustomer {
  const addr = c.defaultAddress
  return {
    id:         c.id.replace('gid://shopify/Customer/', ''),
    name:       `${c.firstName} ${c.lastName}`.trim() || c.email,
    email:      c.email,
    phone:      c.phone ?? '',
    address:    addr ? [addr.address1, addr.address2].filter(Boolean).join(', ') : '',
    city:       addr?.city ?? '',
    province:   addr?.province ?? '',
    country:    addr?.country ?? '',
    orders:     c.numberOfOrders,
    totalSpent: parseFloat(c.amountSpent?.amount ?? '0'),
    joined:     c.createdAt,
  }
}

const CUSTOMER_FIELDS = `
  id firstName lastName email phone numberOfOrders
  amountSpent { amount }
  createdAt
  defaultAddress { address1 address2 city province country }
`

export async function getAdminCustomers(first = 250): Promise<AdminCustomer[]> {
  const data = await adminFetch<{ customers: { edges: { node: ShopifyCustomerNode }[] } }>(
    `query GetCustomers($first: Int!) {
      customers(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges { node { ${CUSTOMER_FIELDS} } }
      }
    }`,
    { first }
  )
  return data.customers.edges.map(e => toAdminCustomer(e.node))
}

export async function getAdminCustomerById(customerId: string): Promise<AdminCustomer | null> {
  const gid = customerId.startsWith('gid://') ? customerId : `gid://shopify/Customer/${customerId}`
  const data = await adminFetch<{ customer: ShopifyCustomerNode | null }>(
    `query GetCustomer($id: ID!) {
      customer(id: $id) { ${CUSTOMER_FIELDS} }
    }`,
    { id: gid }
  )
  return data.customer ? toAdminCustomer(data.customer) : null
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsData {
  revenue:         { today: number; week: number; month: number; todayChange: number; weekChange: number; monthChange: number }
  orderCount:      { today: number; week: number; month: number }
  fulfilledOrders: number
  totalOrders:     number
  totalShipping:   number
  totalTaxes:      number
  avgOrderValue:   number
  customers:       { total: number; repeat: number; returningRate: number }
  topProducts:     { title: string; revenue: number; unitsSold: number }[]
  chartData:       { date: string; revenue: number; orders: number }[]
}

export async function getAdminAnalytics(): Promise<AnalyticsData> {
  const [orders, customers] = await Promise.all([
    getAdminOrders(250),
    getAdminCustomers(250),
  ])

  const now   = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  function inRange(dateStr: string, daysAgo: number, endDaysAgo = 0): boolean {
    const d    = new Date(dateStr).getTime()
    const end  = endDaysAgo === 0 ? now.getTime() : now.getTime() - endDaysAgo * 86_400_000
    const from = now.getTime() - daysAgo * 86_400_000
    return d >= from && d < end
  }

  function sumRevenue(subset: typeof orders) { return subset.reduce((s, o) => s + o.total, 0) }

  const todayOrders     = orders.filter(o => o.date.slice(0, 10) === todayStr)
  const yesterdayStr    = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10)
  const yesterdayOrders = orders.filter(o => o.date.slice(0, 10) === yesterdayStr)
  const weekOrders      = orders.filter(o => inRange(o.date, 7))
  const lastWeekOrders  = orders.filter(o => inRange(o.date, 14, 7))

  const thisMonthStart  = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const lastMonthStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()
  const monthOrders     = orders.filter(o => new Date(o.date).getTime() >= thisMonthStart)
  const lastMonthOrders = orders.filter(o => {
    const t = new Date(o.date).getTime()
    return t >= lastMonthStart && t < thisMonthStart
  })

  function pctChange(curr: number, prev: number): number {
    if (prev === 0) return curr > 0 ? 100 : 0
    return Math.round(((curr - prev) / prev) * 100)
  }

  const todayRev     = sumRevenue(todayOrders)
  const yesterdayRev = sumRevenue(yesterdayOrders)
  const weekRev      = sumRevenue(weekOrders)
  const lastWeekRev  = sumRevenue(lastWeekOrders)
  const monthRev     = sumRevenue(monthOrders)
  const lastMonthRev = sumRevenue(lastMonthOrders)

  // Chart data — last 90 days, one point per day
  const chartMap: Record<string, { revenue: number; orders: number }> = {}
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10)
    chartMap[d] = { revenue: 0, orders: 0 }
  }
  for (const o of orders) {
    const d = o.date.slice(0, 10)
    if (chartMap[d]) {
      chartMap[d].revenue += o.total
      chartMap[d].orders  += 1
    }
  }
  const chartData = Object.entries(chartMap).map(([date, v]) => ({
    date:    date.slice(5),   // MM-DD for display
    revenue: Math.round(v.revenue * 100) / 100,
    orders:  v.orders,
  }))

  // Top products from line items
  const productMap: Record<string, { title: string; revenue: number; unitsSold: number }> = {}
  for (const o of orders) {
    for (const item of o.items) {
      const key = item.productId || item.title
      if (!productMap[key]) productMap[key] = { title: item.title, revenue: 0, unitsSold: 0 }
      productMap[key].revenue   += item.unitPrice * item.quantity
      productMap[key].unitsSold += item.quantity
    }
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(p => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }))

  const fulfilledOrders = orders.filter(o => o.fulfillmentStatus === 'fulfilled').length
  const totalOrders     = orders.length
  const totalRevenue    = sumRevenue(orders)
  const avgOrderValue   = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const totalShipping   = orders.reduce((s, o) => s + o.shipping, 0)
  const totalTaxes      = orders.reduce((s, o) => s + o.tax, 0)

  const repeatCustomers = customers.filter(c => c.orders > 1).length
  const returningRate   = customers.length > 0
    ? Math.round((repeatCustomers / customers.length) * 100) : 0

  return {
    revenue:         { today: todayRev, week: weekRev, month: monthRev, todayChange: pctChange(todayRev, yesterdayRev), weekChange: pctChange(weekRev, lastWeekRev), monthChange: pctChange(monthRev, lastMonthRev) },
    orderCount:      { today: todayOrders.length, week: weekOrders.length, month: monthOrders.length },
    fulfilledOrders, totalOrders, totalShipping, totalTaxes, avgOrderValue,
    customers:       { total: customers.length, repeat: repeatCustomers, returningRate },
    topProducts, chartData,
  }
}

// ─── Sold count ───────────────────────────────────────────────────────────────

/**
 * Increment the acme.sold_count metafield for each product in the order's
 * line items. Called when an order is marked In Transit (shipped).
 * Uses productId (not variantId) because metafields live on the product.
 */
export async function incrementSoldCount(
  lineItems: { productId: string; quantity: number }[]
): Promise<void> {
  for (const item of lineItems) {
    const gid = item.productId.startsWith('gid://')
      ? item.productId
      : `gid://shopify/Product/${item.productId}`

    // Read current sold_count
    const current = await adminFetch<{
      product: { metafield: { id: string; value: string } | null } | null
    }>(
      `query GetSoldCount($id: ID!) {
        product(id: $id) {
          metafield(namespace: "acme", key: "sold_count") {
            id
            value
          }
        }
      }`,
      { id: gid }
    )

    const existing = current.product?.metafield
    const newCount = (parseInt(existing?.value ?? '0', 10) || 0) + item.quantity

    // Upsert metafield
    await adminFetch(
      `mutation SetSoldCount($input: ProductInput!) {
        productUpdate(input: $input) {
          userErrors { field message }
        }
      }`,
      {
        input: {
          id: gid,
          metafields: [{
            namespace: 'acme',
            key:       'sold_count',
            type:      'number_integer',
            value:     String(newCount),
          }],
        },
      }
    )
  }
}

export async function hasCustomerPurchasedProduct(
  email: string,
  productHandle: string
): Promise<boolean> {
  type OrdersResponse = {
    orders: {
      edges: Array<{
        node: {
          lineItems: {
            edges: Array<{
              node: { product: { handle: string } | null }
            }>
          }
        }
      }>
    }
  }

  const data = await adminFetch<OrdersResponse>(
    `query CheckPurchase($email: String!) {
      orders(first: 250, query: $email) {
        edges {
          node {
            lineItems(first: 50) {
              edges {
                node {
                  product { handle }
                }
              }
            }
          }
        }
      }
    }`,
    { email: `email:${email}` }
  )

  return data.orders.edges.some(({ node: order }) =>
    order.lineItems.edges.some(({ node: item }) =>
      item.product?.handle === productHandle
    )
  )
}
