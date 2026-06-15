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
  headline: 'A craft that has not changed its method in over a century.',
  intro:    'Most companies that made kerosene lamps shut their doors a hundred years ago. The Oil Lamp Company in Melbourne kept going — on the original tooling.',
  imageUrl: '',
  pillars: [
    { n: '01.', title: 'Original tooling, not imitations.',      body: 'Our Duplex burners are pressed on the original Birmingham tooling — over a hundred years old and still in production. The dies have never been recut.' },
    { n: '02.', title: 'Old world materials, period correct.',    body: 'Shades, chimneys, and fonts are produced in borosilicate glass to the original period specification. No modern substitute materials.' },
    { n: '03.', title: 'Honesty over marketing.',                 body: "Our invoices are plain paper. Our phone rings to a person. Our returns policy fits in one sentence: if it arrives less than whole, send it back, on us, for thirty days." },
  ],
}

const HERITAGE_DEFAULTS: HeritageContent = [
  { year: 'c. 1870s', title: 'Victorian golden age of oil lamps',        body: 'The duplex burner becomes the standard for domestic lighting across Britain and its colonies. Birmingham becomes the centre of lamp manufacturing.' },
  { year: 'c. 1880s', title: 'Birmingham tooling forged',                body: 'The presses, dies, and moulds used to produce Duplex burners are manufactured in Birmingham. These are the same tools still in use today.' },
  { year: 'c. 1920s', title: 'Collecting becomes obsession',             body: 'As electric light displaces oil, antique lamp components become collector items. The original tooling is preserved rather than scrapped.' },
  { year: 'c. 2000', title: 'Original Birmingham tooling acquired',      body: 'The Oil Lamp Company is offered the original Birmingham presses and dies — over a century old. They say yes, ship them to Melbourne, and begin production again.' },
  { year: 'c. 2000s', title: 'Duplex Burner made again in Melbourne',   body: 'Running on the original tooling, the Melbourne workshop begins producing Duplex burners to the original specification. Supply goes to Australian collectors.' },
  { year: 'Ongoing', title: 'India: shades, fonts, glassware',          body: 'Shades, chimneys, fonts, and glassware are manufactured in India using moulds owned outright by the Oil Lamp Company. Over two decades of uninterrupted supply.' },
  { year: '2026',    title: 'North American launch',                     body: 'For the first time, the same catalog that has supplied Australian collectors for over two decades is available in North America through Acme Vintage Supply.' },
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
                <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                  Remove pillar
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
              <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                Remove
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
    <div className="max-w-3xl">
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
