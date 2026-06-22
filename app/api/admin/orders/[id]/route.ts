import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getAdminOrderById } from '@/lib/admin/shopifyAdmin'
import { getCustomFulfillmentEvents } from '@/lib/fulfillmentEvents'

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const order = await getAdminOrderById(id)
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Merge in pre-transit events stored in Redis (stages added before a Shopify fulfillment existed)
    const customEvents = await getCustomFulfillmentEvents(id)
    if (customEvents.length > 0) {
      const shopifyStatuses = new Set(order.fulfillmentEvents.map(e => e.status))
      const extraEvents = customEvents.filter(e => !shopifyStatuses.has(e.status))
      if (extraEvents.length > 0) {
        order.fulfillmentEvents = [...order.fulfillmentEvents, ...extraEvents]
          .sort((a, b) => new Date(a.happenedAt).getTime() - new Date(b.happenedAt).getTime())
      }
    }

    return NextResponse.json(order)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
