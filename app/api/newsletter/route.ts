import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !EMAIL_RE.test(String(email))) {
      return NextResponse.json({ success: false }, { status: 400 })
    }
    const normalised = String(email).trim().toLowerCase()
    const supabase = getSupabase()

    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        { email: normalised, subscribed_at: new Date().toISOString(), unsubscribed_at: null },
        { onConflict: 'email' }
      )

    if (error) {
      console.error('Newsletter upsert error:', error)
      return NextResponse.json({ success: false }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
