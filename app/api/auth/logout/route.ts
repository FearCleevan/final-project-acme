import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { customerSessionOptions, type CustomerSessionData } from '@/lib/customerSession'

export async function POST() {
  const session = await getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions)
  session.destroy()
  return NextResponse.json({ ok: true })
}
