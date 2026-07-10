import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { createClient } from '@supabase/supabase-js'
import DOMPurify from 'isomorphic-dompurify'
import { sendContactReply } from '@/lib/email'

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

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = await req.json().catch(() => ({}))
  const { body: rawHtml } = body as { body?: string }
  if (!rawHtml?.trim()) {
    return NextResponse.json({ error: 'Reply body is required.' }, { status: 400 })
  }

  const cleanHtml = DOMPurify.sanitize(rawHtml)
  const supabase  = getSupabase()

  const { data: msg, error: fetchErr } = await supabase
    .from('contact_messages')
    .select('email, subject')
    .eq('id', id)
    .single()

  if (fetchErr || !msg) {
    return NextResponse.json({ error: 'Message not found.' }, { status: 404 })
  }

  try {
    await sendContactReply(msg.email, msg.subject, cleanHtml)
  } catch (err) {
    return NextResponse.json({ error: `Failed to send email: ${String(err)}` }, { status: 500 })
  }

  const { error: updateErr } = await supabase
    .from('contact_messages')
    .update({ replied_at: new Date().toISOString(), reply_body: cleanHtml })
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json({ error: 'Email sent, but failed to save reply record.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, reply_body: cleanHtml })
}
