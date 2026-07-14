---
name: project-cancel-return-deferred
description: "Cancel/return flow and policy pages deferred — waiting on Scott's clear return policy before building"
metadata: 
  node_type: memory
  type: project
  originSessionId: dd4a2e69-848d-4659-9b87-628d758462b5
---

Cancel order flow and policy pages are intentionally deferred until Scott provides a clear written return policy.

**Why:** Scott's email response was ambiguous — "Not sure if we will accept returns on this type of specialty items." Terms & Conditions already say all sales final for specialty items. Building a cancel/refund flow before policy is defined would mislead customers.

**What was designed (ready to build once Scott confirms):**
- Returns page — honest "contact us" approach, no fake 30-day policy
- Shipping page — Scott's answers: free over $150 CAD/local equivalent, worldwide, Canada Post/DHL, 2–4 days, customer files damage claims with carrier
- FAQ page — Scott's actual answers from June 4 email
- Footer label fix — "30-Day Returns" → "Returns & Refunds"
- Account orders tab + Track Order — "Need help with this order?" → `/contact` prefilled with order number (no cancel button)
- Full cancel request flow (account + guest + admin flag + email) — build only after Scott commits to a policy

**How to apply:** When Scott sends a clear written return/cancellation policy, resume this work. The brainstorming session established the three-piece design: ① Account orders cancel request, ② Track Order guest cancel request, ③ Admin flag + email notifications. Visual companion session was started — see `.superpowers/brainstorm/` in project dir.

**Related:** [[project-acme-lamp-sign]]
