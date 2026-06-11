import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { pendingOtps } from '@/lib/admin/auth'
import type { AdminSession } from '@/lib/admin/auth'
import { sessionOptions } from '@/lib/admin/session'
import { otpVerifyRatelimit } from '@/lib/admin/ratelimit'

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  if (otpVerifyRatelimit) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? req.headers.get('x-real-ip')
            ?? '127.0.0.1'
    const { success, limit, remaining, reset } = await otpVerifyRatelimit.limit(ip)
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

  // ── Validate input ─────────────────────────────────────────────────────────
  const body = await req.json().catch(() => ({}))
  const { pendingToken, code } = body as { pendingToken?: string; code?: string }
  if (!pendingToken || !code) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // ── Look up pending token ──────────────────────────────────────────────────
  const record = pendingOtps.get(pendingToken)
  if (!record) {
    return NextResponse.json(
      { error: 'Your code has expired. Please sign in again.' },
      { status: 401 }
    )
  }

  // ── Check expiry ───────────────────────────────────────────────────────────
  if (Date.now() > record.expiry) {
    pendingOtps.delete(pendingToken)
    return NextResponse.json(
      { error: 'Your code has expired. Please sign in again.' },
      { status: 401 }
    )
  }

  // ── Increment attempts ─────────────────────────────────────────────────────
  record.attempts += 1
  if (record.attempts > 5) {
    pendingOtps.delete(pendingToken)
    return NextResponse.json(
      { error: 'Too many incorrect attempts. Please sign in again.' },
      { status: 401 }
    )
  }

  // ── Verify code ────────────────────────────────────────────────────────────
  if (code !== record.otp) {
    const remaining = 5 - record.attempts
    return NextResponse.json(
      { error: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` },
      { status: 401 }
    )
  }

  // ── Create session ─────────────────────────────────────────────────────────
  pendingOtps.delete(pendingToken)
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  session.isLoggedIn = true
  await session.save()

  return NextResponse.json({ ok: true })
}
