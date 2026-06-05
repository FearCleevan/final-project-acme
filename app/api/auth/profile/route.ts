import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { customerSessionOptions, type CustomerSessionData } from '@/lib/customerSession'
import { getCustomerProfileCA } from '@/lib/shopifyCustomer'

export async function GET() {
  const session = await getIronSession<CustomerSessionData>(
    await cookies(),
    customerSessionOptions
  )

  if (!session.accessToken || !session.expiresAt || Date.now() > session.expiresAt) {
    return NextResponse.json({ profile: null }, { status: 401 })
  }

  const profile = await getCustomerProfileCA(session.accessToken)
  return NextResponse.json({ profile })
}
