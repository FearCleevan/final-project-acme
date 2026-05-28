import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const shop  = searchParams.get('shop')

  if (!code || !shop) {
    return new NextResponse('Missing code or shop parameter.', { status: 400 })
  }

  const clientId     = process.env.SHOPIFY_CLIENT_ID
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return new NextResponse('SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET not set in environment.', { status: 500 })
  }

  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  })

  const data = await tokenRes.json()

  if (!tokenRes.ok || !data.access_token) {
    return new NextResponse(`Token exchange failed: ${JSON.stringify(data)}`, { status: 500 })
  }

  // Display the token — copy it to SHOPIFY_ADMIN_TOKEN in .env.local then delete this route
  return new NextResponse(
    `<html><body style="font-family:monospace;padding:40px;background:#111;color:#0f0">
      <h2 style="color:#fff">✅ Shopify Admin Token Retrieved</h2>
      <p style="color:#aaa">Copy this value into your <code>.env.local</code> as <strong>SHOPIFY_ADMIN_TOKEN</strong></p>
      <p style="font-size:20px;background:#222;padding:16px;border-radius:8px;word-break:break-all">
        ${data.access_token}
      </p>
      <p style="color:#f66;margin-top:24px">⚠ Delete <code>app/api/shopify/callback/route.ts</code> after copying this token.</p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
