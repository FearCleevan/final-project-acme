export async function getAdminProducts(first = 250): Promise<AdminProduct[]> {
  let allProducts: AdminProduct[] = []
  let hasNextPage = true
  let after: string | null = null
  
  while (hasNextPage) {
    const data = await adminFetch<{ 
      products: { 
        edges: { node: ShopifyProductNode }[]
        pageInfo: { hasNextPage: boolean; endCursor: string | null }
      } 
    }>(
      `query GetProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          edges { node { ${PRODUCT_FIELDS} } }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { first, after }
    )
    
    allProducts = allProducts.concat(data.products.edges.map(e => toAdminProduct(e.node)))
    hasNextPage = data.products.pageInfo.hasNextPage
    after = data.products.pageInfo.endCursor
  }
  
  return allProducts
}
