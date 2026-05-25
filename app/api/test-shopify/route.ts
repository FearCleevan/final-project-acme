import { shopifyFetch } from '@/lib/shopify'
import { NextResponse } from 'next/server'

export async function GET() {
  const { status, body } = await shopifyFetch<unknown>({
    query: `{ shop { name } products(first: 3) { edges { node { id title } } } }`,
  })
  return NextResponse.json({ status, body })
}
