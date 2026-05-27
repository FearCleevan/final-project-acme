import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true })
  const session = await getIronSession<AdminSession>(req, res, sessionOptions)
  session.destroy()
  return res
}
