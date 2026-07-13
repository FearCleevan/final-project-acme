# Marketing Page — Manual Subscribers & Recipient Targeting — Design Spec

**Status:** Approved
**Owner:** Peter (dev), for Acme Vintage Supply admin dashboard

## Problem

The Marketing page's Subscribers tab (`app/admin/marketing/page.tsx`) is read-only — subscribers can only be added by a customer signing up via the storefront newsletter form, and can only be removed by that customer clicking their own unsubscribe link. There is no admin control to manually add a subscriber (e.g. a registered Shopify customer like Kokila Jeffery or Allan Jeffery, seen in the Admin Customers page, who hasn't separately opted into the newsletter) or to manually pause/reactivate one.

Separately, the Campaigns tab's send flow (`app/api/admin/marketing/campaigns/[id]/send/route.ts`) always sends to every active subscriber — there is no way to target a specific subset for a given campaign.

## Goal

Add three admin capabilities to the existing Marketing page: manually adding a subscriber (either by picking an existing Shopify customer or typing any email), manually toggling a subscriber active/inactive, and choosing a specific subset of subscribers to target for a given campaign send (persisted per-campaign, not just a one-off form choice).

## Scope Decisions (from brainstorming)

- **Add Subscriber** supports two modes in one flow: picking from existing Shopify customers (search reusing the existing `/api/admin/search` endpoint) or typing any email manually. Not one or the other — both, in a single "Add Subscriber" entry point.
- **Toggling active/inactive reuses the existing `unsubscribed_at` field** — no new column for this. Setting it to now() = inactive, clearing it to `null` = active. This is deliberately the same semantics as a customer-initiated unsubscribe (not a separately-tracked "admin paused this" state) — simplest option, no schema change, and every existing `unsubscribed_at IS NULL` check across the codebase (including the send route) already respects it correctly with zero additional logic.
- **Recipient targeting lives in the Campaigns compose panel**, not the Subscribers tab — a radio choice between "All active subscribers" (today's default, unchanged behavior) and "Specific subscribers" (reveals a searchable checklist). This choice is **persisted on the campaign record** (a new nullable column), not just held in the compose form's local state, so both the immediate "Send Now" path and the existing "Save Draft → Send later" path (via the campaign list's per-draft Send button) respect the same targeting decision.

## Current State (reference)

- `docs/supabase/migrations/007_newsletter.sql` — `newsletter_subscribers(id uuid, email text unique not null, subscribed_at timestamptz, unsubscribed_at timestamptz nullable)`. `email_campaigns(id, subject, body, cta_label, cta_url, status, scheduled_for, sent_at, recipient_count, created_at, template, template_data)`.
- `app/api/admin/marketing/subscribers/route.ts` — currently `GET` only (list + CSV export). No `POST`/`PATCH`.
- `app/api/admin/marketing/campaigns/route.ts` — `POST` creates a campaign (draft), used by both "Save Draft" and "Send Now" (which creates then immediately calls send) in the page.
- `app/api/admin/marketing/campaigns/[id]/send/route.ts` — queries `newsletter_subscribers where unsubscribed_at is null`, calls `sendNewsletter()` from `lib/email.ts` with that full list, updates campaign `status`/`sent_at`/`recipient_count`.
- `app/api/cron/newsletter/route.ts` — the scheduled-send cron path; finds one due draft campaign (`scheduled_for <= now()`), fetches all active subscribers, sends. Must respect the same `recipient_emails` field for consistency (a scheduled campaign targeting specific subscribers should not silently blast everyone when the cron fires it).
- `app/admin/marketing/page.tsx` (~1046 lines) — `Tab = 'subscribers' | 'campaigns' | 'templates'`. Subscribers tab is a static table (email, subscribed date, status badge). Campaigns tab has a full compose panel (template picker, subject/body/CTA fields, optional `scheduled_for` datetime, Send Now / Save Draft / Preview buttons) and a campaign list with a per-draft "Send" button (`handleSendExisting`).
- `/api/admin/search?q=...` — existing route, returns `{ products, orders, customers }` filtered server-side, already used elsewhere in the admin (global search, Contact Reply composer's product picker) — reused here for the customer picker, filtering to `.customers`.
- `AdminCustomer` (`lib/admin/types.ts`) has `name` and `email` fields, sufficient for the picker's display.

## Non-Goals

- No distinct "admin-deactivated" state separate from `unsubscribed_at` — explicitly rejected in favor of reusing the existing field.
- No automatic sync/relationship between Shopify customers and `newsletter_subscribers` — a customer must still be explicitly added as a subscriber one at a time (or via the existing storefront signup); this feature does not bulk-import all Shopify customers as subscribers.
- No recipient selection UI on the Subscribers tab itself — targeting lives entirely in the Campaigns compose panel, per the confirmed scope decision.
- No changes to the public-facing signup (`app/api/newsletter/route.ts`) or unsubscribe (`app/api/newsletter/unsubscribe/route.ts`) routes — those customer-facing flows are untouched.

## Architecture / Data Flow

1. **New migration** `docs/supabase/migrations/013_campaign_recipients.sql`: `ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS recipient_emails jsonb;` (nullable; `null` = all active subscribers).
2. **`app/api/admin/marketing/subscribers/route.ts`** gains:
   - `POST` — body `{ email: string }`. Validates basic email shape server-side, inserts into `newsletter_subscribers` with `subscribed_at: now()`. On a unique-constraint violation (already exists), returns a 409 with a clear "Already a subscriber" message rather than a generic 500.
   - `PATCH` — body `{ email: string, active: boolean }`. Sets `unsubscribed_at` to `now()` when `active: false`, or `null` when `active: true`, matched `.eq('email', email)`.
3. **`app/api/admin/marketing/campaigns/route.ts`**'s existing `POST` gains an optional `recipient_emails: string[] | null` field in its request body, stored as-is on the new column.
4. **`app/api/admin/marketing/campaigns/[id]/send/route.ts`**: after loading the campaign row, branch on `campaign.recipient_emails`:
   - `null` → existing behavior unchanged (query all `unsubscribed_at IS NULL`).
   - array → query `newsletter_subscribers where email in (...) and unsubscribed_at is null` (re-checking active status at send time, so a since-unsubscribed recipient in an old saved list is never emailed).
5. **`app/api/cron/newsletter/route.ts`**: apply the identical branch (null vs. array) when it loads a due scheduled campaign, for the same reason — a scheduled campaign with specific recipients must still honor that targeting when the cron fires it, not silently fall back to "all."
6. **Admin UI — Subscribers tab** (`app/admin/marketing/page.tsx`):
   - New "Add Subscriber" button opens a modal with a toggle between "Pick from customers" (search input debounced against `/api/admin/search?q=...`, rendering matched customers by name + email, click to submit as that email) and "Enter email manually" (a plain email `<input>` + submit). Both paths call the new `POST /api/admin/marketing/subscribers`.
   - Each row in the existing subscriber table gets an inline Active/Inactive toggle button next to the status badge, calling `PATCH`, with an optimistic UI update (flip the badge immediately, roll back on a failed response).
7. **Admin UI — Campaigns compose panel**: a new "Recipients" section (placed between the CTA fields and the existing "Schedule for" field) with a radio choice: "All active subscribers (N)" (default) / "Specific subscribers". Selecting the latter reveals a searchable checklist built from the subscriber list already fetched by the page (client-side filter on the existing `subscribers` state — no new fetch), with checkboxes. The selected set is serialized into `recipient_emails` on both the "Save Draft" and "Send Now" request payloads. If "Specific" is selected with zero checked, both actions are blocked with a validation message, following the same pattern as the existing per-template validation already in `handleSaveDraft`/`handleSendNow`.
8. **Campaign list display**: each campaign row's subtitle line gains an indicator when `recipient_emails` is set, e.g. "Draft · 3 recipients selected" instead of the generic "Draft · {date}", so it's clear at a glance which drafts have specific targeting versus the default "everyone."

## Error Handling

- Add Subscriber: duplicate email → 409 with "Already a subscriber" (not a crash); invalid email format → 400, surfaced as a toast, consistent with existing validation-toast patterns in this file.
- Toggle Active/Inactive: failed PATCH → toast error, UI rolls back to its prior state (optimistic-update-with-rollback, not a full page reload).
- Send with specific recipients: if every previously-selected recipient has since unsubscribed (list becomes empty at send time), the send route returns `{ ok: true, sent: 0 }` rather than erroring — consistent with the existing "no active subscribers" no-op path already in both the send route and the cron route.

## Testing

Manual, consistent with this codebase's existing precedent (no automated UI test suite):
- Add a subscriber via the customer picker (search "Kokila", select, confirm added), and via manual entry (type a test email) — confirm both appear in the table as Active.
- Toggle a subscriber to Inactive — confirm the badge updates immediately, and that a subsequent "All active subscribers" send excludes them (recipient count is one lower than before).
- Toggle that same subscriber back to Active — confirm they're included again.
- Create a campaign, choose "Specific subscribers," select exactly one, Send Now — confirm only that one address receives the email (check a real inbox), and the campaign list shows "1 recipient selected" style copy.
- Save a draft with "Specific subscribers" selected, unsubscribe one of the selected people (via the customer-facing unsubscribe link), then send the draft from the campaign list — confirm that unsubscribed person is excluded even though they were in the originally-saved list.
- Confirm a campaign left on "All active subscribers" continues to behave exactly as it does today (regression check).
- `npx tsc --noEmit` — zero errors.
