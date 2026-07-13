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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getSupabase()
    .from('newsletter_subscribers')
    .select('email, subscribed_at, unsubscribed_at')
    .order('subscribed_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = data ?? []

  if (req.nextUrl.searchParams.get('format') === 'csv') {
    const csv = [
      'email,subscribed_at,status',
      ...rows.map(r =>
        `"${r.email}","${r.subscribed_at}","${r.unsubscribed_at ? 'unsubscribed' : 'active'}"`
      ),
    ].join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { email?: string } | null
  const email = body?.email?.trim().toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }

  const { data, error } = await getSupabase()
    .from('newsletter_subscribers')
    .insert({ email, subscribed_at: new Date().toISOString() })
    .select('email, subscribed_at, unsubscribed_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already a subscriber.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { email?: string; active?: boolean } | null
  if (!body?.email || typeof body.active !== 'boolean') {
    return NextResponse.json({ error: 'email and active are required.' }, { status: 400 })
  }

  const { error } = await getSupabase()
    .from('newsletter_subscribers')
    .update({ unsubscribed_at: body.active ? null : new Date().toISOString() })
    .eq('email', body.email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
