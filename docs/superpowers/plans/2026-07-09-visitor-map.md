# Visitor Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Visitor Locations" world map to the admin Storefront Traffic section, showing one bubble per city visitors came from (sized by visit count) over the last 30 days.

**Architecture:** Capture `city`/`lat`/`lng` from Vercel's free edge geo headers (same mechanism already used for `country`) into three new nullable `page_views` columns. Aggregate them server-side into per-city counts. Render with `react-simple-maps` (a small mapping library, this project's second charting dependency after `recharts`) using a locally-bundled topojson world outline — no runtime fetch to any external map service.

**Tech Stack:** Next.js App Router route handlers, `@supabase/supabase-js` (existing `supabaseAdmin` singleton pattern in `lib/analytics.ts`), `react-simple-maps` + `d3-geo` + `world-atlas` (new).

## Global Constraints

- This is an **additive-only** change to `lib/analytics.ts` and `app/api/track/pageview/route.ts` — do not refactor their existing functions or the `supabaseAdmin` import pattern already used there (that file predates the newer lazy-`getSupabase()` convention used elsewhere in this codebase; match the file you're editing, not a different file's convention).
- `city`/`lat`/`lng` are nullable on `page_views` — historical rows and any request without Vercel's edge geo headers (localhost dev) will have `null` here, same as the existing `country` column. Never assume they're present.
- `react-simple-maps@3.0.0`'s peer dependencies cap at React 18.x; this project runs React 19.2.4. Install with `--legacy-peer-deps`. This is an accepted, deliberate override (confirmed via `npm view` before this plan was written) — the library only uses standard React APIs, no removed/legacy features, so this is expected to work despite the stale peer-dep string.
- The world map outline must be **bundled at build time** (`import worldData from 'world-atlas/countries-110m.json'`), never fetched from an external CDN at runtime.
- Bubble radius must scale by `√(count)`, not `count` directly, so bubble *area* (not radius) tracks visit count.
- No automated test suite exists in this project — verification throughout is `npx tsc --noEmit -p tsconfig.json` plus manual checks. **The geo-header capture (Task 2) can only be verified on an actual Vercel deployment** — `x-vercel-ip-*` headers do not exist on localhost. Call this out explicitly at that task rather than trying to fake it locally.
- Colors must use the existing admin CSS variables (`--admin-text`, `--admin-border`, `--admin-surface`, `--admin-surface-2`, `--admin-accent`) so the map matches the rest of the admin UI in light/dark mode, same as every sibling chart in this section.

---

## File Structure

- Create: `docs/supabase/migrations/010_visitor_geo.sql` — adds `city`/`lat`/`lng` columns to `page_views`.
- Modify: `app/api/track/pageview/route.ts` — capture the three new Vercel geo headers.
- Modify: `lib/analytics.ts` — add `getVisitorLocations()`.
- Modify: `app/api/admin/traffic/route.ts` — include `locations` in the traffic API response.
- Modify: `package.json` (via `npm install`) — add `react-simple-maps`, `d3-geo`, `world-atlas` + their `@types` packages.
- Create: `components/admin/analytics/VisitorMap.tsx` — the map component.
- Modify: `components/admin/analytics/TrafficSection.tsx` — render `VisitorMap` below the existing 2-column grid.

---

### Task 1: Migration for `city`/`lat`/`lng` columns

**Files:**
- Create: `docs/supabase/migrations/010_visitor_geo.sql`

**Interfaces:**
- Produces: `page_views` gains nullable columns `city text`, `lat double precision`, `lng double precision`, consumed by Task 2 (writes) and Task 3 (reads).

- [ ] **Step 1: Write the migration file**

```sql
-- 010_visitor_geo.sql
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE page_views
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS lat  double precision,
  ADD COLUMN IF NOT EXISTS lng  double precision;

-- Partial index — only rows with real coordinates are ever queried by the map
CREATE INDEX IF NOT EXISTS page_views_geo_idx
  ON page_views(lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;
```

- [ ] **Step 2: Run the migration**

Open the Supabase Dashboard → SQL Editor → paste the contents of `docs/supabase/migrations/010_visitor_geo.sql` → Run.

