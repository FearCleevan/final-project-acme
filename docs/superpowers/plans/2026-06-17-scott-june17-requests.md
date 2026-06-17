# Scott's June 17 Requests — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Action all of Scott Fraser's June 17 requests — story copy fix, new hero design, Aladdin trademark updates, and Shopify product listings from the PDF photos.

**Architecture:** Mix of data-file edits (story/hero fallback copy), a component redesign (HeroSection), Shopify Admin API calls via MCP (product description updates + new listings), and a separate acmesign.ca service rename. All storefront content lives in `/data/*.json` as fallbacks; Redis is the live source via the CMS admin.

**Tech Stack:** Next.js 16 App Router, Tailwind v4, Shopify Admin API via MCP tools, local JSON data files

---

## Scott's Full Request List (June 17 Email)

| # | Request | Type | Deadline |
|---|---------|------|----------|
| 1 | Remove "Pune" and "50 pieces" from all copy | Code | ASAP |
| 2 | New homepage hero — colourful shades + old world craftsmanship | Code | ASAP |
| 3 | Aladdin trademark — update product descriptions | Shopify API | ASAP |
| 4 | Find FB groups for oil lamp collectors (CA/US/UK/EU) | Research | Friday Jun 20 |
| 5 | Instagram + Pinterest — identify & activate | Marketing | Friday Jun 20 |
| 6 | Acme Sign — rename Channel Signs + Dimension Signs | Code (separate repo) | ASAP |
| 7 | Hinks Globe — create new Shopify product listing | Shopify API | ASAP |
| 8 | PDF product photos — match/create Shopify listings | Shopify API | ASAP |

> **Tasks 4 & 5** are research/marketing tasks — not in this plan. Handle separately (see notes at end).

---

## Global Constraints

- Tailwind v4: use `@theme {}` in globals.css, no `tailwind.config.ts`
- Next.js 16 App Router — read `node_modules/next/dist/docs/` before touching routing
- Never mention "Pune", "Patel family", or "50 pieces" in any copy
- Aladdin-style products must say "to suit Aladdin" or "Aladdin style" — never claim genuine Aladdin parts
- Do not run `git push` or `git commit` — user handles all git operations

---

## File Map

| File | Change |
|---|---|
| `components/home/HeroSection.tsx` | New multi-shade hero layout + remove Pune/50 pieces from FALLBACK and STATS |
| `data/story.json` | Already clean — no changes needed |
| `data/heritage.json` | Already clean — no changes needed |
| `app/admin/content/story/page.tsx` | Update STORY_DEFAULTS intro (remove Pune reference if present in any admin default) |
| Shopify via MCP | Update Aladdin product descriptions, create Hinks Globe listing, upload PDF product photos |
| acmesign.ca codebase | Service renames (separate task — separate repo) |

---

## Task 1: Remove Pune/50 Pieces — Hero Fallback + Stats

**Files:**
- Modify: `components/home/HeroSection.tsx` (lines 7–22)

The component's hardcoded `FALLBACK` and `STATS` still reference Pune and 50 pieces. The CMS content from Redis overrides these at runtime, but the fallback shows on cache miss or first deploy. Both must be cleaned.

- [ ] **Step 1: Update FALLBACK subtext and eyebrow**

In `components/home/HeroSection.tsx`, replace the `FALLBACK` object:

```tsx
const FALLBACK: HeroContent = {
  eyebrow:      'Handcrafted · Original Tooling · North America',
  headline:     'Authentic light from a forgotten era.',
  italicWord:   'forgotten',
  subtext:      'Precision-reproduced antique oil lamp parts, hand-blown chimneys, and porcelain advertising signs — crafted on original century-old tooling by the Oil Lamp Company in Melbourne, and now available in North America for the first time.',
  ctaPrimary:   { label: 'Enter the Catalog', href: '/catalog' },
  ctaSecondary: { label: 'Read the Story',    href: '/our-story' },
  imageUrl:     '/assets/HeroSampleImage0.webp',
}
```

- [ ] **Step 2: Update STATS row**

Replace the `STATS` array in the same file:

```tsx
const STATS = [
  'Original Tooling · Melbourne',
  'Bench-Tested · Period Correct',
  'Now in North America',
]
```

- [ ] **Step 3: Verify no other Pune/50 references exist in storefront**

