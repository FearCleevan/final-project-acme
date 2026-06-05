import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { customerSessionOptions, type CustomerSessionData } from '@/lib/customerSession'
import { getCustomerProfileCA } from '@/lib/shopifyCustomer'
import type { CustomerProfile } from '@/lib/shopifyCustomer'

/** Decode a JWT payload without verifying the signature. Safe because the
 *  token came directly from Shopify's token endpoint (server-to-server). */
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8')
    return JSON.parse(payload)
  } catch {
    return null
  }
}

export async function GET() {
  const session = await getIronSession<CustomerSessionData>(
    await cookies(),
    customerSessionOptions
  )

  if (!session.accessToken || !session.expiresAt || Date.now() > session.expiresAt) {
    return NextResponse.json({ profile: null }, { status: 401 })
  }

  // ── Strategy 1: full profile from Customer Account API ──────────────────────
  try {
    const full = await getCustomerProfileCA(session.accessToken)
    if (full) {
      console.log('[profile] CA API success:', full.email)
      return NextResponse.json({ profile: full })
    }
    console.warn('[profile] CA API returned null — falling back to id_token')
  } catch (err) {
    console.error('[profile] CA API threw:', err)
  }

  // ── Strategy 2: basic profile from id_token JWT claims ──────────────────────
  if (session.idToken) {
    const claims = decodeJWT(session.idToken)
    if (claims) {
      // Extract customer numeric ID from Shopify GID: "gid://shopify/Customer/123456"
      const sub       = String(claims.sub ?? '')
      const numericId = sub.split('/').pop() ?? sub

      const profile: CustomerProfile = {
        id:             numericId,
        firstName:      (claims.given_name  as string) ?? null,
        lastName:       (claims.family_name as string) ?? null,
        email:          (claims.email       as string) ?? '',
        phone:          (claims.phone_number as string) ?? null,
        defaultAddress: null,
        addresses:      { edges: [] },
        orders:         { edges: [] },
      }
      console.log('[profile] id_token fallback:', profile.email)
      return NextResponse.json({ profile })
    }
  }

  // ── Strategy 3: authenticated but no data available ─────────────────────────
  console.warn('[profile] no profile data available')
  return NextResponse.json({ profile: null })
}
