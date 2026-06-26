# Email Preview Modal + Template Library — Design Spec
**Date:** 2026-06-26
**Feature:** Two enhancements to the admin Marketing page — a full-screen email preview modal and a pre-built template library tab.

---

## Overview

Two independent UI enhancements to `app/admin/marketing/page.tsx`:
1. **Preview Modal** — replaces the inline iframe toggle with a full-screen modal showing desktop + mobile views of the exact email before sending.
2. **Template Library Tab** — a new "Templates" tab with 4 pre-built content cards Scott can click to pre-fill the entire compose form.

No new API routes or database tables required. All changes are client-side.

---

## Feature 1 — Email Preview Modal

### Trigger
The existing "Show preview" text link is removed. A **"Preview"** button is added to the compose action bar alongside Send Now and Save Draft.

### Modal Layout
- Full-screen dark overlay: `bg-black/60`, `fixed inset-0 z-50`
- Centered white panel: `max-w-[720px] w-full max-h-[90vh] overflow-y-auto rounded-xl`
- **Header:** "Email Preview" title + Desktop/Mobile toggle (left) + ✕ Close button (right)
- **Body:** `<iframe>` renders full branded email HTML from the existing `buildPreviewHtml()` function
  - Desktop mode: `width: 600px`, centered
  - Mobile mode: `width: 375px`, centered
- **Footer:** "Looks good — Send Now" button + "Keep editing" text link

### Behaviour
- Opens instantly — HTML is built client-side from `buildPreviewHtml()`, no network call
- ESC key closes the modal (`useEffect` keydown listener, cleaned up on unmount)
- Clicking the dark overlay closes it
- Reflects current compose state — reopening after edits shows updated content
- Device toggle defaults to Desktop on each open

### State
```typescript
const [previewOpen,  setPreviewOpen]  = useState(false)
const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
```

### Files Changed
- `app/admin/marketing/page.tsx` — remove `previewing` state + `setPreviewing` toggle, add `previewOpen` + `previewDevice` state, add `PreviewModal` inline component, replace "Show preview" link with "Preview" button in action bar

---

## Feature 2 — Template Library Tab

### Tab Addition
A third tab **"Templates"** added to the tab row alongside Subscribers and Campaigns. Uses `BiLayout` icon from react-icons/bi.

### Tab Layout
Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, gap-4.

### Template Card
Each card contains:
- **Thumbnail** — miniature `<iframe>` (height 180px, `scale(0.35) origin-top-left`, pointer-events-none) rendering the actual branded email HTML so Scott sees the real layout
- **Name** — bold, `text-[14px]`
- **Description** — one line, `text-[12px] text-(--admin-text-soft)`
- **"Use Template" button** — full-width, on click: pre-fills compose state → switches to Campaigns tab → opens compose panel

### Pre-Built Templates (hardcoded constants)

```typescript
const PRESET_TEMPLATES = [
  {
    id: 'monthly-bench-notes',
    name: 'Monthly Bench Notes',
    description: 'Perfect for monthly updates from the workshop.',
    template: 'bench_notes' as TemplateType,
    subject: 'A note from the bench — [Month]',
    greeting: 'A note from the bench.',
    body: "This month from the workshop, we've been busy unpacking some remarkable pieces from Melbourne.\n\nEach one has been cleaned, tested, and hand-numbered by our bench team — ready for a new home in North America.",
    ctaLabel: 'Browse the collection →',
    ctaUrl: 'https://acmevintagesupply.com/catalog',
  },
  {
    id: 'new-arrivals-spotlight',
    name: 'New Arrivals Spotlight',
    description: 'Showcase up to 3 fresh products just in.',
    template: 'new_arrivals' as TemplateType,
    subject: 'Fresh pieces just landed at the workshop',
    body: 'Fresh pieces just landed at the workshop — each one hand-selected and ready to ship.',
    ctaLabel: 'Shop all new arrivals →',
    ctaUrl: 'https://acmevintagesupply.com/catalog',
  },
  {
    id: 'seasonal-sale',
    name: 'Seasonal Sale',
    description: 'Announce a sale with a discount code and urgency.',
    template: 'seasonal_sale' as TemplateType,
    subject: 'Limited time — selected pieces at reduced prices',
    saleHeadline: 'Limited time — selected pieces at reduced prices.',
    body: "We're making room on the bench for new arrivals, and that means selected pieces are available at reduced prices for a limited time.\n\nUse the code below at checkout — no minimum order required.",
    discountCode: 'SALE20',
    ctaLabel: 'Shop the sale →',
    ctaUrl: 'https://acmevintagesupply.com/catalog',
  },
  {
    id: 'restock-alert',
    name: 'Restock Alert',
    description: 'Let subscribers know popular items are back.',
    template: 'bench_notes' as TemplateType,
    subject: 'Back on the bench — popular pieces restocked',
    greeting: 'Good news from the bench.',
    body: "A few of our most-requested pieces are back in stock after a long wait.\n\nThese items went quickly last time — if you've had your eye on something, now is the time.",
    ctaLabel: 'See what\'s back →',
    ctaUrl: 'https://acmevintagesupply.com/catalog',
  },
] as const
```

### "Use Template" Flow
1. Scott clicks "Use Template" on a card
2. All compose state fields are set from the preset (subject, body, greeting, saleHeadline, discountCode, ctaLabel, ctaUrl, template)
3. `setTab('campaigns')` — switches to Campaigns tab
4. `setComposing(true)` — opens compose panel automatically
5. Scott edits subject/copy/products as needed, then sends

### No Database Required
Templates are hardcoded constants. No Supabase table, no API route, no migration. Fast, no latency, no failure modes.

---

## Files Changed

| File | Change |
|---|---|
| `app/admin/marketing/page.tsx` | Add `previewOpen` + `previewDevice` state; add `PreviewModal` inline component; replace "Show preview" link with "Preview" button; add `PRESET_TEMPLATES` constant; add Templates tab + grid; add `handleUseTemplate()` function; add `BiLayout` to icon imports |

---

## Out of Scope
- Custom template creation / saving user-defined templates
- Template editing in the library
- Thumbnail screenshots via headless browser (uses live iframe rendering)
- Email client compatibility testing (Litmus-style)
