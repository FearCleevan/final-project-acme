import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getAllReviewsAdmin } from '@/lib/reviews'

async function requireAdmin(): Promise<boolean> {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return !!session.isLoggedIn
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const filter = (req.nextUrl.searchParams.get('filter') ?? 'all') as 'all' | 'pending' | 'approved'
  const reviews = await getAllReviewsAdmin(filter)
  return NextResponse.json(reviews)
}
