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
    return NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent(error)}`)
  }

  const session = await getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions)
  const oauth = session.oauth

  if (!oauth || oauth.state !== returnedState || !code) {
    return NextResponse.redirect(`${siteUrl}/login?error=invalid_state`)
  }

  const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!
  const oidc = await fetch(`https://${shopDomain}/.well-known/openid-configuration`).then(r => r.json())

  const tokenRes = await fetch(oidc.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     process.env.SHOPIFY_CLIENT_ID!,
      redirect_uri:  `${siteUrl}/api/auth/callback`,
      code,
      code_verifier: oauth.codeVerifier,
    }),
  })

  if (!tokenRes.ok) {
    console.error('[auth/callback] token exchange failed:', await tokenRes.text())
    return NextResponse.redirect(`${siteUrl}/login?error=token_failed`)
  }

  const { access_token, expires_in } = await tokenRes.json()
  const redirectTo = oauth.redirectTo

  session.oauth       = undefined
  session.accessToken = access_token
  session.expiresAt   = Date.now() + (expires_in * 1000)
  await session.save()

  return NextResponse.redirect(`${siteUrl}${redirectTo}`)
}
