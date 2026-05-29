import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getInventoryItemIdForProduct, setInventoryQuantity } from '@/lib/admin/shopifyAdmin'

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await requireAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const body = await req.json().catch(() => ({}))
  const quantity = Number(body.quantity)

  if (!Number.isInteger(quantity) || quantity < 0) {
    return NextResponse.json(
      { error: 'quantity must be a non-negative integer' },
      { status: 400 }
    )
  }

  try {
    const inventoryItemId = await getInventoryItemIdForProduct(id)
    if (!inventoryItemId) {
      return NextResponse.json(
        { error: 'Product not found or has no inventory item' },
        { status: 404 }
      )
    }

    await setInventoryQuantity(inventoryItemId, quantity)
    return NextResponse.json({ ok: true, stock: quantity })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
