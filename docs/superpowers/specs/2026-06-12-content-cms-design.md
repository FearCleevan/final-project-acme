# Content CMS — Design Spec

**Date:** 2026-06-12

## Goal

Build a custom CMS inside the admin dashboard that lets Scott (and Jonathan) edit all storefront content — text, images, testimonials, FAQ, shipping, returns — without touching code or triggering a redeploy. Changes go live the moment Save is clicked.

## Out of Scope

- Privacy Policy and Terms & Conditions — legal documents, kept as static components
- Product catalog, orders, customers, inventory — Shopify API, untouched
- Rich text / WYSIWYG editor — all content uses plain text / textarea fields
- Blog / journal — separate feature, not this sprint

---

## Architecture

### Storage

| Layer | What | Tool |
|---|---|---|
| Text content | JSON strings keyed by content area | Upstash Redis (already configured) |
| Images | Uploaded files served via CDN | Vercel Blob (new, ~5 min setup) |

Redis keys: `content:hero`, `content:bench`, `content:testimonials`, `content:story`, `content:heritage`, `content:faq`, `content:shipping`, `content:returns`

### Shared helper — `lib/content.ts`

Single `getContent(key)` function used by all storefront pages. Fetches from Upstash Redis. If key is absent (first run or not yet saved), falls back to current JSON files / hardcoded defaults so the site never breaks.

```ts
export async function getContent<T>(key: ContentKey, fallback: T): Promise<T>
```

### API routes (admin-protected)

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/admin/content/[key]` | Read content block from Redis |
| PUT | `/api/admin/content/[key]` | Write content block to Redis |
| POST | `/api/admin/content/upload` | Upload image to Vercel Blob, return CDN URL |

All routes check `session.isLoggedIn` via iron-session — same guard as all other admin API routes.

---

## UI — Shadcn Components

Shadcn/UI is installed fresh for the CMS pages. This project uses Tailwind v4, which Shadcn supports via its `--style default` + CSS variable approach.

Shadcn components used:
- `Input`, `Textarea`, `Label`, `Button`, `Card`, `CardHeader`, `CardContent` — form fields
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` — section switching within a page
- `Badge`, `Separator`, `Switch` — UI polish
- `AlertDialog` — confirm before deleting list entries
- `Sonner` (toast) — "Saved" / "Error" notifications

Existing admin pages (orders, products, analytics, etc.) are **not changed** — they keep their current styling.

---

## Admin CMS Pages

New entry added to admin sidebar: **Content** (between Inventory and Customers). Three CMS pages total — no separate images page; image upload lives within each relevant section tab.

### `/admin/content/home`

Three tabs: **Hero**, **Bench Section**, **Testimonials**

**Hero tab fields:**
- Eyebrow label (Input)
- Headline (Textarea)
- Italic/brass word — the specific word in the headline that gets italic styling (Input)
- Subtext paragraph (Textarea)
- Primary CTA: label + href (two Inputs)
- Secondary CTA: label + href (two Inputs)
- Hero image: current image preview + "Replace image" file upload button

**Bench Section tab fields:**
- Eyebrow (Input)
- Section heading (Input)
- Link text + href (two Inputs)

**Testimonials tab:**
- List of cards: name, location, quote (Textarea)
- "Add testimonial" button adds a new blank card at the bottom
- Delete button per card with `AlertDialog` confirmation

### `/admin/content/story`

Two tabs: **Our Story**, **Heritage Timeline**

**Our Story tab:**
- Page headline (Input)
- Intro text (Textarea)
- Story image: current image preview + "Replace image" file upload
- Pillars list: each pillar has number label (Input), title (Input), body (Textarea)
- Add / remove pillar with confirmation

**Heritage Timeline tab:**
- List of entries: year (Input), title (Input), body (Textarea)
- Add / remove entry with confirmation
- Entries display in order — reordering by drag not included (manual year ordering)

### `/admin/content/footer`

Three tabs: **FAQ**, **Shipping**, **Returns**

