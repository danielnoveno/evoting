import { ReactNode } from 'react'

import { AdminPanelShell } from '@/components/admin/AdminPanelShell'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminPanelShell>{children}</AdminPanelShell>
}
