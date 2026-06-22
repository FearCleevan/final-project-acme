import { NextRequest, NextResponse } from 'next/server'
import { addBackInStockRequest } from '@/lib/backInStock'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

    const { email, productHandle, productTitle } = body as {
      email?: string
      productHandle?: string
      productTitle?: string
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }
    if (!productHandle || typeof productHandle !== 'string') {
      return NextResponse.json({ error: 'Product handle required' }, { status: 400 })
    }
    if (!productTitle || typeof productTitle !== 'string') {
      return NextResponse.json({ error: 'Product title required' }, { status: 400 })
    }

    const result = await addBackInStockRequest(
      email.trim().toLowerCase(),
      productHandle.trim(),
      productTitle.trim()
    )

    return NextResponse.json({ ok: true, result })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
