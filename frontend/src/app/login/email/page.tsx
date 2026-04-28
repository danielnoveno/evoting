'use client'

import { FormEvent, useState } from 'react'
import { Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { DemoLoginFeedback } from '@/components/login/DemoLoginFeedback'
import { DemoAuthLayout } from '@/components/login/DemoAuthLayout'
import { Button } from '@/components/ui/Button'
import { useDemoLoginFlow } from '@/hooks/useDemoLoginFlow'
import { DemoRole, getDemoRoleDestination } from '@/lib/demo-auth'

const ALLOWED_DEMO_EMAILS = [
  'daniel.voter@uajy.ac.id',
  'admin.himaforka@uajy.ac.id',
  'superadmin.votein@uajy.ac.id',
]

export default function EmailLoginDemoPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<DemoRole>('voter')
  const [error, setError] = useState('')
  const { feedback, forceFail, loadingKey, runLogin, setFeedback, setForceFail } = useDemoLoginFlow()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim()) {
      setError('Email wajib diisi.')
      return
    }

    if (!password.trim()) {
      setError('Kata sandi wajib diisi.')
      return
    }

    if (!ALLOWED_DEMO_EMAILS.includes(email.trim().toLowerCase())) {
      setError('Akun demo tidak ditemukan. Gunakan email demo yang tersedia.')
      setFeedback({
        variant: 'danger',
        message: 'Login gagal. Pastikan email demo benar atau gunakan login Google.',
      })
      return
    }

    setError('')
    await runLogin('email-login', () => router.push(getDemoRoleDestination(role)), role)
  }

  return (
    <DemoAuthLayout
      description="Isi form email demo untuk mensimulasikan proses login sebelum diarahkan ke dashboard sesuai peran."
      icon={<Mail className="h-6 w-6 text-slate-900" />}
      title="Form Login Email"
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Email</span>
          <input
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@uajy.ac.id"
            type="email"
            value={email}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Kata Sandi</span>
          <input
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            type="password"
            value={password}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Masuk sebagai</span>
          <select
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900"
            onChange={(event) => setRole(event.target.value as DemoRole)}
            value={role}
          >
            <option value="voter">Pemilih</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </label>

        {error ? <p className="text-xs text-red-600">{error}</p> : null}

        <Button fullWidth loading={loadingKey === 'email-login'} type="submit" variant="primary">
          Masuk Sekarang
        </Button>
      </form>

      <DemoLoginFeedback
        feedback={feedback}
        forceFail={forceFail}
        onDismiss={() => setFeedback(null)}
        onForceFailChange={setForceFail}
      />
    </DemoAuthLayout>
  )
}
