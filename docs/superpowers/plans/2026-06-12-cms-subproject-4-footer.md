# CMS Sub-project 4 — Footer Pages (FAQ, Shipping, Returns) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a three-tab admin CMS page at `/admin/content/footer` and wire the FAQ, Shipping, and Returns storefront pages to read their content from Upstash Redis instead of hardcoded arrays.

**Architecture:** The admin page (`app/admin/content/footer/page.tsx`) is a single `'use client'` file containing three tab components — FaqTab, ShippingTab, ReturnsTab — following the identical pattern to `app/admin/content/story/page.tsx`. Each tab fetches its current content on mount via `GET /api/admin/content/{key}`, allows editing, and saves via `PUT /api/admin/content/{key}`. The three storefront pages are converted to async server components that read from Redis with inline fallbacks. The `FaqAccordion` component already accepts a `faqs` prop, so no changes are needed there. The API route, content keys, and TypeScript types are already fully in place — this task is purely UI and wiring.

**Tech Stack:** Next.js 16 App Router, Tailwind v4, Upstash Redis (`lib/content.ts` → `getContent<T>(key)`), Shadcn UI (base-ui — NOT Radix), iron-session admin auth, TypeScript.

---

## Codebase Context (read before implementing any task)

### Patterns to follow exactly

**Admin UI patterns (from `app/admin/content/story/page.tsx`):**
- File is `'use client'`
- Imports: `useState`, `useEffect` from React; `toast` from `sonner`; Tabs/Card/Input/Textarea/Label/Button/Separator/AlertDialog from `@/components/ui/...`
- `saveContent(key, data)` helper: `fetch(\`/api/admin/content/${key}\`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })`
- AlertDialog trigger uses **base-ui** pattern: `<AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>Remove</AlertDialogTrigger>` — NOT `asChild`
- Each tab: `useState` with defaults, `useEffect` to fetch, `loading` guard, `saving` state, `handleSave` async function
- On mount fetch: `fetch('/api/admin/content/key').then(r => r.json()).then(({ data }) => { if (data) setForm(data) }).catch(() => {}).finally(() => setLoading(false))`
- Loading state: `if (loading) return <p className="text-sm text-muted-foreground p-4">Loading…</p>`

**Storefront wiring pattern (from `app/our-story/page.tsx` and `app/heritage/page.tsx`):**
- Make page an `async` function
- Import `getContent` from `@/lib/content`
- Import the content type from `@/lib/types/content`
- Define `FALLBACK` constant with hardcoded values
- `const content = (await getContent<ContentType>('key')) ?? FALLBACK`
- Use `content.field` everywhere the hardcoded value was used

### Key files (read these before implementing)

- `lib/types/content.ts` — all content types already defined
- `lib/content.ts` — `getContent<T>(key): Promise<T | null>` and `setContent(key, data): Promise<void>`
- `app/api/admin/content/[key]/route.ts` — already handles GET/PUT for 'faq', 'shipping', 'returns'
- `app/admin/content/story/page.tsx` — the exact pattern to replicate
- `components/faq/FaqAccordion.tsx` — accepts `{ faqs: FaqCategory[] }` prop (no changes needed)

### Types already defined in `lib/types/content.ts`

```typescript
export interface FaqQuestion { q: string; a: string }
export interface FaqCategory { category: string; questions: FaqQuestion[] }
export type FaqContent = FaqCategory[]

export interface ShippingRow   { zone: string; method: string; time: string; rate: string }
export interface ShippingNote  { title: string; body: string }
export interface ShippingContent { rows: ShippingRow[]; notes: ShippingNote[] }

export interface ReturnsSection { title: string; body: string }
export interface ReturnsContent { lead: string; sections: ReturnsSection[] }
```

### AdminSidebar note

No changes needed. The "Content" nav item at `href: '/admin/content/home'` already has `activePrefix: '/admin/content'`, so `/admin/content/footer` will be highlighted automatically.

---

## Task 1: Admin CMS page — FAQ tab

**Files:**
- Create: `app/admin/content/footer/page.tsx`

This task creates the file with the page shell and the FAQ tab only. Tasks 2 and 3 add the remaining tabs to this same file.

- [ ] **Step 1: Create the file**

Create `app/admin/content/footer/page.tsx` with this exact content:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type {
  FaqContent,
  FaqCategory,
  FaqQuestion,
  ShippingContent,
  ShippingRow,
  ShippingNote,
  ReturnsContent,
  ReturnsSection,
} from '@/lib/types/content'

