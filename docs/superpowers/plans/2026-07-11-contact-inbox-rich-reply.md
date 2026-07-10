# Contact Inbox In-App Rich Reply Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken `mailto:` "Reply via email" link in the admin dashboard's Contact Inbox with an in-app rich text reply composer that sends real emails via Resend, supports bold/italic/underline/lists/images/catalog-product-links, and stores the sent reply for later viewing.

**Architecture:** A new Tiptap-based composer component (`ContactReplyComposer`) renders inline inside the existing message-expand UI in `app/admin/communications/page.tsx`. Sending POSTs the editor's HTML to a new API route that sanitizes it, emails it via a new `lib/email.ts` function (following the exact pattern already used by every other email in that file), and persists it to a new `reply_body` column on `contact_messages`.

**Tech Stack:** Next.js App Router (16.2.6), React 19.2.4, TypeScript, Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-image`, `@tiptap/extension-link`), Resend, Supabase, `@vercel/blob`, `isomorphic-dompurify`.

## Global Constraints

- Sender address is always `Acme Vintage Supply <hello@acmevintagesupply.com>` (the existing `FROM` constant in `lib/email.ts`) — no new reply-to address.
- Only the most recent reply is stored in `reply_body` — re-replying overwrites it. No thread/history table.
- The `mailto:` link is fully deleted, not kept as a fallback.
- Reply HTML must be sanitized server-side with `isomorphic-dompurify` before it is ever emailed or stored.
- Image uploads must follow the exact validation used in `app/api/admin/content/upload/route.ts` (`['image/jpeg', 'image/png', 'image/webp', 'image/gif']`) via `@vercel/blob`'s `put()`.
- Catalog product links use the existing `GET /api/admin/search?q=...` route — no new product-search backend endpoint.
- No email attachments — only inline images embedded in the HTML body.
- `npx tsc --noEmit` must report zero errors at the end of every task.

---

## File Structure

- **Create:** `docs/supabase/migrations/011_contact_reply_body.sql` — adds `reply_body` column.
- **Modify:** `lib/email.ts` — add `sendContactReply()`.
- **Create:** `app/api/admin/communications/contacts/[id]/reply/route.ts` — sanitize, send, persist.
- **Create:** `app/api/admin/communications/contacts/upload/route.ts` — image upload for the composer.
- **Create:** `components/admin/communications/ContactReplyComposer.tsx` — the Tiptap composer (editor, toolbar, product-link picker, image upload, send/cancel).
- **Modify:** `app/admin/communications/page.tsx` — remove the `mailto:` link, add a "Reply" button + `replyingTo` state, render `ContactReplyComposer`, display a stored `reply_body` read-only.

---

### Task 1: Database migration and type update

**Files:**
- Create: `docs/supabase/migrations/011_contact_reply_body.sql`
- Modify: `app/admin/communications/page.tsx:25-34` (the `ContactMessage` interface)

**Interfaces:**
- Produces: `ContactMessage.reply_body: string | null`, consumed by Task 7 (display) and referenced by the API response shape in Tasks 2 and 4.

- [ ] **Step 1: Write the migration file**

```sql
-- 011_contact_reply_body.sql
-- Stores the HTML of the most recent in-app reply sent to a contact message.
-- Only the latest reply is kept — re-replying overwrites this column.

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS reply_body text;
```

- [ ] **Step 2: Run the migration**

Run this SQL in the Supabase Dashboard → SQL Editor (production project), or via the Supabase MCP `apply_migration` tool if available. Confirm success: `ALTER TABLE` with no errors, and `SELECT reply_body FROM contact_messages LIMIT 1;` returns a `reply_body` column (value `null` for existing rows) without error.

- [ ] **Step 3: Add the field to the `ContactMessage` interface**

Change (`app/admin/communications/page.tsx:25-34`) from:

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
}
```

to:

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

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors. (The `GET /api/admin/communications/contacts` route does a `select('*')`-equivalent fetch already returning all columns, so the new field will simply be `undefined`/absent in the JSON until Task 2 exists — TypeScript won't complain since the API response is parsed via `.then(setContacts)` without runtime validation, matching this codebase's existing convention of trusting API shapes.)

