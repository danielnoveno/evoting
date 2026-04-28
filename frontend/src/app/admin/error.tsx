'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { InfoBanner } from '@/components/ui/InfoBanner'
import { ADMIN_MAIN_TABS } from '@/lib/admin-main-menu'

interface AdminErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  return (
    <AppShell mainClassName="py-8" tabs={ADMIN_MAIN_TABS}>
      <div className="max-w-xl space-y-3">
        <InfoBanner variant="danger">{error.message || 'Terjadi kendala saat memuat halaman admin.'}</InfoBanner>
        <Button onClick={reset} variant="secondary">
          Coba Lagi
        </Button>
      </div>
    </AppShell>
  )
}