Expected: query succeeds. `SELECT city, lat, lng FROM page_views LIMIT 1;` returns the three new columns (values will be `null` for all existing rows — expected, since historical requests never sent geo headers to begin with).

- [ ] **Step 3: Commit**

```bash
git add "docs/supabase/migrations/010_visitor_geo.sql"
git commit -m "Add city/lat/lng columns to page_views for visitor map"
```

---

### Task 2: Capture geo headers in the pageview tracker

**Files:**
- Modify: `app/api/track/pageview/route.ts`

**Interfaces:**
- Consumes: `city`/`lat`/`lng` columns from Task 1.

- [ ] **Step 1: Add a small parsing helper next to the existing `getDevice` helper**

Change:

```ts
function getDevice(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/mobile/i.test(ua)) return 'mobile'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  return 'desktop'
}
```

to:

```ts
function getDevice(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/mobile/i.test(ua)) return 'mobile'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  return 'desktop'
}

function parseGeoFloat(raw: string | null): number | null {
  if (!raw) return null
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : null
}
```

- [ ] **Step 2: Capture and store the new fields**

Change:

```ts
    const ua       = req.headers.get('user-agent') ?? ''
    const referrer = req.headers.get('referer') ?? null
    const country  = req.headers.get('x-vercel-ip-country') ?? null
    const device   = getDevice(ua)

    await supabaseAdmin.from('page_views').insert({
      path,
      product_handle: productHandle ?? null,
      referrer,
      country,
      device,
    })
```

to:

```ts
    const ua       = req.headers.get('user-agent') ?? ''
    const referrer = req.headers.get('referer') ?? null
    const country  = req.headers.get('x-vercel-ip-country')   ?? null
    const city     = req.headers.get('x-vercel-ip-city')      ?? null
    const lat      = parseGeoFloat(req.headers.get('x-vercel-ip-latitude'))
    const lng      = parseGeoFloat(req.headers.get('x-vercel-ip-longitude'))
    const device   = getDevice(ua)

    await supabaseAdmin.from('page_views').insert({
      path,
      product_handle: productHandle ?? null,
      referrer,
      country,
      city,
      lat,
      lng,
      device,
    })
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 4: Verify what can be verified locally**

Start the dev server and trigger a page view (visit any non-`/admin` page). Confirm via Supabase (`SELECT city, lat, lng FROM page_views ORDER BY created_at DESC LIMIT 1;`) that the row was inserted with `city`/`lat`/`lng` as `null` — this is the **expected** local-dev result, since `x-vercel-ip-*` headers only exist on Vercel's edge network. Do not treat `null` values here as a bug. Full verification of real coordinates being captured requires a Vercel deployment (preview or production) — note this in your report as a follow-up the human should check post-deploy, not something you can complete yourself.

- [ ] **Step 5: Commit**

```bash
git add app/api/track/pageview/route.ts
git commit -m "Capture visitor city/lat/lng from Vercel edge geo headers"
```

---

### Task 3: `getVisitorLocations` aggregation

**Files:**
- Modify: `lib/analytics.ts`

**Interfaces:**
- Produces (used by Task 4 and Task 6):
  ```ts
  interface VisitorLocation {
    city: string; country: string | null; lat: number; lng: number; count: number
  }
  function getVisitorLocations(days?: number): Promise<VisitorLocation[]>
  ```

- [ ] **Step 1: Add the function**

At the end of `lib/analytics.ts`, add:

```ts
export interface VisitorLocation {
  city:    string
  country: string | null
  lat:     number
  lng:     number
  count:   number
}

export async function getVisitorLocations(days = 30): Promise<VisitorLocation[]> {
  const { data } = await supabaseAdmin
    .from('page_views')
    .select('city, country, lat, lng')
    .not('city', 'is', null)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .gte('created_at', daysAgo(days))

  const byCity = new Map<string, VisitorLocation>()
  for (const row of data ?? []) {
    const city    = row.city    as string
    const country = row.country as string | null
    const lat     = row.lat     as number
    const lng     = row.lng     as number
    // Key includes country so two different cities with the same name
    // (e.g. "London, UK" vs "London, Ontario") never collide.
    const key = `${city}|${country ?? ''}`
    const existing = byCity.get(key)
    if (existing) {
      existing.count += 1
    } else {
      byCity.set(key, { city, country, lat, lng, count: 1 })
    }
  }

  return Array.from(byCity.values())
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 3: Manually verify the aggregation logic**

Since there's no live geo data yet (Task 2's real headers only populate on Vercel), verify by inserting a couple of test rows directly via Supabase SQL and confirming the function groups correctly:

