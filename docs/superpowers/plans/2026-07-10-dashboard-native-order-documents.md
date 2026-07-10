# Dashboard-Native Packing Slip, Pick List & Invoice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Packing Slip" and "Pick List" as two new printable documents on the Admin Dashboard's Order Detail page, and restyle the existing "Invoice" print layout so all three visually match the Shopify Packing Slip design Scott just approved and hand-fixed — so Scott never needs Shopify Admin for fulfillment document printing again.

**Architecture:** Extend the existing `printMode` state + `triggerPrint()` + `window.print()` pattern already used for the Shipping Label and Invoice prints in `app/admin/orders/[id]/page.tsx`. No new libraries, no PDF generation, no new API routes — every new document renders from the `order: AdminOrder` object the page already fetches on load.

**Tech Stack:** Next.js App Router, React, TypeScript, inline styles for print-only layouts (matching this file's existing convention for its print blocks).

## Global Constraints

- No PDF generation library — `window.print()` + `@media print` (via the `hidden print:block` Tailwind classes already used) only.
- No new API routes or data fetching — all four documents (Shipping Label, Packing Slip, Pick List, Invoice) read from the same `order` object already fetched by `GET /api/admin/orders/[id]`.
- Footer domain on the Packing Slip is the hardcoded literal string `acmevintagesupply.com` — never a live domain/config lookup. This is deliberate: it avoids ever reintroducing the exact bug Scott just fixed in Shopify (`{{ shop.domain }}` rendering as `acmevintagesupply.myshopify.com`).
- Single combined "SHIP TO / BILL TO" address block — no separate two-column Ship To / Bill To layout. `AdminOrder.customer` (`lib/admin/types.ts`) has only one address, no separate billing address.
- Pick List shows no pricing and no customer address anywhere — it's a warehouse-picking document only (order #, item image, title, variant, SKU, quantity).
- Do not add a new font dependency (e.g. "Noto Sans") — use this project's existing sans stack, defined in `app/globals.css:33` as `"Inter", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif`.
- Shipping Label print layout is untouched — it isn't a Shopify template and stays exactly as it is today.
- `npx tsc --noEmit` must report zero errors at the end.

---

## File Structure

- **Modify only:** `app/admin/orders/[id]/page.tsx` — every change in this plan lives in this one file, matching its existing convention of keeping all print layouts inline rather than extracted into separate components (the current Shipping Label/Invoice blocks aren't split out either, so a new split now would be inconsistent with the rest of the file).

Current relevant state in this file (line numbers as of this plan's writing):
- Line 25: `const [printMode, setPrintMode] = useState<'invoice' | 'label' | null>(null)`
- Line 79: `function triggerPrint(mode: 'invoice' | 'label') { ... }`
- Lines 92-113: header action buttons ("Shipping Label", "Invoice", "Back")
- Lines 295-361: Shipping Label print block (`printMode === 'label'`) — untouched by this plan
- Lines 363-447: Invoice print block (`printMode === 'invoice'`) — restyled by Task 4

---

### Task 1: Widen `printMode` type and `triggerPrint` signature

**Files:**
- Modify: `app/admin/orders/[id]/page.tsx:25` (state declaration)
- Modify: `app/admin/orders/[id]/page.tsx:79` (function signature)

**Interfaces:**
- Produces: `printMode` can now be `'invoice' | 'label' | 'packing-slip' | 'pick-list' | null`, consumed by Task 2 and Task 3's new print blocks and by the two new buttons added in those tasks.

- [ ] **Step 1: Widen the state type**

Change line 25 from:

```tsx
  const [printMode,     setPrintMode]     = useState<'invoice' | 'label' | null>(null)
```

to:

```tsx
  const [printMode,     setPrintMode]     = useState<'invoice' | 'label' | 'packing-slip' | 'pick-list' | null>(null)
```

- [ ] **Step 2: Widen the `triggerPrint` parameter type**

Change line 79 from:

```tsx
  function triggerPrint(mode: 'invoice' | 'label') {
```

to:

```tsx
  function triggerPrint(mode: 'invoice' | 'label' | 'packing-slip' | 'pick-list') {
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors. (No JSX yet references the new `printMode` values, so this is purely a type-widening change with no behavior difference until Tasks 2-3 add the buttons/blocks.)

- [ ] **Step 4: Commit**

```bash
git add "app/admin/orders/[id]/page.tsx"
git commit -m "feat: widen printMode to support packing-slip and pick-list"
```

---

### Task 2: Add Packing Slip button and print layout

**Files:**
- Modify: `app/admin/orders/[id]/page.tsx:92-113` (add button)
- Modify: `app/admin/orders/[id]/page.tsx` (add new print block; insert immediately before the existing `{printMode === 'invoice' && (...)}` block, i.e. right after the Shipping Label block closes at line 361)

**Interfaces:**
- Consumes: `printMode` type from Task 1 (now includes `'packing-slip'`), `order: AdminOrder` (already in scope in this component), `formatDate` (already imported at line 6), `Image` (already imported at line 15 from `next/image`).
- Produces: no new exports — purely additive JSX inside the existing component.

- [ ] **Step 1: Add the "Packing Slip" button**

In the header actions block, change:

```tsx
            <button
              onClick={() => triggerPrint('label')}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
            >
              <BiPrinter size={14} /> Shipping Label
            </button>
            <button
              onClick={() => triggerPrint('invoice')}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
            >
              <BiPrinter size={14} /> Invoice
            </button>
```

to:

```tsx
            <button
              onClick={() => triggerPrint('label')}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
            >
              <BiPrinter size={14} /> Shipping Label
            </button>
            <button
              onClick={() => triggerPrint('packing-slip')}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
            >
              <BiPrinter size={14} /> Packing Slip
            </button>
            <button
              onClick={() => triggerPrint('pick-list')}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
            >
              <BiPrinter size={14} /> Pick List
            </button>
            <button
              onClick={() => triggerPrint('invoice')}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
            >
              <BiPrinter size={14} /> Invoice
            </button>
```

(This adds both new buttons now; Task 3 does not need to touch this block again.)

- [ ] **Step 2: Add the Packing Slip print block**

Immediately after the Shipping Label block's closing `)}` (after line 361, before the line `{printMode === 'invoice' && (`), insert:

```tsx
      {printMode === 'packing-slip' && (
        <div className="hidden print:block fixed inset-0 bg-white p-10 z-9999" style={{ fontFamily: '"Inter", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: 15 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
            <div style={{ fontSize: 28, textTransform: 'uppercase' }}>Acme Vintage Supply</div>
            <div style={{ textAlign: 'right', fontSize: 14, lineHeight: 1.5 }}>
              Order {order.id}<br />
              {formatDate(order.date)}
            </div>
          </div>

          {/* Ship To / Bill To */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>SHIP TO / BILL TO</div>
            <div style={{ lineHeight: 1.5 }}>
              <div>{order.customer.name}</div>
              {order.customer.address && <div>{order.customer.address}</div>}
              <div>{[order.customer.city, order.customer.province].filter(Boolean).join(', ')}</div>
              <div>{order.customer.country}</div>
            </div>
          </div>

          <hr style={{ height: 2, border: 'none', backgroundColor: '#000', margin: '0 0 16px' }} />

          {/* Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th colSpan={2} style={{ textAlign: 'left', fontSize: 12, fontWeight: 700, paddingBottom: 12 }}>ITEMS</th>
                <th style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, paddingBottom: 12 }}>QUANTITY</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={item.id}>
                  <td style={{ width: 56, padding: '10px 0' }}>
                    <div style={{ width: 56, height: 56, background: '#f2f2f2', border: '1px solid #e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                      {item.image && <Image src={item.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                  </td>
                  <td style={{ paddingLeft: 16 }}>
                    <div>{item.title}</div>
                    {item.variantTitle && item.variantTitle !== 'Default Title' && (
                      <div style={{ color: '#555' }}>{item.variantTitle}</div>
                    )}
                    {item.sku && <div style={{ fontSize: 12, color: '#888' }}>SKU: {item.sku}</div>}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr style={{ height: 2, border: 'none', backgroundColor: '#000', margin: '18px 0 0' }} />

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 44, lineHeight: 1.9 }}>
            <div>Thank you for shopping with us!</div>
            <div>&nbsp;</div>
            <div>Acme Vintage Supply</div>
            <div>25 Raddall Ave, Dartmouth NS B3B 1L4, Canada</div>
            <div>acmesign01@gmail.com</div>
            <div>acmevintagesupply.com</div>
          </div>
        </div>
      )}

```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Manual check**

Run the dev server (`npm run dev`), open any order's detail page at `/admin/orders/[id]`, click **Packing Slip**, and confirm the browser print preview shows: uppercase store name (left) + order # and date (right), single "SHIP TO / BILL TO" block, thick black rule, an items table with 56px thumbnails/title/variant/SKU/quantity, another thick black rule, and a centered footer ending in `acmevintagesupply.com`.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/orders/[id]/page.tsx"
git commit -m "feat: add Packing Slip print layout to Order Detail page"
```

---

### Task 3: Add Pick List button and print layout

**Files:**
- Modify: `app/admin/orders/[id]/page.tsx` (button already added in Task 2, Step 1 — this task only adds the print block)

**Interfaces:**
- Consumes: `printMode` type from Task 1 (now includes `'pick-list'`), `order: AdminOrder`, `Image` (already imported).
- Produces: no new exports — purely additive JSX.

- [ ] **Step 1: Add the Pick List print block**

Immediately after the Packing Slip block's closing `)}` from Task 2 (and before `{printMode === 'invoice' && (`), insert:

```tsx
      {printMode === 'pick-list' && (
        <div className="hidden print:block fixed inset-0 bg-white p-10 z-9999" style={{ fontFamily: '"Inter", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: 15 }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 24, fontWeight: 700, textTransform: 'uppercase' }}>Pick List</div>
            <div style={{ color: '#555', marginTop: 4 }}>Order {order.id}</div>
          </div>

          <hr style={{ height: 2, border: 'none', backgroundColor: '#000', margin: '0 0 16px' }} />

          {/* Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {order.items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ width: 28, padding: '14px 0' }}>
                    <div style={{ width: 18, height: 18, border: '2px solid #000' }} />
                  </td>
                  <td style={{ width: 56, padding: '14px 0' }}>
                    <div style={{ width: 56, height: 56, background: '#f2f2f2', border: '1px solid #e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                      {item.image && <Image src={item.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                  </td>
                  <td style={{ paddingLeft: 16 }}>
                    <div>{item.title}</div>
                    {item.variantTitle && item.variantTitle !== 'Default Title' && (
                      <div style={{ color: '#555' }}>{item.variantTitle}</div>
                    )}
                    {item.sku && <div style={{ fontSize: 12, color: '#888' }}>SKU: {item.sku}</div>}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>Qty: {item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 24, fontSize: 12, color: '#888' }}>
            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      )}

```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Manual check**

Click **Pick List** on the same order's detail page and confirm the print preview shows: "PICK LIST" + order # header, no customer address anywhere, one row per item with an empty checkbox square, thumbnail, title/variant/SKU, and quantity — no pricing anywhere — and an item-count line at the bottom.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/orders/[id]/page.tsx"
git commit -m "feat: add Pick List print layout to Order Detail page"
```

---

### Task 4: Restyle the existing Invoice print layout

**Files:**
- Modify: `app/admin/orders/[id]/page.tsx:364-445` (the `printMode === 'invoice'` block's style/header/footer — item table and totals logic are unchanged)

**Interfaces:**
- Consumes: same `order` fields already used by this block today (`order.id`, `order.date`, `order.customer`, `order.items`, `order.subtotal`, `order.shipping`, `order.tax`, `order.total`, `order.paymentStatus`) — no new fields needed.

- [ ] **Step 1: Change the font family from Georgia to the project's sans stack**

Change:

```tsx
        <div className="hidden print:block fixed inset-0 bg-white p-10 z-9999" style={{ fontFamily: 'Georgia, serif', fontSize: 13 }}>
```

to:

```tsx
        <div className="hidden print:block fixed inset-0 bg-white p-10 z-9999" style={{ fontFamily: '"Inter", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif', fontSize: 13 }}>
```

- [ ] **Step 2: Fix the email address in the header to match the Packing Slip's footer**

Change:

```tsx
              <div style={{ color: '#555' }}>hello@acmevintagesupply.ca</div>
```

to:

```tsx
              <div style={{ color: '#555' }}>acmesign01@gmail.com</div>
```

- [ ] **Step 3: Thicken the header/content divider rule to match the Packing Slip's thick rule**

Change:

```tsx
          <div style={{ borderTop: '1px solid #ccc', marginBottom: 24 }} />
```

to:

```tsx
          <div style={{ borderTop: '2px solid #000', marginBottom: 24 }} />
```

- [ ] **Step 4: Fix the email address and thicken the rule in the footer**

Change:

```tsx
          {/* Footer */}
          <div style={{ borderTop: '1px solid #ccc', marginTop: 48, paddingTop: 16, fontSize: 11, color: '#888', textAlign: 'center' }}>
            Thank you for your order. For returns or questions, contact hello@acmevintagesupply.ca · 30-day returns on whole pieces.
          </div>
```

to:

```tsx
          {/* Footer */}
          <div style={{ borderTop: '2px solid #000', marginTop: 48, paddingTop: 16, fontSize: 11, color: '#888', textAlign: 'center' }}>
            Thank you for your order. For returns or questions, contact acmesign01@gmail.com · 30-day returns on whole pieces.
          </div>
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 6: Manual check**

Click **Invoice** on the same order's detail page and confirm: the font is now sans-serif (matching Packing Slip/Pick List) instead of Georgia serif, both email references read `acmesign01@gmail.com`, and the header/footer dividers are the same thick black rule style as the Packing Slip. Confirm the line-items table, pricing, totals, and payment status are unchanged from before.

- [ ] **Step 7: Commit**

```bash
git add "app/admin/orders/[id]/page.tsx"
git commit -m "style: restyle Invoice print layout to match Packing Slip design"
```

---

### Task 5: Full manual verification pass and final type check

**Files:** none (manual verification only, consistent with this codebase's existing precedent for print features — no automated visual regression tooling here)

- [ ] **Step 1: Pick a real order with multiple line items, at least one with a variant**

From `/admin/orders`, open an order detail page for an order with 2+ line items where at least one has a non-default variant title (e.g. a colour) and a SKU.

- [ ] **Step 2: Click each of the four print buttons in turn and verify in the print preview**

- **Shipping Label:** unchanged from before this plan — from/ship-to, fragile notice, item list. No visual difference expected.
- **Packing Slip:** uppercase store name header, order #/date right-aligned, single SHIP TO / BILL TO block, thick rules, items table with thumbnails, footer ending in `acmevintagesupply.com`.
- **Pick List:** "PICK LIST" header, order #, no customer address, checkbox + thumbnail + title/variant/SKU + quantity per row, no pricing, item count at bottom.
- **Invoice:** sans-serif font, `acmesign01@gmail.com` in both header and footer, thick black rules, pricing/totals/payment status unchanged from before this plan.

- [ ] **Step 3: Confirm no regressions on the rest of the Order Detail page**

Confirm the on-screen (non-print) parts of the page — Line Items, Timeline, Order Status, Fulfillment Timeline, Customer, Shipping Address, Summary sections — render exactly as before, since none of this plan's changes touch anything outside the `printMode` buttons and the hidden print-only blocks.

- [ ] **Step 4: Final type check**

Run: `npx tsc --noEmit`
Expected: zero errors.

---

## Self-Review Notes

- **Spec coverage:** All spec requirements covered — Packing Slip (Task 2), Pick List (Task 3), Invoice restyle (Task 4), single combined address block (Task 2, no separate Bill To column anywhere), hardcoded `acmevintagesupply.com` literal (Task 2 footer, never a variable/lookup), no new font dependency (uses `app/globals.css:33`'s existing Inter stack in Tasks 2, 3, and 4), Shipping Label untouched (explicitly excluded from every task), no bulk printing / no new API routes / no PDF library (nothing in any task introduces these).
- **Placeholder scan:** No TBD/TODO — every step has complete, exact code with real file line numbers and full before/after blocks.
- **Type consistency:** `printMode` values (`'packing-slip'`, `'pick-list'`) introduced in Task 1 are the exact strings used in Task 2 and Task 3's button `onClick` handlers and `{printMode === '...' && (...)}` conditions — no mismatches (e.g. no `'packing_slip'` vs `'packing-slip'` inconsistency). `AdminOrder`/`AdminOrderItem` field names used throughout (`order.id`, `order.date`, `order.customer.*`, `order.items[].{id,title,variantTitle,sku,quantity,image}`) match the existing interface in `lib/admin/types.ts` exactly — no new fields invented.
