import AdminThemeProvider from '@/components/admin/layout/AdminThemeProvider'
import AdminShell from '@/components/admin/layout/AdminShell'

export const metadata = {
  title: 'Admin — Acme Lamp & Sign Co.',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminShell>{children}</AdminShell>
    </AdminThemeProvider>
  )
}
