# Content CMS — Sub-project 1: Infrastructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install Shadcn + Vercel Blob, build the shared content read/write layer on Upstash Redis, create admin-protected API routes, and wire up the Content nav entry in the admin sidebar.

**Architecture:** Text content is stored in Upstash Redis under `content:<key>` keys. Images are uploaded to Vercel Blob and their CDN URLs stored in Redis. A shared `lib/content.ts` helper provides typed read/write functions used by both the admin CMS API routes and the storefront pages. Shadcn is installed fresh for the CMS UI — existing admin pages are unchanged.

**Tech Stack:** Next.js 16 App Router, Upstash Redis (`@upstash/redis` already installed), Vercel Blob (`@vercel/blob`), Shadcn UI (new), Tailwind v4, iron-session (already installed)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `package.json` | Modify | Add @vercel/blob, clsx, tailwind-merge |
| `components.json` | Create | Shadcn configuration |
| `components/ui/` | Create | Shadcn component files |
| `lib/utils.ts` | Modify | Upgrade cn() to clsx + tailwind-merge |
| `lib/types/content.ts` | Create | All 8 content type definitions + ContentKey union |
| `lib/content.ts` | Create | getContent() + setContent() using Upstash Redis |
| `app/api/admin/content/[key]/route.ts` | Create | GET + PUT content block (admin-protected) |
| `app/api/admin/content/upload/route.ts` | Create | POST image to Vercel Blob (admin-protected) |
| `app/admin/layout.tsx` | Modify | Add Sonner <Toaster /> for toast notifications |
| `components/admin/layout/AdminSidebar.tsx` | Modify | Add Content nav entry to NAV_MAIN |
| `components/admin/layout/AdminBottomNav.tsx` | Modify | Add Content to MORE_ITEMS |
| `app/admin/content/home/page.tsx` | Create | Placeholder page (filled in Sub-project 2) |

---

## Task 1: Install npm dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```
cd acme-lamp-sign
npm install @vercel/blob clsx tailwind-merge
```

Expected: packages added to `package.json`, no errors.

- [ ] **Step 2: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

---

## Task 2: Initialize Shadcn

**Files:**
- Create: `components.json`
- Modify: `app/globals.css` (Shadcn adds CSS variables)
- Modify: `lib/utils.ts` (Shadcn upgrades cn())

- [ ] **Step 1: Run Shadcn init**

```
npx shadcn@latest init
```

When prompted, select:
- Style: **Default**
- Base color: **Zinc**
- CSS variables: **Yes**
- Global CSS file: `app/globals.css`
- Tailwind config: (Shadcn auto-detects Tailwind v4, press Enter to accept)
- Components alias: `@/components` (default)
- Utils alias: `@/lib/utils` (default)

- [ ] **Step 2: Verify components.json was created**

Check that `components.json` exists at project root with content similar to:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

- [ ] **Step 3: Verify lib/utils.ts was upgraded**

`lib/utils.ts` should now contain the Shadcn `cn` using clsx + tailwind-merge. If Shadcn overwrote it with only the `cn` function, restore the other exports (`slugify`, `formatPrice`) by adding them back:

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const slugify = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
```

- [ ] **Step 4: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```
git add -A
git commit -m "cms: initialize Shadcn with Tailwind v4"
```

---

## Task 3: Install Shadcn components

**Files:**
- Create: various files under `components/ui/`

- [ ] **Step 1: Install all needed components**

```
npx shadcn@latest add button input label textarea card tabs badge separator alert-dialog sonner
```

Expected: files created under `components/ui/` for each component.

- [ ] **Step 2: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```
git add -A
git commit -m "cms: add Shadcn UI components (button, input, textarea, card, tabs, etc.)"
```

---

## Task 4: Add Sonner Toaster to admin layout

**Files:**
- Modify: `app/admin/layout.tsx`

- [ ] **Step 1: Read current file**

Read `app/admin/layout.tsx` — currently:
```tsx
import AdminThemeProvider from '@/components/admin/layout/AdminThemeProvider'
import AdminShell from '@/components/admin/layout/AdminShell'

export const metadata = {
  title: 'Admin — Acme Vintage Supply',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminShell>{children}</AdminShell>
    </AdminThemeProvider>
  )
}
```

- [ ] **Step 2: Add Toaster**

Replace with:
```tsx
import AdminThemeProvider from '@/components/admin/layout/AdminThemeProvider'
import AdminShell from '@/components/admin/layout/AdminShell'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Admin — Acme Vintage Supply',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminShell>{children}</AdminShell>
      <Toaster position="bottom-right" richColors />
    </AdminThemeProvider>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```
