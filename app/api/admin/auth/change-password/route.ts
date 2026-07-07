import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import bcrypt from 'bcryptjs'
import { Redis } from '@upstash/redis'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { verifyPassword } from '@/lib/admin/auth'
import { changePasswordRatelimit } from '@/lib/admin/ratelimit'

export async function POST(req: NextRequest) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Rate limiting ──────────────────────────────────────────────────────────
  if (changePasswordRatelimit) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? req.headers.get('x-real-ip')
            ?? '127.0.0.1'
    const { success, limit, remaining, reset } = await changePasswordRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${Math.ceil((reset - Date.now()) / 60000)} minute(s).` },
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
  }

  const body = await req.json().catch(() => ({})) as { currentPassword?: string; newPassword?: string }
  const { currentPassword, newPassword } = body

  if (!currentPassword) {
    return NextResponse.json({ error: 'Current password is required.' }, { status: 400 })
  }
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
  }

  const valid = await verifyPassword(currentPassword)
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect current password.' }, { status: 401 })
  }

  const hash = await bcrypt.hash(newPassword, 12)

  try {
    const redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL  ?? '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
    })
    await redis.set('acme:admin:password_hash', hash)
  } catch {
    return NextResponse.json(
      { error: 'Could not save new password. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
