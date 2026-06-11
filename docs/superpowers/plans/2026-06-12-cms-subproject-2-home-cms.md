# Content CMS — Sub-project 2: Home Page CMS

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin CMS page for Home Page content (Hero, Bench section, Testimonials) and wire the storefront components to read from Redis instead of hardcoded values.

**Architecture:** The admin `/admin/content/home` page is a client component with Shadcn Tabs. It loads current content from Redis on mount via the admin API routes and saves changes on form submit. On the storefront, `HeroSection` is converted to a server component (parallax animation extracted to a client child), `TestimonialsCarousel` accepts a props array, and `PickedOffTheBench` reads its heading from Redis. All three fall back to hardcoded defaults if Redis has no data yet.

**Tech Stack:** Next.js 16 App Router, Shadcn UI (Card, Tabs, Input, Textarea, Label, Button, AlertDialog, Separator), Upstash Redis via `lib/content.ts`, Vercel Blob via `/api/admin/content/upload`, framer-motion (existing)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `app/admin/content/home/page.tsx` | Rewrite | Full CMS page: Hero + Bench + Testimonials tabs |
| `components/home/HeroParallaxImage.tsx` | Create | Client component — parallax animation + image |
| `components/home/HeroSection.tsx` | Rewrite | Server component — fetches hero content, renders text + HeroParallaxImage |
| `components/home/TestimonialsCarousel.tsx` | Modify | Accept `testimonials` prop instead of importing JSON |
| `components/home/TestimonialsWrapper.tsx` | Create | Server component — fetches testimonials from Redis, passes to TestimonialsCarousel |
| `components/home/PickedOffTheBench.tsx` | Modify | Fetch bench content from Redis for heading text |
| `app/page.tsx` | Modify | Use TestimonialsWrapper instead of TestimonialsCarousel |

---

## Default content values (reference — used in multiple tasks)

```ts
// Hero defaults (matches current hardcoded HeroSection.tsx)
const HERO_DEFAULTS = {
  eyebrow: 'No. 01 · Spring · Fifty/Fifty',
  headline: 'Authentic light from a forgotten era.',
  italicWord: 'forgotten',
  subtext: 'Fifty pieces of precision-reproduced antique oil lamp parts, hand-blown chimneys, and porcelain advertising signs — crafted at a Pune press shop running original dies since 1898, and now available in North America for the first time.',
  ctaPrimary:   { label: 'Enter the Catalog', href: '/catalog' },
  ctaSecondary: { label: 'Read the Story',    href: '/our-story' },
  imageUrl: '/assets/HeroSampleImage0.webp',
}

// Bench defaults (matches current hardcoded PickedOffTheBench.tsx)
const BENCH_DEFAULTS = {
  eyebrow:  'Hand-selected',
  heading:  'Picked off the bench this week.',
  linkText: 'See all 50 →',
  linkHref: '/catalog',
}
```

---

## Task 1: Build /admin/content/home page — Hero tab

**Files:**
- Rewrite: `app/admin/content/home/page.tsx`

- [ ] **Step 1: Replace stub page with full Hero tab implementation**

Replace `app/admin/content/home/page.tsx` entirely with:

```tsx
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

// ── Defaults ──────────────────────────────────────────────────────────────────
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

// ── Shared save helper ────────────────────────────────────────────────────────
async function saveContent(key: string, data: unknown): Promise<boolean> {
  const res = await fetch(`/api/admin/content/${key}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  return res.ok
}

// ── Image upload helper ───────────────────────────────────────────────────────
async function uploadImage(file: File): Promise<string | null> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/admin/content/upload', { method: 'POST', body: fd })
  if (!res.ok) return null
  const { url } = await res.json()
  return url as string
}

// ── Hero Tab ──────────────────────────────────────────────────────────────────
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

// ── Bench Tab ─────────────────────────────────────────────────────────────────
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
          <p className="text-sm font-semibold">"See all" link</p>
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