Run this search — it must return zero results in app/components/data:
```
grep -r "Pune\|50 pieces\|Fifty/Fifty\|Pune →" app/ components/ data/ --include="*.tsx" --include="*.ts" --include="*.json"
```

Expected: no matches (only `HeroSection.tsx` had them, now fixed).

- [ ] **Step 4: Also update the hero via the CMS Admin**

After deploying, go to `/admin/content/home` → Hero tab → update Eyebrow, Subtext, and any stats/copy that still reference Pune or 50 pieces. This overwrites the Redis value and is what live visitors see.

---

## Task 2: New Homepage Hero — Colourful Shades + Old World Craftsmanship

**Files:**
- Modify: `components/home/HeroSection.tsx`

Scott wants: "a new opening page that has a different look — something that features several of the most colourful and intricate shades and has text highlighting old world craftsmanship, handmade etc."

**New layout concept:** Full-width section. Left side: bold editorial headline + subtext + CTAs. Right side: a 2×2 mosaic grid of four colourful shade images (from the existing `/assets/` files). Stats row stays below.

Available colourful images in `public/assets/`:
- `HeroSampleImage1.1.webp` — use as shade #1
- `HeroSampleImage2.1.webp` — use as shade #2
- `HeroSampleImage3.webp` — use as shade #3
- `HeroSampleImage4.webp` — use as shade #4
- `IMGP2340.JPG` — Open Lip Etched Shade (green, frilly) — use if more colourful needed
- `IMG-20250220-WA0005.jpg` — coloured shade group shot

- [ ] **Step 1: Replace HeroSection with new mosaic layout**

Rewrite `components/home/HeroSection.tsx`:

```tsx
import Button from '@/components/shared/Button'
import Eyebrow from '@/components/shared/Eyebrow'
import Image from 'next/image'
import { getContent } from '@/lib/content'
import type { HeroContent } from '@/lib/types/content'

const FALLBACK: HeroContent = {
  eyebrow:      'Handcrafted · Original Tooling · North America',
  headline:     'Old world craftsmanship. Every detail, period-correct.',
  italicWord:   'craftsmanship',
  subtext:      'Hand-blown glass shades, precision Duplex burners, and borosilicate chimneys — made on century-old tooling by the Oil Lamp Company in Melbourne, now available in North America for the first time.',
  ctaPrimary:   { label: 'Shop the Collection', href: '/catalog' },
  ctaSecondary: { label: 'Our Story',            href: '/our-story' },
  imageUrl:     '/assets/HeroSampleImage1.1.webp',
}

const STATS = [
  'Original Tooling · Melbourne',
  'Bench-Tested · Period Correct',
  'Now in North America',
]

const SHADE_IMAGES = [
  { src: '/assets/HeroSampleImage1.1.webp', alt: 'Colourful etched glass oil lamp shade' },
  { src: '/assets/HeroSampleImage2.1.webp', alt: 'Hand-blown antique oil lamp chimney' },
  { src: '/assets/HeroSampleImage3.webp',   alt: 'Period-correct lamp glass shade' },
  { src: '/assets/HeroSampleImage4.webp',   alt: 'Original oil lamp burner and shade' },
]

function renderHeadline(headline: string, italicWord: string) {
  if (!italicWord || !headline.includes(italicWord)) return headline
  const parts = headline.split(italicWord)
  return (
    <>
      {parts[0]}
      <em className="italic text-brass-deep">{italicWord}</em>
      {parts[1]}
    </>
  )
}

export default async function HeroSection() {
  const content = (await getContent<HeroContent>('hero')) ?? FALLBACK

  return (
    <section className="relative min-h-[70vh] sm:min-h-[90vh] flex items-center bg-parchment px-4 sm:px-6 py-12 sm:py-20 overflow-hidden">
      <div className="max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* Left — editorial text */}
        <div className="max-w-[52ch] order-2 lg:order-1">
          <Eyebrow className="mb-6">{content.eyebrow}</Eyebrow>

          <h1
            className="font-serif font-medium text-ink-charcoal leading-[0.96] mb-8"
            style={{ fontSize: 'clamp(40px, 6vw, 80px)' }}
          >
            {renderHeadline(content.headline, content.italicWord)}
          </h1>

          <p className="font-sans text-[18px] text-ink-soft leading-relaxed mb-10 max-w-[52ch]">
            {content.subtext}
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <Button variant="primary" href={content.ctaPrimary.href}>
              {content.ctaPrimary.label}
            </Button>
            <Button variant="ghost" href={content.ctaSecondary.href}>
              {content.ctaSecondary.label}
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-0 border-t border-ink-rule pt-6">
            {STATS.map((stat, i) => (
              <span key={stat} className="flex items-center">
                {i > 0 && (
                  <span className="mx-4 text-ink-rule select-none font-mono text-[11px]">|</span>
                )}
                <span className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft">
                  {stat}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Right — 2×2 shade mosaic */}
        <div className="order-1 lg:order-2 grid grid-cols-2 gap-3 sm:gap-4">
          {SHADE_IMAGES.map((img, i) => (
            <div
              key={img.src}
              className={`relative overflow-hidden rounded-sm ${i === 0 ? 'aspect-[3/4]' : i === 3 ? 'aspect-[3/4]' : 'aspect-square'}`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
```

