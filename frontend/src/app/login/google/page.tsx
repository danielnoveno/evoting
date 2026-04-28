'use client'

import Link from 'next/link'
import { Chrome } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { DemoLoginFeedback } from '@/components/login/DemoLoginFeedback'
import { DemoAuthLayout } from '@/components/login/DemoAuthLayout'
import { Button } from '@/components/ui/Button'
import { useDemoLoginFlow } from '@/hooks/useDemoLoginFlow'
import { DemoRole } from '@/lib/demo-auth'

const demoAccounts = [
  {
    label: 'daniel.voter@uajy.ac.id',
    role: 'Pemilih',
    href: '/voter/beranda',
    sessionRole: 'voter' as DemoRole,
  },
  {
    label: 'admin.himaforka@uajy.ac.id',
    role: 'Admin',
    href: '/space/1/admin',
    sessionRole: 'admin' as DemoRole,
  },
  {
    label: 'superadmin.votein@uajy.ac.id',
    role: 'Superadmin',
    href: '/superadmin/beranda',
    sessionRole: 'superadmin' as DemoRole,
  },
]

export default function GoogleLoginDemoPage() {
  const router = useRouter()
  const { feedback, forceFail, loadingKey, runLogin, setFeedback, setForceFail } = useDemoLoginFlow()

  return (
    <DemoAuthLayout
      description="Pilih akun Google demo untuk melihat alur login berdasarkan peran pengguna."
      icon={<Chrome className="h-6 w-6 text-slate-900" />}
      title="Login dengan Google"
    >
      <div className="space-y-2">
        {demoAccounts.map((account) => (
          <button
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 hover:bg-slate-100"
            key={account.label}
            onClick={() =>
              runLogin(account.label, () => router.push(account.href), account.sessionRole)
            }
            type="button"
          >
            <span>{account.label}</span>
            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">
              {loadingKey === account.label ? 'Memproses...' : account.role}
            </span>
          </button>
        ))}
      </div>

      <DemoLoginFeedback
        feedback={feedback}
        forceFail={forceFail}
        onDismiss={() => setFeedback(null)}
        onForceFailChange={setForceFail}
      />

      <div className="mt-4">
        <Link href="/login">
          <Button fullWidth variant="secondary">
            Gunakan Metode Login Lain
          </Button>
        </Link>
      </div>
    </DemoAuthLayout>
  )
}
