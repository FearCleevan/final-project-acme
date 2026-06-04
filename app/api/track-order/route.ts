import { NextRequest, NextResponse } from 'next/server'
import { adminFetch } from '@/lib/admin/shopifyAdmin'

export interface TrackOrderResult {
  name: string
  processedAt: string
  fulfillmentStatus: string
  financialStatus: string
  shippingAddress: {
    firstName: string
    lastName: string
    city: string
    province: string
    country: string
  } | null
  lineItems: {
    title: string
    quantity: number
  }[]
  fulfillments: {
    status: string
    updatedAt: string
    trackingInfo: { number: string | null; url: string | null; company: string | null }[]
    events: { status: string; happenedAt: string }[]
  }[]
}

export async function POST(req: NextRequest) {
  try {
    const { orderName, email } = await req.json() as { orderName?: string; email?: string }

    if (!orderName || !email) {
      return NextResponse.json({ error: 'Order number and email are required.' }, { status: 400 })
    }

    // Normalize order name — accept "1001" or "#1001"
    const name = orderName.trim().startsWith('#')
      ? orderName.trim()
      : `#${orderName.trim()}`

    const query = `name:${name} email:${email.trim().toLowerCase()}`

    const data = await adminFetch<{
      orders: {
        edges: {
          node: {
            name: string
            processedAt: string
            displayFulfillmentStatus: string
            displayFinancialStatus: string
            shippingAddress: {
              firstName: string
              lastName: string
              city: string
              province: string
              country: string
            } | null
            lineItems: {
              edges: { node: { title: string; quantity: number } }[]
            }
            fulfillments: {
              status: string
              updatedAt: string
              trackingInfo: { number: string | null; url: string | null; company: string | null }[]
              events: {
                edges: { node: { status: string; happenedAt: string } }[]
              }
            }[]
          }
        }[]
      }
    }>(
      `query TrackOrder($query: String!) {
        orders(first: 1, query: $query) {
          edges {
            node {
              name
              processedAt
              displayFulfillmentStatus
              displayFinancialStatus
              shippingAddress {
                firstName lastName city province country
              }
              lineItems(first: 10) {
                edges { node { title quantity } }
              }
              fulfillments {
                status
                updatedAt
                trackingInfo { number url company }
                events(first: 10) {
                  edges { node { status happenedAt } }
                }
              }
            }
          }
        }
      }`,
      { query }
    )

    const node = data.orders.edges[0]?.node
    if (!node) {
      return NextResponse.json({ error: 'not-found' }, { status: 404 })
    }

    const result: TrackOrderResult = {
      name:              node.name,
      processedAt:       node.processedAt,
      fulfillmentStatus: node.displayFulfillmentStatus,
      financialStatus:   node.displayFinancialStatus,
      shippingAddress:   node.shippingAddress,
      lineItems:         node.lineItems.edges.map(e => ({
        title:    e.node.title,
        quantity: e.node.quantity,
      })),
      fulfillments: node.fulfillments.map(f => ({
        status:       f.status,
        updatedAt:    f.updatedAt,
        trackingInfo: f.trackingInfo,
        events:       f.events.edges.map(e => e.node),
      })),
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[track-order]', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
