# Customer Auth & Track Order — Implementation Plan
**Project:** Acme Vintage Supply — Storefront
**Prepared by:** Peter (PPlazan)
**Date:** June 3, 2026
**Status:** Planned — not yet built

---

## Overview

Three interconnected features to build:

1. **Track Order** — any visitor can look up a real Shopify order by order number + email
2. **Customer Login / Register** — Shopify-backed authentication (real accounts, not localStorage)
3. **Account Page** — authenticated view of real order history, saved address, returns

All three connect to the **Shopify Storefront API** using existing `NEXT_PUBLIC_SHOPIFY_*` credentials already in the project.

---

## How Shopify Customer Auth Works

Shopify Storefront API uses a token-based system:

```
Customer registers / logs in
        ↓
Shopify returns a customerAccessToken (expires in 24h)
        ↓
Token stored in localStorage (or httpOnly cookie — see notes)
        ↓
All subsequent API calls pass the token
        ↓
Customer data (orders, addresses, profile) is fetched using token
```

**Key mutations:**
- `customerCreate` — register new account
- `customerAccessTokenCreate` — login (returns token)
- `customerAccessTokenDelete` — logout
- `customerRecover` — send password reset email

**Key queries:**
- `customer(customerAccessToken: $token)` — fetch profile, orders, addresses

---

## Architecture

### New Files to Create

```
lib/
  shopifyCustomer.ts          ← All Storefront API customer mutations & queries

store/
  customerStore.ts            ← Zustand store (replaces authStore.ts)
                                 Holds: token, customer profile, orders

app/
  login/
    page.tsx                  ← Login + Register tabs
  account/
    page.tsx                  ← REPLACE current mock — real Shopify data
  track-order/
    page.tsx                  ← REPLACE current mock — real Shopify order lookup

app/api/
  customer/
    orders/route.ts           ← Server-side proxy: fetch orders with token
    profile/route.ts          ← Server-side proxy: fetch/update profile
```

### Files to Modify

```
store/authStore.ts            ← Keep for now but phase out (replaced by customerStore)
components/nav/               ← Person icon → links to /login or /account based on auth state
app/checkout/confirmed/       ← Add "View your order" link using Shopify order ID
```

---

## Feature 1 — Track Order Page (No Login Required)

### How It Works

Any visitor can track an order by entering:
- **Order number** (e.g. `#1001` or just `1001`)
- **Email address** used at checkout

Shopify requires both for security — prevents random people from tracking strangers' orders.

### API Call

Uses Shopify Admin API (server-side, via existing `adminFetch`):
```graphql
query GetOrderByNameAndEmail($name: String!, $email: String!) {
  orders(first: 1, query: "name:#1001 email:john@example.com") {
    edges {
      node {
        name
        createdAt
        fulfillmentStatus
        displayFinancialStatus
        shippingAddress { firstName lastName address1 city province country }
        fulfillments {
          trackingInfo { number url company }
          status
          updatedAt
        }
        lineItems(first: 10) {
          edges { node { title quantity originalUnitPriceSet { shopMoney { amount } } } }
        }
      }
    }
  }
}
```

### What Changes on the Page

| Current (Mock) | New (Real) |
|---|---|
| Searches mockData | Calls `/api/track-order` route |
| Demo reference buttons | Removed |
| ACME-XXXX-SP format | `#1001` format |
| Fake timeline from mockData | Real Shopify fulfillment status |
| Hardcoded carrier/destination | Real data from Shopify |

### New API Route

`app/api/track-order/route.ts` — accepts `{ orderName, email }`, calls Shopify Admin, returns order data. No auth required. Rate-limited to prevent abuse.

---

## Feature 2 — Customer Login & Register

### Login Page (`/login`)

Two tabs: **Sign In** and **Create Account**

**Sign In form:**
- Email
- Password
- "Forgot password?" link → triggers `customerRecover` mutation → Shopify sends reset email

**Create Account form:**
- First name + Last name
- Email
- Password (min 8 chars)
- On success → auto-login → redirect to `/account`

### Shopify Mutations

```graphql
# Register
mutation customerCreate($input: CustomerCreateInput!) {
  customerCreate(input: $input) {
    customer { id email firstName lastName }
    userErrors { field message }
  }
}

# Login
mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
  customerAccessTokenCreate(input: $input) {
    customerAccessToken { accessToken expiresAt }
    userErrors { field message }
  }
}

# Forgot password
mutation customerRecover($email: String!) {
  customerRecover(email: $email) {
    userErrors { field message }
  }
}

# Logout
mutation customerAccessTokenDelete($customerAccessToken: String!) {
  customerAccessTokenDelete(deletedAccessToken: String)
}
```

