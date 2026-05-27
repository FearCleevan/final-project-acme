# Admin Dashboard — Plan 1: Frontend with Mock Data
## Acme Lamp & Sign Co.

**Type:** Frontend only — all data is mocked, no live API calls  
**Purpose:** Build and validate the full dashboard UI before wiring to Shopify  
**Route:** `/admin` inside the existing Next.js app  
**Estimated effort:** 5–7 days  
**Depends on:** Nothing — runs standalone with mock data  

---

## Design Language

### Inspiration
- **Layout:** Biosynthesis dashboard — clean sidebar, stat cards, tables, professional density
- **Typography & Dark Mode:** Linear app — crisp monospace labels, dark surfaces with clear hierarchy, no neon

### Rules
- No neon colors, no gradients, no glassmorphism
- Dark mode: deep neutral surfaces (`#0F0F0F`, `#1A1A1A`, `#242424`) — not blue-black
- Light mode: warm off-white surfaces (`#FAFAF9`, `#F4F3F1`) — not pure white
- Icons: `react-icons` only — `BiPackage`, `BiCart`, `BiUser`, `BiBarChart`, etc. No SVG, no emoji
- Typography: `Inter` (sans) + `JetBrains Mono` (mono for numbers and labels)
- Reusable components for every repeated pattern — cards, tables, badges, inputs
- Matches Acme Lamp & Sign brand tone — restrained, typographic, no playfulness

### Color Tokens (Admin-specific)

```ts
// Light mode
--admin-bg:          #FAFAF9
--admin-surface:     #FFFFFF
--admin-surface-2:   #F4F3F1
--admin-border:      #E5E4E1
--admin-text:        #1A1917
--admin-text-soft:   #6B6966
--admin-text-muted:  #A39F9A
--admin-accent:      #1A1917   // primary action
--admin-accent-text: #FFFFFF
--admin-green:       #2D6A4F   // positive change
--admin-red:         #C0392B   // negative change / danger
--admin-amber:       #92400E   // warning / low stock

// Dark mode
--admin-bg:          #0F0F0E
--admin-surface:     #1A1917
--admin-surface-2:   #242320
--admin-border:      #2E2C29
--admin-text:        #F0EDE8
--admin-text-soft:   #9B9590
--admin-text-muted:  #5C5955
--admin-accent:      #F0EDE8
--admin-accent-text: #1A1917
--admin-green:       #4ADE80
--admin-red:         #F87171
--admin-amber:       #FBB040
```

---

## Tech Stack

```
Next.js 16 (App Router)       — existing project
TypeScript                    — strict
Tailwind CSS v4               — existing
react-icons (bi set)          — icons throughout
Recharts                      — revenue + orders charts
react-hook-form               — add/edit product form
Zustand                       — admin UI state (sidebar open, active filters)
next-themes                   — dark/light mode toggle
Papa Parse                    — CSV parse for import
```

Install commands:
```bash
npm install recharts react-hook-form papaparse
npm install --save-dev @types/papaparse
```

---

## File Structure

```
app/
  admin/
    layout.tsx                    — admin shell (sidebar + topbar)
    page.tsx                      — redirect to /admin/overview
    overview/
      page.tsx
    orders/
      page.tsx
      [id]/
        page.tsx
    products/
      page.tsx
      new/
        page.tsx
      [id]/
        page.tsx
    inventory/
      page.tsx
    collections/
      page.tsx
    customers/
      page.tsx
      [id]/
        page.tsx
    analytics/
      page.tsx
    import-export/
      page.tsx
    settings/
      page.tsx

components/
  admin/
    layout/
      AdminShell.tsx              — sidebar + topbar wrapper
      AdminSidebar.tsx            — nav links
      AdminTopbar.tsx             — search + notifications + user
    shared/
      StatCard.tsx                — revenue / orders / sessions card
      DataTable.tsx               — reusable sortable table
      Badge.tsx                   — status pill (Active, Draft, Fulfilled, etc.)
      PageHeader.tsx              — title + subtitle + actions row
      SectionCard.tsx             — white/surface card wrapper
      EmptyState.tsx              — empty table / no results
      Spinner.tsx                 — loading indicator
      ConfirmModal.tsx            — delete / destructive action confirm
      SearchInput.tsx             — debounced search field
      FilterBar.tsx               — filter row (tabs + dropdowns)
      Pagination.tsx              — table pagination
    charts/
      RevenueChart.tsx            — line chart
      OrdersChart.tsx             — bar chart
      TopProductsTable.tsx        — ranked product list
    forms/
      ProductForm.tsx             — full add/edit product form
      MetafieldFields.tsx         — all acme.* metafield inputs
      ImageUploader.tsx           — drag-drop image upload
      CollectionSelect.tsx        — multi-select collection picker

lib/
  admin/
    mockData.ts                   — all mock data
    types.ts                      — admin-specific types
    utils.ts                      — format currency, dates, etc.
```

