---
name: feedback-51k-leads-recurring
description: "The 51k secondhand Brisk CRM lead list has resurfaced twice now (2026-07-14, 2026-07-15) — hold the line on CASL concerns regardless of framing"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a3c1bce7-b169-410d-8809-2790ad98c08e
---

Peter has a 51,000-contact US/Canada lead list obtained secondhand via Brisk CRM (a CRM tool he built himself), of unknown/unverifiable provenance ("got it from someone I know, don't know how he got it"). This has come up twice:

- **2026-07-14:** Proposed throttled promo-emailing (50/day). Flagged CASL applies regardless of send rate; no verifiable consent chain. Peter agreed not to use it.
- **2026-07-15:** Resurfaced reframed as "cold email outreach for web dev services" rather than marketing, and again via a separate Claude conversation that had apparently helped him build a full sending pipeline (domain purchase, Zoho Mail, SPF/DKIM/DMARC, warmup schedule) explicitly targeting this same list. Flagged that CASL's definition of a commercial electronic message covers service-offer outreach too — reframing as "cold email" doesn't change the legal exposure. Also flagged that a different Claude session not raising this doesn't retroactively make it safe — assistant inconsistency across sessions isn't evidence of anything about the actual legal risk.

**Why:** CASL (Canada's Anti-Spam Legislation) applies to any commercial electronic message regardless of framing, send volume, or warmup quality. Good email deliverability infrastructure (SPF/DKIM/DMARC, warmup) solves inbox placement, not consent — a well-warmed domain sending to a non-consented list is the same violation with better delivery odds, not a smaller one.

**How to apply:** If this list resurfaces again in any future session, the same concerns apply without needing to re-litigate from scratch — link back to this memory. The constructive alternative already offered and partially accepted: same technical infrastructure (domain, DNS, warmup schedule), applied to a small, hand-picked, individually-researched, publicly-sourced list instead of the 51k. Same Owner/Executive + Small-Mid targeting logic is fine — the list underneath it is the actual problem, not the strategy.
