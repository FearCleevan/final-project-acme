# Email Templates — Design Spec
**Date:** 2026-06-26
**Feature:** Pre-built Acme branded email template layouts for the admin Marketing page

---

## Overview

Replace the current plain-text compose form with a template-aware campaign composer. Scott selects one of 3 pre-built branded templates, fills in the relevant slots, previews the real layout, and sends. No HTML knowledge required.

---

## Templates

### 1. Bench Notes *(default — personal letter)*
A warm, personal note from the workshop. The default template — same visual style as today's emails.

**Fields:**
- Subject (required)
- Greeting line — editable, pre-filled with "A note from the bench."
- Body — textarea, each line becomes a paragraph (existing behaviour)
- CTA Label + URL — optional

**Renders as:** Georgia serif letter on parchment background. No product cards.

---

### 2. New Arrivals *(product showcase)*
Highlights up to 3 products from the live Shopify catalog.

**Fields:**
- Subject (required)
- Intro line — one short sentence, required (e.g. "Fresh pieces just landed at the workshop.")
- Product picker — search Shopify catalog, select up to 3 products. Each slot auto-fills: image, name, price, handle/link.
- CTA Label + URL — optional (e.g. "Shop all new arrivals →")

**Renders as:** Intro paragraph + 1–3 product cards (image left, name + price + link right) + optional CTA button.

**Product picker behaviour:**
- Search input hits existing `/api/search` endpoint with 300ms debounce
- Results dropdown shows product thumbnail + name + price
- Click to add — slot appears below search box with ✕ remove button
- Max 3 products — search box hides after 3 selected
- Switching away from this template clears selected products

---

### 3. Seasonal Sale *(promo with urgency)*
A promotional email with a discount code and urgency line.

**Fields:**
- Subject (required)
- Headline — required (e.g. "Summer clearance — 20% off selected lamps")
- Body — textarea, sale description (required)
- Discount Code — text field, renders as a styled code badge (e.g. `SUMMER20`)
- Sale End Date — optional date picker, renders as "Offer ends [date]"
- CTA Label + URL — both required for this template

**Renders as:** Bold headline, body paragraphs, prominent discount code badge, optional urgency line, green CTA button.

---

## UI — Compose Panel Changes

### Template Selector
Three styled cards appear at the top of the compose panel (above Subject):

```
[ Bench Notes ]  [ New Arrivals ]  [ Seasonal Sale ]
  Personal letter   Product showcase   Promo + code
```

- Active card highlighted in green (`--admin-accent`)
- Switching template: Subject + CTA fields are preserved; template-specific fields reset
- Default selection: Bench Notes

### Field Rendering
Fields below the template selector are rendered conditionally based on active template. No hidden fields — only relevant inputs shown.

### Preview
The existing iframe preview (`buildPreviewHtml()`) is template-aware — renders the correct branded HTML layout for the selected template, not generic plain-text.

---

## Data — Database Changes

### Migration (Supabase)
```sql
ALTER TABLE email_campaigns
  ADD COLUMN template      text NOT NULL DEFAULT 'bench_notes',
  ADD COLUMN template_data jsonb;
```

### Column Definitions

| Column | Type | Purpose |
|---|---|---|
| `template` | text | One of: `bench_notes`, `new_arrivals`, `seasonal_sale` |
| `template_data` | jsonb | Template-specific structured slot data |

### Column reuse across templates

The existing `body` column stores the main text content for every template — nothing wasted:

| Template | `body` stores | `template_data` stores |
|---|---|---|
| bench_notes | Letter body paragraphs | `{ greeting }` |
| new_arrivals | Intro line | `{ products: [...] }` |
| seasonal_sale | Sale description paragraphs | `{ headline, discountCode, saleEndDate? }` |

### template_data Shape Per Template

**bench_notes:**
```json
{ "greeting": "A note from the bench." }
```

**new_arrivals:**
```json
{
  "products": [
    { "title": "Coleman Pressure Lamp", "price": "$75.00", "imageUrl": "https://cdn.shopify.com/...", "handle": "coleman-pressure-lamp" }
  ]
}
```

**seasonal_sale:**
```json
{
  "headline": "Summer clearance — 20% off selected lamps",
  "discountCode": "SUMMER20",
  "saleEndDate": "2026-07-31"
}
```

### Backward Compatibility
Existing campaigns have no `template` value — the migration default `bench_notes` ensures they render correctly. `template_data: null` is handled gracefully in all renderers.

---

## Email Rendering — lib/email.ts

`sendNewsletter()` gains two new params: `template` and `template_data`. It routes to the correct HTML builder:

```
buildBenchNotesHtml(campaign)    → string
buildNewArrivalsHtml(campaign)   → string
buildSeasonalSaleHtml(campaign)  → string
```

Each builder returns the full email HTML string using the existing design tokens:
- Background: `#FDFAF6` (parchment)
- Text: `#2C2C2A`
- Soft text: `#6B6257`
- CTA button: `#2C5F2E` green, `#F5F1E6` text
- Font: Georgia, serif
- Max width: 560px

The batching + Resend send logic in `sendNewsletter()` is untouched.

---

## API Changes

### POST /api/admin/marketing/campaigns
New optional fields accepted in request body:
```json
{
  "template": "new_arrivals",
  "template_data": { ... }
}
```

Stored as-is in Supabase. Existing `subject`, `body`, `cta_label`, `cta_url` fields unchanged.

### GET /api/admin/marketing/campaigns
Returns `template` and `template_data` in each campaign row (add to SELECT).

### POST /api/admin/marketing/campaigns/[id]/send
Passes `template` and `template_data` through to `sendNewsletter()`. No other changes.

---

## Files Changed

| File | Change |
|---|---|
| `app/admin/marketing/page.tsx` | Template selector UI + per-template field sets + product picker component + template-aware preview |
| `lib/email.ts` | `buildBenchNotesHtml()`, `buildNewArrivalsHtml()`, `buildSeasonalSaleHtml()` builders + `sendNewsletter()` updated |
| `app/api/admin/marketing/campaigns/route.ts` | Accept + store `template` + `template_data` |
| `app/api/admin/marketing/campaigns/[id]/send/route.ts` | Pass `template` + `template_data` to `sendNewsletter()` |
| Supabase | Migration: add `template` + `template_data` columns to `email_campaigns` |

---

## Out of Scope
- Drag-and-drop builder
- Custom HTML paste
- Template editing/saving as reusable layouts
- Image upload for product slots (uses Shopify CDN URLs only)
