# Email Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 pre-built branded email template layouts (Bench Notes, New Arrivals, Seasonal Sale) to the admin Marketing page campaign composer.

**Architecture:** A template selector replaces the top of the compose panel; fields below adapt per template. Three HTML builder functions are added to `lib/email.ts`; `sendNewsletter()` gains `template` + `templateData` params and routes to the correct builder. The Supabase `email_campaigns` table gains two columns. The marketing page UI gains a product picker backed by the existing `/api/search` endpoint.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, Supabase, Resend, react-icons/bi

## Global Constraints

- Tailwind v4: use `className="text-(--admin-accent)"` CSS variable syntax, NOT `text-green-700`. No `tailwind.config.ts`.
- All new fields backward-compatible: existing `bench_notes` campaigns with `template_data: null` must render without errors.
- Design tokens: background `#FDFAF6`, text `#2C2C2A`, soft text `#6B6257`, muted `#A89F94`, CTA green `#2C5F2E`, accent gold `#B8964E`, border `#E8E0D4`. Font: Georgia, serif. Max email width: 560px.
- `sendNewsletter()` signature change must be backward-compatible — `template` and `templateData` are optional, default to `bench_notes`.
- Never use module-level `createClient()` in API routes — always use `getSupabase()` function pattern (already in place).

---

## File Map

| File | Action | What changes |
|---|---|---|
| Supabase Dashboard SQL Editor | Run migration | Add `template` + `template_data` columns to `email_campaigns` |
| `lib/email.ts` | Modify | Add `TemplateType`, `NewsletterProduct`, `TemplateData`, `NewsletterCampaign` types; add `buildBenchNotesHtml()`, `buildNewArrivalsHtml()`, `buildSeasonalSaleHtml()`, `buildEmailHtml()` functions; update `sendNewsletter()` |
| `app/api/admin/marketing/campaigns/route.ts` | Modify | POST accepts `template` + `template_data`; GET SELECT includes them |
| `app/api/admin/marketing/campaigns/[id]/send/route.ts` | Modify | Pass `template` + `template_data` to `sendNewsletter()` |
| `app/admin/marketing/page.tsx` | Modify | Template selector UI, per-template field sets, product picker, template-aware preview, updated save/send handlers |

---

## Task 1: Supabase Migration

**Files:**
- Run SQL in: Supabase Dashboard → SQL Editor

**Interfaces:**
- Produces: `email_campaigns.template` (text, default `'bench_notes'`) and `email_campaigns.template_data` (jsonb, nullable) — used by Tasks 3, 4, 5.

- [ ] **Step 1: Run the migration**

Go to Supabase Dashboard → project → SQL Editor → New query. Paste and run:

```sql
ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS template      text NOT NULL DEFAULT 'bench_notes',
  ADD COLUMN IF NOT EXISTS template_data jsonb;
```

- [ ] **Step 2: Verify columns exist**

Run this in the same SQL Editor:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'email_campaigns'
  AND column_name IN ('template', 'template_data');
```

Expected output: 2 rows — `template` (text, default `'bench_notes'`), `template_data` (jsonb, no default).

- [ ] **Step 3: Verify existing campaigns unaffected**

```sql
SELECT id, subject, template, template_data FROM email_campaigns LIMIT 5;
```

Expected: all existing rows show `template = 'bench_notes'` and `template_data = null`.

---

## Task 2: Email HTML Builders

**Files:**
- Modify: `lib/email.ts`

**Interfaces:**
- Consumes: nothing new from prior tasks
- Produces:
  - `type TemplateType = 'bench_notes' | 'new_arrivals' | 'seasonal_sale'`
  - `interface NewsletterProduct { title: string; price: string; imageUrl: string; handle: string }`
  - `interface TemplateData { greeting?: string; products?: NewsletterProduct[]; headline?: string; discountCode?: string; saleEndDate?: string }`
  - `interface NewsletterCampaign { subject: string; body: string; ctaLabel?: string; ctaUrl?: string; template?: TemplateType; templateData?: TemplateData }`
  - `sendNewsletter(subscribers, campaign: NewsletterCampaign): Promise<number>` — same name, extended signature

- [ ] **Step 1: Add types at the top of lib/email.ts (after the imports)**

Open `lib/email.ts`. After the `const SITE = ...` line, add:

```typescript
export type TemplateType = 'bench_notes' | 'new_arrivals' | 'seasonal_sale'

export interface NewsletterProduct {
  title:    string
  price:    string
  imageUrl: string
  handle:   string
}

