# Notification Bell — Supabase Sources — Design Spec

**Status:** Approved
**Owner:** Peter (dev), for Acme Vintage Supply admin dashboard

## Problem

The admin notification bell (`components/admin/layout/AdminTopbar.tsx`, backed by `getAdminNotifications()` in `lib/admin/shopifyAdmin.ts`) only surfaces events from Shopify: new orders (last 48h), low stock (≤3 units), and new customers (last 7 days). It has no awareness of the Supabase-backed Communications Hub, so events like a new Contact Inbox message (e.g. Allan Jeffery's inquiry) never trigger a bell notification, even though they need timely admin attention. This is not a bug — the bell system was simply never wired to Supabase.

Separately, a `PendingItems.tsx` widget on the Overview page already independently queries Supabase for unread contact message and pending review counts. That data-fetching pattern already exists in the codebase; this design reuses it but does not touch `PendingItems.tsx` (left as-is — out of scope, harmless overlap).

## Goal

Extend `getAdminNotifications()` to also surface three Supabase-backed event types, using the exact same "isolated try/catch block per source, merge + sort by timestamp" pattern already used for the three existing Shopify sources.

## New Notification Types

Add to the `NotificationType` union in `lib/admin/types.ts`:

```ts
export type NotificationType =
  | 'new_order' | 'low_stock' | 'new_customer'
  | 'contact_message' | 'pending_review' | 'restock_signup'
```

### 1. `contact_message`

- **Source table:** `contact_messages`
- **Query:** `select id, name, email, subject, created_at from contact_messages where read_at is null order by created_at desc limit 5`
- **Title:** `New message from ${name}`
- **Subtitle:** `${subject} · ${email}`
- **href:** `/admin/communications` (lands on Contact Inbox, the default tab)
- **Severity:** `warning` (amber) — a customer is waiting on a reply; this deserves more visual weight than a routine info-level event.
- **Read-state:** No client dismiss needed. The existing PATCH route `app/api/admin/communications/contacts/[id]/route.ts` (`{ markRead: true }`) already sets `read_at` when a message is opened in the Contact Inbox. Because the notification query filters `read_at IS NULL`, a message read in the inbox naturally disappears from the bell on the next poll (bell already polls every 60s). No new "mark as read" code required.

### 2. `pending_review`

- **Source table:** `reviews`
- **Query:** `select id, product_handle, customer_name, rating, created_at from reviews where status = 'pending' order by created_at desc limit 5`
- **Title:** `New review: ${rating}★ on ${product_handle}`
- **subtitle:** `by ${customer_name}`
- **href:** `/admin/reviews`
- **Severity:** `info` — not time-sensitive, just needs eventual moderation.
- **Read-state:** localStorage dismiss (same as low_stock/new_order/new_customer today) — reviews don't have a per-item server read-state column, and adding one is out of scope.

### 3. `restock_signup`

- **Source table:** `back_in_stock_requests`
- **Query:** `select product_handle, product_title, count(*) from back_in_stock_requests where notified_at is null group by product_handle, product_title order by count(*) desc limit 5`
- **Grouping rationale:** Each row in `back_in_stock_requests` is one customer's signup. Showing one bell entry per signup (as the other 5 sources do 1:1) would flood the panel if many customers ask about the same product. Instead, group by `product_handle` and show one entry per product with a count.
- **Title:** `${count} waiting — ${product_title}`
- **subtitle:** `Restock waitlist`
- **id:** `restock-${product_handle}` (stable across polls, since it's derived from the grouped product, not a row id)
- **href:** `/admin/communications` (Restock Waitlist tab)
- **Severity:** `info`
- **Read-state:** localStorage dismiss.

## Non-Goals

- Not touching `PendingItems.tsx` on the Overview page — left as-is per explicit decision, some redundancy with the bell is acceptable.
- Not adding a `status`/read-state column to `reviews` or `back_in_stock_requests` — out of scope; localStorage dismiss is sufficient for these lower-urgency, non-1:1-actionable types.
- Not changing the bell's UI shell (badge, dropdown, "Mark all read", 60s polling) — only the data feeding it.

## Architecture / Data Flow

1. `getAdminNotifications()` (`lib/admin/shopifyAdmin.ts`) gains three new isolated blocks, each:
   - Defines its own lazy `getSupabase()` client (matching this codebase's established Supabase-client convention — never module-level `createClient()`, see `feedback-supabase-lazy-client` project convention).
   - Wraps its query in try/catch so a Supabase outage doesn't take down the other 5 sources.
   - Pushes `AdminNotification` objects into the same `notifications[]` array already used by the Shopify sources.
2. Final `notifications.sort()` by timestamp (already exists) naturally interleaves Supabase and Shopify events newest-first — no separate merge logic needed.
3. `AdminTopbar.tsx` needs new icon + color mappings for the three new `type` values in the existing severity/icon switch logic (currently keys off `n.type === 'new_order' | 'new_customer'` plus `n.severity`). No structural changes to the component — just extending the existing conditional chains.

## Error Handling

Same as existing sources: each new block is independently try/caught. If Supabase is unreachable, that block contributes zero notifications and the other five sources (Shopify + Supabase) continue working. No user-facing error surfaces in the bell — consistent with current behavior for Shopify sources.

## Testing

- Manual verification (per existing plan precedent in `docs/superpowers/plans/2026-06-24-notifications-and-order-alert.md`): seed an unread contact message, a pending review, and a restock signup; confirm all three appear in the bell with correct copy, icon, severity color, and href.
- Confirm reading a message in Contact Inbox removes its bell entry on next poll/refresh without needing to click "Mark all read."
- Confirm two restock signups for the same product collapse into one grouped bell entry with count = 2.
- `npx tsc --noEmit` — zero errors.
