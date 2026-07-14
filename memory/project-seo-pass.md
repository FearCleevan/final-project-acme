---
name: project-seo-pass
description: "Full SEO pass completed June 11, 2026 — JSON-LD structured data, per-page metadata, sitemap/robots fixes"
metadata: 
  node_type: memory
  type: project
  originSessionId: ad33a9e2-711a-4426-b06d-b89128f97dca
---

Full SEO pass completed June 11, 2026. 7 commits on top of `e6aa2c5`.

**Why:** Site is live at acmevintagesupply.com with a domain. SEO foundation was already good (global metadata, sitemap, robots) but missing structured data and per-page metadata on several pages.

## What Was Done

### FAQ page (`app/faq/page.tsx`) — server/client split
- Was `'use client'` — couldn't export metadata or inject JSON-LD
- Split into server page + `components/faq/FaqAccordion.tsx` (client)
- Page now exports metadata and FAQPage JSON-LD (powers Google "People Also Ask")
- Accordion uses `hidden` attribute (not conditional render) so answers are in initial HTML for indexing
- Full ARIA: `aria-controls`, `role="region"`, `aria-expanded`, `type="button"`

### Missing page metadata added
- `app/shipping/page.tsx` — title, description, canonical
- `app/returns/page.tsx` — title, description, canonical

### BreadcrumbList JSON-LD on product pages (`app/catalog/[slug]/page.tsx`)
- Added alongside the existing Product JSON-LD
- 3-item trail: Home → Catalog → product.name
- Google uses this to show breadcrumb trail instead of raw URL in SERPs
- Note: Product JSON-LD was already implemented before this pass

### robots.ts — removed non-standard `host:` field
- `host:` is not part of the robots.txt spec

### sitemap.ts — fixed static lastModified
- Static pages now use `SITE_LAUNCH = new Date('2026-06-05')` instead of `new Date()`
- Prevents Google from re-crawling everything on every deploy
- Product pages still use `new Date()` (they do change)

## Post-Deploy Checklist (manual, after Vercel deploy)
1. `https://acmevintagesupply.com/robots.txt` — no `Host:` line
2. `https://acmevintagesupply.com/sitemap.xml` — all pages listed, static dates correct
3. Google Rich Results Test on a product URL → should show Product + BreadcrumbList
4. Google Rich Results Test on `/faq` → should show FAQPage
5. Submit sitemap in Google Search Console → Sitemaps

## Files Changed
- `app/faq/page.tsx` — server component, metadata, FAQPage JSON-LD
- `components/faq/FaqAccordion.tsx` — NEW client accordion
- `app/shipping/page.tsx` — metadata added
- `app/returns/page.tsx` — metadata added
- `app/catalog/[slug]/page.tsx` — BreadcrumbList JSON-LD added
- `app/robots.ts` — host field removed
- `app/sitemap.ts` — SITE_LAUNCH fixed date

**Related:** [[project-acme-lamp-sign]]