---

## Mock Data (`lib/admin/mockData.ts`)

```ts
export const mockOrders = [
  {
    id: 'ORD-1001',
    customer: { name: 'Margaret Holloway', email: 'margaret@example.com' },
    date: '2026-05-27',
    items: 2,
    total: 348.00,
    status: 'unfulfilled',
    paymentStatus: 'paid',
    fulfillmentStatus: 'unfulfilled',
  },
  {
    id: 'ORD-1002',
    customer: { name: 'James Whitfield', email: 'james@example.com' },
    date: '2026-05-26',
    items: 1,
    total: 175.00,
    status: 'fulfilled',
    paymentStatus: 'paid',
    fulfillmentStatus: 'fulfilled',
  },
  // ... 10 total
]

export const mockRevenue = {
  today: 523.00,
  week: 3840.00,
  month: 14200.00,
  weekChange: +12,
  monthChange: +8,
}

export const mockChartData = [
  { date: 'May 1',  revenue: 320, orders: 2 },
  { date: 'May 2',  revenue: 480, orders: 3 },
  // ... 30 days
]

export const mockInventoryAlerts = [
  { id: 'sp-001', name: 'Embossed Satin Glass Shade — Powder Blue', stock: 2, sku: 'ACM-001' },
  { id: 'sp-002', name: 'Open Tulip Etched Shade — Magenta',        stock: 1, sku: 'ACM-002' },
]

export const mockCustomers = [
  {
    id: 'cust-001',
    name: 'Margaret Holloway',
    email: 'margaret@example.com',
    orders: 4,
    totalSpent: 892.00,
    joined: '2026-03-12',
  },
  // ...
]

export const mockAbandonedCheckouts = [
  {
    id: 'ab-001',
    customer: 'Anonymous',
    items: 1,
    value: 175.00,
    abandonedAt: '2026-05-27T14:22:00Z',
  },
]
```

---

## Page Specs

---

### `/admin/overview`

**Layout:** 4 stat cards → line chart → 2-column (recent orders + low stock)

**Stat Cards (StatCard component):**
```
Revenue (30 days)  |  Orders (30 days)  |  Sessions  |  Conversion Rate
$14,200            |  48                |  1,240     |  3.9%
+8% vs last month  |  +5%               |  +12%      |  -0.2%
```

**Revenue Chart:**
- 30-day line chart
- Toggle: 7 days / 30 days / 90 days
- X-axis: dates, Y-axis: CAD revenue
- Tooltip: date + revenue + order count

**Recent Orders table (last 10):**
- Columns: Order #, Customer, Date, Items, Total, Status
- Status badge: Unfulfilled (amber) / Fulfilled (green) / Cancelled (red)
- Click row → navigate to order detail

**Low Stock Alerts:**
- Card list — product name, SKU, stock count
- Red badge if stock = 0, amber if ≤ 3
- Quick link to edit product

---

### `/admin/orders`

**Filters:**
- Tabs: All | Unfulfilled | Fulfilled | Cancelled
- Search: order number or customer name
- Date range picker

**Table columns:**
- Order # (link to detail)
- Customer name + email
- Date
- Items count
- Total (CAD)
- Payment status badge
- Fulfillment status badge
- Actions: View

**Pagination:** 20 per page

---

### `/admin/orders/[id]`

**Left column:**
- Line items — product image, name, SKU, qty, unit price, line total
- Order subtotal / shipping / tax / total breakdown

**Right column:**
- Customer card — name, email, phone
- Shipping address card
- Order status card — payment status, fulfillment status
- Mark as Fulfilled button (disabled if already fulfilled)
- Internal notes field

---

### `/admin/products`

**Filters:**
- Search: title or SKU
- Collection dropdown: All | Oil Lamp Chimneys | Oil Lamp Shades | etc.
- Status tabs: All | Active | Draft

**Table columns:**
- Thumbnail (40×40)
- Title (link to edit)
- SKU
- Collection badge
- Price (CAD)
- Stock
- Status badge (Active / Draft)
- Actions: Edit | Delete

**Bulk actions** (checkbox select):
- Set Active
- Set Draft
- Delete (with ConfirmModal)

**Add Product button** → `/admin/products/new`

---

### `/admin/products/new` and `/admin/products/[id]`

**Form sections:**

