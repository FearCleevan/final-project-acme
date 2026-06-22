import supabaseAdmin from '@/lib/supabase'

export interface AnalyticsSummary {
  today:   number
  week:    number
  month:   number
  allTime: number
}

export interface PageViewRow {
  path:          string
  productHandle: string | null
  device:        string
  country:       string | null
  createdAt:     string
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function startOfToday(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [today, week, month, allTime] = await Promise.all([
    supabaseAdmin.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday()),
    supabaseAdmin.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(7)),
    supabaseAdmin.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(30)),
    supabaseAdmin.from('page_views').select('*', { count: 'exact', head: true }),
  ])
  return {
    today:   today.count   ?? 0,
    week:    week.count    ?? 0,
    month:   month.count   ?? 0,
    allTime: allTime.count ?? 0,
  }
}

export async function getTopProducts(days = 30, limit = 10): Promise<{ handle: string; views: number }[]> {
  const { data } = await supabaseAdmin
    .from('page_views')
    .select('product_handle')
    .not('product_handle', 'is', null)
    .gte('created_at', daysAgo(days))

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const h = row.product_handle as string
    counts[h] = (counts[h] ?? 0) + 1
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([handle, views]) => ({ handle, views }))
}

export async function getTopPages(days = 30, limit = 10): Promise<{ path: string; views: number }[]> {
  const { data } = await supabaseAdmin
    .from('page_views')
    .select('path')
    .gte('created_at', daysAgo(days))

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const p = row.path as string
    counts[p] = (counts[p] ?? 0) + 1
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([path, views]) => ({ path, views }))
}

export async function getDeviceBreakdown(days = 30): Promise<{ mobile: number; tablet: number; desktop: number }> {
  const { data } = await supabaseAdmin
    .from('page_views')
    .select('device')
    .gte('created_at', daysAgo(days))

  const result = { mobile: 0, tablet: 0, desktop: 0 }
  for (const row of data ?? []) {
    const d = row.device as string
    if (d === 'mobile' || d === 'tablet' || d === 'desktop') result[d]++
  }
  return result
}

export async function getRecentViews(limit = 20): Promise<PageViewRow[]> {
  const { data } = await supabaseAdmin
    .from('page_views')
    .select('path, product_handle, device, country, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map(row => ({
    path:          row.path           as string,
    productHandle: row.product_handle as string | null,
    device:        row.device         as string,
    country:       row.country        as string | null,
    createdAt:     row.created_at     as string,
  }))
}
