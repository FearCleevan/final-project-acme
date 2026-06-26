# Email Preview Modal + Template Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-screen email preview modal with desktop/mobile toggle, and a Template Library tab with 4 pre-built content cards that pre-fill the compose form.

**Architecture:** Both features are client-side only — no new API routes, no database changes. All changes are in `app/admin/marketing/page.tsx`. Task 1 extracts `buildPreviewHtml` into a pure function and replaces the inline iframe toggle with a `PreviewModal` component. Task 2 adds a `PRESET_TEMPLATES` constant and a Templates tab with thumbnail cards.

**Tech Stack:** Next.js 16, TypeScript, Tailwind v4, react-icons/bi

## Global Constraints

- Tailwind v4: use CSS variable syntax `text-(--admin-accent)`, `bg-(--admin-surface)`, etc. — NEVER `text-green-700` or hardcoded color classes.
- All new JSX follows existing admin UI patterns: `SectionCard`, `Badge`, `cn()` for conditional classes.
- `previewing` state (inline toggle) is REMOVED — replaced by `previewOpen` modal state.
- `buildEmailPreviewHtml` is a pure function (outside the component) so template thumbnail iframes can call it with preset data.
- Task 2 depends on Task 1 completing first (`previewOpen` state + `buildEmailPreviewHtml` must exist).
- No test runner — verify via `npx tsc --noEmit` and manual browser testing.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `app/admin/marketing/page.tsx` | Modify (Task 1) | Extract `buildEmailPreviewHtml` pure fn; add `previewOpen` state; remove `previewing`; add `PreviewModal` component; replace "Show preview" with "Preview" button |
| `app/admin/marketing/page.tsx` | Modify (Task 2) | Add `PresetTemplate` interface + `PRESET_TEMPLATES` constant; add `BiLayout` icon; update `Tab` type; add Templates tab + grid; add `handleUseTemplate()` |

---

## Task 1: Email Preview Modal

**Files:**
- Modify: `app/admin/marketing/page.tsx`

**Interfaces:**
- Produces:
  - `buildEmailPreviewHtml(params: PreviewParams): string` — pure function, exported from the module scope (above the component). Used by the compose preview and by Task 2's template thumbnails.
  - `previewOpen: boolean` state + `setPreviewOpen` — used by Task 2's `handleUseTemplate` to close any open preview on template load.

- [ ] **Step 1: Add `PreviewParams` type and extract `buildEmailPreviewHtml` as a pure function**

In `app/admin/marketing/page.tsx`, after the existing `fmtDate` helper (line ~47) and before `export default function MarketingPage()`, add:

```typescript
// ── Preview HTML (pure — used by compose preview and template thumbnails) ──────

interface PreviewParams {
  subject:          string
  body:             string
  ctaLabel:         string
  ctaUrl:           string
  template:         TemplateType
  greeting:         string
  saleHeadline:     string
  discountCode:     string
  saleEndDate:      string
  selectedProducts: NewsletterProduct[]
}

function buildEmailPreviewHtml(p: PreviewParams): string {
  const sub      = p.subject || '(No subject)'
  const bodyText = p.body.split('\n').filter(l => l.trim())
    .map(l => `<p style="font-size:15px;line-height:1.7;color:#6B6257;margin:0 0 16px;">${l}</p>`)
    .join('')
  const cta = p.ctaLabel && p.ctaUrl
    ? `<a href="${p.ctaUrl}" style="display:inline-block;background:#2C5F2E;color:#F5F1E6;text-decoration:none;padding:12px 28px;border-radius:3px;font-family:sans-serif;font-size:14px;font-weight:600;margin-bottom:32px;">${p.ctaLabel}</a>`
    : ''
  const footer = `<div style="border-top:1px solid #E8E0D4;padding-top:16px;margin-top:32px;"><p style="font-size:12px;color:#A89F94;line-height:1.6;margin:0;">Acme Vintage Supply · Dartmouth, Nova Scotia<br>You're receiving this because you subscribed at acmevintagesupply.com.<br><a href="#" style="color:#A89F94;">Unsubscribe</a></p></div>`
  const wrap = (inner: string) => `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#F5F1E6;padding:40px 16px;"><div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#FDFAF6;border:1px solid #E8E0D4;border-radius:8px;padding:40px 40px 32px;">${inner}</div></body></html>`

  if (p.template === 'new_arrivals') {
    const cards = p.selectedProducts.map(prod => `
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;border:1px solid #E8E0D4;border-radius:6px;">
        <tr>
          <td style="width:88px;padding:12px;vertical-align:top;">
            ${prod.imageUrl ? `<img src="${prod.imageUrl}" width="64" height="64" style="object-fit:cover;border-radius:4px;display:block;" alt="${prod.title}" />` : `<div style="width:64px;height:64px;background:#E8E0D4;border-radius:4px;"></div>`}
          </td>
          <td style="padding:12px;vertical-align:top;">
            <p style="font-size:14px;font-weight:600;color:#2C2C2A;margin:0 0 4px;">${prod.title}</p>
            <p style="font-size:13px;color:#6B6257;margin:0 0 10px;">${prod.price}</p>
            <span style="font-size:12px;color:#2C5F2E;font-family:sans-serif;font-weight:600;">View product →</span>
          </td>
        </tr>
      </table>`).join('')
    return wrap(`<h2 style="font-size:22px;font-weight:600;margin:0 0 20px;color:#2C2C2A;">${sub}</h2>${bodyText}${cards}${cta}${footer}`)
  }

  if (p.template === 'seasonal_sale') {
    const headline = p.saleHeadline ? `<h2 style="font-size:22px;font-weight:700;color:#2C2C2A;margin:0 0 20px;">${p.saleHeadline}</h2>` : ''
    const code = p.discountCode ? `<div style="background:#F5F1E6;border:2px dashed #B8964E;border-radius:6px;padding:16px;text-align:center;margin:20px 0;"><p style="font-size:11px;color:#A89F94;font-family:sans-serif;text-transform:uppercase;letter-spacing:2px;margin:0 0 6px;">Use code</p><p style="font-size:26px;font-weight:700;color:#B8964E;letter-spacing:4px;margin:0;">${p.discountCode}</p></div>` : ''
    const urgency = p.saleEndDate ? `<p style="font-size:13px;color:#B8964E;text-align:center;margin:0 0 20px;font-family:sans-serif;">Offer ends ${new Date(p.saleEndDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}</p>` : ''
    return wrap(`<h2 style="font-size:22px;font-weight:600;margin:0 0 20px;color:#2C2C2A;">${sub}</h2>${headline}${bodyText}${code}${urgency}${cta}${footer}`)
  }

  // bench_notes (default)
  const greetingLine = `<p style="font-size:13px;color:#A89F94;font-family:sans-serif;letter-spacing:1px;text-transform:uppercase;margin:0 0 20px;">${p.greeting}</p>`
  return wrap(`<h2 style="font-size:22px;font-weight:600;margin:0 0 20px;color:#2C2C2A;">${sub}</h2>${greetingLine}${bodyText}${cta}${footer}`)
}
```

- [ ] **Step 2: Add `PreviewModal` component (above `MarketingPage`)**

After `buildEmailPreviewHtml`, add the modal component:

```typescript
// ── Preview Modal ─────────────────────────────────────────────────────────────

