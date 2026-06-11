# Admin Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OTP 2FA to admin login, bcrypt password hashing, OTP rate limiting, and security HTTP headers.

**Architecture:** The login flow splits into two API routes — password verification returns a `pendingToken`, OTP verification consumes it and creates the session. All OTP state lives in a server-side in-memory Map (same pattern as existing reset tokens). Security headers are added to `next.config.ts` with separate rules for storefront and admin routes.

**Tech Stack:** Next.js 16 App Router, iron-session, bcryptjs, Resend, @upstash/ratelimit

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `lib/admin/auth.ts` | Modify | bcrypt verify, OTP store + helpers, email send |
| `lib/admin/ratelimit.ts` | Modify | Add `otpVerifyRatelimit` + `otpResendRatelimit` |
| `app/api/admin/auth/route.ts` | Modify | Password step only — no session, returns pendingToken |
| `app/api/admin/auth/otp/route.ts` | Create | OTP verification + session creation |
| `app/api/admin/auth/otp/resend/route.ts` | Create | Regenerate + resend OTP for existing pendingToken |
| `app/admin/login/page.tsx` | Modify | Two-step UI: password → OTP |
| `next.config.ts` | Modify | Security headers for storefront + admin |

---

## Task 1: Install bcryptjs + update lib/admin/auth.ts

**Files:**
- Modify: `lib/admin/auth.ts`

- [ ] **Step 1: Install bcryptjs**

```
cd acme-lamp-sign
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

Expected: packages added to `package.json`, no errors.

- [ ] **Step 2: Replace lib/admin/auth.ts entirely**

```ts
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
interface OtpRecord {
  otp: string
  expiry: number
  attempts: number
}

