# Content CMS — Sub-project 3: Story & Heritage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin CMS page for Our Story and Heritage Timeline content, and wire the storefront pages to read from Upstash Redis instead of static JSON files.

**Architecture:** A single `app/admin/content/story/page.tsx` client component with two Shadcn Tabs (Our Story + Heritage Timeline). The Our Story tab exposes headline, intro, image upload, and a pillars CRUD list. The Heritage tab exposes a timeline entries CRUD list. On the storefront, `app/our-story/page.tsx` becomes an async server component reading `content:story` from Redis (falling back to `data/story.json` pillars + hardcoded text). `app/heritage/page.tsx` becomes async, fetches `content:heritage`, and passes entries as a prop to `components/heritage/Timeline.tsx` (which is modified to accept props instead of importing JSON). The admin sidebar active-state check is updated so Content highlights for all `/admin/content/*` pages.

**Tech Stack:** Next.js 16 App Router, Shadcn UI (Card, Tabs, Input, Textarea, Label, Button, AlertDialog, Separator), Upstash Redis via `lib/content.ts`, Vercel Blob via `/api/admin/content/upload` (already wired), framer-motion (existing)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `app/admin/content/story/page.tsx` | Create | Admin CMS page — Our Story + Heritage tabs |
| `components/heritage/Timeline.tsx` | Modify | Accept `entries` prop instead of importing JSON |
| `app/our-story/page.tsx` | Modify | Async server component — reads from Redis |
| `app/heritage/page.tsx` | Modify | Async server component — fetches entries, passes to Timeline |
| `components/admin/layout/AdminSidebar.tsx` | Modify | Fix active state so Content highlights for all `/admin/content/*` pages |

---

## Default content values (reference — used in multiple tasks)

```ts
// Story defaults (headline/intro match current hardcoded our-story/page.tsx)
const STORY_DEFAULTS: StoryContent = {
  headline: 'A family that refused to turn off the light.',
  intro:    'Most companies that made kerosene lamps shut their doors a hundred years ago. This is the story of why.',
  imageUrl: '',
  pillars: [
    { n: '01.', title: 'Craft over convenience.',    body: 'Every burner is hand-fitted. Every shade is mouth-blown. Every sign is triple-fired. If a piece fails the 8-hour bench test, it never leaves the bench. We don\'t ship near-misses.' },
    { n: '02.', title: 'Provenance over inventory.', body: 'We make 50 pieces a season, then we stop, then we make 50 more. There is no warehouse of yellowing surplus, no algorithmic restock. When this crate is empty, it\'s empty.' },
    { n: '03.', title: 'Honesty over marketing.',    body: 'Our invoices are plain paper. Our phone rings to a person. Our returns policy fits in one sentence: if it arrives less than whole, send it back, on us, for thirty days.' },
  ],
}

// Heritage defaults (matches data/heritage.json)
const HERITAGE_DEFAULTS = [
  { year: '1873', title: 'Cattaraugus patent filed',      body: 'Bradley & Hubbard file the center-draft burner patent that anchors our entire fixtures collection.' },
  { year: '1881', title: 'Pittsburgh railroad order',     body: 'First gimbal-mounted caboose lamps roll out of the Pune works for the Indian railway.' },
  { year: '1898', title: 'British Indian Lamp Co. closes', body: 'The dies stay. The Patel family buys the press shop for ₹140 and a promise.' },
  { year: '1934', title: 'Porcelain signage line opens',  body: 'A third firing process is developed for the advertising-sign trade.' },
  { year: '2003', title: 'Australian distribution begins', body: 'The first containers cross the Indian Ocean. The pieces find their first Western collectors through partners in Australia.' },
  { year: '2026', title: 'North American launch',         body: 'Fifty pieces cross into North America for the first time. This is the website you are reading. No catalog will repeat exactly.' },
]
```

---

## Task 1: Fix admin sidebar active state for Content sub-pages

**Files:**
- Modify: `components/admin/layout/AdminSidebar.tsx`

