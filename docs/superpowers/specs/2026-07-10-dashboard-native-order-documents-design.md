# Dashboard-Native Packing Slip, Pick List & Invoice — Design Spec

**Status:** Approved
**Owner:** Peter (dev), for Acme Vintage Supply admin dashboard

## Problem

Scott currently has to leave the custom Acme Admin Dashboard and go into Shopify Admin to print a Packing Slip or Pick List, because those two documents only exist as Shopify's native templates (`Settings → Shipping and delivery → Templates`). This breaks the goal of the admin dashboard being Scott's single place to run the whole order lifecycle — add products, confirm orders, track orders, print fulfillment documents, handle notifications and customer support — without ever touching Shopify Admin directly.

The dashboard's Order Detail page (`app/admin/orders/[id]/page.tsx`) already prints two documents today: a **Shipping Label** (Acme-specific crate label, not a Shopify template) and an **Invoice** (dashboard's own Georgia-serif design). Neither matches the Packing Slip design Scott just approved and hand-corrected in Shopify (fixing a `{{ shop.domain }}` bug that rendered `acmevintagesupply.myshopify.com` instead of `acmevintagesupply.com` in the footer).

## Goal

Add **Packing Slip** and **Pick List** as two new printable documents on the Order Detail page, and restyle the existing **Invoice** to visually match the Packing Slip, so all Shopify-equivalent documents look consistent and Scott never needs Shopify Admin for fulfillment printing again. Shipping Label stays untouched — it isn't a Shopify template and already serves its purpose.

## Scope Decisions (from brainstorming)

- **Build all three in one pass** — Packing Slip, Pick List, and the Invoice restyle — since they share the same `printMode` mechanism already in the codebase; building them together avoids repeating setup three times.
- **Visual style: match Shopify's Packing Slip exactly** (Arial/sans-serif, uppercase store-name header, thick horizontal rules, item table with thumbnails, centered footer) rather than the dashboard's current Georgia-serif house style. The existing Invoice is restyled to match, not left as-is.
- **Pick List is a new, standalone design** (no Shopify source was pulled for it) — order #, one row per line item with a checkbox box, thumbnail, title, SKU, quantity. No customer address, no pricing anywhere — pick lists are a warehouse-picking document, not a customer-facing one.
- **Address layout: single combined "SHIP TO / BILL TO" block**, not two separate columns — the dashboard's `AdminOrder` type (`lib/admin/types.ts`) only stores one `customer` address, no separate billing address, so duplicating it into two visual columns would be pointless. This matches the existing Invoice's current convention.
- **Shipping Label and existing Invoice button placement**: Shipping Label is kept exactly as-is (unrelated to this change). Invoice is restyled in place (same button, new look) rather than adding a second "new" Invoice button.
- **Per-order only, no bulk printing** — all four documents live only on `/admin/orders/[id]`. No changes to the Orders list page, no multi-select, no batch-print API. Bulk printing is an explicit future request if Scott needs it once he's using this daily.
- **No PDF library, no new API calls** — same `window.print()` + `@media print` approach already used for Shipping Label/Invoice. All four documents read from the same `order: AdminOrder` object already fetched by the page on load (`GET /api/admin/orders/[id]`) — `AdminOrderItem` already has `sku`, `image`, `title`, `variantTitle`, `quantity`, and `AdminOrder` already has everything the Packing Slip and Invoice need (`customer`, `date`, `items`, `subtotal`, `shipping`, `tax`, `total`, `paymentStatus`).
- **Footer domain is a hardcoded literal string** (`acmevintagesupply.com`), never a live domain lookup — this is a deliberate choice to avoid ever re-introducing the exact `{{ shop.domain }}` → `.myshopify.com` bug that was just fixed in Shopify's own template.

## Current State (reference)

`app/admin/orders/[id]/page.tsx`:
- `printMode` state: currently `'invoice' | 'label' | null` (line 25).
- `triggerPrint(mode)` (line 79): sets `printMode`, waits 150ms, calls `window.print()`, resets `printMode` to `null` after 500ms.
- Header actions (lines 92-113): two buttons — "Shipping Label" (`triggerPrint('label')`), "Invoice" (`triggerPrint('invoice')`), then "Back".
- Print layouts (lines 295-450+): two `<div className="hidden print:block fixed inset-0 bg-white p-10 z-9999">` blocks, one per `printMode` value, using inline `style` objects (not Tailwind classes) since these are print-only layouts.
- `AdminOrderItem` (`lib/admin/types.ts`): `{ id, productId, title, variantTitle?, sku, quantity, unitPrice, image }`.
- `AdminOrder` (`lib/admin/types.ts`): `{ id, customer: { name, email, phone, address, city, province, country }, date, items, subtotal, shipping, tax, total, paymentStatus, fulfillmentStatus, notes, trackingRef, ... }`.

The approved Shopify Packing Slip source (already hand-fixed in Shopify Admin, footer now reads `acmevintagesupply.com`):

```html
<div class="wrapper">
  <div class="header">
    <div class="shop-title"><p class="to-uppercase">{{ shop.name }}</p></div>
    <div class="order-title">
      <p class="text-align-right">Order {{ order.name }}</p>
      <p class="text-align-right">{{ order.created_at | date: format: "date" }}</p>
    </div>
  </div>
  <div class="customer-addresses">
    <!-- single shipping-address block only, per this project's data model -->
  </div>
  <hr>
  <div class="order-container">
    <!-- header row: ITEMS / QUANTITY -->
    <!-- one .flex-line-item row per item: thumbnail, title, variant, sku, quantity as "N of M" -->
  </div>
  <hr>
  <div class="footer">
    <p>Thank you for shopping with us!</p>
    <p><strong>{{ shop.name }}</strong><br>{{ shop_address.summary }}<br>{{ shop.email }}<br>acmevintagesupply.com</p>
  </div>
</div>
```

