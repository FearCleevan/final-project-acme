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
    console.error('[callback] state mismatch', { hasOauth: !!oauth, stateMatch: oauth?.state === returnedState, hasCode: !!code })
    return NextResponse.redirect(`${siteUrl}/login?error=invalid_state`)
  }

  const clientId      = process.env.SHOPIFY_CLIENT_ID!
  const tokenEndpoint = 'https://shopify.com/authentication/99152462129/oauth/token'

  // PKCE public client flow — client_id in body, no client_secret
  const tokenRes = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     clientId,
      redirect_uri:  `${siteUrl}/api/auth/callback`,
      code,
      code_verifier: oauth.codeVerifier,
    }),
  })

  const tokenBody = await tokenRes.text()
  console.log('[callback] token response status:', tokenRes.status, 'body:', tokenBody)

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent(tokenBody)}`)
  }

  const tokenData = JSON.parse(tokenBody)
  const { access_token, expires_in } = tokenData

  if (!access_token) {
    console.error('[callback] no access_token in response:', tokenData)
    return NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent('No access token returned: ' + tokenBody)}`)
  }

  const redirectTo = oauth.redirectTo
  session.oauth       = undefined
  session.accessToken = access_token
  session.expiresAt   = Date.now() + (expires_in * 1000)
  await session.save()

  console.log('[callback] success — redirecting to', redirectTo)
  return NextResponse.redirect(`${siteUrl}${redirectTo}`)
}
