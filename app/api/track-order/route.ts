import { NextRequest, NextResponse } from 'next/server'
import { adminFetch } from '@/lib/admin/shopifyAdmin'
import { getCustomFulfillmentEvents } from '@/lib/fulfillmentEvents'

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

    // Merge pre-transit custom events from Redis (e.g. "Packed at Workshop")
    // These are stored with lowercase statuses — uppercase them to match the customer timeline format
    const customEvents = await getCustomFulfillmentEvents(node.name.replace('#', ''))
    if (customEvents.length > 0) {
      const shopifyStatuses = new Set(
        result.fulfillments.flatMap(f => f.events.map(e => e.status))
      )
      const extraEvents = customEvents
        .filter(e => !shopifyStatuses.has(e.status.toUpperCase()))
        .map(e => ({
          status:     e.status.toUpperCase(),
          happenedAt: e.happenedAt,
        }))

      if (extraEvents.length > 0) {
        if (result.fulfillments.length > 0) {
          // Add to the latest fulfillment's event list
          result.fulfillments[result.fulfillments.length - 1].events = [
            ...extraEvents,
            ...result.fulfillments[result.fulfillments.length - 1].events,
          ].sort((a, b) => new Date(a.happenedAt).getTime() - new Date(b.happenedAt).getTime())
        } else {
          // No Shopify fulfillment yet — synthesize a virtual one so the timeline renders
          result.fulfillments = [{
            status:       'PENDING',
            updatedAt:    extraEvents[extraEvents.length - 1].happenedAt,
            trackingInfo: [],
            events:       extraEvents,
          }]
        }
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[track-order]', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
