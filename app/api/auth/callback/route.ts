import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { customerSessionOptions, type CustomerSessionData } from '@/lib/customerSession'

export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmevintagesupply.com'
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

  const clientId      = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID!
  const shopId        = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_ID ?? '99152462129'
  const tokenEndpoint = `https://shopify.com/authentication/${shopId}/oauth/token`

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
  console.log('[callback] token response status:', tokenRes.status)

  if (!tokenRes.ok) {
    // Clear stale OAuth state so the next attempt gets a fresh PKCE challenge
    session.oauth = undefined
    await session.save()
    console.error('[callback] token exchange failed:', tokenBody)
    return NextResponse.redirect(`${siteUrl}/login?error=token_exchange_failed`)
  }

  let tokenData: Record<string, unknown>
  try {
    tokenData = JSON.parse(tokenBody)
  } catch {
    session.oauth = undefined
    await session.save()
    console.error('[callback] malformed token response from Shopify')
    return NextResponse.redirect(`${siteUrl}/login?error=token_parse_failed`)
  }

  const { access_token, id_token, expires_in } = tokenData as {
    access_token?: string
    id_token?: string
    expires_in?: number
  }

  if (!access_token) {
    session.oauth = undefined
    await session.save()
    console.error('[callback] no access_token in response')
    return NextResponse.redirect(`${siteUrl}/login?error=no_access_token`)
  }

  // Decode id_token to extract email at login time — avoids decoding on every request
  let email: string | undefined
  if (id_token) {
    try {
      const parts = id_token.split('.')
      if (parts.length !== 3) throw new Error('invalid jwt structure')
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8')
      )
      // Basic sanity check — must look like an email address
      if (typeof payload.email === 'string' && payload.email.includes('@')) {
        email = payload.email
        console.log('[callback] extracted email from id_token')
      } else {
        console.warn('[callback] id_token payload missing valid email')
      }
    } catch {
      console.warn('[callback] could not decode id_token')
    }
  }

  const redirectTo     = oauth.redirectTo
  session.oauth        = undefined
  session.accessToken  = access_token
  session.idToken      = id_token ?? undefined
  session.email        = email
  session.expiresAt    = Date.now() + ((expires_in as number ?? 3600) * 1000)
  await session.save()

  console.log('[callback] success — redirecting to', redirectTo)
  return NextResponse.redirect(`${siteUrl}${redirectTo}`)
}
