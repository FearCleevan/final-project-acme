# JSON Content System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract hardcoded content arrays from 4 components into static JSON files under `/data/`, with zero visual change to any page.

**Architecture:** Static `import` — each component imports its JSON file directly using `import data from '@/data/file.json'`. Next.js + TypeScript handle this natively (`resolveJsonModule: true` already set in tsconfig). No API routes, no network requests, no new dependencies.

**Tech Stack:** Next.js 16, TypeScript, Tailwind v4. Working directory: `acme-lamp-sign/`.

---

## File Map

**Create:**
- `data/testimonials.json` — 6 placeholder slots for Scott to fill
- `data/journal.json` — 6 blog posts
- `data/heritage.json` — 6 timeline entries
- `data/story.json` — 3 brand pillars

**Modify:**
- `components/home/TestimonialsCarousel.tsx` — remove hardcoded `testimonials` array, import from JSON
- `app/journal/page.tsx` — remove hardcoded `posts` array, import from JSON
- `components/heritage/Timeline.tsx` — remove hardcoded `entries` array, import from JSON
- `app/our-story/page.tsx` — remove hardcoded `pillars` array, import from JSON

---

## Task 1: Create `data/testimonials.json`

**Files:**
- Create: `data/testimonials.json`

- [ ] **Step 1: Create the file**

Create `data/testimonials.json` with this exact content:

```json
[
  {
    "name": "Customer Name",
    "location": "City, Province",
    "quote": "PLACEHOLDER — replace with a real customer review from a lamp or sign purchase."
  },
  {
    "name": "Customer Name",
    "location": "City, Province",
    "quote": "PLACEHOLDER — replace with a real customer review from a lamp or sign purchase."
  },
  {
    "name": "Customer Name",
    "location": "City, Province",
    "quote": "PLACEHOLDER — replace with a real customer review from a lamp or sign purchase."
  },
  {
    "name": "Customer Name",
    "location": "City, Province",
    "quote": "PLACEHOLDER — replace with a real customer review from a lamp or sign purchase."
  },
  {
    "name": "Customer Name",
    "location": "City, Province",
    "quote": "PLACEHOLDER — replace with a real customer review from a lamp or sign purchase."
  },
  {
    "name": "Customer Name",
    "location": "City, Province",
    "quote": "PLACEHOLDER — replace with a real customer review from a lamp or sign purchase."
  }
]
```

---

## Task 2: Wire `TestimonialsCarousel.tsx` to `testimonials.json`

**Files:**
- Modify: `components/home/TestimonialsCarousel.tsx`

- [ ] **Step 1: Replace the hardcoded array with a JSON import**

Open `components/home/TestimonialsCarousel.tsx`. Remove the `const testimonials = [...]` block (lines starting with `const testimonials = [` through the closing `]`), and add the import at the top of the file after the `'use client'` directive:

```ts
import testimonials from '@/data/testimonials.json'
```

The rest of the component is unchanged. The `testimonials` variable is already used as an array in the JSX — the import replaces it directly.

- [ ] **Step 2: Verify TypeScript accepts the import**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors. If you see `"Cannot find module '@/data/testimonials.json'"`, check that the file was saved to `data/testimonials.json` (not inside `app/` or `src/`).

- [ ] **Step 3: Start dev server and check the carousel**

Run:
```bash
npm run dev
```
Open `http://localhost:3000` and scroll to the testimonials carousel section. The carousel should display exactly as before — 6 cards scrolling, same layout, same stars. The text will now say "PLACEHOLDER — replace with a real customer review..." which is correct and expected.

---

## Task 3: Create `data/journal.json`

**Files:**
- Create: `data/journal.json`

- [ ] **Step 1: Create the file**

Create `data/journal.json` with this exact content:

```json
[
  {
    "slug": "no-2-burner-night-test",
    "date": "March 2026",
    "tag": "Bench Notes",
    "title": "What the No. 2 burner tells you after eight hours.",
    "excerpt": "Most burner failures show up in the first twenty minutes or the last two hours. The hours in between are quiet. Here's what we watch for, and why we don't shorten the test."
  },
  {
    "slug": "pune-press-shop-dies",
    "date": "January 2026",
    "tag": "Workshop",
    "title": "The dies that have not been recut since 1908.",
    "excerpt": "Press Shop 4 runs on original tooling. We've replaced the press frames twice. The dies themselves have never been touched. This is why that matters to the pieces you receive."
  },
  {
    "slug": "sourcing-milk-glass",
    "date": "November 2025",
    "tag": "Materials",
    "title": "Why milk-white cased glass is harder to source than it looks.",
    "excerpt": "There are three suppliers left in the world making genuine cased milk glass to the original opacity spec. We use one of them. The other two produce something that photographs well and burns badly."
  },
  {
    "slug": "straw-packing-method",
    "date": "September 2025",
    "tag": "Dispatch",
    "title": "Straw packing: the method that hasn't changed in forty years.",
    "excerpt": "Bubble wrap is fine for electronics. For hand-blown glass, century-old brass, and triple-fired porcelain, we still use straw. Here is how we do it, and what happens if something arrives broken anyway."
  },
  {
    "slug": "porcelain-sign-firing",
    "date": "July 2025",
    "tag": "Signs",
    "title": "The third firing: why it costs more and why it's worth it.",
    "excerpt": "Our porcelain signs go through the kiln three times. One firing is standard. Two is common. Three is how you get a surface that holds colour in direct sun for forty years without chalking."
  },
  {
    "slug": "original-patent-1873",
    "date": "May 2025",
    "tag": "History",
    "title": "Reading the 1873 Cattaraugus patent — what it actually says.",
    "excerpt": "The patent document is twelve pages of Victorian technical prose. We've read it in full. The center-draft principle it describes is still the best way to burn a wide wick cleanly. Nothing has improved on it."
  }
]
```