- [ ] **Step 5: Commit**

```bash
git add docs/supabase/migrations/011_contact_reply_body.sql "app/admin/communications/page.tsx"
git commit -m "feat: add reply_body column and type field for contact message replies"
```

---

### Task 2: `sendContactReply` email function and reply API route

**Files:**
- Modify: `lib/email.ts` (add new function, after `sendContactAdminAlert`)
- Create: `app/api/admin/communications/contacts/[id]/reply/route.ts`

**Interfaces:**
- Consumes: `resend` client and `FROM` constant already defined at the top of `lib/email.ts` (`const resend = new Resend(process.env.RESEND_API_KEY!)`, `const FROM = 'Acme Vintage Supply <hello@acmevintagesupply.com>'`).
- Produces: `sendContactReply(to: string, subject: string, html: string): Promise<void>`, consumed by this task's own route. The route `POST /api/admin/communications/contacts/[id]/reply` accepts `{ body: string }` and returns `{ ok: true, reply_body: string }` on success — consumed by Task 4's composer and Task 7's page wiring.

- [ ] **Step 1: Add `sendContactReply` to `lib/email.ts`**

Add this function after the existing `sendContactAdminAlert` function (which ends around line 210 — search for the function and add immediately after its closing `}`):

```ts
export async function sendContactReply(
  to:      string,
  subject: string,
  html:    string
): Promise<void> {
  await resend.emails.send({
    from:    FROM,
    to,
    subject: `Re: ${subject}`,
    html,
  })
}
```

- [ ] **Step 2: Install the sanitization dependency**

Run: `npm install isomorphic-dompurify`
Expected: adds `isomorphic-dompurify` to `package.json` dependencies with no install errors.

- [ ] **Step 3: Create the reply API route**

Create `app/api/admin/communications/contacts/[id]/reply/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { createClient } from '@supabase/supabase-js'
import DOMPurify from 'isomorphic-dompurify'
import { sendContactReply } from '@/lib/email'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = await req.json().catch(() => ({}))
  const { body: rawHtml } = body as { body?: string }
  if (!rawHtml?.trim()) {
    return NextResponse.json({ error: 'Reply body is required.' }, { status: 400 })
  }

  const cleanHtml = DOMPurify.sanitize(rawHtml)
  const supabase  = getSupabase()

  const { data: msg, error: fetchErr } = await supabase
    .from('contact_messages')
    .select('email, subject')
    .eq('id', id)
    .single()

  if (fetchErr || !msg) {
    return NextResponse.json({ error: 'Message not found.' }, { status: 404 })
  }

  try {
    await sendContactReply(msg.email, msg.subject, cleanHtml)
  } catch (err) {
    return NextResponse.json({ error: `Failed to send email: ${String(err)}` }, { status: 500 })
  }

  const { error: updateErr } = await supabase
    .from('contact_messages')
    .update({ replied_at: new Date().toISOString(), reply_body: cleanHtml })
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json({ error: 'Email sent, but failed to save reply record.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, reply_body: cleanHtml })
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 5: Manual check**

With the dev server running (`npm run dev`) and logged into `/admin`, use a tool like `curl` or a REST client to `POST` to `/api/admin/communications/contacts/<a real message id>/reply` with body `{ "body": "<p>Test reply</p>" }` (include your session cookie). Confirm: a real email arrives at that contact's email address from `hello@acmevintagesupply.com` with subject `Re: <original subject>`, and `SELECT reply_body, replied_at FROM contact_messages WHERE id = '<id>';` in Supabase shows the saved HTML and a timestamp.

- [ ] **Step 6: Commit**

```bash
git add lib/email.ts "app/api/admin/communications/contacts/[id]/reply/route.ts" package.json package-lock.json
git commit -m "feat: add sendContactReply function and reply API route"
```

---

### Task 3: Image upload route for the composer

**Files:**
- Create: `app/api/admin/communications/contacts/upload/route.ts`

**Interfaces:**
- Produces: `POST /api/admin/communications/contacts/upload` accepting `multipart/form-data` with a `file` field, returning `{ url: string }` on success — consumed by Task 5's composer image button.

- [ ] **Step 1: Create the upload route**

This mirrors `app/api/admin/content/upload/route.ts` exactly, except for the blob path prefix:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, and GIF images are allowed' }, { status: 400 })
  }

  const blob = await put(`contact-reply/${Date.now()}-${file.name}`, file, { access: 'public' })
  return NextResponse.json({ url: blob.url })
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Manual check**

With the dev server running and logged into `/admin`, POST a small JPEG/PNG file to `/api/admin/communications/contacts/upload` as `multipart/form-data` with field name `file` (e.g. via a REST client, or a temporary `<input type="file">` test page). Confirm the response is `{ "url": "https://...public blob url..." }` and that URL is reachable in a browser and shows the uploaded image.

- [ ] **Step 4: Commit**

```bash
git add "app/api/admin/communications/contacts/upload/route.ts"
git commit -m "feat: add image upload route for contact reply composer"
```

---

### Task 4: `ContactReplyComposer` — Tiptap editor with formatting toolbar

**Files:**
- Create: `components/admin/communications/ContactReplyComposer.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/communications/contacts/[id]/reply` from Task 2 (`{ body: string }` → `{ ok: true, reply_body: string }` or `{ error: string }`).
- Produces: `ContactReplyComposer` component with props `{ message: { id: string; name: string; email: string }; onSent: (replyBody: string) => void; onCancel: () => void; showToast: (message: string, type: 'success' | 'error') => void }`, consumed by Task 7's page wiring. This task builds the component with only the formatting toolbar (Bold/Italic/Underline/Bullet list/Numbered list) and Send/Cancel — no image or product-link buttons yet (those are Tasks 5 and 6).

- [ ] **Step 1: Install Tiptap dependencies**

Run: `npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-image @tiptap/extension-link`
Expected: all six packages added to `package.json` dependencies with no install errors.

- [ ] **Step 2: Create the composer component**

Create `components/admin/communications/ContactReplyComposer.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import {
  BiBold, BiItalic, BiUnderline, BiListUl, BiListOl,
} from 'react-icons/bi'