```sql
INSERT INTO page_views (path, device, city, country, lat, lng) VALUES
  ('/', 'desktop', 'Toronto', 'CA', 43.7, -79.4),
  ('/catalog', 'desktop', 'Toronto', 'CA', 43.7, -79.4),
  ('/', 'mobile', 'Manila', 'PH', 14.6, 121.0);
```

Then call `getVisitorLocations(30)` (e.g. via a temporary `console.log` in a scratch script, or by proceeding to Task 4 and hitting the API route) and confirm it returns exactly 2 entries: Toronto with `count: 2`, Manila with `count: 1`. Clean up the test rows afterward (`DELETE FROM page_views WHERE city IN ('Toronto', 'Manila');`).

- [ ] **Step 4: Commit**

```bash
git add lib/analytics.ts
git commit -m "Add getVisitorLocations aggregation for the visitor map"
```

---

### Task 4: Wire `locations` into the traffic API route

**Files:**
- Modify: `app/api/admin/traffic/route.ts`

**Interfaces:**
- Consumes: `getVisitorLocations` from Task 3.
- Produces (used by Task 7): `GET /api/admin/traffic` response gains a `locations: VisitorLocation[]` field.

- [ ] **Step 1: Add the import and include it in the batch**

Change:

```ts
import {
  getAnalyticsSummary,
  getTopProducts,
  getTopPages,
  getDeviceBreakdown,
  getRecentViews,
} from '@/lib/analytics'

export async function GET() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [summary, topProducts, topPages, devices, recent] = await Promise.all([
    getAnalyticsSummary(),
    getTopProducts(30, 10),
    getTopPages(30, 10),
    getDeviceBreakdown(30),
    getRecentViews(20),
  ])

  return NextResponse.json({ summary, topProducts, topPages, devices, recent })
}
```

to:

```ts
import {
  getAnalyticsSummary,
  getTopProducts,
  getTopPages,
  getDeviceBreakdown,
  getRecentViews,
  getVisitorLocations,
} from '@/lib/analytics'

export async function GET() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [summary, topProducts, topPages, devices, recent, locations] = await Promise.all([
    getAnalyticsSummary(),
    getTopProducts(30, 10),
    getTopPages(30, 10),
    getDeviceBreakdown(30),
    getRecentViews(20),
    getVisitorLocations(30),
  ])

  return NextResponse.json({ summary, topProducts, topPages, devices, recent, locations })
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 3: Verify the response shape**

Start the dev server, log into `/admin`, then:

```bash
curl -s http://localhost:3000/api/admin/traffic -H "Cookie: acme_admin_session=<paste from browser devtools>"
```

Expected: `200` JSON including a `"locations":[]` field (empty is correct — no real geo data exists locally yet, per Task 2).

- [ ] **Step 4: Commit**

```bash
git add "app/api/admin/traffic/route.ts"
git commit -m "Include visitor locations in the traffic API response"
```

---

### Task 5: Install mapping dependencies

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)

**Interfaces:**
- Produces: `react-simple-maps`, `d3-geo`, `world-atlas` available for Task 6 to import.

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install react-simple-maps@^3.0.0 d3-geo@^3.1.1 world-atlas@^2.0.2 --legacy-peer-deps
```

Expected: installs successfully. A peer-dependency warning about `react-simple-maps` wanting React 16-18 is expected and is the accepted override noted in Global Constraints — not a failure.

- [ ] **Step 2: Install type packages**

```bash
npm install -D @types/react-simple-maps@^3.0.6 @types/d3-geo@^3.1.0 --legacy-peer-deps
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors. If `@types/react-simple-maps` produces type errors incompatible with React 19's JSX types (a known category of issue with older community `@types` packages), do not spend more than a few minutes fighting it — add a local override instead: create `types/react-simple-maps.d.ts` with:

```ts
declare module 'react-simple-maps'
```

This tells TypeScript to treat the whole module as untyped (`any`), which unblocks the build without fighting a mismatched community type definition. Only do this if Step 3 actually fails with `react-simple-maps`-related errors — try the official types first.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add react-simple-maps, d3-geo, world-atlas dependencies"
```

