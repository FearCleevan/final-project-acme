---
name: project-security-hardening
description: "Admin security hardening completed June 11, 2026 — OTP 2FA login, bcrypt, rate limiting, security headers. Live and tested."
metadata: 
  node_type: memory
  type: project
  originSessionId: ad33a9e2-711a-4426-b06d-b89128f97dca
---

Admin security hardening completed and tested June 11, 2026. OTP email confirmed arriving at jonathan.mauring17@gmail.com.

**Why:** Password-only admin login was vulnerable to brute force, phishing, and credential leaks.

## What Was Built

### OTP 2FA login flow
- Password → 6-digit OTP email → session (two steps, no session until OTP verified)
- `POST /api/admin/auth` — bcrypt verify, generates OTP, sends via Resend, returns `pendingToken`
- `POST /api/admin/auth/otp` — validates OTP (timing-safe comparison), creates iron-session
- `POST /api/admin/auth/otp/resend` — regenerates OTP for existing pendingToken (with expiry check)
- OTP: `crypto.randomInt` (not Math.random), 6 digits, 10-min expiry, max 5 attempts per token
- `app/admin/login/page.tsx` — two-step UI, custom 6-box OTP input (no library), auto-advance, backspace, paste support, 60s resend countdown, Back button

### bcrypt password hashing
- `ADMIN_PASSWORD` → replaced with `ADMIN_PASSWORD_HASH` (bcrypt cost 12)
- `verifyPassword()` in `lib/admin/auth.ts` uses `bcrypt.compare`
- Generate hash: `node -e "require('bcryptjs').hash('yourpassword',12,(e,h)=>console.log(h))"`

### Rate limiting (Upstash)
- Login: 5 attempts / 15 min (existing, unchanged)
- OTP verify: 5 attempts / 10 min (`acme_admin_otp_verify`)
- OTP resend: 3 requests / 10 min (`acme_admin_otp_resend`)

### Security HTTP headers (`next.config.ts`)
- Storefront (`/((?!admin).*)`): HSTS, X-Content-Type-Options, X-Frame-Options (SAMEORIGIN), Referrer-Policy, Permissions-Policy — NO CSP (would break Shopify/Google Fonts)
- Admin (`/admin/:path*`): all above + strict CSP, Cache-Control: no-store, X-Permitted-Cross-Domain-Policies
- Admin CSP uses `'unsafe-eval'` in dev only (React/Turbopack requires it), not in production
- Admin X-Frame-Options: DENY + CSP `frame-ancestors 'none'`

### Resend domain setup
- Domain `acmevintagesupply.com` verified in Resend (US East — North Virginia)
- 3 DNS records added to GoDaddy: DKIM TXT (`resend._domainkey`), MX (`send`), SPF TXT (`send`)
- Receiving: disabled (outbound only)
- From address: `Acme Admin <no-reply@acmevintagesupply.com>`

## Key Env Vars

| Var | Purpose |
|---|---|
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password |
| `ADMIN_EMAIL` | OTP destination — comma-separated list: `jonathan.mauring17@gmail.com,scottsfi@hotmail.com,acmesign01@gmail.com`. All 3 receive the code simultaneously. Update to Scott's email(s) before go-live. |
| `RESEND_API_KEY` | Resend sending — already set |

## Post-Session Fixes
- **CSP `unsafe-eval` dev fix** — `next.config.ts` now adds `'unsafe-eval'` to admin `script-src` only when `NODE_ENV === 'development'`. React/Turbopack requires it in dev; production stays strict.
- **Multi-recipient OTP** — `sendOtpEmail()` in `lib/admin/auth.ts` splits `ADMIN_EMAIL` on commas and passes array to Resend `to` field. `maskEmail()` only masks the first address for the UI.
- **Custom 6-box OTP UI** — Replaced `input-otp` library (caused crash due to API mismatch) with a custom `OTPBoxes` component in `app/admin/login/page.tsx`. Handles auto-advance, backspace, arrow keys, paste, and mobile OTP autofill (`autoComplete="one-time-code"` on first box).

## Before Go-Live
- `ADMIN_EMAIL` already contains 3 addresses — confirm Scott's hotmail is correct before live

## Files Changed
- `lib/admin/auth.ts` — bcrypt, OTP store, sendOtpEmail, crypto.randomInt
- `lib/admin/ratelimit.ts` — OTP verify + resend limiters
- `app/api/admin/auth/route.ts` — password step only
- `app/api/admin/auth/otp/route.ts` — NEW
- `app/api/admin/auth/otp/resend/route.ts` — NEW
- `app/admin/login/page.tsx` — two-step UI
- `next.config.ts` — security headers

**Related:** [[project-acme-lamp-sign]]
