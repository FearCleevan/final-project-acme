# Marketing Manual Subscribers & Recipient Targeting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins manually add/deactivate newsletter subscribers, and target a campaign send at a specific subset of subscribers instead of always blasting everyone.

**Architecture:** Extend the existing `newsletter_subscribers` read-only admin route with `POST`/`PATCH` handlers, add a new nullable `recipient_emails` column to `email_campaigns` (null = everyone, array = a specific subset), and update both send paths (manual send route, scheduled cron route) to branch on that column. UI additions live entirely in the existing `app/admin/marketing/page.tsx`.

**Tech Stack:** Next.js App Router, TypeScript, Supabase, existing admin session auth pattern.

## Global Constraints

- Toggling a subscriber inactive reuses the existing `unsubscribed_at` column — no new column for status, no separate "admin-deactivated" state.
- Recipient targeting is persisted on the campaign record (`recipient_emails`), not held only in the compose form's local state — both "Send Now" and "Save Draft → Send later" must respect it.
- A specific recipient list is always re-checked against `unsubscribed_at IS NULL` at actual send time (manual or cron), never trusted as still-valid from when it was saved.
- Reuse the existing `/api/admin/search` endpoint for the customer picker — no new customer-search endpoint.
- `npx tsc --noEmit` must report zero errors at the end of every task.

---

## File Structure

- **Create:** `docs/supabase/migrations/013_campaign_recipients.sql` — new nullable column.
- **Modify:** `app/api/admin/marketing/subscribers/route.ts` — add `POST`, `PATCH`.
- **Modify:** `app/api/admin/marketing/campaigns/route.ts` — accept/store/return `recipient_emails`.
- **Modify:** `app/api/admin/marketing/campaigns/[id]/send/route.ts` — branch send-recipient query on `recipient_emails`.
- **Modify:** `app/api/cron/newsletter/route.ts` — identical branching for the scheduled path.
- **Modify:** `app/admin/marketing/page.tsx` — Add Subscriber modal, inline active/inactive toggle, Recipients section in compose panel, campaign list recipient indicator.

---

### Task 1: Migration and campaign type/list plumbing for `recipient_emails`

**Files:**
- Create: `docs/supabase/migrations/013_campaign_recipients.sql`
- Modify: `app/api/admin/marketing/campaigns/route.ts:20-52`
- Modify: `app/admin/marketing/page.tsx:259-269` (the `Campaign` interface)

**Interfaces:**
- Produces: `email_campaigns.recipient_emails` (nullable jsonb column, holds a JSON array of email strings or `null`), `Campaign.recipient_emails: string[] | null` in the page's TypeScript type, and `POST /api/admin/marketing/campaigns` now accepts an optional `recipient_emails: string[] | null` field in its body and returns it. Consumed by Tasks 5, 6, 7.

- [ ] **Step 1: Write the migration**

```sql
-- 013_campaign_recipients.sql
-- Run in Supabase Dashboard → SQL Editor
--
-- Lets a campaign target a specific subset of subscribers instead of
-- always sending to everyone active. null = all active subscribers
-- (existing default behavior, unchanged); a JSON array = the exact
-- subset chosen when the campaign was composed.

ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS recipient_emails jsonb;
```

- [ ] **Step 2: Run the migration**

Run this SQL in the Supabase Dashboard → SQL Editor (production project). Confirm success: `SELECT recipient_emails FROM email_campaigns LIMIT 1;` returns the column (value `null` for existing rows) without error.

- [ ] **Step 3: Update `GET`/`POST` in `app/api/admin/marketing/campaigns/route.ts`**

Change the `GET` handler's select list (line 24) from:

```ts
    .select('id, subject, status, scheduled_for, sent_at, recipient_count, created_at, template, template_data')
```

to:

```ts
    .select('id, subject, status, scheduled_for, sent_at, recipient_count, created_at, template, template_data, recipient_emails')
```

