# Notification Bell — Supabase Sources Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the admin notification bell so it also surfaces unread Contact Inbox messages, pending reviews, and restock waitlist signups — currently the bell only knows about Shopify orders, low stock, and new customers.

**Architecture:** Add three new isolated try/catch blocks to the existing `getAdminNotifications()` function in `lib/admin/shopifyAdmin.ts`, each querying a Supabase table with a lazily-constructed client (never module-level `createClient()`), pushing `AdminNotification` objects into the same array the three Shopify sources already populate. The existing `notifications.sort()` call handles interleaving by timestamp — no new merge logic. `AdminTopbar.tsx` gets new icon and color mappings for the three new types, following the same nested-ternary pattern it already uses.

**Tech Stack:** Next.js App Router, TypeScript, Supabase (`@supabase/supabase-js`), react-icons/bi.

## Global Constraints

- Never construct `createClient()` at module level — always inside a `getSupabase()` function called at request time (see [[feedback-supabase-lazy-client]] and the pattern already used in `components/admin/overview/PendingItems.tsx`).
- Each new notification source must be independently try/caught — a Supabase outage on one source must not affect the other five.
- Do not touch `components/admin/overview/PendingItems.tsx` — explicitly out of scope per the approved spec.
- Do not add a `status`/read-state column to `reviews` or `back_in_stock_requests` — out of scope; localStorage dismiss (already implemented client-side in `AdminTopbar.tsx`) is sufficient.
- Do not change the bell's UI shell — badge, dropdown, "Mark all read" button, 60-second polling interval — only the data feeding it and the icon/color mapping.
- `npx tsc --noEmit` must report zero errors at the end.

---

## File Structure

- **Modify:** `lib/admin/types.ts` — extend `NotificationType` union with `'contact_message' | 'pending_review' | 'restock_signup'`.
- **Modify:** `lib/admin/shopifyAdmin.ts` — add three new blocks inside `getAdminNotifications()` (currently at line 1355), after the existing "New customers" block and before the final `.sort()`.
- **Modify:** `components/admin/layout/AdminTopbar.tsx` — extend the `Icon`, `iconBg`, `iconColor` ternary chains (lines 320–330) to cover the three new types.

Confirmed table schemas (already live in Supabase, no migration needed):
- `contact_messages(id uuid, name text, email text, subject text, message text, read_at timestamptz, replied_at timestamptz, created_at timestamptz)` — from `docs/supabase/migrations/006_communications.sql`.
- `reviews(id uuid, product_handle text, customer_name text, rating smallint, status text, created_at timestamptz, ...)` — `status` column (`'pending' | 'approved' | 'deactivated'`) added in `docs/supabase/migrations/002_review_status.sql`.
- `back_in_stock_requests(id uuid, email text, product_handle text, product_title text, notified_at timestamptz, created_at timestamptz)` — from `docs/supabase/migrations/004_back_in_stock.sql`.

---

### Task 1: Extend `NotificationType` union

**Files:**
- Modify: `lib/admin/types.ts:164`

**Interfaces:**
- Produces: `NotificationType` now includes `'contact_message' | 'pending_review' | 'restock_signup'`, consumed by Task 2 (push sites) and Task 3 (UI mapping).

- [ ] **Step 1: Update the union**

Change line 164 from:

```ts
export type NotificationType = 'new_order' | 'low_stock' | 'new_customer'
```

to:

```ts
export type NotificationType =
  | 'new_order' | 'low_stock' | 'new_customer'
  | 'contact_message' | 'pending_review' | 'restock_signup'
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: Existing errors only relate to the yet-unfinished switch statements in Task 3 (none yet, since nothing consumes the new values exhaustively) — expect zero new errors from this file alone. If any file does an exhaustive switch over `NotificationType` today, note it here — none currently do (`AdminTopbar.tsx` uses ternaries with a fallback, not an exhaustive switch).

- [ ] **Step 3: Commit**

```bash
git add lib/admin/types.ts
git commit -m "feat: add contact_message, pending_review, restock_signup to NotificationType"
```

---

### Task 2: Add three Supabase-backed sources to `getAdminNotifications()`

**Files:**
- Modify: `lib/admin/shopifyAdmin.ts:1400-1431` (insert new blocks after the "New customers" block, before the final `return notifications.sort(...)` at line 1434)
- Test: manual (see Task 4)

**Interfaces:**
- Consumes: `AdminNotification` type from `./types` (already imported at line 911), `NotificationType` values added in Task 1.
- Produces: three new entries pushed into the existing `notifications: AdminNotification[]` array (declared line 1356) — no new exported functions, no new return type.

- [ ] **Step 1: Add the `@supabase/supabase-js` import and lazy client helper**

At the top of `lib/admin/shopifyAdmin.ts`, near the existing imports (after line 911's type import), add:

```ts
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

This mirrors the exact pattern in `components/admin/overview/PendingItems.tsx:5-10` — a fresh client per call, never module-level.

- [ ] **Step 2: Insert the `contact_message` block**

