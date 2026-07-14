---
name: feedback-mock-data-sync
description: "When adding required fields to AdminOrderItem, AdminProduct, or Product types, always update all mock data arrays in the same change"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c8c599b2-4bc5-4057-8890-920b021b0b65
---

When a required field is added to a shared type, **always update every mock array in the same edit** — do not wait for a build error.

**Why:** Build errors on Vercel kept failing because required fields were added to types (`soldCount`, `productId`) but not to the mock data. This caused 3 separate failed deployments in one session.

**How to apply:** Any time `AdminOrderItem`, `AdminProduct`, or `Product` gains a new required field, immediately update:
- `lib/admin/mockData.ts` — `mockOrders[].items[]` for `AdminOrderItem`, `mockAdminProducts[]` for `AdminProduct`
- `lib/mockData.ts` — `mockProducts[]` for `Product`

Consider making new fields optional (`field?: type`) in the type definition if mock data coverage is hard to guarantee.
