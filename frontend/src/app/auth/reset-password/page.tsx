'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react'
import { AuthCard, AuthField, AuthHeader, AuthShell, AuthTitle } from '@/components/auth/auth-shell'
import { useResetPassword } from '@/hooks/use-auth-session'
import { useToast } from '@/components/ui/toast-provider'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function ResetPasswordPage() {
  const { showToast } = useToast()
  const resetPasswordMutation = useResetPassword()

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [formError, setFormError] = useState('')
  const [sentToEmail, setSentToEmail] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()

    setEmailError('')
    setFormError('')

    if (!normalizedEmail) {
      setEmailError('Email wajib diisi.')
      return
    }

    if (!isValidEmail(normalizedEmail)) {
      setEmailError('Format email belum valid.')
      return
    }

    resetPasswordMutation.mutate(normalizedEmail, {
      onSuccess: () => {
        setSentToEmail(normalizedEmail)
        showToast({
          tone: 'success',
          title: 'Instruksi Dikirim',
          description: 'Cek email untuk melanjutkan penggantian password.',
        })
      },
      onError: (error) => {
        setFormError(getRepositoryErrorMessage(error, 'Gagal mengirim instruksi reset password. Coba lagi.'))
      },
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
        <AuthTitle
          title="Reset Password"
          body="Masukkan email akun kamu. Sistem akan mengirim tautan aman untuk membuat password baru."
        />

        {sentToEmail ? (
          <div className="mt-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-[16px] font-semibold text-slate-900">Instruksi Reset Terkirim</h2>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">
              Jika <span className="font-semibold text-slate-900">{sentToEmail}</span> terdaftar, tautan reset password akan masuk ke email tersebut.
            </p>

            <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Langkah berikutnya</p>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-[12px] leading-5 text-slate-600">
                <li>Buka email dan cari pesan reset password dari Votein.</li>
                <li>Klik tautan yang tersedia untuk membuat password baru.</li>
                <li>Masuk kembali setelah password berhasil diganti.</li>
              </ol>
            </div>

            <Link
              href="/hubungkan-dompet"
              className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md bg-[#0F172A] px-5 text-[13px] font-medium text-white hover:bg-[#1E293B]"
            >
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <AuthField
              label="Email Akun"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@students.uajy.ac.id"
              error={emailError}
            />

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-[12px] leading-5 text-blue-700">
              Demi keamanan, tautan reset hanya berlaku melalui email yang terdaftar pada akun kamu.
            </div>

            {formError ? (
              <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] leading-5 text-red-600">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-medium text-white hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {resetPasswordMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Kirim Tautan Reset
                </>
              )}
            </button>
          </form>
        )}
      </AuthCard>
    </AuthShell>
  )
}