Immediately after the "New customers" `catch` block closes (after line 1431, before line 1433's comment `// Sort all notifications newest-first`), insert:

```ts
  // ── Unread contact messages ───────────────────────────────────────────────
  try {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('contact_messages')
      .select('id, name, email, subject, created_at')
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(5)
    for (const m of data ?? []) {
      notifications.push({
        id:        `contact-${m.id}`,
        type:      'contact_message',
        title:     `New message from ${m.name}`,
        subtitle:  `${m.subject} · ${m.email}`,
        href:      '/admin/communications',
        timestamp: m.created_at,
        severity:  'warning',
      })
    }
  } catch { /* Supabase not configured */ }
```

- [ ] **Step 3: Insert the `pending_review` block**

Directly after the block from Step 2:

```ts
  // ── Pending reviews ───────────────────────────────────────────────────────
  try {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('reviews')
      .select('id, product_handle, customer_name, rating, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)
    for (const r of data ?? []) {
      notifications.push({
        id:        `review-${r.id}`,
        type:      'pending_review',
        title:     `New review: ${r.rating}★ on ${r.product_handle}`,
        subtitle:  `by ${r.customer_name}`,
        href:      '/admin/reviews',
        timestamp: r.created_at,
        severity:  'info',
      })
    }
  } catch { /* Supabase not configured */ }
```

- [ ] **Step 4: Insert the `restock_signup` block**

Directly after the block from Step 3. This one groups client-side after fetching, since Supabase's JS client `count(*)` + `group by` requires either an RPC or raw SQL — simplest is to fetch ungrouped rows and group in TypeScript, consistent with the rest of this codebase's style (no new SQL functions):

```ts
  // ── Restock waitlist signups ──────────────────────────────────────────────
  try {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('back_in_stock_requests')
      .select('product_handle, product_title, created_at')
      .is('notified_at', null)
      .order('created_at', { ascending: false })
    const byHandle = new Map<string, { product_title: string; count: number; latest: string }>()
    for (const row of data ?? []) {
      const existing = byHandle.get(row.product_handle)
      if (existing) {
        existing.count += 1
        if (row.created_at > existing.latest) existing.latest = row.created_at
      } else {
        byHandle.set(row.product_handle, { product_title: row.product_title, count: 1, latest: row.created_at })
      }
    }
    const grouped = [...byHandle.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
    for (const [handle, g] of grouped) {
      notifications.push({
        id:        `restock-${handle}`,
        type:      'restock_signup',
        title:     `${g.count} waiting — ${g.product_title}`,
        subtitle:  'Restock waitlist',
        href:      '/admin/communications',
        timestamp: g.latest,
        severity:  'info',
      })
    }
  } catch { /* Supabase not configured */ }
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add lib/admin/shopifyAdmin.ts
git commit -m "feat: wire contact_message, pending_review, restock_signup into getAdminNotifications"
```

---

### Task 3: Extend `AdminTopbar.tsx` icon/color mapping

**Files:**
- Modify: `components/admin/layout/AdminTopbar.tsx:5` (import), `components/admin/layout/AdminTopbar.tsx:320-330` (ternary chains)

**Interfaces:**
- Consumes: `AdminNotification.type` values added in Task 1, `AdminNotification.severity` values `'warning'` (contact_message) and `'info'` (pending_review, restock_signup) produced in Task 2.

- [ ] **Step 1: Add icon imports**

Change line 5 from:

```ts
import { BiSearch, BiBell, BiX, BiPackage, BiCog, BiLogOut, BiBox, BiReceipt, BiUser } from 'react-icons/bi'
```

to:

```ts
import { BiSearch, BiBell, BiX, BiPackage, BiCog, BiLogOut, BiBox, BiReceipt, BiUser, BiEnvelope, BiStar, BiRefresh } from 'react-icons/bi'
```

- [ ] **Step 2: Extend the `Icon` ternary**

Change lines 320 from:

```ts
                    const Icon      = n.type === 'new_order' ? BiReceipt : n.type === 'new_customer' ? BiUser : BiPackage
```

to:

```ts
                    const Icon      = n.type === 'new_order'       ? BiReceipt
                                    : n.type === 'new_customer'     ? BiUser
                                    : n.type === 'contact_message'  ? BiEnvelope
                                    : n.type === 'pending_review'   ? BiStar
                                    : n.type === 'restock_signup'   ? BiRefresh
                                    : BiPackage
```

- [ ] **Step 3: Extend the `iconBg` and `iconColor` ternaries**

Change lines 321-330 from:

```ts
                    const iconBg    = severity === 'error'   ? 'bg-(--admin-red-bg)'
                                    : severity === 'warning' ? 'bg-(--admin-amber-bg)'
                                    : n.type === 'new_order' ? 'bg-(--admin-green-bg)'
                                    : n.type === 'new_customer' ? 'bg-(--admin-accent)/10'
                                    : 'bg-(--admin-amber-bg)'
                    const iconColor = severity === 'error'   ? 'text-(--admin-red)'
                                    : severity === 'warning' ? 'text-(--admin-amber)'
                                    : n.type === 'new_order' ? 'text-(--admin-green)'
                                    : n.type === 'new_customer' ? 'text-(--admin-accent)'
                                    : 'text-(--admin-amber)'
```

to:

```ts
                    const iconBg    = severity === 'error'      ? 'bg-(--admin-red-bg)'
                                    : severity === 'warning'     ? 'bg-(--admin-amber-bg)'
                                    : n.type === 'new_order'     ? 'bg-(--admin-green-bg)'
                                    : n.type === 'new_customer'  ? 'bg-(--admin-accent)/10'
                                    : n.type === 'pending_review' ? 'bg-(--admin-accent)/10'
                                    : n.type === 'restock_signup' ? 'bg-(--admin-accent)/10'
                                    : 'bg-(--admin-amber-bg)'
                    const iconColor = severity === 'error'      ? 'text-(--admin-red)'
                                    : severity === 'warning'     ? 'text-(--admin-amber)'
                                    : n.type === 'new_order'     ? 'text-(--admin-green)'
                                    : n.type === 'new_customer'  ? 'text-(--admin-accent)'
                                    : n.type === 'pending_review' ? 'text-(--admin-accent)'
                                    : n.type === 'restock_signup' ? 'text-(--admin-accent)'
                                    : 'text-(--admin-amber)'
```

(`contact_message` always has `severity: 'warning'` per Task 2, so it's already covered by the first branch — no explicit `n.type === 'contact_message'` case needed.)

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add components/admin/layout/AdminTopbar.tsx
git commit -m "feat: add icon and color mapping for new notification bell types"
```

---

### Task 4: Manual end-to-end verification

**Files:** none (manual test only, per spec's "Testing" section and existing precedent in `docs/superpowers/plans/2026-06-24-notifications-and-order-alert.md`)

- [ ] **Step 1: Seed test data via Supabase SQL editor**

```sql
insert into contact_messages (name, email, subject, message)
values ('Test Recap', 'test@example.com', 'Testing bell', 'Just verifying the notification bell picks this up.');

insert into reviews (product_handle, product_id, customer_email, customer_name, rating, title, body, status)
values ('test-product', 'gid://shopify/Product/0000000000', 'test2@example.com', 'Test Reviewer', 5, 'Great!', 'This is a twenty-character-plus test review body for verification.', 'pending');

insert into back_in_stock_requests (email, product_handle, product_title)
values ('waitlist1@example.com', 'test-product', 'Test Product'),
       ('waitlist2@example.com', 'test-product', 'Test Product');
```

- [ ] **Step 2: Load `/admin` and open the bell**

Confirm three new entries appear:
- `New message from Test Recap` with amber icon/background, `/admin/communications` link.
- `New review: 5★ on test-product` with accent-colored icon, `/admin/reviews` link.
- `2 waiting — Test Product` with accent-colored icon, `/admin/communications` link (single grouped entry, not two).

- [ ] **Step 3: Confirm read-state removes the contact message from the bell**

Open the Contact Inbox at `/admin/communications`, click into the "Test Recap" message (this hits the existing PATCH route `app/api/admin/communications/contacts/[id]/route.ts` with `{ markRead: true }`). Reload the admin bell (or wait for the 60s poll) — confirm the `contact_message` entry is gone without needing to click "Mark all read".

- [ ] **Step 4: Confirm the review and restock entries dismiss via localStorage**

Click "Mark all read" in the bell dropdown. Confirm the `pending_review` and `restock_signup` entries disappear and stay dismissed on reload (localStorage `acme-notif-dismissed`), consistent with existing `low_stock`/`new_order`/`new_customer` behavior.

- [ ] **Step 5: Clean up test data**

```sql
delete from contact_messages where email = 'test@example.com';
delete from reviews where customer_email = 'test2@example.com';
delete from back_in_stock_requests where email in ('waitlist1@example.com', 'waitlist2@example.com');
```

- [ ] **Step 6: Final full type check**

Run: `npx tsc --noEmit`
Expected: zero errors.

---

## Self-Review Notes

- **Spec coverage:** All three new notification types (`contact_message`, `pending_review`, `restock_signup`) implemented with exact copy, hrefs, severities, and read-state behavior from the spec. Grouping logic for `restock_signup` matches spec's `product_handle` grouping rationale. `PendingItems.tsx` untouched. No new `status`/read-state columns added. Bell UI shell (badge, dropdown, polling, "Mark all read") unchanged — only data source and icon/color mapping extended, matching spec's Architecture section point 3.
- **Placeholder scan:** No TBD/TODO — every step has complete, runnable code.
- **Type consistency:** `NotificationType` values added in Task 1 (`contact_message`, `pending_review`, `restock_signup`) are the exact strings used in Task 2's `type:` fields and Task 3's ternary comparisons. `AdminNotification` field names (`id`, `type`, `title`, `subtitle`, `href`, `timestamp`, `severity`) match the existing interface in `lib/admin/types.ts:166-175` — no new fields introduced.
