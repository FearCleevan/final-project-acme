---
name: project-order-logistics
description: Planned order fulfillment logistics flow for Acme Vintage Supply admin — invoice, shipping label, fulfillment tracking
metadata:
  type: project
---

Admin order fulfillment logistics flow is planned but not yet built. Current state: order detail page exists with line items, customer info, fulfillment timeline, and "Add stage" button. Order rows are now clickable (fixed # in URL). What's missing is the print/download layer.

**Planned features:**
- Print Invoice (PDF) — order summary with Acme branding, line items, totals, customer address
- Print Shipping Label — customer name + address in large format, order number, item count
- Mark as Fulfilled button — updates Shopify fulfillment status
- Tracking number input — saved back to Shopify order

**Why:** Scott needs to print a shipping label to stick on the straw-packed crate, and an invoice/receipt to include in the package or email to the customer.

**How to apply:** When building the order detail page print features, use `window.print()` with a print-specific CSS class that hides admin chrome and shows only the document. Keep it customizable (Scott may want to change logo, address format, or add custom fields).

**Related:** [[project-acme-lamp-sign]]