git add app/admin/layout.tsx
git commit -m "cms: add Sonner toaster to admin layout"
```

---

## Task 5: Create content type definitions

**Files:**
- Create: `lib/types/content.ts`

- [ ] **Step 1: Create the file**

```ts
export type ContentKey =
  | 'hero'
  | 'bench'
  | 'testimonials'
  | 'story'
  | 'heritage'
  | 'faq'
  | 'shipping'
  | 'returns'

export interface HeroContent {
  eyebrow:      string
  headline:     string
  italicWord:   string
  subtext:      string
  ctaPrimary:   { label: string; href: string }
  ctaSecondary: { label: string; href: string }
  imageUrl:     string
}

export interface BenchContent {
  eyebrow:  string
  heading:  string
  linkText: string
  linkHref: string
}

export interface Testimonial {
  name:     string
  location: string
  quote:    string
}

export type TestimonialsContent = Testimonial[]

export interface StoryPillar {
  n:     string
  title: string
  body:  string
}

export interface StoryContent {
  headline: string
  intro:    string
  imageUrl: string
  pillars:  StoryPillar[]
}

export type HeritageContent = Array<{
  year:  string
  title: string
  body:  string
}>

export interface FaqQuestion {
  q: string
  a: string
}

export interface FaqCategory {
  category:  string
  questions: FaqQuestion[]
}

export type FaqContent = FaqCategory[]

export interface ShippingRow {
  zone:   string
  method: string
  time:   string
  rate:   string
}

export interface ShippingNote {
  title: string
  body:  string
}

export interface ShippingContent {
  rows:  ShippingRow[]
  notes: ShippingNote[]
}

export interface ReturnsSection {
  title: string
  body:  string
}

export interface ReturnsContent {
  lead:     string
  sections: ReturnsSection[]
}
```

- [ ] **Step 2: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```
git add lib/types/content.ts
git commit -m "cms: add content type definitions"
```

---

## Task 6: Create lib/content.ts

**Files:**
- Create: `lib/content.ts`

- [ ] **Step 1: Create the file**

```ts
import { Redis } from '@upstash/redis'
import type { ContentKey } from '@/lib/types/content'

const redis = Redis.fromEnv()

export async function getContent<T>(key: ContentKey): Promise<T | null> {
  try {
    return await redis.get<T>(`content:${key}`)
  } catch {
    return null
  }
}

export async function setContent(key: ContentKey, value: unknown): Promise<void> {
  await redis.set(`content:${key}`, value)
}
```

- [ ] **Step 2: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```
git add lib/content.ts
git commit -m "cms: add getContent/setContent helpers using Upstash Redis"
```

---

## Task 7: Create content API routes

**Files:**
- Create: `app/api/admin/content/[key]/route.ts`
- Create: `app/api/admin/content/upload/route.ts`

- [ ] **Step 1: Create GET/PUT route**

Create `app/api/admin/content/[key]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getContent, setContent } from '@/lib/content'
import type { ContentKey } from '@/lib/types/content'

