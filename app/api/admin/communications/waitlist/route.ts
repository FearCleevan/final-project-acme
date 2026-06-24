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

export interface WaitlistGroup {
  productHandle: string
  productTitle:  string
  total:         number
  pending:       number
  subscribers:   { id: string; email: string; createdAt: string; notifiedAt: string | null }[]
}

export async function GET() {
  if (!await requireAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await getSupabase()
    .from('back_in_stock_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const map = new Map<string, WaitlistGroup>()
  for (const row of data ?? []) {
    if (!map.has(row.product_handle)) {
      map.set(row.product_handle, {
        productHandle: row.product_handle,
        productTitle:  row.product_title,
        total:         0,
        pending:       0,
        subscribers:   [],
      })
    }
    const g = map.get(row.product_handle)!
    g.total++
    if (!row.notified_at) g.pending++
    g.subscribers.push({
      id:         row.id,
      email:      row.email,
      createdAt:  row.created_at,
      notifiedAt: row.notified_at ?? null,
    })
  }

  // Sort: most pending first
  return NextResponse.json(
    Array.from(map.values()).sort((a, b) => b.pending - a.pending)
  )
}
