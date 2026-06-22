import supabaseAdmin from '@/lib/supabase'

export interface BackInStockRow {
  id: string
  email: string
  productHandle: string
  productTitle: string
  createdAt: string
}

export async function addBackInStockRequest(
  email: string,
  productHandle: string,
  productTitle: string
): Promise<'added' | 'already_registered'> {
  const { error } = await supabaseAdmin
    .from('back_in_stock_requests')
    .insert({ email, product_handle: productHandle, product_title: productTitle })

  if (error?.code === '23505') return 'already_registered' // unique constraint
  if (error) throw error
  return 'added'
}

export async function getBackInStockRequests(productHandle: string): Promise<BackInStockRow[]> {
  const { data } = await supabaseAdmin
    .from('back_in_stock_requests')
    .select('*')
    .eq('product_handle', productHandle)
    .is('notified_at', null)
    .order('created_at', { ascending: true })

  return (data ?? []).map(row => ({
    id: row.id as string,
    email: row.email as string,
    productHandle: row.product_handle as string,
    productTitle: row.product_title as string,
    createdAt: row.created_at as string,
  }))
}

export async function markNotified(ids: string[]): Promise<void> {
  await supabaseAdmin
    .from('back_in_stock_requests')
    .update({ notified_at: new Date().toISOString() })
    .in('id', ids)
}
