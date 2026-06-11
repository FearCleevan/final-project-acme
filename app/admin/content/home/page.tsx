'use client'

import { useState, useEffect, useRef } from 'react'
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
import type { HeroContent, BenchContent, Testimonial } from '@/lib/types/content'

const HERO_DEFAULTS: HeroContent = {
  eyebrow:      'No. 01 · Spring · Fifty/Fifty',
  headline:     'Authentic light from a forgotten era.',
  italicWord:   'forgotten',
  subtext:      'Fifty pieces of precision-reproduced antique oil lamp parts, hand-blown chimneys, and porcelain advertising signs — crafted at a Pune press shop running original dies since 1898, and now available in North America for the first time.',
  ctaPrimary:   { label: 'Enter the Catalog', href: '/catalog' },
  ctaSecondary: { label: 'Read the Story',    href: '/our-story' },
  imageUrl:     '/assets/HeroSampleImage0.webp',
}

const BENCH_DEFAULTS: BenchContent = {
  eyebrow:  'Hand-selected',
  heading:  'Picked off the bench this week.',
  linkText: 'See all 50 →',
  linkHref: '/catalog',
}

const TESTIMONIAL_DEFAULTS: Testimonial[] = [
  { name: 'Brent VanSlyke', location: 'Halifax, NS', quote: 'Thanks for the great job! Really appreciate the extra effort you took to make sure everything was done right. Highly recommend — see you on the next project.' },
  { name: 'Ryan Blackburn',  location: 'Nova Scotia',  quote: 'Tim is elite at his craft. Helpful team and fantastic service.' },
  { name: 'Shaun Tapper',   location: 'Halifax, NS',  quote: 'Great service. I came in for a quote on Monday and everything was completed on Wednesday, exactly as requested. I fully recommend Acme for all your requirements.' },
  { name: 'Raphael Huwiler', location: 'Nova Scotia', quote: 'Love the work these guys did. Thank you very much for a great experience.' },
  { name: 'Leah Hemeon',    location: 'Halifax, NS',  quote: 'Very helpful and accommodating. Reasonable prices and very friendly service. I would recommend them to anyone.' },
  { name: 'Neil Thibeault',  location: 'Nova Scotia', quote: 'These guys do a fantastic job and are very helpful. Thanks Acme — the work looks awesome.' },
]

async function saveContent(key: string, data: unknown): Promise<boolean> {
  const res = await fetch(`/api/admin/content/${key}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  return res.ok
}

async function uploadImage(file: File): Promise<string | null> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/admin/content/upload', { method: 'POST', body: fd })
  if (!res.ok) return null
  const { url } = await res.json()
  return url as string
}

function HeroTab() {
  const [form,      setForm]      = useState<HeroContent>(HERO_DEFAULTS)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/content/hero')
      .then(r => r.json())
      .then(({ data }) => { if (data) setForm(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function set(field: keyof HeroContent, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function setCta(cta: 'ctaPrimary' | 'ctaSecondary', field: 'label' | 'href', value: string) {
    setForm(prev => ({ ...prev, [cta]: { ...prev[cta], [field]: value } }))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadImage(file)
    if (url) setForm(prev => ({ ...prev, imageUrl: url }))
    else toast.error('Image upload failed')
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    const ok = await saveContent('hero', form)
    ok ? toast.success('Hero section saved') : toast.error('Failed to save')
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading…</p>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold">Editorial text</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Eyebrow label</Label>
            <Input value={form.eyebrow} onChange={e => set('eyebrow', e.target.value)} placeholder="No. 01 · Spring · Fifty/Fifty" />
          </div>
          <div className="space-y-1.5">
            <Label>Headline</Label>
            <Input value={form.headline} onChange={e => set('headline', e.target.value)} placeholder="Authentic light from a forgotten era." />
          </div>
          <div className="space-y-1.5">
            <Label>Italic word in headline</Label>
            <Input value={form.italicWord} onChange={e => set('italicWord', e.target.value)} placeholder="forgotten" />
            <p className="text-xs text-muted-foreground">The exact word in the headline that gets italic brass styling.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Subtext</Label>
            <Textarea rows={4} value={form.subtext} onChange={e => set('subtext', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold">Call-to-action buttons</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Primary button label</Label>
              <Input value={form.ctaPrimary.label} onChange={e => setCta('ctaPrimary', 'label', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Primary button link</Label>
              <Input value={form.ctaPrimary.href} onChange={e => setCta('ctaPrimary', 'href', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Secondary button label</Label>
              <Input value={form.ctaSecondary.label} onChange={e => setCta('ctaSecondary', 'label', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Secondary button link</Label>
              <Input value={form.ctaSecondary.href} onChange={e => setCta('ctaSecondary', 'href', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold">Hero image</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="Hero"
              className="w-40 h-40 object-cover rounded-md border"
            />
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? 'Uploading…' : 'Replace image'}
          </Button>
          <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP. Replaces immediately after upload.</p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save hero section'}
      </Button>
    </div>
  )
}

function BenchTab() {
  const [form,    setForm]    = useState<BenchContent>(BENCH_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    fetch('/api/admin/content/bench')
      .then(r => r.json())
      .then(({ data }) => { if (data) setForm(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function set(field: keyof BenchContent, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const ok = await saveContent('bench', form)
    ok ? toast.success('Bench section saved') : toast.error('Failed to save')
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading…</p>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold">Section heading</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Eyebrow label</Label>
            <Input value={form.eyebrow} onChange={e => set('eyebrow', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Section heading</Label>
            <Input value={form.heading} onChange={e => set('heading', e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold">&qout;See all&qout; link</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Link text</Label>
              <Input value={form.linkText} onChange={e => set('linkText', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Link href</Label>
              <Input value={form.linkHref} onChange={e => set('linkHref', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>
      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save bench section'}
      </Button>
    </div>
  )
}

function TestimonialsTab() {
  const [items,   setItems]   = useState<Testimonial[]>(TESTIMONIAL_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    fetch('/api/admin/content/testimonials')
      .then(r => r.json())
      .then(({ data }) => { if (data) setItems(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function update(idx: number, field: keyof Testimonial, value: string) {
    setItems(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t))
  }

  function add() {
    setItems(prev => [...prev, { name: '', location: '', quote: '' }])
  }

  function remove(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    setSaving(true)
    const ok = await saveContent('testimonials', items)
    ok ? toast.success('Testimonials saved') : toast.error('Failed to save')
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading…</p>

  return (
    <div className="space-y-4">
      {items.map((t, idx) => (
        <Card key={idx}>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={t.name} onChange={e => update(idx, 'name', e.target.value)} placeholder="Customer name" />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={t.location} onChange={e => update(idx, 'location', e.target.value)} placeholder="City, Province" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Quote</Label>
              <Textarea rows={3} value={t.quote} onChange={e => update(idx, 'quote', e.target.value)} placeholder="Customer review…" />
            </div>
            <Separator />
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                Remove
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove testimonial?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove {t.name || 'this testimonial'} from the carousel. Save changes to apply.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => remove(idx)}>Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={add} className="w-full">
        + Add testimonial
      </Button>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save testimonials'}
      </Button>
    </div>
  )
}

export default function ContentHomePage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-[18px] font-semibold text-(--admin-text)">Home Page Content</h1>
        <p className="text-[13px] text-(--admin-text-muted) mt-1">Changes go live immediately after saving.</p>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="mb-6">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="bench">Bench Section</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <HeroTab />
        </TabsContent>
        <TabsContent value="bench">
          <BenchTab />
        </TabsContent>
        <TabsContent value="testimonials">
          <TestimonialsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