Currently the Content nav item (`href: '/admin/content/home'`) only highlights when the path starts with `/admin/content/home`. It won't highlight for `/admin/content/story`. Fix by adding an optional `activePrefix` field to nav items.

- [ ] **Step 1: Add `activePrefix` field and update Content entry**

In `components/admin/layout/AdminSidebar.tsx`, make these two changes:

Change the `NAV_MAIN` array Content entry from:
```ts
{ label: 'Content', href: '/admin/content/home', icon: BiEditAlt },
```
to:
```ts
{ label: 'Content', href: '/admin/content/home', icon: BiEditAlt, activePrefix: '/admin/content' },
```

Change the `NavItem` active prop in the JSX from:
```tsx
active={pathname === item.href || (item.href !== '/admin/overview' && pathname.startsWith(item.href))}
```
to:
```tsx
active={pathname === item.href || (item.href !== '/admin/overview' && pathname.startsWith(item.activePrefix ?? item.href))}
```

Also update the `NavItem` interface and the `NAV_MAIN` item type to include the optional field. The full updated `NAV_MAIN` array definition:

```ts
const NAV_MAIN: Array<{ label: string; href: string; icon: React.ElementType; badge?: number; activePrefix?: string }> = [
  { label: 'Overview',    href: '/admin/overview',    icon: BiHomeAlt                                          },
  { label: 'Orders',      href: '/admin/orders',      icon: BiCart,        badge: unfulfilledCount || undefined },
  { label: 'Products',    href: '/admin/products',    icon: BiPackage                                          },
  { label: 'Inventory',   href: '/admin/inventory',   icon: BiArchive                                          },
  { label: 'Collections', href: '/admin/collections', icon: BiCollection                                       },
  { label: 'Content',     href: '/admin/content/home', icon: BiEditAlt,    activePrefix: '/admin/content'      },
  { label: 'Customers',   href: '/admin/customers',   icon: BiUser                                             },
  { label: 'Analytics',   href: '/admin/analytics',   icon: BiBarChartAlt2                                     },
]
```

And in the JSX map:
```tsx
{NAV_MAIN.map(item => (
  <NavItem
    key={item.href}
    {...item}
    active={pathname === item.href || (item.href !== '/admin/overview' && pathname.startsWith(item.activePrefix ?? item.href))}
  />
))}
```

- [ ] **Step 2: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

---

## Task 2: Build /admin/content/story page

**Files:**
- Create: `app/admin/content/story/page.tsx`

- [ ] **Step 1: Create the full admin story CMS page**

Create `app/admin/content/story/page.tsx`:

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
import type { StoryContent, StoryPillar, HeritageContent } from '@/lib/types/content'

// ── Defaults ──────────────────────────────────────────────────────────────────
const STORY_DEFAULTS: StoryContent = {
  headline: 'A family that refused to turn off the light.',
  intro:    'Most companies that made kerosene lamps shut their doors a hundred years ago. This is the story of why.',
  imageUrl: '',
  pillars: [
    { n: '01.', title: 'Craft over convenience.',    body: "Every burner is hand-fitted. Every shade is mouth-blown. Every sign is triple-fired. If a piece fails the 8-hour bench test, it never leaves the bench. We don't ship near-misses." },
    { n: '02.', title: 'Provenance over inventory.', body: "We make 50 pieces a season, then we stop, then we make 50 more. There is no warehouse of yellowing surplus, no algorithmic restock. When this crate is empty, it's empty." },
    { n: '03.', title: 'Honesty over marketing.',    body: "Our invoices are plain paper. Our phone rings to a person. Our returns policy fits in one sentence: if it arrives less than whole, send it back, on us, for thirty days." },
  ],
}

