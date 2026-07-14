// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { createClient } from '@supabase/supabase-js'
import { logAction } from '@/lib/admin/activityLog'

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

interface SettingsRow {
  store_name: string
  store_email: string
  store_phone: string
  store_address: string
  store_city: string
  store_province: string
  store_country: string
  currency: string
  timezone: string
  date_format: string
  notify_order_placed: boolean
  notify_order_fulfilled: boolean
  notify_low_stock: boolean
  notify_abandoned_checkout: boolean
  notify_weekly_digest: boolean
}

function toClientShape(row: SettingsRow) {
  return {
    storeName:               row.store_name,
    storeEmail:              row.store_email,
    storePhone:              row.store_phone,
    storeAddress:            row.store_address,
    storeCity:               row.store_city,
    storeProvince:           row.store_province,
    storeCountry:            row.store_country,
    currency:                row.currency,
    timezone:                row.timezone,
    dateFormat:              row.date_format,
    notifyOrderPlaced:       row.notify_order_placed,
    notifyOrderFulfilled:    row.notify_order_fulfilled,
    notifyLowStock:          row.notify_low_stock,
    notifyAbandonedCheckout: row.notify_abandoned_checkout,
    notifyWeeklyDigest:      row.notify_weekly_digest,
  }
}

const CLIENT_TO_COLUMN: Record<string, string> = {
  storeName:               'store_name',
  storeEmail:              'store_email',
  storePhone:              'store_phone',
  storeAddress:            'store_address',
  storeCity:               'store_city',
  storeProvince:           'store_province',
  storeCountry:            'store_country',
  currency:                'currency',
  timezone:                'timezone',
  dateFormat:              'date_format',
  notifyOrderPlaced:       'notify_order_placed',
  notifyOrderFulfilled:    'notify_order_fulfilled',
  notifyLowStock:          'notify_low_stock',
  notifyAbandonedCheckout: 'notify_abandoned_checkout',
  notifyWeeklyDigest:      'notify_weekly_digest',
}

export async function GET() {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getSupabase()
    .from('admin_settings')
    .select('*')
    .eq('id', 'main')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(toClientShape(data as SettingsRow))
}

export async function PATCH(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as Record<string, unknown>

  const update: Record<string, unknown> = {}
  for (const [clientKey, value] of Object.entries(body)) {
    const column = CLIENT_TO_COLUMN[clientKey]
    if (column) update[column] = value
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }
  const updatedFields = Object.keys(update)
  update.updated_at = new Date().toISOString()

  const { data, error } = await getSupabase()
    .from('admin_settings')
    .update(update)
    .eq('id', 'main')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAction('settings.update', 'settings', undefined, updatedFields.join(', ')).catch(() => {})
  return NextResponse.json(toClientShape(data as SettingsRow))
}
