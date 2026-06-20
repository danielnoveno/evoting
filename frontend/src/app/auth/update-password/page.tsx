'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { AuthCard, AuthField, AuthHeader, AuthShell, AuthTitle } from '@/components/auth/auth-shell'
import { useUpdatePassword } from '@/hooks/use-auth-session'
import { useToast } from '@/components/ui/toast-provider'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const updatePasswordMutation = useUpdatePassword()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (password.length < 6) {
      setFormError('Password minimal 6 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setFormError('Konfirmasi password belum sama.')
      return
    }

    updatePasswordMutation.mutate(password, {
      onSuccess: () => {
        setIsSuccess(true)
        showToast({ tone: 'success', title: 'Password Diperbarui', description: 'Silakan masuk kembali dengan password baru Anda.' })
        setTimeout(() => router.push('/hubungkan-dompet'), 2000)
      },
      onError: (err) => {
        setFormError(getRepositoryErrorMessage(err, 'Gagal memperbarui password. Sesi mungkin kadaluarsa.'))
      }
    })
  }

  return (
    <AuthShell>
      <AuthCard>
        <Link href="/hubungkan-dompet" className="mb-5 inline-flex items-center gap-2 text-[12px] font-semibold text-slate-400 hover:text-slate-900">
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Login
        </Link>

        <AuthHeader />
        <AuthTitle title="Buat Password Baru" body="Gunakan password baru yang mudah kamu ingat, tetapi tidak mudah ditebak orang lain." />

        {isSuccess ? (
          <div className="mt-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-[16px] font-semibold text-slate-900">Password Berhasil Diganti</h2>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">Mengarahkan kamu ke halaman login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <AuthField 
              label="Password Baru" 
              type="password" 
              autoComplete="new-password"
              value={password} 
              onChange={(event) => setPassword(event.target.value)} 
              placeholder="Minimal 6 karakter"
              maxLength={128}
              required
            />

            <AuthField 
              label="Konfirmasi Password" 
              type="password" 
              autoComplete="new-password"
              value={confirmPassword} 
              onChange={(event) => setConfirmPassword(event.target.value)} 
              placeholder="Ulangi password baru"
              maxLength={128}
              required
            />
            
            {formError ? (
              <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] leading-5 text-red-600">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {formError}
              </p>
            ) : null}

            <button 
              type="submit"
              disabled={updatePasswordMutation.isPending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-medium text-white hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {updatePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan Password Baru'}
            </button>
          </form>
        )}
      </AuthCard>
    </AuthShell>
  )
}