const HERITAGE_DEFAULTS: HeritageContent = [
  { year: '1873', title: 'Cattaraugus patent filed',       body: 'Bradley & Hubbard file the center-draft burner patent that anchors our entire fixtures collection.' },
  { year: '1881', title: 'Pittsburgh railroad order',      body: 'First gimbal-mounted caboose lamps roll out of the Pune works for the Indian railway.' },
  { year: '1898', title: 'British Indian Lamp Co. closes', body: 'The dies stay. The Patel family buys the press shop for ₹140 and a promise.' },
  { year: '1934', title: 'Porcelain signage line opens',   body: 'A third firing process is developed for the advertising-sign trade.' },
  { year: '2003', title: 'Australian distribution begins', body: 'The first containers cross the Indian Ocean. The pieces find their first Western collectors through partners in Australia.' },
  { year: '2026', title: 'North American launch',          body: 'Fifty pieces cross into North America for the first time. This is the website you are reading. No catalog will repeat exactly.' },
]

// ── Shared helpers ────────────────────────────────────────────────────────────
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

// ── Our Story Tab ─────────────────────────────────────────────────────────────
function StoryTab() {
  const [form,      setForm]      = useState<StoryContent>(STORY_DEFAULTS)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/content/story')
      .then(r => r.json())
      .then(({ data }) => { if (data) setForm(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function set(field: keyof StoryContent, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function updatePillar(idx: number, field: keyof StoryPillar, value: string) {
    setForm(prev => ({
      ...prev,
      pillars: prev.pillars.map((p, i) => i === idx ? { ...p, [field]: value } : p),
    }))
  }

  function addPillar() {
    const next = (form.pillars.length + 1).toString().padStart(2, '0') + '.'
    setForm(prev => ({
      ...prev,
      pillars: [...prev.pillars, { n: next, title: '', body: '' }],
    }))
  }

  function removePillar(idx: number) {
    setForm(prev => ({ ...prev, pillars: prev.pillars.filter((_, i) => i !== idx) }))
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
    const ok = await saveContent('story', form)
    ok ? toast.success('Our Story saved') : toast.error('Failed to save')
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading…</p>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold">Page headline &amp; intro</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Headline</Label>
            <Input value={form.headline} onChange={e => set('headline', e.target.value)} placeholder="A family that refused to turn off the light." />
          </div>
          <div className="space-y-1.5">
            <Label>Intro paragraph</Label>
            <Textarea rows={3} value={form.intro} onChange={e => set('intro', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold">Story image</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.imageUrl && (
            <img src={form.imageUrl} alt="Story" className="w-40 h-40 object-cover rounded-md border" />
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? 'Uploading…' : form.imageUrl ? 'Replace image' : 'Upload image'}
          </Button>
          <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP. Displays in the hero plate on the Our Story page.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm font-semibold">Pillars — "Three things we believe"</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.pillars.map((p, idx) => (
            <div key={idx} className="space-y-3 p-4 border rounded-md">
              <div className="grid grid-cols-[80px_1fr] gap-3">
                <div className="space-y-1.5">
                  <Label>Number</Label>
                  <Input value={p.n} onChange={e => updatePillar(idx, 'n', e.target.value)} placeholder="01." />
                </div>
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={p.title} onChange={e => updatePillar(idx, 'title', e.target.value)} placeholder="Craft over convenience." />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Body</Label>
                <Textarea rows={3} value={p.body} onChange={e => updatePillar(idx, 'body', e.target.value)} />
              </div>
              <Separator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">Remove pillar</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove pillar?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove "{p.title || 'this pillar'}" from the Our Story page. Save to apply.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removePillar(idx)}>Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          <Button variant="outline" onClick={addPillar} className="w-full">+ Add pillar</Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Our Story'}
      </Button>
    </div>
  )
}

// ── Heritage Timeline Tab ─────────────────────────────────────────────────────
function HeritageTab() {
  const [entries, setEntries] = useState<HeritageContent>(HERITAGE_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    fetch('/api/admin/content/heritage')
      .then(r => r.json())
      .then(({ data }) => { if (data) setEntries(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function update(idx: number, field: 'year' | 'title' | 'body', value: string) {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }

  function add() {
    setEntries(prev => [...prev, { year: '', title: '', body: '' }])
  }

  function remove(idx: number) {
    setEntries(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    setSaving(true)
    const ok = await saveContent('heritage', entries)
    ok ? toast.success('Heritage timeline saved') : toast.error('Failed to save')
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading…</p>

  return (
    <div className="space-y-4">
      {entries.map((e, idx) => (
        <Card key={idx}>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-[100px_1fr] gap-3">
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Input value={e.year} onChange={ev => update(idx, 'year', ev.target.value)} placeholder="1898" />
              </div>
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={e.title} onChange={ev => update(idx, 'title', ev.target.value)} placeholder="Event title" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Body</Label>
              <Textarea rows={3} value={e.body} onChange={ev => update(idx, 'body', ev.target.value)} placeholder="What happened…" />
            </div>
            <Separator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">Remove</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove timeline entry?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the {e.year || 'selected'} entry. Save to apply.
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

      <Button variant="outline" onClick={add} className="w-full">+ Add timeline entry</Button>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save heritage timeline'}
      </Button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ContentStoryPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-[18px] font-semibold text-(--admin-text)">Story &amp; Heritage Content</h1>
        <p className="text-[13px] text-(--admin-text-muted) mt-1">Changes go live immediately after saving.</p>
      </div>

      <Tabs defaultValue="story">
        <TabsList className="mb-6">
          <TabsTrigger value="story">Our Story</TabsTrigger>
          <TabsTrigger value="heritage">Heritage Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="story">
          <StoryTab />
        </TabsContent>
        <TabsContent value="heritage">
          <HeritageTab />
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

## Task 3: Update Timeline component to accept entries as props

**Files:**
- Modify: `components/heritage/Timeline.tsx`

Currently imports `entries` directly from `@/data/heritage.json`. Change it to accept an `entries` prop.

- [ ] **Step 1: Replace Timeline.tsx**

Replace `components/heritage/Timeline.tsx` entirely:

```tsx
import Eyebrow from '@/components/shared/Eyebrow'

interface Entry {
  year:  string
  title: string
  body:  string
}

interface Props {
  entries: Entry[]
}

export default function Timeline({ entries }: Props) {
  return (
    <section className="bg-parchment px-6 py-24">
      <div className="max-w-215 mx-auto">

        <Eyebrow className="mb-4">A working timeline</Eyebrow>
        <h2
          className="font-serif font-medium text-ink-charcoal leading-tight mb-16"
          style={{ fontSize: 'clamp(24px, 3vw, 42px)' }}
        >
          One hundred and fifty years, one method.
        </h2>

        <div className="relative">
          {/* Vertical rule */}
          <div
            className="absolute left-27 top-3 bottom-3 w-px bg-ink-rule hidden sm:block"
            aria-hidden="true"
          />

          <ol className="space-y-12">
            {entries.map(({ year, title, body }, i) => (
              <li key={year} className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start">

                {/* Year */}
                <div className="sm:w-24 shrink-0 flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
                  <span className="font-serif text-[28px] sm:text-[32px] text-brass-deep leading-none tabular-nums">
                    {year}
                  </span>
                </div>

                {/* Dot + content */}
                <div className="flex gap-5 items-start w-full">
                  {/* Dot */}
                  <div className="relative hidden sm:flex shrink-0 w-6 items-center justify-center mt-2">
                    <div className={`w-2 h-2 rounded-full border-2 ${i === entries.length - 1 ? 'bg-brass-deep border-brass-deep' : 'bg-parchment border-ink-iron'}`} />
                  </div>

                  <div className="flex-1 pt-0.5">
                    <h3 className="font-serif text-[18px] text-ink-charcoal font-medium mb-1 leading-snug">
                      {title}
                    </h3>
                    <p className="font-sans text-[14px] text-ink-soft leading-relaxed">{body}</p>
                  </div>
                </div>

              </li>
            ))}
          </ol>
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

## Task 4: Wire Our Story page to Redis

**Files:**
- Modify: `app/our-story/page.tsx`

Currently imports `storyData` from `@/data/story.json` (pillars only) and hardcodes the headline, intro, and image. Convert to an async server component that reads `content:story` from Redis. Falls back to hardcoded defaults when Redis has no data.

The mission statement section, testimonial quote, and CTA section remain hardcoded — they are editorial copy and not exposed to the CMS.

- [ ] **Step 1: Replace our-story/page.tsx**

Replace `app/our-story/page.tsx` entirely:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import PlateImage from '@/components/shared/PlateImage'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'
import { getContent } from '@/lib/content'
import type { StoryContent } from '@/lib/types/content'
import storyData from '@/data/story.json'

export const metadata: Metadata = {
  title: 'Our Story — Antique Oil Lamp Specialists Since 1898',
  description: 'Acme Vintage Supply sources authentic Victorian oil lamp parts and original enamel advertising signs from Dartmouth, Nova Scotia. Bench-tested and shipped across North America.',
  alternates: { canonical: '/our-story' },
}

const FALLBACK: StoryContent = {
  headline: 'A family that refused to turn off the light.',
  intro:    'Most companies that made kerosene lamps shut their doors a hundred years ago. This is the story of why.',
  imageUrl: '',
  pillars:  storyData.pillars,
}

export default async function OurStoryPage() {
  const story = (await getContent<StoryContent>('story')) ?? FALLBACK

  return (
    <div className="bg-parchment min-h-screen">

      {/* Hero */}
      <section className="px-6 pt-20 pb-24">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* Left text */}
          <div>
            <Eyebrow className="mb-5">Our story</Eyebrow>
            <h1
              className="font-serif font-medium text-ink-charcoal leading-[0.96] mb-7"
              style={{ fontSize: 'clamp(36px, 5vw, 72px)' }}
            >
              {story.headline}
            </h1>
            <p className="font-sans text-[18px] text-ink-soft leading-relaxed max-w-[52ch]">
              {story.intro}
            </p>
          </div>

          {/* Right plate */}
          <div className="relative">
            <PlateImage
              src={story.imageUrl || undefined}
              alt="Workshop exterior, Pune press shop"
              aspectRatio="4/5"
              dark={false}
              label="EST. 1898 / PUNE · NOW IN NORTH AMERICA"
              priority
              className="rounded-sm"
            />
          </div>

        </div>
      </section>

      {/* Mission statement */}
      <section className="border-t border-ink-rule px-6 py-24 bg-parchment-2">
        <div className="max-w-[900px] mx-auto text-center">
          <Eyebrow className="mb-5">Our mission, in plain words</Eyebrow>
          <blockquote
            className="font-serif font-medium text-ink-charcoal leading-tight mb-10"
            style={{ fontSize: 'clamp(22px, 2.8vw, 36px)' }}
          >
            "We make lamps the way they were made when lamps mattered — by hand, on the same dies,
            with no pretense that we've improved on the originals."
          </blockquote>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-[720px] mx-auto">
            <p className="font-sans text-[16px] text-ink-soft leading-relaxed">
              The Patel family has operated the same press shop in Pune since 1898. The dies have not been
              recut. The alloy specification has not changed. The eight-hour burn test has never been
              reduced to four.
            </p>
            <p className="font-sans text-[16px] text-ink-soft leading-relaxed">
              These pieces have been distributed through our partners in Australia for over two decades.
              Now, for the first time, they are available here — in North America. The workshop in Pune
              stays exactly where it was. It always will.
            </p>
          </div>
        </div>
      </section>

      {/* Three pillars */}
      <section className="px-6 py-24 border-t border-ink-rule">
        <div className="max-w-[1280px] mx-auto">
          <Eyebrow className="mb-4">Three things we believe</Eyebrow>
          <h2
            className="font-serif font-medium text-ink-charcoal leading-tight mb-14"
            style={{ fontSize: 'clamp(24px, 3vw, 42px)' }}
          >
            What we'll do for you, and what we won't.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {story.pillars.map(({ n, title, body }) => (
              <div key={n} className="border-t-2 border-brass-deep pt-6">
                <span className="font-mono text-[11px] text-brass-deep tracking-eyebrow block mb-3">{n}</span>
                <h3 className="font-serif text-[20px] text-ink-charcoal font-medium mb-3 leading-snug">
                  {title}
                </h3>
                <p className="font-sans text-[15px] text-ink-soft leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark testimonial */}
      <section className="canvas-dark px-6 py-24">
        <div className="max-w-[760px] mx-auto">
          <span className="font-serif text-[72px] text-brass leading-none block mb-4" aria-hidden="true">"</span>
          <blockquote className="font-serif italic text-[22px] text-canvas-body leading-relaxed mb-8">
            My grandfather bought the press shop for a hundred and forty rupees and a promise.
            The promise was that we would still be running the same dies in a hundred years.
            We are. The next hundred is paid for.
          </blockquote>
          <footer className="font-mono text-[11px] uppercase tracking-eyebrow text-canvas-dim">
            R.K. Patel &nbsp;/&nbsp; Third-generation press operator · Pune, India
          </footer>
        </div>
      </section>

      {/* Read on */}
      <section className="px-6 py-20 border-t border-ink-rule">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <Eyebrow className="mb-3">More of the workshop</Eyebrow>
            <h2
              className="font-serif font-medium text-ink-charcoal"
              style={{ fontSize: 'clamp(22px, 2.5vw, 36px)' }}
            >
              Walk the full history.
            </h2>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button href="/heritage" variant="primary">The full heritage timeline →</Button>
            <Button href="/catalog" variant="ghost">Walk the catalog</Button>
          </div>
        </div>
      </section>

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

## Task 5: Wire Heritage page to Redis

**Files:**
- Modify: `app/heritage/page.tsx`

Currently delegates to `<Timeline />` which imports JSON directly. After Task 3 changed `Timeline` to accept a prop, this page must fetch the entries from Redis and pass them down.

- [ ] **Step 1: Replace heritage/page.tsx**

Replace `app/heritage/page.tsx` entirely:

```tsx
import type { Metadata } from 'next'
import HeritageHero from '@/components/heritage/HeritageHero'
import WorkshopSection from '@/components/heritage/WorkshopSection'
import Timeline from '@/components/heritage/Timeline'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'
import { getContent } from '@/lib/content'
import type { HeritageContent } from '@/lib/types/content'
import fallbackData from '@/data/heritage.json'

export const metadata: Metadata = {
  title: 'Heritage Timeline — Acme Vintage Supply',
  description: 'One hundred and fifty years of oil lamp craftsmanship — from the 1873 Bradley & Hubbard patent to the 2026 North American launch.',
  alternates: { canonical: '/heritage' },
}

export default async function HeritagePage() {
  const entries =
    (await getContent<HeritageContent>('heritage')) ??
    (fallbackData as HeritageContent)

  return (
    <div className="min-h-screen">

      <HeritageHero />

      <WorkshopSection />

      <Timeline entries={entries} />

      {/* CTA */}
      <section className="bg-parchment-2 border-t border-ink-rule px-6 py-24">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <Eyebrow className="mb-3">Begin where the light is</Eyebrow>
            <h2
              className="font-serif font-medium text-ink-charcoal leading-tight"
              style={{ fontSize: 'clamp(24px, 3vw, 42px)' }}
            >
              Walk the catalog. Light the parlor.
            </h2>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button href="/catalog" variant="primary">Enter the Catalog</Button>
            <Button href="/" variant="ghost">Back to storefront</Button>
          </div>
        </div>
      </section>

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

## Post-Implementation Verification

1. Visit `/admin/content/story` — should show Our Story / Heritage Timeline tabs; Content item in sidebar should be highlighted
2. Edit Our Story headline → Save → toast shows "Our Story saved" → visit `/our-story` → headline reflects the change
3. Upload a story image → Save → visit `/our-story` → image appears in the hero plate
4. Add a pillar → Save → visit `/our-story` → new pillar card appears
5. Switch to Heritage tab → edit a year or title → Save → visit `/heritage` → timeline reflects the change
6. Add a timeline entry → Save → visit `/heritage` → new entry appears at bottom of timeline
7. Refresh `/admin/content/story` → all saved changes persist (not reverting to defaults)
