import { NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/shopify'

export async function GET() {
  try {
    const products = await getAllProducts()
    const slim = products.map(p => ({
      id:               p.id,
      slug:             p.slug,
      sku:              p.sku,
      name:             p.name,
      price:            p.price,
      images:           p.images.slice(0, 1),
      shortDescription: p.shortDescription,
      burnerSize:       p.burnerSize,
      featured:         p.featured,
    }))
    return NextResponse.json(slim, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
