import { NextRequest, NextResponse } from 'next/server'
import {
  verifyPassword,
  generateOtp,
  createPendingToken,
  sendOtpEmail,
  maskEmail,
} from '@/lib/admin/auth'
import { loginRatelimit } from '@/lib/admin/ratelimit'

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  if (loginRatelimit) {
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
  }

  // ── Validate input ─────────────────────────────────────────────────────────
  const body = await req.json().catch(() => ({}))
  const { password, rememberMe } = body as { password?: string; rememberMe?: boolean }
  if (!password?.trim()) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
  }

  // ── Verify password ────────────────────────────────────────────────────────
  const valid = await verifyPassword(password)
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  // ── Generate OTP + send email ──────────────────────────────────────────────
  const otp          = generateOtp()
  const pendingToken = createPendingToken(otp, !!rememberMe)
  const adminEmail   = process.env.ADMIN_EMAIL ?? ''

  try {
    await sendOtpEmail(otp)
  } catch {
    return NextResponse.json(
      { error: 'Could not send verification code. Please try again.' },
      { status: 500 }
    )
  }

  // Show masked version of first recipient only
  const primaryEmail = adminEmail.split(',')[0].trim()
  return NextResponse.json({ pendingToken, maskedEmail: maskEmail(primaryEmail) })
}