### Token Storage

Stored in `localStorage` via Zustand persist (same pattern as current `crateStore`). Token expires in 24h — on expiry, redirect to `/login`.

### Nav Icon Behaviour

The person icon (top right) in the nav:
- **Not logged in** → links to `/login`
- **Logged in** → links to `/account`

---

## Feature 3 — Account Page (Real Shopify Data)

### Tabs

#### Orders Tab
Fetches real orders from Shopify using the customer access token:

```graphql
query GetCustomerOrders($token: String!) {
  customer(customerAccessToken: $token) {
    orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
      edges {
        node {
          name
          processedAt
          fulfillmentStatus
          displayFinancialStatus
          totalPriceV2 { amount currencyCode }
          lineItems(first: 5) {
            edges { node { title quantity variant { image { url } } } }
          }
          successfulFulfillments(first: 1) {
            trackingInfo { number url }
          }
        }
      }
    }
  }
}
```

Each order card shows:
- Order number (#1001)
- Date placed
- Items (with image thumbnails)
- Total
- Payment status + Fulfillment status badges
- "Track →" button (links to `/track-order?order=1001&email=...`)
- "View invoice" button (future — when invoice printing is built)

#### Addresses Tab
Fetches saved addresses from Shopify customer account:

```graphql
query GetCustomerAddresses($token: String!) {
  customer(customerAccessToken: $token) {
    defaultAddress { id address1 address2 city province country zip phone }
    addresses(first: 5) {
      edges { node { id address1 city province country zip } }
    }
  }
}
```

Customer can add/edit/delete addresses. Changes saved back to Shopify via:
- `customerAddressCreate`
- `customerAddressUpdate`
- `customerAddressDelete`
- `customerDefaultAddressUpdate`

#### Returns Tab
Displays orders with return/refund status. No custom return system needed — Scott handles returns manually via email. Tab shows:
- Orders where `financialStatus` is `REFUNDED` or `PARTIALLY_REFUNDED`
- Contact email link for initiating a return

#### Profile Tab (Optional)
Let customer update their name and email:
- `customerUpdate` mutation

---

## What Stays the Same

- The **checkout flow** doesn't change — Shopify handles checkout + account creation automatically
- Customers who check out as guests can still track orders (just need order # + email)
- Customers who create accounts during checkout can log in here and see their order history

---

## Copy Fixes (Quick — Do First)

These don't need Shopify API — just text changes:

| File | Current | Fix |
|---|---|---|
| `app/account/page.tsx` | `hello@acmelamp.co` | `hello@acmevintagesupply.ca` |
| `app/account/page.tsx` | Placeholder city: Adelaide | Toronto |
| `app/account/page.tsx` | Placeholder state: SA | ON |
| `app/account/page.tsx` | Country list: Australia first | Canada first |
| `app/account/page.tsx` | "Australian Privacy Act 1988" | Remove — replace with generic |
| `app/track-order/page.tsx` | Demo reference buttons | Remove |
| `app/track-order/page.tsx` | Placeholder: ACME-1001-NS | #1001 |

---

## Build Order (Priority)

| Phase | Task | Effort | Blocker? |
|---|---|---|---|
| 1 | Fix copy issues above | 30 min | No |
| 2 | Track Order — real Shopify API | 1 day | No |
| 3 | `lib/shopifyCustomer.ts` — all mutations/queries | Half day | No |
| 4 | `customerStore.ts` — replace authStore | Half day | No |
| 5 | `/login` page — Sign In + Register tabs | 1 day | No |
| 6 | Nav icon — link to /login or /account | 30 min | Needs Phase 4 |
| 7 | Account page — Orders tab (real data) | 1 day | Needs Phase 3-4 |
| 8 | Account page — Addresses tab (real data) | 1 day | Needs Phase 3-4 |
| 9 | Account page — Returns tab | Half day | Needs Phase 7 |
| 10 | Forgot password flow | Half day | Needs Phase 5 |

**Total estimated: ~7 development days**

---

## Notes for Scott

- Customers who place orders will automatically have a Shopify account created if they opt in during checkout
- Customers can also create accounts separately at `/login`
- Order history, tracking, and address management all live at `/account` once logged in
- Password reset emails are sent automatically by Shopify — no extra setup needed
- Returns are handled manually by Scott via email — no automated return portal needed at this stage

---

*Plan prepared by Peter · Acme Vintage Supply · June 3, 2026*
