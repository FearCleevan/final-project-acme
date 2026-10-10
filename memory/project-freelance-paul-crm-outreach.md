---
name: project-freelance-paul-crm-outreach
description: "Post-Acme freelance pivot: Land-First-Client plan, Paul CRM feature buildout and bugs fixed, real outreach status, and the deferred paid-mailbox todo"
metadata:
  node_type: memory
  type: project
  originSessionId: a2f05c4c-78d3-4e06-a401-e6d4dff5b0ba
---

Follows on from [[project-2026-07-15-security-incident-job-status]] — since July 15 was Peter's last day at Acme, this tracks what he's actually been building to land his first freelance client.

## Land-First-Client plan

Folder created at `E:\Projects Version 2\Land-First-Client\` with: `GAME_PLAN.md`, `HOW_TO_LAND_YOUR_FIRST_CLIENT.md`, `CASE_STUDY_ACME_VINTAGE_SUPPLY.md` (draft — Acme was missing from the portfolio despite being the strongest proof point), `OUTREACH_TEMPLATES.md` (self-intro-first structure — user explicitly asked not to go straight to the business pitch), `PRICING_PACKAGES.md`, `WARMUP_STRATEGY.md`, `ONTARIO_RESTAURANTS_OUTREACH_DRAFTS.md` (8 individually-researched, real restaurants with verified site issues — not the 51k list, see [[feedback-51k-leads-recurring]]).

**Status as of 2026-07-27: none of the 8 have actually been contacted yet.** Real contact emails were never pulled from their sites, and nothing's been loaded into Paul CRM as real prospects. This is the actual next revenue-generating action, still pending.

## Paul CRM (`crm-project/crm-app`, github.com/FearCleevan/crm-app)

Real product with MCP tools connected to Claude. Multiple genuine bugs found and fixed this session (not just the Inbox/Sent/Drafts feature work):

- `send_outreach_email` (crm-mcp) was unconditionally appending a hardcoded duplicate signature server-side on top of any template that already had its own — fixed in `outreach.ts` + `DEPLOY_BUNDLE.ts`.
- `TemplateModal`'s Preview tab converted every `\n` to `<br/>`, shredding any multi-line HTML tag (e.g. a wrapped `<img>` style attribute) into stray visible text.
- `ComposeModal`'s Maximize button had no `onClick` at all — did nothing.
- `ComposeModal`'s `handleTemplateSelect`/`handleProspectPick` had the same `\n`→`<p>` shredding bug as TemplateModal, breaking real HTML templates loaded from the Template Library.
- `sentEmails.service.ts`'s `crm_users(...)` embed was ambiguous (activities has two FKs to crm_users: `assigned_to` and `created_by`) — fixed to `crm_users!created_by(...)`.
- `onSaveDraft={() => {}}` in `EmailsPage.tsx` was a total no-op — Save Draft never persisted anything. `ComposeModal`'s `linkedProspect` also never stored the prospect's `id`, only display fields.

**Feature status — Inbox/Sent/Drafts** (see `EMAIL_INBOX_SENT_DRAFTS_FRONTEND_IMPLEMENTATION.md` / `_BACKEND_IMPLEMENTATION.md` in `crm-app` root): Phase 1 (nav) ✅, Phase 2 (real Sent data, migration 021) ✅, Phase 3 (real Drafts, migration 022) ✅. **Phase 4 (Inbox) still blocked** on a three-way decision documented in the backend plan: (A) true inbound email infra, (B) relabel as an engagement/opens-clicks feed using data that already exists, (C) manual reply-logging stopgap. Not decided yet.

## Critical discovery: prospects currently cannot reply at all

`RESEND_FROM_EMAIL`'s sending subdomain (`mail.peterpaullazan.com`) has SPF/DKIM configured for outbound sending only — **no MX record**, so any reply to an outreach email bounces outright. This was found via a real bounce screenshot during testing, not theoretical.

**Applied stopgap (free, confirmed deployed and working):** `reply_to: lazanpeterpaul@gmail.com` wired into all five Resend send call sites (`outreach.ts`+bundle, `send-campaign-batch`, `send-scheduled-emails`, `send-email`) — note the address matches his real name (an earlier attempt used `jonathan.mauring17@gmail.com`, corrected since that name mismatch would look suspicious to a replying prospect). All four affected Edge Functions manually redeployed via Supabase Dashboard and confirmed by the user. Replies now land in a real inbox instead of bouncing.

Full session handoff (for a fresh session opened directly in `crm-project`, since this memory is scoped to the acme-project working directory and won't carry over) is saved at `crm-project/crm-app/SESSION_HANDOFF_2026-07-27.md`.

**Proper fix — deferred as a todo, not abandoned:** set up a real receiving mailbox on the domain (Zoho Mail was the path attempted — signup flow routed into `mailadmin.zoho.com`'s paid hosting console rather than surfacing a free tier; cheapest option found was Mail Lite at $15/year). **Explicitly not purchased — Peter doesn't have $15 free right now** (broke, no income since the July 15 job loss). Revisit once there's real income from a client. If this resurfaces in a future session, the reply-to stopgap is already live and working — no urgency to rush the paid mailbox.

## How to apply

- Don't propose spending money on infrastructure polish (branded mailbox, paid tools) while Peter has stated he's broke — the free stopgap already solves the functional problem.
- The actual bottleneck to landing a client right now is *sending real outreach*, not further CRM feature work — if this resurfaces, check first whether the 8 Ontario restaurants have been contacted yet before suggesting more building.
- Same "no Co-Authored-By trailer" rule applies to Paul CRM commits as it does elsewhere — see [[feedback-no-coauthor-trailer]].
