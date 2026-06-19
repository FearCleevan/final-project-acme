import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import type { CustomerSessionData } from '@/lib/customerSession'
import { customerSessionOptions } from '@/lib/customerSession'
import { submitReviewToDb, hasCustomerReviewed } from '@/lib/reviews'
import { hasCustomerPurchasedProduct } from '@/lib/admin/shopifyAdmin'

export async function POST(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions)
  if (!session.accessToken || !session.email) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  let body: {
    handle: string
    productId: string
    customerName: string
    rating: number
    title: string
    body: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { handle, productId, customerName, rating, title, body: reviewBody } = body

  if (!handle || !productId || !customerName || !rating || !title || !reviewBody) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: 'invalid_rating' }, { status: 400 })
  }
  if (title.length > 100) {
    return NextResponse.json({ error: 'title_too_long' }, { status: 400 })
  }
  if (reviewBody.length < 20 || reviewBody.length > 2000) {
    return NextResponse.json({ error: 'body_length_invalid' }, { status: 400 })
  }

  const alreadyReviewed = await hasCustomerReviewed(session.email, handle)
  if (alreadyReviewed) {
    return NextResponse.json({ error: 'already_reviewed' }, { status: 409 })
  }

  const verifiedPurchase = await hasCustomerPurchasedProduct(session.email, handle)

  const result = await submitReviewToDb({
    productHandle:    handle,
    productId,
    customerEmail:    session.email,
    customerName:     customerName.trim(),
    rating,
    title:            title.trim(),
    body:             reviewBody.trim(),
    verifiedPurchase,
  })

  if (result.error) {
    if (result.error === 'already_reviewed') {
      return NextResponse.json({ error: 'already_reviewed' }, { status: 409 })
    }
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
