import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNewsletter } from '@/lib/email'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('status', 'draft')
    .not('scheduled_for', 'is', null)
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!campaign) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no scheduled campaign' })
  }

  const { data: subs } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .is('unsubscribed_at', null)

  const subscribers = subs ?? []
  if (!subscribers.length) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no active subscribers' })
  }

  const sent = await sendNewsletter(subscribers, {
    subject:  campaign.subject,
    body:     campaign.body,
    ctaLabel: campaign.cta_label  ?? undefined,
    ctaUrl:   campaign.cta_url    ?? undefined,
  })

  await supabase.from('email_campaigns').update({
    status:          'sent',
    sent_at:         new Date().toISOString(),
    recipient_count: sent,
  }).eq('id', campaign.id)

  return NextResponse.json({ ok: true, sent, campaign_id: campaign.id })
}
