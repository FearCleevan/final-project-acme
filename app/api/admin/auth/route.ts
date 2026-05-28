import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { verifyPassword } from '@/lib/admin/auth'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { password } = body as { password?: string }

  if (!password?.trim()) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
  }

  const valid = await verifyPassword(password)
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  session.isLoggedIn = true
  await session.save()

  return NextResponse.json({ ok: true })
}
