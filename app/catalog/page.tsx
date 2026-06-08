import { Suspense } from 'react'
import { getAllProducts } from '@/lib/shopify'
import type { Metadata } from 'next'
import CatalogClient from './CatalogClient'

export const metadata: Metadata = {
  title: 'Oil Lamp Chimneys, Shades & Enamel Signs — Full Catalog',
  description: 'Browse our full catalog of oil lamp chimneys, glass shades, pressure lamp glass, wicks, and original Victorian enamel advertising signs. All items bench-tested and shipped across Canada and North America.',
  keywords: [
    'oil lamp chimneys for sale',
    'oil lamp shades for sale',
    'buy oil lamp chimneys',
    'duplex chimney', 'kosmos chimney', 'miller chimney', 'crimp chimney',
    'hurricane lamp glass', 'pressure lamp glass', 'Coleman lamp glass',
    'tulip shade', 'beehive shade', 'Victorian lamp shade',
    'enamel advertising signs for sale', 'antique enamel signs',
    'oil lamp parts Canada', 'oil lamp supply online',
  ],
  alternates: { canonical: '/catalog' },
  openGraph: {
    title: 'Oil Lamp Chimneys, Shades & Enamel Signs — Full Catalog',
    description: 'Browse oil lamp chimneys, glass shades, pressure lamp glass, and original Victorian enamel advertising signs. Shipped across Canada and North America.',
    url: '/catalog',
  },
}

export default async function CatalogPage() {
  const products = await getAllProducts()
  return (
    <Suspense fallback={null}>
      <CatalogClient products={products} />
    </Suspense>
  )
}
