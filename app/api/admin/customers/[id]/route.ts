import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getAdminCustomerById, getAdminOrders } from '@/lib/admin/shopifyAdmin'

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const [customer, allOrders] = await Promise.all([
      getAdminCustomerById(id),
      getAdminOrders(250),
    ])
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    const orders = allOrders.filter(o => o.customer.email === customer.email)
    return NextResponse.json({ customer, orders })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
