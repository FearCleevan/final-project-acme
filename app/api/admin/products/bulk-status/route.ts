import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { updateProductStatus } from '@/lib/admin/shopifyAdmin'

async function requireAuth(): Promise<boolean> {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  if (!await requireAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let ids: string[]
  let status: 'ACTIVE' | 'DRAFT'

  try {
    const body = await req.json()
    ids = body.ids
    status = body.status === 'active' ? 'ACTIVE' : 'DRAFT'
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 })
    }
    if (ids.length > 250) {
      return NextResponse.json({ error: 'Maximum 250 products per bulk status update' }, { status: 400 })
    }
    if (body.status !== 'active' && body.status !== 'draft') {
      return NextResponse.json({ error: 'status must be "active" or "draft"' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const results: { id: string; ok: boolean; error?: string }[] = []

  for (const id of ids) {
    try {
      await updateProductStatus(id, status)
      results.push({ id, ok: true })
    } catch (err) {
      results.push({ id, ok: false, error: String(err) })
    }
    await sleep(300)
  }

  return NextResponse.json(results, { status: 200 })
}
