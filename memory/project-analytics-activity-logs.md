---
name: project-analytics-activity-logs
description: "PENDING — Analytics & Activity Logs implementation. Plan written June 20, resume June 23 (Monday). Recall via 'Acme Recap'."
metadata:
  type: project
---

# Project: Analytics & Activity Logs

**Status:** Pending — plan written, implementation starts June 23, 2026 (Monday shift)

**Plan file:** `docs/superpowers/plans/2026-06-20-analytics-activity-logs.md`

**Why:** Scott needs visibility into how customers browse the store (traffic, top products, device breakdown) and an internal audit trail of all admin actions (reviews approved/deleted, content saved, products imported).

## What Was Built (Plan Only — No Code Yet)

### Sub-system 1: Storefront Traffic Analytics
- **Task 1:** Supabase migration — `page_views` table + `admin_activity_log` table (migration file: `docs/supabase/migrations/003_analytics_activity.sql`)
- **Task 2:** Install `@vercel/analytics`, add `<Analytics />` to root layout
- **Task 3:** `POST /api/track/pageview` + `PageViewTracker` client component (fires on route change, skips `/admin/*`, fire-and-forget)
- **Task 4:** `lib/analytics.ts` — `getAnalyticsSummary()`, `getTopProducts()`, `getTopPages()`, `getDeviceBreakdown()`, `getRecentViews()`
- **Task 6:** `/admin/analytics` full dashboard rewrite — summary cards, top products, top pages, device bars, recent visitors

### Sub-system 2: Admin Activity Logs
- **Task 4:** `lib/admin/activityLog.ts` — `logAction()` + `getActivityLog()` with `ActivityEntityType`
- **Task 5:** Hook `logAction()` into reviews PATCH/DELETE, content PUT, products import, bulk-status APIs
- **Task 7:** `/admin/activity` page — filter tabs, timeline with icons, load-more pagination
- **Task 7b:** `GET /api/admin/activity` route (auth-gated)
- **Task 8:** Add "Activity" (`BiHistory` icon) to AdminSidebar NAV_MAIN + AdminBottomNav

## How to Apply

When user says "Acme Recap" at the start of the next session:
1. Surface this memory immediately
2. Open `docs/superpowers/plans/2026-06-20-analytics-activity-logs.md`
3. Start at Task 1 (nothing has been implemented yet — plan only)
4. Execute using subagent-driven development or inline execution per user preference
