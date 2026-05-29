import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { updateAdminCollection, deleteAdminCollection } from '@/lib/admin/shopifyAdmin'

type Params = { params: Promise<{ id: string }> }

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

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

    const collection = await updateAdminCollection(id, {
      title: title.trim(),
      handle: handle?.trim() || undefined,
      descriptionHtml: description?.trim() || undefined,
    })

    return NextResponse.json(collection)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await deleteAdminCollection(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
