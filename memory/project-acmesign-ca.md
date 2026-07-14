---
name: project-acmesign-ca
description: "acmesign.ca website revamp — service categories confirmed by Scott, LED Signs priority, 271 WebP images ready"
metadata: 
  node_type: memory
  type: project
  originSessionId: f6dc3afb-5824-4659-b1c5-17027084c3fe
---

**Site:** acmesign.ca — Acme Sign company website (separate from acmevintagesupply.com)
**Current stack:** WordPress (login forwarded by Scott)
**Plan:** Revamp/redesign — Peter has downloaded all 271 WordPress media, converted to WebP via Python script

## Service Categories (Scott confirmed June 16, 2026)

Keep ALL existing categories. Rename two:
- "Channel Signs" → **"Channel Letter Signs"**
- "Dimension Signs" → **"Dimensional Signs"**

Full confirmed list:
1. Channel Letter Signs
2. Dimensional Signs
3. Illuminated Signs
4. Safety & Parking Signs
5. Window Graphics
6. Banners
7. Decals & Stickers
8. Apparel
9. Vehicle Wraps
10. Sign Service & Repair

## LED Signs — Priority Feature
- LED Signs will be featured **prominently**
- Explore a **dedicated page or sub-brand**: "Acme LED" or "Acme Digital"
- Could be a separate page or separate website entirely (Scott's words)

## Pending from Scott
- New job photos for the website (Scott will send when available)
- WordPress login credentials (forwarded separately — do NOT store passwords in memory)

## How to apply
When building/redesigning acmesign.ca: use confirmed service list above, make LED Signs the hero feature, use the 271 WebP images from the WordPress download as the real gallery/portfolio.

## Status update — July 7, 2026
Site is now built and live as a preview, not just planned. See [[daily-log-2026-07-07]] for full detail.

- **The real project is `Acme-Sign-Assets/acmesign-project`** (a third prototype, more advanced than the Sanity-based `final-acmesign/acme-sign-redesign` — treat that one as abandoned).
- Fully gallery-heavy now: every service page shows real job photos, plus a full `/gallery` page with all 236 real photos, filterable by category.
- Dedicated LED Signs and Vehicle Wraps pages built. Standalone Contact page built.
- Pushed to GitHub (`FearCleevan/acmesign`) and deployed to Vercel: **https://acme-sign.vercel.app/**
- **Already shown to Scott** (confirmed by Peter July 7 — update supersedes the "not yet shown" note from earlier the same day).
- **CORRECTION (July 7, later same day):** An earlier note describing the homepage as showing injected spam content was wrong — verified by screenshot to be a plain, legitimate WordPress "Not Found" 404 page (real Acme Sign sidebar/footer content, real address, no spam). Most likely cause is a WordPress config issue — homepage/static-front-page setting pointing at a missing page, or a permalink/rewrite problem.
- **CORRECTION (July 8):** The actual issue is access. Evan Mugford (of PeachBlitz), the site's owner/past developer, has restricted Peter's access to acmesign.ca — an access-restriction/handover matter with the prior developer. See [[feedback-no-hack-language]] for how to phrase this topic going forward.
- Also corrected July 8: it was the **acme-sign.vercel.app** revamp that had already been shown to Scott (per the July 7 log). It's the **[[project-frasco|Frasco (frasco.ca) revamp]]** that has NOT yet been shown to the client — see that memory file.
- Domain's DNS is currently managed via **Amazon Route 53** (not GoDaddy default), per GoDaddy DNS tab — registrar is GoDaddy but nameservers point elsewhere. Relevant for any future cutover to Vercel.
- Domain cutover (pointing acmesign.ca at the new Vercel site) has NOT happened — deliberately separate, later step once Scott approves the new design. Status of Scott's approval/feedback on the preview not yet known — ask Peter for update.
- No backend yet (contact form UI-only) — a future, separate plan.
