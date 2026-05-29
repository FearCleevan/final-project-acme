import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { createAdminCollection } from '@/lib/admin/shopifyAdmin'

const DOMAIN  = process.env.SHOPIFY_STORE_DOMAIN!
const TOKEN   = process.env.SHOPIFY_ADMIN_TOKEN!
const GQL_URL = `https://${DOMAIN}/admin/api/2026-04/graphql.json`

export async function GET() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(GQL_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({
      query: `{
        collections(first: 50) {
          edges { node { id title handle productsCount { count } } }
        }
      }`,
    }),
    cache: 'no-store',
  })

  const { data } = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const collections = data.collections.edges.map((e: any) => ({
    id:           e.node.id.replace('gid://shopify/Collection/', ''),
    title:        e.node.title,
    handle:       e.node.handle,
    description:  '',
    productCount: e.node.productsCount?.count ?? 0,
  }))

  return NextResponse.json(collections)
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { title, handle, description } = body as {
      title: string
      handle?: string
      description?: string
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const collection = await createAdminCollection({
      title: title.trim(),
      handle: handle?.trim() || undefined,
      descriptionHtml: description?.trim() || undefined,
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
