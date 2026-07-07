# Admin Settings Real Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the entirely fake `/admin/settings` page (every "Save" is a client-side `setTimeout` that persists nothing) with real persistence — a real password-change endpoint reusing the existing bcrypt/Redis auth mechanism, and a new Supabase table for Store Details, Regional preferences, and Notification toggles.

**Architecture:** Two independent persistence paths, matched to what each section actually is:
1. **Password** — not app data, it's the credential itself. Reuses the exact bcrypt-hash-in-Redis mechanism the real login/reset flow already uses (`lib/admin/auth.ts` + Redis key `acme:admin:password_hash`), via a new authenticated `POST /api/admin/auth/change-password` route.
2. **Store Details / Regional / Notifications** — plain app settings. A new singleton-row Supabase table (`admin_settings`, one fixed row since this is a single-store, single-admin system) behind a new `GET`/`PATCH /api/admin/settings` route, following the existing lazy-`getSupabase()`-per-route pattern already used by the Communications Hub routes.

**Tech Stack:** Next.js App Router route handlers, `bcryptjs`, `@upstash/redis`, `@supabase/supabase-js`, `iron-session` (existing `AdminSession`/`sessionOptions`), React Hook state in `app/admin/settings/page.tsx`.

## Global Constraints

- Every new/modified API route must call the existing `requireAuth()` pattern (`getIronSession<AdminSession>(await cookies(), sessionOptions); session.isLoggedIn`) before doing anything — this is an admin-only surface.
- Supabase client creation must be a **lazy per-request function** (`function getSupabase() { return createClient(...) }` called inside each handler), never a module-level `createClient(...)` call — a module-level call breaks Vercel builds when env vars aren't present at build time (established project convention, see `app/api/admin/communications/bench-notes/route.ts`).
- Use env vars `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (matches the Communications Hub routes — the codebase has an older `lib/supabase.ts` using `SUPABASE_URL` instead; don't use that file, it predates the lazy-client convention).
- New password minimum length is **8 characters** (matches the existing `reset/route.ts` enforcement — the current fake Settings form said "at least 6," which was never actually enforced against anything real).
- Password hashing: `bcrypt.hash(password, 12)` — same cost factor as `reset/route.ts`, for consistency.
- No new npm dependencies — `bcryptjs`, `@upstash/redis`, `@supabase/supabase-js`, `iron-session` are all already installed.

---

## File Structure

- Create: `docs/supabase/migrations/008_admin_settings.sql` — singleton settings table.
- Create: `app/api/admin/settings/route.ts` — `GET` (fetch current settings) and `PATCH` (partial update) for Store Details / Regional / Notifications.
- Create: `app/api/admin/auth/change-password/route.ts` — authenticated password change (verify current, hash + persist new).
- Modify: `app/admin/settings/page.tsx` — replace all fake `useSection()`/`mockPw` behavior with real fetch/save calls.
- Modify: `lib/admin/mockData.ts` — remove `MOCK_ADMIN_PASSWORD` and other now-fully-unused mock exports surfaced during this audit.

---

### Task 1: Supabase migration for the settings singleton table

**Files:**
- Create: `docs/supabase/migrations/008_admin_settings.sql`

**Interfaces:**
- Produces: a Supabase table `admin_settings` with a single row where `id = 'main'`. Columns consumed by Task 2's API route: `store_name, store_email, store_phone, store_address, store_city, store_province, store_country, currency, timezone, date_format, notify_order_placed, notify_order_fulfilled, notify_low_stock, notify_abandoned_checkout, notify_weekly_digest`.

- [ ] **Step 1: Write the migration file**

```sql
-- 008_admin_settings.sql
-- Run in Supabase Dashboard → SQL Editor