interface Props {
  message: { id: string; name: string; email: string }
  onSent:  (replyBody: string) => void
  onCancel: () => void
  showToast: (message: string, type: 'success' | 'error') => void
}

function buildGreeting(name: string): string {
  const firstName = name.trim().split(/\s+/)[0] || name
  return `<p>Hi ${firstName},</p><p></p><p></p><p>Best regards,<br>Acme Vintage Supply</p>`
}

export default function ContactReplyComposer({ message, onSent, onCancel, showToast }: Props) {
  const [sending, setSending] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content: buildGreeting(message.name),
  })

  async function handleSend() {
    if (!editor) return
    const html = editor.getHTML()
    setSending(true)
    try {
      const res  = await fetch(`/api/admin/communications/contacts/${message.id}/reply`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ body: html }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send reply')
      showToast('Reply sent.', 'success')
      onSent(data.reply_body as string)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send reply', 'error')
    } finally {
      setSending(false)
    }
  }

  if (!editor) return null

  return (
    <div className="border border-(--admin-border) rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-(--admin-surface-2) border-b border-(--admin-border)">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${editor.isActive('bold') ? 'bg-(--admin-accent) text-(--admin-accent-text)' : 'text-(--admin-text-soft) hover:bg-(--admin-border)'}`}
          title="Bold"
        >
          <BiBold size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${editor.isActive('italic') ? 'bg-(--admin-accent) text-(--admin-accent-text)' : 'text-(--admin-text-soft) hover:bg-(--admin-border)'}`}
          title="Italic"
        >
          <BiItalic size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${editor.isActive('underline') ? 'bg-(--admin-accent) text-(--admin-accent-text)' : 'text-(--admin-text-soft) hover:bg-(--admin-border)'}`}
          title="Underline"
        >
          <BiUnderline size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${editor.isActive('bulletList') ? 'bg-(--admin-accent) text-(--admin-accent-text)' : 'text-(--admin-text-soft) hover:bg-(--admin-border)'}`}
          title="Bullet list"
        >
          <BiListUl size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${editor.isActive('orderedList') ? 'bg-(--admin-accent) text-(--admin-accent-text)' : 'text-(--admin-text-soft) hover:bg-(--admin-border)'}`}
          title="Numbered list"
        >
          <BiListOl size={15} />
        </button>
      </div>

      {/* Editor */}
      <div className="px-3 py-2 min-h-32 max-h-72 overflow-y-auto text-[13px] text-(--admin-text)">
        <EditorContent editor={editor} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-(--admin-border) bg-(--admin-surface-2)">
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send Reply'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={sending}
          className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-muted) bg-(--admin-surface) border border-(--admin-border) rounded hover:bg-(--admin-border) transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors. (This component isn't wired into any page yet — that's Task 7 — so this step only confirms the file itself type-checks in isolation.)

- [ ] **Step 4: Commit**

```bash
git add components/admin/communications/ContactReplyComposer.tsx package.json package-lock.json
git commit -m "feat: add ContactReplyComposer with Tiptap formatting toolbar"
```

---

### Task 5: Image upload button in the composer

**Files:**
- Modify: `components/admin/communications/ContactReplyComposer.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/communications/contacts/upload` from Task 3 (`multipart/form-data` with `file` field → `{ url: string }` or `{ error: string }`).

- [ ] **Step 1: Add the image extension's active state icon and a hidden file input**

Add `BiImageAdd` to the existing icon import line:

```tsx
import {
  BiBold, BiItalic, BiUnderline, BiListUl, BiListOl, BiImageAdd,
} from 'react-icons/bi'
```

- [ ] **Step 2: Add an image upload handler**

Add this function inside the component, after `handleSend`:

```tsx
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !editor) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res  = await fetch('/api/admin/communications/contacts/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to upload image')
      editor.chain().focus().setImage({ src: data.url }).run()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to upload image', 'error')
    }
  }