export interface TemplateData {
  greeting?:     string
  products?:     NewsletterProduct[]
  headline?:     string
  discountCode?: string
  saleEndDate?:  string
}

interface NewsletterCampaign {
  subject:       string
  body:          string
  ctaLabel?:     string
  ctaUrl?:       string
  template?:     TemplateType
  templateData?: TemplateData
}
```

- [ ] **Step 2: Add shared footer helper**

Add this function before `sendNewsletter`:

```typescript
function emailFooter(unsubscribeUrl: string): string {
  return `
  <div style="border-top:1px solid #E8E0D4;padding-top:16px;margin-top:32px;">
    <p style="font-size:12px;color:#A89F94;line-height:1.6;margin:0;">
      Acme Vintage Supply · Dartmouth, Nova Scotia<br>
      You're receiving this because you subscribed at acmevintagesupply.com.<br>
      <a href="${unsubscribeUrl}" style="color:#A89F94;">Unsubscribe</a>
    </p>
  </div>`
}

function emailWrapper(content: string): string {
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#FDFAF6;border:1px solid #E8E0D4;border-radius:8px;padding:40px 40px 32px;">${content}</div>`
}

function bodyParagraphs(text: string): string {
  return text.split('\n').filter(l => l.trim())
    .map(l => `<p style="font-size:15px;line-height:1.7;color:#6B6257;margin:0 0 16px;">${l}</p>`)
    .join('')
}

function ctaButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#2C5F2E;color:#F5F1E6;text-decoration:none;padding:12px 28px;border-radius:3px;font-family:sans-serif;font-size:14px;font-weight:600;margin-bottom:32px;">${label}</a>`
}
```

- [ ] **Step 3: Add buildBenchNotesHtml**

```typescript
function buildBenchNotesHtml(c: NewsletterCampaign, unsubscribeUrl: string): string {
  const greeting = c.templateData?.greeting ?? 'A note from the bench.'
  const cta = c.ctaLabel && c.ctaUrl ? ctaButton(c.ctaLabel, c.ctaUrl) : ''
  return emailWrapper(`
    <p style="font-size:13px;color:#A89F94;font-family:sans-serif;letter-spacing:1px;text-transform:uppercase;margin:0 0 20px;">${greeting}</p>
    ${bodyParagraphs(c.body)}
    ${cta}
    ${emailFooter(unsubscribeUrl)}
  `)
}
```

- [ ] **Step 4: Add buildNewArrivalsHtml**

```typescript
function buildNewArrivalsHtml(c: NewsletterCampaign, unsubscribeUrl: string): string {
  const products = c.templateData?.products ?? []
  const productCards = products.map(p => `
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;border:1px solid #E8E0D4;border-radius:6px;">
      <tr>
        <td style="width:88px;padding:12px;vertical-align:top;">
          ${p.imageUrl
            ? `<img src="${p.imageUrl}" width="64" height="64" style="object-fit:cover;border-radius:4px;display:block;" alt="${p.title}" />`
            : `<div style="width:64px;height:64px;background:#E8E0D4;border-radius:4px;"></div>`
          }
        </td>
        <td style="padding:12px;vertical-align:top;">
          <p style="font-size:14px;font-weight:600;color:#2C2C2A;margin:0 0 4px;">${p.title}</p>
          <p style="font-size:13px;color:#6B6257;margin:0 0 10px;">${p.price}</p>
          <a href="${SITE}/catalog/${p.handle}" style="font-size:12px;color:#2C5F2E;text-decoration:none;font-family:sans-serif;font-weight:600;">View product →</a>
        </td>
      </tr>
    </table>
  `).join('')
  const cta = c.ctaLabel && c.ctaUrl ? ctaButton(c.ctaLabel, c.ctaUrl) : ''
  return emailWrapper(`
    ${bodyParagraphs(c.body)}
    ${productCards}
    ${cta}
    ${emailFooter(unsubscribeUrl)}
  `)
}
```

- [ ] **Step 5: Add buildSeasonalSaleHtml**

```typescript
function buildSeasonalSaleHtml(c: NewsletterCampaign, unsubscribeUrl: string): string {
  const { headline = '', discountCode = '', saleEndDate } = c.templateData ?? {}
  const codeBlock = discountCode ? `
    <div style="background:#F5F1E6;border:2px dashed #B8964E;border-radius:6px;padding:16px;text-align:center;margin:20px 0;">
      <p style="font-size:11px;color:#A89F94;font-family:sans-serif;text-transform:uppercase;letter-spacing:2px;margin:0 0 6px;">Use code</p>
      <p style="font-size:26px;font-weight:700;color:#B8964E;letter-spacing:4px;margin:0;">${discountCode}</p>
    </div>` : ''
  const urgency = saleEndDate
    ? `<p style="font-size:13px;color:#B8964E;text-align:center;margin:0 0 20px;font-family:sans-serif;">Offer ends ${new Date(saleEndDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}</p>`
    : ''
  const cta = c.ctaLabel && c.ctaUrl ? ctaButton(c.ctaLabel, c.ctaUrl) : ''
  return emailWrapper(`
    ${headline ? `<h2 style="font-size:22px;font-weight:700;color:#2C2C2A;margin:0 0 20px;">${headline}</h2>` : ''}
    ${bodyParagraphs(c.body)}
    ${codeBlock}
    ${urgency}
    ${cta}
    ${emailFooter(unsubscribeUrl)}
  `)
}
```

- [ ] **Step 6: Add buildEmailHtml dispatcher**

```typescript
function buildEmailHtml(c: NewsletterCampaign, unsubscribeUrl: string): string {
  switch (c.template ?? 'bench_notes') {
    case 'new_arrivals':  return buildNewArrivalsHtml(c, unsubscribeUrl)
    case 'seasonal_sale': return buildSeasonalSaleHtml(c, unsubscribeUrl)
    default:              return buildBenchNotesHtml(c, unsubscribeUrl)
  }
}
```

- [ ] **Step 7: Update sendNewsletter signature and HTML call**

Replace the existing `sendNewsletter` function signature and the `html:` line inside the `.map()`. Find the current signature:

```typescript
export async function sendNewsletter(
  subscribers: { email: string }[],
  campaign: {
    subject:   string
    body:      string
    ctaLabel?: string
    ctaUrl?:   string
  }
): Promise<number> {
```

Replace with:

```typescript
export async function sendNewsletter(
  subscribers: { email: string }[],
  campaign: NewsletterCampaign
): Promise<number> {
```

Then find the `html:` line inside the `.map()`:

```typescript
        html: `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2C2C2A;">
  <h2 style="font-size:22px;font-weight:600;margin-bottom:20px;">${campaign.subject}</h2>
  ${bodyHtml}
  ${ctaHtml}
  <div style="border-top:1px solid #E8E0D4;padding-top:16px;margin-top:32px;">
    <p style="font-size:12px;color:#A89F94;line-height:1.6;margin:0;">
      Acme Vintage Supply · Dartmouth, Nova Scotia<br>
      You're receiving this because you subscribed at acmevintagesupply.com.<br>
      <a href="${SITE}/api/newsletter/unsubscribe?email=${token}"
         style="color:#A89F94;">Unsubscribe</a>
    </p>
  </div>
</div>`,
```

Replace with:

```typescript
        html: buildEmailHtml(campaign, `${SITE}/api/newsletter/unsubscribe?email=${token}`),
```

Also remove the now-unused `bodyHtml` and `ctaHtml` variables that were above the `.map()` call (the two `const bodyHtml = ...` and `const ctaHtml = ...` lines). The builders handle that internally now.

- [ ] **Step 8: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `lib/email.ts`.

- [ ] **Step 9: Commit**

```bash
git add lib/email.ts
git commit -m "feat: add branded email template HTML builders (bench notes, new arrivals, seasonal sale)"
```

---

## Task 3: Campaigns API — Accept and Return Template Fields

**Files:**
- Modify: `app/api/admin/marketing/campaigns/route.ts`

**Interfaces:**
- Consumes: `template` + `template_data` columns from Task 1
- Produces:
  - POST body now accepts: `{ subject, body, cta_label, cta_url, scheduled_for, template?, template_data? }`
  - GET response now includes `template` and `template_data` on each campaign object

- [ ] **Step 1: Update GET to return template fields**

In `route.ts`, find the GET handler's `.select(...)` call:

```typescript
.select('id, subject, status, scheduled_for, sent_at, recipient_count, created_at')
```

Replace with:

```typescript
.select('id, subject, status, scheduled_for, sent_at, recipient_count, created_at, template, template_data')
```

- [ ] **Step 2: Update POST to accept and store template fields**

Find the destructuring line in POST:

```typescript
const { subject, body, cta_label, cta_url, scheduled_for } = await req.json()
```

Replace with:

```typescript
const { subject, body, cta_label, cta_url, scheduled_for, template, template_data } = await req.json()
```

Find the `.insert({...})` block and add the two new fields:

```typescript
const { data, error } = await getSupabase()
  .from('email_campaigns')
  .insert({
    subject:       subject.trim(),
    body:          body.trim(),
    cta_label:     cta_label?.trim()  || null,
    cta_url:       cta_url?.trim()    || null,
    scheduled_for: scheduled_for      || null,
    template:      template           || 'bench_notes',
    template_data: template_data      || null,
    status:        'draft',
  })
  .select('id, subject, status, created_at, template, template_data')
  .single()
```

- [ ] **Step 3: Verify via browser**

Start dev server (`npm run dev`). Go to `/admin/marketing` → Campaigns tab → New Campaign. Open DevTools Network tab. Save a draft. Check the POST request body includes `template` and `template_data`. Check the GET `/api/admin/marketing/campaigns` response includes those fields on each item.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/marketing/campaigns/route.ts
git commit -m "feat: campaigns API accepts and returns template + template_data fields"
```

---

## Task 4: Send Route — Pass Template Fields to sendNewsletter

**Files:**
- Modify: `app/api/admin/marketing/campaigns/[id]/send/route.ts`

**Interfaces:**
- Consumes: `campaign.template` + `campaign.template_data` from Supabase (Task 1), `sendNewsletter(NewsletterCampaign)` from Task 2
- Produces: no interface change — still returns `{ ok: true, sent: number }`

- [ ] **Step 1: Update the sendNewsletter call**

Find the current call in the POST handler:

```typescript
  const sent = await sendNewsletter(subscribers, {
    subject:  campaign.subject,
    body:     campaign.body,
    ctaLabel: campaign.cta_label  ?? undefined,
    ctaUrl:   campaign.cta_url    ?? undefined,
  })
```

Replace with:

```typescript
  const sent = await sendNewsletter(subscribers, {
    subject:      campaign.subject,
    body:         campaign.body,
    ctaLabel:     campaign.cta_label    ?? undefined,
    ctaUrl:       campaign.cta_url      ?? undefined,
    template:     campaign.template     ?? 'bench_notes',
    templateData: campaign.template_data ?? undefined,
  })
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/api/admin/marketing/campaigns/[id]/send/route.ts"
git commit -m "feat: send route passes template fields to sendNewsletter"
```

---

## Task 5: Marketing Page UI — Template Selector, Field Sets, Product Picker, Preview

**Files:**
- Modify: `app/admin/marketing/page.tsx`

**Interfaces:**
- Consumes: `TemplateType`, `NewsletterProduct`, `TemplateData` from `@/lib/email` (Task 2); `/api/search` endpoint (existing); campaigns API now returns `template` + `template_data` (Task 3)
- Produces: fully working compose panel with 3 templates, product picker, and template-aware preview

- [ ] **Step 1: Update imports**

At the top of `app/admin/marketing/page.tsx`, add the import for the new types after the existing imports:

```typescript
import type { TemplateType, NewsletterProduct } from '@/lib/email'
```

Also add `BiImage` and `BiSearch` to the react-icons import line:

```typescript
import {
  BiGroup, BiEnvelopeOpen, BiDownload, BiPlus, BiSend,
  BiLoader, BiX, BiCalendar, BiImage, BiSearch,
} from 'react-icons/bi'
```

- [ ] **Step 2: Add SearchProduct type and update Campaign type**

After the existing `Campaign` interface, add:

```typescript
interface SearchProduct {
  id:     string
  slug:   string
  name:   string
  price:  string
  images: string[]
}
```

Update the `Campaign` interface to include template fields:

```typescript
interface Campaign {
  id:               string
  subject:          string
  status:           'draft' | 'sent'
  scheduled_for:    string | null
  sent_at:          string | null
  recipient_count:  number | null
  created_at:       string
  template:         TemplateType
  template_data:    Record<string, unknown> | null
}
```

- [ ] **Step 3: Add template-specific state variables**

Inside `MarketingPage()`, after the existing `const [sending, ...]` state, add:

```typescript
  // Template state
  const [template,          setTemplate]          = useState<TemplateType>('bench_notes')
  const [greeting,          setGreeting]          = useState('A note from the bench.')
  const [saleHeadline,      setSaleHeadline]      = useState('')
  const [discountCode,      setDiscountCode]      = useState('')
  const [saleEndDate,       setSaleEndDate]       = useState('')
  const [selectedProducts,  setSelectedProducts]  = useState<NewsletterProduct[]>([])
  const [productSearch,     setProductSearch]     = useState('')
  const [productResults,    setProductResults]    = useState<SearchProduct[]>([])
  const [searchLoading,     setSearchLoading]     = useState(false)
  const [allProducts,       setAllProducts]       = useState<SearchProduct[]>([])
```

- [ ] **Step 4: Add product search effect**

After the existing `useEffect` hooks, add:

```typescript
  // Fetch all products once when New Arrivals template is first used
  useEffect(() => {
    if (template !== 'new_arrivals' || allProducts.length > 0) return
    fetch('/api/search')
      .then(r => r.ok ? r.json() : [])
      .then(setAllProducts)
      .catch(() => {})
  }, [template, allProducts.length])

  // Filter products client-side on search input
  useEffect(() => {
    if (!productSearch.trim() || selectedProducts.length >= 3) {
      setProductResults([])
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    const timer = setTimeout(() => {
      const q = productSearch.toLowerCase()
      const selectedHandles = new Set(selectedProducts.map(p => p.handle))
      setProductResults(
        allProducts
          .filter(p => p.name.toLowerCase().includes(q) && !selectedHandles.has(p.slug))
          .slice(0, 5)
      )
      setSearchLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch, selectedProducts, allProducts])
```

- [ ] **Step 5: Update resetCompose**

Replace the existing `resetCompose` function:

```typescript
  function resetCompose() {
    setSubject(''); setBody(''); setCtaLabel(''); setCtaUrl('')
    setScheduleFor(''); setPreviewing(false); setComposing(false)
    setTemplate('bench_notes'); setGreeting('A note from the bench.')
    setSaleHeadline(''); setDiscountCode(''); setSaleEndDate('')
    setSelectedProducts([]); setProductSearch(''); setProductResults([])
  }
```

- [ ] **Step 6: Add helper functions**

Add these three helpers after `resetCompose`:

```typescript
  function handleTemplateChange(t: TemplateType) {
    setTemplate(t)
    setGreeting('A note from the bench.')
    setSaleHeadline(''); setDiscountCode(''); setSaleEndDate('')
    setSelectedProducts([]); setProductSearch(''); setProductResults([])
    setBody('')
  }

  function getBodyForTemplate(): string {
    // New Arrivals uses body field as intro line; others use body as letter/sale body
    return body
  }

  function buildTemplateData(): Record<string, unknown> | null {
    if (template === 'bench_notes') return { greeting }
    if (template === 'new_arrivals') return {
      products: selectedProducts.map(p => ({
        title: p.title, price: p.price, imageUrl: p.imageUrl, handle: p.handle,
      }))
    }
    if (template === 'seasonal_sale') return {
      headline:     saleHeadline     || undefined,
      discountCode: discountCode     || undefined,
      saleEndDate:  saleEndDate      || undefined,
    }
    return null
  }

  function addProduct(p: SearchProduct) {
    if (selectedProducts.length >= 3) return
    setSelectedProducts(prev => [...prev, {
      title:    p.name,
      price:    p.price,
      imageUrl: p.images[0] ?? '',
      handle:   p.slug,
    }])
    setProductSearch('')
    setProductResults([])
  }

  function removeProduct(handle: string) {
    setSelectedProducts(prev => prev.filter(p => p.handle !== handle))
  }
```

- [ ] **Step 7: Update buildPreviewHtml**

Replace the existing `buildPreviewHtml` function:

```typescript
  function buildPreviewHtml(): string {
    const sub = subject || '(No subject)'
    const bodyText = body.split('\n').filter(l => l.trim())
      .map(l => `<p style="font-size:15px;line-height:1.7;color:#6B6257;margin:0 0 16px;">${l}</p>`)
      .join('')
    const cta = ctaLabel && ctaUrl
      ? `<a href="${ctaUrl}" style="display:inline-block;background:#2C5F2E;color:#F5F1E6;text-decoration:none;padding:12px 28px;border-radius:3px;font-family:sans-serif;font-size:14px;font-weight:600;margin-bottom:32px;">${ctaLabel}</a>`
      : ''
    const footer = `<div style="border-top:1px solid #E8E0D4;padding-top:16px;margin-top:32px;"><p style="font-size:12px;color:#A89F94;line-height:1.6;margin:0;">Acme Vintage Supply · Dartmouth, Nova Scotia<br>You're receiving this because you subscribed at acmevintagesupply.com.<br><a href="#" style="color:#A89F94;">Unsubscribe</a></p></div>`
    const wrap = (inner: string) => `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#F5F1E6;padding:40px 16px;"><div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#FDFAF6;border:1px solid #E8E0D4;border-radius:8px;padding:40px 40px 32px;">${inner}</div></body></html>`

    if (template === 'new_arrivals') {
      const intro = bodyText
      const cards = selectedProducts.map(p => `
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;border:1px solid #E8E0D4;border-radius:6px;">
          <tr>
            <td style="width:88px;padding:12px;vertical-align:top;">
              ${p.imageUrl ? `<img src="${p.imageUrl}" width="64" height="64" style="object-fit:cover;border-radius:4px;display:block;" alt="${p.title}" />` : `<div style="width:64px;height:64px;background:#E8E0D4;border-radius:4px;"></div>`}
            </td>
            <td style="padding:12px;vertical-align:top;">
              <p style="font-size:14px;font-weight:600;color:#2C2C2A;margin:0 0 4px;">${p.title}</p>
              <p style="font-size:13px;color:#6B6257;margin:0 0 10px;">${p.price}</p>
              <span style="font-size:12px;color:#2C5F2E;font-family:sans-serif;font-weight:600;">View product →</span>
            </td>
          </tr>
        </table>`).join('')
      return wrap(`${intro}${cards}${cta}${footer}`)
    }

    if (template === 'seasonal_sale') {
      const headline = saleHeadline ? `<h2 style="font-size:22px;font-weight:700;color:#2C2C2A;margin:0 0 20px;">${saleHeadline}</h2>` : ''
      const code = discountCode ? `<div style="background:#F5F1E6;border:2px dashed #B8964E;border-radius:6px;padding:16px;text-align:center;margin:20px 0;"><p style="font-size:11px;color:#A89F94;font-family:sans-serif;text-transform:uppercase;letter-spacing:2px;margin:0 0 6px;">Use code</p><p style="font-size:26px;font-weight:700;color:#B8964E;letter-spacing:4px;margin:0;">${discountCode}</p></div>` : ''
      const urgency = saleEndDate ? `<p style="font-size:13px;color:#B8964E;text-align:center;margin:0 0 20px;font-family:sans-serif;">Offer ends ${new Date(saleEndDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}</p>` : ''
      return wrap(`${headline}${bodyText}${code}${urgency}${cta}${footer}`)
    }

    // bench_notes (default)
    const greetingLine = `<p style="font-size:13px;color:#A89F94;font-family:sans-serif;letter-spacing:1px;text-transform:uppercase;margin:0 0 20px;">${greeting}</p>`
    return wrap(`${greetingLine}${bodyText}${cta}${footer}`)
  }
```

- [ ] **Step 8: Update handleSaveDraft and handleSendNow**

In `handleSaveDraft`, replace the `body: JSON.stringify({...})` call:

```typescript
      body: JSON.stringify({
        subject, body: getBodyForTemplate(),
        cta_label:     ctaLabel || null,
        cta_url:       ctaUrl   || null,
        scheduled_for: scheduleFor || null,
        template,
        template_data: buildTemplateData(),
      }),
```

In `handleSendNow`, replace the first `body: JSON.stringify({...})` (the save-draft step):

```typescript
        body: JSON.stringify({
          subject, body: getBodyForTemplate(),
          cta_label: ctaLabel || null,
          cta_url:   ctaUrl   || null,
          template,
          template_data: buildTemplateData(),
        }),
```

- [ ] **Step 9: Update validation in handleSaveDraft and handleSendNow**

Find both `if (!subject.trim() || !body.trim())` guards. For New Arrivals the body is the intro line; for Seasonal Sale the body is the sale description. The existing validation against `body.trim()` works for all templates since we always write to `body`. No change needed — but add product count validation for New Arrivals:

In `handleSaveDraft`, after the existing subject/body check, add:

```typescript
    if (template === 'new_arrivals' && selectedProducts.length === 0) {
      showToast('Add at least one product for New Arrivals.', 'error'); return
    }
    if (template === 'seasonal_sale' && (!ctaLabel.trim() || !ctaUrl.trim())) {
      showToast('Seasonal Sale requires a CTA button label and URL.', 'error'); return
    }
```

Do the same in `handleSendNow` after its existing check.

- [ ] **Step 10: Add template selector cards to compose panel JSX**

In the compose panel JSX (inside `{composing && (` block), after the header row (`<div className="flex items-center justify-between mb-5">`) and before the `<div className="space-y-4">`, add the template selector:

```tsx
              {/* Template selector */}
              <div className="mb-5">
                <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-2">Template</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'bench_notes',   label: 'Bench Notes',   desc: 'Personal letter' },
                    { id: 'new_arrivals',  label: 'New Arrivals',  desc: 'Product showcase' },
                    { id: 'seasonal_sale', label: 'Seasonal Sale', desc: 'Promo + code' },
                  ] as { id: TemplateType; label: string; desc: string }[]).map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTemplateChange(t.id)}
                      className={cn(
                        'text-left px-3 py-2.5 rounded-md border text-[12px] transition-colors',
                        template === t.id
                          ? 'border-(--admin-accent) bg-(--admin-accent)/10 text-(--admin-accent)'
                          : 'border-(--admin-border) text-(--admin-text-soft) hover:text-(--admin-text) hover:bg-(--admin-surface-2)'
                      )}
                    >
                      <p className="font-semibold">{t.label}</p>
                      <p className="text-[11px] opacity-70 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
