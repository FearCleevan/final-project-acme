import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { verifyPassword } from '@/lib/admin/auth'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { loginRatelimit } from '@/lib/admin/ratelimit'

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          ?? req.headers.get('x-real-ip')
          ?? '127.0.0.1'

  const { success, limit, remaining, reset } = await loginRatelimit.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${Math.ceil((reset - Date.now()) / 60000)} minute(s).` },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit':     String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset':     String(reset),
        },
      }
    )
  }

  // ── Validate input ─────────────────────────────────────────────────────────
  const body = await req.json().catch(() => ({}))
  const { password } = body as { password?: string }

  if (!password?.trim()) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
  }

  // ── Verify password ────────────────────────────────────────────────────────
  const valid = await verifyPassword(password)
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  // ── Create session ─────────────────────────────────────────────────────────
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  session.isLoggedIn = true
  await session.save()

  return NextResponse.json({ ok: true })
}
