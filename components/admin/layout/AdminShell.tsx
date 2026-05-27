'use client'

import { usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import AdminBottomNav from './AdminBottomNav'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin  = pathname === '/admin/login'

  if (isLogin) {
    return (
      <div className="admin-root min-h-screen bg-(--admin-bg)">
        {children}
      </div>
    )
  }

  return (
    <div className="admin-root min-h-screen bg-(--admin-bg)">
      <AdminSidebar />
      <AdminTopbar />
      <main
        className="min-h-screen lg:pl-60"
        style={{ paddingTop: 'var(--admin-topbar-h)' }}
      >
        <div className="p-4 sm:p-5 lg:p-6 pb-20 lg:pb-6">
          {children}
        </div>
      </main>
      <AdminBottomNav />
    </div>
  )
}