**Basic Info**
- Title (required)
- Short Description (textarea)
- Status toggle: Active / Draft

**Pricing**
- Price (CAD) — required
- Compare-at price

**Media**
- ImageUploader — drag-drop or click to upload
- Reorder images by drag
- Delete individual images

**Organization**
- Collection multi-select (checkboxes for all 6)
- Tags input (space-separated, `featured` auto-suggested)
- Vendor (text, default: Acme Lamp & Sign Co.)
- Shopify Category dropdown

**Inventory**
- SKU
- Stock quantity
- Sell when out of stock toggle

**Shipping**
- Net Weight (kg)
- Physical product toggle

**`acme.*` Metafields (MetafieldFields component)**

Grouped into sections:
```
Identification       — SKU, Patent, Brand, Vintage
Physical             — Material, Colour, Style, Net Weight
Lamp Specs           — Burner Size, Fits, Power Source, Era
Condition            — Condition, Product Type, Edition
Provenance           — Workshop, Bench Tester, Bench Test Date
Description          — Full Description (rich text)
```

**Search Engine Listing**
- Page title
- Meta description
- URL handle (auto-generated, editable)

**Save / Discard buttons** — sticky footer

---

### `/admin/inventory`

**Summary row:** Total SKUs | In Stock | Low Stock | Out of Stock

**Filter tabs:** All | In Stock | Low Stock (≤ 3) | Out of Stock

**Table columns:**
- Product name + thumbnail
- SKU
- Collection
- Stock quantity (inline editable input)
- Status badge

**Save All Changes button** — appears when any qty is edited

**Low stock threshold setting** — input at top right: "Alert when stock ≤ _"

---

### `/admin/collections`

**Collection cards (6):**
Each card shows:
- Collection title
- Handle (`oil-lamp-chimneys`)
- Product count
- Edit button

**Collection detail (slide-over panel):**
- Title + description (editable)
- Product list — thumbnail, name, SKU, stock
- Remove product from collection button
- Add product search

---

### `/admin/customers`

**Table columns:**
- Name + email
- Orders count
- Total spent (CAD)
- Joined date
- Actions: View

**Search:** name or email  
**Sort:** Total spent | Orders | Date joined

---

### `/admin/customers/[id]`

- Customer details card — name, email, phone, address
- Lifetime stats — total orders, total spent, average order value
- Order history table — same columns as orders list

---

### `/admin/analytics`

**Revenue section:**
- Line chart — toggle 7 / 30 / 90 days
- Total revenue, avg order value, order count for period

**Orders section:**
- Bar chart — orders per day

**Top Products table:**
- Rank | Product | Units sold | Revenue
- Sortable by units or revenue

**Collection Performance:**
- Bar chart — revenue per collection
- Which category generates the most sales

---

### `/admin/import-export`

**Import section:**

1. Download CSV Template button
   - Pre-filled headers matching all `acme.*` metafields + standard fields
   - Includes example row

2. Upload CSV
   - Drag-drop or file picker
   - Only `.csv` accepted
   - Preview table — first 5 rows shown before confirming
   - Validation — red highlight on missing required fields (Title, Price, Collection)
   - Image URL column — if present, images are fetched and attached
   - Import button → progress bar (rate-limited, 1 product per 500ms)
   - Results summary: X created, X failed + error log

**Export section:**

- Export All Products (CSV) button
- Export Orders (CSV) — date range picker
- Export Customers (CSV) button

---

### `/admin/settings`

- Store display name
- Contact email
- Currency display — CAD primary, show USD/AUD conversions toggle
- Low stock alert threshold (number input)
- Dark / light mode toggle
- Admin password change (2 fields: new password + confirm) — frontend only in Plan 1
- API connection status card — shows "Not connected" in Plan 1, "Connected" in Plan 2

---

## Shared Components Spec

### `StatCard`
```tsx
interface StatCardProps {
  label: string        // "Revenue"
  value: string        // "$14,200"
  change: number       // +8 or -2
  period: string       // "Last 30 days"
  icon: React.ReactNode
}
```

### `DataTable`
```tsx
interface DataTableProps<T> {
  columns: { key: keyof T; label: string; sortable?: boolean; render?: (row: T) => React.ReactNode }[]
  data: T[]
  onRowClick?: (row: T) => void
  selectable?: boolean
  emptyMessage?: string
}
```

### `Badge`
```tsx
type BadgeVariant = 'green' | 'amber' | 'red' | 'neutral' | 'blue'
// Examples:
// "Fulfilled" → green
// "Unfulfilled" → amber
// "Cancelled" → red
// "Active" → green
// "Draft" → neutral
```

