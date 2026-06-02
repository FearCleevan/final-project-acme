import type { Metadata } from 'next'
import { getAllProducts } from '@/lib/shopify'
import CatalogClient from '@/app/catalog/CatalogClient'

export const metadata: Metadata = {
  title: 'Signs | Acme Vintage Supply',
  description:
    'Triple-fired porcelain signs. Original dies, original process. Each piece bench-inspected before dispatch.',
}

export default async function SignsPage() {
  const products = await getAllProducts()
  return (
    <CatalogClient
      products={products}
      initialCategory="signs"
      title="Signs"
      crumbs={[
        { label: 'Storefront', href: '/' },
        { label: 'Signs' },
      ]}
    />
  )
}
