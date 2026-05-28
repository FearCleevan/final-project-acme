import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'

export async function POST() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  session.destroy()
  return NextResponse.json({ ok: true })
}
