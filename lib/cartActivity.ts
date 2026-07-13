// lib/cartActivity.ts
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Identifies a cart — a logged-in customer by email, or an anonymous
// browser by its visitor-id cookie. Exactly one is expected to be set.
export interface CartIdentity {
  customerEmail?: string | null
  sessionId?:     string | null
}

export interface CartActivityInput extends CartIdentity {
  customerId:    string | null
  productId:     string
  productTitle:  string
  variantId:     string | null
  quantity:      number
  city?:         string | null
  lat?:          number | null
  lng?:          number | null
}

export interface ActiveCartItem {
  productTitle: string
  quantity:     number
}

export interface GuestCartActivity {
  sessionId:    string
  city:         string | null
  lat:          number | null
  lng:          number | null
  items:        ActiveCartItem[]
  lastAddedAt:  string
}

export interface CartActivityHistoryItem {
  productTitle: string
  quantity:     number
  orderName:    string | null
  convertedAt:  string | null
}

export async function upsertCartActivity(input: CartActivityInput): Promise<void> {
  const supabase = getSupabase()

  let selectQuery = supabase.from('cart_activity').select('id')
  selectQuery = input.customerEmail
    ? selectQuery.eq('customer_email', input.customerEmail)
    : selectQuery.eq('session_id', input.sessionId!)

  const { data: existing, error: selectError } = await selectQuery
    .eq('product_id', input.productId)
    .eq('status', 'active')
    .maybeSingle()

  if (selectError) {
    console.error('[cartActivity] upsert select error:', selectError)
    return
  }

  if (existing) {
    const { error } = await supabase
      .from('cart_activity')
      .update({
        customer_id:   input.customerId,
        product_title: input.productTitle,
        variant_id:    input.variantId,
        quantity:      input.quantity,
        last_added_at: new Date().toISOString(),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.lat  !== undefined ? { lat:  input.lat }  : {}),
        ...(input.lng  !== undefined ? { lng:  input.lng }  : {}),
      })
      .eq('id', existing.id)
    if (error) console.error('[cartActivity] upsert update error:', error)
  } else {
    const { error } = await supabase
      .from('cart_activity')
      .insert({
        customer_email: input.customerEmail ?? null,
        session_id:     input.sessionId ?? null,
        customer_id:    input.customerId,
        product_id:     input.productId,
        product_title:  input.productTitle,
        variant_id:     input.variantId,
        quantity:       input.quantity,
        status:         'active',
        last_added_at:  new Date().toISOString(),
        city:           input.city ?? null,
        lat:            input.lat  ?? null,
        lng:            input.lng  ?? null,
      })
    if (error) console.error('[cartActivity] upsert insert error:', error)
  }
}

export async function removeCartActivity(identity: CartIdentity, productId: string): Promise<void> {
  let query = getSupabase().from('cart_activity').delete()
  query = identity.customerEmail
    ? query.eq('customer_email', identity.customerEmail)
    : query.eq('session_id', identity.sessionId!)

  const { error } = await query
    .eq('product_id', productId)
    .eq('status', 'active')
  if (error) console.error('[cartActivity] remove error:', error)
}

export async function convertCartActivity(
  customerEmail: string,
  lineItems: { productId: string; variantId: string | null }[],
  orderName: string
): Promise<void> {
  const now = new Date().toISOString()
  for (const item of lineItems) {
    const { error } = await getSupabase()
      .from('cart_activity')
      .update({ status: 'converted', order_name: orderName, converted_at: now })
      .eq('customer_email', customerEmail)
      .eq('product_id', item.productId)
      .eq('status', 'active')
    if (error) console.error('[cartActivity] convert error:', error)
  }
}

export async function getActiveCartActivityByEmails(
  emails: string[]
): Promise<Map<string, ActiveCartItem[]>> {
  const map = new Map<string, ActiveCartItem[]>()
  if (emails.length === 0) return map

  const { data, error } = await getSupabase()
    .from('cart_activity')
    .select('customer_email, product_title, quantity')
    .in('customer_email', emails)
    .eq('status', 'active')

  if (error) { console.error('[cartActivity] batch fetch error:', error); return map }

  for (const row of data ?? []) {
    const list = map.get(row.customer_email) ?? []
    list.push({ productTitle: row.product_title, quantity: row.quantity })
    map.set(row.customer_email, list)
  }
  return map
}

// Active cart rows with no known customer — grouped by visitor-id cookie,
// for surfacing anonymous shoppers in the admin Customers list.
export async function getActiveGuestCartActivity(): Promise<GuestCartActivity[]> {
  const { data, error } = await getSupabase()
    .from('cart_activity')
    .select('session_id, product_title, quantity, city, lat, lng, last_added_at')
    .is('customer_email', null)
    .eq('status', 'active')
    .order('last_added_at', { ascending: false })

  if (error) { console.error('[cartActivity] guest fetch error:', error); return [] }

  const bySession = new Map<string, GuestCartActivity>()
  for (const row of data ?? []) {
    if (!row.session_id) continue
    const existing = bySession.get(row.session_id)
    if (existing) {
      existing.items.push({ productTitle: row.product_title, quantity: row.quantity })
    } else {
      bySession.set(row.session_id, {
        sessionId:   row.session_id,
        city:        row.city,
        lat:         row.lat,
        lng:         row.lng,
        items:       [{ productTitle: row.product_title, quantity: row.quantity }],
        lastAddedAt: row.last_added_at,
      })
    }
  }
  return [...bySession.values()]
}

// Reattaches a guest's cart history to their real customer identity once
// they log in — called from the OAuth callback right after we learn their
// email. Clears session_id so the row is unambiguously owned by the email
// going forward (keeps the two partial unique indexes from ever colliding).
export async function mergeGuestCartActivity(sessionId: string, customerEmail: string): Promise<void> {
  const { error } = await getSupabase()
    .from('cart_activity')
    .update({ customer_email: customerEmail, session_id: null })
    .eq('session_id', sessionId)
    .is('customer_email', null)
  if (error) console.error('[cartActivity] merge error:', error)
}

export async function getCartActivityHistoryForEmail(
  email: string
): Promise<CartActivityHistoryItem[]> {
  const { data, error } = await getSupabase()
    .from('cart_activity')
    .select('product_title, quantity, order_name, converted_at')
    .eq('customer_email', email)
    .eq('status', 'converted')
    .order('converted_at', { ascending: false })

  if (error) { console.error('[cartActivity] history fetch error:', error); return [] }

  return (data ?? []).map(r => ({
    productTitle: r.product_title,
    quantity:     r.quantity,
    orderName:    r.order_name,
    convertedAt:  r.converted_at,
  }))
}
