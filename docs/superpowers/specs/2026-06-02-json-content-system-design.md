# JSON Content System — Design Spec
**Date:** 2026-06-02
**Project:** Acme Lamp & Sign Co.

---

## Goal

Extract all hardcoded content arrays from 4 components/pages into static JSON files under `/data/`. No visual change. No new infrastructure. Content updates are made by editing JSON → pushing to GitHub → Vercel auto-deploys.

---

## Approach

Static `import` — each component imports its JSON file directly:
```ts
import testimonials from '@/data/testimonials.json'
```
Next.js handles JSON imports natively. TypeScript can type-check the shape. Zero network requests. Works with the existing Vercel deploy pipeline.

---

## Files to Create

### `data/testimonials.json`
6 placeholder entries. Each slot is clearly labelled so Scott knows exactly what to fill in.

```json
[
  {
    "name": "Customer Name",
    "location": "City, Province",
    "quote": "PLACEHOLDER — replace with real customer review"
  }
]
```

Shape: `Array<{ name: string, location: string, quote: string }>`

**Note:** Current hardcoded testimonials contain wrong content (charcuterie boards, river tables — copied from a furniture store). These are replaced with neutral placeholders.

---

### `data/journal.json`
6 blog post entries extracted verbatim from `app/journal/page.tsx`.

```json
[
  {
    "slug": "no-2-burner-night-test",
    "date": "March 2026",
    "tag": "Bench Notes",
    "title": "What the No. 2 burner tells you after eight hours.",
    "excerpt": "Most burner failures show up in the first twenty minutes..."
  }
]
```

Shape: `Array<{ slug: string, date: string, tag: string, title: string, excerpt: string }>`

---

### `data/heritage.json`
6 timeline entries extracted verbatim from `components/heritage/Timeline.tsx`.

```json
[
  {
    "year": "1873",
    "title": "Cattaraugus patent filed",
    "body": "Bradley & Hubbard file the center-draft burner patent..."
  }
]
```

Shape: `Array<{ year: string, title: string, body: string }>`

---

### `data/story.json`
3 pillars extracted verbatim from `app/our-story/page.tsx`.

```json
{
  "pillars": [
    {
      "n": "01.",
      "title": "Craft over convenience.",
      "body": "Every burner is hand-fitted..."
    }
  ]
}
```

Shape: `{ pillars: Array<{ n: string, title: string, body: string }> }`

---

## Files to Update

| File | Change |
|---|---|
| `components/home/TestimonialsCarousel.tsx` | Remove `const testimonials = [...]`, add `import testimonials from '@/data/testimonials.json'` |
| `app/journal/page.tsx` | Remove `const posts = [...]`, add `import posts from '@/data/journal.json'` |
| `components/heritage/Timeline.tsx` | Remove `const entries = [...]`, add `import entries from '@/data/heritage.json'` |
| `app/our-story/page.tsx` | Remove `const pillars = [...]`, add `import { pillars } from '@/data/story.json'` |

---

## Constraints

- **Zero visual change** — output must be pixel-identical to current display
- **No new components** — existing render logic is untouched
- **No API routes** — pure static import
- **No TypeScript errors** — JSON shapes must satisfy existing usage

---

## Out of Scope

- Journal individual post pages (`/journal/[slug]`) — those are stubs, not wired to this data yet
- Sidebar topic counts in Journal — still hardcoded (separate task)
- Newsletter subscribe form — not wired to email (separate task, Resend)
