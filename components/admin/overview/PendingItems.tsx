import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import SectionCard from '@/components/admin/shared/SectionCard'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function PendingItems() {
  let unreadCount = 0
  let reviewCount = 0

  try {
    const supabase = getSupabase()
    const [{ count: unread }, { count: pending }] = await Promise.all([
      supabase
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null),
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ])
    unreadCount = unread ?? 0
    reviewCount = pending ?? 0
  } catch {
    return null
  }

  if (unreadCount === 0 && reviewCount === 0) return null

  const rows = [
    { label: 'Unread messages', count: unreadCount,  href: '/admin/communications' },
    { label: 'Pending reviews', count: reviewCount,  href: '/admin/reviews' },
  ]

  return (
    <SectionCard noPadding>
      <div className="px-4 py-3.5 border-b border-(--admin-border)">
        <p className="text-[13px] font-semibold text-(--admin-text)">Needs Attention</p>
      </div>
      <div className="divide-y divide-(--admin-border)">
        {rows.map(row => (
          <Link
            key={row.href}
            href={row.href}
            className="flex items-center justify-between px-4 py-3 hover:bg-(--admin-surface-2) transition-colors"
          >
            <p className="text-[12px] text-(--admin-text-soft)">{row.label}</p>
            {row.count > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-(--admin-amber)/15 text-(--admin-amber)">
                {row.count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </SectionCard>
  )
}