-- ── admin_settings ────────────────────────────────────────────────────────────
-- Singleton table (single store, single admin) — always exactly one row, id = 'main'.
CREATE TABLE IF NOT EXISTS admin_settings (
  id                        text        PRIMARY KEY DEFAULT 'main',

  store_name                text        NOT NULL DEFAULT 'Acme Vintage Supply',
  store_email               text        NOT NULL DEFAULT '',
  store_phone               text        NOT NULL DEFAULT '',
  store_address             text        NOT NULL DEFAULT '',
  store_city                text        NOT NULL DEFAULT '',
  store_province            text        NOT NULL DEFAULT '',
  store_country             text        NOT NULL DEFAULT '',

  currency                  text        NOT NULL DEFAULT 'CAD',
  timezone                  text        NOT NULL DEFAULT 'America/Halifax',
  date_format               text        NOT NULL DEFAULT 'DD MMM YYYY',

  notify_order_placed       boolean     NOT NULL DEFAULT true,
  notify_order_fulfilled    boolean     NOT NULL DEFAULT true,
  notify_low_stock          boolean     NOT NULL DEFAULT true,
  notify_abandoned_checkout boolean     NOT NULL DEFAULT false,
  notify_weekly_digest      boolean     NOT NULL DEFAULT true,

  updated_at                timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT admin_settings_singleton CHECK (id = 'main')
);

-- Seed the one row if it doesn't exist yet
INSERT INTO admin_settings (id)
VALUES ('main')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Only service_role (our server) can access settings
DROP POLICY IF EXISTS "No public access to admin settings" ON admin_settings;
CREATE POLICY "No public access to admin settings"
  ON admin_settings
  USING (false);
```

- [ ] **Step 2: Run the migration**

Open the Supabase Dashboard → SQL Editor → paste the contents of `docs/supabase/migrations/008_admin_settings.sql` → Run.

Expected: query succeeds, and `SELECT * FROM admin_settings;` returns exactly one row with `id = 'main'` and all the defaults above.

- [ ] **Step 3: Commit**

```bash
git add "docs/supabase/migrations/008_admin_settings.sql"
git commit -m "Add admin_settings singleton table migration"
```

---

### Task 2: Settings API route (GET + PATCH)

**Files:**
- Create: `app/api/admin/settings/route.ts`

**Interfaces:**
- Consumes: `admin_settings` table from Task 1 (exact column names above).
- Produces: `GET /api/admin/settings` → `200` JSON shape:
  ```ts
  {
    storeName: string; storeEmail: string; storePhone: string
    storeAddress: string; storeCity: string; storeProvince: string; storeCountry: string
    currency: string; timezone: string; dateFormat: string
    notifyOrderPlaced: boolean; notifyOrderFulfilled: boolean; notifyLowStock: boolean
    notifyAbandonedCheckout: boolean; notifyWeeklyDigest: boolean
  }
  ```
  `PATCH /api/admin/settings` → accepts a partial object using the **same camelCase keys** as the GET response, returns the full updated object in the same shape. This is the shape Task 5's client code relies on.

- [ ] **Step 1: Write the route**

```ts
// app/api/admin/settings/route.ts
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

interface SettingsRow {
  store_name: string
  store_email: string
  store_phone: string
  store_address: string
  store_city: string
  store_province: string
  store_country: string
  currency: string
  timezone: string
  date_format: string
  notify_order_placed: boolean
  notify_order_fulfilled: boolean
  notify_low_stock: boolean
  notify_abandoned_checkout: boolean
  notify_weekly_digest: boolean
}

function toClientShape(row: SettingsRow) {
  return {
    storeName:               row.store_name,
    storeEmail:              row.store_email,
    storePhone:              row.store_phone,
    storeAddress:            row.store_address,
    storeCity:               row.store_city,
    storeProvince:           row.store_province,
    storeCountry:            row.store_country,
    currency:                row.currency,
    timezone:                row.timezone,
    dateFormat:              row.date_format,
    notifyOrderPlaced:       row.notify_order_placed,
    notifyOrderFulfilled:    row.notify_order_fulfilled,
    notifyLowStock:          row.notify_low_stock,
    notifyAbandonedCheckout: row.notify_abandoned_checkout,
    notifyWeeklyDigest:      row.notify_weekly_digest,
  }
}

const CLIENT_TO_COLUMN: Record<string, string> = {
  storeName:               'store_name',
  storeEmail:              'store_email',
  storePhone:              'store_phone',
  storeAddress:            'store_address',
  storeCity:               'store_city',
  storeProvince:           'store_province',
  storeCountry:            'store_country',
  currency:                'currency',
  timezone:                'timezone',
  dateFormat:              'date_format',
  notifyOrderPlaced:       'notify_order_placed',
  notifyOrderFulfilled:    'notify_order_fulfilled',
  notifyLowStock:          'notify_low_stock',
  notifyAbandonedCheckout: 'notify_abandoned_checkout',
  notifyWeeklyDigest:      'notify_weekly_digest',
}

