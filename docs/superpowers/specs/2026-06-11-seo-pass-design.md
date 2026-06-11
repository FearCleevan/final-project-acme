# Full SEO Pass — Acme Vintage Supply

**Date:** 2026-06-11  
**Approach:** Option A — Incremental page-by-page fixes

## Context

The site already has a strong SEO foundation:
- `app/sitemap.ts` — static + dynamic product pages
- `app/robots.ts` — admin/api/private routes blocked
- `app/layout.tsx` — global metadata, keywords, OG, Twitter card, JSON-LD Store schema
- Product detail pages — per-product `generateMetadata` with OG/Twitter
- Catalog + Our Story pages — per-page metadata

This pass fills the remaining gaps that affect Google rich results and page-level indexing.

---

## 1. FAQ Page — Server + Client Split

**Problem:** `app/faq/page.tsx` is `'use client'`, which blocks `metadata` export and JSON-LD injection.

**Fix:** Two-file split.

- `app/faq/page.tsx` → convert to server component. Exports `metadata`. Renders `FAQPage` JSON-LD `<script>`. Passes FAQ data array as prop to child.
- `components/faq/FaqAccordion.tsx` → new `'use client'` component. Receives FAQ data as prop. Handles accordion toggle state. Extracts existing JSX from current `app/faq/page.tsx`.

**Metadata:**
```
title: "Frequently Asked Questions — Acme Vintage Supply"
description: "Answers to common questions about oil lamp parts, ordering, shipping, and returns at Acme Vintage Supply."
alternates: { canonical: '/faq' }
```

**FAQPage JSON-LD:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I know if a lamp part will fit my lamp?",
      "acceptedAnswer": { "@type": "Answer", "text": "..." }
    }
  ]
}
```

All FAQ questions and answers from the existing `faqs` array are included. Benefit: powers Google "People Also Ask" rich results.

---

## 2. Missing Page Metadata

Add `export const metadata: Metadata` to three pages that currently have none.

### `/faq`
Covered by Section 1 above.

### `/shipping` (`app/shipping/page.tsx`)
```
title: "Shipping Information — Canada, US & Worldwide"
description: "Free shipping over $150 CAD. Canada Post and DHL Express to Canada, USA, UK, Europe and worldwide. Ships from Dartmouth, Nova Scotia."
alternates: { canonical: '/shipping' }
```

### `/returns` (`app/returns/page.tsx`)
```
title: "Returns & Refunds — Acme Vintage Supply"
description: "All sales are final on specialty vintage items. Contact us before ordering if you have fitment questions."
alternates: { canonical: '/returns' }
```

---

## 3. Product JSON-LD on PDPs

**File:** `app/catalog/[slug]/page.tsx`

After the product is fetched in the server component, render a `<script type="application/ld+json">` with `Product` schema. Enables Google rich results: price and availability badges in SERPs.

**Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Coleman Pressure Lamp Glass",
  "description": "...",
  "image": ["https://cdn.shopify.com/..."],
  "sku": "ACME-001",
  "brand": { "@type": "Brand", "name": "Acme Vintage Supply" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "CAD",
    "price": "75.00",
    "availability": "https://schema.org/InStock",
    "url": "https://acmevintagesupply.com/catalog/coleman-pressure-lamp-glass",
    "seller": { "@type": "Organization", "name": "Acme Vintage Supply" }
  }
}
```

- `availability`: `InStock` if `product.inStock`, else `OutOfStock`
- `price`: `String(product.price)`
- `image`: `product.images` array (all images)
- Existing `other:` meta tags (`product:price:amount` etc.) are kept — they serve Facebook/Pinterest

---

## 4. BreadcrumbList JSON-LD on PDPs

**File:** `app/catalog/[slug]/page.tsx`

Second JSON-LD block alongside the Product schema. Google replaces the raw URL in SERPs with the human-readable breadcrumb trail.

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://acmevintagesupply.com" },
    { "@type": "ListItem", "position": 2, "name": "Catalog", "item": "https://acmevintagesupply.com/catalog" },
    { "@type": "ListItem", "position": 3, "name": "Coleman Pressure Lamp Glass" }
  ]
}
```

The third item has no `item` URL (current page — omitted per schema.org spec).

---

## 5. Sitemap & Robots Minor Fixes

### robots.ts
Remove the non-standard `host:` field. The `MetadataRoute.Robots` type accepts it but it is not part of the robots.txt specification and may produce unexpected output.

### sitemap.ts
Replace `lastModified: new Date()` on static pages with real fixed dates. Currently every deploy marks all pages as modified today, causing Google to re-crawl the entire site unnecessarily.

Static pages get a fixed date (e.g. `new Date('2026-06-11')`). Dynamic product pages keep `new Date()` since products do change.

---

## Files Changed

| File | Change |
|---|---|
| `app/faq/page.tsx` | Convert to server component, add metadata + FAQPage JSON-LD |
| `components/faq/FaqAccordion.tsx` | NEW — extract client accordion logic |
| `app/shipping/page.tsx` | Add metadata export |
| `app/returns/page.tsx` | Add metadata export |
| `app/catalog/[slug]/page.tsx` | Add Product + BreadcrumbList JSON-LD blocks |
| `app/robots.ts` | Remove `host:` field |
| `app/sitemap.ts` | Fix static `lastModified` dates |

## Out of Scope

- Performance SEO (LCP, CLS) — separate phase
- Google Analytics installation — waiting on Scott's GA4 Measurement ID
- Google Search Console submission — manual step after deploy
