'use client'

import { KeyRound } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { DemoLoginFeedback } from '@/components/login/DemoLoginFeedback'
import { DemoAuthLayout } from '@/components/login/DemoAuthLayout'
import { Button } from '@/components/ui/Button'
import { useDemoLoginFlow } from '@/hooks/useDemoLoginFlow'

export default function SmartWalletLoginDemoPage() {
  const router = useRouter()
  const { feedback, forceFail, loadingKey, runLogin, setFeedback, setForceFail } = useDemoLoginFlow()

  return (
    <DemoAuthLayout
      description="Demo Smart Wallet: pilih metode verifikasi cepat untuk masuk ke halaman tujuan."
      icon={<KeyRound className="h-6 w-6 text-slate-900" />}
      title="Dompet Pintar (Passkey / QR)"
    >
      <div className="space-y-2">
        <Button
          fullWidth
          loading={loadingKey === 'smart-passkey'}
          onClick={() =>
            runLogin('smart-passkey', () => router.push('/voter/beranda'), 'voter')
          }
          variant="primary"
        >
          Masuk dengan Passkey
        </Button>

        <Button
          fullWidth
          loading={loadingKey === 'smart-qr'}
          onClick={() => runLogin('smart-qr', () => router.push('/voter/beranda'), 'voter')}
          variant="secondary"
        >
          Masuk dengan QR Wallet
        </Button>

        <Button
          fullWidth
          loading={loadingKey === 'smart-superadmin'}
          onClick={() =>
            runLogin('smart-superadmin', () => router.push('/superadmin/beranda'), 'superadmin')
          }
          variant="ghost"
        >
          Demo sebagai Superadmin
        </Button>
      </div>

      <DemoLoginFeedback
        feedback={feedback}
        forceFail={forceFail}
        onDismiss={() => setFeedback(null)}
        onForceFailChange={setForceFail}
      />
    </DemoAuthLayout>
  )
}
