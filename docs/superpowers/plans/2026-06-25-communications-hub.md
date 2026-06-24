# Customer Communications Hub — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace scattered restock waitlists (buried in product pages) and Google Apps Script contact/bench-note workflows with a unified `/admin/communications` page featuring three tabs: Restock Waitlist, Contact Inbox, and Bench Notes.

**Architecture:** New Supabase tables for `contact_messages` and `bench_notes` replace the Apps Script dependency. The contact form's `/api/contact` route is updated to write to Supabase and fire an admin alert email. Three new admin API route groups feed a single tabbed page component. The existing `notify-restock` endpoint is reused for the Waitlist tab's notify buttons.

**Tech Stack:** Next.js 16 App Router, Tailwind v4 CSS variable tokens, Supabase (service_role client), iron-session, Resend, react-icons/bi

## Global Constraints

- Tailwind v4 only — use `bg-(--admin-green)` token syntax, NEVER `bg-[#hex]` or `bg-admin-green`
- All admin routes must call `requireAuth()` using iron-session + `sessionOptions` from `@/lib/admin/session` — same pattern as every existing admin route
- Supabase client in server routes: `createClient(NEXT_PUBLIC_SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)` — never anon key
- `lib/email.ts` already declares `resend`, `FROM`, `SITE` constants — do NOT redeclare them; append new functions only
- No `requireAuth` on public API routes (`/api/contact`) — these are called by the storefront
- All admin page components are `'use client'` and use `fetch()` to call their own API routes
- Existing notify-restock endpoint: `POST /api/admin/products/notify-restock` with body `{ productHandle: string }` — reuse it, do not duplicate
- Toast component import path: `@/components/admin/shared/Toast` — type `ToastType = 'success' | 'error' | 'info'`
- `SectionCard` accepts `noPadding` prop for table layouts
- Badge component: `<Badge label="text" variant="green"|"amber"|"red"|"neutral" />`

---

## File Structure

```
New files:
  docs/supabase/migrations/006_communications.sql
  app/api/admin/communications/waitlist/route.ts
  app/api/admin/communications/contacts/route.ts
  app/api/admin/communications/contacts/[id]/route.ts
  app/api/admin/communications/bench-notes/route.ts
  app/api/admin/communications/bench-notes/[id]/route.ts
  app/admin/communications/page.tsx

Modified files:
  app/api/contact/route.ts          — replace Apps Script with Supabase + admin email
  lib/email.ts                      — append sendContactAdminAlert()
  components/admin/layout/AdminSidebar.tsx   — add Communications nav item with unread badge
  components/admin/layout/AdminBottomNav.tsx — add Communications to MORE_ITEMS
```

---

### Task 1: Supabase migration — contact_messages + bench_notes

**Files:**
- Create: `docs/supabase/migrations/006_communications.sql`

**Interfaces:**
- Produces: `contact_messages` table, `bench_notes` table — consumed by Tasks 3, 4, 5

- [ ] **Step 1: Write the migration SQL**

```sql
-- 006_communications.sql
-- Run in Supabase Dashboard → SQL Editor

-- ── contact_messages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  email      text        NOT NULL,
  subject    text        NOT NULL,
  message    text        NOT NULL,
  read_at    timestamptz,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Only service_role (our server) can access contact messages
DROP POLICY IF EXISTS "No public access to contact messages" ON contact_messages;
CREATE POLICY "No public access to contact messages"
  ON contact_messages
  USING (false);

-- ── bench_notes ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bench_notes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text        NOT NULL DEFAULT '',
  body       text        NOT NULL,
  pinned     boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bench_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public access to bench notes" ON bench_notes;
CREATE POLICY "No public access to bench notes"
  ON bench_notes
  USING (false);
```

- [ ] **Step 2: Run in Supabase**

Go to Supabase Dashboard → SQL Editor → paste and run.

Expected: no error, two new tables visible in Table Editor.

- [ ] **Step 3: Verify**

