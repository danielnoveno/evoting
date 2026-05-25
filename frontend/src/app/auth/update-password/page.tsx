'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Key, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react'
import { AuthShell, AuthCard, AuthField } from '@/components/auth/auth-shell'
import { useUpdatePassword } from '@/hooks/use-auth-session'
import { useToast } from '@/components/ui/toast-provider'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const updatePasswordMutation = useUpdatePassword()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmOpen] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (password.length < 6) {
      setFormError('Password minimal 6 karakter.')
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
      <div className="mx-auto max-w-[440px] w-full px-4 pt-20">
        <AuthCard>
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
              <Key className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-[24px] font-bold text-slate-900">Perbarui Password</h1>
            <p className="mt-2 text-slate-500 text-[14px]">Masukkan password baru untuk akun Anda.</p>
          </div>

          {isSuccess ? (
            <div className="text-center py-6 animate-in zoom-in duration-300">
               <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
               <p className="font-bold text-slate-900">Password Berhasil Diganti</p>
               <p className="text-slate-500 text-[13px] mt-2">Mengarahkan Anda ke halaman login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <AuthField 
                label="PASSWORD BARU" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Minimal 6 karakter"
              />
              
              {formError && (
                <p className="text-red-500 text-[12px] font-bold bg-red-50 p-3 rounded-lg border border-red-100 flex gap-2 items-center">
                   <ShieldCheck className="h-4 w-4" /> {formError}
                </p>
              )}

              <button 
                type="submit"
                disabled={updatePasswordMutation.isPending}
                className="w-full h-12 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
              >
                {updatePasswordMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : 'Simpan Password Baru'}
              </button>
            </form>
          )}
        </AuthCard>
      </div>
    </AuthShell>
  )
}
