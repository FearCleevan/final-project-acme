import { NextRequest, NextResponse } from 'next/server'
import { pendingOtps, generateOtp, sendOtpEmail } from '@/lib/admin/auth'
import { otpResendRatelimit } from '@/lib/admin/ratelimit'

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  if (otpResendRatelimit) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? req.headers.get('x-real-ip')
            ?? '127.0.0.1'
    const { success, limit, remaining, reset } = await otpResendRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: `Too many resend requests. Try again in ${Math.ceil((reset - Date.now()) / 60000)} minute(s).` },
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
  const { pendingToken } = body as { pendingToken?: string }
  if (!pendingToken) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // ── Look up pending token ──────────────────────────────────────────────────
  const record = pendingOtps.get(pendingToken)
  if (!record) {
    return NextResponse.json(
      { error: 'Session expired. Please sign in again.' },
      { status: 401 }
    )
  }

  // ── Check expiry ───────────────────────────────────────────────────────────
  if (Date.now() > record.expiry) {
    pendingOtps.delete(pendingToken)
    return NextResponse.json(
      { error: 'Session expired. Please sign in again.' },
      { status: 401 }
    )
  }

  // ── Generate new OTP + update record ──────────────────────────────────────
  const otp       = generateOtp()
  record.otp      = otp
  record.expiry   = Date.now() + 10 * 60 * 1000
  record.attempts = 0

  try {
    await sendOtpEmail(otp)
  } catch {
    return NextResponse.json(
      { error: 'Could not resend code. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
