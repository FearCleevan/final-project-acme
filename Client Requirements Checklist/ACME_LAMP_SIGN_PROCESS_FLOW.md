# Acme Lamp & Sign Co. — System Process Flow
**Frontend Reference Document · Spring Release**

> This document describes the complete user journey through the Acme Lamp & Sign Co. storefront — from first visit through to order tracking and account management. Intended as a client-facing guide for understanding how each part of the system connects.

---

## Table of Contents

1. [Entry Points](#1-entry-points)
2. [Browsing the Storefront](#2-browsing-the-storefront)
3. [Search](#3-search)
4. [Catalog & Filtering](#4-catalog--filtering)
5. [Product Detail Page](#5-product-detail-page)
6. [Add to Crate](#6-add-to-crate)
7. [View Full Crate](#7-view-full-crate)
8. [Checkout — Contact & Shipping](#8-checkout--contact--shipping)
9. [Save Billing Address (Condition)](#9-save-billing-address-condition)
10. [Checkout — Payment](#10-checkout--payment)
11. [Checkout — Review & Place Order](#11-checkout--review--place-order)
12. [Order Confirmed](#12-order-confirmed)
13. [Order Tracking](#13-order-tracking)
14. [Account Creation & Sign In](#14-account-creation--sign-in)
15. [Account Profile](#15-account-profile)
16. [Returns](#16-returns)
17. [Full End-to-End Flow](#17-full-end-to-end-flow)

---

## 1. Entry Points

A visitor can arrive at the storefront through any of the following routes:

| Entry Point | URL | Description |
|---|---|---|
| Homepage (Storefront) | `/` | Hero, category grid, provenance bar, newsletter |
| Catalog | `/catalog` | Full product listing with filtering |
| Product Detail | `/catalog/[slug]` | Individual product page |
| Our Story | `/our-story` | Brand narrative |
| Heritage | `/heritage` | History timeline since 1873 |
| Journal | `/journal` | Editorial bench notes |
| Contact | `/contact` | Enquiry form + order tracking |

---

## 2. Browsing the Storefront

```
User lands on Homepage  /
        │
        ├── Scrolls through Hero Section
        │         └── CTA: "Enter the Catalog" → /catalog
        │
        ├── Category Grid (4 categories)
        │         └── Click any category → /catalog?category=[type]
        │
        ├── Provenance Marquee (trust signals, auto-scrolling)
        │
        ├── Newsletter Strip
        │         └── Enter email → subscribes (no navigation)
        │
        └── Footer
                  ├── Catalog links → /catalog?category=[type]
                  ├── Workshop links → /our-story, /heritage, /journal, /guides, /restoration
                  └── Service links → /track-order, /contact, /shipping, /returns, /faq
```

**Navigation Bar (persistent, all pages):**
- **Brand mark** → `/` (Home)
- **Desktop links** → Storefront, The Catalog, Our Story, Heritage, Contact
- **Search icon** → Opens search overlay
- **User icon** → Opens account dropdown (sign in or profile)
- **Crate icon** → Opens crate side drawer
- **Hamburger (mobile/tablet)** → Opens mobile navigation drawer

---

## 3. Search

```
User clicks Search icon (🔍) in nav
        │
        ▼
Search Overlay opens (full-screen, animated)
        │
        ├── User types query
        │         └── Results filter in real-time from product catalog
        │
        ├── User clicks a result
        │         └── Navigate to /catalog/[slug]  →  Product Detail Page
        │
        └── User presses Escape / clicks outside
                  └── Overlay closes, returns to current page
```

---

## 4. Catalog & Filtering

**URL:** `/catalog`

```
User arrives at /catalog
        │
        ▼
CatalogHeader  →  Spring Release · 50 Pieces
        │
        ▼
FilterBar
        ├── Category Pills (horizontal scroll)
        │         All Pieces  │  Lighting  │  Glass & Chimneys  │  Hardware  │  Signs
        │         └── Click any pill → filters product grid instantly
        │
        ├── Dropdown Filters (stacked on mobile, row on tablet+)
        │         ├── Burner Size  (Any / No.1 / No.2 / No.3 / Universal)
        │         ├── Material     (Any / Brass / Nickel / Glass / Porcelain / Iron)
        │         └── Sort By      (Curator's order / Price ↑ / Price ↓ / Newest)
        │
        └── "Refine ↓" button → Opens FilterSidebar (slide-in panel)
                  └── Advanced filters with count of matching pieces
        │
        ▼
ProductGrid  →  1 · 2 · 3 · 4 columns (responsive)
        │         Animated transitions when filters change
        │         Each card: image plate, name, SKU, price, "Add to Crate" button
        │
        └── Click product card → /catalog/[slug]  →  Product Detail Page
```

**Filter behaviour:**
- All filters are combined (AND logic — burner + material + category all apply together)
- Piece count updates live as filters change
- Empty state shown with prompt to broaden search if no results match

---

## 5. Product Detail Page

**URL:** `/catalog/[slug]`

```
User arrives at /catalog/[slug]
        │
        ▼
Breadcrumb: Storefront / Catalog / [Product Name]
        │
        ▼
Two-column layout (stacks to single column on mobile)
        │
        ├── LEFT — ProductGallery
        │         ├── Main image plate (large)
        │         └── Thumbnail strip → click to switch main image
        │
        └── RIGHT — ProductInfo (sticky on desktop)
                  ├── Category eyebrow + product name
                  ├── SKU + bench test date
                  ├── Price (serif, brass)
                  ├── Star rating chip → scrolls to #reviews
                  ├── FitmentBox (compatible lamp bodies)
                  ├── Variant selectors (if applicable)
                  ├── Quantity stepper
                  ├── "Add to Crate" button
                  │         └── See Section 6
                  └── Trust signals (returns, bench tested, straw-packed)
        │
        ▼
Below the fold (full width):
        ├── Notes from the Bench  (editorial copy, why this piece made the cut)
        ├── Full Specification     (SpecTable — all technical details)
        ├── Customer Reviews       (aggregate score + individual reviews)  ← id="reviews"
        └── Related Products       (same category, 3-column grid)
                  └── Click → another /catalog/[slug]
```

---

## 6. Add to Crate

```
User clicks "Add to Crate" on ProductInfo
        │
        ▼
Item added to Crate (Zustand store, persists in localStorage)
        │
        ├── Button flashes confirmation  ("Added ✓")
        │
        ├── Crate icon badge in nav updates  (+1)
        │
        └── Side drawer does NOT auto-open
                  (User can continue browsing other products)
                  │
                  └── User opens drawer manually via crate icon
                            └── See Section 7
```

> **Design decision:** The drawer stays closed so the user can add multiple items without interruption. It only opens when the user deliberately clicks the crate icon.

---

## 7. View Full Crate

**Trigger:** User clicks crate icon (📦) in nav  
**Side Drawer URL:** stays on current page  
**Full Page URL:** `/crate`

```
Crate Side Drawer opens (slides in from right)
        │
        ├── Lists all items  (name, SKU, qty, price)
        ├── Order subtotal
        ├── Freight estimate
        ├── Free freight badge  (if subtotal ≥ $150)
        │
        ├── "View full crate" button  → /crate  (drawer closes)
        │         Full crate page includes:
        │         ├── Editable quantity steppers per item
        │         ├── Remove item button
        │         ├── Sticky order summary sidebar
        │         └── Trust signals (30-day returns, straw-packed, real return address)
        │
        └── "Proceed to Checkout" button  → /checkout  (drawer closes)
                  └── See Section 8
```

**Empty crate state:**
```
Crate is empty
        └── Empty state shown (Ø glyph + message)
        └── "Walk the catalog →" button  → /catalog
```

---

## 8. Checkout — Contact & Shipping

**URL:** `/checkout`  
**Guard:** If crate is empty → auto-redirects to `/catalog`

```
User arrives at /checkout
        │
        ▼
Breadcrumb: Storefront / Your Crate / Checkout
        │
        ▼
CheckoutSteps progress bar  [1] → [2] → [3]
        │
        ▼
STEP 1 — Contact & Shipping  (accordion panel, open)
        │
        ├── Full name
        ├── Email
        ├── Phone (for freight)
        ├── Street address
        ├── Apt / Suite (optional)
        ├── City / State / ZIP
        ├── Country (dropdown)
        ├── Notes for the packer (optional)
        │
        ├── "Save for next time" toggle  ← See Section 9
        │
        └── "Continue to payment →" button
                  ├── Validates all required fields
                  ├── Shows inline errors if incomplete
                  └── On success → opens Step 2, Step 1 collapses (shows "Edit" to reopen)
```

---

## 9. Save Billing Address (Condition)

This is a conditional flow triggered by the "Save for next time" toggle in Step 1.

```
User toggles "Save for next time"
        │
        ├── IS SIGNED IN?
        │         │
        │         YES → Checkbox ticks immediately ✓
        │               Address saves to account on form submit
        │               Pre-fills form on next checkout visit
        │
        └── NOT SIGNED IN?
                  │
                  ▼
        AuthModal opens  (over the checkout page — no navigation away)
                  │
                  ├── SIGN IN tab
                  │         ├── Email + Password
                  │         ├── Demo: demo@acmelamp.co / demo1234
                  │         └── On success → modal closes
                  │                         checkbox ticks ✓
                  │                         form data preserved
                  │                         address saves on submit
                  │
                  └── CREATE ACCOUNT tab
                            ├── Name + Email + Password + Confirm
                            └── On success → modal closes
                                            checkbox ticks ✓
                                            form data preserved
                                            address saves on submit
```

> **Why a modal instead of navigation?**  
> Navigating away from checkout causes the user to lose their filled form. The modal keeps the checkout page intact underneath — the user signs in and returns to exactly where they were.

---

## 10. Checkout — Payment

```
STEP 2 — Payment  (opens after Step 1 complete)
        │
        ├── Card number  (auto-formats: 4444 4444 4444 4444)
        ├── Expiry       (auto-formats: MM / YY)
        ├── CVC
        ├── Name on card
        │
        ├── "Mock payment" notice chip  (demo — no real charges)
        │
        └── "Continue to review →" button
                  └── On success → opens Step 3, Step 2 collapses
```

---

## 11. Checkout — Review & Place Order

```
STEP 3 — Review & Place Order  (opens after Step 2 complete)
        │
        ├── Order Summary  (visible in sticky sidebar on desktop,
        │                   visible inline inside Step 3 on mobile)
        │         ├── Item list with thumbnails
        │         ├── Subtotal
        │         ├── Freight (free if ≥ $150)
        │         └── Order total
        │
        └── "Place order →" button  (full-width, green)
                  ├── Clears the crate (Zustand store)
                  └── Navigates to /checkout/confirmed
                            └── See Section 12
```

**Edit flow:** At any step, completed panels show an "Edit" link that re-opens that step without losing data from later steps.

---

## 12. Order Confirmed

**URL:** `/checkout/confirmed`

```
User arrives at /checkout/confirmed
        │
        ▼
Dark canvas confirmation screen
        │
        ├── Green checkmark
        ├── "Order placed." heading
        ├── Unique order reference  (e.g. ACME-2614-SP)
        │         └── Copy icon → copies reference to clipboard
        │
        ├── Confirmation message
        │         "Straw-packed and dispatched within two business days."
        │
        ├── "Track my order →" button  → /track-order?ref=ACME-XXXX-SP
        │         └── See Section 13
        │
        └── "Walk the catalog" button  → /catalog
```

---

## 13. Order Tracking

**URL:** `/track-order` or `/track-order?ref=[reference]`

```
User arrives at /track-order
        │
        ├── If URL has ?ref=[reference]  →  auto-fills input + shows result immediately
        │
        └── If no ref  →  shows search form
        │
        ▼
User enters order reference number
        │
        ├── VALID REFERENCE  (matches demo data)
        │         └── Shows tracking timeline:
        │                   ●  Order Received       (filled green = done)
        │                   ●  Packed at Adelaide   (filled green = done)
        │                   ●  Dispatched           (filled green = done)
        │                   ○  In Transit           (current stage — pulsing)
        │                   ○  Delivered            (upcoming — ghost)
        │
        └── INVALID REFERENCE
                  └── Shows "not found" state with prompt to contact us
```

**Demo references available for testing:**

| Reference | Status |
|---|---|
| `ACME-2614-SP` | Delivered |
| `ACME-2591-SP` | In Transit / Shipped |
| `ACME-2540-SP` | Return Requested |

**Access from Contact page:**
```
/contact  →  "Already placed an order?" card
        └── Enter reference → click arrow →  /track-order?ref=[value]
        └── Demo reference chips to click and test
```

---

## 14. Account Creation & Sign In

**Trigger:** Clicking the user icon (👤) in the nav

```
User clicks user icon in nav
        │
        ├── NOT SIGNED IN
        │         │
        │         ▼
        │   AccountDropdown opens
        │         ├── SIGN IN tab
        │         │         ├── Email + Password
        │         │         ├── Demo: demo@acmelamp.co / demo1234
        │         │         └── On success → navigates to /account
        │         │
        │         └── CREATE ACCOUNT tab
        │                   ├── Email + Password + Confirm
        │                   └── On success → navigates to /account
        │
        └── SIGNED IN
                  │
                  ▼
        AccountDropdown shows Profile Panel
                  ├── Avatar (initial) + Name + Email
                  ├── Order history     → /account?tab=orders
                  ├── Returns           → /account?tab=returns
                  ├── Saved addresses   → /account?tab=addresses
                  ├── Track an order    → /track-order
                  ├── "View profile"    → /account
                  └── "Sign out"        → clears session → /
```

**Demo account credentials:**

| Field | Value |
|---|---|
| Email | `demo@acmelamp.co` |
| Password | `demo1234` |
| Pre-loaded | 4 orders · 1 saved address · 1 return |

---

## 15. Account Profile

**URL:** `/account`  
**Guard:** Unauthenticated users are redirected to `/`

```
/account
        │
        ▼
Header: time-aware greeting + name + email + Sign out button
        │
        ▼
Three tabs:
        │
        ├── ORDERS TAB
        │         Lists all orders in reverse-chronological order
        │         Each order card shows:
        │         ├── Order reference + date
        │         ├── Status dot  (Processing · Shipped · Delivered · Return Requested · Returned)
        │         ├── Item list  (name, SKU, qty, price)
        │         ├── Order total
        │         └── "Track →" link  →  /track-order?ref=[id]
        │
        ├── RETURNS TAB
        │         Shows only orders with status "Return Requested" or "Returned"
        │         Each card shows the return reason note
        │         Empty state links to /returns and /contact
        │
        └── ADDRESSES TAB
                  ├── VIEW MODE  (address card + "Edit" button)
                  │
                  ├── EDIT MODE  (card transforms into inline form)
                  │         ├── All address fields editable
                  │         ├── "Save changes" → updates savedAddress in account
                  │         └── "Cancel" → reverts to view mode
                  │
                  ├── NO ADDRESS  (empty state with "+ Add address" button)
                  │
                  └── TRUST ASSURANCE PANEL
                            ├── 256-bit TLS encryption
                            ├── PCI DSS compliant (Shopify Payments Level 1)
                            ├── Data never sold or shared
                            └── Australian Privacy Act 1988 compliant
```

---

## 16. Returns

**URL:** `/returns`

```
User has a return to make
        │
        ├── Via /returns page  →  reads policy  →  emails hello@acmelamp.co
        │
        ├── Via /account Returns tab  →  sees return status on order card
        │
        └── Via /contact  →  writes to us directly
```

**Return policy summary:**
- Damaged / misdescribed → full refund, we pay return postage
- Change of mind (whole, undamaged) → refund minus freight, buyer pays return postage
- Window: 30 days from delivery
- No online portal — a person handles every return

---

## 17. Full End-to-End Flow

```
VISIT STOREFRONT (/)
        │
        ▼
BROWSE  →  Category Grid  /  Hero CTA  /  Footer links
        │
        ▼
SEARCH (overlay) or FILTER (/catalog)
        │
        ▼
PRODUCT DETAIL  /catalog/[slug]
        │
        ├── Read specs, reviews, fitment notes
        │
        ▼
ADD TO CRATE  (badge +1, drawer stays closed)
        │
        ├── Continue browsing and adding more items
        │
        ▼
OPEN CRATE DRAWER  (crate icon in nav)
        │
        ├── Review items + subtotal
        │
        ▼
VIEW FULL CRATE  /crate
        │
        ├── Adjust quantities or remove items
        │
        ▼
PROCEED TO CHECKOUT  /checkout
        │
        ├── STEP 1 — Contact & Shipping
        │         ├── Fill in delivery details
        │         └── "Save for next time" toggle
        │                   ├── Signed in  →  saves immediately ✓
        │                   └── Not signed in  →  AuthModal opens (stays on page)
        │                             └── Sign in / Create account  →  modal closes  →  saves ✓
        │
        ├── STEP 2 — Payment
        │         └── Card details (mock)
        │
        └── STEP 3 — Review & Place Order
                  └── Place order →  crate cleared
        │
        ▼
ORDER CONFIRMED  /checkout/confirmed
        │
        ├── Copy order reference
        │
        ▼
TRACK ORDER  /track-order?ref=ACME-XXXX-SP
        │
        ├── Live tracking timeline
        │
        ▼
ACCOUNT  /account  (if signed in)
        │
        ├── Orders tab  →  full order history
        ├── Returns tab  →  return status + reason
        └── Addresses tab  →  edit / add billing address
```

---

## Key System Behaviours

| Behaviour | Detail |
|---|---|
| **Crate persistence** | Zustand + localStorage — survives page refresh and browser close |
| **Auth persistence** | Zustand + localStorage — stays signed in across sessions |
| **Saved address pre-fill** | On next checkout visit, all fields auto-populate from saved address |
| **Drawer auto-open** | Disabled — crate drawer only opens on deliberate user action |
| **Page transitions** | Fade + slide (300ms) on every route change; respects `prefers-reduced-motion` |
| **Mobile nav** | Hamburger drawer with auth-aware account link + catalog category links |
| **Empty crate guard** | `/checkout` auto-redirects to `/catalog` if crate is empty |
| **Auth guard** | `/account` auto-redirects to `/` if not signed in |
| **Order reference** | Generated on confirmed page, stable across re-renders (no hydration mismatch) |
| **Track order deep link** | `?ref=` param pre-fills and immediately shows tracking result |

---

## Pages Reference

| Page | URL | Auth required |
|---|---|---|
| Storefront | `/` | No |
| Catalog | `/catalog` | No |
| Product Detail | `/catalog/[slug]` | No |
| Your Crate | `/crate` | No |
| Checkout | `/checkout` | No (but crate must not be empty) |
| Order Confirmed | `/checkout/confirmed` | No |
| Track Order | `/track-order` | No |
| Contact | `/contact` | No |
| Our Story | `/our-story` | No |
| Heritage | `/heritage` | No |
| Journal | `/journal` | No |
| Lamp-Lighting Guide | `/guides` | No |
| Restoration Services | `/restoration` | No |
| Shipping & Freight | `/shipping` | No |
| 30-Day Returns | `/returns` | No |
| FAQ | `/faq` | No |
| **My Account** | `/account` | **Yes — redirects to `/` if not signed in** |

---

*Acme Lamp & Sign Co. · Adelaide House · 14 Pirie Street, Adelaide SA 5000*  
*Frontend build: Next.js 16 · Tailwind CSS v4 · Framer Motion · Zustand*  
*Document version: Spring Release 2026*
