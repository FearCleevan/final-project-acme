# Promotional Email System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing footer newsletter form to Supabase, build an admin marketing page for composing and sending email campaigns, and add a Vercel Cron for scheduled sends.

**Architecture:** Supabase stores subscribers and campaigns. The existing `/api/newsletter` route is rewired from Google Apps Script to Supabase. A new `/admin/marketing` page provides subscriber management and campaign compose/send. A Vercel Cron hits `/api/cron/newsletter` every Monday to auto-send any scheduled draft.

**Tech Stack:** Next.js 16 App Router, Tailwind v4, Supabase (service role), Resend (batch send), iron-session (admin auth), Vercel Cron

## Global Constraints

- All Supabase access uses `function getSupabase() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!) }` — never module-level
- Admin API routes use `async function requireAuth()` with iron-session — return `401` if not logged in
- Tailwind v4: use CSS variable tokens like `text-(--admin-text)`, `bg-(--admin-surface)` — no hardcoded colors
- No `tailwind.config.ts` — all theme tokens are in CSS via `@theme {}`
- Auth pattern: `const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)` then `session.isLoggedIn`
- Imports: `import type { AdminSession } from '@/lib/admin/auth'` and `import { sessionOptions } from '@/lib/admin/session'`
- `revalidateTag` in this Next.js 16 version requires 2 arguments: `revalidateTag('tag', 'layout')`
- Email FROM address: `'Acme Vintage Supply <hello@acmevintagesupply.com>'` — already set as `FROM` constant in `lib/email.ts`
- SITE URL: already set as `const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmevintagesupply.com'` in `lib/email.ts`

---

### Task 1: Supabase Migration 007 — newsletter_subscribers + email_campaigns

**Files:**
- Create: `docs/supabase/migrations/007_newsletter.sql`

**Interfaces:**
- Produces: `newsletter_subscribers` table (email, subscribed_at, unsubscribed_at) and `email_campaigns` table (subject, body, cta_label, cta_url, status, scheduled_for, sent_at, recipient_count) — used by all subsequent tasks

- [ ] **Step 1: Create the migration file**

Create `docs/supabase/migrations/007_newsletter.sql` with this exact content:

```sql
-- 007_newsletter.sql
-- Run in Supabase Dashboard → SQL Editor

-- ── newsletter_subscribers ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email            text        UNIQUE NOT NULL,
  subscribed_at    timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at  timestamptz
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public access to newsletter_subscribers" ON newsletter_subscribers;
CREATE POLICY "No public access to newsletter_subscribers"
  ON newsletter_subscribers
  USING (false);

-- ── email_campaigns ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaigns (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject          text        NOT NULL,
  body             text        NOT NULL,
  cta_label        text,
  cta_url          text,
  status           text        NOT NULL DEFAULT 'draft',
  scheduled_for    timestamptz,
  sent_at          timestamptz,
  recipient_count  integer,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public access to email_campaigns" ON email_campaigns;
CREATE POLICY "No public access to email_campaigns"
  ON email_campaigns
  USING (false);
```

- [ ] **Step 2: Run in Supabase**

Go to Supabase Dashboard → SQL Editor → paste the file contents → Run.

Expected: "Success. No rows returned."

- [ ] **Step 3: Verify tables exist**

In Supabase Dashboard → Table Editor, confirm `newsletter_subscribers` and `email_campaigns` appear.

- [ ] **Step 4: Commit**

```bash
git add docs/supabase/migrations/007_newsletter.sql
git commit -m "chore(db): migration 007 — newsletter_subscribers + email_campaigns"
```

---

### Task 2: Subscriber API — rewire /api/newsletter + add /api/newsletter/unsubscribe

**Files:**
- Modify: `app/api/newsletter/route.ts`
- Create: `app/api/newsletter/unsubscribe/route.ts`

**Interfaces:**
- Consumes: `newsletter_subscribers` table from Task 1
- Produces:
  - `POST /api/newsletter` → `{ success: true }` (200) or `{ success: false }` (400/500)
  - `GET /api/newsletter/unsubscribe?email=<base64url>` → HTML page (200)

- [ ] **Step 1: Rewrite app/api/newsletter/route.ts**

