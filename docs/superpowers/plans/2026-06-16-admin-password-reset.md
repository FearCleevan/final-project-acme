# Admin Password Reset — Full Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 issues in the admin forgot/reset password flow: Redis-backed password storage (so resets actually work), eye icon toggles, real-time password match validation, and a password strength indicator.

**Architecture:** Move the active password hash from a static env var into Upstash Redis so `verifyPassword()` can read it at runtime and the reset route can write to it. UI improvements are confined to `app/admin/reset-password/page.tsx`. No new dependencies needed — `@upstash/redis` is already installed.

**Tech Stack:** Next.js 16 App Router, `@upstash/redis`, `bcryptjs`, `react-icons/bi`, Tailwind v4

---

## File Map

| File | Action | What changes |
|---|---|---|
| `lib/admin/auth.ts` | Modify | `verifyPassword()` reads `acme:admin:password_hash` from Redis first, falls back to `ADMIN_PASSWORD_HASH` env var |
| `app/api/admin/auth/reset/route.ts` | Modify | Writes new bcrypt hash to Redis after valid token; removes `console.log` hack; returns clean success |
| `app/admin/reset-password/page.tsx` | Modify | Eye icon toggles, strength bar, real-time match error, updated success message |

---

## Task 1: Redis-backed `verifyPassword()`

**Files:**
- Modify: `lib/admin/auth.ts`

- [ ] **Step 1: Add Redis import and update `verifyPassword()`**

Open `lib/admin/auth.ts`. Replace the existing `verifyPassword` function with this:

```typescript
import { Redis } from '@upstash/redis'

// ─── Password verification ─────────────────────────────────────────────────────
// Reads active hash from Redis (acme:admin:password_hash) first.
// Falls back to ADMIN_PASSWORD_HASH env var for first-time setup / local dev.
export async function verifyPassword(input: string): Promise<boolean> {
  let hash: string | null = null

  // Try Redis first (set by the reset flow)
  try {
    const redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL  ?? '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
    })
    hash = await redis.get<string>('acme:admin:password_hash')
  } catch {
    // Redis unavailable — fall through to env var
  }

  // Fall back to env var
  if (!hash) {
    hash = process.env.ADMIN_PASSWORD_HASH ?? ''
  }

  if (!hash) return false
  return bcrypt.compare(input, hash)
}
```

Make sure the existing `import bcrypt from 'bcryptjs'` is still at the top of the file. Do NOT remove any other exports (`generateOtp`, `createPendingToken`, `maskEmail`, `sendOtpEmail`, `pendingOtps`, `AdminSession`).

- [ ] **Step 2: Verify dev server compiles cleanly**

Run `npm run dev` (or check the already-running dev server terminal). Confirm no TypeScript errors related to `lib/admin/auth.ts`. The admin login at `http://localhost:3000/admin/login` should still work with the existing password.

- [ ] **Step 3: Commit**

```
git add lib/admin/auth.ts
git commit -m "feat: verifyPassword reads Redis hash first, falls back to env var"
```

---

## Task 2: Reset route writes new hash to Redis

**Files:**
- Modify: `app/api/admin/auth/reset/route.ts`

- [ ] **Step 1: Rewrite the reset route**

Replace the entire contents of `app/api/admin/auth/reset/route.ts` with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Redis } from '@upstash/redis'
import { resetTokens } from '../forgot/route'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json().catch(() => ({}))

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const record = resetTokens.get(token)
  if (!record || Date.now() > record.expiry) {
    return NextResponse.json(
      { error: 'Reset link has expired or is invalid.' },
      { status: 400 }
    )
  }

  // Invalidate token immediately (single-use)
  resetTokens.delete(token)

  // Hash the new password and persist to Redis
  const hash = await bcrypt.hash(password, 12)

  const redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL  ?? '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  })
  await redis.set('acme:admin:password_hash', hash)

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify dev server compiles cleanly**

Check the running dev server terminal for TypeScript errors. No errors expected.

- [ ] **Step 3: Commit**

```
git add app/api/admin/auth/reset/route.ts
git commit -m "feat: reset route writes new password hash to Redis"
```

---

## Task 3: UI — eye icon, strength bar, real-time match

**Files:**
- Modify: `app/admin/reset-password/page.tsx`

- [ ] **Step 1: Replace `ResetPasswordForm` with the updated version**

Replace the entire contents of `app/admin/reset-password/page.tsx` with:

```tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BiLockAlt, BiCheck, BiShow, BiHide } from 'react-icons/bi'

// ── Password strength ──────────────────────────────────────────────────────────
function getStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0
  let score = 0
  if (/[a-z]/.test(pw)) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  if (pw.length < 8) return 1
  if (score >= 3) return 3
  if (score === 2) return 2
  return 1
}

function StrengthBar({ password }: { password: string }) {
  if (!password) return null
  const level = getStrength(password)
  const labels = ['', 'Weak', 'Medium', 'Strong']
  const colours = ['', 'bg-red-500', 'bg-amber-400', 'bg-green-500']
  const textColours = ['', 'text-red-500', 'text-amber-500', 'text-green-600']

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              i <= level ? colours[level] : 'bg-(--admin-border)'
            }`}
          />
        ))}
      </div>
      <p className={`text-[11px] font-medium ${textColours[level]}`}>
        {labels[level]}
      </p>
    </div>
  )
}

