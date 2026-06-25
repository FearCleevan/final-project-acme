import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { createClient } from '@supabase/supabase-js'

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

export async function GET() {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabase()
    .from('email_campaigns')
    .select('id, subject, status, scheduled_for, sent_at, recipient_count, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { subject, body, cta_label, cta_url, scheduled_for } = await req.json()
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'subject and body are required' }, { status: 400 })
  }
  const { data, error } = await getSupabase()
    .from('email_campaigns')
    .insert({
      subject:       subject.trim(),
      body:          body.trim(),
      cta_label:     cta_label?.trim()  || null,
      cta_url:       cta_url?.trim()    || null,
      scheduled_for: scheduled_for      || null,
      status:        'draft',
    })
    .select('id, subject, status, created_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
