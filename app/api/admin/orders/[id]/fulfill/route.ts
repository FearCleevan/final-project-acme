import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getOrderFulfillmentOrderId, createFulfillment, createFulfillmentEvent, incrementSoldCount } from '@/lib/admin/shopifyAdmin'
import type { FulfillmentEvent, FulfillmentEventStatus } from '@/lib/admin/types'
import { addCustomFulfillmentEvent } from '@/lib/fulfillmentEvents'

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const body = await req.json() as {
    stage: FulfillmentEventStatus
    trackingNumber?: string
    carrier?: string
    notifyCustomer: boolean
    fulfillmentId?: string
    lineItems?: { productId: string; quantity: number }[]
  }

  try {
    let shopifyFulfillmentId = body.fulfillmentId ?? null

    if (body.stage === 'in_transit') {
      if (shopifyFulfillmentId) {
        // Order already fulfilled in Shopify — just create the IN_TRANSIT event so it persists
        await createFulfillmentEvent(shopifyFulfillmentId, 'in_transit')
      } else {
        const fulfillmentOrderId = await getOrderFulfillmentOrderId(id)
        if (!fulfillmentOrderId) {
          return NextResponse.json({ error: 'No fulfillment order found — check Shopify API scopes' }, { status: 400 })
        }
        shopifyFulfillmentId = await createFulfillment(
          fulfillmentOrderId,
          body.trackingNumber ?? '',
          body.carrier ?? 'Other',
          body.notifyCustomer,
        )
        // Create IN_TRANSIT event so "Shipped" persists across page loads
        await createFulfillmentEvent(shopifyFulfillmentId, 'in_transit')
      }
      // Increment sold_count metafield for each product in this order
      if (body.lineItems?.length) {
        await incrementSoldCount(body.lineItems.filter(i => i.productId))
      }
    } else if (shopifyFulfillmentId) {
      await createFulfillmentEvent(shopifyFulfillmentId, body.stage)
    }

    const event: FulfillmentEvent = {
      id:          `fe-${id}-${Date.now()}`,
      status:      body.stage,
      message:     '',
      happenedAt:  new Date().toISOString(),
      ...(body.stage === 'in_transit' && body.trackingNumber
        ? { trackingNumber: body.trackingNumber, carrier: body.carrier }
        : {}),
    }

    // Pre-transit stages (no Shopify fulfillment yet) — persist in Redis so they survive page reload
    if (body.stage !== 'in_transit' && !shopifyFulfillmentId) {
      await addCustomFulfillmentEvent(id, event)
    }

    return NextResponse.json({ event, fulfillmentId: shopifyFulfillmentId })
  } catch (err) {
    console.error('[fulfill]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