Run in SQL Editor:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('contact_messages', 'bench_notes');
```
Expected: 2 rows returned.

- [ ] **Step 4: Commit**

```bash
git add docs/supabase/migrations/006_communications.sql
git commit -m "feat(db): add contact_messages and bench_notes tables (migration 006)"
```

---

### Task 2: Update contact API + add admin alert email

**Files:**
- Modify: `app/api/contact/route.ts`
- Modify: `lib/email.ts` (append only)

**Interfaces:**
- Consumes: `contact_messages` table from Task 1
- Produces: `sendContactAdminAlert(msg)` function in `lib/email.ts` — consumed by the updated contact route

- [ ] **Step 1: Append `sendContactAdminAlert` to `lib/email.ts`**

Open `lib/email.ts`. At the very end of the file, append:

```typescript
export async function sendContactAdminAlert(msg: {
  name:    string
  email:   string
  subject: string
  message: string
}): Promise<void> {
  const raw        = process.env.ADMIN_EMAIL ?? ''
  const recipients = raw.split(',').map(e => e.trim()).filter(Boolean)
  if (!recipients.length) return

  await resend.emails.send({
    from:    FROM,
    to:      recipients,
    subject: `New contact: ${msg.subject} — ${msg.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1C2B1E;border-radius:6px;overflow:hidden">
        <div style="background:#2C5F2E;padding:24px 32px">
          <h1 style="color:#F5F1E6;font-size:18px;margin:0;font-weight:700">New Contact Message</h1>
          <p style="color:#b8d4b9;font-size:13px;margin:4px 0 0">Acme Vintage Supply</p>
        </div>
        <div style="padding:28px 32px;background:#fff">
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr>
              <td style="padding:6px 0;color:#666;font-size:13px;width:80px;vertical-align:top">From</td>
              <td style="padding:6px 0;font-size:13px;color:#1C1C1C">${msg.name} &lt;${msg.email}&gt;</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#666;font-size:13px;vertical-align:top">Subject</td>
              <td style="padding:6px 0;font-size:13px;color:#1C1C1C">${msg.subject}</td>
            </tr>
          </table>
          <div style="background:#f5f5f5;border-left:3px solid #2C5F2E;padding:16px;border-radius:0 4px 4px 0">
            <p style="margin:0;font-size:14px;color:#3A3A3A;line-height:1.6;white-space:pre-wrap">${msg.message}</p>
          </div>
          <div style="margin-top:24px">
            <a href="${SITE}/admin/communications"
               style="display:inline-block;background:#2C5F2E;color:#F5F1E6;text-decoration:none;
                      padding:12px 24px;border-radius:3px;font-size:13px;font-weight:600">
              View in admin →
            </a>
          </div>
        </div>
      </div>
    `,
  })
}
```

- [ ] **Step 2: Replace `app/api/contact/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendContactAdminAlert } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body    = await req.json()
    const { name, email, subject, message } = body

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ success: false, error: 'All fields required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('contact_messages')
      .insert({
        name:    name.trim(),
        email:   email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      })

    if (error) throw error

    // Fire-and-forget — don't fail the user's submission if email fails
    sendContactAdminAlert({ name, email, subject, message }).catch(console.error)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
```

- [ ] **Step 3: Test manually**

Submit the contact form at `/contact` with valid data. Verify:
1. Form shows "Note received." ✓
2. Check Supabase → `contact_messages` table — row exists ✓
3. Check admin email inbox — alert email received ✓

- [ ] **Step 4: Commit**

```bash
git add app/api/contact/route.ts lib/email.ts
git commit -m "feat(contact): store messages in Supabase, alert admin via Resend"
```

---

### Task 3: Waitlist API route

**Files:**
- Create: `app/api/admin/communications/waitlist/route.ts`

**Interfaces:**
- Consumes: `back_in_stock_requests` table (existing, from migration 004)
- Produces: `GET /api/admin/communications/waitlist` → `WaitlistGroup[]`

```typescript
// Shape returned by this route — used by the page in Task 6
export interface WaitlistGroup {
  productHandle: string
  productTitle:  string
  total:         number
  pending:       number
  subscribers:   { id: string; email: string; createdAt: string; notifiedAt: string | null }[]
}
```

- [ ] **Step 1: Create the route**

```typescript
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

export interface WaitlistGroup {
  productHandle: string
  productTitle:  string
  total:         number
  pending:       number
  subscribers:   { id: string; email: string; createdAt: string; notifiedAt: string | null }[]
}