// ── Reset form ─────────────────────────────────────────────────────────────────
function ResetPasswordForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [password,     setPassword]     = useState('')
  const [confirm,      setConfirm]      = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [matchError,   setMatchError]   = useState('')
  const [success,      setSuccess]      = useState(false)

  // Real-time match validation
  useEffect(() => {
    if (!confirm) { setMatchError(''); return }
    setMatchError(confirm !== password ? 'Passwords do not match.' : '')
  }, [password, confirm])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm)  { setError('Passwords do not match.'); return }
    if (!token)                { setError('Invalid or missing reset token.'); return }

    setLoading(true)
    const res  = await fetch('/api/admin/auth/reset', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token, password }),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setSuccess(true)
    } else {
      setError(data.error ?? 'Something went wrong.')
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <p className="text-[13px] text-(--admin-red) text-center">
        Invalid reset link. Please request a new one.
      </p>
    )
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <BiCheck size={22} className="text-green-600" />
        </div>
        <p className="text-[14px] font-medium text-(--admin-text)">Password updated successfully.</p>
        <p className="text-[12px] text-(--admin-text-muted)">
          You can now log in with your new password.
        </p>
        <button
          onClick={() => router.push('/admin/login')}
          className="w-full h-9 bg-(--admin-accent) text-(--admin-accent-text) rounded-md text-[13px] font-medium hover:opacity-90 transition-opacity"
        >
          Go to login
        </button>
      </div>
    )
  }

  const inputClass = 'w-full h-9 pl-8 pr-9 bg-(--admin-surface-2) border border-(--admin-border) rounded-md text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 transition-colors disabled:opacity-60'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* New Password */}
      <div>
        <label className="block text-[12px] font-medium text-(--admin-text) mb-1.5">
          New Password
        </label>
        <div className="relative">
          <BiLockAlt size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted) pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder="At least 8 characters"
            disabled={loading}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <BiHide size={15} /> : <BiShow size={15} />}
          </button>
        </div>
        <StrengthBar password={password} />
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-[12px] font-medium text-(--admin-text) mb-1.5">
          Confirm Password
        </label>
        <div className="relative">
          <BiLockAlt size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted) pointer-events-none" />
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError('') }}
            placeholder="Repeat new password"
            disabled={loading}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
            tabIndex={-1}
          >
            {showConfirm ? <BiHide size={15} /> : <BiShow size={15} />}
          </button>
        </div>
        {matchError && (
          <p className="text-[11px] text-(--admin-red) mt-1.5">{matchError}</p>
        )}
        {error && <p className="text-[11px] text-(--admin-red) mt-1.5">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading || !!matchError || password.length < 8}
        className="w-full h-9 bg-(--admin-accent) text-(--admin-accent-text) rounded-md text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
        {loading ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-(--admin-bg)">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-md bg-(--admin-accent) flex items-center justify-center mb-3">
            <span className="text-(--admin-accent-text) text-[14px] font-bold">A</span>
          </div>
          <h1 className="text-[18px] font-semibold text-(--admin-text)">Reset Password</h1>
          <p className="text-[12px] uppercase tracking-widest text-(--admin-text-muted) mt-0.5">Acme Vintage Supply</p>
        </div>
        <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-6">
          <Suspense fallback={<p className="text-[13px] text-(--admin-text-muted) text-center">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

With dev server running, navigate to `http://localhost:3000/admin/reset-password?token=test`:

1. Both password fields show a lock icon on the left and eye icon on the right
2. Typing in New Password field shows the strength bar (Weak → Medium → Strong)
3. Typing in Confirm Password field that doesn't match shows "Passwords do not match." in real time
4. When both fields match, the mismatch error clears automatically
5. Submit button is disabled when passwords don't match or are under 8 chars
6. (Token `test` is invalid — submitting will show "Reset link has expired or is invalid." which is correct)

- [ ] **Step 3: Commit**

```
git add app/admin/reset-password/page.tsx
git commit -m "feat: reset password UI — eye icons, strength bar, real-time match validation"
```

---

## Task 4: End-to-end verification on live site

- [ ] **Step 1: Deploy to production**

```
vercel --prod --yes
```

Wait for deploy to complete.

- [ ] **Step 2: Trigger a real forgot password flow**

1. Go to `https://acmevintagesupply.com/admin/forgot-password`
2. Enter `jonathan.mauring17@gmail.com` (or any of the 3 admin emails)
3. Click "Send reset link"
4. Check inbox — email arrives from `no-reply@acmevintagesupply.com`
5. Click the reset link in the email

- [ ] **Step 3: Set a new password and verify it works**

On the reset page:
1. Confirm eye icons, strength bar, and real-time match all work
2. Enter a new strong password (e.g. `Acme@2026!Scott` — or change it to anything you like)
3. Click "Update password"
4. Success screen shows "Password updated successfully. You can now log in with your new password."
5. Click "Go to login"
6. Log in with the new password — OTP code arrives, enter it, access granted

- [ ] **Step 4: Verify Redis has the new hash**

```bash
curl -s -X POST "https://hip-tortoise-117877.upstash.io/get/acme:admin:password_hash" \
  -H "Authorization: Bearer gQAAAAAAAcx1AAIgcDFmOWMzZTczYmExODE0MWJjYjE5OTM2ODk2MzE2NWVjMw"
```

Expected: `{"result":"$2b$12$..."}` — a bcrypt hash, not null.
