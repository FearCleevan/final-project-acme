import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getShopOwner } from '@/lib/admin/shopifyAdmin'

export async function GET() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const owner = await getShopOwner()
    return NextResponse.json(owner, { next: { revalidate: 3600 } } as never)
  } catch {
    return NextResponse.json({ name: 'Store Owner', email: '' })
  }
}
