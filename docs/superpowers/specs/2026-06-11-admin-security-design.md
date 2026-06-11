# Admin Security Hardening — Design Spec

**Date:** 2026-06-11

## Goal

Harden the admin dashboard against the primary web attack vectors without restricting normal storefront shopping, cart, or checkout behaviour for customers.

## Scope

Four changes, all security-focused:
1. OTP 2FA on admin login
2. bcrypt password hashing
3. Security HTTP headers (storefront-safe)
4. OTP rate limiting

Out of scope: DDOS protection (Vercel CDN), ransomware (infrastructure/backups), storefront customer auth (separate system).

---

## 1. OTP 2FA Login Flow

### User-facing flow

1. Admin visits `/admin/login`
2. Enters password → `POST /api/admin/auth` (password step)
3. Server verifies password (bcrypt). If correct:
   - Generates 6-digit numeric OTP (`Math.floor(100000 + Math.random() * 900000)`)
   - Stores `{ otp, expiry: Date.now() + 10min, attempts: 0 }` in server-side Map keyed by `pendingToken` (16-byte random hex)
   - Sends OTP email via Resend to `ADMIN_EMAIL`
   - Returns `{ pendingToken, maskedEmail }` — **no session created yet**
4. Login page transitions to OTP step showing masked email (`"j***@gmail.com"`)
5. User enters 6-digit code
6. `POST /api/admin/auth/otp` with `{ pendingToken, code }`
7. Server validates:
   - Token exists and not expired
   - `attempts < 5` (increment on each wrong guess, delete token at 5)
   - Code matches
8. If valid: delete pending token, create iron-session (`isLoggedIn: true`), return `{ ok: true }`
9. Client redirects to `/admin/overview`

### OTP email (Resend)