---

## Task 4: Wire `app/journal/page.tsx` to `journal.json`

**Files:**
- Modify: `app/journal/page.tsx`

- [ ] **Step 1: Replace the hardcoded array with a JSON import**

Open `app/journal/page.tsx`. Remove the `const posts = [...]` block (the entire array from `const posts = [` through its closing `]`). Add this import near the top of the file, after the existing imports:

```ts
import posts from '@/data/journal.json'
```

The rest of the component is unchanged. The `posts` variable is already mapped over in the JSX.

- [ ] **Step 2: Verify TypeScript accepts the import**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Check the journal page**

With the dev server running, open `http://localhost:3000/journal`. The 6 blog posts should display exactly as before — same titles, same excerpts, same tags and dates, same layout.

---

## Task 5: Create `data/heritage.json`

**Files:**
- Create: `data/heritage.json`

- [ ] **Step 1: Create the file**

Create `data/heritage.json` with this exact content:

```json
[
  {
    "year": "1873",
    "title": "Cattaraugus patent filed",
    "body": "Bradley & Hubbard file the center-draft burner patent that anchors our entire fixtures collection."
  },
  {
    "year": "1881",
    "title": "Pittsburgh railroad order",
    "body": "First gimbal-mounted caboose lamps roll out of the Pune works for the Indian railway."
  },
  {
    "year": "1898",
    "title": "British Indian Lamp Co. closes",
    "body": "The dies stay. The Patel family buys the press shop for ₹140 and a promise."
  },
  {
    "year": "1934",
    "title": "Porcelain signage line opens",
    "body": "A third firing process is developed for the advertising-sign trade."
  },
  {
    "year": "2003",
    "title": "Australian distribution begins",
    "body": "The first containers cross the Indian Ocean. The pieces find their first Western collectors through partners in Australia."
  },
  {
    "year": "2026",
    "title": "North American launch",
    "body": "Fifty pieces cross into North America for the first time. This is the website you are reading. No catalog will repeat exactly."
  }
]
```

---

## Task 6: Wire `components/heritage/Timeline.tsx` to `heritage.json`

**Files:**
- Modify: `components/heritage/Timeline.tsx`

- [ ] **Step 1: Replace the hardcoded array with a JSON import**

Open `components/heritage/Timeline.tsx`. Remove the `const entries = [...]` block (the entire array from `const entries = [` through its closing `]`). Add this import at the top of the file, after the existing `import Eyebrow` line:

```ts
import entries from '@/data/heritage.json'
```

The rest of the component is unchanged. The `entries` variable is already mapped over in the JSX.

- [ ] **Step 2: Verify TypeScript accepts the import**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Check the heritage page**

Open `http://localhost:3000/heritage`. The timeline should display exactly as before — 6 entries, brass year numbers, vertical rule on desktop, dot markers, same text.

---

## Task 7: Create `data/story.json`

**Files:**
- Create: `data/story.json`

- [ ] **Step 1: Create the file**

Create `data/story.json` with this exact content:

```json
{
  "pillars": [
    {
      "n": "01.",
      "title": "Craft over convenience.",
      "body": "Every burner is hand-fitted. Every shade is mouth-blown. Every sign is triple-fired. If a piece fails the 8-hour bench test, it never leaves the bench. We don't ship near-misses."
    },
    {
      "n": "02.",
      "title": "Provenance over inventory.",
      "body": "We make 50 pieces a season, then we stop, then we make 50 more. There is no warehouse of yellowing surplus, no algorithmic restock. When this crate is empty, it's empty."
    },
    {
      "n": "03.",
      "title": "Honesty over marketing.",
      "body": "Our invoices are plain paper. Our phone rings to a person. Our returns policy fits in one sentence: if it arrives less than whole, send it back, on us, for thirty days."
    }
  ]
}
```

---

## Task 8: Wire `app/our-story/page.tsx` to `story.json`

**Files:**
- Modify: `app/our-story/page.tsx`

- [ ] **Step 1: Replace the hardcoded array with a JSON import**

Open `app/our-story/page.tsx`. Remove the `const pillars = [...]` block (the entire array from `const pillars = [` through its closing `]`). Add this import at the top of the file, after the existing imports:

```ts
import storyData from '@/data/story.json'
```

Then update the reference in the JSX from `pillars.map(...)` to `storyData.pillars.map(...)`:

Find this line:
```tsx
{pillars.map(({ n, title, body }) => (
```

Replace with:
```tsx
{storyData.pillars.map(({ n, title, body }) => (
```

- [ ] **Step 2: Verify TypeScript accepts the import**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Check the Our Story page**

Open `http://localhost:3000/our-story`. The three pillars section ("01. Craft over convenience.", etc.) should display exactly as before — same brass numbering, same serif titles, same body text.

---

## Task 9: Final Visual Verification

- [ ] **Step 1: Run a full TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 2: Check all four pages side by side**

With the dev server running (`npm run dev`), open and visually confirm these 4 pages look identical to before:

| Page | URL | What to check |
|---|---|---|
| Homepage | `http://localhost:3000` | Testimonials carousel scrolls, 6 cards visible |
| Journal | `http://localhost:3000/journal` | 6 posts listed, tags + dates correct |
| Heritage | `http://localhost:3000/heritage` | 6 timeline entries, vertical rule, dots |
| Our Story | `http://localhost:3000/our-story` | 3 pillars with brass numbers |

- [ ] **Step 3: Confirm no console errors**

Open browser DevTools → Console. There should be zero errors on any of the 4 pages.
