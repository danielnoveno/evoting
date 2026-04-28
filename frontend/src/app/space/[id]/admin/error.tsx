'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { InfoBanner } from '@/components/ui/InfoBanner'

interface SpaceAdminErrorProps {
  error: Error
  reset: () => void
}

export default function SpaceAdminError({ error, reset }: SpaceAdminErrorProps) {
  return (
    <AppShell mainClassName="py-8" spaceName="Dashboard Admin">
      <InfoBanner variant="danger">
        {error.message || 'Terjadi kendala saat membuka dashboard admin.'}
      </InfoBanner>

      <div className="mt-3">
        <Button onClick={reset} variant="secondary">
          Coba Lagi
        </Button>
      </div>
    </AppShell>
  )
}