(If Step 3 required the `types/react-simple-maps.d.ts` override, include that file in this commit too.)

---

### Task 6: `VisitorMap` component

**Files:**
- Create: `components/admin/analytics/VisitorMap.tsx`

**Interfaces:**
- Consumes: `VisitorLocation` type from `@/lib/analytics` (Task 3), `react-simple-maps`/`world-atlas` from Task 5.
- Produces (used by Task 7): `<VisitorMap locations={VisitorLocation[]} />`.

- [ ] **Step 1: Write the component**

```tsx
// components/admin/analytics/VisitorMap.tsx
'use client'

import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import worldData from 'world-atlas/countries-110m.json'
import type { VisitorLocation } from '@/lib/analytics'

interface Props {
  locations: VisitorLocation[]
}

const MIN_RADIUS = 3
const MAX_RADIUS = 14

function radiusFor(count: number, maxCount: number): number {
  if (maxCount <= 0) return MIN_RADIUS
  const scale = Math.sqrt(count) / Math.sqrt(maxCount)
  return MIN_RADIUS + scale * (MAX_RADIUS - MIN_RADIUS)
}

export default function VisitorMap({ locations }: Props) {
  if (locations.length === 0) {
    return (
      <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-5">
        <p className="text-[13px] font-semibold text-(--admin-text) mb-4">Visitor Locations (30 days)</p>
        <p className="text-[12px] text-(--admin-text-muted)">No location data yet.</p>
      </div>
    )
  }

  const maxCount = Math.max(...locations.map(l => l.count))

  return (
    <div className="bg-(--admin-surface) border border-(--admin-border) rounded-lg p-5">
      <p className="text-[13px] font-semibold text-(--admin-text) mb-4">Visitor Locations (30 days)</p>
      <ComposableMap
        projectionConfig={{ scale: 140 }}
        width={800}
        height={400}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={worldData}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="var(--admin-surface-2)"
                stroke="var(--admin-border)"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover:   { outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>
        {locations.map(loc => (
          <Marker key={`${loc.city}-${loc.lat}-${loc.lng}`} coordinates={[loc.lng, loc.lat]}>
            <circle
              r={radiusFor(loc.count, maxCount)}
              fill="var(--admin-accent)"
              fillOpacity={0.6}
              stroke="var(--admin-accent)"
              strokeWidth={1}
            >
              <title>
                {`${loc.city}${loc.country ? `, ${loc.country}` : ''} — ${loc.count} visit${loc.count !== 1 ? 's' : ''}`}
              </title>
            </circle>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors. If the `geography={worldData}` line fails to type-check because the imported JSON's inferred literal type doesn't match `react-simple-maps`'s expected `Topology` type, cast it explicitly:

```ts
import worldData from 'world-atlas/countries-110m.json'
const worldGeography = worldData as unknown as string
// ...
<Geographies geography={worldGeography}>
```

(`react-simple-maps`'s `geography` prop is typed loosely enough that a cast to its accepted union is a normal, low-risk workaround for a JSON import — this is not a runtime behavior change, only a type-level one.)

- [ ] **Step 3: Manually verify rendering with sample data**

Temporarily render `<VisitorMap locations={[{ city: 'Toronto', country: 'CA', lat: 43.7, lng: -79.4, count: 5 }, { city: 'Manila', country: 'PH', lat: 14.6, lng: 121.0, count: 1 }]} />` in any admin page during dev (e.g. temporarily drop it into `app/admin/analytics/page.tsx`), start the dev server, and confirm in the browser: a world map renders with visible continent outlines, a larger bubble over Toronto and a smaller one over Manila, and hovering each bubble shows a browser tooltip with city/country/count. Remove the temporary test usage before moving to Task 7 (Task 7 wires it in for real).

- [ ] **Step 4: Commit**

```bash
git add components/admin/analytics/VisitorMap.tsx
git commit -m "Add VisitorMap component"
```

---

### Task 7: Wire `VisitorMap` into the Storefront Traffic section

**Files:**
- Modify: `components/admin/analytics/TrafficSection.tsx`

**Interfaces:**
- Consumes: `VisitorMap` from Task 6, `locations` field from the `/api/admin/traffic` response (Task 4).

- [ ] **Step 1: Import `VisitorMap` and extend the `TrafficData` interface**

Change:

```tsx
import { BiMobile, BiDesktop, BiTable, BiTrendingUp, BiTime } from 'react-icons/bi'
import type { AnalyticsSummary, PageViewRow } from '@/lib/analytics'

