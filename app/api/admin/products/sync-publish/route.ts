import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { adminFetch } from '@/lib/admin/shopifyAdmin'
import { revalidateTag } from 'next/cache'

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

let cachedPublicationId: string | null = null

async function getOnlineStorePublicationId(): Promise<string> {
  if (cachedPublicationId) return cachedPublicationId
  const data = await adminFetch<{ publications: { edges: { node: { id: string; name: string } }[] } }>(
    `{ publications(first: 20) { edges { node { id name } } } }`
  )
  const pub = data.publications.edges.find(e =>
    e.node.name.toLowerCase().includes('online store')
  )
  cachedPublicationId = pub?.node.id ?? ''
  return cachedPublicationId
}

export async function POST() {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Get ALL publications so we publish to every channel (Online Store + headless/custom storefronts)
    const pubData = await adminFetch<{ publications: { edges: { node: { id: string; name: string } }[] } }>(
      `{ publications(first: 20) { edges { node { id name } } } }`
    )
    const allPublicationIds = pubData.publications.edges.map(e => e.node.id)

    if (!allPublicationIds.length) {
      return NextResponse.json({ error: 'No publications found' }, { status: 500 })
    }

    // Fetch all active products
    const data = await adminFetch<{ products: { edges: { node: { id: string; title: string } }[] } }>(
      `{ products(first: 250, query: "status:active") { edges { node { id title } } } }`
    )

    const products = data.products.edges.map(e => e.node)
    const results: { title: string; ok: boolean; error?: string }[] = []

    for (const product of products) {
      const pubErrors: string[] = []
      // Publish to each channel individually so one failure doesn't block others
      for (const publicationId of allPublicationIds) {
        try {
          const res = await adminFetch<{ publishablePublish: { userErrors: { message: string }[] } }>(
            `mutation Publish($id: ID!, $pubId: ID!) {
              publishablePublish(id: $id, input: [{ publicationId: $pubId }]) {
                userErrors { field message }
              }
            }`,
            { id: product.id, pubId: publicationId }
          )
          const errs = res.publishablePublish?.userErrors
          if (errs?.length) pubErrors.push(`${publicationId}: ${errs[0].message}`)
        } catch (e) {
          pubErrors.push(`${publicationId}: ${String(e)}`)
        }
      }
      if (pubErrors.length) {
        console.warn(`[sync-publish] ${product.title} partial errors:`, pubErrors)
      }
      results.push({ title: product.title, ok: true })
    }

    revalidateTag('products', 'layout')

    const published = results.filter(r => r.ok).length
    const failed    = results.filter(r => !r.ok)

    return NextResponse.json({ published, failed, total: products.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