- [ ] **Step 2: Run dev server and visually inspect**

```bash
npm run dev
```

Open http://localhost:3000 — verify:
- Left column: headline with italic "craftsmanship", subtext (no Pune/50), two CTAs, stats row
- Right column: 2×2 grid of shade images, tall on corners, square on center pair
- Mobile: images stack above text
- No layout overflow on sm/md breakpoints

- [ ] **Step 3: Swap any placeholder images**

If any of the 4 images are not colourful enough, replace with `IMGP2340.JPG` (green frilly shade) or `IMG-20250220-WA0005.jpg` in the `SHADE_IMAGES` array. Preview until the mosaic looks vivid.

---

## Task 3: Aladdin Trademark — Update Shopify Product Descriptions

**Source:** Alison (OLC) warning: "Aladdin will jump on you very quickly if they think you are trying to sell genuine Aladdin componentry. You need lots of 'to suit Aladdin' or 'Aladdin style' in your labelling & descriptions."

**Products to update via Shopify MCP:**
- Aladdin Sol Shade 501
- Aladdin Pressure Glass (Ice — listed as "Aladdin Pressure Lamp Glass")

- [ ] **Step 1: Search for Aladdin products on Shopify**

Use `mcp__claude_ai_Shopify__search_products` with query `"Aladdin"`. Note the product IDs and current titles/descriptions.

- [ ] **Step 2: Update Aladdin Sol Shade 501**

Use `mcp__claude_ai_Shopify__update-product` with:
- Title: `"Sol Shade 501 — to suit Aladdin Style Lamps"`
- Description body: prepend `"Designed to suit Aladdin-style lamps. Not a genuine Aladdin product."` before existing description.

- [ ] **Step 3: Update Aladdin Pressure Glass**

Use `mcp__claude_ai_Shopify__update-product` with:
- Title: `"Pressure Lamp Glass (Ice) — Aladdin Style"`
- Description body: prepend `"Designed to suit Aladdin-style pressure lamps. Not a genuine Aladdin product."` before existing description.

- [ ] **Step 4: Check for any other Aladdin-named products**

Search results from Step 1 — if any other products have "Aladdin" in the title without "to suit" or "style", apply the same pattern.

---

## Task 4: Hinks Globe — New Shopify Product Listing

**Source:** Scott's email: "Picture attached is Hinks Globe for listing" + PDF page with Hinks Globe photo.

The Hinks Globe is visible in the PDF as a large, round decorative globe shade.

- [ ] **Step 1: Create the Hinks Globe product**

Use `mcp__claude_ai_Shopify__create-product` with:
```json
{
  "title": "Hinks Globe Shade",
  "descriptionHtml": "<p>A reproduction Hinks-style globe shade, faithfully produced on original tooling. Suitable for Hinks-pattern burners and duplex-style lamp fittings. Made by the Oil Lamp Company (OLC), Melbourne.</p><p><strong>Material:</strong> Borosilicate glass</p><p><strong>Style:</strong> Globe</p><p><strong>Fits:</strong> Hinks-style burners</p>",
  "productType": "Glass Shades & Chimneys",
  "vendor": "OLC",
  "tags": ["glass", "shade", "hinks", "globe", "oil-lamp"],
  "status": "DRAFT"
}
```

- [ ] **Step 2: Note the returned product ID**

