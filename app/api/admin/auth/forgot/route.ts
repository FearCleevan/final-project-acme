import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'

// In-memory token store — single-use, 15-minute expiry
// (Replaced by a DB table in a full production setup)
export const resetTokens = new Map<string, { expiry: number }>()

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}))

  // Always return 200 — never reveal whether the email exists
  const adminEmail = process.env.ADMIN_EMAIL
  if (!email || !adminEmail || email !== adminEmail) {
    return NextResponse.json({ ok: true })
  }

  // Generate a secure single-use token
  const token  = crypto.randomBytes(32).toString('hex')
  const expiry = Date.now() + 15 * 60 * 1000 // 15 minutes
  resetTokens.set(token, { expiry })

  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmevintagesupply.com'}/admin/reset-password?token=${token}`

  await resend.emails.send({
    from:    'Acme Admin <no-reply@acmevintagesupply.com>',
    to:      adminEmail,
    subject: 'Reset your admin password',
    html: `
      <p>You requested a password reset for the Acme Lamp & Sign admin dashboard.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 15 minutes. If you did not request this, ignore this email.</p>
    `,
  })

  return NextResponse.json({ ok: true })
}