export async function GET() {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getSupabase()
    .from('admin_settings')
    .select('*')
    .eq('id', 'main')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(toClientShape(data as SettingsRow))
}

export async function PATCH(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as Record<string, unknown>

  const update: Record<string, unknown> = {}
  for (const [clientKey, value] of Object.entries(body)) {
    const column = CLIENT_TO_COLUMN[clientKey]
    if (column) update[column] = value
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }
  update.updated_at = new Date().toISOString()

  const { data, error } = await getSupabase()
    .from('admin_settings')
    .update(update)
    .eq('id', 'main')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(toClientShape(data as SettingsRow))
}
```

- [ ] **Step 2: Verify GET returns the seeded row**

Run the dev server (`npm run dev`), log into `/admin`, then in a second terminal:

```bash
curl -s http://localhost:3000/api/admin/settings -H "Cookie: acme_admin_session=<paste from browser devtools>"
```

Expected: `200` with JSON matching the defaults from Task 1 (e.g. `"storeName":"Acme Vintage Supply"`, `"currency":"CAD"`).

- [ ] **Step 3: Verify PATCH updates and persists**

```bash
curl -s -X PATCH http://localhost:3000/api/admin/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: acme_admin_session=<same cookie>" \
  -d '{"storeName":"Test Store Name","notifyLowStock":false}'
```

Expected: `200` with `"storeName":"Test Store Name"` and `"notifyLowStock":false` in the response. Re-run the `GET` from Step 2 — the change must still be there (confirms it wrote to Supabase, not just echoed the input back).

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/settings/route.ts
git commit -m "Add real GET/PATCH settings API backed by Supabase"
```

---

### Task 3: Real password-change endpoint

**Files:**
- Create: `app/api/admin/auth/change-password/route.ts`
- Reference (read-only, no changes): `lib/admin/auth.ts` (`verifyPassword`), `app/api/admin/auth/reset/route.ts` (identical hashing/Redis pattern this task reuses)

**Interfaces:**
- Consumes: `verifyPassword(input: string): Promise<boolean>` from `@/lib/admin/auth`.
- Produces: `POST /api/admin/auth/change-password` with body `{ currentPassword: string; newPassword: string }` → `200 { ok: true }` on success, or `400`/`401`/`500` with `{ error: string }`. This is the exact shape Task 4's client code calls.

- [ ] **Step 1: Write the route**

```ts
// app/api/admin/auth/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import bcrypt from 'bcryptjs'
import { Redis } from '@upstash/redis'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { verifyPassword } from '@/lib/admin/auth'

export async function POST(req: NextRequest) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { currentPassword?: string; newPassword?: string }
  const { currentPassword, newPassword } = body

  if (!currentPassword) {
    return NextResponse.json({ error: 'Current password is required.' }, { status: 400 })
  }
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
  }

  const valid = await verifyPassword(currentPassword)
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect current password.' }, { status: 401 })
  }

  const hash = await bcrypt.hash(newPassword, 12)

  try {
    const redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL  ?? '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
    })
    await redis.set('acme:admin:password_hash', hash)
  } catch {
    return NextResponse.json(
      { error: 'Could not save new password. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify wrong current password is rejected**

```bash
curl -s -X POST http://localhost:3000/api/admin/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Cookie: acme_admin_session=<paste from browser devtools>" \
  -d '{"currentPassword":"definitely-wrong","newPassword":"newpassword123"}'
```

Expected: `401` with `{"error":"Incorrect current password."}`.

- [ ] **Step 3: Verify correct current password changes the real login password**

```bash
curl -s -X POST http://localhost:3000/api/admin/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Cookie: acme_admin_session=<same cookie>" \
  -d '{"currentPassword":"<your real current admin password>","newPassword":"tempTestPass123"}'
```

Expected: `200 {"ok":true}`. Then log out of the admin panel and log back in at `/admin/login` using `tempTestPass123` — it must succeed. Immediately change it back to the original password the same way, since this is the real production credential.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/auth/change-password/route.ts
git commit -m "Add real password-change endpoint using existing bcrypt/Redis auth"
```

---

### Task 4: Wire the Password section of the Settings page to the real endpoint

**Files:**
- Modify: `app/admin/settings/page.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/auth/change-password` from Task 3 (exact request/response shape above).

- [ ] **Step 1: Remove the mock password import and state**

In `app/admin/settings/page.tsx`, remove this import:

```ts
import { MOCK_ADMIN_PASSWORD } from '@/lib/admin/mockData'
```

Remove this line from inside `SettingsPage()`:

```ts
const [mockPw,   setMockPw]   = useState(MOCK_ADMIN_PASSWORD)
```

- [ ] **Step 2: Replace `handlePasswordSave` with a real API call**

Replace the existing function:

```ts
function handlePasswordSave(e: React.FormEvent) {
  e.preventDefault()
  const errs: typeof pwErrors = {}
  if (!pwFields.current)                        errs.current = 'Current password is required.'
  else if (pwFields.current !== mockPw)         errs.current = 'Incorrect current password.'
  if (!pwFields.next)                           errs.next    = 'New password is required.'
  else if (pwFields.next.length < 6)            errs.next    = 'Must be at least 6 characters.'
  if (pwFields.confirm !== pwFields.next)       errs.confirm = 'Passwords do not match.'
  if (Object.keys(errs).length) { setPwErrors(errs); return }
  setPwSaving(true)
  setTimeout(() => {
    setMockPw(pwFields.next)
    setPwFields({ current: '', next: '', confirm: '' })
    setPwErrors({})
    setPwSaving(false)
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2000)
  }, 700)
}
```

with:

```ts
async function handlePasswordSave(e: React.FormEvent) {
  e.preventDefault()
  const errs: typeof pwErrors = {}
  if (!pwFields.current)                  errs.current = 'Current password is required.'
  if (!pwFields.next)                     errs.next    = 'New password is required.'
  else if (pwFields.next.length < 8)      errs.next    = 'Must be at least 8 characters.'
  if (pwFields.confirm !== pwFields.next) errs.confirm = 'Passwords do not match.'
  if (Object.keys(errs).length) { setPwErrors(errs); return }

  setPwSaving(true)
  try {
    const res = await fetch('/api/admin/auth/change-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ currentPassword: pwFields.current, newPassword: pwFields.next }),
    })
    const json = await res.json()

    if (!res.ok) {
      if (res.status === 401) setPwErrors({ current: json.error })
      else if (res.status === 400 && /new password/i.test(json.error ?? '')) setPwErrors({ next: json.error })
      else setPwErrors({ current: json.error ?? 'Could not update password.' })
      return
    }

    setPwFields({ current: '', next: '', confirm: '' })
    setPwErrors({})
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2000)
  } catch {
    setPwErrors({ current: 'Network error. Please try again.' })
  } finally {
    setPwSaving(false)
  }
}
```

- [ ] **Step 3: Update the placeholder copy to match the real 8-character minimum**

Change:

```tsx
{ key: 'next',    label: 'New password',     placeholder: 'At least 6 characters'  },
```

to:

```tsx
{ key: 'next',    label: 'New password',     placeholder: 'At least 8 characters'  },
```

- [ ] **Step 4: Manually verify in the browser**

Start the dev server, go to `/admin/settings`, open the Change Password section:
1. Enter an intentionally wrong current password → submit → expect the red error "Incorrect current password." under the Current password field (this now comes from the real server check, not a hardcoded string comparison).
2. Enter the correct current password and a new password under 8 characters → expect "Must be at least 8 characters." under New password.
3. Enter the correct current password and a valid new password (e.g. `temporaryTest123`), confirm it matches → submit → expect the green "Updated" state. Log out and log back in with the new password to confirm it actually changed the real credential, then change it back to the original password the same way.

- [ ] **Step 5: Commit**

```bash
git add app/admin/settings/page.tsx
git commit -m "Wire Settings password form to the real change-password endpoint"
```

---

### Task 5: Wire Store Details / Regional / Notifications to the real settings API

**Files:**
- Modify: `app/admin/settings/page.tsx`

**Interfaces:**
- Consumes: `GET`/`PATCH /api/admin/settings` from Task 2 (exact camelCase shape above).

- [ ] **Step 1: Replace the hardcoded `useState` defaults with a fetch-on-mount, and add a loading guard**

Replace:

```ts
// Store Details
const storeSection = useSection()
const [store, setStore] = useState({
  name:    'Acme Lamp & Sign Co.',
  email:   'hello@acmelamp.com',
  phone:   '+1 902 555 0100',
  address: '42 Victoria Lane',
  city:    'Halifax',
  province:'Nova Scotia',
  country: 'Canada',
})

// Regional
const regionalSection = useSection()
const [regional, setRegional] = useState({
  currency: 'CAD',
  timezone: 'America/Halifax',
  dateFormat: 'DD MMM YYYY',
})
```