Keep the Shopify product GID (e.g. `gid://shopify/Product/...`) — needed to set inventory and upload image.

- [ ] **Step 3: Set inventory**

Use `mcp__claude_ai_Shopify__set-inventory` with location `gid://shopify/Location/112994681137` ("25 Raddall Ave"). Set quantity to match Scott's stock count once he provides it. Use `1` as placeholder.

- [ ] **Step 4: Set metafields**

Use `mcp__claude_ai_Shopify__graphql_mutation` to set the `acme` namespace metafields:

```graphql
mutation {
  productUpdate(input: {
    id: "PRODUCT_GID_HERE",
    metafields: [
      { namespace: "acme", key: "material",     value: "Borosilicate glass", type: "single_line_text_field" },
      { namespace: "acme", key: "style",        value: "Globe",              type: "single_line_text_field" },
      { namespace: "acme", key: "brand",        value: "OLC",                type: "single_line_text_field" },
      { namespace: "acme", key: "fits",         value: "Hinks-style burners", type: "single_line_text_field" },
      { namespace: "acme", key: "power_source", value: "Oil/Kerosene",       type: "single_line_text_field" },
      { namespace: "acme", key: "condition",    value: "New",                type: "single_line_text_field" }
    ]
  }) {
    product { id }
    userErrors { field message }
  }
}
```

- [ ] **Step 5: Upload Hinks Globe photo**

Scott's PDF photo of the Hinks Globe needs to be uploaded via Shopify Admin → the product's media tab. Flag this for Scott to do, OR if an image file is available locally, use `mcp__claude_ai_Shopify__graphql_mutation` to attach it via `productCreateMedia`.

---

## Task 5: PDF Product Photos — Match to Existing Shopify Listings

**Source:** The scanned PDF (Lamp Parts_2026-06-06.pdf) contains handwritten labels matched to product photos. These photos need to be uploaded to the correct Shopify products.

**Products identified in PDF with photo references:**

| Product name (from PDF) | Image filename in PDF | Already on Shopify? |
|---|---|---|
| Hurricane Lamp Glass — Emerald (Small) | 300A0DFF-... .jpeg | Yes — Hurricane Glass Emerald Green |
| Coleman Pressure Lamp Glass (Ice) | 48F92200-... .jpeg | Yes — confirmed working |
| Duplex Chimney 25⅝" Ht | 4BF92200-... .jpeg | Yes — Duplex Round 65mm |
| Hurricane Lamp Glass — Ruby Red (Small) | 86CB0E46-... .jpeg | Yes — Hurricane Glass Ruby Red |
| Lip Chimney | D51E6049-... .jpeg | Yes — Lip Chimney Large/Small |
| Aladdin Pressure Lamp Glass | AU361133-... .jpe | Yes — Aladdin Pressure Glass |
| Duplex Round Chimney 9⅝" Ht | AU361133-... .jpe | Yes — Duplex Round 65mm |
| Miller #3 Jumbo Chimney 3¾" Ht | EFB25398-... .jpeg | Not confirmed — may need creating |
| Hurricane Lamp Glass — Clear (Small) | ADD3F188-... .jpeg | Yes — Hurricane Glass Clear |
| Ice Floral Ball Cased Shade 4" Ht | IMGP2338.JPG | May need creating |
| Ice Valentine Shade | IMGP2331.JPG | Yes — "Ice Valentine Etched Shade" |
| Aladdin 501 Shade | (large white bowl) | Yes — Aladdin Sol Shade 501 |
| Open Lip Etched Shade 4" Ht | IMGP2340.JPG | May need creating |
| Closed Tulip Etched Shade 4" Ht | IMGP2337.JPG | Yes — Closed Tulip Etched Shade |
| Zodiac Ball Etched Shade 4" Ht | (green ball shade) | Yes — Zodiac Ball Etched Shade |

- [ ] **Step 1: Use `mcp__claude_ai_Shopify__search_products` to confirm which of the above are already on Shopify**

Search for: "Hurricane Glass", "Duplex", "Lip Chimney", "Miller", "Ice Valentine", "Closed Tulip", "Zodiac Ball", "Ice Floral", "Open Lip".

Note which products are missing.

- [ ] **Step 2: Create "Miller #3 Jumbo Chimney" if missing**