// ── Testimonials Tab ──────────────────────────────────────────────────────────
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
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">Remove</Button>
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ContentHomePage() {
  return (
    <div className="p-6 max-w-3xl">
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
```

- [ ] **Step 2: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

---

## Task 2: Extract HeroParallaxImage + convert HeroSection to server component

**Files:**
- Create: `components/home/HeroParallaxImage.tsx`
- Rewrite: `components/home/HeroSection.tsx`

- [ ] **Step 1: Create HeroParallaxImage.tsx**

Create `components/home/HeroParallaxImage.tsx`:

```tsx
'use client'

import { motion } from 'framer-motion'
import { useParallax } from '@/hooks/useParallax'
import PlateImage from '@/components/shared/PlateImage'

interface Props {
  src: string
  alt: string
}

export default function HeroParallaxImage({ src, alt }: Props) {
  const { ref, y } = useParallax(0.2)

  return (
    <div ref={ref} className="relative order-1 lg:order-2 overflow-hidden flex justify-center lg:justify-end">
      <motion.div
        style={{ y, willChange: 'transform' }}
        className="w-full max-w-150"
      >
        <PlateImage
          src={src}
          alt={alt}
          aspectRatio="4/5"
          dark={false}
          objectFit="cover"
          className="w-full h-auto"
          priority
        />
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite HeroSection.tsx as server component**

Replace `components/home/HeroSection.tsx` entirely:

```tsx
import Button from '@/components/shared/Button'
import Eyebrow from '@/components/shared/Eyebrow'
import HeroParallaxImage from '@/components/home/HeroParallaxImage'
import { getContent } from '@/lib/content'
import type { HeroContent } from '@/lib/types/content'

const FALLBACK: HeroContent = {
  eyebrow:      'No. 01 · Spring · Fifty/Fifty',
  headline:     'Authentic light from a forgotten era.',
  italicWord:   'forgotten',
  subtext:      'Fifty pieces of precision-reproduced antique oil lamp parts, hand-blown chimneys, and porcelain advertising signs — crafted at a Pune press shop running original dies since 1898, and now available in North America for the first time.',
  ctaPrimary:   { label: 'Enter the Catalog', href: '/catalog' },
  ctaSecondary: { label: 'Read the Story',    href: '/our-story' },
  imageUrl:     '/assets/HeroSampleImage0.webp',
}

const STATS = [
  '50 Pieces · First Release',
  'Bench-Tested · Numbered',
  'Pune → North America',
]

function renderHeadline(headline: string, italicWord: string) {
  if (!italicWord || !headline.includes(italicWord)) return headline
  const parts = headline.split(italicWord)
  return (
    <>
      {parts[0]}
      <em className="italic text-brass-deep">{italicWord}</em>
      {parts[1]}
    </>
  )
}

export default async function HeroSection() {
  const content = (await getContent<HeroContent>('hero')) ?? FALLBACK

  return (
    <section className="relative min-h-[70vh] sm:min-h-[90vh] flex items-center bg-parchment px-4 sm:px-6 py-12 sm:py-20 overflow-hidden">
      <div className="max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* Left — editorial text */}
        <div className="max-w-[56ch] order-2 lg:order-1">
          <Eyebrow className="mb-6">{content.eyebrow}</Eyebrow>

          <h1
            className="font-serif font-medium text-ink-charcoal leading-[0.96] mb-8"
            style={{ fontSize: 'clamp(48px, 8vw, 96px)' }}
          >
            {renderHeadline(content.headline, content.italicWord)}
          </h1>

          <p className="font-sans text-[19px] text-ink-soft leading-relaxed mb-10 max-w-[56ch]">
            {content.subtext}
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <Button variant="primary" href={content.ctaPrimary.href}>
              {content.ctaPrimary.label}
            </Button>
            <Button variant="ghost" href={content.ctaSecondary.href}>
              {content.ctaSecondary.label}
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-0 border-t border-ink-rule pt-6">
            {STATS.map((stat, i) => (
              <span key={stat} className="flex items-center">
                {i > 0 && (
                  <span className="mx-4 text-ink-rule select-none font-mono text-[11px]">|</span>
                )}
                <span className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft">
                  {stat}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Right — parallax image */}
        <HeroParallaxImage
          src={content.imageUrl}
          alt="An authentic, realistic reproduction antique brass oil lamp with a hand-blown glass chimney."
        />

      </div>
    </section>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

---

## Task 3: Update TestimonialsCarousel to accept props + create server wrapper

**Files:**
- Modify: `components/home/TestimonialsCarousel.tsx`
- Create: `components/home/TestimonialsWrapper.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Modify TestimonialsCarousel to accept props**

Replace `components/home/TestimonialsCarousel.tsx` entirely:

```tsx
'use client'

import type { Testimonial } from '@/lib/types/content'

function StarIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="#AA9077" aria-hidden="true">
      <path d="M8 0l2.47 4.93L16 5.73l-4 3.85.95 5.42L8 12.47 3.05 15l.95-5.42-4-3.85 5.53-.8z" />
    </svg>
  )
}

interface Props {
  testimonials: Testimonial[]
}

export default function TestimonialsCarousel({ testimonials }: Props) {
  return (
    <section
      className="relative bg-ink-charcoal py-16 sm:py-24 overflow-hidden"
      style={{ backgroundImage: 'url(/assets/TestimonialImage.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-ink-charcoal/85" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="eyebrow text-brass mb-3 block">
            From the workshop floor
          </span>
          <h2 className="font-serif font-medium text-canvas-heading leading-tight text-fluid-heading">
            What they said when the lamp held.
          </h2>
        </div>

        <div className="marquee-container overflow-hidden mask-[linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <div className="marquee-track flex">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={i}
                className="shrink-0 min-w-87.5 max-w-100 rounded-xl p-6 border border-parchment-3/20 mx-3 bg-white/4"
              >
                <span className="block text-center font-serif text-[48px] leading-none text-canvas-heading/20 mb-2" aria-hidden="true">&ldquo;</span>
                <p className="font-serif italic leading-relaxed text-center text-canvas-heading text-[16px] subpixel-antialiased">
                  {t.quote}
                </p>
                <div className="flex items-center justify-center gap-1 mb-3" aria-label="5 stars">
                  {Array.from({ length: 5 }).map((_, idx) => <StarIcon key={idx} />)}
                </div>
                <p className="font-body text-center">
                  <span className="font-mono text-[9px] uppercase tracking-eyebrow text-canvas-muted">
                    {t.name}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-eyebrow text-brass ml-2">
                    {t.location}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .marquee-track {
          animation: scroll-x 50s linear infinite;
        }
        .marquee-container:hover .marquee-track {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}
```

- [ ] **Step 2: Create TestimonialsWrapper.tsx**

Create `components/home/TestimonialsWrapper.tsx`:

```tsx
import TestimonialsCarousel from '@/components/home/TestimonialsCarousel'
import { getContent } from '@/lib/content'
import type { Testimonial } from '@/lib/types/content'
import fallbackData from '@/data/testimonials.json'

export default async function TestimonialsWrapper() {
  const testimonials =
    (await getContent<Testimonial[]>('testimonials')) ??
    (fallbackData as Testimonial[])

  return <TestimonialsCarousel testimonials={testimonials} />
}
```

- [ ] **Step 3: Update app/page.tsx to use TestimonialsWrapper**

Read `app/page.tsx`. It currently imports `TestimonialsCarousel`. Replace that import with `TestimonialsWrapper`:

```tsx
import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import CategoryGrid from '@/components/home/CategoryGrid'
import PickedOffTheBench from '@/components/home/PickedOffTheBench'
import TestimonialsWrapper from '@/components/home/TestimonialsWrapper'

export const metadata: Metadata = {
  title: 'Oil Lamp Chimneys, Shades & Enamel Signs — Acme Vintage Supply',
  description: 'Buy oil lamp chimneys, shades, pressure lamp glass, and Victorian enamel advertising signs. Bench-tested antique lamp parts shipped across Canada and North America from Dartmouth, Nova Scotia.',
  alternates: { canonical: '/' },
}

export default function Home() {
  return (
    <>
      <HeroSection />
      <CategoryGrid />
      <PickedOffTheBench />
      <TestimonialsWrapper />
    </>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

---

## Task 4: Update PickedOffTheBench to read bench content from Redis

**Files:**
- Modify: `components/home/PickedOffTheBench.tsx`

- [ ] **Step 1: Update PickedOffTheBench.tsx**

Replace `components/home/PickedOffTheBench.tsx` entirely:

```tsx
import Link from 'next/link'
import { getFeaturedProducts } from '@/lib/shopify'
import { mockProducts } from '@/lib/mockData'
import Eyebrow from '@/components/shared/Eyebrow'
import ProductCard from '@/components/catalog/ProductCard'
import { getContent } from '@/lib/content'
import type { BenchContent } from '@/lib/types/content'

const FALLBACK: BenchContent = {
  eyebrow:  'Hand-selected',
  heading:  'Picked off the bench this week.',
  linkText: 'See all 50 →',
  linkHref: '/catalog',
}

export default async function PickedOffTheBench() {
  const [featured, bench] = await Promise.all([
    getFeaturedProducts().catch(() => mockProducts.slice(0, 3)),
    getContent<BenchContent>('bench').then(d => d ?? FALLBACK),
  ])

  return (
    <section className="bg-parchment-2 px-6 py-24 border-t border-ink-rule">
      <div className="max-w-[1280px] mx-auto">

        <div className="flex items-end justify-between mb-10">
          <div>
            <Eyebrow className="mb-3">{bench.eyebrow}</Eyebrow>
            <h2
              className="font-serif font-medium text-ink-charcoal leading-tight"
              style={{ fontSize: 'clamp(24px, 3vw, 42px)' }}
            >
              {bench.heading}
            </h2>
          </div>
          <Link
            href={bench.linkHref}
            className="hidden md:inline-block font-sans text-[14px] text-brass-deep hover:text-brass transition-colors border-b border-brass-deep/40 hover:border-brass pb-px whitespace-nowrap"
          >
            {bench.linkText}
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 sm:gap-x-5 gap-y-6 sm:gap-y-10 lg:gap-10 items-start">
          {featured.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              aspectRatio="4/5"
            />
          ))}
        </div>

        <div className="mt-8 md:hidden text-center">
          <Link
            href={bench.linkHref}
            className="font-sans text-[14px] text-brass-deep border-b border-brass-deep/40 pb-px"
          >
            {bench.linkText}
          </Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

---

## Post-Implementation Verification

1. Visit `http://localhost:3000/admin/content/home` — should show Hero / Bench Section / Testimonials tabs
2. Edit hero eyebrow text → click Save → toast shows "Hero section saved"
3. Visit `http://localhost:3000` — hero eyebrow should show updated text
4. Switch to Testimonials tab → edit a name → Save → reload home page → carousel shows updated name
5. Upload a hero image → confirm preview updates in admin → Save → reload home page → new image shows
6. Bench tab → change heading → Save → reload home page → bench section heading updated
