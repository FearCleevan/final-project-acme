// lib/cartActivity.ts
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface CartActivityInput {
  customerEmail: string
  customerId:    string | null
  productId:     string
  productTitle:  string
  variantId:     string | null
  quantity:      number
}

export interface ActiveCartItem {
  productTitle: string
  quantity:     number
}

export interface CartActivityHistoryItem {
  productTitle: string
  quantity:     number
  orderName:    string | null
  convertedAt:  string | null
}

export async function upsertCartActivity(input: CartActivityInput): Promise<void> {
  const supabase = getSupabase()

  const { data: existing, error: selectError } = await supabase
    .from('cart_activity')
    .select('id')
    .eq('customer_email', input.customerEmail)
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
      })
      .eq('id', existing.id)
    if (error) console.error('[cartActivity] upsert update error:', error)
  } else {
    const { error } = await supabase
      .from('cart_activity')
      .insert({
        customer_email: input.customerEmail,
        customer_id:    input.customerId,
        product_id:     input.productId,
        product_title:  input.productTitle,
        variant_id:     input.variantId,
        quantity:       input.quantity,
        status:         'active',
        last_added_at:  new Date().toISOString(),
      })
    if (error) console.error('[cartActivity] upsert insert error:', error)
  }
}

export async function removeCartActivity(customerEmail: string, productId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('cart_activity')
    .delete()
    .eq('customer_email', customerEmail)
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
