import type { Metadata } from 'next'
import { getAllProducts } from '@/lib/shopify'
import CatalogClient from '@/app/catalog/CatalogClient'

export const metadata: Metadata = {
  title: 'Vintage Enamel Advertising Signs — Buy Online',
  description: 'Original Victorian enamel advertising signs — Hinks, Veritas, Cadbury and more. Triple-fired porcelain, original dies. Each piece bench-inspected. Ships across Canada and North America.',
  keywords: [
    'enamel advertising signs',
    'antique enamel signs',
    'vintage enamel signs for sale',
    'porcelain advertising signs',
    'Victorian enamel signs',
    'Hinks enamel sign',
    'Veritas enamel sign',
    'buy enamel signs Canada',
    'original enamel signs',
    'vintage signs North America',
    'antique porcelain signs',
    'enamel signs shop',
  ],
  alternates: { canonical: '/signs' },
  openGraph: {
    title: 'Vintage Enamel Advertising Signs — Acme Vintage Supply',
    description: 'Original Victorian enamel advertising signs — Hinks, Veritas, Cadbury. Triple-fired porcelain, bench-inspected, ships across Canada and North America.',
    url: '/signs',
  },
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
