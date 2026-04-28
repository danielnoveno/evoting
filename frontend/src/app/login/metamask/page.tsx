'use client'

import { Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { DemoLoginFeedback } from '@/components/login/DemoLoginFeedback'
import { DemoAuthLayout } from '@/components/login/DemoAuthLayout'
import { Button } from '@/components/ui/Button'
import { useDemoLoginFlow } from '@/hooks/useDemoLoginFlow'

export default function MetaMaskLoginDemoPage() {
  const router = useRouter()
  const { feedback, forceFail, loadingKey, runLogin, setFeedback, setForceFail } = useDemoLoginFlow()

  return (
    <DemoAuthLayout
      description="Simulasi koneksi dompet MetaMask untuk demo. Pilih tujuan setelah koneksi berhasil."
      icon={<Wallet className="h-6 w-6 text-slate-900" />}
      title="Hubungkan Dompet MetaMask"
    >
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Status dompet: siap terhubung</p>
        <p className="mt-1 font-mono text-xs text-slate-500">0x71C6...4f3e</p>
      </div>

      <div className="mt-4 space-y-2">
        <Button
          fullWidth
          loading={loadingKey === 'metamask-voter'}
          onClick={() =>
            runLogin('metamask-voter', () => router.push('/voter/beranda'), 'voter')
          }
          variant="primary"
        >
          Login sebagai Pemilih
        </Button>

        <Button
          fullWidth
          loading={loadingKey === 'metamask-admin'}
          onClick={() =>
            runLogin('metamask-admin', () => router.push('/space/1/admin'), 'admin')
          }
          variant="secondary"
        >
          Login sebagai Admin
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