Change the `POST` handler (lines 30-52) from:

```ts
export async function POST(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { subject, body, cta_label, cta_url, scheduled_for, template, template_data } = await req.json()
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
      template:      template           || 'bench_notes',
      template_data: template_data      || null,
      status:        'draft',
    })
    .select('id, subject, status, created_at, template, template_data')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

to:

```ts
export async function POST(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { subject, body, cta_label, cta_url, scheduled_for, template, template_data, recipient_emails } = await req.json()
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'subject and body are required' }, { status: 400 })
  }
  const { data, error } = await getSupabase()
    .from('email_campaigns')
    .insert({
      subject:          subject.trim(),
      body:             body.trim(),
      cta_label:        cta_label?.trim()  || null,
      cta_url:          cta_url?.trim()    || null,
      scheduled_for:    scheduled_for      || null,
      template:         template           || 'bench_notes',
      template_data:    template_data      || null,
      recipient_emails: recipient_emails   || null,
      status:           'draft',
    })
    .select('id, subject, status, created_at, template, template_data, recipient_emails')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 4: Update the `Campaign` interface in `app/admin/marketing/page.tsx`**

Change (lines 259-269) from:

```tsx
interface Campaign {
  id:               string
  subject:          string
  status:           'draft' | 'sent'
  scheduled_for:    string | null
  sent_at:          string | null
  recipient_count:  number | null
  created_at:       string
  template:         TemplateType
  template_data:    Record<string, unknown> | null
}
```

to:

```tsx
interface Campaign {
  id:               string
  subject:          string
  status:           'draft' | 'sent'
  scheduled_for:    string | null
  sent_at:          string | null
  recipient_count:  number | null
  created_at:       string
  template:         TemplateType
  template_data:    Record<string, unknown> | null
  recipient_emails: string[] | null
}
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add docs/supabase/migrations/013_campaign_recipients.sql app/api/admin/marketing/campaigns/route.ts "app/admin/marketing/page.tsx"
git commit -m "feat: add recipient_emails column and plumbing for campaign targeting"
```

---

### Task 2: Add-subscriber and toggle-active API routes

**Files:**
- Modify: `app/api/admin/marketing/subscribers/route.ts`

**Interfaces:**
- Produces: `POST /api/admin/marketing/subscribers` (body `{ email: string }` → `201` with the new row, or `409` `{ error: 'Already a subscriber.' }` on duplicate, or `400` on invalid email format) and `PATCH /api/admin/marketing/subscribers` (body `{ email: string, active: boolean }` → `{ ok: true }`). Consumed by Tasks 3 and 4.

- [ ] **Step 1: Add the email format constant and both handlers**

Add this near the top of the file, after the existing `requireAuth` function:

```ts
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

Add these two handlers after the existing `GET` function:

```ts
export async function POST(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { email?: string } | null
  const email = body?.email?.trim().toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }

  const { data, error } = await getSupabase()
    .from('newsletter_subscribers')
    .insert({ email, subscribed_at: new Date().toISOString() })
    .select('email, subscribed_at, unsubscribed_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already a subscriber.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { email?: string; active?: boolean } | null
  if (!body?.email || typeof body.active !== 'boolean') {
    return NextResponse.json({ error: 'email and active are required.' }, { status: 400 })
  }

  const { error } = await getSupabase()
    .from('newsletter_subscribers')
    .update({ unsubscribed_at: body.active ? null : new Date().toISOString() })
    .eq('email', body.email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Add the `NextRequest` import if not already present**

Confirm the top of the file already imports `NextRequest` alongside `NextResponse` (it does, from the existing `GET(req: NextRequest)` signature — no change needed here, just confirm before moving on).

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Manual check**

With the dev server running and logged into `/admin`, POST `{"email": "test@example.com"}` to `/api/admin/marketing/subscribers` (via a REST client with your session cookie) — confirm `201` with the row returned. POST the same email again — confirm `409` with `"Already a subscriber."`. PATCH `{"email": "test@example.com", "active": false}` — confirm `{"ok": true}`, then check via `GET` that the row's `unsubscribed_at` is now set. PATCH again with `active: true` — confirm `unsubscribed_at` is back to `null`.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/marketing/subscribers/route.ts
git commit -m "feat: add POST/PATCH to admin subscribers route for manual add and status toggle"
```

---

### Task 3: Add Subscriber modal UI

**Files:**
- Modify: `app/admin/marketing/page.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/marketing/subscribers` from Task 2, `GET /api/admin/search?q=...` (existing route, returns `{ customers: { id: string; name: string; email: string }[], ... }`).

- [ ] **Step 1: Add state for the modal**

Add these near the existing Subscribers state (after `const [subsLoading, setSubsLoading] = useState(true)`):

```tsx
  const [addingSubscriber, setAddingSubscriber] = useState(false)
  const [addMode,          setAddMode]          = useState<'pick' | 'manual'>('pick')
  const [addSearch,        setAddSearch]        = useState('')
  const [addResults,       setAddResults]       = useState<{ id: string; name: string; email: string }[]>([])
  const [addSearching,     setAddSearching]     = useState(false)
  const [manualEmail,      setManualEmail]      = useState('')
  const [addSaving,        setAddSaving]        = useState(false)
```

- [ ] **Step 2: Add the search effect and submit handler**

Add near the other `useEffect`s (after the product-search effect):

```tsx
  useEffect(() => {
    if (addMode !== 'pick' || !addSearch.trim()) { setAddResults([]); return }
    setAddSearching(true)
    const timer = setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(addSearch.trim())}`)
        .then(r => r.ok ? r.json() : { customers: [] })
        .then(d => setAddResults(d.customers ?? []))
        .catch(() => setAddResults([]))
        .finally(() => setAddSearching(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [addSearch, addMode])
```

Add near the other action functions (after `handleExportCsv`):

```tsx
  async function submitAddSubscriber(email: string) {
    setAddSaving(true)
    try {
      const r = await fetch('/api/admin/marketing/subscribers', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to add subscriber')
      showToast('Subscriber added.')
      setAddingSubscriber(false)
      setAddSearch(''); setAddResults([]); setManualEmail('')
      await loadSubscribers()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to add subscriber', 'error')
    } finally {
      setAddSaving(false)
    }
  }
```

- [ ] **Step 3: Add the "Add Subscriber" button**

Change the Subscribers tab's header row (find the `<div className="flex items-center justify-between">` immediately inside `{tab === 'subscribers' && (`) from:

```tsx
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
```

to:

```tsx
          <div className="flex items-center justify-between">
            <p className="text-[14px] text-(--admin-text-soft)">
              <span className="font-semibold text-(--admin-text)">{activeCount}</span> active subscriber{activeCount === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAddingSubscriber(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-(--admin-accent) text-(--admin-accent-text) text-[12px] font-medium hover:opacity-90 transition-opacity"
              >
                <BiPlus size={14} />
                Add Subscriber
              </button>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-(--admin-border) text-[12px] text-(--admin-text-soft) hover:text-(--admin-text) hover:bg-(--admin-surface-2) transition-colors"
              >
                <BiDownload size={14} />
                Export CSV
              </button>
            </div>
          </div>
```

- [ ] **Step 4: Add the modal**

Add this JSX right after the closing `)}` of the `{previewOpen && (...)}` block (near the end of the component, before the `{toast && (...)}` block):

```tsx
      {addingSubscriber && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setAddingSubscriber(false)}
        >
          <div
            className="bg-(--admin-surface) rounded-xl w-full max-w-[440px] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-(--admin-border)">
              <p className="text-[14px] font-semibold text-(--admin-text)">Add Subscriber</p>
              <button
                onClick={() => setAddingSubscriber(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-(--admin-surface-2) text-(--admin-text-muted) transition-colors"
              >
                <BiX size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex rounded-md border border-(--admin-border) overflow-hidden">
                {(['pick', 'manual'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAddMode(m)}
                    className={cn(
                      'flex-1 py-1.5 text-[12px] transition-colors',
                      addMode === m
                        ? 'bg-(--admin-accent) text-(--admin-accent-text)'
                        : 'text-(--admin-text-soft) hover:bg-(--admin-surface-2)'
                    )}
                  >
                    {m === 'pick' ? 'Pick from customers' : 'Enter email manually'}
                  </button>
                ))}
              </div>

              {addMode === 'pick' ? (
                <div className="relative">
                  <div className="relative">
                    <BiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted)" />
                    <input
                      type="text"
                      value={addSearch}
                      onChange={e => setAddSearch(e.target.value)}
                      placeholder="Search customers…"
                      className="w-full pl-8 pr-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                    />
                    {addSearching && <BiLoader size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted) animate-spin" />}
                  </div>
                  {addResults.length > 0 && (
                    <div className="mt-2 rounded-md border border-(--admin-border) divide-y divide-(--admin-border) max-h-56 overflow-y-auto">
                      {addResults.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          disabled={addSaving}
                          onClick={() => submitAddSubscriber(c.email)}
                          className="w-full flex flex-col items-start px-3 py-2 text-left hover:bg-(--admin-surface-2) transition-colors disabled:opacity-50"
                        >
                          <span className="text-[13px] font-medium text-(--admin-text)">{c.name}</span>
                          <span className="text-[11px] text-(--admin-text-muted)">{c.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={e => setManualEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="flex-1 px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                  />
                  <button
                    type="button"
                    disabled={addSaving || !manualEmail.trim()}
                    onClick={() => submitAddSubscriber(manualEmail.trim())}
                    className="px-4 py-2 rounded-md bg-(--admin-accent) text-(--admin-accent-text) text-[13px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 6: Manual check**

Run `npm run dev`, open `/admin/marketing`, click **Add Subscriber**. In "Pick from customers," search a real customer's name (e.g. "Kokila") and click their result — confirm a success toast and the new row appears in the table as Active. Reopen the modal, switch to "Enter email manually," type a test email, click Add — confirm the same. Try adding the same email again — confirm a "409 Already a subscriber" error toast, not a crash.

- [ ] **Step 7: Commit**

```bash
git add "app/admin/marketing/page.tsx"
git commit -m "feat: add Add Subscriber modal (pick from customers or manual email)"
```

---

### Task 4: Toggle active/inactive UI

**Files:**
- Modify: `app/admin/marketing/page.tsx`

**Interfaces:**
- Consumes: `PATCH /api/admin/marketing/subscribers` from Task 2.

- [ ] **Step 1: Add the toggle handler**

Add near `submitAddSubscriber` (after it):

```tsx
  async function toggleSubscriberActive(email: string, currentlyActive: boolean) {
    // Optimistic update
    setSubscribers(prev => prev.map(s =>
      s.email === email
        ? { ...s, unsubscribed_at: currentlyActive ? new Date().toISOString() : null }
        : s
    ))
    try {
      const r = await fetch('/api/admin/marketing/subscribers', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, active: !currentlyActive }),
      })
      if (!r.ok) throw new Error()
    } catch {
      showToast('Failed to update subscriber status.', 'error')
      await loadSubscribers() // roll back to server truth
    }
  }