const VALID_KEYS: ContentKey[] = [
  'hero', 'bench', 'testimonials', 'story', 'heritage', 'faq', 'shipping', 'returns',
]

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await params
  if (!VALID_KEYS.includes(key as ContentKey)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  const data = await getContent(key as ContentKey)
  return NextResponse.json({ data })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await params
  if (!VALID_KEYS.includes(key as ContentKey)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  await setContent(key as ContentKey, body)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create upload route**

Create `app/api/admin/content/upload/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, and GIF images are allowed' }, { status: 400 })
  }

  const blob = await put(`cms/${Date.now()}-${file.name}`, file, { access: 'public' })
  return NextResponse.json({ url: blob.url })
}
```

- [ ] **Step 3: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```
git add app/api/admin/content/
git commit -m "cms: add content GET/PUT and image upload API routes"
```

---

## Task 8: Update admin nav — sidebar + bottom nav

**Files:**
- Modify: `components/admin/layout/AdminSidebar.tsx`
- Modify: `components/admin/layout/AdminBottomNav.tsx`

- [ ] **Step 1: Update AdminSidebar.tsx**

Add `BiEditAlt` to the imports at the top of `components/admin/layout/AdminSidebar.tsx`:

```ts
import {
  BiHomeAlt,
  BiCart,
  BiPackage,
  BiArchive,
  BiCollection,
  BiUser,
  BiBarChartAlt2,
  BiCog,
  BiLogOut,
  BiSun,
  BiMoon,
  BiEditAlt,  // ← add this
} from 'react-icons/bi'
```

Then in `NAV_MAIN`, add the Content entry between Collections and Customers:

```ts
const NAV_MAIN = [
  { label: 'Overview',    href: '/admin/overview',      icon: BiHomeAlt                                          },
  { label: 'Orders',      href: '/admin/orders',        icon: BiCart,       badge: unfulfilledCount || undefined },
  { label: 'Products',    href: '/admin/products',      icon: BiPackage                                          },
  { label: 'Inventory',   href: '/admin/inventory',     icon: BiArchive                                          },
  { label: 'Collections', href: '/admin/collections',   icon: BiCollection                                       },
  { label: 'Content',     href: '/admin/content/home',  icon: BiEditAlt                                          },
  { label: 'Customers',   href: '/admin/customers',     icon: BiUser                                             },
  { label: 'Analytics',   href: '/admin/analytics',     icon: BiBarChartAlt2                                     },
]
```

- [ ] **Step 2: Update AdminBottomNav.tsx**

Add `BiEditAlt` to imports and add Content to `MORE_ITEMS`:

```ts
import {
  BiHomeAlt,
  BiCart,
  BiPackage,
  BiUser,
  BiDotsHorizontalRounded,
  BiArchive,
  BiCollection,
  BiBarChartAlt2,
  BiCog,
  BiX,
  BiEditAlt,  // ← add this
} from 'react-icons/bi'
```

```ts
const MORE_ITEMS = [
  { label: 'Inventory',   href: '/admin/inventory',    icon: BiArchive      },
  { label: 'Collections', href: '/admin/collections',  icon: BiCollection   },
  { label: 'Content',     href: '/admin/content/home', icon: BiEditAlt      },
  { label: 'Analytics',   href: '/admin/analytics',    icon: BiBarChartAlt2 },
  { label: 'Settings',    href: '/admin/settings',     icon: BiCog          },
]
```

- [ ] **Step 3: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```
git add components/admin/layout/AdminSidebar.tsx components/admin/layout/AdminBottomNav.tsx
git commit -m "cms: add Content entry to admin sidebar and bottom nav"
```

---

## Task 9: Create stub /admin/content/home page

**Files:**
- Create: `app/admin/content/home/page.tsx`

This is a temporary placeholder so the nav link doesn't 404. It will be replaced entirely in Sub-project 2.

- [ ] **Step 1: Create the file**

```tsx
import PageHeader from '@/components/admin/shared/PageHeader'

export default function ContentHomePage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Content"
        subtitle="Edit storefront content — Home page, Testimonials, and more."
      />
      <p className="text-[13px] text-(--admin-text-muted) mt-4">
        Content editing pages are being set up. Check back shortly.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```
git add app/admin/content/
git commit -m "cms: add stub /admin/content/home page"
```

---

## Task 10: Enable Vercel Blob in Vercel dashboard (manual step)

This is a one-time setup in the Vercel dashboard — no code changes.

- [ ] **Step 1: Enable Vercel Blob**

1. Go to your Vercel project dashboard
2. Click **Storage** tab
3. Click **Create Database** → select **Blob**
4. Name it `acme-cms-images` (or any name)
5. Click **Create**
6. Vercel automatically adds `BLOB_READ_WRITE_TOKEN` to your project environment variables

- [ ] **Step 2: Add token to local .env.local**

After creating the Blob store, copy the `BLOB_READ_WRITE_TOKEN` value from Vercel → Settings → Environment Variables and add it to your local `.env.local`:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

- [ ] **Step 3: Verify upload route works locally**

Start the dev server (`npm run dev`), log in to admin, then test the upload endpoint via browser console:

```js
const form = new FormData()
form.append('file', new File(['test'], 'test.txt', { type: 'image/jpeg' }))
fetch('/api/admin/content/upload', { method: 'POST', body: form }).then(r => r.json()).then(console.log)
```

Expected: `{ url: "https://..." }` response (or `{ error: "Only JPEG..." }` since test.txt isn't a real image — that error means the route is working correctly).

---

## Post-Deploy Verification

After deploying to Vercel:

1. Visit `/admin/content/home` — should show the placeholder page
2. Verify **Content** entry appears in the sidebar and mobile bottom nav "More" drawer
3. Test `PUT /api/admin/content/hero` from browser console (while logged in):
   ```js
   fetch('/api/admin/content/hero', {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ test: true })
   }).then(r => r.json()).then(console.log)
   ```
   Expected: `{ ok: true }`
4. Test `GET /api/admin/content/hero`:
   ```js
   fetch('/api/admin/content/hero').then(r => r.json()).then(console.log)
   ```
   Expected: `{ data: { test: true } }`
5. Ready to proceed to Sub-project 2 (Home Page CMS)
