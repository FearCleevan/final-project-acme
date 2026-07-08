# Visitor Map (Storefront Traffic) — Design

**Date:** 2026-07-09
**Status:** Approved, pending implementation plan

## Problem

The admin Analytics page's "Storefront Traffic" section (`components/admin/analytics/TrafficSection.tsx`)
already tracks a `country` code per page view (via Vercel's `x-vercel-ip-country` edge header), but
nothing visualizes it. There's no way to see, at a glance, where in the world visitors are actually
coming from — the kind of view Google Analytics' "Active users by Country" panel provides.

## Scope

- Add a new "Visitor Locations" panel to the existing Storefront Traffic section showing a world map
  with a bubble/dot per city visitors have come from, sized by visit count, over the last 30 days.
- Out of scope (deferred, discussed but not part of this round): Recent Visitors timestamp/readability
  polish, human-readable product/page titles, and session-grouping of consecutive pageviews.

## Data flow

1. **Migration** adds three nullable columns to `page_views`: `city text`, `lat double precision`,
   `lng double precision`. Nullable because historical rows and any request without Vercel's edge
   geo headers (e.g. localhost dev) won't have them — same limitation the existing `country` column
   already has.
2. **`app/api/track/pageview/route.ts`** reads three additional Vercel edge headers — already available
   at zero cost, the same mechanism already used for `x-vercel-ip-country` — and stores them alongside
   the existing fields:
   - `x-vercel-ip-city` → `city`
   - `x-vercel-ip-latitude` → `lat` (parsed as float, null if missing/unparseable)
   - `x-vercel-ip-longitude` → `lng` (parsed as float, null if missing/unparseable)
3. **`lib/analytics.ts`** gets a new function:
   ```ts
   export async function getVisitorLocations(days = 30): Promise<
     { city: string; country: string | null; lat: number; lng: number; count: number }[]
   >
   ```
   Queries `page_views` where `lat`/`lng` are not null within the given range, groups by city (using
   the first-seen lat/lng per city as the marker position — Vercel's IP geolocation returns one
   representative point per city, not exact addresses, so all visits from the same city share
   coordinates), and returns one row per city with a `count` of visits. Follows this file's existing
   non-throwing convention (defaults to `[]` on query failure — no try/catch, matches
   `getTopProducts`/`getTopPages`/etc.).
4. **`app/api/admin/traffic/route.ts`** adds `getVisitorLocations(30)` to its existing `Promise.all`
   batch and includes the result in the response as `locations` — same pattern as
   `topProducts`/`topPages`/`devices`/`recent` today.

## Component & rendering

New `components/admin/analytics/VisitorMap.tsx`, client component, using `react-simple-maps` +
`d3-geo` (new dependencies — this project already has one charting library, `recharts`, so this is a
second small dependency scoped to one feature, not a new category of dependency for the codebase).

- World outline rendered via a **locally-bundled** topojson file (checked into the repo, e.g. under
  `public/` or `data/`) — not a runtime fetch to an external CDN, so the map doesn't add a network
  dependency or fail if a third-party host is down.
- One circle `<Marker>` per city from `locations`, positioned at `[lng, lat]`.
- Circle radius scaled by `√(count)`, not `count` directly, so bubble *area* (not radius) tracks visit
  count — the standard bubble-map convention, since radius-scaling visually exaggerates differences.
  Clamped to a sensible min/max radius so a single-visit city is still visible and a large cluster
  doesn't swallow the map.
- Hover shows city, country, and visit count — matching the existing tooltip style used by
  `DonutChart`/`HorizontalBarChart` (`var(--admin-surface)` background, `var(--admin-border)` border,
  11px text, matching border-radius).
- Colors/theme follow the existing admin CSS variables (`--admin-text`, `--admin-border`,
  `--admin-surface`, `--admin-accent`) so it matches the rest of the admin UI in both light/dark mode,
  same as every other chart in this section.

## Placement

Added inside `TrafficSection.tsx`, as a new full-width block **below** the existing
`grid grid-cols-1 lg:grid-cols-2` (Top Products / Top Pages / Visitors by Device / Recent Visitors),
titled "Visitor Locations (30 days)" — matching the section's existing "(30 days)" labeling
convention used by Top Products and Top Pages.

## Edge cases

- No geo data yet (brand-new feature, no historical `lat`/`lng`) → same empty-state message pattern
  already used by sibling panels ("No location data yet." matching "No product views yet."/
  "No visitors yet." phrasing).
- Dev/localhost requests → no Vercel geo headers → `lat`/`lng` stay `null` → naturally excluded from
  `getVisitorLocations`'s query, no special-casing needed in the map component.
- Supabase query failure → `getVisitorLocations` returns `[]`, `VisitorMap` renders its empty state,
  consistent with how the rest of this section already degrades.

## Testing

No automated test suite exists in this project (confirmed project-wide convention) — verification is
manual, and **must happen on an actual Vercel deployment** (preview or production), since the geo
headers this entire feature depends on do not exist on localhost. This is called out explicitly so
implementation doesn't waste time trying to verify geolocation behavior in local dev.

## Out of scope (this round)

- Recent Visitors timestamp granularity / readable titles / session grouping (discussed, deferred).
- Any date-range selector for the map (fixed at 30 days, matching the rest of the section).
- Historical backfill of `city`/`lat`/`lng` for existing `page_views` rows (not possible — the
  originating request's geo headers are gone; only new page views going forward will have coordinates).
