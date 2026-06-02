import type { Metadata } from 'next'
import { getAllProducts } from '@/lib/shopify'
import CatalogClient from '@/app/catalog/CatalogClient'

export const metadata: Metadata = {
  title: 'Advertising Signs | Acme Vintage Supply',
  description:
    'Triple-fired porcelain advertising signs. Original dies, original process. Each piece bench-inspected before dispatch.',
}

export default async function SignsPage() {
  const products = await getAllProducts()
  return (
    <CatalogClient
      products={products}
      initialCategory="signs"
      title="Advertising Signs"
      crumbs={[
        { label: 'Storefront', href: '/' },
        { label: 'Signs' },
      ]}
    />
  )
}
