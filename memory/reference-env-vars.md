---
name: reference-env-vars
description: "All environment variables for the Acme Vintage Supply project — names, purposes, and where to find real values. Never store actual secrets here."
metadata: 
  node_type: memory
  type: reference
  originSessionId: bdcf8adf-14ea-4194-b64d-64bf7ad5ab79
---

All actual secret values live in `.env.local` (local dev) and Vercel → Project → Settings → Environment Variables (production). Never paste real tokens into memory files or plan docs.

## Shopify

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | Storefront domain (`w061f6-k8.myshopify.com`) |
| `SHOPIFY_STORE_DOMAIN` | Same, server-side |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Public Storefront API token |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Same, server-side |
| `SHOPIFY_ADMIN_TOKEN` | Admin API token (`shpat_...`) — server only |
| `NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_ID` | Shopify customer account shop ID (`99152462129`) |
| `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID` | OAuth PKCE client ID for customer auth |
| `SHOPIFY_CLIENT_ID` | App OAuth client ID (used once to get admin token) |
| `SHOPIFY_CLIENT_SECRET` | App OAuth client secret (used once) |
| `SHOPIFY_WEBHOOK_SECRET` | Webhook HMAC verification (currently empty) |

## Upstash Redis

| Variable | Purpose |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Redis REST endpoint (`https://hip-tortoise-117877.upstash.io`) |
| `UPSTASH_REDIS_REST_TOKEN` | Redis bearer token — **rotate if exposed in git** |

Used for: rate limiting (admin login/OTP), CMS content storage, admin password hash (`acme:admin:password_hash`).

## Admin Auth

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD_HASH` | bcrypt hash (cost 12) of admin password. Single-quoted in `.env.local` to prevent dotenv-expand mangling `$` signs. Active hash may be overridden by Redis key `acme:admin:password_hash` after a password reset. |
| `ADMIN_EMAIL` | Comma-separated OTP recipients: `jonathan.mauring17@gmail.com,scottsfi@hotmail.com,acmesign01@gmail.com` |
| `SESSION_SECRET` | iron-session cookie encryption key (min 32 chars) |
| `RESEND_API_KEY` | Resend email API key for OTP + forgot-password emails (`re_...`) |

## Vercel Blob (CMS images)

| Variable | Purpose |
|---|---|
| `BLOB_STORE_ID` | Vercel Blob store ID (`store_ASGwyTOHrjQJk9D7`) |
| `BLOB_READ_WRITE_TOKEN` | Blob upload token — rotate if exposed |

## Google / Sanity / Other

| Variable | Purpose |
|---|---|
| `CONTACT_SCRIPT_URL` | Google Apps Script endpoint for contact form + newsletter |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (`https://acmevintagesupply.com`) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project (unused — CMS replaced with Redis + JSON) |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset (unused) |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Sanity API version (unused) |
| `SANITY_API_TOKEN` | Sanity write token (unused) |

## Key notes

- `ADMIN_PASSWORD_HASH` must use **single quotes** in `.env.local`: `ADMIN_PASSWORD_HASH='$2b$12$...'` — double quotes cause dotenv-expand to mangle the `$` signs and break login.
- After a password reset via `/admin/forgot-password`, the new hash is stored in Redis (`acme:admin:password_hash`) and takes precedence over the env var. The env var becomes a fallback seed only.
- If `UPSTASH_REDIS_REST_TOKEN` or `BLOB_READ_WRITE_TOKEN` are ever pasted into a plan doc or committed to git, rotate them immediately at upstash.com / vercel.com/storage.