// ── Shared helper ──────────────────────────────────────────────────────────────
async function saveContent(key: string, data: unknown): Promise<boolean> {
  const res = await fetch(`/api/admin/content/${key}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  return res.ok
}

// ── Defaults ───────────────────────────────────────────────────────────────────
const FAQ_DEFAULTS: FaqContent = [
  {
    category: 'Ordering',
    questions: [
      { q: 'How do I know if a lamp part will fit my lamp?', a: 'Check the product description carefully before placing your order — we include dimensions, thread sizes, and compatibility notes on each listing. If you are still unsure, contact us before ordering and we will help you confirm the correct fitment.' },
      { q: 'Can I request a specific piece that is not listed?', a: 'Yes — please make an inquiry. Write to us at acmesign01@gmail.com with a description or photo of what you are looking for. We source from a wide range of vintage and reproduction suppliers and may be able to help.' },
      { q: 'Do you offer bulk or trade pricing?', a: 'We are actively looking for distributors worldwide. If you are interested in carrying our products or purchasing in volume, please contact us directly at acmesign01@gmail.com to discuss terms.' },
    ],
  },
  {
    category: 'Products',
    questions: [
      { q: 'Do you offer restoration or reproduction services?', a: 'Yes. We offer reproduction services with minimum quantities. If you have a piece you would like reproduced or a restoration project in mind, contact us to discuss your requirements.' },
      { q: 'How are fragile items packaged?', a: 'All orders are carefully packaged by hand with protective materials. Glass and fragile items receive extra care. While we take every precaution, we recommend inspecting your parcel on arrival and photographing any damage before removing the item.' },
      { q: 'Are these reproductions or originals?', a: 'Both, depending on the piece. Original and reproduction items are clearly identified in their individual listings. If you have any questions about the provenance of a specific piece, contact us before purchasing.' },
    ],
  },
  {
    category: 'Delivery & Returns',
    questions: [
      { q: 'How long does delivery take?', a: 'Orders are dispatched within 2–4 business days from Dartmouth, Nova Scotia. Delivery times after dispatch vary by destination: Canada typically 3–7 business days via Canada Post, United States 5–10 business days, and international orders 6–18 business days via DHL Express.' },
      { q: 'My item arrived damaged. What do I do?', a: 'Photograph the item in its packaging before removing it, then contact us at acmesign01@gmail.com with your order number and photos. Damage caused in transit must be claimed directly with the freight carrier. We will provide all invoices and documentation needed to support your claim.' },
      { q: 'Can I return a specialty or fragile item?', a: 'Due to the specialty nature of our products — including antique glass, vintage porcelain, and reproduction lamp parts — all sales are generally final. If your item arrived damaged or does not match its description, contact us within 14 days and we will work with you to find a fair resolution.' },
    ],
  },
]

const SHIPPING_DEFAULTS: ShippingContent = {
  rows: [
    { zone: 'Canada', method: 'Canada Post', time: '3–7 business days', rate: 'Free over $150 CAD · rate at checkout under' },
    { zone: 'United States', method: 'Canada Post / DHL Express', time: '5–10 business days', rate: 'Free over $150 CAD equivalent · rate at checkout under' },
    { zone: 'United Kingdom & Europe', method: 'DHL Express', time: '6–12 business days', rate: 'Free over local currency equivalent of $150 CAD' },
    { zone: 'Rest of world', method: 'DHL Express', time: '8–18 business days', rate: 'Free over local currency equivalent of $150 CAD' },
  ],
  notes: [
    { title: 'Free shipping threshold', body: 'Free shipping applies to all orders over $150 CAD, or the equivalent in your local currency. When you visit our store, prices are displayed in your local currency — the free shipping threshold adjusts accordingly. Orders under the threshold will see shipping calculated at checkout based on destination and weight.' },
    { title: 'Packaging', body: 'All orders are carefully packaged by hand. Glass chimneys, shades, and other fragile items receive extra protective care due to their delicate nature. While we take every precaution, fragile items can be susceptible to damage in transit. Any damage that occurs must be claimed directly with the freight carrier — we will provide any documentation needed to support your claim.' },
    { title: 'Dispatch timing', body: 'Orders are dispatched within 2–4 business days of payment confirmation. You will receive a tracking number by email when your parcel is collected by the carrier. Dispatch times may be slightly longer during peak periods.' },
    { title: 'International customs & duties', body: 'We declare all items at their full invoice value. We do not falsify customs declarations. Import duties and taxes are the responsibility of the buyer. These are not collected by us at checkout and vary by country — please check your local customs rules before ordering.' },
    { title: 'Damaged in transit', body: 'If your order arrives damaged, please photograph it in the packaging before removing the item, then contact us at acmesign01@gmail.com. Transit damage claims must be made directly with the freight carrier. We will provide any invoices, photos, or documentation required to support your claim.' },
  ],
}

const RETURNS_DEFAULTS: ReturnsContent = {
  lead: 'Due to the specialty and fragile nature of our pieces, all sales are generally final. If something arrives damaged or is not as described, contact us — we will make it right.',
  sections: [
    { title: 'Damaged or misdescribed items', body: 'If your order arrives damaged in transit, or the item does not match its description, contact us at acmesign01@gmail.com within 14 days of delivery. Include your order number and photographs of the item and packaging. We will review each case individually and work with you toward a fair resolution. Damage caused by carrier mishandling must be claimed directly with the freight company — we will provide any documentation needed to support your claim.' },
    { title: 'Specialty and fragile items', body: 'We carry antique glass, vintage porcelain, and reproduction lamp components — all of which are delicate specialty items. Because of their nature, we are not always able to accept change-of-mind returns. If you are unsure whether a piece is right for your lamp, please contact us before purchasing. We are happy to assist with fitment questions.' },
    { title: 'How to contact us about an issue', body: 'Write to us at acmesign01@gmail.com with your order reference and a brief description of the issue. We respond to every message personally. We do not have an automated returns portal — you will hear from a person.' },
    { title: 'Refund timing', body: 'When a refund is approved, it is issued to your original payment method. We will send you a confirmation when it has been processed. Timing depends on your bank or card provider, but typically appears within 3–5 business days.' },
  ],
}

// ── FAQ Tab ────────────────────────────────────────────────────────────────────
function FaqTab() {
  const [categories, setCategories] = useState<FaqContent>(FAQ_DEFAULTS)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    fetch('/api/admin/content/faq')
      .then(r => r.json())
      .then(({ data }) => { if (data) setCategories(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function updateCategory(catIdx: number, value: string) {
    setCategories(prev => prev.map((c, i) => i === catIdx ? { ...c, category: value } : c))
  }

  function updateQuestion(catIdx: number, qIdx: number, field: keyof FaqQuestion, value: string) {
    setCategories(prev => prev.map((c, i) =>
      i === catIdx
        ? { ...c, questions: c.questions.map((q, j) => j === qIdx ? { ...q, [field]: value } : q) }
        : c
    ))
  }

  function addQuestion(catIdx: number) {
    setCategories(prev => prev.map((c, i) =>
      i === catIdx ? { ...c, questions: [...c.questions, { q: '', a: '' }] } : c
    ))
  }

  function removeQuestion(catIdx: number, qIdx: number) {
    setCategories(prev => prev.map((c, i) =>
      i === catIdx ? { ...c, questions: c.questions.filter((_, j) => j !== qIdx) } : c
    ))
  }

  function addCategory() {
    setCategories(prev => [...prev, { category: '', questions: [] }])
  }

  function removeCategory(catIdx: number) {
    setCategories(prev => prev.filter((_, i) => i !== catIdx))
  }

  async function handleSave() {
    setSaving(true)
    const ok = await saveContent('faq', categories)
    ok ? toast.success('FAQ saved') : toast.error('Failed to save')
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading…</p>

  return (
    <div className="space-y-6">
      {categories.map((cat, catIdx) => (
        <Card key={catIdx}>
          <CardHeader className="pb-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <Label>Category name</Label>
                <Input
                  value={cat.category}
                  onChange={e => updateCategory(catIdx, e.target.value)}
                  placeholder="e.g. Ordering"
                />
              </div>
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" size="sm" className="mt-6" />}>
                  Remove category
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove category?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove "{cat.category || 'this category'}" and all its questions. Save to apply.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeCategory(catIdx)}>Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {cat.questions.map((q, qIdx) => (
              <div key={qIdx} className="space-y-3 p-4 border rounded-md">
                <div className="space-y-1.5">
                  <Label>Question</Label>
                  <Input
                    value={q.q}
                    onChange={e => updateQuestion(catIdx, qIdx, 'q', e.target.value)}
                    placeholder="Question text…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Answer</Label>
                  <Textarea
                    rows={3}
                    value={q.a}
                    onChange={e => updateQuestion(catIdx, qIdx, 'a', e.target.value)}
                    placeholder="Answer text…"
                  />
                </div>
                <Separator />
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                    Remove question
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove question?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove this Q&amp;A pair. Save to apply.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeQuestion(catIdx, qIdx)}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addQuestion(catIdx)} className="w-full">
              + Add question
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addCategory} className="w-full">+ Add category</Button>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save FAQ'}
      </Button>
    </div>
  )
}

// ── Shipping Tab ───────────────────────────────────────────────────────────────
function ShippingTab() {
  const [form,    setForm]    = useState<ShippingContent>(SHIPPING_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    fetch('/api/admin/content/shipping')
      .then(r => r.json())
      .then(({ data }) => { if (data) setForm(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function updateRow(idx: number, field: keyof ShippingRow, value: string) {
    setForm(prev => ({ ...prev, rows: prev.rows.map((r, i) => i === idx ? { ...r, [field]: value } : r) }))
  }

  function addRow() {
    setForm(prev => ({ ...prev, rows: [...prev.rows, { zone: '', method: '', time: '', rate: '' }] }))
  }

  function removeRow(idx: number) {
    setForm(prev => ({ ...prev, rows: prev.rows.filter((_, i) => i !== idx) }))
  }

  function updateNote(idx: number, field: keyof ShippingNote, value: string) {
    setForm(prev => ({ ...prev, notes: prev.notes.map((n, i) => i === idx ? { ...n, [field]: value } : n) }))
  }

  function addNote() {
    setForm(prev => ({ ...prev, notes: [...prev.notes, { title: '', body: '' }] }))
  }

  function removeNote(idx: number) {
    setForm(prev => ({ ...prev, notes: prev.notes.filter((_, i) => i !== idx) }))
  }

  async function handleSave() {
    setSaving(true)
    const ok = await saveContent('shipping', form)
    ok ? toast.success('Shipping info saved') : toast.error('Failed to save')
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading…</p>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold">Rate table</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.rows.map((row, idx) => (
            <div key={idx} className="space-y-3 p-4 border rounded-md">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Zone</Label>
                  <Input value={row.zone} onChange={e => updateRow(idx, 'zone', e.target.value)} placeholder="Canada" />
                </div>
                <div className="space-y-1.5">
                  <Label>Carrier</Label>
                  <Input value={row.method} onChange={e => updateRow(idx, 'method', e.target.value)} placeholder="Canada Post" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Timeframe</Label>
                  <Input value={row.time} onChange={e => updateRow(idx, 'time', e.target.value)} placeholder="3–7 business days" />
                </div>
                <div className="space-y-1.5">
                  <Label>Rate</Label>
                  <Input value={row.rate} onChange={e => updateRow(idx, 'rate', e.target.value)} placeholder="Free over $150 CAD" />
                </div>
              </div>
              <Separator />
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                  Remove row
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove shipping row?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the "{row.zone || 'selected'}" row. Save to apply.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeRow(idx)}>Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          <Button variant="outline" onClick={addRow} className="w-full">+ Add row</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold">Notes &amp; policies</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.notes.map((note, idx) => (
            <div key={idx} className="space-y-3 p-4 border rounded-md">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={note.title} onChange={e => updateNote(idx, 'title', e.target.value)} placeholder="Note title" />
              </div>
              <div className="space-y-1.5">
                <Label>Body</Label>
                <Textarea rows={3} value={note.body} onChange={e => updateNote(idx, 'body', e.target.value)} placeholder="Note body…" />
              </div>
              <Separator />
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                  Remove note
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove note?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove "{note.title || 'this note'}". Save to apply.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeNote(idx)}>Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          <Button variant="outline" onClick={addNote} className="w-full">+ Add note</Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save shipping info'}
      </Button>
    </div>
  )
}

// ── Returns Tab ────────────────────────────────────────────────────────────────
function ReturnsTab() {
  const [form,    setForm]    = useState<ReturnsContent>(RETURNS_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    fetch('/api/admin/content/returns')
      .then(r => r.json())
      .then(({ data }) => { if (data) setForm(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function updateSection(idx: number, field: keyof ReturnsSection, value: string) {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }))
  }

  function addSection() {
    setForm(prev => ({ ...prev, sections: [...prev.sections, { title: '', body: '' }] }))
  }

  function removeSection(idx: number) {
    setForm(prev => ({ ...prev, sections: prev.sections.filter((_, i) => i !== idx) }))
  }

  async function handleSave() {
    setSaving(true)
    const ok = await saveContent('returns', form)
    ok ? toast.success('Returns policy saved') : toast.error('Failed to save')
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading…</p>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold">Lead statement</p>
          <p className="text-xs text-muted-foreground">Displayed as an italic blockquote at the top of the returns page.</p>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={form.lead}
            onChange={e => setForm(prev => ({ ...prev, lead: e.target.value }))}
            placeholder="Due to the specialty and fragile nature of our pieces…"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold">Policy sections</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.sections.map((section, idx) => (
            <div key={idx} className="space-y-3 p-4 border rounded-md">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={section.title} onChange={e => updateSection(idx, 'title', e.target.value)} placeholder="Section title" />
              </div>
              <div className="space-y-1.5">
                <Label>Body</Label>
                <Textarea rows={4} value={section.body} onChange={e => updateSection(idx, 'body', e.target.value)} placeholder="Section body…" />
              </div>
              <Separator />
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                  Remove section
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove section?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove "{section.title || 'this section'}". Save to apply.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeSection(idx)}>Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          <Button variant="outline" onClick={addSection} className="w-full">+ Add section</Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save returns policy'}
      </Button>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ContentFooterPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-[18px] font-semibold text-(--admin-text)">Footer Pages Content</h1>
        <p className="text-[13px] text-(--admin-text-muted) mt-1">Changes go live immediately after saving.</p>
      </div>

      <Tabs defaultValue="faq">
        <TabsList className="mb-6">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="faq">
          <FaqTab />
        </TabsContent>
        <TabsContent value="shipping">
          <ShippingTab />
        </TabsContent>
        <TabsContent value="returns">
          <ReturnsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors. If you see errors about missing types or imports, check that all imports match exactly what's exported from `lib/types/content.ts`.

- [ ] **Step 3: Smoke-test the admin page in dev**

Run: `npm run dev`

Navigate to `http://localhost:3000/admin/content/footer` (log in first at `/admin/login` if needed).

Verify:
- Three tabs render: FAQ, Shipping, Returns
- FAQ tab shows 3 categories with questions loaded from defaults
- Shipping tab shows rate table rows and notes loaded from defaults
- Returns tab shows lead textarea and 4 sections loaded from defaults
- "Content" nav item in sidebar is highlighted (active state)

- [ ] **Step 4: Test save + reload cycle for FAQ**

In the FAQ tab, edit the first question text slightly (e.g., add a word), then click "Save FAQ".

Expected: Green toast "FAQ saved".

Refresh the page and navigate back to the FAQ tab.

Expected: Your edited text persists (loaded from Redis, not defaults).

---

## Task 2: Wire `app/faq/page.tsx` to Redis

**Files:**
- Modify: `app/faq/page.tsx`

The current file is a regular (non-async) function with hardcoded `faqs` and `faqJsonLd` arrays. We convert it to an async server component that reads from Redis with the hardcoded values as fallback.

- [ ] **Step 1: Rewrite `app/faq/page.tsx`**

Replace the entire file with:

```tsx
import type { Metadata } from 'next'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'
import FaqAccordion from '@/components/faq/FaqAccordion'
import { getContent } from '@/lib/content'
import type { FaqContent } from '@/lib/types/content'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions — Acme Vintage Supply',
  description: 'Answers to common questions about oil lamp parts, ordering, shipping, and returns at Acme Vintage Supply.',
  alternates: { canonical: '/faq' },
}

const FALLBACK: FaqContent = [
  {
    category: 'Ordering',
    questions: [
      { q: 'How do I know if a lamp part will fit my lamp?', a: 'Check the product description carefully before placing your order — we include dimensions, thread sizes, and compatibility notes on each listing. If you are still unsure, contact us before ordering and we will help you confirm the correct fitment.' },
      { q: 'Can I request a specific piece that is not listed?', a: 'Yes — please make an inquiry. Write to us at acmesign01@gmail.com with a description or photo of what you are looking for. We source from a wide range of vintage and reproduction suppliers and may be able to help.' },
      { q: 'Do you offer bulk or trade pricing?', a: 'We are actively looking for distributors worldwide. If you are interested in carrying our products or purchasing in volume, please contact us directly at acmesign01@gmail.com to discuss terms.' },
    ],
  },
  {
    category: 'Products',
    questions: [
      { q: 'Do you offer restoration or reproduction services?', a: 'Yes. We offer reproduction services with minimum quantities. If you have a piece you would like reproduced or a restoration project in mind, contact us to discuss your requirements.' },
      { q: 'How are fragile items packaged?', a: 'All orders are carefully packaged by hand with protective materials. Glass and fragile items receive extra care. While we take every precaution, we recommend inspecting your parcel on arrival and photographing any damage before removing the item.' },
      { q: 'Are these reproductions or originals?', a: 'Both, depending on the piece. Original and reproduction items are clearly identified in their individual listings. If you have any questions about the provenance of a specific piece, contact us before purchasing.' },
    ],
  },
  {
    category: 'Delivery & Returns',
    questions: [
      { q: 'How long does delivery take?', a: 'Orders are dispatched within 2–4 business days from Dartmouth, Nova Scotia. Delivery times after dispatch vary by destination: Canada typically 3–7 business days via Canada Post, United States 5–10 business days, and international orders 6–18 business days via DHL Express.' },
      { q: 'My item arrived damaged. What do I do?', a: 'Photograph the item in its packaging before removing it, then contact us at acmesign01@gmail.com with your order number and photos. Damage caused in transit must be claimed directly with the freight carrier. We will provide all invoices and documentation needed to support your claim.' },
      { q: 'Can I return a specialty or fragile item?', a: 'Due to the specialty nature of our products — including antique glass, vintage porcelain, and reproduction lamp parts — all sales are generally final. If your item arrived damaged or does not match its description, contact us within 14 days and we will work with you to find a fair resolution.' },
    ],
  },
]

export default async function FAQPage() {
  const faqs = (await getContent<FaqContent>('faq')) ?? FALLBACK

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.flatMap(({ questions }) =>
      questions.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      }))
    ),
  }

  return (
    <div className="bg-parchment min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-[860px] mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[{ label: 'Storefront', href: '/' }, { label: 'FAQ' }]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">Common questions</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-14"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          Frequently asked.
        </h1>

        <FaqAccordion faqs={faqs} />

        <div className="border-t border-ink-rule mt-16 pt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-serif text-[18px] text-ink-charcoal font-medium mb-1">
              Not answered here?
            </p>
            <p className="font-sans text-[14px] text-ink-soft">
              Write or call. We answer every message ourselves.
            </p>
          </div>
          <Button href="/contact" variant="brass">Contact us directly</Button>
        </div>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Verify storefront FAQ page**

With dev server running, navigate to `http://localhost:3000/faq`.

Expected:
- Page renders correctly with the same visual appearance as before
- FAQ accordion works (expand/collapse questions)
- If you previously saved FAQ content via the admin panel (Task 1), that content appears here instead of the fallback

- [ ] **Step 4: Verify JSON-LD is present**

In the browser, right-click → View Page Source (or inspect the `<head>`).

Expected: A `<script type="application/ld+json">` tag containing FAQPage schema with the current questions.

---

## Task 3: Wire `app/shipping/page.tsx` to Redis

**Files:**
- Modify: `app/shipping/page.tsx`

The current file has hardcoded `rows` array and inline notes array. We convert it to an async server component.

- [ ] **Step 1: Rewrite `app/shipping/page.tsx`**

Replace the entire file with:

```tsx
import type { Metadata } from 'next'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'
import { getContent } from '@/lib/content'
import type { ShippingContent } from '@/lib/types/content'

export const metadata: Metadata = {
  title: 'Shipping Information — Canada, US & Worldwide',
  description: 'Free shipping over $150 CAD. Canada Post and DHL Express to Canada, USA, UK, Europe and worldwide. Ships from Dartmouth, Nova Scotia.',
  alternates: { canonical: '/shipping' },
}

const FALLBACK: ShippingContent = {
  rows: [
    { zone: 'Canada', method: 'Canada Post', time: '3–7 business days', rate: 'Free over $150 CAD · rate at checkout under' },
    { zone: 'United States', method: 'Canada Post / DHL Express', time: '5–10 business days', rate: 'Free over $150 CAD equivalent · rate at checkout under' },
    { zone: 'United Kingdom & Europe', method: 'DHL Express', time: '6–12 business days', rate: 'Free over local currency equivalent of $150 CAD' },
    { zone: 'Rest of world', method: 'DHL Express', time: '8–18 business days', rate: 'Free over local currency equivalent of $150 CAD' },
  ],
  notes: [
    { title: 'Free shipping threshold', body: 'Free shipping applies to all orders over $150 CAD, or the equivalent in your local currency. When you visit our store, prices are displayed in your local currency — the free shipping threshold adjusts accordingly. Orders under the threshold will see shipping calculated at checkout based on destination and weight.' },
    { title: 'Packaging', body: 'All orders are carefully packaged by hand. Glass chimneys, shades, and other fragile items receive extra protective care due to their delicate nature. While we take every precaution, fragile items can be susceptible to damage in transit. Any damage that occurs must be claimed directly with the freight carrier — we will provide any documentation needed to support your claim.' },
    { title: 'Dispatch timing', body: 'Orders are dispatched within 2–4 business days of payment confirmation. You will receive a tracking number by email when your parcel is collected by the carrier. Dispatch times may be slightly longer during peak periods.' },
    { title: 'International customs & duties', body: 'We declare all items at their full invoice value. We do not falsify customs declarations. Import duties and taxes are the responsibility of the buyer. These are not collected by us at checkout and vary by country — please check your local customs rules before ordering.' },
    { title: 'Damaged in transit', body: 'If your order arrives damaged, please photograph it in the packaging before removing the item, then contact us at acmesign01@gmail.com. Transit damage claims must be made directly with the freight carrier. We will provide any invoices, photos, or documentation required to support your claim.' },
  ],
}

export default async function ShippingPage() {
  const shipping = (await getContent<ShippingContent>('shipping')) ?? FALLBACK

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[900px] mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[{ label: 'Storefront', href: '/' }, { label: 'Shipping & Freight' }]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">Dispatch from Dartmouth, Nova Scotia</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-4"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          Shipping &amp; freight.
        </h1>
        <p className="font-sans text-[17px] text-ink-soft leading-relaxed mb-14 max-w-[58ch]">
          Every order is carefully packaged by hand in Dartmouth, Nova Scotia.
          All glass and fragile items receive extra protective care before dispatch.
          We ship worldwide.
        </p>

        {/* Rate table */}
        <div className="border border-ink-rule rounded-sm overflow-hidden mb-14">
          <div className="grid grid-cols-4 bg-ink-charcoal text-canvas-heading px-5 py-3">
            {['Zone', 'Carrier', 'Timeframe', 'Rate'].map(h => (
              <span key={h} className="text-[10px] font-mono uppercase tracking-eyebrow text-canvas-dim">{h}</span>
            ))}
          </div>
          {shipping.rows.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-4 gap-2 px-5 py-4 border-t border-ink-rule ${i % 2 === 1 ? 'bg-parchment-2' : 'bg-parchment'}`}
            >
              <span className="font-sans text-[13px] text-ink-iron leading-snug">{row.zone}</span>
              <span className="font-sans text-[13px] text-ink-soft leading-snug">{row.method}</span>
              <span className="font-sans text-[13px] text-ink-soft">{row.time}</span>
              <span className="font-mono text-[12px] text-brass-deep">{row.rate}</span>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="space-y-8 mb-14">
          {shipping.notes.map(({ title, body }) => (
            <div key={title} className="border-t border-ink-rule pt-6">
              <h2 className="font-serif text-[18px] font-medium text-ink-charcoal mb-3">{title}</h2>
              <p className="font-sans text-[15px] text-ink-soft leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <Button href="/contact" variant="brass">Questions about your shipment</Button>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Verify storefront shipping page**

Navigate to `http://localhost:3000/shipping`.

Expected: Page renders identically to before — rate table with 4 rows, 5 note sections below, same visual appearance.

---

## Task 4: Wire `app/returns/page.tsx` to Redis

**Files:**
- Modify: `app/returns/page.tsx`

The current file has a hardcoded lead blockquote and hardcoded sections array. We convert it to an async server component.

- [ ] **Step 1: Rewrite `app/returns/page.tsx`**

Replace the entire file with:

```tsx
import type { Metadata } from 'next'
import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'
import { getContent } from '@/lib/content'
import type { ReturnsContent } from '@/lib/types/content'

export const metadata: Metadata = {
  title: 'Returns & Refunds — Acme Vintage Supply',
  description: 'All sales are final on specialty vintage items. Contact us before ordering if you have fitment questions. We resolve damaged or misdescribed items within 14 days.',
  alternates: { canonical: '/returns' },
}

const FALLBACK: ReturnsContent = {
  lead: 'Due to the specialty and fragile nature of our pieces, all sales are generally final. If something arrives damaged or is not as described, contact us — we will make it right.',
  sections: [
    { title: 'Damaged or misdescribed items', body: 'If your order arrives damaged in transit, or the item does not match its description, contact us at acmesign01@gmail.com within 14 days of delivery. Include your order number and photographs of the item and packaging. We will review each case individually and work with you toward a fair resolution. Damage caused by carrier mishandling must be claimed directly with the freight company — we will provide any documentation needed to support your claim.' },
    { title: 'Specialty and fragile items', body: 'We carry antique glass, vintage porcelain, and reproduction lamp components — all of which are delicate specialty items. Because of their nature, we are not always able to accept change-of-mind returns. If you are unsure whether a piece is right for your lamp, please contact us before purchasing. We are happy to assist with fitment questions.' },
    { title: 'How to contact us about an issue', body: 'Write to us at acmesign01@gmail.com with your order reference and a brief description of the issue. We respond to every message personally. We do not have an automated returns portal — you will hear from a person.' },
    { title: 'Refund timing', body: 'When a refund is approved, it is issued to your original payment method. We will send you a confirmation when it has been processed. Timing depends on your bank or card provider, but typically appears within 3–5 business days.' },
  ],
}

export default async function ReturnsPage() {
  const returns = (await getContent<ReturnsContent>('returns')) ?? FALLBACK

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[860px] mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[{ label: 'Storefront', href: '/' }, { label: 'Returns & Refunds' }]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">The policy, plainly</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-4"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          Returns &amp; refunds.
        </h1>

        {/* Lead statement */}
        <div className="border-l-4 border-brass-deep pl-6 py-2 my-10">
          <p className="font-serif italic text-[20px] text-ink-charcoal leading-relaxed">
            {returns.lead}
          </p>
        </div>

        <div className="space-y-10 mb-14">
          {returns.sections.map(({ title, body }) => (
            <div key={title} className="border-t border-ink-rule pt-8">
              <h2 className="font-serif text-[20px] font-medium text-ink-charcoal mb-3 leading-snug">{title}</h2>
              <p className="font-sans text-[15px] text-ink-soft leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="bg-parchment-2 border border-ink-rule rounded-sm p-6 mb-10">
          <p className="font-sans text-[14px] text-ink-soft leading-relaxed">
            <span className="font-semibold text-ink-iron">Acme Vintage Supply</span>{' '}
            · Dartmouth, Nova Scotia, Canada{' '}
            <span className="text-ink-rule mx-2">·</span>{' '}
            <a href="tel:+19024811007" className="text-brass-deep hover:text-brass transition-colors">
              (902) 481-1007
            </a>{' '}
            <span className="text-ink-rule mx-2">·</span>{' '}
            <a href="mailto:acmesign01@gmail.com" className="text-brass-deep hover:text-brass transition-colors">
              acmesign01@gmail.com
            </a>
          </p>
        </div>

        <Button href="/contact" variant="primary">Contact us about an order</Button>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Verify storefront returns page**

Navigate to `http://localhost:3000/returns`.

Expected: Page renders identically to before — lead blockquote, 4 sections, contact info block, CTA button.

- [ ] **Step 4: End-to-end test — edit returns lead via admin, verify on storefront**

1. Go to `http://localhost:3000/admin/content/footer`, click "Returns" tab.
2. Edit the lead statement (add a word or change a phrase).
3. Click "Save returns policy". Expect green toast.
4. Navigate to `http://localhost:3000/returns`.
5. Expect the updated lead text in the brass-border blockquote.

This confirms Redis round-trip works for returns content.

---

## Self-Review Checklist

**Spec coverage:**
- [x] Admin page at `/admin/content/footer` with 3 tabs — Task 1
- [x] FAQ tab: category CRUD + nested question CRUD — Task 1 (FaqTab)
- [x] Shipping tab: rate table rows CRUD + notes CRUD — Task 1 (ShippingTab)
- [x] Returns tab: lead statement + sections CRUD — Task 1 (ReturnsTab)
- [x] `app/faq/page.tsx` reads from Redis — Task 2
- [x] FAQ JSON-LD script built from live Redis data — Task 2
- [x] `app/shipping/page.tsx` reads from Redis — Task 3
- [x] `app/returns/page.tsx` reads from Redis — Task 4
- [x] All three pages fall back to hardcoded values if Redis has no data — FALLBACK constants in Tasks 2–4

**Type consistency:**
- `FaqContent`, `FaqCategory`, `FaqQuestion` — used consistently across Task 1 and Task 2
- `ShippingContent`, `ShippingRow`, `ShippingNote` — used consistently across Task 1 and Task 3
- `ReturnsContent`, `ReturnsSection` — used consistently across Task 1 and Task 4
- All types imported from `@/lib/types/content` — matches existing codebase pattern

**No placeholders:** All code blocks are complete and runnable.
