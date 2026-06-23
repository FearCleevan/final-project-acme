import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { customerSessionOptions, type CustomerSessionData } from '@/lib/customerSession'
import crypto from 'crypto'

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmevintagesupply.com'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const redirectTo = searchParams.get('redirectTo') ?? '/account'
    const mode       = searchParams.get('mode') ?? 'login' // 'login' | 'register'

    const codeVerifier  = base64url(crypto.randomBytes(32))
    const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest())
    const state         = base64url(crypto.randomBytes(16))

    const session = await getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions)
    session.oauth = { state, codeVerifier, redirectTo }
    await session.save()

    const clientId   = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID!
    const redirectUri = `${SITE_URL}/api/auth/callback`

    const shopId       = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_ID ?? '99152462129'
    const authEndpoint = `https://shopify.com/authentication/${shopId}/oauth/authorize`

    const params = new URLSearchParams({
      client_id:             clientId,
      response_type:         'code',
      redirect_uri:          redirectUri,
      scope:                 'openid email customer-account-api:full',
      state,
      code_challenge:        codeChallenge,
      code_challenge_method: 'S256',
    })

    // 'prompt=login' forces re-auth for sign-in; register uses default flow
    if (mode === 'login') params.set('prompt', 'login')

    console.log('[authorize] redirecting to Shopify auth', { clientId, redirectUri })
    return NextResponse.redirect(`${authEndpoint}?${params}`)
  } catch (err) {
    console.error('[authorize] error:', err)
    return NextResponse.redirect(`${SITE_URL}/login?error=auth_init_failed`)
  }
}
