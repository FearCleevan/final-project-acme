import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getBackInStockRequests, markNotified } from '@/lib/backInStock'
import { sendBackInStockEmail } from '@/lib/email'

async function requireAuth(): Promise<boolean> {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!await requireAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const handle = req.nextUrl.searchParams.get('handle')
  if (!handle) {
    return NextResponse.json({ error: 'handle required' }, { status: 400 })
  }

  const requests = await getBackInStockRequests(handle)
  return NextResponse.json({ count: requests.length })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!await requireAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json().catch(() => null)
  if (
    !body ||
    typeof body !== 'object' ||
    !('productHandle' in body) ||
    typeof (body as Record<string, unknown>).productHandle !== 'string'
  ) {
    return NextResponse.json({ error: 'productHandle required' }, { status: 400 })
  }

  const { productHandle } = body as { productHandle: string }

  const requests = await getBackInStockRequests(productHandle)
  if (requests.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  let sent = 0
  const notifiedIds: string[] = []

  for (const entry of requests) {
    try {
      await sendBackInStockEmail(entry.email, entry.productTitle, entry.productHandle)
      notifiedIds.push(entry.id)
      sent++
    } catch {
      // Log failure but continue to next recipient
    }
  }

  if (notifiedIds.length > 0) {
    await markNotified(notifiedIds)
  }

  return NextResponse.json({ ok: true, sent })
}