```

- [ ] **Step 2: Add the toggle button to each row**

Change the subscribers table row (find the `<tr key={s.email} ...>` inside the Subscribers tab) from:

```tsx
                  {subscribers.map(s => (
                    <tr key={s.email} className="hover:bg-(--admin-surface-2) transition-colors">
                      <td className="px-4 py-3 text-(--admin-text)">{s.email}</td>
                      <td className="px-4 py-3 text-(--admin-text-soft)">{fmtDate(s.subscribed_at)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={s.unsubscribed_at ? 'amber' : 'green'}
                          label={s.unsubscribed_at ? 'Unsubscribed' : 'Active'}
                        />
                      </td>
                    </tr>
                  ))}
```

to:

```tsx
                  {subscribers.map(s => (
                    <tr key={s.email} className="hover:bg-(--admin-surface-2) transition-colors">
                      <td className="px-4 py-3 text-(--admin-text)">{s.email}</td>
                      <td className="px-4 py-3 text-(--admin-text-soft)">{fmtDate(s.subscribed_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={s.unsubscribed_at ? 'amber' : 'green'}
                            label={s.unsubscribed_at ? 'Unsubscribed' : 'Active'}
                          />
                          <button
                            type="button"
                            onClick={() => toggleSubscriberActive(s.email, !s.unsubscribed_at)}
                            className="text-[11px] text-(--admin-text-muted) hover:text-(--admin-text) underline transition-colors"
                          >
                            {s.unsubscribed_at ? 'Reactivate' : 'Deactivate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Manual check**

Click **Deactivate** on an active subscriber — confirm the badge flips to "Unsubscribed" immediately and the active-subscriber count at the top decreases by one. Click **Reactivate** on that same row — confirm it flips back and the count increases again.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/marketing/page.tsx"
git commit -m "feat: add active/inactive toggle to subscribers table"
```

---

### Task 5: Recipients section in the Campaigns compose panel

**Files:**
- Modify: `app/admin/marketing/page.tsx`

**Interfaces:**
- Produces: local state `recipientMode: 'all' | 'specific'` and `selectedRecipients: string[]`, serialized into `recipient_emails` on the `POST /api/admin/marketing/campaigns` payloads used by `handleSaveDraft` and `handleSendNow`.

- [ ] **Step 1: Add compose-panel state**

Add near the other compose-form state (after `const [scheduleFor, setScheduleFor] = useState('')`):

```tsx
  const [recipientMode,      setRecipientMode]      = useState<'all' | 'specific'>('all')
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [recipientSearch,    setRecipientSearch]    = useState('')
```

- [ ] **Step 2: Reset this state in `resetCompose`**

Change `resetCompose` (currently ending with `setSelectedProducts([]); setProductSearch(''); setProductResults([])`) to also reset the new state:

```tsx
  function resetCompose() {
    setSubject(''); setBody(''); setCtaLabel(''); setCtaUrl('')
    setScheduleFor(''); setPreviewOpen(false); setComposing(false)
    setTemplate('bench_notes'); setGreeting('A note from the bench.')
    setSaleHeadline(''); setDiscountCode(''); setSaleEndDate('')
    setSelectedProducts([]); setProductSearch(''); setProductResults([])
    setRecipientMode('all'); setSelectedRecipients([]); setRecipientSearch('')
  }
```

- [ ] **Step 3: Add a recipient toggle helper and validation check**

Add near the other helper functions (after `removeProduct`):

```tsx
  function toggleRecipient(email: string) {
    setSelectedRecipients(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    )
  }

  function recipientEmailsPayload(): string[] | null {
    return recipientMode === 'specific' ? selectedRecipients : null
  }
```

- [ ] **Step 4: Wire validation into `handleSaveDraft` and `handleSendNow`**

In `handleSaveDraft`, change the validation block from:

```tsx
    if (!subject.trim() || !body.trim()) {
      showToast('Subject and body are required.', 'error'); return
    }
    if (template === 'new_arrivals' && selectedProducts.length === 0) {
      showToast('Add at least one product for New Arrivals.', 'error'); return
    }
    if (template === 'seasonal_sale' && (!ctaLabel.trim() || !ctaUrl.trim())) {
      showToast('Seasonal Sale requires a CTA button label and URL.', 'error'); return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, body: getBodyForTemplate(),
          cta_label:     ctaLabel || null,
          cta_url:       ctaUrl   || null,
          scheduled_for: scheduleFor || null,
          template,
          template_data: buildTemplateData(),
        }),
      })
```

to:

```tsx
    if (!subject.trim() || !body.trim()) {
      showToast('Subject and body are required.', 'error'); return
    }
    if (template === 'new_arrivals' && selectedProducts.length === 0) {
      showToast('Add at least one product for New Arrivals.', 'error'); return
    }
    if (template === 'seasonal_sale' && (!ctaLabel.trim() || !ctaUrl.trim())) {
      showToast('Seasonal Sale requires a CTA button label and URL.', 'error'); return
    }
    if (recipientMode === 'specific' && selectedRecipients.length === 0) {
      showToast('Select at least one subscriber, or switch to All active subscribers.', 'error'); return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, body: getBodyForTemplate(),
          cta_label:        ctaLabel || null,
          cta_url:          ctaUrl   || null,
          scheduled_for:    scheduleFor || null,
          template,
          template_data:    buildTemplateData(),
          recipient_emails: recipientEmailsPayload(),
        }),
      })
```

Apply the identical two changes (the validation line, and adding `recipient_emails: recipientEmailsPayload(),` to the POST body) to `handleSendNow`'s matching validation block and its first `fetch('/api/admin/marketing/campaigns', ...)` call (the "Save draft first to get an id" step) — the shapes are otherwise the same as `handleSaveDraft`'s.

- [ ] **Step 5: Add the Recipients section to the compose form JSX**

Insert this between the CTA fields grid (`{/* Actions */}` marks where the buttons start — insert right before that comment, after the CTA `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">...</div>` block, and before the existing "Schedule for" `<div>`):

```tsx
                <div>
                  <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-2">Recipients</label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 text-[13px] text-(--admin-text) cursor-pointer">
                      <input
                        type="radio"
                        checked={recipientMode === 'all'}
                        onChange={() => setRecipientMode('all')}
                      />
                      All active subscribers ({activeCount})
                    </label>
                    <label className="flex items-center gap-2 text-[13px] text-(--admin-text) cursor-pointer">
                      <input
                        type="radio"
                        checked={recipientMode === 'specific'}
                        onChange={() => setRecipientMode('specific')}
                      />
                      Specific subscribers
                    </label>
                  </div>

                  {recipientMode === 'specific' && (
                    <div>
                      <input
                        type="text"
                        value={recipientSearch}
                        onChange={e => setRecipientSearch(e.target.value)}
                        placeholder="Search subscribers…"
                        className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors mb-2"
                      />
                      <div className="rounded-md border border-(--admin-border) divide-y divide-(--admin-border) max-h-48 overflow-y-auto">
                        {subscribers
                          .filter(s => !s.unsubscribed_at)
                          .filter(s => s.email.toLowerCase().includes(recipientSearch.trim().toLowerCase()))
                          .map(s => (
                            <label
                              key={s.email}
                              className="flex items-center gap-2 px-3 py-2 text-[13px] text-(--admin-text) cursor-pointer hover:bg-(--admin-surface-2) transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedRecipients.includes(s.email)}
                                onChange={() => toggleRecipient(s.email)}
                              />
                              {s.email}
                            </label>
                          ))}
                      </div>
                      <p className="text-[11px] text-(--admin-text-muted) mt-1">
                        {selectedRecipients.length} selected
                      </p>
                    </div>
                  )}
                </div>
```

- [ ] **Step 6: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 7: Manual check**

Open the Campaigns compose panel — confirm "All active subscribers (N)" is selected by default and matches the count shown on the Subscribers tab. Switch to "Specific subscribers," search for and check one subscriber, then click **Save Draft**. Confirm no validation error fires. Switch back to "Specific subscribers" with nothing checked and try **Send Now** — confirm the "Select at least one subscriber..." validation toast appears and nothing is sent.

- [ ] **Step 8: Commit**

```bash
git add "app/admin/marketing/page.tsx"
git commit -m "feat: add Recipients targeting section to campaign compose panel"
```

---

### Task 6: Branch send logic on `recipient_emails` (manual send + cron)

**Files:**
- Modify: `app/api/admin/marketing/campaigns/[id]/send/route.ts`
- Modify: `app/api/cron/newsletter/route.ts`

**Interfaces:**
- Consumes: `email_campaigns.recipient_emails` column from Task 1.

- [ ] **Step 1: Read the current full contents of both files to confirm exact line numbers before editing**

Both files already exist in this codebase (`app/api/admin/marketing/campaigns/[id]/send/route.ts` and `app/api/cron/newsletter/route.ts`) — read them first to get the current exact subscriber-fetch block, since line numbers may have shifted slightly from documentation. The two known-good reference queries (from the version reviewed while writing this plan) are shown in Steps 2 and 3 below — match against what you actually find and adapt if anything differs.

- [ ] **Step 2: Update `app/api/admin/marketing/campaigns/[id]/send/route.ts`**

Find the block that loads the campaign and fetches subscribers (look for `.from('email_campaigns').select('*')` and the subsequent `.from('newsletter_subscribers')` query). Change the subscriber-fetch logic from fetching unconditionally to branching on the campaign's `recipient_emails`:

```ts
  const { data: subs } = campaign.recipient_emails
    ? await supabase
        .from('newsletter_subscribers')
        .select('email')
        .in('email', campaign.recipient_emails as string[])
        .is('unsubscribed_at', null)
    : await supabase
        .from('newsletter_subscribers')
        .select('email')
        .is('unsubscribed_at', null)
```

This replaces whatever unconditional `.from('newsletter_subscribers').select('email').is('unsubscribed_at', null)` call currently exists right before `sendNewsletter(...)` is invoked. Also make sure the earlier `.select('*')` on `email_campaigns` includes `recipient_emails` — since it's `select('*')`, it already does, no change needed there.

- [ ] **Step 3: Update `app/api/cron/newsletter/route.ts`**

Change (the current unconditional block):

```ts
  const { data: subs } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .is('unsubscribed_at', null)

  const subscribers = subs ?? []
```

to:

```ts
  const { data: subs } = campaign.recipient_emails
    ? await supabase
        .from('newsletter_subscribers')
        .select('email')
        .in('email', campaign.recipient_emails as string[])
        .is('unsubscribed_at', null)
    : await supabase
        .from('newsletter_subscribers')
        .select('email')
        .is('unsubscribed_at', null)

  const subscribers = subs ?? []
```

The earlier `.from('email_campaigns').select('*')` call in this file (used to find the due campaign) already returns `recipient_emails` via `select('*')` — no change needed there.

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 5: Manual check**

Create a campaign with "Specific subscribers" targeting exactly one test email you control, click **Send** from the campaign list. Confirm only that one address receives the email (check the inbox) — not every active subscriber. Then create a second campaign left on "All active subscribers" and send it — confirm it still goes to everyone (regression check on the default path).

- [ ] **Step 6: Commit**

```bash
git add "app/api/admin/marketing/campaigns/[id]/send/route.ts" app/api/cron/newsletter/route.ts
git commit -m "feat: honor recipient_emails targeting in manual send and cron send paths"
```

---

### Task 7: Campaign list recipient indicator

**Files:**
- Modify: `app/admin/marketing/page.tsx`

**Interfaces:**
- Consumes: `Campaign.recipient_emails` from Task 1.

- [ ] **Step 1: Update the campaign list subtitle line**

Find the campaign list rendering (the `.map(c => (...))` block under "Campaign list" showing subject + status subtitle). Change:

```tsx
                      <p className="text-[12px] text-(--admin-text-muted) mt-0.5">
                        {c.status === 'sent'
                          ? `Sent ${c.sent_at ? fmtDate(c.sent_at) : '—'} · ${c.recipient_count ?? 0} recipient${c.recipient_count === 1 ? '' : 's'}`
                          : c.scheduled_for
                            ? `Scheduled for ${fmtDate(c.scheduled_for)}`
                            : `Draft · ${fmtDate(c.created_at)}`}
                      </p>
```

to:

```tsx
                      <p className="text-[12px] text-(--admin-text-muted) mt-0.5">
                        {c.status === 'sent'
                          ? `Sent ${c.sent_at ? fmtDate(c.sent_at) : '—'} · ${c.recipient_count ?? 0} recipient${c.recipient_count === 1 ? '' : 's'}`
                          : c.scheduled_for
                            ? `Scheduled for ${fmtDate(c.scheduled_for)}`
                            : `Draft · ${fmtDate(c.created_at)}`}
                        {c.status !== 'sent' && c.recipient_emails && (
                          <> · {c.recipient_emails.length} recipient{c.recipient_emails.length === 1 ? '' : 's'} selected</>
                        )}
                      </p>
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Manual check**

Confirm a draft saved with "Specific subscribers" shows e.g. "Draft · Jul 11, 2026 · 1 recipient selected" in the campaign list, while a draft left on "All active subscribers" shows just "Draft · Jul 11, 2026" as before.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/marketing/page.tsx"
git commit -m "feat: show recipient targeting indicator in campaign list"
```

---

### Task 8: Full end-to-end verification pass

**Files:** none (manual verification only, consistent with this codebase's existing precedent — no automated UI test suite here)

- [ ] **Step 1: Add subscribers**

Add one subscriber via "Pick from customers" (search a real customer, click to add) and one via "Enter email manually." Confirm both appear Active in the table.

- [ ] **Step 2: Toggle status**

Deactivate one of the two, confirm the active count drops by one and the badge updates. Reactivate it, confirm the count and badge return to normal.

- [ ] **Step 3: Targeted send**

Create a campaign, switch to "Specific subscribers," select only the subscriber you just added/reactivated, Send Now. Confirm the real inbox receives it and no other subscriber does.

- [ ] **Step 4: Unsubscribe-before-send re-check**

Save a draft targeting a specific subscriber. Before sending it, deactivate that same subscriber via the toggle. Send the draft from the campaign list. Confirm the send completes with `sent: 0` (or excludes that person) rather than emailing someone who's now inactive.

- [ ] **Step 5: Regression check on the default path**

Create and send a campaign left on "All active subscribers." Confirm it behaves exactly as it did before this plan (goes to every currently-active subscriber).

- [ ] **Step 6: Final type check**

Run: `npx tsc --noEmit`
Expected: zero errors.

---

## Self-Review Notes

- **Spec coverage:** All three scope decisions covered — Add Subscriber with both pick-from-customers and manual-entry modes (Task 3), active/inactive toggle reusing `unsubscribed_at` (Tasks 2, 4), and per-campaign recipient targeting persisted on the campaign record and respected by both the manual send route and the cron route (Tasks 1, 5, 6), plus the campaign-list indicator called for in the spec's architecture section (Task 7).
- **Placeholder scan:** No TBD/TODO — every step has complete, exact code. Task 6's Step 1 explicitly asks the implementer to confirm exact line numbers against the live file before editing, since this plan's authoring session didn't re-paste those two files' full current content — this is a deliberate, explicit instruction to verify, not a placeholder for missing content; the actual replacement code given is complete and correct regardless of exact line position.
- **Type consistency:** `recipient_emails: string[] | null` is used identically across Task 1 (migration/API), Task 5 (compose panel payload), Task 6 (send-route branching), and Task 7 (list display) — no naming drift (e.g., no `recipientEmails` vs `recipient_emails` mismatch between the DB/API layer, which is snake_case, and the one place it's read back in Task 7's JSX, which correctly uses the same snake_case `Campaign.recipient_emails` field name established in Task 1's type change).