```

- [ ] **Step 3: Add the toolbar button and hidden file input**

In the toolbar `<div>`, immediately after the "Numbered list" button's closing `</button>` and before the toolbar `</div>` closes, add:

```tsx
        <label
          className="w-7 h-7 flex items-center justify-center rounded transition-colors text-(--admin-text-soft) hover:bg-(--admin-border) cursor-pointer"
          title="Insert image"
        >
          <BiImageAdd size={15} />
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} className="hidden" />
        </label>
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add components/admin/communications/ContactReplyComposer.tsx
git commit -m "feat: add image upload button to reply composer"
```

---

### Task 6: Catalog product link picker in the composer

**Files:**
- Modify: `components/admin/communications/ContactReplyComposer.tsx`

**Interfaces:**
- Consumes: `GET /api/admin/search?q=...` (existing route, returns `{ products: { handle: string; title: string }[], orders: [...], customers: [...] }`).

- [ ] **Step 1: Add `BiLink` to the icon imports**

Change the icon import line from Task 5 to:

```tsx
import {
  BiBold, BiItalic, BiUnderline, BiListUl, BiListOl, BiImageAdd, BiLink,
} from 'react-icons/bi'
```

- [ ] **Step 2: Add product-picker state and search logic**

Add these near the top of the component, after the `sending` state declaration:

```tsx
  const [pickerOpen,    setPickerOpen]    = useState(false)
  const [pickerQuery,   setPickerQuery]   = useState('')
  const [pickerResults, setPickerResults] = useState<{ handle: string; title: string }[]>([])

  async function searchProducts(q: string) {
    setPickerQuery(q)
    if (!q.trim()) { setPickerResults([]); return }
    const res  = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setPickerResults(res.ok ? (data.products ?? []) : [])
  }

  function insertProductLink(product: { handle: string; title: string }) {
    if (!editor) return
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmevintagesupply.com'
    editor.chain().focus().insertContent(
      `<a href="${site}/catalog/${product.handle}">${product.title}</a>`
    ).run()
    setPickerOpen(false)
    setPickerQuery('')
    setPickerResults([])
  }
