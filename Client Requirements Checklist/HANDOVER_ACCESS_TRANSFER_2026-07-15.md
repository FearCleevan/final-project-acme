# Access & Infrastructure Handover — Acme Vintage Supply, Acme Sign, Frasco

**Prepared by:** Peter Paul Lazan · jonathan.mauring17@gmail.com
**Date:** July 15, 2026
**Purpose:** Full inventory of every account/service these three projects depend on, current ownership, and exactly what needs to happen for continuity — regardless of my continued involvement.

---

## Read this first

**The most important finding:** all three live sites below are currently hosted under my own personal Vercel account (`fearcleevan`), and their GitHub repos are under my personal GitHub account (`FearCleevan`) — not under Scott's or the company's own accounts. This means the company currently has no independent way to redeploy, rotate secrets, or access the code without going through me. This was never revoked or at-risk of disappearing on its own — a personal account doesn't get shut off by an employer — but it's not something a client's production infrastructure should depend on long-term, regardless of what happens with my position. Transferring these is the right thing to do either way.

Do not send passwords or raw API keys over email. Every item below has a proper transfer/invite mechanism — use those.

---

## Acme Vintage Supply (acmevintagesupply.com)

| Service | Current owner | Action needed |
|---|---|---|
| **GitHub repo** — `FearCleevan/final-project-acme` | Me (personal) | Transfer repository ownership to company/Scott's GitHub account |
| **Vercel project** — `acmelampandsign` | Me (personal, `fearcleevans-projects` team) | Transfer project to a team the company controls — env vars (Resend, Supabase, Shopify tokens, session secret, etc.) travel with it automatically |
| **Supabase project** | Me (personal) — not part of original setup guide, built later for CMS/reviews/analytics/contact inbox | Transfer project ownership to another Supabase org |
| **Resend** (transactional email, `hello@acmevintagesupply.com`) | Me (personal) — not part of original setup guide, built later | Add company as team member or transfer account/domain |
| **Upstash Redis** (rate limiting, OTP storage) | Me (personal) — built later | Transfer or re-provision under company account |
| **Shopify** | **Scott already owns this** (per original setup guide — Scott created the account, invited me as collaborator) | Low priority — just remove my collaborator access when convenient |
| **Google Workspace, Mailchimp** | **Scott already owns these** (per original setup guide) | Low priority — remove my admin/editor role when convenient. Note: Mailchimp may be unused/legacy since a custom Resend-based marketing system was built later — worth confirming with Scott whether it's still needed |
| **Google Analytics 4** | **Me (personal)** — contrary to the original setup guide's plan, this is actually still on my Google account | Add Scott (or company) as an **Account**-level Administrator (Admin → Account Access Management → Add users), not just Property level — this gives full independent control |
| **Google Search Console** | **Me (personal)** — same correction as above | Add the new owner directly as **Owner** (Settings → Users and permissions → Add user → Owner) — as the existing verified owner I can grant this without them re-verifying the domain |
| **Google Merchant Center** | **Me (personal)** — set up later for Shopify product feed approval, not in original guide | Settings → Account access → Add user → Admin role |
| **Bing Webmaster Tools** | **Me (personal)** — not in original guide | Site Settings → Users → Add user with Admin/Owner permission |
| **Domain (acmevintagesupply.com / .ca)** | **Scott already owns this** — registered under his own GoDaddy account | No action needed |
| **Sanity** (env vars present in Vercel project) | Unclear — verify current usage before assuming it needs transfer; may be a leftover from an earlier approach | Verify still in use, then transfer if so |

---

## Acme Sign (acmesign.ca revamp)

