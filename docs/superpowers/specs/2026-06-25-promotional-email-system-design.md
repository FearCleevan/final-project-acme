# Promotional Email System — Design Spec
**Date:** 2026-06-25
**Author:** Peter Paul Abillar Lazan
**Status:** Approved

---

## Goal

Wire the existing footer newsletter opt-in to Supabase, build an admin marketing page for composing and sending campaigns, and add a Vercel Cron job for scheduled sends — all using the existing Resend integration and brand email style.

---

## 1. Data Layer — Migration 007

**File:** `docs/supabase/migrations/007_newsletter.sql`

### `newsletter_subscribers`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PRIMARY KEY | `gen_random_uuid()` |
| `email` | `text` UNIQUE NOT NULL | lowercase, trimmed |
| `subscribed_at` | `timestamptz` NOT NULL | `DEFAULT now()` |
| `unsubscribed_at` | `timestamptz` | NULL = active subscriber |

RLS enabled. `USING (false)` policy — service_role only.

### `email_campaigns`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PRIMARY KEY | `gen_random_uuid()` |
| `subject` | `text` NOT NULL | email subject line |
| `body` | `text` NOT NULL | plain paragraphs, newline-separated |
| `cta_label` | `text` | optional CTA button label |
| `cta_url` | `text` | optional CTA button URL |
| `status` | `text` NOT NULL | `'draft'` or `'sent'` |
| `scheduled_for` | `timestamptz` | NULL = manual send only |
| `sent_at` | `timestamptz` | set when actually sent |
| `recipient_count` | `integer` | set when actually sent |
| `created_at` | `timestamptz` NOT NULL | `DEFAULT now()` |

RLS enabled. `USING (false)` policy — service_role only.

Both tables use the same lazy `getSupabase()` pattern as all other Supabase code in this project.

---

## 2. Subscriber API

### `POST /api/newsletter` — opt-in (existing file, rewired)

**Current behaviour:** proxies to Google Apps Script via `CONTACT_SCRIPT_URL`.

**New behaviour:**
- Validate email format (regex)
- Upsert into `newsletter_subscribers`:
  - If email doesn't exist → insert
  - If email exists and `unsubscribed_at IS NOT NULL` → set `unsubscribed_at = NULL` (resubscribe)
  - If email exists and active → no-op
- Always return `{ success: true }` for valid email (prevents enumeration)
- Return `{ success: false }` with `400` for missing/invalid email

### `GET /api/newsletter/unsubscribe` — opt-out (new file)

Query param: `?email=<base64url-encoded-email>`

- Decode email from base64url
- Set `unsubscribed_at = now()` where `email = decoded`
- Return a plain HTML page: "You've been unsubscribed from Acme Vintage Supply emails."
- No auth required (public link from email footer)

The unsubscribe link format in every campaign email:
```
${SITE}/api/newsletter/unsubscribe?email=${Buffer.from(email).toString('base64url')}
```

No JWT needed — base64url encoding is sufficient for a newsletter unsubscribe link. The email address itself is the identifier.

---

## 3. Admin Marketing Page — `/admin/marketing`

Protected by existing iron-session auth middleware (same as all `/admin/*` routes).

### Layout

Two tabs: **Subscribers** and **Campaigns**. Tab state is client-side (`useState`).

### Subscribers Tab

- Stat line: "X active subscribers" (count from API)
- Table: email, subscribed date, status (Active / Unsubscribed)
- **Export CSV** button — triggers `GET /api/admin/marketing/subscribers?format=csv` which returns a `text/csv` response the browser downloads directly

### Campaigns Tab

- List of past campaigns: subject, sent date, recipient count, status badge (`Draft` amber / `Sent` green)
- **+ New Campaign** button — opens a compose panel (not a modal — inline below the list)

### Compose Panel

Fields:
- **Subject** — text input, required
- **Body** — textarea (min 4 rows), required. Each newline becomes a `<p>` in the email.
- **CTA Label** — text input, optional (e.g. "Shop new arrivals →")
- **CTA URL** — URL input, optional
- **Schedule for** — date+time picker, optional. If blank, draft is manual-send only.

Actions:
- **Preview** — renders email HTML in a sandboxed `<iframe>` below the form (client-side render, no server round-trip)
- **Save Draft** — `POST /api/admin/marketing/campaigns` with `status: 'draft'`
- **Send Now** — `POST /api/admin/marketing/campaigns/[id]/send` (or creates + sends in one step if unsaved)

---

## 4. Admin API Routes

### `GET /api/admin/marketing/subscribers`

- Auth guard: return `401` if no session
- Query param `?format=csv` → returns CSV; otherwise returns JSON array
- JSON: `[{ email, subscribed_at, unsubscribed_at }]` — all subscribers (active + unsubscribed)
- CSV columns: `email,subscribed_at,status`

