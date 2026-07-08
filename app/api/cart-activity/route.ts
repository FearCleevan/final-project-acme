import { NextRequest, NextResponse } from 'next/server'
import { upsertCartActivity, removeCartActivity } from '@/lib/cartActivity'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    customerEmail?: string
    customerId?:    string | null
    productId?:     string
    productTitle?:  string
    variantId?:     string | null
    quantity?:      number
  } | null

  if (!body?.customerEmail || !body.productId || !body.productTitle || !body.quantity) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  await upsertCartActivity({
    customerEmail: body.customerEmail,
    customerId:    body.customerId ?? null,
    productId:     body.productId,
    productTitle:  body.productTitle,
    variantId:     body.variantId ?? null,
    quantity:      body.quantity,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    customerEmail?: string
    productId?:     string
  } | null

  if (!body?.customerEmail || !body.productId) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  await removeCartActivity(body.customerEmail, body.productId)
  return NextResponse.json({ ok: true })
}
