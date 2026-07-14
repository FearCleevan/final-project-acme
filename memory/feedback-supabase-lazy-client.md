---
name: feedback-supabase-lazy-client
description: Never create Supabase client at module level in Next.js API routes — use a lazy getter function to avoid Vercel build failures
metadata:
  type: feedback
---

Never write `const supabase = createClient(...)` at the top of an API route file.

**Why:** Vercel evaluates module-level code during the build-time "page data collection" phase. At that point, environment variables like `NEXT_PUBLIC_SUPABASE_URL` are not available. `createClient()` throws `Error: supabaseUrl is required`, which fails the entire build.

**How to apply:** Always wrap the Supabase client in a lazy getter function:

```ts
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

Then call `getSupabase().from(...)` inside handler functions. The function is only called at request time, after env vars are injected.

This applies to ALL Next.js API routes — both admin and public. [[daily-log-2026-06-25]]