and:

```ts
// Notifications
const notifSection = useSection()
const [notifs, setNotifs] = useState({
  orderPlaced:       true,
  orderFulfilled:    true,
  lowStock:          true,
  abandonedCheckout: false,
  weeklyDigest:      true,
})
```

with:

```ts
type SettingsApiShape = {
  storeName: string; storeEmail: string; storePhone: string
  storeAddress: string; storeCity: string; storeProvince: string; storeCountry: string
  currency: string; timezone: string; dateFormat: string
  notifyOrderPlaced: boolean; notifyOrderFulfilled: boolean; notifyLowStock: boolean
  notifyAbandonedCheckout: boolean; notifyWeeklyDigest: boolean
}

const [settingsLoaded, setSettingsLoaded] = useState(false)

// Store Details
const storeSection = useSection()
const [store, setStore] = useState({
  name: '', email: '', phone: '', address: '', city: '', province: '', country: '',
})

// Regional
const regionalSection = useSection()
const [regional, setRegional] = useState({
  currency: 'CAD', timezone: 'America/Halifax', dateFormat: 'DD MMM YYYY',
})

// Notifications
const notifSection = useSection()
const [notifs, setNotifs] = useState({
  orderPlaced: true, orderFulfilled: true, lowStock: true,
  abandonedCheckout: false, weeklyDigest: true,
})

useEffect(() => {
  fetch('/api/admin/settings')
    .then(r => r.ok ? r.json() : null)
    .then((d: SettingsApiShape | null) => {
      if (!d) return
      setStore({
        name: d.storeName, email: d.storeEmail, phone: d.storePhone,
        address: d.storeAddress, city: d.storeCity, province: d.storeProvince, country: d.storeCountry,
      })
      setRegional({ currency: d.currency, timezone: d.timezone, dateFormat: d.dateFormat })
      setNotifs({
        orderPlaced: d.notifyOrderPlaced, orderFulfilled: d.notifyOrderFulfilled,
        lowStock: d.notifyLowStock, abandonedCheckout: d.notifyAbandonedCheckout,
        weeklyDigest: d.notifyWeeklyDigest,
      })
    })
    .finally(() => setSettingsLoaded(true))
}, [])
```

- [ ] **Step 2: Replace the shared `useSection()` helper so `triggerSave` actually PATCHes**

Replace:

```ts
function useSection() {
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  function triggerSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 700)
  }

  return { saving, saved, triggerSave }
}
```

with:

```ts
function useSection() {
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function triggerSave(e: React.FormEvent, payload: Record<string, unknown>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Could not save changes.')
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return { saving, saved, error, triggerSave }
}
```

- [ ] **Step 3: Update each form's `onSubmit` to pass its own payload**

Store Details form — change:

```tsx
<form onSubmit={storeSection.triggerSave}>
```

to:

```tsx
<form onSubmit={e => storeSection.triggerSave(e, {
  storeName: store.name, storeEmail: store.email, storePhone: store.phone,
  storeAddress: store.address, storeCity: store.city, storeProvince: store.province, storeCountry: store.country,
})}>
```

Regional form — change:

```tsx
<form onSubmit={regionalSection.triggerSave}>
```

to:

```tsx
<form onSubmit={e => regionalSection.triggerSave(e, {
  currency: regional.currency, timezone: regional.timezone, dateFormat: regional.dateFormat,
})}>
```

Notifications form — change:

```tsx
<form onSubmit={notifSection.triggerSave}>
```

to:

```tsx
<form onSubmit={e => notifSection.triggerSave(e, {
  notifyOrderPlaced: notifs.orderPlaced, notifyOrderFulfilled: notifs.orderFulfilled,
  notifyLowStock: notifs.lowStock, notifyAbandonedCheckout: notifs.abandonedCheckout,
  notifyWeeklyDigest: notifs.weeklyDigest,
})}>
```

- [ ] **Step 4: Show section-level errors next to each Save button**

In each of the three `SectionCard` headers (Store Details, Regional, Notifications), directly below the existing `<SaveButton .../>` line, add:

```tsx
{storeSection.error && <p className="text-[11px] text-(--admin-red) mt-1">{storeSection.error}</p>}
```