```

- [ ] **Step 11: Add template-specific field sets to compose panel JSX**

Inside the `<div className="space-y-4">` (compose fields area), add the template-specific fields BETWEEN the Subject input and the existing Body textarea. Find this block:

```tsx
                <div>
                  <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">Subject *</label>
                  <input ... />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">Body * <span ...>
```

Insert between them:

```tsx
                {/* Bench Notes: greeting line */}
                {template === 'bench_notes' && (
                  <div>
                    <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">Greeting line</label>
                    <input
                      type="text"
                      value={greeting}
                      onChange={e => setGreeting(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                    />
                  </div>
                )}

                {/* Seasonal Sale: headline */}
                {template === 'seasonal_sale' && (
                  <div>
                    <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">Headline *</label>
                    <input
                      type="text"
                      value={saleHeadline}
                      onChange={e => setSaleHeadline(e.target.value)}
                      placeholder="Summer clearance — 20% off selected lamps"
                      className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                    />
                  </div>
                )}
```

Also update the Body label to be context-aware. Replace the static label:

```tsx
                  <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">Body * <span className="font-normal">(each line becomes a paragraph)</span></label>
```

With:

```tsx
                  <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">
                    {template === 'new_arrivals' ? 'Intro line *' : 'Body *'}
                    {template !== 'new_arrivals' && <span className="font-normal"> (each line becomes a paragraph)</span>}
                  </label>
```

And update the body textarea placeholder to be context-aware:

```tsx
                    placeholder={template === 'new_arrivals'
                      ? 'Fresh pieces just landed at the workshop.'
                      : template === 'seasonal_sale'
                        ? 'Describe the sale items and why they\'re worth grabbing...'
                        : 'This month from the workshop...\n\nWe\'ve had some interesting pieces come through the bench.'}
```

- [ ] **Step 12: Add product picker (New Arrivals) after the Body textarea**

After the closing `</div>` of the Body field, add:

```tsx
                {/* New Arrivals: product picker */}
                {template === 'new_arrivals' && (
                  <div>
                    <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">
                      Products <span className="font-normal">({selectedProducts.length}/3 selected)</span>
                    </label>

                    {/* Selected products */}
                    {selectedProducts.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {selectedProducts.map(p => (
                          <div key={p.handle} className="flex items-center gap-3 px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface-2)">
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt={p.title} className="w-8 h-8 rounded object-cover shrink-0" />
                              : <div className="w-8 h-8 rounded bg-(--admin-border) shrink-0 flex items-center justify-center"><BiImage size={14} className="text-(--admin-text-muted)" /></div>
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-(--admin-text) truncate">{p.title}</p>
                              <p className="text-[11px] text-(--admin-text-muted)">{p.price}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeProduct(p.handle)}
                              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-(--admin-border) text-(--admin-text-muted) transition-colors shrink-0"
                            >
                              <BiX size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Search input — hide when 3 selected */}
                    {selectedProducts.length < 3 && (
                      <div className="relative">
                        <div className="relative">
                          <BiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted)" />
                          <input
                            type="text"
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                            placeholder="Search products…"
                            className="w-full pl-8 pr-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                          />
                          {searchLoading && <BiLoader size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted) animate-spin" />}
                        </div>

                        {/* Dropdown results */}
                        {productResults.length > 0 && (
                          <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-md border border-(--admin-border) bg-(--admin-surface) shadow-lg divide-y divide-(--admin-border)">
                            {productResults.map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => addProduct(p)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-(--admin-surface-2) transition-colors"
                              >
                                {p.images[0]
                                  ? <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded object-cover shrink-0" />
                                  : <div className="w-8 h-8 rounded bg-(--admin-border) shrink-0" />
                                }
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-medium text-(--admin-text) truncate">{p.name}</p>
                                  <p className="text-[11px] text-(--admin-text-muted)">{p.price}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
```

- [ ] **Step 13: Add Seasonal Sale discount code + end date fields**

After the product picker block (still inside `space-y-4`), add:

```tsx
                {/* Seasonal Sale: discount code + end date */}
                {template === 'seasonal_sale' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">Discount Code <span className="font-normal">(optional)</span></label>
                      <input
                        type="text"
                        value={discountCode}
                        onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="SUMMER20"
                        className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) font-mono placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">Sale End Date <span className="font-normal">(optional)</span></label>
                      <input
                        type="date"
                        value={saleEndDate}
                        onChange={e => setSaleEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) focus:outline-none focus:border-(--admin-accent) transition-colors"
                      />
                    </div>
                  </div>
                )}
```

- [ ] **Step 14: TypeScript compile check**

```bash
npx tsc --noEmit
```

Fix any type errors before proceeding.

- [ ] **Step 15: Manual test — Bench Notes template**

1. Start dev server: `npm run dev`
2. Go to `http://localhost:3000/admin/marketing` → Campaigns → New Campaign
3. Template selector shows 3 cards — "Bench Notes" highlighted by default
4. Greeting line field visible, pre-filled with "A note from the bench."
5. Fill in Subject + Body + greeting, click "Show preview" — parchment email with greeting line appears
6. Save Draft — check Supabase `email_campaigns` row has `template = 'bench_notes'`

- [ ] **Step 16: Manual test — New Arrivals template**

1. Click "New Arrivals" card — template-specific fields reset
2. Type in intro line (body field)
3. Type a product name in the search box — results appear in dropdown
4. Click a product — slot appears with image, name, price, remove button
5. Add up to 3 products — search box hides after 3
6. Click Show preview — intro + product cards visible
7. Save Draft — `template_data.products` array in Supabase

- [ ] **Step 17: Manual test — Seasonal Sale template**

1. Click "Seasonal Sale" — headline field + discount code + date fields appear
2. Fill in all fields including headline, body, discount code `TEST20`, end date
3. Show preview — headline bold, gold dashed code badge visible, urgency line below
4. CTA label + URL required — try Save Draft without them, see validation error
5. Fill CTA, save draft — `template_data` has `headline`, `discountCode`, `saleEndDate`

- [ ] **Step 18: Manual test — Send a campaign end-to-end**

1. Compose a Bench Notes campaign with subject + body
2. Click Send Now
3. Check your inbox — email received with correct branded layout (greeting line, paragraphs, footer with unsubscribe link)
4. Check Supabase `email_campaigns` — `status = 'sent'`, `recipient_count > 0`

- [ ] **Step 19: Commit**

```bash
git add app/admin/marketing/page.tsx
git commit -m "feat: email template selector, product picker, and template-aware preview in marketing page"
```

---

## Self-Review

**Spec coverage:**
- Bench Notes template (letter, greeting, body, CTA) → Task 5 Steps 10–11 ✅
- New Arrivals (intro, product picker up to 3, CTA) → Task 5 Steps 11–12 ✅
- Seasonal Sale (headline, body, discount code, end date, CTA required) → Task 5 Steps 11, 13 ✅
- Template selector cards at top of compose → Task 5 Step 10 ✅
- Switching template resets template-specific fields, preserves subject/CTA → Task 5 Step 6 ✅
- Product picker: 300ms debounce, max 3, ✕ remove → Task 5 Steps 4, 6, 12 ✅
- Preview is template-aware → Task 5 Step 7 ✅
- Supabase migration → Task 1 ✅
- sendNewsletter extended → Task 2 Steps 7 ✅
- API routes updated → Tasks 3, 4 ✅
- Backward compat: old campaigns default to bench_notes → Task 1 Step 3 verifies ✅

**Type consistency:**
- `TemplateType` defined in Task 2, imported in Task 5 ✅
- `NewsletterProduct` defined in Task 2, used in Task 5 ✅
- `buildTemplateData()` returns `Record<string, unknown> | null` — matches `Campaign.template_data` type ✅
- `sendNewsletter` signature change in Task 2 is consumed in Task 4 ✅
- `getBodyForTemplate()` returns `body` string — works for all templates since `body` is always the main text content ✅
