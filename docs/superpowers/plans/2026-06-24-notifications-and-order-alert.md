# Admin Notifications + Order Alert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three improvements: (1) post-checkout tracking button on Shopify's thank-you page, (2) upgrade the admin notification bell with a count badge, dismiss/read state, and severity colors, (3) push a real-time new-order email to Scott and team via Resend when a paid Shopify order arrives.

**Architecture:** Task 1 is a manual Shopify Admin Liquid snippet — no code changes. Tasks 2–3 enhance the existing AdminTopbar notification system by adding a localStorage-based read/dismiss layer and severity-based color logic across `lib/admin/types.ts`, `lib/admin/shopifyAdmin.ts`, and `components/admin/layout/AdminTopbar.tsx`. Task 4 creates a Shopify webhook receiver at `app/api/webhooks/shopify/route.ts` that verifies HMAC-SHA256, parses the `orders/paid` payload, and fires a branded Resend email to all ADMIN_EMAIL recipients.

**Tech Stack:** Next.js 16 App Router, TypeScript, Resend SDK (already installed, `lib/email.ts`), Shopify Admin API webhooks (HMAC-SHA256 via Node `crypto`), localStorage (browser), Tailwind v4

## Global Constraints

- Tailwind v4: CSS variable syntax only — `bg-(--admin-green)`, `text-(--admin-accent)`. Never `bg-green-500` or `bg-[#...]`
- Never import from `@/lib/admin/mockData` in production paths
- All API routes must call `requireAuth()` (iron-session guard) EXCEPT webhook routes, which use HMAC verification instead
- Env vars in play: `RESEND_API_KEY` (existing), `SHOPIFY_WEBHOOK_SECRET` (new — Task 4), `ADMIN_EMAIL` (existing: `jonathan.mauring17@gmail.com,scottsfi@hotmail.com,acmesign01@gmail.com`)
- No git push or commit — user handles all git operations manually

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `lib/admin/types.ts` | Modify | Add `severity` field to `AdminNotification` interface |
| `lib/admin/shopifyAdmin.ts` | Modify | Set `severity` on low_stock notifications |
| `components/admin/layout/AdminTopbar.tsx` | Modify | Count badge, localStorage dismiss, severity colors, mark-all-read |
| `lib/email.ts` | Modify | Add `sendNewOrderAdminAlert()` function |
| `app/api/webhooks/shopify/route.ts` | Create | HMAC-verified Shopify webhook handler |

---

### Task 1: Post-Checkout Tracking Snippet (Manual — No Code)

This is a Shopify Admin configuration step only. No files to edit.

**Files:** None

- [ ] **Step 1: Open Shopify Admin**

  Navigate to: `w061f6-k8.myshopify.com/admin` → **Settings** → **Checkout** → scroll to **"Order status page"** → click into the **"Additional scripts"** text area.

- [ ] **Step 2: Paste this Liquid snippet**

  ```liquid
  {% if first_time_accessed %}
  <div style="margin-top: 20px; text-align: center;">
    <a
      href="https://acmevintagesupply.com/track-order/{{ order_name | url_encode }}?email={{ email | url_encode }}"
      style="display:inline-block; background:#B8964E; color:#fff; padding:13px 32px; border-radius:8px; font-family:sans-serif; font-size:14px; font-weight:600; text-decoration:none; letter-spacing:0.3px;"
    >
      Track Your Order →
    </a>
    <p style="margin-top:8px; font-size:12px; color:#888; font-family:sans-serif;">
      Skip Shopify's tracking — go straight to your order status.
    </p>
  </div>
  {% endif %}
  ```

  `{% if first_time_accessed %}` ensures the button only renders on the initial thank-you page visit, not on return visits to the order status URL.

- [ ] **Step 3: Save and verify**

  Click **Save**. Place a test order → complete checkout → confirm the brass "Track Your Order →" button appears below the Shop button on the thank-you page. Clicking it should open `acmevintagesupply.com/track-order/ACMEORDER-XXXX?email=...` pre-loaded with the order summary.

---

### Task 2: Notification Bell — Count Badge + Dismiss/Read State + Severity Colors