### `POST /api/admin/marketing/campaigns`

- Auth guard
- Body: `{ subject, body, cta_label?, cta_url?, scheduled_for? }`
- Validates: `subject` and `body` required
- Inserts with `status: 'draft'`
- Returns: `{ id, subject, status, created_at }`

### `GET /api/admin/marketing/campaigns`

- Auth guard
- Returns all campaigns ordered by `created_at DESC`
- Returns: `[{ id, subject, status, scheduled_for, sent_at, recipient_count, created_at }]`

### `POST /api/admin/marketing/campaigns/[id]/send`

- Auth guard
- Fetches campaign by `id` — returns `404` if not found, `400` if already `sent`
- Fetches all active subscribers (`unsubscribed_at IS NULL`)
- If 0 subscribers → returns `{ ok: true, sent: 0 }` without sending
- Sends via `sendNewsletter()` in `lib/email.ts` (see below)
- Updates campaign: `status = 'sent'`, `sent_at = now()`, `recipient_count = n`
- Returns `{ ok: true, sent: n }`

**Resend batch limit:** Resend free tier allows up to 100 emails/day. For lists > 100, the route sends in batches of 50 with a 1-second delay between batches using `resend.batch.send()`.

---

## 5. Email Template — `sendNewsletter()`

Added to `lib/email.ts`.

Signature:
```ts
export async function sendNewsletter(
  subscribers: { email: string }[],
  campaign: {
    subject:   string
    body:      string
    ctaLabel?: string
    ctaUrl?:   string
  }
): Promise<number>
```

Returns the number of emails actually sent.

Template style matches existing emails: Georgia serif, `#2C2C2A` ink, `#FDFAF6` parchment background, `#2C5F2E` green CTA button.

Body rendering: split on `\n`, wrap each non-empty line in `<p>` tags.

Every email footer includes:
```
Acme Vintage Supply · Dartmouth, Nova Scotia
You're receiving this because you subscribed at acmevintagesupply.com.
Unsubscribe
```

The "Unsubscribe" text links to `/api/newsletter/unsubscribe?email=<base64url>`.

Uses `resend.batch.send()` with individual `to` per subscriber (not BCC) so each unsubscribe link is personalised.

---

## 6. Vercel Cron — Weekly Auto-Send

**File:** `app/api/cron/newsletter/route.ts`

**Schedule:** Every Monday at 12:00 UTC (9 AM AT / Atlantic Time, summer offset UTC-3).

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/newsletter",
      "schedule": "0 12 * * 1"
    }
  ]
}
```

**Route logic:**
1. Verify `Authorization: Bearer ${CRON_SECRET}` header (Vercel sets this automatically)
2. Query `email_campaigns WHERE status = 'draft' AND scheduled_for <= now() ORDER BY scheduled_for ASC LIMIT 1`
3. If none found → return `{ ok: true, sent: 0, reason: 'no scheduled campaign' }`
4. Call the same send logic as the `/send` API route
5. Return `{ ok: true, sent: n, campaign_id: id }`

**`CRON_SECRET`** — add to Vercel env vars and `.env.local`. Vercel injects it automatically into cron requests.

---

## 7. Admin Sidebar

Add **Marketing** nav item to `AdminSidebar.tsx` and `AdminBottomNav.tsx`:
- Label: `Marketing`
- Icon: `BiEnvelopeOpen` (from react-icons/bi)
- Href: `/admin/marketing`
- Position: between Communications and Reviews

---

## 8. Files Changed

| File | Change |
|---|---|
| `docs/supabase/migrations/007_newsletter.sql` | NEW |
| `app/api/newsletter/route.ts` | MODIFY — Supabase upsert |
| `app/api/newsletter/unsubscribe/route.ts` | NEW |
| `app/api/admin/marketing/subscribers/route.ts` | NEW |
| `app/api/admin/marketing/campaigns/route.ts` | NEW — GET + POST |
| `app/api/admin/marketing/campaigns/[id]/send/route.ts` | NEW |
| `app/api/cron/newsletter/route.ts` | NEW |
| `app/admin/marketing/page.tsx` | NEW |
| `lib/email.ts` | MODIFY — add `sendNewsletter()` |
| `components/admin/layout/AdminSidebar.tsx` | MODIFY — Marketing nav |
| `components/admin/layout/AdminBottomNav.tsx` | MODIFY — Marketing nav |
| `vercel.json` | NEW/MODIFY — cron schedule |

---

## 9. Out of Scope

- No email open/click tracking (Resend provides this on paid plans — not configured)
- No subscriber segmentation (single list)
- No rich HTML editor — plain text body only
- No double opt-in confirmation email
- No import of existing subscriber list (manual Supabase insert if needed)
