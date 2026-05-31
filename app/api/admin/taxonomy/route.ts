import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { adminFetch } from '@/lib/admin/shopifyAdmin'

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

interface TaxCategoryNode {
  id: string
  name: string
  fullName: string
  level: number
  isLeaf: boolean
}

export async function GET(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q') ?? ''

  try {
    const data = await adminFetch<{
      taxonomy: {
        categories: {
          edges: { node: TaxCategoryNode }[]
        }
      } | null
    }>(
      `query TaxonomySearch($search: String) {
        taxonomy {
          categories(first: 50, search: $search) {
            edges {
              node {
                id
                name
                fullName
                level
                isLeaf
              }
            }
          }
        }
      }`,
      { search: q || null }
    )

    const categories = data.taxonomy?.categories?.edges?.map(e => ({
      id:       e.node.id,
      name:     e.node.name,
      fullName: e.node.fullName,
      level:    e.node.level,
      isLeaf:   e.node.isLeaf,
    })) ?? []

    return NextResponse.json(categories)
  } catch (err) {
    console.error('[taxonomy] error:', String(err))
    return NextResponse.json([], { status: 200 })
  }
}
