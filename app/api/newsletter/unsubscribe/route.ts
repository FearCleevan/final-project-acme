import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const encoded = req.nextUrl.searchParams.get('email')
  if (!encoded) {
    return new NextResponse('<p>Invalid unsubscribe link.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }
  try {
    const email = Buffer.from(encoded, 'base64url').toString('utf8')
    await getSupabase()
      .from('newsletter_subscribers')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('email', email)
      .is('unsubscribed_at', null)

    return new NextResponse(
      `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Unsubscribed — Acme Vintage Supply</title>
<style>body{font-family:Georgia,serif;max-width:480px;margin:80px auto;padding:0 20px;color:#2C2C2A;}
h2{font-size:22px;}p{color:#6B6257;line-height:1.6;}a{color:#2C5F2E;}</style></head>
<body>
<h2>You've been unsubscribed.</h2>
<p>You'll no longer receive newsletter emails from Acme Vintage Supply.</p>
<p><a href="https://acmevintagesupply.com">Return to the shop →</a></p>
</body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  } catch {
    return new NextResponse('<p>Something went wrong. Please try again.</p>', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}
