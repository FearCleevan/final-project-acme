// Run once: node scripts/reset-sold-counts.mjs
// Resets all acme.sold_count metafields to 0 across all products

import { config } from 'dotenv'
config({ path: '.env.local' })

const DOMAIN  = process.env.SHOPIFY_STORE_DOMAIN
const TOKEN   = process.env.SHOPIFY_ADMIN_TOKEN
const VERSION = '2026-04'
const GQL_URL = `https://${DOMAIN}/admin/api/${VERSION}/graphql.json`

async function gql(query, variables = {}) {
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables }),
  })
  const { data, errors } = await res.json()
  if (errors?.length) throw new Error(errors[0].message)
  return data
}

async function getAllProducts() {
  const products = []
  let cursor = null

  while (true) {
    const data = await gql(`
      query($cursor: String) {
        products(first: 50, after: $cursor) {
          edges {
            cursor
            node {
              id
              title
              metafields(first: 10, namespace: "acme") {
                edges { node { id key value } }
              }
            }
          }
          pageInfo { hasNextPage }
        }
      }
    `, { cursor })

    const edges = data.products.edges
    products.push(...edges.map(e => e.node))
    if (!data.products.pageInfo.hasNextPage) break
    cursor = edges[edges.length - 1].cursor
  }

  return products
}

async function resetSoldCount(productId) {
  return gql(`
    mutation($input: ProductInput!) {
      productUpdate(input: $input) {
        userErrors { field message }
      }
    }
  `, {
    input: {
      id: productId,
      metafields: [{ namespace: 'acme', key: 'sold_count', type: 'number_integer', value: '0' }],
    }
  })
}

async function main() {
  console.log('Fetching all products...')
  const products = await getAllProducts()
  console.log(`Found ${products.length} products`)

  let reset = 0
  let skipped = 0

  for (const product of products) {
    const soldField = product.metafields.edges
      .map(e => e.node)
      .find(m => m.key === 'sold_count')

    if (!soldField) { skipped++; continue }
    if (soldField.value === '0') { skipped++; continue }

    console.log(`Resetting "${product.title}" — was ${soldField.value}`)
    await resetSoldCount(product.id)
    reset++
  }

  console.log(`\nDone. Reset: ${reset}, Skipped (already 0 or no metafield): ${skipped}`)
}

main().catch(console.error)
