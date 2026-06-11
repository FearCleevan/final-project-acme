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