- **From:** `Acme Admin <no-reply@acmevintagesupply.com>`
- **To:** `process.env.ADMIN_EMAIL` (currently `jonathan.mauring17@gmail.com` — update to Scott's email before go-live)
- **Subject:** `Your Acme admin login code: 123456`
- **Body:** Clean HTML with the 6-digit code prominently displayed, expiry note ("expires in 10 minutes"), and "If you did not request this, your password may be compromised" warning

### UI — login page states

| State | What shows |
|---|---|
| `step: 'password'` | Existing password form (unchanged visually) |
| `step: 'otp'` | OTP input (6-digit numeric), masked email, Resend button, Back link |

**OTP input behaviour:**
- `type="text"` `inputMode="numeric"` `maxLength={6}` `pattern="[0-9]{6}"`
- Auto-submits when 6th digit is entered
- Resend button: disabled for 60 seconds after each send, shows countdown. Calls `POST /api/admin/auth/otp/resend` with `{ pendingToken }` — server generates a fresh OTP, sends new email, updates the Map entry. Rate limited by `otpResendRatelimit`.
- "← Back to password" link: resets client UI state to `'password'` step only. No server call — the pending token expires naturally after 10 minutes.

### Error states

| Condition | Message |
|---|---|
| Wrong code (attempts 1–4) | "Incorrect code. X attempt(s) remaining." |
| 5 wrong attempts | "Too many incorrect attempts. Please sign in again." + reset to password step |
| Token expired | "Your code has expired. Please sign in again." + reset to password step |
| Email send failure | "Could not send verification code. Please try again." (stay on password step) |

### OTP store

In `lib/admin/auth.ts`:
```ts
interface OtpRecord { otp: string; expiry: number; attempts: number }
export const pendingOtps = new Map<string, OtpRecord>()
```

In-memory Map — same pattern as `resetTokens` in `app/api/admin/auth/forgot/route.ts`. Acceptable for a single-admin system. A Vercel cold start clears it, but the user simply restarts the login flow.

### New / modified files

| File | Change |
|---|---|
| `app/api/admin/auth/route.ts` | Modified: password verify only — no session creation, returns `{ pendingToken, maskedEmail }` |
| `app/api/admin/auth/otp/route.ts` | NEW: validates OTP, creates session |
| `app/api/admin/auth/otp/resend/route.ts` | NEW: generates fresh OTP + resends email for existing pendingToken |
| `lib/admin/auth.ts` | Add `pendingOtps` Map, `generateOtp()`, `sendOtpEmail()`, `maskEmail()` |
| `app/admin/login/page.tsx` | Add OTP step UI, resend button, back link |

---

## 2. bcrypt Password Hashing

### Problem

`verifyPassword()` currently does `input === process.env.ADMIN_PASSWORD` — plain-text comparison. A leaked `.env` file or Vercel env var exposure directly exposes the password.

### Fix

Replace with bcrypt comparison using `bcryptjs` (pure JS, zero native deps, works on Vercel edge/serverless).

**`lib/admin/auth.ts`:**
```ts
import bcrypt from 'bcryptjs'

export async function verifyPassword(input: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH ?? ''
  if (!hash) return false
  return bcrypt.compare(input, hash)
}
```

**One-time setup** (run once, store result in Vercel):
```bash
node -e "require('bcryptjs').hash('your-actual-password', 12, (e,h) => console.log(h))"
```
Paste the output into Vercel env vars as `ADMIN_PASSWORD_HASH`. Delete `ADMIN_PASSWORD`.

**Cost factor 12** — ~300ms on modern hardware. Acceptable for a login endpoint. Makes brute-force and AI-powered credential cracking computationally infeasible.

### Files changed

| File | Change |
|---|---|
| `lib/admin/auth.ts` | `verifyPassword` uses `bcrypt.compare` against `ADMIN_PASSWORD_HASH` |
| `package.json` | Add `bcryptjs` + `@types/bcryptjs` |

---

## 3. Security HTTP Headers

Added in `next.config.ts` using the built-in `headers()` async function.

### Storefront routes (all routes except `/admin/*`)

Applied via matcher `/((?!admin).*)` — everything except admin:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

**No CSP on storefront** — would break Shopify checkout scripts, Google Fonts CDN, Shopify CDN product images, and any Shopify pixel scripts. Customers can shop, add to crate, and check out without any disruption.

### Admin routes (`/admin/:path*`)

All storefront headers plus:

| Header | Value | Why |
|---|---|---|
| `X-Frame-Options` | `DENY` | Admin must never be framed |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'` | XSS, drive-by |
| `Cache-Control` | `no-store, no-cache, must-revalidate` | Admin pages never cached by proxies |
| `X-Permitted-Cross-Domain-Policies` | `none` | Blocks Flash/PDF cross-domain reads |

**`frame-ancestors 'none'`** in CSP is the modern replacement for `X-Frame-Options: DENY` — both are set for maximum browser compatibility.

### Files changed

| File | Change |
|---|---|
| `next.config.ts` | Add `headers()` async function with two route groups |

---

## 4. OTP Rate Limiting

Extends `lib/admin/ratelimit.ts` with two new Upstash limiters (same pattern as existing `loginRatelimit`).

### `otpVerifyRatelimit`

Applied to `POST /api/admin/auth/otp`:
- **5 attempts per IP per 10 minutes** (sliding window)
- Prefix: `acme_admin_otp_verify`
- Prevents brute-force of the 6-digit code even if `pendingToken` is intercepted

### `otpResendRatelimit`

Applied to `POST /api/admin/auth/otp/resend`:
- **3 resend requests per IP per 10 minutes** (sliding window)
- Prefix: `acme_admin_otp_resend`
- Prevents email flooding / Resend API abuse

Both fall back to `null` if Upstash is not configured — same as existing `loginRatelimit` behaviour.

### Files changed

| File | Change |
|---|---|
| `lib/admin/ratelimit.ts` | Add `otpVerifyRatelimit` and `otpResendRatelimit` |
| `app/api/admin/auth/otp/route.ts` | Apply `otpVerifyRatelimit` |
| `app/api/admin/auth/otp/resend/route.ts` | Apply `otpResendRatelimit` |

---

## Attack Coverage Summary

| Attack | Mitigation |
|---|---|
| Phishing | OTP 2FA (stolen password alone not enough) |
| Man in the Middle | HSTS header forces HTTPS, httpOnly session cookie |
| SQL Injection | No SQL DB; Shopify API inputs are typed — not applicable |
| DDOS | Vercel CDN + rate limiting on auth endpoints |
| XSS | Admin CSP + Next.js auto-escaping in JSX |
| Password / Brute Force | bcrypt + login rate limit + OTP 2FA |
| AI-Powered Attacks | bcrypt cost factor + rate limiting makes credential cracking infeasible |
| Drive-by Attack | X-Frame-Options, X-Content-Type-Options, CSP on admin |
| Ransomware | Infrastructure level (Vercel/Shopify backups) — not app code |
| Eavesdropping | HSTS + httpOnly + secure cookies |

## Environment Variables

| Variable | Purpose | Current value |
|---|---|---|
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password | Generate with bcryptjs script |
| `ADMIN_EMAIL` | OTP destination | `jonathan.mauring17@gmail.com` → Scott's email before go-live |
| `RESEND_API_KEY` | Already set — used for OTP + forgot-password | No change |
| `ADMIN_PASSWORD` | **Delete after generating hash** | — |

## Go-Live Checklist

- [ ] Run bcryptjs hash script, set `ADMIN_PASSWORD_HASH` in Vercel, delete `ADMIN_PASSWORD`
- [ ] Confirm `ADMIN_EMAIL` = `jonathan.mauring17@gmail.com` in Vercel (for testing)
- [ ] Before launch: update `ADMIN_EMAIL` to Scott's email in Vercel
- [ ] Confirm `RESEND_API_KEY` is set and `no-reply@acmevintagesupply.com` is a verified sender in Resend
