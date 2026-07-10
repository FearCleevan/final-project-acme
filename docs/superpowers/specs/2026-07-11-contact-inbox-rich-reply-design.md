# Contact Inbox In-App Rich Reply — Design Spec

**Status:** Approved
**Owner:** Peter (dev), for Acme Vintage Supply admin dashboard

## Problem

The Contact Inbox's "Reply via email" button (`app/admin/communications/page.tsx:444-450`) is a `mailto:` link — it hands off to whatever email client is registered as the OS/browser default. On Scott's Chrome + Windows setup, nothing happens when clicked, because no default mail handler is registered. This isn't fixable in-app (it's an OS/browser configuration issue on the client's machine), and depending on a customer-facing feature working only if every admin user has correctly configured their personal computer is fragile.

Separately, Scott wants the ability to format replies (bold, italic, underline, lists), embed resizable images, and link directly to catalog products — none of which a `mailto:` link (or a plain textarea) can do.

## Goal

Replace the `mailto:` link with an in-app reply composer that sends the email directly via Resend (already used for every other transactional email in this codebase, via `lib/email.ts`) and supports rich formatting, image embedding, and one-click catalog product links.

## Scope Decisions (from brainstorming)

- **Reply box location:** inline, expands under the message inside the existing `openMsg === msg.id` expanded section (`page.tsx:434-468`) — no modal.
- **Sender address:** reuse `hello@acmevintagesupply.com`, the same `FROM` constant already used by every function in `lib/email.ts`. No new reply-to address.
- **Reply storage:** the sent reply's HTML is stored in a new `reply_body` column on `contact_messages` (nullable `text`), so a past reply is visible on later visits. Only the most recent reply is stored — this is not a full email thread system (no thread table, no reply history array). Re-replying overwrites the previously stored `reply_body`.
- **Template pre-fill:** the composer opens pre-filled with:
  ```
  Hi {first name of msg.name},



  Best regards,
  Acme Vintage Supply
  ```
- **Mailto fully replaced:** the `<a href="mailto:...">` is deleted entirely, not kept as a fallback.
- **Rich text editor:** Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-image`, `@tiptap/extension-link`) — chosen because it's the most actively maintained React rich-text editor and outputs HTML directly, matching what `resend.emails.send({ html: ... })` already expects everywhere else in this codebase. No existing rich text editor exists anywhere in this codebase (confirmed via search) — this is a new dependency.
- **Toolbar:** Bold, Italic, Underline, Bullet list, Numbered list, Link, Image, "Insert product link" — 8 buttons.
- **Images:** uploaded via a new route following the exact existing pattern in `app/api/admin/content/upload/route.ts` (same `@vercel/blob` `put()` call, same allowed-type validation). Resizing is handled by Tiptap's image node drag handles — no separate resize UI needed.
- **Catalog links:** a toolbar button opens a small product search that reuses the existing `GET /api/admin/search?q=...` route (already returns `{ products: AdminProduct[], ... }` filtered server-side) — picking a product inserts a link to `{SITE}/catalog/{handle}` with the product title as link text, via Tiptap's Link extension.
- **Sanitization:** new dependency `isomorphic-dompurify`, used server-side in the new reply-send route to sanitize the Tiptap HTML before it's ever emailed or stored — a safety net since stored replies are later re-displayed via `dangerouslySetInnerHTML`, even though this whole surface is authenticated-admin-only (not public-facing).

## Current State (reference)

- `app/admin/communications/page.tsx`: client component, `ContactMessage` interface (`id, name, email, subject, message, read_at, replied_at, created_at`), `openMsg: string | null` state controls which message is expanded, `patchContact(id, patch)` helper PATCHes `/api/admin/communications/contacts/[id]` and optimistically updates local state.
- `app/api/admin/communications/contacts/[id]/route.ts`: `PATCH` (supports `{ markRead }`, `{ unread }`, `{ markReplied }`) and `DELETE`. This route is untouched by this spec — it stays for the manual "mark replied without emailing" case.
- `lib/email.ts`: `const FROM = 'Acme Vintage Supply <hello@acmevintagesupply.com>'`, `const resend = new Resend(process.env.RESEND_API_KEY!)`. Existing functions (`sendBackInStockEmail`, `sendPackedAtWorkshopEmail`, `sendNewOrderAdminAlert`, `sendContactAdminAlert`, `sendNewsletter`) all follow the same `resend.emails.send({ from: FROM, to, subject, html })` shape.
- `app/api/admin/content/upload/route.ts`: existing image upload pattern — validates `file.type` against `['image/jpeg', 'image/png', 'image/webp', 'image/gif']`, calls `put(`cms/${Date.now()}-${file.name}`, file, { access: 'public' })` from `@vercel/blob`, returns `{ url: blob.url }`.
- `app/api/admin/search/route.ts`: `GET` route, requires auth, returns `{ products: AdminProduct[], orders: AdminOrder[], customers: AdminCustomer[] }` filtered by a `q` query param, 30-second in-memory cache. `AdminProduct` has `handle` and `title` fields (`lib/admin/types.ts`).
- `docs/supabase/migrations/006_communications.sql`: current `contact_messages` schema — `id uuid, name text, email text, subject text, message text, read_at timestamptz, replied_at timestamptz, created_at timestamptz`.
- `NEXT_PUBLIC_SITE_URL` env var (fallback `https://acmevintagesupply.com`), already used in `lib/email.ts` as `SITE`, catalog URLs follow the pattern `${SITE}/catalog/${handle}`.