export const pendingOtps = new Map<string, OtpRecord>()

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function createPendingToken(otp: string): string {
  const token = crypto.randomBytes(16).toString('hex')
  pendingOtps.set(token, { otp, expiry: Date.now() + 10 * 60 * 1000, attempts: 0 })
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
        <p style="color:#999;font-size:12px;">This code expires in 10 minutes.</p>
        <p style="color:#999;font-size:12px;">
          If you did not request this, your admin password may be compromised — change it immediately.
        </p>
      </div>
    `,
  })
}
```

- [ ] **Step 3: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```
git add lib/admin/auth.ts package.json package-lock.json
git commit -m "security: bcrypt password verify + OTP helpers in lib/admin/auth"
```

---

## Task 2: Add OTP rate limiters

**Files:**
- Modify: `lib/admin/ratelimit.ts`

- [ ] **Step 1: Replace lib/admin/ratelimit.ts entirely**

```ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN

// 5 login attempts per IP per 15 minutes
export const loginRatelimit = hasUpstash
  ? new Ratelimit({
      redis:     Redis.fromEnv(),
      limiter:   Ratelimit.slidingWindow(5, '15 m'),
      analytics: false,
      prefix:    'acme_admin_login',
    })
  : null

// 5 OTP verification attempts per IP per 10 minutes
export const otpVerifyRatelimit = hasUpstash
  ? new Ratelimit({
      redis:     Redis.fromEnv(),
      limiter:   Ratelimit.slidingWindow(5, '10 m'),
      analytics: false,
      prefix:    'acme_admin_otp_verify',
    })
  : null

// 3 OTP resend requests per IP per 10 minutes
export const otpResendRatelimit = hasUpstash
  ? new Ratelimit({
      redis:     Redis.fromEnv(),
      limiter:   Ratelimit.slidingWindow(3, '10 m'),
      analytics: false,
      prefix:    'acme_admin_otp_resend',
    })
  : null
```

- [ ] **Step 2: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```
git add lib/admin/ratelimit.ts
git commit -m "security: add OTP verify + resend rate limiters"
```

---

## Task 3: Modify password auth route — password step only

**Files:**
- Modify: `app/api/admin/auth/route.ts`

This route no longer creates a session. It verifies the password, generates an OTP, sends it, and returns `{ pendingToken, maskedEmail }`.

- [ ] **Step 1: Replace app/api/admin/auth/route.ts entirely**

```ts
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
  const { password } = body as { password?: string }
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
  const pendingToken = createPendingToken(otp)
  const adminEmail   = process.env.ADMIN_EMAIL ?? ''

  try {
    await sendOtpEmail(otp)
  } catch {
    return NextResponse.json(
      { error: 'Could not send verification code. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ pendingToken, maskedEmail: maskEmail(adminEmail) })
}
```

- [ ] **Step 2: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```
git add app/api/admin/auth/route.ts
git commit -m "security: password route now issues pendingToken instead of session"
```

---

## Task 4: Create OTP verification route

**Files:**
- Create: `app/api/admin/auth/otp/route.ts`

- [ ] **Step 1: Create app/api/admin/auth/otp/route.ts**

```ts
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
```

- [ ] **Step 2: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```
git add app/api/admin/auth/otp/route.ts
git commit -m "security: add OTP verification route with session creation"
```

---

## Task 5: Create OTP resend route

**Files:**
- Create: `app/api/admin/auth/otp/resend/route.ts`

- [ ] **Step 1: Create app/api/admin/auth/otp/resend/route.ts**

```ts
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

  // ── Generate new OTP + update record ──────────────────────────────────────
  const otp      = generateOtp()
  record.otp     = otp
  record.expiry  = Date.now() + 10 * 60 * 1000
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
```

- [ ] **Step 2: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```
git add app/api/admin/auth/otp/resend/route.ts
git commit -m "security: add OTP resend route"
```

---

## Task 6: Update admin login page — two-step UI

**Files:**
- Modify: `app/admin/login/page.tsx`

- [ ] **Step 1: Replace app/admin/login/page.tsx entirely**

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BiLockAlt, BiEnvelope } from 'react-icons/bi'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()

  // ── Password step ──────────────────────────────────────────────────────────
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // ── OTP step ───────────────────────────────────────────────────────────────
  const [step,           setStep]           = useState<'password' | 'otp'>('password')
  const [otp,            setOtp]            = useState('')
  const [pendingToken,   setPendingToken]   = useState('')
  const [maskedEmail,    setMaskedEmail]    = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const otpInputRef = useRef<HTMLInputElement>(null)

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otp.length === 6) void handleOtpSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp])

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return
    const id = setInterval(() => setResendCountdown(c => c - 1), 1000)
    return () => clearInterval(id)
  }, [resendCountdown])

  // Focus OTP input on step transition
  useEffect(() => {
    if (step === 'otp') otpInputRef.current?.focus()
  }, [step])

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) { setError('Password is required.'); return }

    setLoading(true)
    setError('')

    const res  = await fetch('/api/admin/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password }),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setPendingToken(data.pendingToken)
      setMaskedEmail(data.maskedEmail)
      setResendCountdown(60)
      setPassword('')   // clear password from memory
      setStep('otp')
    } else {
      setError(data.error ?? 'Something went wrong.')
    }
    setLoading(false)
  }

  async function handleOtpSubmit() {
    if (otp.length !== 6 || loading) return
    setLoading(true)
    setError('')

    const res  = await fetch('/api/admin/auth/otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pendingToken, code: otp }),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      router.push('/admin/overview')
    } else {
      setError(data.error ?? 'Something went wrong.')
      setOtp('')
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCountdown > 0 || loading) return
    setError('')
    setLoading(true)

    const res  = await fetch('/api/admin/auth/otp/resend', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pendingToken }),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setResendCountdown(60)
      setOtp('')
    } else {
      setError(data.error ?? 'Could not resend code.')
    }
    setLoading(false)
  }

  function handleBack() {
    setStep('password')
    setOtp('')
    setError('')
    setPendingToken('')
    setMaskedEmail('')
    setResendCountdown(0)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--admin-bg)">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-md bg-(--admin-accent) flex items-center justify-center mb-3">
            <span className="text-(--admin-accent-text) text-[14px] font-bold">A</span>
          </div>
          <h1 className="text-[18px] font-semibold text-(--admin-text)">Acme Vintage Supply</h1>
          <p className="text-[12px] uppercase tracking-widest text-(--admin-text-muted) mt-0.5">Admin Dashboard</p>
        </div>

        {step === 'password' ? (
          /* ── Password form ── */
          <form onSubmit={handlePasswordSubmit} className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-6 space-y-4">
            <div>
              <label htmlFor="password" className="block text-[12px] font-medium text-(--admin-text) mb-1.5">
                Password
              </label>
              <div className="relative">
                <BiLockAlt size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted) pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full h-9 pl-8 pr-3 bg-(--admin-surface-2) border border-(--admin-border) rounded-md text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 transition-colors disabled:opacity-60"
                />
              </div>
              {error && <p className="text-[11px] text-(--admin-red) mt-1.5">{error}</p>}
              <div className="text-right mt-1">
                <Link href="/admin/forgot-password" className="text-[11px] text-(--admin-text-muted) hover:text-(--admin-accent) transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 bg-(--admin-accent) text-(--admin-accent-text) rounded-md text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {loading ? 'Sending code…' : 'Continue'}
            </button>
          </form>
        ) : (
          /* ── OTP form ── */
          <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BiEnvelope size={15} className="text-(--admin-text-muted) shrink-0" />
                <p className="text-[12px] text-(--admin-text-muted)">
                  Code sent to{' '}
                  <span className="text-(--admin-text) font-medium">{maskedEmail}</span>
                </p>
              </div>

              <label htmlFor="otp" className="block text-[12px] font-medium text-(--admin-text) mb-1.5">
                Verification code
              </label>
              <input
                ref={otpInputRef}
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                placeholder="000000"
                disabled={loading}
                autoComplete="one-time-code"
                className="w-full h-10 px-3 bg-(--admin-surface-2) border border-(--admin-border) rounded-md text-[22px] text-(--admin-text) text-center tracking-[0.4em] placeholder:text-(--admin-text-muted) placeholder:tracking-normal focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 transition-colors disabled:opacity-60"
              />
              {error && <p className="text-[11px] text-(--admin-red) mt-1.5">{error}</p>}
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCountdown > 0 || loading}
              className="w-full h-9 bg-(--admin-surface-2) border border-(--admin-border) text-(--admin-text-muted) rounded-md text-[12px] hover:text-(--admin-text) transition-colors disabled:opacity-50"
            >
              {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
            </button>

            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="w-full text-[11px] text-(--admin-text-muted) hover:text-(--admin-accent) transition-colors disabled:opacity-50 py-1"
            >
              ← Back to password
            </button>
          </div>
        )}

        <p className="text-center text-[11px] text-(--admin-text-muted) mt-4">
          Acme Vintage Supply Co. — Admin access only
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```
git add app/admin/login/page.tsx
git commit -m "security: two-step admin login UI with OTP step"
```

