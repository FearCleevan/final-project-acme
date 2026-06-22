import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

function getDevice(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/mobile/i.test(ua)) return 'mobile'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  return 'desktop'
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

    return NextResponse.json({ ok: true }, { status: 202 })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