## Non-Goals

- No full email thread/conversation history — only the latest reply's HTML is stored, overwriting any previous one.
- No new reply-to address — reuses `hello@acmevintagesupply.com` exactly as already used elsewhere.
- Not touching the existing PATCH route's `markReplied` behavior — it remains for manual (non-emailed) replies.
- Not building a general-purpose rich text editor component library — this is a single, purpose-built composer for this one feature.
- Not adding email attachments (files) — only inline images embedded in the HTML body via Tiptap's image node, no separate file-attachment UI.

## Architecture / Data Flow

1. **New migration** `docs/supabase/migrations/011_contact_reply_body.sql`: `ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS reply_body text;`
2. **New route** `POST /api/admin/communications/contacts/[id]/reply`: accepts `{ body: string }` (Tiptap HTML output). Server sanitizes with `isomorphic-dompurify`, looks up the target `contact_messages` row (for `name`, `email`, `subject`), calls a new `sendContactReply()` function in `lib/email.ts`, then on success updates `contact_messages` setting `replied_at = now()` and `reply_body = <sanitized html>` in one Supabase call. Returns the updated row (or just `{ ok: true }`, matching the existing PATCH route's response shape) so the client can update local state without a refetch.
3. **New function** `sendContactReply(to: string, subject: string, html: string): Promise<void>` in `lib/email.ts`, following the exact `resend.emails.send({ from: FROM, to, subject: `Re: ${subject}`, html })` shape already used by every other function in that file.
4. **New upload route** `app/api/admin/communications/contacts/upload/route.ts`: byte-for-byte the same pattern as `app/api/admin/content/upload/route.ts`, except the blob path prefix is `contact-reply/` instead of `cms/`.
5. **Client component changes** in `app/admin/communications/page.tsx`:
   - New state: `replyingTo: string | null` (which message's composer is open), `sendingReply: boolean` (loading state during send, matching the existing `notifying` pattern used for waitlist).
   - The mailto `<a>` (lines 444-450) is deleted and replaced with a **"Reply"** `<button>` that sets `replyingTo` to the message id (closing any other open composer first, only one open at a time).
   - When `replyingTo === msg.id`, render a new `<ContactReplyComposer>` component (new file `components/admin/communications/ContactReplyComposer.tsx`) below the message body, passing `msg`, an `onSent(replyBody: string)` callback (updates the message's `replied_at`/`reply_body` in local `contacts` state, same optimistic-update pattern as `patchContact`), and an `onCancel()` callback (clears `replyingTo`).
   - If `msg.reply_body` is already set (from a prior reply), it's displayed read-only above the "Reply" button (e.g. in a bordered box labeled "Your reply:"), rendered via `dangerouslySetInnerHTML` (safe here since it was already sanitized server-side before storage).
6. **New component** `components/admin/communications/ContactReplyComposer.tsx`: wraps a Tiptap `useEditor` instance (StarterKit + Underline + Image + Link extensions), a toolbar row of 8 buttons wired to `editor.chain().focus().toggle*().run()` calls, an "Insert product link" button that opens a small inline product search (reusing `GET /api/admin/search?q=...`, filtering to `.products`, showing up to 5 results, clicking one calls `editor.chain().focus().insertContent(...)` with an `<a>` tag pointing at `${SITE}/catalog/${handle}`), an image-upload button (`<input type="file">` → POSTs to the new upload route → `editor.chain().focus().setImage({ src: url }).run()`), and Send/Cancel buttons. On Send: `editor.getHTML()` is POSTed to the new reply route; on success calls `onSent`; on failure shows a toast (passed down as a prop, reusing the parent page's existing `showToast`).

## Error Handling

- If Resend fails inside the new route, nothing is marked replied and no `reply_body` is saved — mirrors the existing all-or-nothing pattern (e.g. `sendOtpEmail` throwing stops the login flow rather than partially succeeding).
- If the image upload fails (wrong file type, network error), the composer shows an inline error and does not insert a broken image node.
- If the product search returns no results, the picker shows "No products found" (matching the existing empty-state copy pattern in `AdminTopbar.tsx`'s `SearchDropdown`).

## Testing

Manual only, consistent with this codebase's existing precedent for email/print features (no automated test suite for UI here):
- Open a real contact message, click Reply, confirm the composer opens pre-filled with the greeting/signature template.
- Apply Bold, Italic, Underline, a bullet list, and a numbered list; confirm each renders correctly in the live editor.
- Upload an image, confirm it appears and can be resized via drag handles.
- Use "Insert product link," search for a real product, confirm the inserted link points at the correct `/catalog/{handle}` URL.
- Click Send, confirm a real email arrives at a test inbox from `hello@acmevintagesupply.com` with the formatted HTML intact (bold/italic/underline/lists/image/link all render in the received email).
- Reload the page, confirm the stored reply displays read-only under the original message.
- Confirm the old `mailto:` link is completely gone from the UI.
- Send a second reply to the same message, confirm the stored `reply_body` is overwritten with the new one (not appended).
- `npx tsc --noEmit` — zero errors.