---

## Task 7: Add security headers to next.config.ts

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Replace next.config.ts entirely**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ebayimg.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },

  async headers() {
    // Applied to storefront — safe subset, no CSP (would break Shopify/Google Fonts CDN)
    const storefrontHeaders = [
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'X-Content-Type-Options',    value: 'nosniff' },
      { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
    ]

    // Applied to /admin/* only — strict, admin loads nothing external
    const adminHeaders = [
      { key: 'Strict-Transport-Security',           value: 'max-age=31536000; includeSubDomains' },
      { key: 'X-Content-Type-Options',              value: 'nosniff' },
      { key: 'X-Frame-Options',                     value: 'DENY' },
      { key: 'Referrer-Policy',                     value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy',                  value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy',             value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'" },
      { key: 'Cache-Control',                       value: 'no-store, no-cache, must-revalidate' },
      { key: 'X-Permitted-Cross-Domain-Policies',   value: 'none' },
    ]

    return [
      {
        // All routes except /admin
        source:  '/((?!admin).*)',
        headers: storefrontHeaders,
      },
      {
        // Admin only
        source:  '/admin/:path*',
        headers: adminHeaders,
      },
    ]
  },
}

export default nextConfig
```

- [ ] **Step 2: Verify TypeScript + build**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify storefront still loads**

```
npm run dev
```

Visit `http://localhost:3000` — storefront should load normally including product images and Shopify scripts. Visit `http://localhost:3000/catalog` — products should load. No visual regressions.

Visit `http://localhost:3000/admin/login` — admin login should load.

- [ ] **Step 4: Commit**

```
git add next.config.ts
git commit -m "security: add HTTP security headers (storefront-safe + strict admin)"
```

---

## Task 8: Set up ADMIN_PASSWORD_HASH env var

This is a manual setup task — no code change. Must be done before the app can accept logins.

- [ ] **Step 1: Generate bcrypt hash of your admin password**

Run this in a terminal (replace `your-actual-password` with the real password):

```
node -e "require('bcryptjs').hash('your-actual-password', 12, (e, h) => console.log(h))"
```

Expected output: a string starting with `$2b$12$...` (takes ~1 second to compute).

- [ ] **Step 2: Set env var in Vercel**

Go to Vercel → Project → Settings → Environment Variables:
- Add `ADMIN_PASSWORD_HASH` = the `$2b$12$...` string from Step 1
- Confirm `ADMIN_EMAIL` = `jonathan.mauring17@gmail.com`
- Confirm `RESEND_API_KEY` is set

- [ ] **Step 3: Delete old ADMIN_PASSWORD env var from Vercel**

Remove `ADMIN_PASSWORD` from Vercel env vars — it is no longer used.

- [ ] **Step 4: Set local .env.local for development**

Add to `.env.local`:
```
ADMIN_PASSWORD_HASH=$2b$12$...   # paste your hash here
```

Remove `ADMIN_PASSWORD` from `.env.local`.

- [ ] **Step 5: Test full login flow locally**

Start dev server (`npm run dev`), visit `http://localhost:3000/admin/login`:
1. Enter correct password → should see "Sending code…" spinner → OTP step appears with masked email
2. Check `jonathan.mauring17@gmail.com` inbox → email with 6-digit code arrives
3. Enter code → should redirect to `/admin/overview`
4. Test wrong password → "Incorrect password." error
5. Test wrong OTP code → "Incorrect code. X attempts remaining." error
6. Test Back button → returns to password step

---

## Post-Deploy Verification

After deploying to Vercel:

1. Visit `https://acmevintagesupply.com/admin/login` — test full OTP flow end-to-end
2. Check security headers: paste `https://acmevintagesupply.com` into `https://securityheaders.com` — should score A or A+
3. Check admin headers: paste `https://acmevintagesupply.com/admin/login` — should show strict CSP + DENY framing
4. Verify storefront unaffected: `https://acmevintagesupply.com/catalog` — products load, checkout works

## Before Go-Live

Update `ADMIN_EMAIL` in Vercel from `jonathan.mauring17@gmail.com` to Scott's email address.
