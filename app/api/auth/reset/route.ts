import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { customerSessionOptions, type CustomerSessionData } from '@/lib/customerSession'
import { customerResetByUrl } from '@/lib/shopifyCustomer'

export async function POST(req: NextRequest) {
  const { resetUrl, password } = await req.json()

  if (!resetUrl || !password) {
    return NextResponse.json({ error: 'Reset URL and password are required.' }, { status: 400 })
  }

  const { token, errors } = await customerResetByUrl(resetUrl, password)

  if (errors.length || !token) {
    const msg = errors[0]?.message ?? 'Could not reset password. The link may have expired.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Create the iron-session exactly like the login route does
  const session = await getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions)
  session.accessToken = token.accessToken
  session.expiresAt   = new Date(token.expiresAt).getTime()
  session.oauth       = undefined
  await session.save()

  return NextResponse.json({ ok: true })
}
