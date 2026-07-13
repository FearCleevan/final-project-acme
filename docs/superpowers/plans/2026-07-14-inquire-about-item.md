# Inquire About This Item Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Inquire about this item" collapsible inline form to every product detail page, so customers can ask a per-product question even when a listing has no price/image yet.

**Architecture:** A new small client component modeled directly on the existing `NotifyMeForm.tsx` pattern, posting to the existing `/api/contact` route (extended with two optional fields), rendered unconditionally in `ProductInfo.tsx`'s CTA area. The admin Contact Inbox gets a small display enhancement to tag these rows.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase, existing Resend email pipeline (unchanged).

## Global Constraints

- No new API route — `app/api/contact/route.ts` is extended, not duplicated.
- No new database table — `contact_messages` gains two nullable columns (`product_handle`, `product_title`) only.
- The general Contact Us form (footer/`/contact` page) must continue to work completely unchanged — it simply omits the two new optional fields.
- The new form must visually and behaviorally match `components/product/NotifyMeForm.tsx`'s existing conventions (collapsed link → expand → `idle/loading/done/error` states, same Tailwind classes/spacing style).
- `npx tsc --noEmit` must report zero errors at the end of every task.

---

## File Structure

- **Create:** `docs/supabase/migrations/014_contact_product_reference.sql` — two new nullable columns.
- **Modify:** `app/api/contact/route.ts` — accept and store optional `product_handle`/`product_title`.
- **Create:** `components/product/ProductInquiryForm.tsx` — the new collapsible inline form.
- **Modify:** `components/product/ProductInfo.tsx` — render the new form in the CTA area.
- **Modify:** `app/admin/communications/page.tsx` — `ContactMessage` type + a small "Product inquiry" tag on matching rows.

---

### Task 1: Migration and `/api/contact` route update

**Files:**
- Create: `docs/supabase/migrations/014_contact_product_reference.sql`
- Modify: `app/api/contact/route.ts`

**Interfaces:**
- Produces: `contact_messages.product_handle` and `contact_messages.product_title` (nullable text columns), and `POST /api/contact` now accepts optional `product_handle`/`product_title` fields in its JSON body, storing them as `null` when absent. Consumed by Task 2 (form submission) and Task 4 (admin display).

- [ ] **Step 1: Write the migration**

```sql
-- 014_contact_product_reference.sql
-- Run in Supabase Dashboard → SQL Editor
--
-- Lets a contact_messages row optionally reference a specific product,
-- so the admin Contact Inbox can distinguish a per-product inquiry from
-- a general contact message. Both nullable — general Contact Us
-- submissions omit these and are unaffected.

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS product_handle text;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS product_title text;
```

- [ ] **Step 2: Run the migration**

Run this SQL in the Supabase Dashboard → SQL Editor (production project). Confirm success: `SELECT product_handle, product_title FROM contact_messages LIMIT 1;` returns both columns (value `null` for existing rows) without error.

- [ ] **Step 3: Update `app/api/contact/route.ts`**

Change:

```ts
export async function POST(req: NextRequest) {
  try {
    const body    = await req.json()
    const { name, email, subject, message } = body

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ success: false, error: 'All fields required' }, { status: 400 })
    }

    const { error } = await getSupabase()
      .from('contact_messages')
      .insert({
        name:    name.trim(),
        email:   email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      })

    if (error) throw error

    // Fire-and-forget — don't fail the user's submission if email fails
    sendContactAdminAlert({ name, email, subject, message }).catch(console.error)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
```

to:

```ts
export async function POST(req: NextRequest) {
  try {
    const body    = await req.json()
    const { name, email, subject, message, product_handle, product_title } = body

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ success: false, error: 'All fields required' }, { status: 400 })
    }

    const { error } = await getSupabase()
      .from('contact_messages')
      .insert({
        name:           name.trim(),
        email:          email.trim(),
        subject:        subject.trim(),
        message:        message.trim(),
        product_handle: product_handle ?? null,
        product_title:  product_title ?? null,
      })

    if (error) throw error

    // Fire-and-forget — don't fail the user's submission if email fails
    sendContactAdminAlert({ name, email, subject, message }).catch(console.error)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 5: Manual check**

With the dev server running, POST `{"name":"Test","email":"test@example.com","subject":"General question","message":"Hello"}` (no product fields) to `/api/contact` — confirm `{"success": true}` and the row in Supabase has `product_handle`/`product_title` as `null`. POST the same with `product_handle: "test-product"` and `product_title: "Test Product"` added — confirm those values are stored.

- [ ] **Step 6: Commit**

```bash
git add docs/supabase/migrations/014_contact_product_reference.sql app/api/contact/route.ts
git commit -m "feat: add optional product reference fields to contact form"
```

---

### Task 2: `ProductInquiryForm` component

**Files:**
- Create: `components/product/ProductInquiryForm.tsx`

**Interfaces:**
- Consumes: `POST /api/contact` from Task 1.
- Produces: `ProductInquiryForm` component with props `{ productHandle: string; productTitle: string }`, consumed by Task 3.

- [ ] **Step 1: Create the component**

Create `components/product/ProductInquiryForm.tsx`:

```tsx
'use client'

