# Admin Password Reset — Full Fix Design
**Date:** 2026-06-16  
**Status:** Approved

## Problem

Four issues with the admin forgot/reset password flow:
1. No eye icon to show/hide password on the reset form
2. No real-time password match validation between New Password and Confirm Password
3. No password strength indicator
4. Password reset does not actually update the password — the reset route logs the new bcrypt hash to the server console and expects the admin to manually copy it into Vercel env vars. On the live site those logs are invisible, so the password is never changed.

## Solution

### Fix 1: Redis-backed password storage

Move the active password hash from a static env var into Upstash Redis so it can be written to at runtime.

- **Redis key:** `acme:admin:password_hash`
- **`verifyPassword()` in `lib/admin/auth.ts`:** reads Redis key first; if present, bcrypt-compares against it. Falls back to `ADMIN_PASSWORD_HASH` env var if Redis has no value (first-time setup, local dev without Redis).
- **Reset route (`app/api/admin/auth/reset/route.ts`):** after validating the token, hashes the new password with bcrypt cost 12 and writes it to `acme:admin:password_hash` in Redis. Removes the `console.log` hack entirely.
- **Effect:** password change is immediate and survives deploys. The `ADMIN_PASSWORD_HASH` env var becomes the one-time seed value only.

### Fix 2: Eye icon toggle

Both fields on the reset form (`app/admin/reset-password/page.tsx`) get an independent show/hide toggle:
- `BiShow` / `BiHide` icon button on the right side of each input
- Each field has its own `showPassword` / `showConfirm` boolean state
- Clicking toggles `type="password"` ↔ `type="text"`

### Fix 3: Real-time match validation

- `useEffect` watches `confirm` and `password` fields
- If `confirm` is non-empty and does not equal `password`, sets a `matchError` state
- `matchError` renders as small red text below the Confirm field, clears automatically when they match
- Submit-time validation also remains as a final guard

### Fix 4: Password strength indicator

Rendered directly below the New Password field. Only visible after the user starts typing.

**Scoring logic:**
- Count how many character types are present: lowercase, uppercase, digit, special char (`!@#$%^&*` etc.)
- **Weak** (1 type, or length < 8): red bar, "Weak" label
- **Medium** (2 types, length ≥ 8): amber bar, "Medium" label  
- **Strong** (3+ types, length ≥ 8): green bar, "Strong" label

UI: three equal segments, filled left-to-right based on score. Label sits to the right.

## Files Changed

| File | Change |
|---|---|
| `lib/admin/auth.ts` | `verifyPassword()` reads Redis first, falls back to env var |
| `app/api/admin/auth/reset/route.ts` | Writes new hash to Redis, removes console.log hack, updates success response |
| `app/admin/reset-password/page.tsx` | Eye icons, strength bar, real-time match error, updated success message |

## Success criteria

- Completing the reset flow on the live site immediately allows login with the new password — no Vercel action required
- Both password fields have working show/hide toggles
- Confirm field shows live mismatch error as user types
- Strength bar appears and updates in real time as user types the new password
- `verifyPassword()` falls back gracefully to env var when Redis has no hash (local dev, first login ever)
