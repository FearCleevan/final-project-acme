import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import crypto from 'crypto'

// ─── Password verification ─────────────────────────────────────────────────────
// Compare against ADMIN_PASSWORD_HASH (bcrypt cost 12).
// Generate: node -e "require('bcryptjs').hash('yourpassword',12,(e,h)=>console.log(h))"
// Set result as ADMIN_PASSWORD_HASH in Vercel env vars. Delete ADMIN_PASSWORD.
export async function verifyPassword(input: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH ?? ''
  if (!hash) return false
  return bcrypt.compare(input, hash)
}

// ─── Session shape ─────────────────────────────────────────────────────────────
export interface AdminSession {
  isLoggedIn: boolean
}

// ─── OTP store ─────────────────────────────────────────────────────────────────
const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes

interface OtpRecord {
  otp: string
  expiry: number
  attempts: number
}

export const pendingOtps = new Map<string, OtpRecord>()

export function generateOtp(): string {
  const n = crypto.randomInt(0, 1_000_000)
  return n.toString().padStart(6, '0')
}

export function createPendingToken(otp: string): string {
  const token = crypto.randomBytes(16).toString('hex')
  pendingOtps.set(token, { otp, expiry: Date.now() + OTP_TTL_MS, attempts: 0 })
  return token
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  return `${local[0]}***@${domain}`
}

// ─── OTP email via Resend ──────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOtpEmail(otp: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) throw new Error('ADMIN_EMAIL not configured')
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured')

  await resend.emails.send({
    from:    'Acme Admin <no-reply@acmevintagesupply.com>',
    to:      adminEmail,
    subject: `Your Acme admin login code: ${otp}`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;">
        <h2 style="font-size:18px;margin-bottom:8px;">Admin login verification</h2>
        <p style="color:#666;font-size:14px;margin-bottom:24px;">
          Enter this code in the Acme Vintage Supply admin dashboard to complete your sign in.
        </p>
        <div style="background:#f5f5f0;border-radius:8px;padding:24px;text-align:center;
                    letter-spacing:0.3em;font-size:36px;font-weight:bold;
                    font-family:monospace;margin-bottom:24px;">
          ${otp}
        </div>
        <p style="color:#999;font-size:12px;">This code expires in ${OTP_TTL_MS / 60000} minutes.</p>
        <p style="color:#999;font-size:12px;">
          If you did not request this, your admin password may be compromised — change it immediately.
        </p>
      </div>
    `,
  })
}
