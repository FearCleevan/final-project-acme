---
name: reference-shopify-401-pixel-error
description: "Shopify private_access_tokens 401 error on checkout — what it is, why it happens, and that it's harmless and not our code"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 4f2c576e-d036-4609-a4a6-cbc9618b085b
---

## Shopify Checkout 401 — `private_access_tokens` Error

**Error seen in browser console:**
```
GET https://acmevintagesupply.myshopify.com/private_access_tokens?id=...&checkout_type=c1
net::ERR_ABORTED 401 (Unauthorized)
```
Source: `CaptureEvents-ButtonPixel.DZxDG5Ix.js` (Shopify's own analytics/pixel script)

**What causes it:**
When a customer clicks "Proceed to checkout" and lands on the Shopify-hosted checkout page (`w061f6-k8.myshopify.com/checkout/...`), Shopify automatically injects its own tracking/pixel scripts. Those scripts try to authenticate with Shopify's internal token system. Because the store is in development/trial mode (or has the Online Store storefront password enabled), those scripts get a 401.

**Is it our code?** No. This is Shopify's script failing to talk to Shopify's own servers. Nothing in the Next.js codebase triggers it.

**Does it break checkout?** No. The 401 is purely from the analytics pixel. Cart, shipping, and payment all work independently.

**How it goes away:** Automatically resolves once the store is on a paid Shopify plan with the storefront password removed (i.e., when the store goes live publicly). No code fix needed on our end.
