---
name: project-cms-subproject-2
description: "Home Page CMS Sub-project 2 — completion status and what's next"
metadata: 
  node_type: memory
  type: project
  originSessionId: 47801d3a-7f3d-4383-a13f-2bd99b2d7262
---

Sub-project 2: Home Page CMS is **fully complete** as of June 12, 2026.

**Why:** Part of the phased CMS build so Scott can edit storefront content without code changes or redeployments.

**What was built:**
- `components/home/HeroParallaxImage.tsx` — extracted client component (parallax only)
- `components/home/HeroSection.tsx` — rewritten as async server component, reads from Redis
- `components/home/TestimonialsCarousel.tsx` — now accepts `testimonials` prop
- `components/home/TestimonialsWrapper.tsx` — server component, fetches from Redis, falls back to `data/testimonials.json`
- `components/home/PickedOffTheBench.tsx` — reads bench content from Redis
- `app/page.tsx` — uses `TestimonialsWrapper` instead of `TestimonialsCarousel`
- `next.config.ts` — added `*.public.blob.vercel-storage.com` to `images.remotePatterns`

**Infrastructure fixes made during testing:**
- Upstash Redis: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` added to Vercel env vars (were missing)
- Vercel Blob: `BLOB_READ_WRITE_TOKEN` added to Vercel env vars (was missing — caused image uploads to fail silently)
- New Upstash Redis database created: `acme-cms`, N. Virginia us-east-1, free tier

**⚠️ Security reminder (not yet done):** Both the Upstash Redis token and Vercel Blob token were shared in chat. User should rotate both before go-live.

**How to apply:** Next session resume with Sub-project 3: Story & Heritage CMS (`/admin/content/story` — Our Story + Heritage Timeline tabs + storefront wiring).
