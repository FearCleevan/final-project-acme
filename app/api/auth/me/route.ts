import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { customerSessionOptions, type CustomerSessionData } from '@/lib/customerSession'

export async function GET() {
  const session = await getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions)

  if (!session.accessToken || !session.expiresAt || Date.now() > session.expiresAt) {
    // Destroy stale session so the client starts fresh — prevents redirect loops
    session.destroy()
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    accessToken:   session.accessToken,
    expiresAt:     session.expiresAt,
  })
}