```

- [ ] **Step 3: Add the toolbar button**

In the toolbar `<div>`, immediately after the image `<label>` added in Task 5, add:

```tsx
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen(o => !o)}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors text-(--admin-text-soft) hover:bg-(--admin-border)"
            title="Insert product link"
          >
            <BiLink size={15} />
          </button>
          {pickerOpen && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-(--admin-surface) border border-(--admin-border) rounded-md shadow-xl z-50 p-2">
              <input
                autoFocus
                type="text"
                value={pickerQuery}
                onChange={e => searchProducts(e.target.value)}
                placeholder="Search products…"
                className="w-full h-8 px-2 text-[12px] bg-(--admin-surface-2) border border-(--admin-border) rounded-md text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none"
              />
              <div className="mt-2 max-h-48 overflow-y-auto">
                {pickerQuery.trim() && pickerResults.length === 0 && (
                  <p className="text-[11px] text-(--admin-text-muted) px-1 py-2">No products found.</p>
                )}
                {pickerResults.map(p => (
                  <button
                    key={p.handle}
                    type="button"
                    onClick={() => insertProductLink(p)}
                    className="w-full text-left px-2 py-1.5 text-[12px] text-(--admin-text) hover:bg-(--admin-surface-2) rounded transition-colors truncate"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add components/admin/communications/ContactReplyComposer.tsx
git commit -m "feat: add catalog product link picker to reply composer"
```

---

### Task 7: Wire the composer into the Contact Inbox page

**Files:**
- Modify: `app/admin/communications/page.tsx`

**Interfaces:**
- Consumes: `ContactReplyComposer` from Task 6 (props: `message: { id, name, email }`, `onSent: (replyBody: string) => void`, `onCancel: () => void`, `showToast`), `ContactMessage.reply_body` field from Task 1.

- [ ] **Step 1: Import the composer**

Add near the top imports (after the existing `import Toast, { ToastType } from '@/components/admin/shared/Toast'` line):

```tsx
import ContactReplyComposer from '@/components/admin/communications/ContactReplyComposer'
```

- [ ] **Step 2: Add `replyingTo` state**

Change the Inbox state block from:

```tsx
  // Inbox state
  const [contacts,      setContacts]      = useState<ContactMessage[]>([])
  const [contactLoad,   setContactLoad]   = useState(true)
  const [openMsg,       setOpenMsg]       = useState<string | null>(null)
  const [inboxFilter,   setInboxFilter]   = useState<'all' | 'unread' | 'replied'>('all')
```

to:

```tsx
  // Inbox state
  const [contacts,      setContacts]      = useState<ContactMessage[]>([])
  const [contactLoad,   setContactLoad]   = useState(true)
  const [openMsg,       setOpenMsg]       = useState<string | null>(null)
  const [inboxFilter,   setInboxFilter]   = useState<'all' | 'unread' | 'replied'>('all')
  const [replyingTo,    setReplyingTo]    = useState<string | null>(null)
```

- [ ] **Step 3: Remove the mailto link and add a "Reply" button**

Change (`page.tsx:443-450`) from:

```tsx
                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                          onClick={() => patchContact(msg.id, { markReplied: true })}
                          className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded hover:opacity-90 transition-opacity"
                        >
                          <BiEnvelope size={13} /> Reply via email
                        </a>
```

to:

```tsx
                      <div className="flex items-center gap-2">
                        {replyingTo !== msg.id && (
                          <button
                            onClick={() => setReplyingTo(msg.id)}
                            className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded hover:opacity-90 transition-opacity"
                          >
                            <BiEnvelope size={13} /> Reply
                          </button>
                        )}
```

- [ ] **Step 4: Add the composer and stored-reply display**

Immediately after the action-row `</div>` (the one closed right after the "Mark read"/"Mark unread" button, i.e. right before the expanded message section's own closing `</div>` at line 467), add:

```tsx
                      {msg.reply_body && replyingTo !== msg.id && (
                        <div className="mt-3">
                          <p className="text-[11px] font-medium text-(--admin-text-muted) mb-1">Your reply:</p>
                          <div
                            className="bg-(--admin-bg) rounded-md p-4 border border-(--admin-border) text-[13px] text-(--admin-text)"
                            dangerouslySetInnerHTML={{ __html: msg.reply_body }}
                          />
                        </div>
                      )}
                      {replyingTo === msg.id && (
                        <div className="mt-3">
                          <ContactReplyComposer
                            message={{ id: msg.id, name: msg.name, email: msg.email }}
                            onSent={(replyBody) => {
                              setContacts(cs => cs.map(c =>
                                c.id === msg.id
                                  ? { ...c, replied_at: new Date().toISOString(), reply_body: replyBody }
                                  : c
                              ))
                              setReplyingTo(null)
                            }}
                            onCancel={() => setReplyingTo(null)}
                            showToast={showToast}
                          />
                        </div>
                      )}
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 6: Manual check**

Run `npm run dev`, open `/admin/communications`, click into the Contact Inbox tab, expand a message, click **Reply**. Confirm:
- The composer opens with the greeting/signature pre-filled.
- Bold/Italic/Underline/Bullet list/Numbered list all work in the live editor.
- Clicking the image button uploads and inserts an image.
- Clicking the link button, searching a real product, and selecting it inserts a link to `/catalog/{handle}`.
- Clicking **Send Reply** sends a real email (check a real inbox you control) and the composer closes, replaced by a "Your reply:" read-only box showing the sent HTML.
- Reloading the page still shows the "Your reply:" box (confirms persistence).
- No `mailto:` link remains anywhere in the UI.

- [ ] **Step 7: Commit**

```bash
git add "app/admin/communications/page.tsx"
git commit -m "feat: wire ContactReplyComposer into Contact Inbox, remove mailto link"
```

---

### Task 8: Final full verification pass

**Files:** none (manual verification only, consistent with this codebase's existing precedent — no automated test suite for UI here)

- [ ] **Step 1: Send a second reply to the same message**

Confirm the "Your reply:" box updates to show the new content (not both old and new appended) — verifies `reply_body` is overwritten, not accumulated, per the plan's single-latest-reply design.

- [ ] **Step 2: Test the Cancel button**

Open the composer, type something, click **Cancel**. Confirm it closes without sending an email and without altering `replied_at`/`reply_body`.

- [ ] **Step 3: Test error handling**

Temporarily disconnect from the internet or use an invalid product search query with zero results — confirm "No products found." shows correctly in the product picker, and confirm a failed send (e.g. by temporarily breaking `RESEND_API_KEY` locally, if safe to test) shows a toast error rather than silently failing or crashing the page.

- [ ] **Step 4: Confirm no regressions elsewhere on the Communications page**

Check the Restock Waitlist and Bench Notes tabs still work exactly as before — this plan's changes are scoped entirely to the Contact Inbox tab's reply mechanism.

- [ ] **Step 5: Final type check**

Run: `npx tsc --noEmit`
Expected: zero errors.

---

## Self-Review Notes

- **Spec coverage:** All spec requirements covered — inline reply box under the message (Task 7), `hello@acmevintagesupply.com` sender reused (Task 2), `reply_body` storage with overwrite-not-append semantics (Task 2's `.update()`, verified in Task 8 Step 1), greeting/signature pre-fill (Task 4's `buildGreeting`), mailto fully removed (Task 7 Step 3), Tiptap with Bold/Italic/Underline/Bullet/Numbered/Link/Image toolbar (Tasks 4-6), image upload via `@vercel/blob` matching the existing CMS upload pattern (Task 3), catalog product links reusing `/api/admin/search` (Task 6), server-side sanitization via `isomorphic-dompurify` (Task 2).
- **Placeholder scan:** No TBD/TODO — every step has complete, exact code with full file paths.
- **Type consistency:** `ContactReplyComposer`'s `message` prop shape (`{ id: string; name: string; email: string }`) introduced in Task 4 is used identically in Task 7's usage (`message={{ id: msg.id, name: msg.name, email: msg.email }}`). The reply API's response shape `{ ok: true, reply_body: string }` (Task 2) matches exactly what Task 4's `handleSend` destructures (`data.reply_body as string`) and what Task 7's `onSent` callback expects (`replyBody: string`). `ContactMessage.reply_body: string | null` (Task 1) matches the field name used in Task 7's `msg.reply_body` checks and the Supabase column name (`reply_body`) used in Task 2's route.
