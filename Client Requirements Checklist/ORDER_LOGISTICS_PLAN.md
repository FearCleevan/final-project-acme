# Order Fulfillment & Logistics Plan
**Project:** Acme Vintage Supply — Admin Dashboard
**Prepared by:** Peter (PPlazan)
**Date:** June 3, 2026
**Status:** Planned — not yet built

---

## What This Covers

When an order arrives in the Admin Dashboard, Scott needs to be able to:
1. Open the order and see all customer + item details
2. Print a **Shipping Label** to stick on the straw-packed crate
3. Print or download an **Invoice / Receipt** to include in the package
4. Mark the order as **Fulfilled** once it ships
5. Add a **Tracking Number** so the customer can track their parcel

---

## Current State (What Works Today)

- Order rows in the Orders table are now **clickable** → opens Order Detail page
- Order Detail page shows: line items, totals, customer info, shipping address, payment/fulfillment status
- Fulfillment Timeline with "Add stage" button (Confirmed → In Transit → Out for Delivery → Delivered)
- Export CSV of all orders

---

## Planned Logistics Flow

```
Order arrives in Shopify
        ↓
Scott sees it in Admin Dashboard → Orders
        ↓
Clicks order row → Order Detail page opens
        ↓
Reviews line items + customer address
        ↓
Prints Shipping Label  ←──── [PRINT BUTTON]
        ↓
Packs the crate (straw-packed)
        ↓
Ships the order
        ↓
Enters Tracking Number  ←──── [TRACKING INPUT]
        ↓
Clicks "Mark as Fulfilled"  ←──── [ACTION BUTTON]
        ↓
Shopify automatically emails customer with tracking info
        ↓
Customer receives crate
        ↓
Scott marks "Delivered" in Fulfillment Timeline
```

---

## Features to Build

### 1. Print Shipping Label
A printable label (browser print dialog) showing:
- Acme Vintage Supply name + return address (25 Raddall Ave, Dartmouth, NS)
- Customer name + full shipping address (large, easy to read)
- Order number (e.g. #1001)
- Number of items + brief item description
- "FRAGILE — STRAW-PACKED" notice

**How it works:** Clicking "Print Label" opens a print-optimized view and triggers `window.print()`. Admin chrome is hidden via CSS `@media print`. No PDF library needed.

**Customizable:** Logo, return address, font size, whether to show item details or just order number.

---

### 2. Print / Download Invoice
A clean invoice document showing:
- Acme Vintage Supply logo + business address
- Customer billing/shipping address
- Order date + order number
- Line items table (item name, SKU, qty, unit price, subtotal)
- Subtotal, shipping, tax, total
- Payment method + status
- "Thank you for your order" note

**How it works:** Same `window.print()` approach OR generate a PDF using the browser's built-in Save as PDF. No external library required.

**Customizable:** Logo, business address, footer text, whether to show SKU, tax line.

---

### 3. Mark as Fulfilled Button
A prominent button on the Order Detail page that:
- Calls Shopify Admin API to mark the order as fulfilled
- Optionally attaches a tracking number
- Updates the fulfillment status badge immediately in the UI
- Sends Shopify's automatic "Your order has shipped" email to the customer

**Customizable:** Whether to send customer notification email (toggle), which shipping carrier to record.

---

### 4. Tracking Number Input
A text field on the Order Detail page where Scott enters the tracking number from Canada Post / UPS / FedEx. Saves to Shopify so it appears in the customer's order confirmation email and in the Orders list.

---

### 5. Cancel Order Button
Marks the order as cancelled in Shopify. Triggers a refund if payment was already captured. Shows a confirmation dialog before proceeding.

---

## Print Layout Design (Shipping Label)

```
┌─────────────────────────────────────────┐
│  ACME VINTAGE SUPPLY                    │
│  25 Raddall Ave                         │
│  Dartmouth, NS  B3B 1L4                 │
│  Canada                                 │
├─────────────────────────────────────────┤
│                                         │
│  SHIP TO:                               │
│                                         │
│  JOHN SMITH                             │
│  123 MAIN STREET                        │
│  TORONTO  ON  M5V 1A1                   │
│  CANADA                                 │
│                                         │
├─────────────────────────────────────────┤
│  ORDER: #1001    ITEMS: 1               │
│  ⚠ FRAGILE — STRAW-PACKED CRATE        │
└─────────────────────────────────────────┘
```

---

## Print Layout Design (Invoice)

```
ACME VINTAGE SUPPLY                    ORDER #1001
25 Raddall Ave, Dartmouth NS           Jun 3, 2026
acmevintagesupply.ca

Bill to / Ship to:
John Smith
123 Main St, Toronto ON M5V 1A1

─────────────────────────────────────────────────
ITEM                          QTY    PRICE   TOTAL
─────────────────────────────────────────────────
Cadbury's "Eat More Milk"      1    $890.00  $890.00
Original Enamel Advertising Sign
SKU: AVS-CADBURY-001
─────────────────────────────────────────────────
                          Subtotal:  $890.00
                          Shipping:     Free
                          Taxes:       $0.00
                          TOTAL:    $890.00
─────────────────────────────────────────────────
Payment: Paid · Visa ····1234

Thank you for your order. For returns or questions,
contact scott@acmevintagesupply.ca
```

---

## Implementation Notes

- Both print layouts use `@media print` CSS — no external PDF library needed
- Customization handled via a settings object Scott can adjust (logo URL, return address, footer text)
- Fulfillment API call uses existing `adminFetch` pattern already in `lib/admin/shopifyAdmin.ts`
- Tracking number saves to Shopify via `fulfillmentCreate` mutation

---

## Priority Order

| Feature | Priority | Effort |
|---|---|---|
| Print Shipping Label | High | Low (1 day) |
| Print Invoice | High | Low (1 day) |
| Mark as Fulfilled + Tracking | High | Medium (2 days) |
| Cancel Order | Medium | Medium (1 day) |

---

*Plan prepared by Peter · Acme Vintage Supply · June 3, 2026*