Replace the entire file:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !EMAIL_RE.test(String(email))) {
      return NextResponse.json({ success: false }, { status: 400 })
    }
    const normalised = String(email).trim().toLowerCase()
    const supabase = getSupabase()

    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, unsubscribed_at')
      .eq('email', normalised)
      .maybeSingle()

    if (existing) {
      if (existing.unsubscribed_at) {
        await supabase
          .from('newsletter_subscribers')
          .update({ unsubscribed_at: null, subscribed_at: new Date().toISOString() })
          .eq('id', existing.id)
      }
      return NextResponse.json({ success: true })
    }

    await supabase.from('newsletter_subscribers').insert({ email: normalised })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create app/api/newsletter/unsubscribe/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const encoded = req.nextUrl.searchParams.get('email')
  if (!encoded) {
    return new NextResponse('<p>Invalid unsubscribe link.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }
  try {
    const email = Buffer.from(encoded, 'base64url').toString('utf8')
    await getSupabase()
      .from('newsletter_subscribers')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('email', email)
      .is('unsubscribed_at', null)

    return new NextResponse(
      `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Unsubscribed — Acme Vintage Supply</title>
<style>body{font-family:Georgia,serif;max-width:480px;margin:80px auto;padding:0 20px;color:#2C2C2A;}
h2{font-size:22px;}p{color:#6B6257;line-height:1.6;}a{color:#2C5F2E;}</style></head>
<body>
<h2>You've been unsubscribed.</h2>
<p>You'll no longer receive newsletter emails from Acme Vintage Supply.</p>
<p><a href="https://acmevintagesupply.com">Return to the shop →</a></p>
</body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  } catch {
    return new NextResponse('<p>Something went wrong. Please try again.</p>', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}
```

- [ ] **Step 3: Test the subscribe endpoint**

Start dev server (`npm run dev`). Run in PowerShell:

```powershell
# Valid email — expect { success: true }
Invoke-WebRequest -Uri "http://localhost:3000/api/newsletter" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"test-newsletter@example.com"}' | Select -Expand Content

# Invalid email — expect 400
try {
  Invoke-WebRequest -Uri "http://localhost:3000/api/newsletter" `
    -Method POST -ContentType "application/json" `
    -Body '{"email":"notanemail"}' -ErrorAction Stop
} catch { $_.Exception.Response.StatusCode.value__ }
```

Expected: first returns `{"success":true}`, second returns `400`.

Verify in Supabase: `SELECT * FROM newsletter_subscribers;` — row with `test-newsletter@example.com` exists.

- [ ] **Step 4: Test unsubscribe endpoint**

```powershell
# Encode email (base64url)
$encoded = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("test-newsletter@example.com")).Replace('+','-').Replace('/','_').TrimEnd('=')
Invoke-WebRequest -Uri "http://localhost:3000/api/newsletter/unsubscribe?email=$encoded" | Select -Expand Content
```

Expected: HTML page with "You've been unsubscribed." Check Supabase: `unsubscribed_at` is now set on that row.

- [ ] **Step 5: Commit**

```bash
git add app/api/newsletter/route.ts app/api/newsletter/unsubscribe/route.ts
git commit -m "feat(newsletter): rewire subscribe to Supabase + add unsubscribe endpoint"
```

---

### Task 3: sendNewsletter() in lib/email.ts

**Files:**
- Modify: `lib/email.ts` (append one function at the end)

**Interfaces:**
- Consumes: existing `resend`, `FROM`, `SITE` constants already at top of `lib/email.ts`
- Produces:
  ```ts
  export async function sendNewsletter(
    subscribers: { email: string }[],
    campaign: { subject: string; body: string; ctaLabel?: string; ctaUrl?: string }
  ): Promise<number>
  ```
  Returns count of emails sent. Used by Task 4 (send route) and Task 6 (cron).

- [ ] **Step 1: Append sendNewsletter to lib/email.ts**

Add this function at the very end of `lib/email.ts`:

```ts
export async function sendNewsletter(
  subscribers: { email: string }[],
  campaign: {
    subject:   string
    body:      string
    ctaLabel?: string
    ctaUrl?:   string
  }
): Promise<number> {
  if (!subscribers.length) return 0

  const bodyHtml = campaign.body
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p style="font-size:15px;line-height:1.7;color:#6B6257;margin:0 0 16px;">${line}</p>`)
    .join('')

  const ctaHtml = campaign.ctaLabel && campaign.ctaUrl
    ? `<a href="${campaign.ctaUrl}"
         style="display:inline-block;background:#2C5F2E;color:#F5F1E6;text-decoration:none;
                padding:12px 28px;border-radius:3px;font-family:sans-serif;
                font-size:14px;font-weight:600;margin-bottom:32px;">
         ${campaign.ctaLabel}
       </a>`
    : ''

  const BATCH = 50
  let sent = 0

  for (let i = 0; i < subscribers.length; i += BATCH) {
    const slice = subscribers.slice(i, i + BATCH)
    const messages = slice.map(sub => {
      const token = Buffer.from(sub.email).toString('base64url')
      return {
        from:    FROM,
        to:      sub.email,
        subject: campaign.subject,
        html: `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2C2C2A;">
  <h2 style="font-size:22px;font-weight:600;margin-bottom:20px;">${campaign.subject}</h2>
  ${bodyHtml}
  ${ctaHtml}
  <div style="border-top:1px solid #E8E0D4;padding-top:16px;margin-top:32px;">
    <p style="font-size:12px;color:#A89F94;line-height:1.6;margin:0;">
      Acme Vintage Supply · Dartmouth, Nova Scotia<br>
      You're receiving this because you subscribed at acmevintagesupply.com.<br>
      <a href="${SITE}/api/newsletter/unsubscribe?email=${token}"
         style="color:#A89F94;">Unsubscribe</a>
    </p>
  </div>
</div>`,
      }
    })
    await resend.batch.send(messages)
    sent += slice.length
    if (i + BATCH < subscribers.length) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  return sent
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/email.ts
git commit -m "feat(email): add sendNewsletter() with Resend batch + unsubscribe links"
```

---

### Task 4: Admin Marketing API Routes

**Files:**
- Create: `app/api/admin/marketing/subscribers/route.ts`
- Create: `app/api/admin/marketing/campaigns/route.ts`
- Create: `app/api/admin/marketing/campaigns/[id]/send/route.ts`

**Interfaces:**
- Consumes: `sendNewsletter()` from Task 3; `newsletter_subscribers` and `email_campaigns` tables from Task 1
- Produces:
  - `GET /api/admin/marketing/subscribers` → `Subscriber[]` or CSV
  - `GET /api/admin/marketing/campaigns` → `Campaign[]`
  - `POST /api/admin/marketing/campaigns` → `{ id, subject, status, created_at }`
  - `POST /api/admin/marketing/campaigns/[id]/send` → `{ ok: true, sent: number }`

- [ ] **Step 1: Create app/api/admin/marketing/subscribers/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

export async function GET(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getSupabase()
    .from('newsletter_subscribers')
    .select('email, subscribed_at, unsubscribed_at')
    .order('subscribed_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = data ?? []

  if (req.nextUrl.searchParams.get('format') === 'csv') {
    const csv = [
      'email,subscribed_at,status',
      ...rows.map(r =>
        `${r.email},${r.subscribed_at},${r.unsubscribed_at ? 'unsubscribed' : 'active'}`
      ),
    ].join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  return NextResponse.json(rows)
}
```

- [ ] **Step 2: Create app/api/admin/marketing/campaigns/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

export async function GET() {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabase()
    .from('email_campaigns')
    .select('id, subject, status, scheduled_for, sent_at, recipient_count, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { subject, body, cta_label, cta_url, scheduled_for } = await req.json()
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'subject and body are required' }, { status: 400 })
  }
  const { data, error } = await getSupabase()
    .from('email_campaigns')
    .insert({
      subject:       subject.trim(),
      body:          body.trim(),
      cta_label:     cta_label?.trim()  || null,
      cta_url:       cta_url?.trim()    || null,
      scheduled_for: scheduled_for      || null,
      status:        'draft',
    })
    .select('id, subject, status, created_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 3: Create app/api/admin/marketing/campaigns/[id]/send/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { createClient } from '@supabase/supabase-js'
import { sendNewsletter } from '@/lib/email'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const supabase = getSupabase()

  const { data: campaign, error: campErr } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (campErr || !campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  if (campaign.status === 'sent') return NextResponse.json({ error: 'Already sent' }, { status: 400 })

  const { data: subs } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .is('unsubscribed_at', null)

  const subscribers = subs ?? []
  if (!subscribers.length) return NextResponse.json({ ok: true, sent: 0 })

  const sent = await sendNewsletter(subscribers, {
    subject:  campaign.subject,
    body:     campaign.body,
    ctaLabel: campaign.cta_label  ?? undefined,
    ctaUrl:   campaign.cta_url    ?? undefined,
  })

  await supabase.from('email_campaigns').update({
    status:          'sent',
    sent_at:         new Date().toISOString(),
    recipient_count: sent,
  }).eq('id', id)

  return NextResponse.json({ ok: true, sent })
}
```

- [ ] **Step 4: Verify TypeScript**

```powershell
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Test subscribers route (must be logged into admin first)**

```powershell
# GET subscribers — expect [] or rows
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/marketing/subscribers" `
  -WebSession $session | Select -Expand Content
```

Without auth, expect `{"error":"Unauthorized"}` with 401.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/marketing/
git commit -m "feat(marketing): admin API routes for subscribers + campaigns + send"
```

---

### Task 5: Admin Marketing Page — /admin/marketing

**Files:**
- Create: `app/admin/marketing/page.tsx`

**Interfaces:**
- Consumes:
  - `GET /api/admin/marketing/subscribers` → `{ email: string, subscribed_at: string, unsubscribed_at: string | null }[]`
  - `GET /api/admin/marketing/campaigns` → `{ id: string, subject: string, status: string, scheduled_for: string | null, sent_at: string | null, recipient_count: number | null, created_at: string }[]`
  - `POST /api/admin/marketing/campaigns` with `{ subject, body, cta_label?, cta_url?, scheduled_for? }`
  - `POST /api/admin/marketing/campaigns/[id]/send`

- [ ] **Step 1: Create app/admin/marketing/page.tsx**

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/admin/shared/PageHeader'
import SectionCard from '@/components/admin/shared/SectionCard'
import Badge from '@/components/admin/shared/Badge'
import Toast, { ToastType } from '@/components/admin/shared/Toast'
import { cn } from '@/lib/utils'
import {
  BiGroup, BiEnvelopeOpen, BiDownload, BiPlus, BiSend,
  BiLoader, BiX, BiCalendar,
} from 'react-icons/bi'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Subscriber {
  email:            string
  subscribed_at:    string
  unsubscribed_at:  string | null
}

interface Campaign {
  id:               string
  subject:          string
  status:           'draft' | 'sent'
  scheduled_for:    string | null
  sent_at:          string | null
  recipient_count:  number | null
  created_at:       string
}

type Tab = 'subscribers' | 'campaigns'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const [tab, setTab] = useState<Tab>('subscribers')

  // Subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [subsLoading,  setSubsLoading]  = useState(true)

  // Campaigns state
  const [campaigns,     setCampaigns]     = useState<Campaign[]>([])
  const [campsLoading,  setCampsLoading]  = useState(true)

  // Compose form state
  const [composing,    setComposing]    = useState(false)
  const [subject,      setSubject]      = useState('')
  const [body,         setBody]         = useState('')
  const [ctaLabel,     setCtaLabel]     = useState('')
  const [ctaUrl,       setCtaUrl]       = useState('')
  const [scheduleFor,  setScheduleFor]  = useState('')
  const [previewing,   setPreviewing]   = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [sending,      setSending]      = useState<string | null>(null)  // campaign id being sent

  // Toast
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type })
  }

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadSubscribers = useCallback(async () => {
    setSubsLoading(true)
    try {
      const r = await fetch('/api/admin/marketing/subscribers')
      if (r.ok) setSubscribers(await r.json())
    } finally {
      setSubsLoading(false)
    }
  }, [])

  const loadCampaigns = useCallback(async () => {
    setCampsLoading(true)
    try {
      const r = await fetch('/api/admin/marketing/campaigns')
      if (r.ok) setCampaigns(await r.json())
    } finally {
      setCampsLoading(false)
    }
  }, [])

  useEffect(() => { loadSubscribers() }, [loadSubscribers])
  useEffect(() => { loadCampaigns() }, [loadCampaigns])

  // ── Actions ────────────────────────────────────────────────────────────────

  function handleExportCsv() {
    window.location.href = '/api/admin/marketing/subscribers?format=csv'
  }

  function resetCompose() {
    setSubject(''); setBody(''); setCtaLabel(''); setCtaUrl('')
    setScheduleFor(''); setPreviewing(false); setComposing(false)
  }

  async function handleSaveDraft() {
    if (!subject.trim() || !body.trim()) {
      showToast('Subject and body are required.', 'error'); return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, body,
          cta_label:     ctaLabel || null,
          cta_url:       ctaUrl   || null,
          scheduled_for: scheduleFor || null,
        }),
      })
      if (!r.ok) throw new Error()
      showToast('Draft saved.')
      resetCompose()
      await loadCampaigns()
    } catch {
      showToast('Failed to save draft.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSendNow() {
    if (!subject.trim() || !body.trim()) {
      showToast('Subject and body are required.', 'error'); return
    }
    setSaving(true)
    try {
      // Save draft first to get an id
      const saveRes = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, body,
          cta_label: ctaLabel || null,
          cta_url:   ctaUrl   || null,
        }),
      })
      if (!saveRes.ok) throw new Error('Failed to create campaign')
      const { id } = await saveRes.json()

      const sendRes = await fetch(`/api/admin/marketing/campaigns/${id}/send`, {
        method: 'POST',
      })
      if (!sendRes.ok) throw new Error('Failed to send')
      const { sent } = await sendRes.json()
      showToast(`Sent to ${sent} subscriber${sent === 1 ? '' : 's'}.`)
      resetCompose()
      await loadCampaigns()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Send failed.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSendExisting(campaignId: string) {
    setSending(campaignId)
    try {
      const r = await fetch(`/api/admin/marketing/campaigns/${campaignId}/send`, {
        method: 'POST',
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error ?? 'Send failed')
      showToast(`Sent to ${json.sent} subscriber${json.sent === 1 ? '' : 's'}.`)
      await loadCampaigns()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Send failed.', 'error')
    } finally {
      setSending(null)
    }
  }

  // ── Preview HTML ───────────────────────────────────────────────────────────

  function buildPreviewHtml() {
    const bodyHtml = body
      .split('\n')
      .filter(l => l.trim())
      .map(l => `<p style="font-size:15px;line-height:1.7;color:#6B6257;margin:0 0 16px;">${l}</p>`)
      .join('')
    const ctaHtml = ctaLabel && ctaUrl
      ? `<a href="${ctaUrl}" style="display:inline-block;background:#2C5F2E;color:#F5F1E6;text-decoration:none;padding:12px 28px;border-radius:3px;font-family:sans-serif;font-size:14px;font-weight:600;margin-bottom:32px;">${ctaLabel}</a>`
      : ''
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;background:#F5F1E6;padding:40px 16px;">
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#FDFAF6;border:1px solid #E8E0D4;border-radius:8px;padding:40px 40px 32px;">
<h2 style="font-size:22px;font-weight:600;margin:0 0 20px;color:#2C2C2A;">${subject || '(No subject)'}</h2>
${bodyHtml}${ctaHtml}
<div style="border-top:1px solid #E8E0D4;padding-top:16px;margin-top:32px;">
<p style="font-size:12px;color:#A89F94;line-height:1.6;margin:0;">
Acme Vintage Supply · Dartmouth, Nova Scotia<br>
You're receiving this because you subscribed at acmevintagesupply.com.<br>
<a href="#" style="color:#A89F94;">Unsubscribe</a></p></div></div>
</body></html>`
  }

  const activeCount = subscribers.filter(s => !s.unsubscribed_at).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title="Marketing" subtitle="Newsletter subscribers and email campaigns" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-(--admin-border)">
        {([
          { id: 'subscribers', label: 'Subscribers', icon: BiGroup },
          { id: 'campaigns',   label: 'Campaigns',   icon: BiEnvelopeOpen },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-(--admin-accent) text-(--admin-accent)'
                : 'border-transparent text-(--admin-text-soft) hover:text-(--admin-text)'
            )}
          >
            <t.icon size={15} />
            {t.label}
            {t.id === 'subscribers' && activeCount > 0 && (
              <Badge variant="default">{activeCount}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* ── Subscribers Tab ── */}
      {tab === 'subscribers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] text-(--admin-text-soft)">
              <span className="font-semibold text-(--admin-text)">{activeCount}</span> active subscriber{activeCount === 1 ? '' : 's'}
            </p>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-(--admin-border) text-[12px] text-(--admin-text-soft) hover:text-(--admin-text) hover:bg-(--admin-surface-2) transition-colors"
            >
              <BiDownload size={14} />
              Export CSV
            </button>
          </div>

          <SectionCard noPadding>
            {subsLoading ? (
              <div className="flex items-center justify-center py-12 text-(--admin-text-muted)">
                <BiLoader size={20} className="animate-spin mr-2" /> Loading…
              </div>
            ) : subscribers.length === 0 ? (
              <p className="text-center py-12 text-[14px] text-(--admin-text-muted)">No subscribers yet.</p>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-(--admin-border)">
                    <th className="text-left px-4 py-3 font-medium text-(--admin-text-muted)">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-(--admin-text-muted)">Subscribed</th>
                    <th className="text-left px-4 py-3 font-medium text-(--admin-text-muted)">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--admin-border)">
                  {subscribers.map(s => (
                    <tr key={s.email} className="hover:bg-(--admin-surface-2) transition-colors">
                      <td className="px-4 py-3 text-(--admin-text)">{s.email}</td>
                      <td className="px-4 py-3 text-(--admin-text-soft)">{fmtDate(s.subscribed_at)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.unsubscribed_at ? 'warning' : 'success'}>
                          {s.unsubscribed_at ? 'Unsubscribed' : 'Active'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── Campaigns Tab ── */}
      {tab === 'campaigns' && (
        <div className="space-y-4">
          {!composing && (
            <div className="flex justify-end">
              <button
                onClick={() => setComposing(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-(--admin-accent) text-(--admin-accent-text) text-[13px] font-medium hover:opacity-90 transition-opacity"
              >
                <BiPlus size={16} />
                New Campaign
              </button>
            </div>
          )}

          {/* Compose panel */}
          {composing && (
            <SectionCard>
              <div className="flex items-center justify-between mb-5">
                <p className="text-[14px] font-semibold text-(--admin-text)">New Campaign</p>
                <button
                  onClick={resetCompose}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-(--admin-surface-2) text-(--admin-text-muted) transition-colors"
                >
                  <BiX size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">Subject *</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Your monthly bench notes are here"
                    className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">Body * <span className="font-normal">(each line becomes a paragraph)</span></label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={8}
                    placeholder={"This month from the workshop...\n\nWe've had some interesting pieces come through the bench."}
                    className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">CTA Button Label <span className="font-normal">(optional)</span></label>
                    <input
                      type="text"
                      value={ctaLabel}
                      onChange={e => setCtaLabel(e.target.value)}
                      placeholder="Shop new arrivals →"
                      className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">CTA URL <span className="font-normal">(optional)</span></label>
                    <input
                      type="url"
                      value={ctaUrl}
                      onChange={e => setCtaUrl(e.target.value)}
                      placeholder="https://acmevintagesupply.com/catalog"
                      className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">
                    <BiCalendar size={12} className="inline mr-1" />
                    Schedule for <span className="font-normal">(optional — leave blank to send manually)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleFor}
                    onChange={e => setScheduleFor(e.target.value)}
                    className="px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) focus:outline-none focus:border-(--admin-accent) transition-colors"
                  />
                </div>

                {/* Preview toggle */}
                <div>
                  <button
                    onClick={() => setPreviewing(p => !p)}
                    className="text-[12px] text-(--admin-accent) hover:underline"
                  >
                    {previewing ? 'Hide preview' : 'Show preview'}
                  </button>
                </div>

                {previewing && (
                  <div className="rounded-lg border border-(--admin-border) overflow-hidden">
                    <p className="px-3 py-2 text-[11px] font-mono text-(--admin-text-muted) bg-(--admin-surface-2) border-b border-(--admin-border)">
                      Email preview
                    </p>
                    <iframe
                      srcDoc={buildPreviewHtml()}
                      sandbox="allow-same-origin"
                      className="w-full h-125 bg-white"
                      title="Email preview"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSendNow}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-(--admin-accent) text-(--admin-accent-text) text-[13px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {saving ? <BiLoader size={14} className="animate-spin" /> : <BiSend size={14} />}
                    Send Now
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-md border border-(--admin-border) text-[13px] text-(--admin-text-soft) hover:text-(--admin-text) hover:bg-(--admin-surface-2) disabled:opacity-50 transition-colors"
                  >
                    Save Draft
                  </button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Campaign list */}
          <SectionCard noPadding>
            {campsLoading ? (
              <div className="flex items-center justify-center py-12 text-(--admin-text-muted)">
                <BiLoader size={20} className="animate-spin mr-2" /> Loading…
              </div>
            ) : campaigns.length === 0 ? (
              <p className="text-center py-12 text-[14px] text-(--admin-text-muted)">No campaigns yet. Create one above.</p>
            ) : (
              <div className="divide-y divide-(--admin-border)">
                {campaigns.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3 gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-(--admin-text) truncate">{c.subject}</p>
                      <p className="text-[12px] text-(--admin-text-muted) mt-0.5">
                        {c.status === 'sent'
                          ? `Sent ${c.sent_at ? fmtDate(c.sent_at) : '—'} · ${c.recipient_count ?? 0} recipient${c.recipient_count === 1 ? '' : 's'}`
                          : c.scheduled_for
                            ? `Scheduled for ${fmtDate(c.scheduled_for)}`
                            : `Draft · ${fmtDate(c.created_at)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={c.status === 'sent' ? 'success' : 'warning'}>
                        {c.status === 'sent' ? 'Sent' : 'Draft'}
                      </Badge>
                      {c.status === 'draft' && (
                        <button
                          onClick={() => handleSendExisting(c.id)}
                          disabled={sending === c.id}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-md border border-(--admin-border) text-[12px] text-(--admin-text-soft) hover:text-(--admin-text) hover:bg-(--admin-surface-2) disabled:opacity-50 transition-colors"
                        >
                          {sending === c.id
                            ? <BiLoader size={12} className="animate-spin" />
                            : <BiSend size={12} />}
                          Send
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```powershell
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Test the page manually**

Visit `http://localhost:3000/admin/marketing` (must be logged in).

- Subscribers tab: shows the test email from Task 2, Export CSV button works
- Campaigns tab: New Campaign opens compose form, Preview shows email HTML, Save Draft creates a draft, Send Now sends

- [ ] **Step 4: Commit**

```bash
git add app/admin/marketing/page.tsx
git commit -m "feat(admin): marketing page — subscribers table + campaign compose + send"
```

---

### Task 6: Vercel Cron — Weekly Newsletter Auto-Send

**Files:**
- Create: `app/api/cron/newsletter/route.ts`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: `sendNewsletter()` from Task 3; `email_campaigns` and `newsletter_subscribers` tables from Task 1
- Produces: `GET /api/cron/newsletter` — Vercel calls this every Monday at 12:00 UTC

- [ ] **Step 1: Add CRON_SECRET to .env.local**

Add this line to `.env.local`:
```
CRON_SECRET="acme-cron-secret-change-in-production"
```

Also add `CRON_SECRET` to Vercel environment variables (Settings → Environment Variables) with a strong random value. Generate one with:

```powershell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

- [ ] **Step 2: Create app/api/cron/newsletter/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNewsletter } from '@/lib/email'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('status', 'draft')
    .not('scheduled_for', 'is', null)
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!campaign) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no scheduled campaign' })
  }

  const { data: subs } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .is('unsubscribed_at', null)

  const subscribers = subs ?? []
  if (!subscribers.length) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no active subscribers' })
  }

  const sent = await sendNewsletter(subscribers, {
    subject:  campaign.subject,
    body:     campaign.body,
    ctaLabel: campaign.cta_label  ?? undefined,
    ctaUrl:   campaign.cta_url    ?? undefined,
  })

  await supabase.from('email_campaigns').update({
    status:          'sent',
    sent_at:         new Date().toISOString(),
    recipient_count: sent,
  }).eq('id', campaign.id)

  return NextResponse.json({ ok: true, sent, campaign_id: campaign.id })
}
```

- [ ] **Step 3: Add crons array to vercel.json**

In `vercel.json`, add a `"crons"` key after `"redirects"`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "crons": [
    {
      "path": "/api/cron/newsletter",
      "schedule": "0 12 * * 1"
    }
  ],
  "headers": [ ... ],
  "rewrites": [ ... ],
  "redirects": [ ... ]
}
```

(Keep all existing `headers`, `rewrites`, `redirects` arrays unchanged — only add the `"crons"` block.)

- [ ] **Step 4: Test cron endpoint**

```powershell
$secret = $env:CRON_SECRET  # or paste value directly
Invoke-WebRequest -Uri "http://localhost:3000/api/cron/newsletter" `
  -Headers @{ Authorization = "Bearer $secret" } | Select -Expand Content
```

Expected: `{"ok":true,"sent":0,"reason":"no scheduled campaign"}` (since no draft with `scheduled_for` in the past exists yet).

Without auth header, expect `{"error":"Unauthorized"}` with 401.

- [ ] **Step 5: Verify TypeScript**

```powershell
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/cron/newsletter/route.ts vercel.json
git commit -m "feat(cron): weekly newsletter auto-send every Monday 12:00 UTC"
```

---

### Task 7: Admin Nav Wiring — Sidebar + BottomNav

**Files:**
- Modify: `components/admin/layout/AdminSidebar.tsx`
- Modify: `components/admin/layout/AdminBottomNav.tsx`

**Interfaces:**
- Consumes: `/admin/marketing` route from Task 5
- Produces: Marketing nav item visible in both sidebar and mobile bottom nav

- [ ] **Step 1: Add BiEnvelopeOpen import to AdminSidebar.tsx**

In `components/admin/layout/AdminSidebar.tsx`, add `BiEnvelopeOpen` to the existing react-icons/bi import:

```ts
import {
  BiHomeAlt, BiCart, BiPackage, BiArchive, BiCollection,
  BiUser, BiBarChartAlt2, BiCog, BiLogOut, BiSun, BiMoon,
  BiEditAlt, BiStar, BiHistory, BiMessageSquareDetail,
  BiEnvelopeOpen,  // ← add this
} from 'react-icons/bi'
```

- [ ] **Step 2: Add Marketing to NAV_MAIN in AdminSidebar.tsx**

Find the `NAV_MAIN` array in `AdminSidebar.tsx`. Insert the Marketing item between Communications and Reviews:

```ts
{ label: 'Communications', href: '/admin/communications', icon: BiMessageSquareDetail, badge: unreadContactCount || undefined },
{ label: 'Marketing',      href: '/admin/marketing',      icon: BiEnvelopeOpen                                               },  // ← add this line
{ label: 'Reviews',        href: '/admin/reviews',        icon: BiStar, badge: pendingReviewCount || undefined               },
```

- [ ] **Step 3: Add BiEnvelopeOpen import to AdminBottomNav.tsx**

In `components/admin/layout/AdminBottomNav.tsx`, add `BiEnvelopeOpen` to the existing react-icons/bi import:

```ts
import {
  BiHomeAlt, BiCart, BiPackage, BiUser, BiDotsHorizontalRounded,
  BiArchive, BiCollection, BiBarChartAlt2, BiCog, BiX,
  BiEditAlt, BiStar, BiHistory, BiMessageSquareDetail,
  BiEnvelopeOpen,  // ← add this
} from 'react-icons/bi'
```

- [ ] **Step 4: Add Marketing to MORE_ITEMS in AdminBottomNav.tsx**

Find the `MORE_ITEMS` array in `AdminBottomNav.tsx`. Insert between Communications and Reviews:

```ts
{ label: 'Communications', href: '/admin/communications', icon: BiMessageSquareDetail },
{ label: 'Marketing',      href: '/admin/marketing',      icon: BiEnvelopeOpen        },  // ← add this line
{ label: 'Reviews',        href: '/admin/reviews',        icon: BiStar                },
```

- [ ] **Step 5: Verify in browser**

Visit `http://localhost:3000/admin/overview`. Confirm:
- "Marketing" appears in sidebar between Communications and Reviews
- On mobile (or narrow viewport), "Marketing" appears in the More drawer between Communications and Reviews
- Clicking Marketing navigates to `/admin/marketing`

- [ ] **Step 6: Final TypeScript check**

```powershell
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add components/admin/layout/AdminSidebar.tsx components/admin/layout/AdminBottomNav.tsx
git commit -m "feat(admin): add Marketing nav item to sidebar and bottom nav"
```
