import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { upsertCartActivity, removeCartActivity } from '@/lib/cartActivity'
import { getRequestGeo } from '@/lib/geo'

async function resolveIdentity(customerEmail: string | null | undefined) {
  if (customerEmail) return { customerEmail, sessionId: null }
  const sessionId = (await cookies()).get('acme_visitor_id')?.value ?? null
  return { customerEmail: null, sessionId }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    customerEmail?: string | null
    customerId?:    string | null
    productId?:     string
    productTitle?:  string
    variantId?:     string | null
    quantity?:      number
  } | null

  if (!body?.productId || !body.productTitle || !body.quantity) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const identity = await resolveIdentity(body.customerEmail)
  if (!identity.customerEmail && !identity.sessionId) {
    return NextResponse.json({ error: 'No customer or visitor identity available.' }, { status: 400 })
  }

  const { city, lat, lng } = getRequestGeo(req)

  await upsertCartActivity({
    ...identity,
    customerId:    body.customerId ?? null,
    productId:     body.productId,
    productTitle:  body.productTitle,
    variantId:     body.variantId ?? null,
    quantity:      body.quantity,
    city,
    lat,
    lng,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    customerEmail?: string | null
    productId?:     string
  } | null

  if (!body?.productId) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const identity = await resolveIdentity(body.customerEmail)
  if (!identity.customerEmail && !identity.sessionId) {
    return NextResponse.json({ error: 'No customer or visitor identity available.' }, { status: 400 })
  }

  await removeCartActivity(identity, body.productId)
  return NextResponse.json({ ok: true })
}
