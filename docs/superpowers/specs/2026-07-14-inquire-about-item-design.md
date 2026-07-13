# Inquire About This Item — Design Spec

**Status:** Approved
**Owner:** Peter (dev), for Acme Vintage Supply storefront

## Problem

A product with no price or image set yet (`components/product/ProductInfo.tsx`, `noPrice` case) shows a dead-end "Not yet available for purchase — price coming soon" notice with no other action available. More generally, a customer with a genuine question about any product (fitment, condition, shipping timing) has no per-product way to ask — only the general site-wide Contact Us form, which loses the product context entirely.

## Goal

Add an "Inquire about this item" action to every product detail page, reusing the existing general Contact Us backend and the Admin Dashboard's Contact Inbox / rich-text reply pipeline already built, rather than introducing new infrastructure.

## Scope Decisions (from brainstorming)

- **Appears on every product page**, not just no-price/no-image ones — a fitment or condition question is a legitimate use case on a fully-listed item too. It's especially load-bearing on incomplete listings, where it's currently the only available action.
- **Collapsed by default**, expanding inline on click — matches the existing `NotifyMeForm` pattern already on this page, so fully-listed products aren't cluttered with an always-open form.
- **Form fields: Name, Email, Message.** Subject is generated server-side from the product name, not typed by the customer — lighter than the general Contact Us form's four fields, but still gives the admin a name to address in a reply (unlike a bare email-only form).
- **Two new nullable columns on `contact_messages`: `product_handle`, `product_title`.** Chosen over embedding the product name only in free text, so the admin Contact Inbox can display and eventually link back to the specific product cleanly, without parsing subject/message text.
- **Reuses `app/api/contact/route.ts` as-is** — no new API route, no new table. The existing route gains two optional fields; general Contact Us submissions (footer, `/contact` page) simply omit them and are entirely unaffected.

## Current State (reference)

- `app/api/contact/route.ts`: validates `{ name, email, subject, message }` all non-empty, inserts into `contact_messages`, fires `sendContactAdminAlert({ name, email, subject, message })` from `lib/email.ts`.
- `contact_messages` schema (`docs/supabase/migrations/006_communications.sql`): `id, name, email, subject, message, read_at, replied_at, created_at`.
- `components/product/NotifyMeForm.tsx`: the closest existing analogous pattern on this exact page — a `'use client'` component with local `idle/loading/done/already/error` status state, an inline single-field form, a small labeled info box above it (`border border-ink-rule rounded-sm px-4 py-3 bg-parchment-2`), and success/error states rendered as their own small bordered boxes. This new component should follow the identical visual/interaction conventions.
- `components/product/ProductInfo.tsx`: the CTA area (`{/* Add to crate CTA — or notify-me form when out of stock or price not set yet */}`) is where `NotifyMeForm` and the no-price notice currently render — the new inquiry link/form slots in immediately after that block, present in all three CTA states (normal Add to Crate, out-of-stock/NotifyMeForm, no-price notice).
- Contact Inbox (`app/admin/communications/page.tsx`) and the rich-text reply composer (`components/admin/communications/ContactReplyComposer.tsx`, Tiptap + Resend, built earlier this session) already render/operate on `contact_messages` rows generically — no changes needed there to make replying work, only an optional display enhancement (see below) to distinguish a product inquiry from a general message.
- Migration numbering: latest existing migration is `013_campaign_recipients.sql` — this feature's migration is `014_contact_product_reference.sql`.

## Non-Goals

- No new API route — `app/api/contact/route.ts` is extended, not duplicated.
- No new database table — `contact_messages` gains two nullable columns, nothing else.
- Not building a "jump to product" link in the admin reply composer in this pass — the `product_handle`/`product_title` columns are captured now so that's possible later, but wiring an actual clickable link in the admin UI is not required for this feature to be complete.
- Not changing the general Contact Us form (footer/`/contact` page) — it continues to omit `product_handle`/`product_title`, submitting exactly as it does today.

## Architecture / Data Flow

1. **New migration** `docs/supabase/migrations/014_contact_product_reference.sql`: `ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS product_handle text; ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS product_title text;` (both nullable, no default).
2. **`app/api/contact/route.ts`**: destructure two additional optional fields, `product_handle` and `product_title`, from the request body. Include them in the `contact_messages` insert as `product_handle ?? null` / `product_title ?? null`. No change to the existing required-field validation (`name`, `email`, `subject`, `message` still all required) — `subject` continues to be supplied by the caller, which for the new inquiry form means the client constructs it as `Product inquiry: {productTitle}` before submitting (server does not need to know this is a special case — from the route's point of view it's just another contact form submission with two extra optional columns to persist).
3. **New component** `components/product/ProductInquiryForm.tsx`, modeled directly on `NotifyMeForm.tsx`'s structure and Tailwind classes:
   - Collapsed state: a text link/button reading "Inquire about this item."
   - Expanded state (on click): a small labeled box ("Ask about this item — we'll reply by email.") followed by a form with Name, Email, and a Message textarea, and a Send button.
   - On submit: POSTs to `/api/contact` with `{ name, email, subject: `Product inquiry: ${productTitle}`, message, product_handle: productHandle, product_title: productTitle }`.
   - Status states mirror `NotifyMeForm`: `idle → loading → done` (success box: "Thanks — we'll get back to you at {email}.") or `error` (inline error text, form remains editable to retry).
4. **`components/product/ProductInfo.tsx`**: import and render `<ProductInquiryForm productHandle={product.slug} productTitle={product.name} />` immediately after the existing CTA block (Add to Crate button / NotifyMeForm / no-price notice), so it's present in all three states without altering any of them.
5. **Admin Contact Inbox display enhancement** (`app/admin/communications/page.tsx`): the `ContactMessage` interface gains `product_handle: string | null` and `product_title: string | null`. When `product_title` is present, the message row shows a small tag/label (e.g. "Product inquiry: {product_title}") distinguishing it from a general contact message, using the existing `Badge` component already used elsewhere on this page for consistent styling.

## Error Handling

Identical to the existing Contact Us form's behavior, since this reuses the same route: missing required fields → 400 from the server (client-side also validates before submit, mirroring `NotifyMeForm`'s `if (!email.trim()) return` pattern extended to all three required fields); network/server failure → `error` status shown inline, form remains filled in and editable so the customer can retry without re-typing.

## Testing

Manual, consistent with this codebase's existing precedent (no automated UI test suite):
- Submit an inquiry on a fully-priced, fully-photographed product — confirm it appears in the admin Contact Inbox tagged "Product inquiry: {title}", and that a reply sent via the existing rich-text composer is received correctly.
- Submit an inquiry on a no-price/no-image product (e.g. one of the chimney/glass items) — confirm the same, and confirm the inquiry link is visible even though the Add to Crate button is replaced by the "Not yet available for purchase" notice.
- Confirm the general Contact Us form (footer or `/contact` page) still submits successfully with `product_handle`/`product_title` simply absent/null on those rows.
- Confirm collapsing/expanding the inquiry form doesn't interfere with the existing NotifyMeForm's own expand/collapse state when both are present on an out-of-stock, no-price product (edge case: a product could theoretically be both out-of-stock and have no price).
- `npx tsc --noEmit` — zero errors.
