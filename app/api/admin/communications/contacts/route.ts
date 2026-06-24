import { NextResponse } from 'next/server'
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
  if (!await requireAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data, error } = await getSupabase()
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
