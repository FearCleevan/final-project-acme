import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getAdminProducts, getAdminOrders, getAdminCustomers } from '@/lib/admin/shopifyAdmin'
import type { AdminProduct, AdminOrder, AdminCustomer } from '@/lib/admin/types'

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

const MAX_RESULTS = 5
const CACHE_TTL_MS = 30_000

let cache: { products: AdminProduct[]; orders: AdminOrder[]; customers: AdminCustomer[]; ts: number } | null = null

async function getSearchData() {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) return cache
  const [products, orders, customers] = await Promise.all([
    getAdminProducts(),
    getAdminOrders(250),
    getAdminCustomers(250),
  ])
  cache = { products, orders, customers, ts: Date.now() }
  return cache
}

function norm(s: string | null | undefined): string {
  return (s ?? '').toLowerCase()
}

export async function GET(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = norm(req.nextUrl.searchParams.get('q')?.trim())
  if (!q) return NextResponse.json({ products: [], orders: [], customers: [] })

  try {
    const { products, orders, customers } = await getSearchData()

    const matchedProducts = products
      .filter(p =>
        norm(p.title).includes(q) ||
        norm(p.sku).includes(q) ||
        norm(p.id).includes(q) ||
        norm(p.handle).includes(q) ||
        p.tags.some(t => norm(t).includes(q))
      )
      .slice(0, MAX_RESULTS)

    const matchedOrders = orders
      .filter(o => {
        const orderNumber = norm(o.id).replace(/^#/, '')
        return (
          norm(o.id).includes(q) ||
          orderNumber.includes(q.replace(/^#/, '')) ||
          norm(o.customer.name).includes(q) ||
          norm(o.customer.email).includes(q) ||
          norm(o.trackingRef).includes(q) ||
          o.items.some(item => norm(item.title).includes(q) || norm(item.sku).includes(q)) ||
          o.fulfillmentEvents.some(e => norm(e.carrier).includes(q) || norm(e.trackingNumber).includes(q))
        )
      })
      .slice(0, MAX_RESULTS)

    const matchedCustomers = customers
      .filter(c => norm(c.name).includes(q) || norm(c.email).includes(q))
      .slice(0, MAX_RESULTS)

    return NextResponse.json({
      products: matchedProducts,
      orders: matchedOrders,
      customers: matchedCustomers,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
