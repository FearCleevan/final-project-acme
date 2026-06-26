import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { createClient } from '@supabase/supabase-js'
import { sendNewsletter } from '@/lib/email'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const supabase = getSupabase()

  const { data: campaign, error: campErr } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (campErr || !campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  if (campaign.status === 'sent' || campaign.status === 'sending') return NextResponse.json({ error: 'Already sent' }, { status: 400 })

  // Atomic lock: flip status to 'sending' only if still 'draft'
  const { error: lockErr, count } = await supabase
    .from('email_campaigns')
    .update({ status: 'sending' }, { count: 'exact' })
    .eq('id', id)
    .eq('status', 'draft')

  if (lockErr || !count) {
    return NextResponse.json({ error: 'Campaign already being sent or not found' }, { status: 409 })
  }

  const { data: subs } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .is('unsubscribed_at', null)

  const subscribers = subs ?? []
  if (!subscribers.length) return NextResponse.json({ ok: true, sent: 0 })

  const sent = await sendNewsletter(subscribers, {
    subject:      campaign.subject,
    body:         campaign.body,
    ctaLabel:     campaign.cta_label    ?? undefined,
    ctaUrl:       campaign.cta_url      ?? undefined,
    template:     campaign.template     ?? 'bench_notes',
    templateData: campaign.template_data ?? undefined,
  })

  const { error: updateErr } = await supabase.from('email_campaigns').update({
    status:          'sent',
    sent_at:         new Date().toISOString(),
    recipient_count: sent,
  }).eq('id', id)

  if (updateErr) return NextResponse.json({ error: 'Failed to update campaign status' }, { status: 500 })

  return NextResponse.json({ ok: true, sent })
}