function PreviewModal({
  html,
  onClose,
  onSendNow,
  saving,
}: {
  html:       string
  onClose:    () => void
  onSendNow:  () => void
  saving:     boolean
}) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="bg-(--admin-surface) rounded-xl w-full max-w-[720px] max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--admin-border) shrink-0">
          <div className="flex items-center gap-3">
            <p className="text-[14px] font-semibold text-(--admin-text)">Email Preview</p>
            <div className="flex rounded-md border border-(--admin-border) overflow-hidden">
              {(['desktop', 'mobile'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  className={cn(
                    'px-3 py-1 text-[12px] transition-colors',
                    device === d
                      ? 'bg-(--admin-accent) text-(--admin-accent-text)'
                      : 'text-(--admin-text-soft) hover:bg-(--admin-surface-2)'
                  )}
                >
                  {d === 'desktop' ? 'Desktop' : 'Mobile'}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-(--admin-surface-2) text-(--admin-text-muted) transition-colors"
          >
            <BiX size={16} />
          </button>
        </div>

        {/* Preview body */}
        <div className="flex-1 overflow-y-auto bg-(--admin-surface-2) p-6 flex justify-center">
          <iframe
            srcDoc={html}
            sandbox="allow-same-origin"
            className="bg-white rounded-lg shadow-lg"
            style={{
              width: device === 'desktop' ? '600px' : '375px',
              height: '600px',
              border: 'none',
              transition: 'width 0.2s ease',
            }}
            title="Email preview"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-(--admin-border) shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] text-(--admin-text-soft) hover:text-(--admin-text) transition-colors"
          >
            Keep editing
          </button>
          <button
            type="button"
            onClick={() => { onClose(); onSendNow() }}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-(--admin-accent) text-(--admin-accent-text) text-[13px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? <BiLoader size={14} className="animate-spin" /> : <BiSend size={14} />}
            Looks good — Send Now
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Replace `previewing` state with `previewOpen` in `MarketingPage`**

Inside `MarketingPage`, find:
```typescript
  const [previewing,   setPreviewing]   = useState(false)
```
Replace with:
```typescript
  const [previewOpen,  setPreviewOpen]  = useState(false)
```

- [ ] **Step 4: Update `resetCompose` to use `setPreviewOpen`**

Find in `resetCompose`:
```typescript
    setScheduleFor(''); setPreviewing(false); setComposing(false)
```
Replace with:
```typescript
    setScheduleFor(''); setPreviewOpen(false); setComposing(false)
```

- [ ] **Step 5: Replace the existing `buildPreviewHtml` method with a thin wrapper**

Find the existing `buildPreviewHtml()` function inside the component (around line 304) and replace the entire function body:

```typescript
  function buildPreviewHtml(): string {
    return buildEmailPreviewHtml({
      subject, body, ctaLabel, ctaUrl, template,
      greeting, saleHeadline, discountCode, saleEndDate, selectedProducts,
    })
  }
```

- [ ] **Step 6: Replace "Show preview" link with "Preview" button in the action bar**

Find the preview toggle block inside the compose panel:
```tsx
                {/* Preview toggle */}
                <div>
                  <button
                    onClick={() => setPreviewing(p => !p)}
                    className="text-[12px] text-(--admin-accent) hover:underline"
                  >
                    {previewing ? 'Hide preview' : 'Show preview'}
                  </button>
                </div>

                {previewing && (
                  <div className="rounded-lg border border-(--admin-border) overflow-hidden">
                    <p className="px-3 py-2 text-[11px] font-mono text-(--admin-text-muted) bg-(--admin-surface-2) border-b border-(--admin-border)">
                      Email preview
                    </p>
                    <iframe
                      srcDoc={buildPreviewHtml()}
                      sandbox="allow-same-origin"
                      className="w-full h-125 bg-white"
                      title="Email preview"
                    />
                  </div>
                )}
```

Replace the entire block with nothing — delete it entirely. The preview is now triggered from the action bar button below.

- [ ] **Step 7: Add "Preview" button to the action bar**

Find the actions div in the compose panel:
```tsx
                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSendNow}
```

Replace with:
```tsx
                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSendNow}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-(--admin-accent) text-(--admin-accent-text) text-[13px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {saving ? <BiLoader size={14} className="animate-spin" /> : <BiSend size={14} />}
                    Send Now
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-md border border-(--admin-border) text-[13px] text-(--admin-text-soft) hover:text-(--admin-text) hover:bg-(--admin-surface-2) disabled:opacity-50 transition-colors"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-md border border-(--admin-border) text-[13px] text-(--admin-text-soft) hover:text-(--admin-text) hover:bg-(--admin-surface-2) transition-colors"
                  >
                    Preview
                  </button>
                </div>
```

- [ ] **Step 8: Render `PreviewModal` at the bottom of the JSX return**

Find the closing area of the JSX return, just before `{toast && (` and add:

```tsx
      {previewOpen && (
        <PreviewModal
          html={buildPreviewHtml()}
          onClose={() => setPreviewOpen(false)}
          onSendNow={handleSendNow}
          saving={saving}
        />
      )}
```

- [ ] **Step 9: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors. Fix any before continuing.

- [ ] **Step 10: Manual test**

1. `npm run dev` → go to `http://localhost:3000/admin/marketing`
2. Campaigns tab → New Campaign
3. Fill in Subject + Body (any template)
4. Click **Preview** button — full-screen dark overlay appears
5. Email renders correctly inside the modal
6. Click **Desktop** / **Mobile** toggle — iframe width changes with smooth transition
7. Click **Keep editing** — modal closes, compose panel still has all fields filled
8. Press **ESC** — modal closes
9. Click outside the white panel — modal closes
10. Click **Looks good — Send Now** in the modal footer — modal closes and send flow starts

- [ ] **Step 11: Commit**

```bash
git add app/admin/marketing/page.tsx
git commit -m "feat: replace inline preview with full-screen email preview modal (desktop/mobile toggle)"
```

---

## Task 2: Template Library Tab

**Files:**
- Modify: `app/admin/marketing/page.tsx`

**Interfaces:**
- Consumes: `buildEmailPreviewHtml(params: PreviewParams)` from Task 1; `previewOpen`/`setPreviewOpen` from Task 1; all existing compose state setters.
- Produces: `handleUseTemplate(preset: PresetTemplate): void`

- [ ] **Step 1: Add `BiLayout` to icon imports**

Find the icon import line:
```typescript
import {
  BiGroup, BiEnvelopeOpen, BiDownload, BiPlus, BiSend,
  BiLoader, BiX, BiCalendar, BiImage, BiSearch,
} from 'react-icons/bi'
```

Replace with:
```typescript
import {
  BiGroup, BiEnvelopeOpen, BiDownload, BiPlus, BiSend,
  BiLoader, BiX, BiCalendar, BiImage, BiSearch, BiLayout,
} from 'react-icons/bi'
```

- [ ] **Step 2: Update `Tab` type**

Find:
```typescript
type Tab = 'subscribers' | 'campaigns'
```
Replace with:
```typescript
type Tab = 'subscribers' | 'campaigns' | 'templates'
```

- [ ] **Step 3: Add `PresetTemplate` interface and `PRESET_TEMPLATES` constant**

After the `buildEmailPreviewHtml` function (from Task 1) and before `PreviewModal`, add:

```typescript
// ── Template Presets ──────────────────────────────────────────────────────────

interface PresetTemplate {
  id:            string
  name:          string
  description:   string
  template:      TemplateType
  subject:       string
  body:          string
  ctaLabel?:     string
  ctaUrl?:       string
  greeting?:     string
  saleHeadline?: string
  discountCode?: string
}

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id:          'monthly-bench-notes',
    name:        'Monthly Bench Notes',
    description: 'Perfect for monthly updates from the workshop.',
    template:    'bench_notes',
    subject:     'A note from the bench — [Month]',
    greeting:    'A note from the bench.',
    body:        "This month from the workshop, we've been busy unpacking some remarkable pieces from Melbourne.\n\nEach one has been cleaned, tested, and hand-numbered by our bench team — ready for a new home in North America.",
    ctaLabel:    'Browse the collection →',
    ctaUrl:      'https://acmevintagesupply.com/catalog',
  },
  {
    id:          'new-arrivals-spotlight',
    name:        'New Arrivals Spotlight',
    description: 'Showcase up to 3 fresh products just in.',
    template:    'new_arrivals',
    subject:     'Fresh pieces just landed at the workshop',
    body:        'Fresh pieces just landed at the workshop — each one hand-selected and ready to ship.',
    ctaLabel:    'Shop all new arrivals →',
    ctaUrl:      'https://acmevintagesupply.com/catalog',
  },
  {
    id:          'seasonal-sale',
    name:        'Seasonal Sale',
    description: 'Announce a sale with a discount code and urgency.',
    template:    'seasonal_sale',
    subject:     'Limited time — selected pieces at reduced prices',
    saleHeadline:'Limited time — selected pieces at reduced prices.',
    body:        "We're making room on the bench for new arrivals, and that means selected pieces are available at reduced prices for a limited time.\n\nUse the code below at checkout — no minimum order required.",
    discountCode:'SALE20',
    ctaLabel:    'Shop the sale →',
    ctaUrl:      'https://acmevintagesupply.com/catalog',
  },
  {
    id:          'restock-alert',
    name:        'Restock Alert',
    description: 'Let subscribers know popular items are back.',
    template:    'bench_notes',
    subject:     'Back on the bench — popular pieces restocked',
    greeting:    'Good news from the bench.',
    body:        "A few of our most-requested pieces are back in stock after a long wait.\n\nThese items went quickly last time — if you've had your eye on something, now is the time.",
    ctaLabel:    "See what's back →",
    ctaUrl:      'https://acmevintagesupply.com/catalog',
  },
]
```

- [ ] **Step 4: Add `handleUseTemplate` inside `MarketingPage`**

After the `removeProduct` function, add:

```typescript
  function handleUseTemplate(preset: PresetTemplate) {
    setPreviewOpen(false)
    setSubject(preset.subject)
    setBody(preset.body)
    setCtaLabel(preset.ctaLabel ?? '')
    setCtaUrl(preset.ctaUrl ?? '')
    setScheduleFor('')
    setTemplate(preset.template)
    setGreeting(preset.greeting ?? 'A note from the bench.')
    setSaleHeadline(preset.saleHeadline ?? '')
    setDiscountCode(preset.discountCode ?? '')
    setSaleEndDate('')
    setSelectedProducts([])
    setProductSearch('')
    setProductResults([])
    setTab('campaigns')
    setComposing(true)
  }
```

- [ ] **Step 5: Add Templates to the tab bar**

Find the tabs array in the JSX:
```tsx
        {([
          { id: 'subscribers', label: 'Subscribers', icon: BiGroup },
          { id: 'campaigns',   label: 'Campaigns',   icon: BiEnvelopeOpen },
        ] as const).map(t => (
```

Replace with:
```tsx
        {([
          { id: 'subscribers', label: 'Subscribers', icon: BiGroup },
          { id: 'campaigns',   label: 'Campaigns',   icon: BiEnvelopeOpen },
          { id: 'templates',   label: 'Templates',   icon: BiLayout },
        ] as const).map(t => (
```

- [ ] **Step 6: Add Templates tab content**

After the closing `}` of the Campaigns tab block (`{tab === 'campaigns' && (...)}`) and before `{previewOpen && (`, add:

```tsx
      {/* ── Templates Tab ── */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <p className="text-[13px] text-(--admin-text-soft)">
            Pick a template to pre-fill the compose form. Edit the details, then send.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRESET_TEMPLATES.map(preset => (
              <div
                key={preset.id}
                className="rounded-xl border border-(--admin-border) bg-(--admin-surface) overflow-hidden flex flex-col"
              >
                {/* Thumbnail */}
                <div
                  className="relative bg-(--admin-surface-2) overflow-hidden shrink-0"
                  style={{ height: '180px' }}
                >
                  <div style={{ width: '560px', height: '514px', transform: 'scale(0.32)', transformOrigin: 'top left', pointerEvents: 'none' }}>
                    <iframe
                      srcDoc={buildEmailPreviewHtml({
                        subject:          preset.subject,
                        body:             preset.body,
                        ctaLabel:         preset.ctaLabel ?? '',
                        ctaUrl:           preset.ctaUrl ?? '',
                        template:         preset.template,
                        greeting:         preset.greeting ?? 'A note from the bench.',
                        saleHeadline:     preset.saleHeadline ?? '',
                        discountCode:     preset.discountCode ?? '',
                        saleEndDate:      '',
                        selectedProducts: [],
                      })}
                      sandbox="allow-same-origin"
                      style={{ width: '560px', height: '514px', border: 'none', display: 'block' }}
                      title={preset.name}
                    />
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 flex flex-col flex-1 gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-(--admin-text)">{preset.name}</p>
                    <p className="text-[12px] text-(--admin-text-soft) mt-0.5">{preset.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUseTemplate(preset)}
                    className="w-full px-3 py-2 rounded-md bg-(--admin-accent) text-(--admin-accent-text) text-[12px] font-medium hover:opacity-90 transition-opacity mt-auto"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
```

- [ ] **Step 7: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 8: Manual test — Templates tab**

1. Go to `/admin/marketing`
2. Click the **Templates** tab — 4 cards appear in a grid
3. Each card shows a miniature email thumbnail, the template name, description, and "Use Template" button
4. Verify thumbnails render the correct layout for each template type:
   - Monthly Bench Notes: greeting line + body paragraphs + green CTA
   - New Arrivals Spotlight: intro + no product cards (empty — as expected)
   - Seasonal Sale: `SALE20` gold dashed badge visible
   - Restock Alert: "Good news from the bench." greeting

5. Click "Use Template" on **Monthly Bench Notes**:
   - Switches to Campaigns tab
   - Compose panel opens with all fields pre-filled
   - Subject: "A note from the bench — [Month]"
   - Bench Notes template selected
   - Body has the pre-written workshop copy
   - CTA pre-filled

6. Click "Use Template" on **Seasonal Sale**:
   - Switches to Campaigns tab → compose open
   - Seasonal Sale template selected
   - Headline: "Limited time — selected pieces at reduced prices."
   - Discount code: "SALE20"
   - CTA pre-filled

7. Open Preview from a pre-filled template — modal shows the correct rendered email.

- [ ] **Step 9: Commit**

```bash
git add app/admin/marketing/page.tsx
git commit -m "feat: template library tab with 4 pre-built email templates and thumbnail previews"
```

---

## Self-Review

**Spec coverage:**
- Preview modal with full-screen dark overlay → Task 1 Steps 2, 8 ✅
- Desktop/Mobile toggle → Task 1 Step 2 (`PreviewModal` internal `device` state) ✅
- ESC key closes modal → Task 1 Step 2 (`useEffect` keydown) ✅
- Click overlay closes → Task 1 Step 2 (`onClick={onClose}` on overlay div) ✅
- "Keep editing" + "Looks good — Send Now" footer → Task 1 Step 2 ✅
- "Show preview" inline toggle removed → Task 1 Steps 6, 3, 4 ✅
- "Preview" button in action bar → Task 1 Step 7 ✅
- Templates tab (3rd tab) → Task 2 Steps 1, 5 ✅
- 4 pre-built templates → Task 2 Step 3 ✅
- Thumbnail iframe rendering → Task 2 Step 6 ✅
- "Use Template" pre-fills compose form → Task 2 Steps 4, 6 ✅
- handleUseTemplate resets all state before setting preset → Task 2 Step 4 ✅
- No new API routes or DB tables → confirmed, no new files ✅

**Type consistency:**
- `PreviewParams` defined Task 1 Step 1, consumed in Task 1 Step 5 and Task 2 Step 6 ✅
- `PresetTemplate` defined Task 2 Step 3, consumed in Task 2 Steps 4, 6 ✅
- `Tab` union extended to include `'templates'` before it's used in tab bar → Task 2 Steps 2, 5 ✅
- `buildEmailPreviewHtml` defined Task 1 Step 1 before `PreviewModal` uses it, and before Task 2 thumbnails use it ✅
