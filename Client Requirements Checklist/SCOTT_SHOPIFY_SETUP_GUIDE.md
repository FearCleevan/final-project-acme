# Shopify Setup Guide — Scott Fraser
**Project:** Acme Vintage Supply
**Prepared by:** PPlazan
**Date:** June 3, 2026

---

## What This Guide Covers

1. How to test the full checkout flow right now (no real payments needed)
2. How to set up real payments so customers can actually buy
3. What to do after setup is complete

---

## PART 1 — Test the Checkout Flow Today (No Real Money)

Shopify has a built-in test mode so you can run a full checkout from start to finish without processing any real payment. This lets us confirm everything is working before going live.

### Step 1 — Enable Test Mode

1. Log in to your **Shopify Admin** at `https://w061f6-k8.myshopify.com/admin`
2. Click **Settings** (bottom left)
3. Click **Payments**
4. Scroll down to the section called **"Bogus Gateway"**
5. Click **Activate** next to Bogus Gateway
6. Make sure the toggle **"Enable test mode"** is turned **ON**
7. Click **Save**

### Step 2 — Run a Test Checkout

1. Go to the storefront: **https://acmelampandsign.vercel.app**
2. Browse any product and click **Add to Crate**
3. Open the Crate (basket icon, top right)
4. Click **Proceed to Checkout**
5. Fill in a test shipping address (any address works in test mode)
6. On the payment step, use one of these test card numbers:

| Card Number | Result |
|---|---|
| `1` | ✅ Payment Successful |
| `2` | ❌ Payment Declined |
| `3` | ⚠️ Payment Error |

Or use the full test Visa card:
```
Card Number:  4242 4242 4242 4242
Expiry Date:  Any future date (e.g. 12/28)
CVV:          Any 3 digits (e.g. 123)
Name:         Any name
```

7. Complete the order — you should see a confirmation page
8. Check your Shopify Admin → **Orders** — the test order should appear there

> **Note:** Test orders are real orders in your Shopify system but no actual money is charged. You can delete them afterwards.

---

## PART 2 — Set Up Real Payments (Before Going Live)

Once testing is confirmed working, you need to complete Shopify Payments so real customers can pay.

### Step 1 — Start Shopify Payments Setup

1. Shopify Admin → **Settings** → **Payments**
2. Click **Complete account setup** under Shopify Payments
3. You will be asked for the following information:

### What You Need to Provide

**Business Information**
- Legal business name (e.g. Acme Vintage Supply)
- Business address
- Business type (Sole Proprietor / Corporation / etc.)
- Business registration number (if incorporated)

**Banking Information**
- Bank name
- Account number
- Routing/transit number
- This is where Shopify will deposit customer payments (payouts)

**Personal / Identity Verification**
- Your full legal name
- Date of birth
- Last 4 digits of your SIN (Social Insurance Number) — for Canadian accounts
- A government-issued photo ID may be required (driver's license or passport)

**Tax Information**
- Your business GST/HST number (if registered)

### Step 2 — Verification

After submitting, Shopify will review your information. This typically takes **1 to 3 business days**. You will receive an email when approved.

### Step 3 — Payout Schedule

Once approved, you can set how often Shopify sends money to your bank account:
- Daily
- Weekly
- Monthly

**Recommended:** Weekly — gives a good balance between cash flow and admin simplicity.

### Step 4 — Disable Test Mode When Ready to Go Live

1. Settings → Payments
2. Turn OFF the **"Enable test mode"** toggle
3. Save

> **Important:** Do not disable test mode until you have confirmed the checkout flow is working and you are ready to accept real orders.

---

## PART 3 — Other Items to Complete Before Launch

| Item | Where | Notes |
|---|---|---|
| **Domain name** | GoDaddy / Namecheap / Google Domains | Register `acmevintagesupply.ca` — let Peter know once purchased so the site can be pointed to it |
| **Shopify email notifications** | Settings → Notifications | Shopify sends automatic order confirmation emails to customers — review and customise the email template with your logo and brand colours |
| **Refund / Returns policy** | Settings → Policies | Add your return and refund policy — Shopify can auto-generate a template to start from |
| **Shipping rates** | Settings → Shipping and delivery | Set your shipping zones and rates for Canada and international orders |
| **Taxes** | Settings → Taxes and duties | Confirm your GST/HST settings for Canadian orders |
| **Business email** | Any email provider | Recommended: set up a `scott@acmevintagesupply.ca` address once the domain is registered |

---

## Quick Reference — Storefront & Admin Links

| | Link |
|---|---|
| **Live Storefront** | https://acmelampandsign.vercel.app |
| **Signs Page** | https://acmelampandsign.vercel.app/signs |
| **Admin Dashboard** | https://acmelampandsign.vercel.app/admin |
| **Admin Password** | `acme2026` |
| **Shopify Admin** | https://w061f6-k8.myshopify.com/admin |

---

*Guide prepared by PPlazan · Acme Vintage Supply · June 3, 2026*
