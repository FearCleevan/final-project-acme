---
name: feedback-no-api-keys-in-plans
description: "Never include API keys, tokens, or secrets in plan docs, spec docs, or any file that gets committed to git — only reference .env.local"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: bdcf8adf-14ea-4194-b64d-64bf7ad5ab79
---

Never put API keys, bearer tokens, secrets, or credentials in any of these:
- `docs/superpowers/plans/*.md`
- `docs/superpowers/specs/*.md`
- Any code file, component, or route
- Any markdown or documentation file

**Why:** Plan files get committed to git and pushed to GitHub. The Upstash Redis token was exposed in `docs/superpowers/plans/2026-06-16-admin-password-reset.md` (PR #8286955) and ended up in the public repo history. The token had to be rotated.

**How to apply:**
- In plan verification steps that need a real token, write: `curl ... -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"` — reference the env var name, never the actual value.
- In code, always read from `process.env.VAR_NAME` — never hardcode.
- Secrets live only in `.env.local` (gitignored) and Vercel environment variables.
- If a step needs a real curl command to test, instruct the user to run it themselves with their token from `.env.local` — do not write the token into the plan.
