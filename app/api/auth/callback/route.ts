import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { customerSessionOptions, type CustomerSessionData } from '@/lib/customerSession'

export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmelampandsign.vercel.app'
  const { searchParams } = new URL(req.url)
  const code          = searchParams.get('code')
  const returnedState = searchParams.get('state')
  const error         = searchParams.get('error')

  if (error) {
    const desc = searchParams.get('error_description') ?? error
    console.error('[callback] Shopify returned error:', error, desc)
    return NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent(desc)}`)
  }

  const session = await getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions)
  const oauth = session.oauth

  if (!oauth || oauth.state !== returnedState || !code) {
    return NextResponse.redirect(`${siteUrl}/login?error=invalid_state`)
  }

  const clientId     = process.env.SHOPIFY_CLIENT_ID!
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET!
  const tokenEndpoint = 'https://shopify.com/authentication/99152462129/oauth/token'

  // Shopify requires client_secret_basic — credentials as Basic auth header
  const basicCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const tokenRes = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicCredentials}`,
    },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      redirect_uri:  `${siteUrl}/api/auth/callback`,
      code,
      code_verifier: oauth.codeVerifier,
    }),
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    console.error('[auth/callback] token exchange failed:', errText)
    return NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent(errText)}`)
  }

  const { access_token, expires_in } = await tokenRes.json()
  const redirectTo = oauth.redirectTo

  session.oauth       = undefined
  session.accessToken = access_token
  session.expiresAt   = Date.now() + (expires_in * 1000)
  await session.save()

  return NextResponse.redirect(`${siteUrl}${redirectTo}`)
}