**Files:**
- Modify: `lib/admin/types.ts`
- Modify: `lib/admin/shopifyAdmin.ts`
- Modify: `components/admin/layout/AdminTopbar.tsx`

**Interfaces:**
- Produces: `AdminNotification.severity?: 'info' | 'warning' | 'error'`
- Consumed by: `AdminTopbar` notification list renderer

- [ ] **Step 1: Add `severity` to `AdminNotification` type**

  File: `lib/admin/types.ts` — find `export interface AdminNotification` (around line 165). Add the `severity` field:

  ```ts
  export interface AdminNotification {
    id:        string
    type:      NotificationType
    title:     string
    subtitle:  string
    href:      string
    amount?:   number
    timestamp: string
    severity?: 'info' | 'warning' | 'error'
  }
  ```

- [ ] **Step 2: Set `severity` in `getAdminNotifications()`**

  File: `lib/admin/shopifyAdmin.ts` — find the low_stock `notifications.push()` call inside the `getAdminNotifications` function (around line 1336). Replace the entire push call with:

  ```ts
  notifications.push({
    id:        `stock-${p.id}`,
    type:      'low_stock',
    title:     p.title,
    subtitle:  `${p.sku} · ${p.stock === 0 ? 'Out of stock' : `${p.stock} left`}`,
    href:      '/admin/inventory',
    timestamp: new Date().toISOString(),
    severity:  p.stock === 0 ? 'error' : 'warning',
  })
  ```

  New orders and new customers get no `severity` field (treated as `'info'` in the renderer).

- [ ] **Step 3: Add dismiss state to `AdminTopbar`**

  File: `components/admin/layout/AdminTopbar.tsx` — inside the `AdminTopbar` component, after the existing `useState` declarations (around line 127), add:

  ```ts
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem('acme-notif-dismissed')
      return new Set(stored ? (JSON.parse(stored) as string[]) : [])
    } catch { return new Set() }
  })
  ```

- [ ] **Step 4: Derive `visibleNotifs` and `notifCount`**

  In the same file, replace the existing `const notifCount = notifications.length` (around line 164) with:

  ```ts
  const visibleNotifs = notifications.filter(n => !dismissed.has(n.id))
  const notifCount    = visibleNotifs.length
  ```

  Then replace the single `{notifications.map(n => {` in the JSX with `{visibleNotifs.map(n => {`.

- [ ] **Step 5: Add `dismissAll` handler**

  After the `handleResultClick` function, add:

  ```ts
  function dismissAll() {
    const ids  = notifications.map(n => n.id)
    const next = new Set([...dismissed, ...ids])
    setDismissed(next)
    localStorage.setItem('acme-notif-dismissed', JSON.stringify([...next]))
    setNotifOpen(false)
  }
  ```

- [ ] **Step 6: Replace green dot with number badge**

  Find the green dot span inside the bell button:
  ```tsx
  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-(--admin-green)" />
  ```

  Replace with:
  ```tsx
  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-full bg-(--admin-green) text-[9px] font-bold text-white flex items-center justify-center leading-none">
    {notifCount > 9 ? '9+' : notifCount}
  </span>
  ```

