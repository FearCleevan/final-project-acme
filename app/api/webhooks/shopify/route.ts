import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sendNewOrderAdminAlert } from '@/lib/email'

function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret) return false
  const digest = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64')
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(hmacHeader)
    )
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const topic   = req.headers.get('x-shopify-topic') ?? ''
  const hmac    = req.headers.get('x-shopify-hmac-sha256') ?? ''
  const rawBody = await req.text()

  if (!verifyShopifyWebhook(rawBody, hmac)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (topic === 'orders/paid') {
    try {
      const o = JSON.parse(rawBody) as {
        name:              string
        total_price:       string
        email:             string
        customer?:         { first_name: string; last_name: string }
        line_items:        { title: string; quantity: number; price: string }[]
        shipping_address?: {
          address1: string; city: string; province: string; country: string
        }
      }

      const customer = o.customer
        ? `${o.customer.first_name} ${o.customer.last_name}`.trim()
        : o.email

      const addr = o.shipping_address
        ? `${o.shipping_address.address1}, ${o.shipping_address.city}, ${o.shipping_address.province}, ${o.shipping_address.country}`
        : 'Not provided'

      await sendNewOrderAdminAlert({
        name:            o.name,
        total:           parseFloat(o.total_price).toFixed(2),
        customer,
        email:           o.email,
        items:           o.line_items.map(i => ({
          title:    i.title,
          quantity: i.quantity,
          price:    parseFloat(i.price).toFixed(2),
        })),
        shippingAddress: addr,
      })
    } catch (err) {
      console.error('[webhook orders/paid]', err)
    }
  }

  // Always return 200 — Shopify will retry on non-2xx
  return NextResponse.json({ ok: true })
}
