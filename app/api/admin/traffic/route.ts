import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import {
  getAnalyticsSummary,
  getTopProducts,
  getTopPages,
  getDeviceBreakdown,
  getRecentViews,
} from '@/lib/analytics'

export async function GET() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [summary, topProducts, topPages, devices, recent] = await Promise.all([
    getAnalyticsSummary(),
    getTopProducts(30, 10),
    getTopPages(30, 10),
    getDeviceBreakdown(30),
    getRecentViews(20),
  ])

  return NextResponse.json({ summary, topProducts, topPages, devices, recent })
}
