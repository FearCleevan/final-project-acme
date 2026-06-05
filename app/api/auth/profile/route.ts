import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { customerSessionOptions, type CustomerSessionData } from '@/lib/customerSession'
import type { CustomerProfile, CustomerOrder, CustomerAddress } from '@/lib/shopifyCustomer'

// ─── Admin API helpers (same pattern as admin dashboard) ──────────────────────

const ADMIN_ENDPOINT = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2026-04/graphql.json`
const ADMIN_TOKEN    = process.env.SHOPIFY_ADMIN_TOKEN ?? ''

async function adminFetch<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  if (!ADMIN_TOKEN) { console.error('[profile/admin] SHOPIFY_ADMIN_TOKEN not set'); return null }
  try {
    const res = await fetch(ADMIN_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': ADMIN_TOKEN },
      body:    JSON.stringify({ query, variables }),
      cache:   'no-store',
    })
    if (!res.ok) { console.error('[profile/admin] HTTP', res.status); return null }
    const { data, errors } = await res.json()
    if (errors?.length) { console.error('[profile/admin] GraphQL errors:', JSON.stringify(errors, null, 2)); return null }
    return data as T
  } catch (err) {
    console.error('[profile/admin] fetch error:', err)
    return null
  }
}

// ── Query 1: customer info by email ───────────────────────────────────────────
// Admin API: customer.addresses is a FLAT ARRAY — no (first:N) or edges/node

async function getAdminCustomer(email: string) {
  return adminFetch<{
    customers: { edges: { node: {
      id:             string
      firstName:      string | null
      lastName:       string | null
      email:          string
      phone:          string | null
      defaultAddress: Record<string, string> | null
      addresses:      Record<string, string>[]
    } }[] }
  }>(`
    query GetCustomerByEmail($q: String!) {
      customers(first: 1, query: $q) {
        edges {
          node {
            id firstName lastName email phone
            defaultAddress {
              id firstName lastName
              address1 address2
              city province country zip phone
            }
            addresses {
              id firstName lastName
              address1 address2
              city province country zip phone
            }
          }
        }
      }
    }
  `, { q: `email:${email}` })
}

// ── Query 2: orders by email (top-level orders query, not nested in customer) ─
// Uses displayFinancialStatus / displayFulfillmentStatus (Admin API 2026-04)

async function getAdminOrders(email: string) {
  return adminFetch<{
    orders: { edges: { node: Record<string, unknown> }[] }
  }>(`
    query GetOrdersByEmail($q: String!) {
      orders(first: 20, query: $q, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id name createdAt
            displayFulfillmentStatus displayFinancialStatus
            totalPriceSet { shopMoney { amount currencyCode } }
            lineItems(first: 10) {
              edges {
                node {
                  title quantity
                  image { url }
                  originalUnitPriceSet { shopMoney { amount currencyCode } }
                }
              }
            }
            shippingAddress {
              firstName lastName
              address1 address2
              city province country zip phone
            }
          }
        }
      }
    }
  `, { q: `email:${email}` })
}

// ── Normalizers ───────────────────────────────────────────────────────────────

function normalizeAddr(a: Record<string, string>): CustomerAddress {
  return {
    id:        a.id        ?? '',
    firstName: a.firstName ?? null,
    lastName:  a.lastName  ?? null,
    address1:  a.address1  ?? null,
    address2:  a.address2  ?? null,
    city:      a.city      ?? null,
    province:  a.province  ?? null,
    country:   a.country   ?? null,
    zip:       a.zip       ?? null,
    phone:     a.phone     ?? null,
  }
}

// Map Admin API display statuses → Storefront-compatible values
const FULFILLMENT_MAP: Record<string, string> = {
  FULFILLED:          'FULFILLED',
  UNFULFILLED:        'UNFULFILLED',
  PARTIALLY_FULFILLED:'PARTIALLY_FULFILLED',
  IN_PROGRESS:        'IN_PROGRESS',
  ON_HOLD:            'ON_HOLD',
  SCHEDULED:          'SCHEDULED',
  OPEN:               'UNFULFILLED',
}

const FINANCIAL_MAP: Record<string, string> = {
  PAID:               'PAID',
  PENDING:            'PENDING',
  REFUNDED:           'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  PARTIALLY_PAID:     'PARTIALLY_PAID',
  VOIDED:             'VOIDED',
}

function normalizeOrder(o: Record<string, unknown>): CustomerOrder {
  type Money = { amount: string; currencyCode: string }
  type MoneyBag = { shopMoney: Money }
  const fallback: Money = { amount: '0', currencyCode: 'CAD' }
  const total   = ((o.totalPriceSet as MoneyBag | null)?.shopMoney) ?? fallback
  const liEdges = ((o.lineItems as { edges: { node: Record<string, unknown> }[] } | null)?.edges) ?? []

  const rawFulfill  = String(o.displayFulfillmentStatus ?? o.fulfillmentStatus ?? 'UNFULFILLED')
  const rawFinancial = String(o.displayFinancialStatus  ?? o.financialStatus   ?? 'PENDING')

  return {
    id:                   String(o.id   ?? ''),
    name:                 String(o.name ?? ''),
    processedAt:          String(o.createdAt ?? ''),
    fulfillmentStatus:    FULFILLMENT_MAP[rawFulfill]  ?? rawFulfill,
    financialStatus:      FINANCIAL_MAP[rawFinancial]  ?? rawFinancial,
    totalPriceV2:         total,
    subtotalPriceV2:      null,
    totalShippingPriceV2: { amount: '0', currencyCode: total.currencyCode },
    lineItems: {
      edges: liEdges.map(e => {
        const unitPrice = ((e.node.originalUnitPriceSet as MoneyBag | null)?.shopMoney) ?? fallback
        return {
          node: {
            title:    String(e.node.title    ?? ''),
            quantity: Number(e.node.quantity ?? 1),
            variant:  { image: (e.node.image as { url: string } | null) ?? null, priceV2: unitPrice },
          },
        }
      }),
    },
    successfulFulfillments: [],
    shippingAddress: o.shippingAddress
      ? normalizeAddr(o.shippingAddress as Record<string, string>)
      : null,
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getIronSession<CustomerSessionData>(
      await cookies(),
      customerSessionOptions
    )

    if (!session.accessToken || !session.expiresAt || Date.now() > session.expiresAt) {
      return NextResponse.json({ profile: null }, { status: 401 })
    }

    const email = session.email ?? null
    console.log('[profile] session email:', email)

    // ── Shopify Admin API — two clean queries (same pattern as admin dashboard) ──
    if (email) {
      try {
        const [custData, ordData] = await Promise.all([
          getAdminCustomer(email),
          getAdminOrders(email),
        ])

        const node       = custData?.customers?.edges?.[0]?.node
        const orderEdges = ordData?.orders?.edges ?? []

        console.log('[profile] Admin customer:', node?.email ?? 'null', '| orders:', orderEdges.length)

        if (node || orderEdges.length > 0) {
          const profile: CustomerProfile = {
            id:        String(node?.id ?? '').split('/').pop() ?? '',
            firstName: node?.firstName ?? null,
            lastName:  node?.lastName  ?? null,
            email:     node?.email     ?? email,
            phone:     node?.phone     ?? null,
            defaultAddress: node?.defaultAddress
              ? normalizeAddr(node.defaultAddress)
              : null,
            addresses: {
              edges: (node?.addresses ?? []).map(a => ({ node: normalizeAddr(a) })),
            },
            orders: {
              edges: orderEdges.map(e => ({ node: normalizeOrder(e.node) })),
            },
          }
          console.log('[profile] ✓ Admin API — orders:', profile.orders.edges.length)
          return NextResponse.json({ profile })
        }

        console.warn('[profile] Admin API — no data found for', email)
      } catch (err) {
        console.error('[profile] Admin API error:', err)
      }
    }

    // ── Bare minimum from session email only (no JWT parsing to avoid crashes) ──
    if (email) {
      console.log('[profile] ✓ bare fallback — email:', email)
      const bare: CustomerProfile = {
        id:             '',
        firstName:      null,
        lastName:       null,
        email,
        phone:          null,
        defaultAddress: null,
        addresses:      { edges: [] },
        orders:         { edges: [] },
      }
      return NextResponse.json({ profile: bare })
    }

    console.error('[profile] ✗ no email in session — cannot build profile')
    return NextResponse.json({ profile: null })

  } catch (err) {
    console.error('[profile] unhandled error:', err)
    return NextResponse.json({ profile: null }, { status: 500 })
  }
}
