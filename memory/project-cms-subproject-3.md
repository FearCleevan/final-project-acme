---
name: project-cms-subproject-3
description: "CMS Sub-project 3: Story & Heritage admin editor — status, files changed, what was built"
metadata: 
  node_type: memory
  type: project
  originSessionId: bdcf8adf-14ea-4194-b64d-64bf7ad5ab79
---

✅ COMPLETE (June 16).

**What was built:**
- `app/admin/content/story/page.tsx` — full admin editor with two tabs:
  - **Our Story tab**: headline, intro paragraph, image upload, and up to N pillars (number, title, body) with add/remove/reorder
  - **Heritage Timeline tab**: CRUD for year/title/body entries (add, edit, delete)
- `app/admin/content/layout.tsx` — content section sub-nav (tabs: Home Page / Story & Heritage / Footer Pages) that appears on all three `/admin/content/*` pages

**Where content is stored:** Redis via `setContent('story', …)` and `setContent('heritage', …)`. Storefront reads Redis first, falls back to `data/story.json` and `data/heritage.json`.

**Storefront wiring (already existed):**
- `app/our-story/page.tsx` — reads `getContent('story')` and renders `story.pillars`
- `app/heritage/page.tsx` — reads `getContent('heritage')` and passes entries to `<Timeline>`

**Defaults updated:** Both `STORY_DEFAULTS` and `HERITAGE_DEFAULTS` in the admin page were updated to match the real OLC (Oil Lamp Company, Melbourne) backstory from Alison — removing all placeholder Pune/Patel/Bradley & Hubbard fabricated content.

**Why:** Scott is not technical, so all content editing goes through the admin CMS. Alison's feedback (June 16) surfaced that the Our Story and Heritage pages had fabricated placeholder content which needed replacing with real backstory.