import { useState } from 'react'

interface Props {
  productHandle: string
  productTitle:  string
}

export default function ProductInquiryForm({ productHandle, productTitle }: Props): React.ReactElement {
  const [open,    setOpen]    = useState(false)
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [message, setMessage] = useState('')
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return
    setStatus('loading')

    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    name.trim(),
          email:   email.trim(),
          subject: `Product inquiry: ${productTitle}`,
          message: message.trim(),
          product_handle: productHandle,
          product_title:  productTitle,
        }),
      })
      const data = await res.json() as { success?: boolean }
      if (!res.ok || !data.success) { setStatus('error'); return }
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-sans text-[13px] text-brass-deep hover:text-brass underline underline-offset-2 transition-colors"
      >
        Inquire about this item
      </button>
    )
  }

  if (status === 'done') {
    return (
      <div className="border border-ink-rule rounded-sm px-5 py-4 bg-parchment-2">
        <p className="font-serif text-[16px] text-ink-charcoal mb-0.5">Thanks — question sent.</p>
        <p className="font-sans text-[13px] text-ink-soft">
          We&apos;ll reply to <span className="text-ink-iron font-medium">{email}</span> shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="border border-ink-rule rounded-sm px-4 py-3 bg-parchment-2">
        <p className="font-sans text-[12px] text-ink-soft uppercase tracking-eyebrow mb-0.5">
          Ask about this item
        </p>
        <p className="font-sans text-[13px] text-ink-iron">
          We&apos;ll reply by email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          required
          disabled={status === 'loading'}
          className="w-full h-11 px-4 bg-parchment-2 border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors disabled:opacity-60"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your email"
          required
          disabled={status === 'loading'}
          className="w-full h-11 px-4 bg-parchment-2 border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors disabled:opacity-60"
        />
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Your question…"
          required
          rows={3}
          disabled={status === 'loading'}
          className="w-full px-4 py-3 bg-parchment-2 border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors disabled:opacity-60 resize-y"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status === 'loading'}
            className="h-11 px-5 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[13px] font-semibold hover:bg-green-deep transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Sending…' : 'Send Inquiry'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={status === 'loading'}
            className="font-sans text-[13px] text-ink-soft hover:text-ink-iron transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>

      {status === 'error' && (
        <p className="font-sans text-[12px] text-red-600">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors. (This component isn't wired into any page yet — that's Task 3 — so this only confirms the file itself type-checks in isolation.)

- [ ] **Step 3: Commit**

```bash
git add components/product/ProductInquiryForm.tsx
git commit -m "feat: add ProductInquiryForm component"
```

---

### Task 3: Wire into `ProductInfo.tsx`

**Files:**
- Modify: `components/product/ProductInfo.tsx`

**Interfaces:**
- Consumes: `ProductInquiryForm` from Task 2 (props `{ productHandle: string; productTitle: string }`).

- [ ] **Step 1: Import the component**

Add near the other component imports (after `import NotifyMeForm from "./NotifyMeForm";`):

```tsx
import ProductInquiryForm from "./ProductInquiryForm";
```

- [ ] **Step 2: Render it after the CTA block**

Find the CTA block (starts with `{/* Add to crate CTA — or notify-me form when out of stock or price not set yet */}` and ends with the closing `)}` of its `noPrice && !multiMode ? (...) : !activeInStock && !multiMode ? (...) : (...)` ternary — immediately after the `<button>...Add to crate...</button>` closing and the ternary's final `)}`). Add this immediately after that block, before the `{/* Trust signals */}` section:

```tsx
      {/* Inquire about this item — available regardless of price/stock state */}
      <div>
        <ProductInquiryForm productHandle={product.slug} productTitle={product.name} />
      </div>
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Manual check**

Run `npm run dev`, open a fully-priced product's detail page — confirm "Inquire about this item" appears below the Add to Crate button, click it to expand the form, fill it in, submit — confirm the success message appears. Open a no-price product's detail page — confirm the link still appears below the "Not yet available for purchase" notice and works the same way.

- [ ] **Step 5: Commit**

```bash
git add components/product/ProductInfo.tsx
git commit -m "feat: render Inquire about this item on the product detail page"
```

---

### Task 4: Admin Contact Inbox display enhancement

**Files:**
- Modify: `app/admin/communications/page.tsx`

**Interfaces:**
- Consumes: `contact_messages.product_handle`/`product_title` from Task 1.

- [ ] **Step 1: Update the `ContactMessage` interface**

Change:

```tsx
interface ContactMessage {
  id:         string
  name:       string
  email:      string
  subject:    string
  message:    string
  read_at:    string | null
  replied_at: string | null
  created_at: string
  reply_body: string | null
}
```

to:

```tsx
interface ContactMessage {
  id:             string
  name:           string
  email:          string
  subject:        string
  message:        string
  read_at:        string | null
  replied_at:     string | null
  created_at:     string
  reply_body:     string | null
  product_handle: string | null
  product_title:  string | null
}
```

- [ ] **Step 2: Add the tag to the message row**

Find the message row's name/subject block:

```tsx
                      <div className="flex items-center gap-2 mb-0.5">
                        {!msg.read_at && (
                          <span className="w-2 h-2 rounded-full bg-(--admin-accent) shrink-0" />
                        )}
                        <span className="text-[14px] font-medium text-(--admin-text) truncate">{msg.name}</span>
                        <span className="text-[11px] text-(--admin-text-muted) shrink-0">{timeAgo(msg.created_at)}</span>
                      </div>
                      <p className="text-[12px] text-(--admin-text-soft) truncate">{msg.subject}</p>
```

Change to:

```tsx
                      <div className="flex items-center gap-2 mb-0.5">
                        {!msg.read_at && (
                          <span className="w-2 h-2 rounded-full bg-(--admin-accent) shrink-0" />
                        )}
                        <span className="text-[14px] font-medium text-(--admin-text) truncate">{msg.name}</span>
                        <span className="text-[11px] text-(--admin-text-muted) shrink-0">{timeAgo(msg.created_at)}</span>
                      </div>
                      {msg.product_title && (
                        <Badge label={`Product inquiry: ${msg.product_title}`} variant="blue" />
                      )}
                      <p className="text-[12px] text-(--admin-text-soft) truncate">{msg.subject}</p>
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Manual check**

Submit a product inquiry via the storefront (from Task 3's manual check), then open `/admin/communications` → Contact Inbox tab — confirm the message row shows a blue "Product inquiry: {title}" badge, and a general Contact Us submission (no product) shows no such badge. Confirm replying via the existing rich-text composer still works unchanged.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/communications/page.tsx"
git commit -m "feat: tag product inquiries in the admin Contact Inbox"
```

---

### Task 5: Full end-to-end verification pass

**Files:** none (manual verification only, consistent with this codebase's existing precedent — no automated UI test suite here)

- [ ] **Step 1: Fully-listed product**

Open a product with a real price and image. Confirm "Inquire about this item" appears below the Add to Crate button. Submit an inquiry, confirm success message, confirm it lands in the admin Contact Inbox tagged with the correct product.

- [ ] **Step 2: No-price/no-image product**

Open one of the $0.00 products (e.g. "OIL LAMP CHIMNEY - 3\" Crimp Chimney"). Confirm the "Not yet available for purchase" notice still shows, and "Inquire about this item" is available below it. Submit an inquiry, confirm the same success/admin behavior.

- [ ] **Step 3: General Contact Us regression check**

Submit the general Contact Us form (footer or `/contact` page). Confirm it still succeeds and the resulting Contact Inbox row shows no "Product inquiry" badge.

- [ ] **Step 4: Reply flow**

From the admin Contact Inbox, reply to a product inquiry using the existing rich-text composer. Confirm the email is sent correctly and the message shows as Replied.

- [ ] **Step 5: Final type check**

Run: `npx tsc --noEmit`
Expected: zero errors.

---

## Self-Review Notes

- **Spec coverage:** All scope decisions covered — every-product-page placement (Task 3, rendered outside any noPrice/inStock conditional), collapsed-by-default form matching `NotifyMeForm`'s conventions (Task 2), Name/Email/Message fields with server-generated subject (Task 2), `product_handle`/`product_title` columns (Task 1), reuse of `/api/contact` with no new route/table (Task 1), admin Contact Inbox tagging (Task 4).
- **Placeholder scan:** No TBD/TODO — every step has complete, exact code.
- **Type consistency:** `ProductInquiryForm`'s prop shape (`{ productHandle: string; productTitle: string }`, Task 2) matches exactly how it's invoked in Task 3 (`<ProductInquiryForm productHandle={product.slug} productTitle={product.name} />`). The request body field names sent by the form (`product_handle`, `product_title`, Task 2) match exactly what the route destructures and stores (Task 1) and what the admin `ContactMessage` interface reads (Task 4) — consistent snake_case throughout the API/DB layer, matching this codebase's existing convention (e.g. `reply_body`, `read_at` already snake_case in the same interface).
