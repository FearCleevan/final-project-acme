import { getAllProducts } from '@/lib/shopify'
import CatalogClient from './CatalogClient'

export default async function CatalogPage() {
  const products = await getAllProducts()
  return <CatalogClient products={products} />
}
