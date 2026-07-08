# Cart Activity Tracking — Design

**Date:** 2026-07-08
**Status:** Approved, pending implementation plan

## Problem

Shopify carts are anonymous by default and there's no native way to see, per customer, what
they've added to cart before checking out. The admin Customers pages currently show only
order history — there's no visibility into warm leads who registered but haven't purchased
(e.g. a customer with 0 orders who has items sitting in their cart).

## Scope

- Track cart-add activity **only for logged-in customers** (identity is required to attribute
  a cart to a customer; anonymous/guest carts are out of scope for this iteration).
- **Log + display only.** No automated email segmentation or "abandoned cart" campaign
  trigger in this iteration — the admin reviews cart activity manually and sends promos via
  the existing Promotional Email System.

## Data model

New Supabase table `cart_activity`:

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| customer_id | text | Shopify numeric customer id — matches `AdminCustomer.id` |
| customer_email | text | |
| product_id | text | Shopify product id |
| product_title | text | |
| variant_id | text | |
| quantity | int | |
| status | text | `active` \| `converted` |
| order_name | text null | set when converted |
| first_added_at | timestamptz | |
| last_added_at | timestamptz | |
| converted_at | timestamptz null | |

One row per (customer_id, product_id) pair — re-adding the same product **upserts**
(bumps quantity/last_added_at) rather than duplicating.

## Data flow

1. **Capture** — `crateStore.addItem` (store/crateStore.ts) already knows when a customer is
   logged in via `_customerToken`. `customerStore.hydrate()` is extended to also stash the
   customer's numeric Shopify id + email into `crateStore` (sourced from `profile`, fetched via
   `fetchProfile()`). When logged in, `addItem` fires a fire-and-forget
   `POST /api/cart-activity` with `{ customerId, email, productId, productTitle, variantId, quantity }`.
   Anonymous adds are skipped entirely — no call made.
   - This is purely additive: it does not touch the existing `cartCreate`/`cartLinesAdd` calls
     to Shopify's Storefront API, which remain the source of truth for the real cart/checkout.
     If the logging call fails, it's swallowed (console-logged only) — never blocks checkout.

2. **Removal** — `crateStore.removeItem` also fires a delete/deactivate call to
   `/api/cart-activity` (or `DELETE`) for that customer+product, so admin views only ever show
   what's genuinely still in the customer's cart.

3. **Conversion** — the existing `orders/paid` webhook handler
   (app/api/webhooks/shopify/route.ts) is extended: after handling the existing admin-alert
   email, it looks up `cart_activity` rows matching `customer_id` (from `o.customer.id`) +
   `product_id`/`variant_id` (from `o.line_items`) and flips matching rows to
   `status: 'converted'`, storing `order_name` and `converted_at`. Failure to match is a
   silent no-op, consistent with the handler's existing catch-and-log pattern (always returns
   200 to Shopify).

4. **Read** — `getAdminCustomers()` (lib/admin/shopifyAdmin.ts) does one batch Supabase query
   for all `status: 'active'` rows, grouped by `customer_id`, and attaches them to each
   `AdminCustomer` as a new optional field:
   ```ts
   cartActivity?: { productTitle: string; quantity: number }[]
   ```
   `/api/admin/customers/[id]` does the same, scoped to one customer, plus also returns the
   `converted` history rows for that customer only (detail page shows both).

## UI

**Customers table** (app/admin/customers/page.tsx): new "In Cart" column between Orders and
Total Spent. Shows the first active product's title, `+N more` if multiple, `—` if none.
Truncates with a `title` tooltip on hover, matching existing truncation patterns in this table.

**Customer detail page** (app/admin/customers/[id]/page.tsx): new "Cart Activity" `SectionCard`
below/near Order History — lists active items (title, quantity, date added) first, with a
collapsed "Converted" history section below (title, quantity, order name, date), mirroring the
existing Order History table's visual style.

## Error handling

- Cart-activity capture/removal calls are fire-and-forget from the client; failures are
  console-logged only and never block cart mutation or checkout.
- Webhook conversion matching failures are silent no-ops (existing handler behavior).
- No new auth surface: both admin read paths already sit behind `requireAuth()` via
  `getIronSession`/`sessionOptions`, same as today.

## Testing plan (manual)

1. Log in as a real/test customer, add 2 different products to cart → confirm rows appear in
   Supabase and on both admin surfaces within a few seconds.
2. Remove one item from cart → confirm its row disappears from both admin surfaces.
3. Complete a real/test order for a remaining cart item → confirm the webhook flips it to
   `converted` and it moves from "active" into history on the detail page.
4. Add to cart as a guest (not logged in) → confirm nothing is tracked.

## Out of scope (this iteration)

- Anonymous/guest cart tracking.
- Automated abandoned-cart email segment/trigger in the Promotional Email System.
- Any UI badge/indicator beyond the "In Cart" table column and detail-page section.