- [ ] **Step 7: Update severity colors in notification list**

  Inside the `visibleNotifs.map(n => {` block, replace the existing `Icon`, `iconBg`, `iconColor` assignments with:

  ```ts
  const severity  = n.severity ?? 'info'
  const Icon      = n.type === 'new_order' ? BiReceipt : n.type === 'new_customer' ? BiUser : BiPackage
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

- [ ] **Step 8: Add "Mark all read" to notification footer**

  Find the notification footer div (the one with `Orders →`, `Inventory →`, `Customers →` buttons). Add this after the last button:

  ```tsx
  <button
    onClick={dismissAll}
    className="ml-auto text-[12px] text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
  >
    Mark all read
  </button>
  ```

- [ ] **Step 9: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: zero errors

- [ ] **Step 10: Manual verification**

  Open `acmevintagesupply.com/admin`, click the bell icon. Confirm:
  - Bell shows a number badge (e.g. "3"), not just a green dot
  - Any out-of-stock product notifications appear with a red icon
  - Low-stock (1–3 units) notifications appear with an amber icon
  - Clicking "Mark all read" closes the panel and clears the badge
  - Refreshing the admin page — dismissed notifications are still gone (localStorage persisted)

---

### Task 3: New-Order Email Alert to Scott via Shopify Webhook

**Files:**
- Modify: `lib/email.ts` — add `sendNewOrderAdminAlert()`
- Create: `app/api/webhooks/shopify/route.ts`

**Env vars needed:**
- `SHOPIFY_WEBHOOK_SECRET` — copied from Shopify Admin after creating the webhook (Step 5 below)
- `ADMIN_EMAIL` — already set: `jonathan.mauring17@gmail.com,scottsfi@hotmail.com,acmesign01@gmail.com`
- `RESEND_API_KEY` — already set

**Interfaces:**
- Consumes: Shopify `orders/paid` JSON payload
- Produces: Resend email to all `ADMIN_EMAIL` recipients

- [ ] **Step 1: Add `sendNewOrderAdminAlert()` to `lib/email.ts`**

  Append to the bottom of `lib/email.ts` (after the last export):

  ```ts
  export async function sendNewOrderAdminAlert(order: {
    name:            string
    total:           string
    customer:        string
    email:           string
    items:           { title: string; quantity: number; price: string }[]
    shippingAddress: string
  }): Promise<void> {
    const recipients = (process.env.ADMIN_EMAIL ?? '')
      .split(',')
      .map(e => e.trim())
      .filter(Boolean)
    if (!recipients.length) return

    const itemRows = order.items.map(i =>
      `<tr>
        <td style="padding:6px 0; font-size:13px; color:#2C2C2A; border-bottom:1px solid #E8E0D4;">${i.title}</td>
        <td style="padding:6px 0; font-size:13px; color:#6B6257; text-align:center; border-bottom:1px solid #E8E0D4;">×${i.quantity}</td>
        <td style="padding:6px 0; font-size:13px; color:#2C2C2A; text-align:right; border-bottom:1px solid #E8E0D4;">$${i.price}</td>
      </tr>`
    ).join('')

    await resend.emails.send({
      from:    FROM,
      to:      recipients,
      subject: `New order ${order.name} — $${order.total} CAD`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2A;">
          <div style="background:#2C5F2E; padding:20px 28px; border-radius:8px 8px 0 0;">
            <p style="color:#F5F1E6; font-size:11px; font-family:sans-serif; letter-spacing:2px; text-transform:uppercase; margin:0 0 4px;">New Order Received</p>
            <h1 style="color:#F5F1E6; font-size:24px; font-weight:700; margin:0;">${order.name}</h1>
          </div>
          <div style="background:#FDFAF6; border:1px solid #E8E0D4; border-top:none; padding:24px 28px; border-radius:0 0 8px 8px;">
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
              <tr>
                <td style="font-size:12px; color:#A89F94; font-family:sans-serif; text-transform:uppercase; letter-spacing:1px; padding-bottom:4px;">Customer</td>
                <td style="font-size:12px; color:#A89F94; font-family:sans-serif; text-transform:uppercase; letter-spacing:1px; padding-bottom:4px; text-align:right;">Order Total</td>
              </tr>
              <tr>
                <td style="font-size:15px; color:#2C2C2A; font-weight:600;">${order.customer}</td>
                <td style="font-size:22px; color:#2C5F2E; font-weight:700; text-align:right;">$${order.total} CAD</td>
              </tr>
              <tr>
                <td style="font-size:12px; color:#6B6257;">${order.email}</td>
                <td></td>
              </tr>
            </table>
            <p style="font-size:12px; color:#A89F94; font-family:sans-serif; margin:0 0 4px;">Ship to</p>
            <p style="font-size:13px; color:#2C2C2A; margin:0 0 20px;">${order.shippingAddress}</p>
            <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
              <thead>
                <tr>
                  <th style="font-size:11px; color:#A89F94; font-family:sans-serif; text-align:left; padding-bottom:6px; border-bottom:2px solid #E8E0D4;">Item</th>
                  <th style="font-size:11px; color:#A89F94; font-family:sans-serif; text-align:center; padding-bottom:6px; border-bottom:2px solid #E8E0D4;">Qty</th>
                  <th style="font-size:11px; color:#A89F94; font-family:sans-serif; text-align:right; padding-bottom:6px; border-bottom:2px solid #E8E0D4;">Price</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <a
              href="https://acmevintagesupply.com/admin/orders/${order.name.replace('#', '')}"
              style="display:inline-block; background:#B8964E; color:#fff; text-decoration:none; padding:12px 28px; border-radius:6px; font-family:sans-serif; font-size:14px; font-weight:600;"
            >
              View order in admin →
            </a>
            <p style="font-size:11px; color:#A89F94; margin-top:20px;">Acme Vintage Supply · Dartmouth, Nova Scotia</p>
          </div>
        </div>
      `,
    })
  }
  ```

- [ ] **Step 2: Create `app/api/webhooks/shopify/route.ts`**

  ```ts
  import { NextRequest, NextResponse } from 'next/server'
  import crypto from 'crypto'
  import { sendNewOrderAdminAlert } from '@/lib/email'

  function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET
    if (!secret) return false
    const digest = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64')
    try {
      return crypto.timingSafeEqual(
        Buffer.from(digest),
        Buffer.from(hmacHeader)
      )
    } catch {
      return false
    }
  }

  export async function POST(req: NextRequest) {
    const topic   = req.headers.get('x-shopify-topic') ?? ''
    const hmac    = req.headers.get('x-shopify-hmac-sha256') ?? ''
    const rawBody = await req.text()

    if (!verifyShopifyWebhook(rawBody, hmac)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (topic === 'orders/paid') {
      try {
        const o = JSON.parse(rawBody) as {
          name:             string
          total_price:      string
          email:            string
          customer?:        { first_name: string; last_name: string }
          line_items:       { title: string; quantity: number; price: string }[]
          shipping_address?: {
            address1: string; city: string; province: string; country: string
          }
        }

        const customer = o.customer
          ? `${o.customer.first_name} ${o.customer.last_name}`.trim()
          : o.email

        const addr = o.shipping_address
          ? `${o.shipping_address.address1}, ${o.shipping_address.city}, ${o.shipping_address.province}, ${o.shipping_address.country}`
          : 'Not provided'

        await sendNewOrderAdminAlert({
          name:            o.name,
          total:           parseFloat(o.total_price).toFixed(2),
          customer,
          email:           o.email,
          items:           o.line_items.map(i => ({
            title:    i.title,
            quantity: i.quantity,
            price:    parseFloat(i.price).toFixed(2),
          })),
          shippingAddress: addr,
        })
      } catch (err) {
        console.error('[webhook orders/paid]', err)
      }
    }

    // Always return 200 — Shopify will retry on non-2xx
    return NextResponse.json({ ok: true })
  }
  ```

- [ ] **Step 3: Add `SHOPIFY_WEBHOOK_SECRET` env var**

  In **Shopify Admin → Settings → Notifications → scroll to Webhooks** at the bottom → click **"Create webhook"**:
  - Event: **Order payment** (this fires `orders/paid`)
  - Format: **JSON**
  - URL: `https://acmevintagesupply.com/api/webhooks/shopify`
  - Webhook API version: `2024-07`

  After saving, Shopify shows a **signing secret** at the top of the Webhooks section. Copy it.

  Add to **Vercel → Project → Settings → Environment Variables**:
  ```
  Name:  SHOPIFY_WEBHOOK_SECRET
  Value: <paste the signing secret>
  Env:   Production + Preview
  ```

  Add to `.env.local`:
  ```
  SHOPIFY_WEBHOOK_SECRET=<paste the signing secret>
  ```

  Trigger a Vercel redeploy after adding the env var.

- [ ] **Step 4: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: zero errors

- [ ] **Step 5: Test the webhook**

  In Shopify Admin → Settings → Notifications → Webhooks → find your `orders/paid` webhook → click **"Send test notification"**.

  Check that `scottsfi@hotmail.com`, `acmesign01@gmail.com`, and `jonathan.mauring17@gmail.com` all receive the branded email (dark green header, gold "View order in admin →" button) within 30 seconds.

  If no email arrives: open Vercel dashboard → Functions → `api/webhooks/shopify` → check logs for HMAC failures or Resend errors.