export async function GET() {
  if (!await requireAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('back_in_stock_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const map = new Map<string, WaitlistGroup>()
  for (const row of data ?? []) {
    if (!map.has(row.product_handle)) {
      map.set(row.product_handle, {
        productHandle: row.product_handle,
        productTitle:  row.product_title,
        total:         0,
        pending:       0,
        subscribers:   [],
      })
    }
    const g = map.get(row.product_handle)!
    g.total++
    if (!row.notified_at) g.pending++
    g.subscribers.push({
      id:         row.id,
      email:      row.email,
      createdAt:  row.created_at,
      notifiedAt: row.notified_at ?? null,
    })
  }

  // Sort: most pending first
  return NextResponse.json(
    Array.from(map.values()).sort((a, b) => b.pending - a.pending)
  )
}
```

- [ ] **Step 2: Test the route**

While logged in as admin, visit in browser: `http://localhost:3000/api/admin/communications/waitlist`

Expected: JSON array of grouped products (or `[]` if no signups exist yet).

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/communications/waitlist/route.ts
git commit -m "feat(api): GET /admin/communications/waitlist — restock waitlist grouped by product"
```

---

### Task 4: Contact inbox API routes

**Files:**
- Create: `app/api/admin/communications/contacts/route.ts`
- Create: `app/api/admin/communications/contacts/[id]/route.ts`

**Interfaces:**
- Consumes: `contact_messages` table from Task 1
- Produces: `GET /api/admin/communications/contacts` → `ContactMessage[]`, `PATCH /…/[id]`, `DELETE /…/[id]`

```typescript
// Shape used by the page in Task 6
interface ContactMessage {
  id:         string
  name:       string
  email:      string
  subject:    string
  message:    string
  read_at:    string | null
  replied_at: string | null
  created_at: string
}
```

- [ ] **Step 1: Create `app/api/admin/communications/contacts/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

export async function GET() {
  if (!await requireAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
```

- [ ] **Step 2: Create `app/api/admin/communications/contacts/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id }  = await params
  const body    = await req.json().catch(() => ({}))
  const update: Record<string, string | null> = {}
  if (body.markRead)    update.read_at    = new Date().toISOString()
  if (body.unread)      update.read_at    = null
  if (body.markReplied) update.replied_at = new Date().toISOString()

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }
  const { error } = await supabase.from('contact_messages').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { error } = await supabase.from('contact_messages').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Test**

Submit the contact form. Then:
- `GET /api/admin/communications/contacts` — expect the row
- `PATCH /api/admin/communications/contacts/<id>` with `{ "markRead": true }` — `read_at` is set
- `DELETE /api/admin/communications/contacts/<id>` — row removed

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/communications/contacts/route.ts \
        app/api/admin/communications/contacts/[id]/route.ts
git commit -m "feat(api): contact inbox CRUD — GET/PATCH/DELETE for admin"
```

---

### Task 5: Bench notes API routes

**Files:**
- Create: `app/api/admin/communications/bench-notes/route.ts`
- Create: `app/api/admin/communications/bench-notes/[id]/route.ts`

**Interfaces:**
- Consumes: `bench_notes` table from Task 1
- Produces: `GET`, `POST` on `/bench-notes`; `PATCH`, `DELETE` on `/bench-notes/[id]`

```typescript
// Shape used by the page in Task 6
interface BenchNote {
  id:         string
  title:      string
  body:       string
  pinned:     boolean
  created_at: string
  updated_at: string
}
```

- [ ] **Step 1: Create `app/api/admin/communications/bench-notes/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

export async function GET() {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('bench_notes')
    .select('*')
    .order('pinned',      { ascending: false })
    .order('updated_at',  { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (!body.body?.trim()) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('bench_notes')
    .insert({ title: body.title?.trim() ?? '', body: body.body.trim() })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2: Create `app/api/admin/communications/bench-notes/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body   = await req.json().catch(() => ({}))
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.title  !== 'undefined') update.title  = body.title
  if (typeof body.body   !== 'undefined') update.body   = body.body
  if (typeof body.pinned !== 'undefined') update.pinned = body.pinned

  const { error } = await supabase.from('bench_notes').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { error } = await supabase.from('bench_notes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Test**

With dev server running and logged in as admin:
```bash
# Create a note
curl -X POST http://localhost:3000/api/admin/communications/bench-notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Bench note body text"}' \
  --cookie "$(cat .session-cookie)"
```
Expected: `{ "id": "...", "title": "Test", "body": "...", "pinned": false }`

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/communications/bench-notes/route.ts \
        app/api/admin/communications/bench-notes/[id]/route.ts
git commit -m "feat(api): bench notes CRUD — GET/POST/PATCH/DELETE for admin"
```

---

### Task 6: Communications Hub page (`/admin/communications`)

**Files:**
- Create: `app/admin/communications/page.tsx`

**Interfaces:**
- Consumes: All routes from Tasks 3, 4, 5
- Consumes: `POST /api/admin/products/notify-restock` with body `{ productHandle: string }` (existing)
- Produces: Rendered page at `/admin/communications`

- [ ] **Step 1: Write the full page component**

```typescript
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import PageHeader from '@/components/admin/shared/PageHeader'
import SectionCard from '@/components/admin/shared/SectionCard'
import Badge from '@/components/admin/shared/Badge'
import Toast, { ToastType } from '@/components/admin/shared/Toast'
import { cn } from '@/lib/utils'
import {
  BiEnvelope, BiNote, BiLoader, BiCheck, BiTrash, BiPin,
  BiEditAlt, BiX, BiChevronDown, BiChevronUp, BiMailSend,
  BiRefresh, BiPlus,
} from 'react-icons/bi'

// ── Types ────────────────────────────────────────────────────────────────────

interface WaitlistGroup {
  productHandle: string
  productTitle:  string
  total:         number
  pending:       number
  subscribers:   { id: string; email: string; createdAt: string; notifiedAt: string | null }[]
}

interface ContactMessage {
  id:         string
  name:       string
  email:      string
  subject:    string
  message:    string
  read_at:    string | null
  replied_at: string | null
  created_at: string
}

interface BenchNote {
  id:         string
  title:      string
  body:       string
  pinned:     boolean
  created_at: string
  updated_at: string
}

type Tab = 'waitlist' | 'inbox' | 'notes'

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function CommunicationsPage() {
  const [tab, setTab] = useState<Tab>('waitlist')

  // Waitlist state
  const [waitlist,      setWaitlist]      = useState<WaitlistGroup[]>([])
  const [waitlistLoad,  setWaitlistLoad]  = useState(true)
  const [expanded,      setExpanded]      = useState<Set<string>>(new Set())
  const [notifying,     setNotifying]     = useState<string | null>(null)

  // Inbox state
  const [contacts,      setContacts]      = useState<ContactMessage[]>([])
  const [contactLoad,   setContactLoad]   = useState(true)
  const [openMsg,       setOpenMsg]       = useState<string | null>(null)
  const [inboxFilter,   setInboxFilter]   = useState<'all' | 'unread' | 'replied'>('all')

  // Notes state
  const [notes,         setNotes]         = useState<BenchNote[]>([])
  const [notesLoad,     setNotesLoad]     = useState(true)
  const [noteForm,      setNoteForm]      = useState<{ title: string; body: string } | null>(null)
  const [editingNote,   setEditingNote]   = useState<BenchNote | null>(null)
  const [savingNote,    setSavingNote]    = useState(false)

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const noteBodyRef = useRef<HTMLTextAreaElement>(null)

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type })
  }, [])

  // ── Loaders ──

  useEffect(() => {
    fetch('/api/admin/communications/waitlist')
      .then(r => r.ok ? r.json() : [])
      .then(setWaitlist)
      .finally(() => setWaitlistLoad(false))
  }, [])

  useEffect(() => {
    if (tab !== 'inbox') return
    setContactLoad(true)
    fetch('/api/admin/communications/contacts')
      .then(r => r.ok ? r.json() : [])
      .then(setContacts)
      .finally(() => setContactLoad(false))
  }, [tab])

  useEffect(() => {
    if (tab !== 'notes') return
    setNotesLoad(true)
    fetch('/api/admin/communications/bench-notes')
      .then(r => r.ok ? r.json() : [])
      .then(setNotes)
      .finally(() => setNotesLoad(false))
  }, [tab])

  // ── Waitlist actions ──

  async function notifyProduct(handle: string) {
    setNotifying(handle)
    try {
      const res  = await fetch('/api/admin/products/notify-restock', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productHandle: handle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      showToast(`Notified ${data.sent} customer(s).`, 'success')
      // Refresh waitlist
      const fresh = await fetch('/api/admin/communications/waitlist').then(r => r.json())
      setWaitlist(fresh)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to notify', 'error')
    } finally {
      setNotifying(null)
    }
  }

  function toggleExpanded(handle: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(handle) ? next.delete(handle) : next.add(handle)
      return next
    })
  }

  // ── Inbox actions ──

  async function patchContact(id: string, patch: Record<string, boolean>) {
    const res = await fetch(`/api/admin/communications/contacts/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(patch),
    })
    if (!res.ok) { showToast('Update failed', 'error'); return }
    setContacts(cs => cs.map(c => {
      if (c.id !== id) return c
      const now = new Date().toISOString()
      return {
        ...c,
        read_at:    patch.markRead    ? now : patch.unread ? null : c.read_at,
        replied_at: patch.markReplied ? now : c.replied_at,
      }
    }))
  }

  async function deleteContact(id: string) {
    const res = await fetch(`/api/admin/communications/contacts/${id}`, { method: 'DELETE' })
    if (!res.ok) { showToast('Delete failed', 'error'); return }
    setContacts(cs => cs.filter(c => c.id !== id))
    if (openMsg === id) setOpenMsg(null)
    showToast('Message deleted.', 'success')
  }

  // ── Notes actions ──

  async function saveNote() {
    if (!noteForm?.body.trim()) return
    setSavingNote(true)
    try {
      const res = await fetch('/api/admin/communications/bench-notes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(noteForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNotes(ns => [data, ...ns])
      setNoteForm(null)
      showToast('Note saved.', 'success')
    } catch {
      showToast('Failed to save note.', 'error')
    } finally {
      setSavingNote(false)
    }
  }

  async function updateNote(id: string, patch: Partial<BenchNote>) {
    const res = await fetch(`/api/admin/communications/bench-notes/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(patch),
    })
    if (!res.ok) { showToast('Update failed', 'error'); return }
    setNotes(ns => ns.map(n =>
      n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n
    ).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)))
    if (editingNote?.id === id) setEditingNote(null)
  }

  async function deleteNote(id: string) {
    const res = await fetch(`/api/admin/communications/bench-notes/${id}`, { method: 'DELETE' })
    if (!res.ok) { showToast('Delete failed', 'error'); return }
    setNotes(ns => ns.filter(n => n.id !== id))
    if (editingNote?.id === id) setEditingNote(null)
    showToast('Note deleted.', 'success')
  }

  // ── Derived counts ──
  const unreadCount  = contacts.filter(c => !c.read_at).length
  const pendingTotal = waitlist.reduce((s, g) => s + g.pending, 0)

  const filteredContacts = contacts.filter(c => {
    if (inboxFilter === 'unread')  return !c.read_at
    if (inboxFilter === 'replied') return !!c.replied_at
    return true
  })

  // ── Render ──

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'waitlist', label: 'Restock Waitlist', icon: BiMailSend, badge: pendingTotal || undefined },
    { id: 'inbox',    label: 'Contact Inbox',    icon: BiEnvelope, badge: unreadCount  || undefined },
    { id: 'notes',    label: 'Bench Notes',      icon: BiNote                                       },
  ]

  return (
    <div>
      <PageHeader
        title="Communications"
        subtitle="Restock waitlists, customer messages, and workshop notes"
      />

      <SectionCard noPadding>
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-(--admin-border) overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors',
                tab === id
                  ? 'bg-(--admin-accent) text-(--admin-accent-text)'
                  : 'text-(--admin-text-soft) hover:bg-(--admin-surface-2) hover:text-(--admin-text)'
              )}
            >
              <Icon size={15} />
              {label}
              {badge != null && (
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full',
                  tab === id
                    ? 'bg-white/20 text-(--admin-accent-text)'
                    : 'bg-(--admin-red-bg) text-(--admin-red)'
                )}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── WAITLIST TAB ── */}
        {tab === 'waitlist' && (
          <div className="divide-y divide-(--admin-border)">
            {waitlistLoad ? (
              <div className="flex items-center justify-center py-16">
                <BiLoader size={20} className="animate-spin text-(--admin-text-muted)" />
              </div>
            ) : waitlist.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[13px] text-(--admin-text-soft)">No restock requests yet.</p>
                <p className="text-[11px] text-(--admin-text-muted) mt-1">Customers who click "Notify me" on out-of-stock products appear here.</p>
              </div>
            ) : waitlist.map(group => (
              <div key={group.productHandle} className="px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-(--admin-text) truncate">{group.productTitle}</p>
                    <p className="text-[11px] text-(--admin-text-muted) mt-0.5">
                      {group.pending > 0
                        ? <span className="text-(--admin-red) font-medium">{group.pending} pending</span>
                        : <span>0 pending</span>
                      }
                      {' · '}{group.total} total
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleExpanded(group.productHandle)}
                      className="flex items-center gap-1 h-8 px-3 text-[12px] text-(--admin-text-muted) bg-(--admin-surface-2) border border-(--admin-border) rounded hover:bg-(--admin-border) transition-colors"
                    >
                      {expanded.has(group.productHandle) ? <BiChevronUp size={14} /> : <BiChevronDown size={14} />}
                      {group.subscribers.length}
                    </button>
                    <button
                      disabled={group.pending === 0 || notifying === group.productHandle}
                      onClick={() => notifyProduct(group.productHandle)}
                      className={cn(
                        'flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded transition-colors',
                        group.pending > 0
                          ? 'bg-(--admin-accent) text-(--admin-accent-text) hover:opacity-90'
                          : 'bg-(--admin-surface-2) text-(--admin-text-muted) border border-(--admin-border) cursor-not-allowed'
                      )}
                    >
                      {notifying === group.productHandle
                        ? <BiLoader size={13} className="animate-spin" />
                        : <BiMailSend size={13} />
                      }
                      {notifying === group.productHandle ? 'Sending…' : `Notify ${group.pending}`}
                    </button>
                  </div>
                </div>

                {/* Subscriber list */}
                {expanded.has(group.productHandle) && (
                  <div className="mt-3 rounded-md border border-(--admin-border) divide-y divide-(--admin-border) overflow-hidden">
                    {group.subscribers.map(s => (
                      <div key={s.id} className="flex items-center justify-between px-4 py-2.5 bg-(--admin-surface-2)">
                        <span className="text-[12px] text-(--admin-text)">{s.email}</span>
                        <div className="flex items-center gap-3 text-[11px] text-(--admin-text-muted)">
                          <span>{timeAgo(s.createdAt)}</span>
                          {s.notifiedAt
                            ? <Badge label="Notified" variant="green" />
                            : <Badge label="Pending"  variant="amber" />
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── INBOX TAB ── */}
        {tab === 'inbox' && (
          <div>
            {/* Filter tabs */}
            <div className="flex items-center gap-1 px-5 py-3 border-b border-(--admin-border)">
              {(['all', 'unread', 'replied'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setInboxFilter(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-[12px] capitalize transition-colors',
                    inboxFilter === f
                      ? 'bg-(--admin-surface-2) text-(--admin-text) font-medium'
                      : 'text-(--admin-text-muted) hover:text-(--admin-text)'
                  )}
                >
                  {f}
                  {f === 'unread' && unreadCount > 0 && (
                    <span className="ml-1.5 text-[10px] bg-(--admin-red-bg) text-(--admin-red) px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="divide-y divide-(--admin-border)">
              {contactLoad ? (
                <div className="flex items-center justify-center py-16">
                  <BiLoader size={20} className="animate-spin text-(--admin-text-muted)" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-[13px] text-(--admin-text-soft)">No messages here.</p>
                </div>
              ) : filteredContacts.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    'px-5 py-4 transition-colors',
                    !msg.read_at && 'bg-(--admin-surface-2)',
                    openMsg === msg.id && 'bg-(--admin-surface-2)'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        setOpenMsg(openMsg === msg.id ? null : msg.id)
                        if (!msg.read_at) patchContact(msg.id, { markRead: true })
                      }}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        {!msg.read_at && (
                          <span className="w-2 h-2 rounded-full bg-(--admin-accent) shrink-0" />
                        )}
                        <span className="text-[14px] font-medium text-(--admin-text) truncate">{msg.name}</span>
                        <span className="text-[11px] text-(--admin-text-muted) shrink-0">{timeAgo(msg.created_at)}</span>
                      </div>
                      <p className="text-[12px] text-(--admin-text-soft) truncate">{msg.subject}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {msg.read_at && !msg.replied_at && (
                        <button
                          onClick={() => patchContact(msg.id, { markReplied: true })}
                          title="Mark replied"
                          className="w-7 h-7 flex items-center justify-center rounded text-(--admin-text-muted) hover:text-(--admin-accent) hover:bg-(--admin-surface-2) transition-colors"
                        >
                          <BiCheck size={15} />
                        </button>
                      )}
                      {msg.replied_at && (
                        <Badge label="Replied" variant="green" />
                      )}
                      <button
                        onClick={() => deleteContact(msg.id)}
                        title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded text-(--admin-text-muted) hover:text-(--admin-red) hover:bg-(--admin-red-bg) transition-colors"
                      >
                        <BiTrash size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded message */}
                  {openMsg === msg.id && (
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-(--admin-text-muted)">
                        <span>From: <span className="text-(--admin-text)">{msg.email}</span></span>
                        <span>Subject: <span className="text-(--admin-text)">{msg.subject}</span></span>
                      </div>
                      <div className="bg-(--admin-bg) rounded-md p-4 border border-(--admin-border)">
                        <p className="text-[13px] text-(--admin-text) leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                          onClick={() => patchContact(msg.id, { markReplied: true })}
                          className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded hover:opacity-90 transition-opacity"
                        >
                          <BiEnvelope size={13} /> Reply via email
                        </a>
                        {!msg.read_at ? (
                          <button
                            onClick={() => patchContact(msg.id, { markRead: true })}
                            className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-muted) bg-(--admin-surface-2) border border-(--admin-border) rounded hover:bg-(--admin-border) transition-colors"
                          >
                            <BiCheck size={13} /> Mark read
                          </button>
                        ) : (
                          <button
                            onClick={() => patchContact(msg.id, { unread: true })}
                            className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-muted) bg-(--admin-surface-2) border border-(--admin-border) rounded hover:bg-(--admin-border) transition-colors"
                          >
                            <BiRefresh size={13} /> Mark unread
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── NOTES TAB ── */}
        {tab === 'notes' && (
          <div className="p-5">
            {/* Add note button / form */}
            {!noteForm && !editingNote && (
              <button
                onClick={() => {
                  setNoteForm({ title: '', body: '' })
                  setTimeout(() => noteBodyRef.current?.focus(), 0)
                }}
                className="flex items-center gap-2 h-9 px-4 mb-5 text-[13px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded-md hover:opacity-90 transition-opacity"
              >
                <BiPlus size={16} /> Add note
              </button>
            )}

            {/* New note form */}
            {noteForm && (
              <div className="mb-5 rounded-lg border-2 border-(--admin-accent) bg-(--admin-surface-2) p-4 space-y-3">
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={e => setNoteForm(f => f && ({ ...f, title: e.target.value }))}
                  placeholder="Title (optional)"
                  className="w-full bg-transparent text-[14px] font-semibold text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none"
                />
                <textarea
                  ref={noteBodyRef}
                  value={noteForm.body}
                  onChange={e => setNoteForm(f => f && ({ ...f, body: e.target.value }))}
                  placeholder="Write your bench note…"
                  rows={4}
                  className="w-full bg-transparent text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none resize-none"
                />
                <div className="flex items-center gap-2 pt-1 border-t border-(--admin-border)">
                  <button
                    onClick={saveNote}
                    disabled={savingNote || !noteForm.body.trim()}
                    className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {savingNote ? <BiLoader size={13} className="animate-spin" /> : <BiCheck size={13} />}
                    Save
                  </button>
                  <button
                    onClick={() => setNoteForm(null)}
                    className="flex items-center gap-1 h-8 px-3 text-[12px] text-(--admin-text-muted) bg-(--admin-surface-2) border border-(--admin-border) rounded hover:bg-(--admin-border) transition-colors"
                  >
                    <BiX size={13} /> Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Notes grid */}
            {notesLoad ? (
              <div className="flex items-center justify-center py-12">
                <BiLoader size={20} className="animate-spin text-(--admin-text-muted)" />
              </div>
            ) : notes.length === 0 && !noteForm ? (
              <div className="py-16 text-center">
                <p className="text-[13px] text-(--admin-text-soft)">No bench notes yet.</p>
                <p className="text-[11px] text-(--admin-text-muted) mt-1">Use notes to track workshop reminders, product quirks, or customer lore.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {notes.map(note => (
                  <div
                    key={note.id}
                    className={cn(
                      'rounded-lg border bg-(--admin-surface-2) p-4 flex flex-col gap-2 transition-colors',
                      note.pinned ? 'border-(--admin-accent)/40' : 'border-(--admin-border)'
                    )}
                  >
                    {/* Edit mode */}
                    {editingNote?.id === note.id ? (
                      <>
                        <input
                          type="text"
                          value={editingNote.title}
                          onChange={e => setEditingNote(n => n && ({ ...n, title: e.target.value }))}
                          placeholder="Title"
                          className="bg-transparent text-[13px] font-semibold text-(--admin-text) focus:outline-none w-full"
                        />
                        <textarea
                          value={editingNote.body}
                          onChange={e => setEditingNote(n => n && ({ ...n, body: e.target.value }))}
                          rows={4}
                          className="bg-transparent text-[12px] text-(--admin-text) focus:outline-none resize-none w-full"
                        />
                        <div className="flex items-center gap-2 pt-2 border-t border-(--admin-border)">
                          <button
                            onClick={() => updateNote(note.id, { title: editingNote.title, body: editingNote.body })}
                            className="flex items-center gap-1 h-7 px-2.5 text-[11px] bg-(--admin-accent) text-(--admin-accent-text) rounded hover:opacity-90"
                          >
                            <BiCheck size={12} /> Save
                          </button>
                          <button
                            onClick={() => setEditingNote(null)}
                            className="flex items-center gap-1 h-7 px-2.5 text-[11px] text-(--admin-text-muted) bg-(--admin-surface-2) border border-(--admin-border) rounded hover:bg-(--admin-border)"
                          >
                            <BiX size={12} /> Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {note.title && (
                          <p className="text-[13px] font-semibold text-(--admin-text) leading-snug">{note.title}</p>
                        )}
                        <p className="text-[12px] text-(--admin-text-soft) leading-relaxed line-clamp-6 flex-1 whitespace-pre-wrap">{note.body}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-(--admin-border)">
                          <span className="text-[10px] text-(--admin-text-muted)">{timeAgo(note.updated_at)}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateNote(note.id, { pinned: !note.pinned })}
                              title={note.pinned ? 'Unpin' : 'Pin'}
                              className={cn(
                                'w-6 h-6 flex items-center justify-center rounded transition-colors',
                                note.pinned
                                  ? 'text-(--admin-accent) hover:opacity-70'
                                  : 'text-(--admin-text-muted) hover:text-(--admin-accent) hover:bg-(--admin-surface-2)'
                              )}
                            >
                              <BiPin size={13} />
                            </button>
                            <button
                              onClick={() => setEditingNote({ ...note })}
                              className="w-6 h-6 flex items-center justify-center rounded text-(--admin-text-muted) hover:text-(--admin-accent) hover:bg-(--admin-surface-2) transition-colors"
                            >
                              <BiEditAlt size={13} />
                            </button>
                            <button
                              onClick={() => deleteNote(note.id)}
                              className="w-6 h-6 flex items-center justify-center rounded text-(--admin-text-muted) hover:text-(--admin-red) hover:bg-(--admin-red-bg) transition-colors"
                            >
                              <BiTrash size={13} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-3 border-t border-(--admin-border)">
          <p className="text-[11px] text-(--admin-text-muted)">
            Restock waitlists sync from Shopify. Contact messages and bench notes are stored in Supabase.
          </p>
        </div>
      </SectionCard>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Test the page renders at `/admin/communications`**

Navigate to `http://localhost:3000/admin/communications` while logged in. Verify:
- Three tabs visible ✓
- Waitlist tab loads (empty or showing groups) ✓
- Inbox tab loads ✓
- Notes tab renders add form correctly ✓

- [ ] **Step 3: Add a bench note, verify it appears**

Click "Add note" → enter title "Test note" → body "This is a test." → Save.
Expected: note card appears in the grid. Check Supabase `bench_notes` table — row exists.

- [ ] **Step 4: Commit**

```bash
git add app/admin/communications/page.tsx
git commit -m "feat(admin): /admin/communications — waitlist, inbox, bench notes hub"
```

---

### Task 7: Wire up admin navigation

**Files:**
- Modify: `components/admin/layout/AdminSidebar.tsx`
- Modify: `components/admin/layout/AdminBottomNav.tsx`

**Interfaces:**
- Consumes: `/admin/communications` page from Task 6

- [ ] **Step 1: Add icon import and nav item to `AdminSidebar.tsx`**

In the imports at top of the file, add `BiMessageSquareDetail` to the bi imports:
```typescript
import {
  BiHomeAlt, BiCart, BiPackage, BiArchive, BiCollection,
  BiUser, BiBarChartAlt2, BiCog, BiLogOut, BiSun, BiMoon,
  BiEditAlt, BiStar, BiHistory, BiMessageSquareDetail,
} from 'react-icons/bi'
```

Add a state for unread contact count after the existing state declarations:
```typescript
const [unreadContactCount, setUnreadContactCount] = useState(0)
```

Add a `useEffect` after the existing `useEffect` blocks:
```typescript
useEffect(() => {
  fetch('/api/admin/communications/contacts')
    .then(r => r.ok ? r.json() : [])
    .then((msgs: { read_at: string | null }[]) => {
      setUnreadContactCount(msgs.filter(m => !m.read_at).length)
    })
    .catch(() => {})
}, [])
```

In `NAV_MAIN`, add Communications after Analytics:
```typescript
{ label: 'Analytics',       href: '/admin/analytics',       icon: BiBarChartAlt2                                           },
{ label: 'Communications',  href: '/admin/communications',  icon: BiMessageSquareDetail, badge: unreadContactCount || undefined },
{ label: 'Reviews',         href: '/admin/reviews',         icon: BiStar, badge: pendingReviewCount || undefined              },
```

- [ ] **Step 2: Add Communications to `AdminBottomNav.tsx`**

Add `BiMessageSquareDetail` to the import list.

In `MORE_ITEMS`, add after Analytics:
```typescript
{ label: 'Analytics',       href: '/admin/analytics',      icon: BiBarChartAlt2         },
{ label: 'Communications',  href: '/admin/communications', icon: BiMessageSquareDetail  },
{ label: 'Reviews',         href: '/admin/reviews',        icon: BiStar                 },
```

- [ ] **Step 3: Test nav**

In browser, reload the admin. Verify:
- "Communications" appears in sidebar nav ✓
- Clicking it navigates to `/admin/communications` ✓
- Unread badge appears when there are unread contact messages ✓
- Mobile "More" sheet includes Communications ✓

- [ ] **Step 4: Commit**

```bash
git add components/admin/layout/AdminSidebar.tsx \
        components/admin/layout/AdminBottomNav.tsx
git commit -m "feat(nav): add Communications to admin sidebar and mobile nav with unread badge"
```

---

## Sign-Off

| Task | Status |
|---|---|
| 1. Supabase migration 006 | ⬜ |
| 2. Contact API → Supabase + alert email | ⬜ |
| 3. Waitlist API | ⬜ |
| 4. Contact inbox API | ⬜ |
| 5. Bench notes API | ⬜ |
| 6. Communications hub page | ⬜ |
| 7. Admin nav wired up | ⬜ |

---

## Follow-Up: Plan B — Promotional Email System

The promotional email system (subscriber list, template library, weekly cron rotation) is a separate plan. Key additions that plan will cover:

- `007_promo_emails.sql` — `email_subscribers`, `promo_templates`, `promo_sends` tables
- Subscribe/unsubscribe endpoint (`/api/subscribe`) + footer sign-up field on storefront
- Admin template builder inside `/admin/communications` (4th tab: "Promotions")
- Weekly Vercel Cron at `/api/cron/weekly-promo` — picks the next template in rotation, sends to all active subscribers via Resend batch
- Send history + subscriber count visible in the Promotions tab
- Unsubscribe link in every promo email (one-click, token-based)
