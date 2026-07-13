import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { getRequestGeo } from '@/lib/geo'

function getDevice(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/mobile/i.test(ua)) return 'mobile'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  return 'desktop'
}

// Known crawler/bot signatures — skips the write entirely rather than
// polluting analytics with non-visitor traffic. Not exhaustive (no
// signature list can be), but covers the common, well-behaved crawlers
// that self-identify in their user-agent, including JS-executing ones
// like Googlebot that would otherwise pass right through PageViewTracker.
const BOT_UA_RE = /bot|crawl|spider|slurp|facebookexternalhit|bingpreview|whatsapp|telegrambot|discordbot|pingdom|uptimerobot|headlesschrome/i

function isBot(ua: string): boolean {
  return BOT_UA_RE.test(ua)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body.path !== 'string') {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const { path, productHandle } = body as { path: string; productHandle?: string }

    if (path.startsWith('/admin')) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const ua = req.headers.get('user-agent') ?? ''

    // Skip the write entirely for known bots — cheaper than inserting and
    // filtering later, and keeps analytics free of non-visitor traffic.
    if (isBot(ua)) {
      return NextResponse.json({ ok: true, skipped: 'bot' }, { status: 202 })
    }

    const referrer = req.headers.get('referer') ?? null
    const { country, city, lat, lng } = getRequestGeo(req)
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
      user_agent: ua || null,
    })

    return NextResponse.json({ ok: true }, { status: 202 })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