Key style values from this source to carry over: `font-family: "Noto Sans", sans-serif` (the plan will use the existing codebase's closest available sans stack, since "Noto Sans" isn't already loaded — see Non-Goals), uppercase store-name header at `1.9em`, thick `2px` black `<hr>` rules, `58px` square item thumbnails, centered footer with `1.5` line-height.

## New Document Designs

### 1. Packing Slip

- **Trigger:** New button "Packing Slip" → `triggerPrint('packing-slip')`.
- **Layout:** Uppercase store name header (left) + "Order {id}" and formatted date (right, matching the existing `order.date`/`formatDate` already used elsewhere on this page). Single "SHIP TO / BILL TO" address block using `order.customer`. Thick horizontal rule. Items table: 56px thumbnail (reusing the same `<Image>` pattern already used in the Line Items section on this page, lines 125-147), title, variant (if not "Default Title"), SKU, quantity shown as plain count (no "N of M" fractional shipment logic — the dashboard doesn't model partial shipments the way Shopify's `line_items_in_shipment` does, so just show `order.items[i].quantity`). Thick horizontal rule. Footer: "Thank you for shopping with us!", store name, address (`25 Raddall Ave, Dartmouth NS B3B 1L4, Canada` — same literal string already used in the existing Shipping Label print block), email (`acmesign01@gmail.com`, matching what's already in the existing Invoice print block), and the hardcoded `acmevintagesupply.com`.

### 2. Pick List

- **Trigger:** New button "Pick List" → `triggerPrint('pick-list')`.
- **Layout:** Header: "PICK LIST" + "Order {id}". No customer address section at all. One row per `order.items[i]`: an empty checkbox-style square box (pure CSS border box, no interactivity — this is a printed paper document), 56px thumbnail, title + variant, SKU, quantity. No pricing, no totals, no footer beyond a simple item count line ("N items").

### 3. Invoice (restyled)

- **Trigger:** Same existing "Invoice" button, same `triggerPrint('invoice')` — no new button.
- **Layout:** Content stays the same as today (line items with pricing, SKU, subtotal/shipping/tax/total, payment status) but the visual treatment changes from `fontFamily: 'Georgia, serif'` to the same sans-serif treatment as Packing Slip/Pick List, and the header/footer restructured to match the Packing Slip's uppercase-store-name-left / order-info-right pattern instead of its current side-by-side header. The existing `hello@acmevintagesupply.ca` email reference in the current Invoice block (line 370) is corrected to `acmesign01@gmail.com` for consistency with the Packing Slip and Shipping Label footers, which already use that address.

## Non-Goals

- No PDF generation library — `window.print()` only, consistent with the rest of this codebase.
- No new API routes or data fetching — everything renders from the `order` object the page already has.
- No bulk/multi-order printing from the Orders list page — explicitly out of scope, deferred to a future request.
- No separate Ship To / Bill To columns — single combined block only, per the data-model constraint.
- Not pulling in the actual "Noto Sans" font — this dashboard doesn't currently load Noto Sans anywhere; the plan will specify the closest already-available sans-serif stack (e.g., the system font stack or whatever Tailwind's default sans is in this project) rather than adding a new font dependency for a print-only view.
- Not touching the Shipping Label design — unrelated to this change, stays exactly as-is.
- Not modifying `lib/admin/types.ts` or any Shopify-fetching code — no new fields needed on `AdminOrder`/`AdminOrderItem`.

## Architecture / Data Flow

1. `printMode` type widens from `'invoice' | 'label' | null` to `'invoice' | 'label' | 'packing-slip' | 'pick-list' | null`.
2. Two new buttons added to the header actions block (lines 92-113), between the existing "Shipping Label" and "Invoice" buttons, each calling `triggerPrint('packing-slip')` / `triggerPrint('pick-list')` respectively. `triggerPrint()`'s parameter type is currently `(mode: 'invoice' | 'label')` and widens to match the new `printMode` type.
3. Two new `{printMode === 'packing-slip' && (...)}` / `{printMode === 'pick-list' && (...)}` blocks added alongside the existing two, following the identical `hidden print:block fixed inset-0 bg-white p-10 z-9999` wrapper convention.
4. The existing `{printMode === 'invoice' && (...)}` block's inline styles are edited in place (font-family, header/footer layout, email address) — no structural replacement of its data logic (item mapping, totals calculation stay the same).

## Error Handling

None needed beyond what already exists — if `order` is `null`/`undefined` the page already shows a loading/not-found state before any print buttons render, per the existing guard clauses at lines 38-61.

## Testing

Manual verification only, consistent with this codebase's existing precedent for print features (no automated visual regression tooling here):
- Click each of the four buttons in turn on a real order with multiple line items (some with variants, some without) and confirm the browser print preview shows the correct layout for each.
- Confirm the Packing Slip and restyled Invoice visually match the Arial/sans, uppercase-header, thick-rule treatment from the Shopify source.
- Confirm the Pick List shows no pricing and no customer address anywhere.
- Confirm the footer domain on Packing Slip reads `acmevintagesupply.com` literally (not a Liquid-style lookup — there is none in this codebase, but confirm the literal string is correct).
- Confirm Shipping Label is visually unchanged.
- `npx tsc --noEmit` — zero errors.