```json
{
  "title": "Miller No. 3 Jumbo Chimney — 3¾\" Ht",
  "descriptionHtml": "<p>Miller No. 3 Jumbo Chimney, 3¾ inch height. Borosilicate glass. Fits Miller No. 3 and compatible lamp burners.</p>",
  "productType": "Glass Shades & Chimneys",
  "vendor": "OLC",
  "tags": ["chimney", "miller", "glass", "oil-lamp"],
  "status": "DRAFT"
}
```

- [ ] **Step 3: Create "Ice Floral Ball Cased Shade" if missing**

```json
{
  "title": "Ice Floral Ball Cased Shade — 4\"",
  "descriptionHtml": "<p>A cased glass ball shade with delicate floral etching. 4 inch fitting. Borosilicate glass, produced on original OLC tooling in Melbourne.</p>",
  "productType": "Glass Shades & Chimneys",
  "vendor": "OLC",
  "tags": ["shade", "ball", "cased", "floral", "glass", "oil-lamp"],
  "status": "DRAFT"
}
```

- [ ] **Step 4: Create "Open Lip Etched Shade" if missing**

```json
{
  "title": "Open Lip Etched Shade — 4\"",
  "descriptionHtml": "<p>Open-lip style etched glass shade, 4 inch fitting. Intricate etched pattern on borosilicate glass. Made on OLC original tooling.</p>",
  "productType": "Glass Shades & Chimneys",
  "vendor": "OLC",
  "tags": ["shade", "etched", "open-lip", "glass", "oil-lamp"],
  "status": "DRAFT"
}
```

- [ ] **Step 5: Flag image uploads for Scott**

The PDF photos are scanned prints — low resolution. Flag to Scott that the actual JPEG files referenced (IMGP2340.JPG, IMGP2331.JPG etc.) should be uploaded directly from his device to Shopify Admin → each product → Media. The scanned PDF images are not print-quality for the storefront.

Note: `public/assets/IMGP2340.JPG` and `public/assets/IMG-20250220-WA0005.jpg` already exist locally and can be used if needed.

---

## Task 6: Acme Sign — Service Category Renames

**Source:** Peter's email to Scott (June 16) — highlighted in yellow: `"Channel Signs" → "Channel Letter Signs"` and `"Dimension Signs" → "Dimensional Signs"`

This is in the **acmesign.ca project** (separate codebase from Acme Vintage Supply).

- [ ] **Step 1: Open the acmesign.ca project**

The project is at a separate path. Find the service categories data file (likely a `data/services.json`, `lib/services.ts`, or similar).

- [ ] **Step 2: Rename the two services**

Find and replace:
- `"Channel Signs"` → `"Channel Letter Signs"`
- `"Dimension Signs"` → `"Dimensional Signs"`

Apply in all files: page titles, nav items, service card labels, metadata, and any slug/URL references.

- [ ] **Step 3: Verify slugs**

If the URLs used `/channel-signs` or `/dimension-signs`, update those too — or add redirects so existing links don't 404.

---

## Non-Code Tasks (Handle Separately)

### Facebook Groups — Oil Lamp Collectors (CA/US/UK/EU)
Scott already has:
- 27 general Canadian vintage/garage sale groups (gathered by Peter, June 16)
- 2 new targeted groups from Scott's June 17 email:
  - https://www.facebook.com/groups/171643256256623
  - https://www.facebook.com/groups/158716414251697

**Action:** Search Facebook for groups with keywords: `Aladdin`, `Hinks`, `Acme lamp`, `Veritas`, `oil lamp collectors`, `kerosene lamp`. Target regions: Canada, US, UK, Australia, Europe. Scott said Australian contacts will send more. Compile final list and share with Scott by **Friday June 20**.

### Instagram + Pinterest Setup
Scott wants accounts ready by **Friday June 20** when the website goes live.

**Action:**
1. Create `@acmevintagesupply` on Instagram (business account, linked to Facebook page)
2. Create `acmevintagesupply` on Pinterest (business account)
3. Profile photo: use the brass lamp hero image or logo once received
4. Bio: "Authentic antique oil lamp parts & reproduction signs. Original OLC tooling. Now shipping to North America. 🛒 acmevintagesupply.com"
5. Link in bio → `https://www.acmevintagesupply.com`
6. Post 3–5 product photos as initial content before going live