(and the matching `regionalSection.error` / `notifSection.error` versions under their own `SaveButton`).

- [ ] **Step 5: Guard the page body on `settingsLoaded` so stale defaults never flash**

Wrap the returned JSX's outer `<div className="max-w-2xl space-y-6">...</div>` block: right before it, add an early return —

```tsx
if (!settingsLoaded) {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your store preferences" />
      <p className="text-[13px] text-(--admin-text-soft)">Loading settings…</p>
    </div>
  )
}
```

placed immediately after the `useEffect` from Step 1 and before the `return (` that renders the full form.

- [ ] **Step 6: Manually verify in the browser**

1. Load `/admin/settings` — briefly shows "Loading settings…", then populates Store Details/Regional/Notifications with whatever is in `admin_settings` (the seeded defaults from Task 1 on first load).
2. Change the Store name field, click Save changes → green "Saved" appears.
3. Hard-refresh the page → the changed store name is still there (proves it round-tripped through Supabase, not just local state).
4. Toggle a notification switch, click Save changes, hard-refresh → toggle state persisted.
5. Change Regional → Currency, save, refresh → persisted.

- [ ] **Step 7: Commit**

```bash
git add app/admin/settings/page.tsx
git commit -m "Wire Store Details, Regional, and Notifications sections to the real settings API"
```

---

### Task 6: Remove now-fully-unused mock exports

**Files:**
- Modify: `lib/admin/mockData.ts`

**Interfaces:**
- None — this is dead-code removal surfaced by the audit that led to this plan. `mockChartData` is intentionally left alone: it's still a live (harmless) fallback prop default in `components/admin/charts/OrdersChart.tsx` and `RevenueChart.tsx`.

- [ ] **Step 1: Confirm each export is truly unused**

```bash
for name in mockOrders mockAdminProducts mockCollections mockCustomers mockRevenueStats mockOrderCount mockSessionCount mockConversionRate mockTopProducts mockAbandonedCheckouts mockInventoryAlerts getOrderByTrackingRef MOCK_ADMIN_PASSWORD; do
  echo "== $name =="
  grep -rln "\b$name\b" app components lib --include=*.ts --include=*.tsx | grep -v "lib/admin/mockData.ts"
done
```

Expected: empty output for every name (no files listed) — confirming none of them are imported anywhere after Task 4 removed the last usage of `MOCK_ADMIN_PASSWORD`.

- [ ] **Step 2: Delete the unused exports from `lib/admin/mockData.ts`**

Remove the `MOCK_ADMIN_PASSWORD` constant, the `getOrderByTrackingRef` function, and the `mockOrders`, `mockAdminProducts`, `mockCollections`, `mockCustomers`, `mockRevenueStats`, `mockOrderCount`, `mockSessionCount`, `mockConversionRate`, `mockTopProducts`, `mockAbandonedCheckouts`, `mockInventoryAlerts` exports and their data. Leave `mockChartData` untouched.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors (confirms nothing else was quietly depending on the removed exports).

- [ ] **Step 4: Commit**

```bash
git add lib/admin/mockData.ts
git commit -m "Remove fully-unused mock exports after Settings page real-persistence work"
```

---

## Self-Review

**Spec coverage:**
- Password change is fake → Task 3 + 4 (real bcrypt/Redis endpoint, wired to the form, min length aligned to 8 chars).
- Store Details/Regional/Notifications are fake → Task 1 (table) + Task 2 (API) + Task 5 (wiring, with loading guard and per-section error display).
- `MOCK_ADMIN_PASSWORD` and other dead mock exports flagged in the audit → Task 6.
- `mockChartData` fallback explicitly scoped **out** — it's live but harmless, called out in Global Constraints/Task 6 notes so it isn't accidentally deleted.

**Placeholder scan:** no TBD/TODO markers; every step has complete, runnable code; no "similar to Task N" shortcuts — Task 5's three near-identical form-wiring edits are each written out in full since they're all small.

**Type consistency:** `SettingsApiShape` (Task 5) matches the exact camelCase keys returned by `toClientShape()` in Task 2's route. `CLIENT_TO_COLUMN` in Task 2 maps every key `SettingsApiShape`/Task 5 sends. `change-password` request body keys (`currentPassword`, `newPassword`) match between Task 3's route and Task 4's `fetch` call.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-08-admin-settings-real-persistence.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
