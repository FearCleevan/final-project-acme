---
name: project-2026-07-15-security-incident-job-status
description: "Frasco/Acme Sign WordPress compromise (plugin left installed), Peter's job status uncertain, full access handover document created"
metadata: 
  node_type: memory
  type: project
  originSessionId: a3c1bce7-b169-410d-8809-2790ad98c08e
---

**What happened:** Peter installed a bulk asset-download plugin directly on both frasco.ca and acmesign.ca (live WordPress production sites) to extract images for their Next.js redesigns, and did not remove the plugin afterward on either site. Both sites were subsequently compromised via the "Japanese keyword hack" (classic automated, opportunistic WordPress exploit of vulnerable plugins — not evidence of targeted attack). Evan Mugford (PeachBlitz, the prior developer who still controls acmesign.ca's WordPress admin) is handling remediation and billed $250+tax; as of 2026-07-15, `site:frasco.ca` still returns ~31 pages of indexed spam despite Evan reporting Frasco "fixed" the day before — scale strongly suggests the underlying backdoor (likely in `.htaccess` or a core file) was not actually removed, only visible content was restored.

**Job status:** Scott escalated this to the company owner. As of 2026-07-15, Peter's TL told him not to come in the next day, pending a decision on whether he keeps his position. Not yet confirmed either way.

**Handover completed regardless of outcome:** `Client Requirements Checklist/HANDOVER_ACCESS_TRANSFER_2026-07-15.md` in `acme-lamp-sign` — full inventory of every account/service across Acme Vintage Supply, Acme Sign, and Frasco, noting that all three live sites' GitHub repos and Vercel projects are under Peter's *personal* accounts (not the company's), plus GA4/Search Console/Merchant Center/Bing Webmaster Tools also still on his personal Google account. Manager email draft (factual, timeline-based, explicitly deferring to Evan's WordPress expertise rather than disputing his account) was also prepared this session.

**Why this matters:** If Peter returns to this project, check whether the account transfers listed in the handover doc have happened — access to these services may no longer be under his personal control. If he doesn't return, whoever picks up this project needs that handover doc as the starting point.

**How to apply:** Don't assume prior daily-log-style project memories about deployment/hosting ownership are still accurate after this date — verify current ownership against the handover doc rather than older memories. See [[feedback-51k-leads-recurring]] and [[pending-tasks-acme]] for related context from the same period.
