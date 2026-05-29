import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getAdminCollections, createAdminCollection } from '@/lib/admin/shopifyAdmin'
import { revalidateTag } from 'next/cache'

export async function GET() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const collections = await getAdminCollections()
    return NextResponse.json(collections)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { title, handle, description } = body as {
      title?: unknown
      handle?: string
      description?: string
    }

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const collection = await createAdminCollection({
      title: title.trim(),
      handle: handle?.trim() || undefined,
      descriptionHtml: description?.trim() || undefined,
    })

    revalidateTag('products', 'layout')
    return NextResponse.json(collection, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
