import Link from 'next/link'
import { BiPlus, BiPackage, BiEnvelope } from 'react-icons/bi'

const ACTIONS = [
  { label: 'Add Product',       href: '/admin/products/new',    icon: <BiPlus size={14} /> },
  { label: 'View Unfulfilled',  href: '/admin/orders',          icon: <BiPackage size={14} /> },
  { label: 'Go to Inbox',       href: '/admin/communications',  icon: <BiEnvelope size={14} /> },
]

export default function QuickActions() {
  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      {ACTIONS.map(a => (
        <Link
          key={a.href}
          href={a.href}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-(--admin-border) text-[12px] text-(--admin-text-soft) hover:text-(--admin-text) hover:border-(--admin-text-muted) hover:bg-(--admin-surface-2) transition-colors"
        >
          {a.icon}
          {a.label}
        </Link>
      ))}
    </div>
  )
}
