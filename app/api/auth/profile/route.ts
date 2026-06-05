import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { customerSessionOptions, type CustomerSessionData } from '@/lib/customerSession'
import { getCustomerProfileCA } from '@/lib/shopifyCustomer'
import type { CustomerProfile, CustomerOrder, CustomerAddress } from '@/lib/shopifyCustomer'

// ─── JWT decode ───────────────────────────────────────────────────────────────

function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'))
  } catch {
    return null
  }
}

// ─── Admin API fallback ───────────────────────────────────────────────────────
// Uses the Shopify Admin API (server-side only) to fetch full customer
// profile + orders by email. Bypasses CA API entirely.

const ADMIN_DOMAIN   = process.env.SHOPIFY_STORE_DOMAIN!
const ADMIN_TOKEN    = process.env.SHOPIFY_ADMIN_TOKEN!
const ADMIN_ENDPOINT = `https://${ADMIN_DOMAIN}/admin/api/2025-01/graphql.json`

async function getProfileFromAdmin(email: string): Promise<CustomerProfile | null> {
  if (!ADMIN_DOMAIN || !ADMIN_TOKEN) return null
  try {
    const res = await fetch(ADMIN_ENDPOINT, {
      method:  'POST',
      headers: {
        'Content-Type':           'application/json',
        'X-Shopify-Access-Token': ADMIN_TOKEN,
      },
      body: JSON.stringify({
        query: `
          query GetCustomerByEmail($query: String!) {
            customers(first: 1, query: $query) {
              edges {
                node {
                  id firstName lastName email phone
                  defaultAddress {
                    id firstName lastName
                    address1 address2
                    city province country zip phone
                  }
                  addresses(first: 5) {
                    id firstName lastName
                    address1 address2
                    city province country zip phone
                  }
                  orders(first: 20, sortKey: CREATED_AT, reverse: true) {
                    edges {
                      node {
                        id name createdAt
                        displayFulfillmentStatus financialStatus
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
              }
            }
          }
        `,
        variables: { query: `email:${email}` },
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error('[profile/admin] HTTP error:', res.status)
      return null
    }

    const { data, errors } = await res.json()
    if (errors?.length) {
      console.error('[profile/admin] GraphQL errors:', errors)
      return null
    }

    const node = data?.customers?.edges?.[0]?.node
    if (!node) {
      console.warn('[profile/admin] no customer found for email:', email)
      return null
    }

    // Normalise Admin address → CustomerAddress
    function normalizeAddr(a: Record<string, unknown>): CustomerAddress {
      return {
        id:        String(a.id ?? ''),
        firstName: (a.firstName as string) ?? null,
        lastName:  (a.lastName  as string) ?? null,
        address1:  (a.address1  as string) ?? null,
        address2:  (a.address2  as string) ?? null,
        city:      (a.city      as string) ?? null,
        province:  (a.province  as string) ?? null,
        country:   (a.country   as string) ?? null,
        zip:       (a.zip       as string) ?? null,
        phone:     (a.phone     as string) ?? null,
      }
    }

    // Normalise Admin order → CustomerOrder
    function normalizeOrder(o: Record<string, unknown>): CustomerOrder {
      type MoneyBag = { shopMoney: { amount: string; currencyCode: string } }
      const defaultMoney = { amount: '0', currencyCode: 'CAD' }
      const money    = ((o.totalPriceSet as MoneyBag | null)?.shopMoney)        ?? defaultMoney
      const liEdges  = ((o.lineItems as { edges: { node: Record<string,unknown> }[] } | null)
                          ?.edges) ?? []
      return {
        id:                   String(o.id ?? ''),
        name:                 String(o.name ?? ''),
        processedAt:          String(o.createdAt ?? ''),
        fulfillmentStatus:    String(o.displayFulfillmentStatus ?? 'UNFULFILLED'),
        financialStatus:      String(o.financialStatus ?? 'PENDING'),
        totalPriceV2:         money,
        subtotalPriceV2:      null,
        totalShippingPriceV2: { amount: '0', currencyCode: money.currencyCode },
        lineItems: {
          edges: liEdges.map(e => {
            const unitPrice = ((e.node.originalUnitPriceSet as MoneyBag | null)?.shopMoney)
                                ?? defaultMoney
            return {
              node: {
                title:    String(e.node.title ?? ''),
                quantity: Number(e.node.quantity ?? 1),
                variant:  {
                  image:   (e.node.image as { url: string } | null) ?? null,
                  priceV2: unitPrice,
                },
              },
            }
          }),
        },
        successfulFulfillments: [],
        shippingAddress: o.shippingAddress
          ? normalizeAddr(o.shippingAddress as Record<string,unknown>)
          : null,
      }
    }

    // Admin addresses is a flat array (not connection)
    const rawAddrs = (node.addresses as Record<string,unknown>[]) ?? []
    const ordEdges = ((node.orders as { edges: { node: Record<string,unknown> }[] } | null)
                        ?.edges) ?? []

    return {
      id:             String(node.id).split('/').pop() ?? '',
      firstName:      (node.firstName as string) ?? null,
      lastName:       (node.lastName  as string) ?? null,
      email:          String(node.email ?? ''),
      phone:          (node.phone     as string) ?? null,
      defaultAddress: node.defaultAddress
                        ? normalizeAddr(node.defaultAddress as Record<string,unknown>)
                        : null,
      addresses: { edges: rawAddrs.map(a => ({ node: normalizeAddr(a) })) },
      orders:    { edges: ordEdges.map(e => ({ node: normalizeOrder(e.node) })) },
    }
  } catch (err) {
    console.error('[profile/admin] fetch threw:', err)
    return null
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await getIronSession<CustomerSessionData>(
    await cookies(),
    customerSessionOptions
  )

  if (!session.accessToken || !session.expiresAt || Date.now() > session.expiresAt) {
    return NextResponse.json({ profile: null }, { status: 401 })
  }

  // 1 — Try Customer Account API (full data, no Admin token needed)
  try {
    const full = await getCustomerProfileCA(session.accessToken)
    if (full) {
      console.log('[profile] CA API success')
      return NextResponse.json({ profile: full })
    }
  } catch (err) {
    console.error('[profile] CA API threw:', err)
  }

  // 2 — Decode id_token to get at least the email
  const claims = session.idToken ? decodeJWT(session.idToken) : null
  const email  = (claims?.email as string) ?? null

  // 3 — Admin API: full profile (name + orders + addresses) by email
  if (email) {
    try {
      const admin = await getProfileFromAdmin(email)
      if (admin) {
        console.log('[profile] Admin API success for', email)
        return NextResponse.json({ profile: admin })
      }
    } catch (err) {
      console.error('[profile] Admin API threw:', err)
    }
  }

  // 4 — Bare minimum from id_token (email only)
  if (claims && email) {
    const bare: CustomerProfile = {
      id:             String((claims.sub as string ?? '').split('/').pop() ?? ''),
      firstName:      (claims.given_name  as string) ?? null,
      lastName:       (claims.family_name as string) ?? null,
      email,
      phone:          (claims.phone_number as string) ?? null,
      defaultAddress: null,
      addresses:      { edges: [] },
      orders:         { edges: [] },
    }
    console.log('[profile] id_token bare fallback for', email)
    return NextResponse.json({ profile: bare })
  }

  return NextResponse.json({ profile: null })
}