**FAQ tab:**
- Categories list — each category has: name (Input) + list of Q&A pairs (question Input + answer Textarea)
- Add category / add question per category / delete with confirmation

**Shipping tab:**
- Rate table rows: zone, carrier, timeframe, rate (4 Inputs per row)
- Add / remove row
- Notes sections below table: title (Input) + body (Textarea)
- Add / remove note section

**Returns tab:**
- Lead statement (Textarea) — the italic blockquote at the top
- Sections list: title (Input) + body (Textarea)
- Add / remove section

---

## Storefront Integration

Pages changed to read from Redis via `getContent()` at request time:

| File | Content key | Fallback |
|---|---|---|
| `components/home/HeroSection.tsx` | `content:hero` | Hardcoded values |
| `components/home/PickedOffTheBench.tsx` | `content:bench` | Hardcoded values |
| `components/home/TestimonialsCarousel.tsx` | `content:testimonials` | `data/testimonials.json` |
| `app/our-story/page.tsx` | `content:story` | `data/story.json` |
| `app/heritage/page.tsx` | `content:heritage` | `data/heritage.json` |
| `app/faq/page.tsx` | `content:faq` | Current hardcoded FAQ array |
| `app/shipping/page.tsx` | `content:shipping` | Current hardcoded rows + notes |
| `app/returns/page.tsx` | `content:returns` | Current hardcoded sections |

`HeroSection.tsx` must be converted from `'use client'` to a server component (split out parallax animation to a client child).

---

## Decomposition into Sub-Projects

This spec is too large for a single implementation plan. It decomposes into 4 independent sub-projects, each producing working software:

### Sub-project 1: Infrastructure
- Vercel Blob setup + env var
- `lib/content.ts` — `getContent()` helper
- API routes: GET + PUT `/api/admin/content/[key]`, POST `/api/admin/content/upload`
- Shadcn installation and configuration (Tailwind v4 compatible)
- Admin sidebar nav update (Content entry)

### Sub-project 2: Home Page CMS
- `/admin/content/home` — Hero, Bench, Testimonials tabs
- Storefront: HeroSection server component + PickedOffTheBench + TestimonialsCarousel read from Redis

### Sub-project 3: Story & Heritage CMS
- `/admin/content/story` — Our Story + Heritage tabs + image upload
- Storefront: our-story + heritage pages read from Redis

### Sub-project 4: Footer Pages CMS
- `/admin/content/footer` — FAQ + Shipping + Returns tabs
- Storefront: faq + shipping + returns pages read from Redis

Each sub-project is fully testable and shippable on its own.

---

## Environment Variables Required

| Var | Purpose | Where to set |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob uploads | Vercel env vars (auto-created by Vercel Blob setup) |
| `UPSTASH_REDIS_REST_URL` | Already set | — |
| `UPSTASH_REDIS_REST_TOKEN` | Already set | — |

---

## Content Schema Reference

```ts
// content:hero
type HeroContent = {
  eyebrow: string
  headline: string
  italicWord: string
  subtext: string
  ctaPrimary: { label: string; href: string }
  ctaSecondary: { label: string; href: string }
  imageUrl: string
}

// content:bench
type BenchContent = {
  eyebrow: string
  heading: string
  linkText: string
  linkHref: string
}

// content:testimonials
type Testimonial = { name: string; location: string; quote: string }
type TestimonialsContent = Testimonial[]

// content:story
type StoryContent = {
  headline: string
  intro: string
  imageUrl: string
  pillars: Array<{ n: string; title: string; body: string }>
}

// content:heritage
type HeritageContent = Array<{ year: string; title: string; body: string }>

// content:faq
type FaqContent = Array<{
  category: string
  questions: Array<{ q: string; a: string }>
}>

// content:shipping
type ShippingContent = {
  rows: Array<{ zone: string; method: string; time: string; rate: string }>
  notes: Array<{ title: string; body: string }>
}

// content:returns
type ReturnsContent = {
  lead: string
  sections: Array<{ title: string; body: string }>
}
```
