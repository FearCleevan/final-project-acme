import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { customerSessionOptions, type CustomerSessionData } from '@/lib/customerSession'
import crypto from 'crypto'

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const redirectTo = searchParams.get('redirectTo') ?? '/account'

  const codeVerifier  = base64url(crypto.randomBytes(32))
  const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest())
  const state         = base64url(crypto.randomBytes(16))

  const session = await getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions)
  session.oauth = { state, codeVerifier, redirectTo }
  await session.save()

  const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!
  const oidc = await fetch(`https://${shopDomain}/.well-known/openid-configuration`).then(r => r.json())

  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmelampandsign.vercel.app'
  const clientId = process.env.SHOPIFY_CLIENT_ID!

  const params = new URLSearchParams({
    client_id:             clientId,
    response_type:         'code',
    redirect_uri:          `${siteUrl}/api/auth/callback`,
    scope:                 'openid email customer-account-api:full',
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: 'S256',
  })

  return NextResponse.redirect(`${oidc.authorization_endpoint}?${params}`)
}