interface TrafficData {
  summary:     AnalyticsSummary
  topProducts: { handle: string; views: number }[]
  topPages:    { path: string; views: number }[]
  devices:     { mobile: number; tablet: number; desktop: number }
  recent:      PageViewRow[]
}
```

to:

```tsx
import { BiMobile, BiDesktop, BiTable, BiTrendingUp, BiTime } from 'react-icons/bi'
import type { AnalyticsSummary, PageViewRow, VisitorLocation } from '@/lib/analytics'
import VisitorMap from './VisitorMap'

interface TrafficData {
  summary:     AnalyticsSummary
  topProducts: { handle: string; views: number }[]
  topPages:    { path: string; views: number }[]
  devices:     { mobile: number; tablet: number; desktop: number }
  recent:      PageViewRow[]
  locations:   VisitorLocation[]
}
```

- [ ] **Step 2: Destructure `locations` and render the map below the existing grid**

Change:

```tsx
  const { summary, topProducts, topPages, devices, recent } = data
  const totalDevices = devices.mobile + devices.tablet + devices.desktop
```

to:

```tsx
  const { summary, topProducts, topPages, devices, recent, locations } = data
  const totalDevices = devices.mobile + devices.tablet + devices.desktop
```

Then, immediately after the closing `</div>` of the `grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5` block (right before the outer `</div>` that closes the component's return), add:

```tsx
      <VisitorMap locations={locations} />

    </div>
  )
}
```

(replacing whatever currently closes the component, so the final structure is: summary cards → the existing 2-column grid → the new full-width `VisitorMap` → closing tags.)

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 4: Manually verify in the browser**

Start the dev server, log into `/admin`, go to `/admin/analytics`, scroll to "Storefront Traffic". Confirm the new "Visitor Locations (30 days)" map renders below the existing 4-card grid, full width, showing the empty state ("No location data yet.") since there's no real geo data in local dev. This confirms wiring is correct even though the map will stay empty until a real Vercel deployment captures actual visitor coordinates (per Task 2).

- [ ] **Step 5: Commit**

```bash
git add components/admin/analytics/TrafficSection.tsx
git commit -m "Render VisitorMap in the Storefront Traffic section"
```

---

## Self-Review

**Spec coverage:**
- City/lat/lng capture via free Vercel headers → Task 1 (columns) + Task 2 (capture).
- Per-city aggregation, sized by count → Task 3, keyed by `city|country` to avoid same-name-different-country collisions (a gap the original design didn't explicitly call out but is a straightforward correctness requirement of "group by city").
- Bubble radius scales by `√(count)` per Global Constraints → Task 6's `radiusFor`.
- Locally-bundled topojson, no external CDN fetch → Task 6's direct `import worldData from 'world-atlas/countries-110m.json'`.
- Full-width placement below the existing 2-column grid, "(30 days)" labeling convention → Task 7.
- React 19 / react-simple-maps peer-dep mismatch, accepted via `--legacy-peer-deps` → Task 5, called out in Global Constraints.
- Geo headers only exist on Vercel, not localhost → called out at Task 2 Step 4 and Task 7 Step 4 so verification expectations are honest.

**Placeholder scan:** no TBD/TODO markers; every step has complete, runnable code; the two "if this specific type error occurs, do X" branches (Task 5 Step 3, Task 6 Step 2) are contingencies with concrete fallback code, not vague hand-waves.

**Type consistency:** `VisitorLocation` (Task 3) is the exact shape consumed by Task 4's route, Task 6's component props, and Task 7's `TrafficData` interface — field names (`city`, `country`, `lat`, `lng`, `count`) match everywhere.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-09-visitor-map.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