| Service | Current owner | Action needed |
|---|---|---|
| **GitHub repo** — `FearCleevan/acmesign` | Me (personal) | Transfer repository ownership |
| **Vercel project** — `acme-sign` (live at acme-sign.vercel.app) | Me (personal) | Transfer project to company-controlled team |
| **Domain (acmesign.ca)** | **Scott already owns this** — registered under his GoDaddy account | No transfer needed. DNS currently delegated to Amazon Route 53; the actual WordPress hosting behind that is a separate account I never had full control of — Evan Mugford (PeachBlitz) currently manages access there |
| **Backend** | None yet — contact form is UI-only, no Supabase/Resend wired up | Nothing to transfer |

**Known open issue:** acmesign.ca (the current live WordPress site) was compromised via a vulnerable plugin. Evan Mugford is currently handling restoration from backup; status as of today is in progress, not fully confirmed clean yet. The **new** rebuild above (`acme-sign.vercel.app`) is a separate, unaffected asset — it was never connected to the live domain.

---

## Frasco (frasco.ca revamp)

| Service | Current owner | Action needed |
|---|---|---|
| **GitHub repo** — `FearCleevan/acme-frasco-revamp` | Me (personal) | Transfer repository ownership |
| **Vercel project** — `frasco` (live at frasco-sage.vercel.app) | Me (personal) | Transfer project to company-controlled team |
| **Domain (frasco.ca)** | **Scott already owns this** — registered under his GoDaddy account | No transfer needed. DNS delegated to Amazon Route 53; actual WordPress hosting is a separate account, same situation as Acme Sign — managed by Evan Mugford |
| **Backend** | None yet — contact form UI-only | Nothing to transfer |

**Known open issue:** frasco.ca was compromised via the same vulnerability pattern as Acme Sign. Evan reported it fixed as of yesterday, but as of today a public Google search (`site:frasco.ca`) still shows indexed spam listings — worth confirming with Evan whether this is just search-index lag or the cleanup is incomplete before treating it as resolved. This new rebuild (`frasco-sage.vercel.app`) is completely unaffected — never connected to the live domain, and its routes were restructured this week to match frasco.ca's URLs exactly (`/nde-ndt`, `/about-us`, `/contact-us`, etc.) in case a domain cutover is approved later, with a full redirect-free URL match already verified working.

---

## How to actually do each transfer (quick reference)

- **GitHub:** Repo Settings → scroll to "Danger Zone" → Transfer ownership. Recipient must accept via email.
- **Vercel:** Project Settings → Transfer Project → choose destination team. Recipient must accept.
- **Supabase:** Project Settings → General → Transfer project to another organization.
- **Resend:** Team settings → invite the new owner, or contact Resend support for a full account transfer if the domain itself needs to move.
- **Upstash:** Account/team settings → transfer database, or simplest: re-provision fresh under the new account and update the Vercel env vars pointing to it.
- **Google Analytics 4:** Admin → Account Access Management → Add users → grant **Administrator** at the **Account** level (not just the Property).
- **Google Search Console:** Settings → Users and permissions → Add user → set to **Owner**. As the current owner I can grant this directly, no re-verification needed from Scott's side.
- **Google Merchant Center:** Settings → Account access → Add user → **Admin** role.
- **Bing Webmaster Tools:** Site Settings → Users → Add user → **Admin/Owner** permission.

None of these require sharing a password. All of them notify the recipient and require their acceptance.

---

## Priority order if time is limited

1. **GitHub repo transfers** (all three) — highest risk if delayed, since code access is the foundation everything else depends on
2. **Vercel project transfers** (all three) — env vars travel with these, covering most of the secrets question in one step
3. **Supabase, Resend, Upstash** for Acme Vintage Supply specifically (the only one of the three with a live backend in production use)
4. **Google Analytics 4, Search Console, Merchant Center, Bing Webmaster Tools** — lower urgency than the above (nothing breaks immediately if delayed), but still on my personal account and needed for the client to independently manage SEO/product-feed visibility going forward
5. Everything Scott already owns — lowest priority, just a cleanup of my own access when convenient

---

*Prepared in good faith to ensure client continuity regardless of employment outcome.*
