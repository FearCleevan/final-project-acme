import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { customerSessionOptions, type CustomerSessionData } from '@/lib/customerSession'
import { customerLogin } from '@/lib/shopifyCustomer'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const { token, errors } = await customerLogin({ email, password })

  if (errors.length || !token) {
    const msg = errors[0]?.message ?? 'Invalid email or password.'
    return NextResponse.json({ error: msg }, { status: 401 })
  }

  const session = await getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions)
  session.accessToken = token.accessToken
  session.expiresAt   = new Date(token.expiresAt).getTime()
  session.oauth       = undefined
  await session.save()

  return NextResponse.json({ ok: true })
}