### `PageHeader`
```tsx
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode   // buttons aligned right
}
```

---

## Admin Layout (`AdminShell`)

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (240px fixed)  │  Topbar (full width, 56px) │
│  ─────────────────────  │  ─────────────────────────  │
│  Logo / Store name      │  Search    Notif   Avatar   │
│                         │                             │
│  MAIN                   │  Page content               │
│  ○ Overview             │                             │
│  ○ Orders          (3)  │                             │
│  ○ Products             │                             │
│  ○ Inventory            │                             │
│  ○ Collections          │                             │
│  ○ Customers            │                             │
│  ○ Analytics            │                             │
│  ○ Import / Export      │                             │
│                         │                             │
│  STORE                  │                             │
│  ○ Settings             │                             │
│                         │                             │
│  Dark mode toggle       │                             │
│  PPlazan  ·  Logout     │                             │
└─────────────────────────────────────────────────────┘
```

---

## Security (Frontend Layer)

Even with mock data, these must be implemented now so Plan 2 just wires in real auth:

- `/admin` routes protected by `middleware.ts` — redirect to `/admin/login` if no session cookie
- `/admin/login` — simple password form, sets httpOnly session cookie on success
- No Shopify tokens in frontend code or browser console
- All admin routes under `(admin)` route group with shared auth check
- `ConfirmModal` required before any delete action — prevents accidental destructive clicks
- CSV import validates all rows before any API call — no partial imports

---

## Execution Rules

- Execute **one phase at a time only**
- After each phase: stop completely, provide a full report
- Report covers: what was implemented, files created/modified, decisions made, key concepts
- End every report with: **"Continue with the next Phase?"**
- Do not proceed until user explicitly says **"Yes, Proceed"**
- Never skip ahead. Never bundle multiple phases into one execution.
- This markdown file is the **source of truth** — all implementation follows the specs above

---

## Phase Execution Plan

| Phase | Name | Status |
|---|---|---|
| 1 | Foundation — deps, tokens, types, mock data, layout shell, login, middleware | Complete |
| 2 | Shared Components — StatCard, DataTable, Badge, PageHeader, SectionCard, EmptyState, Spinner, ConfirmModal, SearchInput, Pagination | Complete |
| 3 | Overview Page — RevenueChart, OrdersChart, TopProductsTable, full overview wired to mock data | Complete |
| 4 | Orders — orders list + order detail page | Complete |
| 4B | Fulfillment Timeline — shipment stage UI on order detail, add-event modal, mock events, mirrors storefront track-order page | Pending |
| 5 | Products — products list, ProductForm, MetafieldFields, ImageUploader, CollectionSelect | Pending |
| 6 | Inventory — inline stock editing, low stock threshold | Pending |
| 7 | Collections — collection cards + slide-over panel | Pending |
| 8 | Customers — customers list + customer detail | Pending |
| 9 | Analytics — revenue chart, orders chart, top products, collection performance | Pending |
| 10 | Import / Export — CSV template download, upload + preview + validation, export buttons | Pending |
| 11 | Settings + Dark Mode — settings page, dark/light toggle, final QA pass | Pending |

---

## Phase 1 — Foundation

**Files to create:**
- `package.json` — install recharts, react-hook-form, papaparse, next-themes
- `lib/admin/types.ts` — all admin TypeScript interfaces
- `lib/admin/mockData.ts` — full mock orders, products, customers, revenue, chart data
- `lib/admin/utils.ts` — formatCurrency, formatDate, formatChange helpers
- `app/globals.css` — add admin design tokens (light + dark CSS variables)
- `app/admin/layout.tsx` — AdminShell wrapper
- `app/admin/page.tsx` — redirect to /admin/overview
- `app/admin/login/page.tsx` — password form UI (no real auth yet)
- `components/admin/layout/AdminShell.tsx` — sidebar + topbar layout wrapper
- `components/admin/layout/AdminSidebar.tsx` — nav links with react-icons
- `components/admin/layout/AdminTopbar.tsx` — search bar, notification bell, user avatar
- `middleware.ts` — stub that allows all /admin routes through (real auth in Plan 2)

---

## Phase 2 — Shared Components

**Files to create:**
- `components/admin/shared/StatCard.tsx`
- `components/admin/shared/DataTable.tsx`
- `components/admin/shared/Badge.tsx`
- `components/admin/shared/PageHeader.tsx`
- `components/admin/shared/SectionCard.tsx`
- `components/admin/shared/EmptyState.tsx`
- `components/admin/shared/Spinner.tsx`
- `components/admin/shared/ConfirmModal.tsx`
- `components/admin/shared/SearchInput.tsx`
- `components/admin/shared/Pagination.tsx`

---

## Phase 3 — Overview Page

**Files to create:**
- `components/admin/charts/RevenueChart.tsx`
- `components/admin/charts/OrdersChart.tsx`
- `components/admin/charts/TopProductsTable.tsx`
- `app/admin/overview/page.tsx`

---

## Phase 4 — Orders

**Files created:**
- `app/admin/orders/page.tsx`
- `app/admin/orders/[id]/page.tsx`

---

## Phase 4B — Fulfillment Timeline

**Goal:** Add a shipment timeline panel to the order detail page so the store owner can track and update each order's fulfillment stages from the admin dashboard. The timeline mirrors the stages shown on the storefront `/track-order` page. In Plan 1 all state is local (mock). In Plan 2 each stage update calls the Shopify Fulfillment Events API.

**Shopify mapping (Plan 2 reference):**

| UI Label | Shopify `FulfillmentEvent.status` |
|---|---|
| Order confirmed | `confirmed` |
| Packed at workshop | `label_printed` |
| Shipped | `in_transit` |
| Out for delivery | `out_for_delivery` |
| Delivered | `delivered` |
| Delivery attempted | `attempted_delivery` |
| Issue | `failure` |

**Stage progression rules:**
- Stages are ordered — you can only add the next stage in sequence
- Each stage records a `message` (optional custom note) and `happenedAt` timestamp
- Adding `in_transit` stage enables a "Tracking number" input field
- Adding `delivered` auto-marks the order as fulfilled
- Cancelled orders: timeline is read-only, no new stages can be added

**Email notifications (Plan 2):**
- Shopify fires automatic emails for `in_transit` and `delivered` automatically
- Custom stages (`label_printed`) require Shopify Flow or a webhook → email service
- The admin UI shows a "Notify customer" checkbox on the Add Event modal (wired in Plan 2)

**Files to create/modify:**
- `lib/admin/types.ts` — add `FulfillmentEvent` type, add `fulfillmentEvents` field to `AdminOrder`
- `lib/admin/mockData.ts` — add sample fulfillment events to 3–4 existing mock orders
- `components/admin/orders/FulfillmentTimeline.tsx` — read-only timeline display (matches storefront style, admin tokens)
- `components/admin/orders/AddFulfillmentEventModal.tsx` — modal: stage select dropdown, custom message textarea, "Notify customer" checkbox (disabled/labelled Plan 2), confirm button
- `app/admin/orders/[id]/page.tsx` — add FulfillmentTimeline panel to right column, "Add Stage" button (hidden if delivered or cancelled)

**UI layout on order detail (right column, after Order Status card):**

```
┌─────────────────────────────────┐
│ Fulfillment Timeline            │
│                                 │
│ ● Order confirmed    10 Feb     │
│   Payment verified              │
│                                 │
│ ● Packed at workshop 11 Feb     │
│   Straw-packed, hand-numbered   │
│                                 │
│ ◉ Shipped            12 Feb     │  ← current (filled dot)
│   Tracking: AU123456789         │
│                                 │
│ ○ Delivered          —          │  ← pending (empty dot)
│                                 │
│ [ + Add next stage ]            │
└─────────────────────────────────┘
```

---

## Phase 5 — Products

**Files to create:**
- `app/admin/products/page.tsx`
- `app/admin/products/new/page.tsx`
- `app/admin/products/[id]/page.tsx`
- `components/admin/forms/ProductForm.tsx`
- `components/admin/forms/MetafieldFields.tsx`
- `components/admin/forms/ImageUploader.tsx`
- `components/admin/forms/CollectionSelect.tsx`

---

## Phase 6 — Inventory

**Files to create:**
- `app/admin/inventory/page.tsx`

---

## Phase 7 — Collections

**Files to create:**
- `app/admin/collections/page.tsx`

---

## Phase 8 — Customers

**Files to create:**
- `app/admin/customers/page.tsx`
- `app/admin/customers/[id]/page.tsx`

---

## Phase 9 — Analytics

**Files to create:**
- `app/admin/analytics/page.tsx`

---

## Phase 10 — Import / Export

**Files to create:**
- `app/admin/import-export/page.tsx`

---

## Phase 11 — Settings + Dark Mode

**Files to create/modify:**
- `app/admin/settings/page.tsx`
- Dark/light mode toggle wired to next-themes across all admin pages
- QA pass: all pages in light + dark mode at 1024px, 1280px, 1440px

---

*Plan created: 2026-05-28 · Updated with phase-by-phase execution plan · Acme Lamp & Sign Co. Admin Dashboard*
