'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import { AuthCard, AuthField, AuthHeader, AuthNotice, AuthShell, AuthTitle } from '@/components/auth/auth-shell'
import { resolveCampusLoginRole } from '@/lib/dummy-auth-seeds'

export default function ConnectWalletPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const emailDomainValid = useMemo(() => {
    const normalized = email.trim().toLowerCase()
    return normalized.endsWith('@students.uajy.ac.id') || normalized.endsWith('@uajy.ac.id')
  }, [email])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setEmailError('')
    setPasswordError('')
    setFormError('')
    setSuccessMessage('')

    let hasError = false

    if (!email.trim()) {
      setEmailError('Email kampus wajib diisi.')
      hasError = true
    } else if (!emailDomainValid) {
      setEmailError('Gunakan email dengan domain students.uajy.ac.id atau uajy.ac.id.')
      hasError = true
    }

    if (!password.trim()) {
      setPasswordError('Password wajib diisi.')
      hasError = true
    }

    if (hasError) {
      setFormError('Periksa kembali data login Anda.')
      return
    }

    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 700))

    const role = resolveCampusLoginRole(email, password)

    if (!role) {
      setIsSubmitting(false)
      setFormError('Email kampus atau password tidak cocok. Coba lagi.')
      return
    }

    setSuccessMessage('Login berhasil. Menyiapkan akses akun Anda...')

    window.setTimeout(() => {
      setIsSubmitting(false)
      if (role === 'admin') {
        router.push('/admin')
        return
      }

      if (role === 'superadmin') {
        router.push('/superadmin')
        return
      }

      router.push('/pemilih')
    }, 900)
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeader />
        <AuthTitle
          title="Masuk ke Votein"
          body="Gunakan akun kampus untuk membuka alur pemilih, admin, atau superadmin."
        />

        <form className="mt-7" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <AuthField
              label="Email Kampus"
              placeholder="nama@students.uajy.ac.id / nama@uajy.ac.id"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={emailError}
              autoComplete="email"
            />
            <AuthField
              label="Password"
              placeholder="Masukkan password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={passwordError}
              autoComplete="current-password"
            />
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-[12px] leading-6 text-slate-800">
            Onboarding smart wallet pada halaman ini masih berada pada tahap pratinjau antarmuka.
          </div>

          {formError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-[12px] leading-6 text-red-700">
              {formError}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[12px] leading-6 text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#0F172A] px-5 text-[14px] font-medium text-white hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Memeriksa...' : 'Masuk'}
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-col gap-2.5">
          <p className="text-center text-[11px] leading-6 text-slate-700">
            Role akun akan disesuaikan otomatis berdasarkan data pengguna yang terdaftar di sistem kampus.
          </p>
            <p className="text-center text-[11px] leading-6 text-slate-600">
              Akses pemilih, admin, dan superadmin tersedia untuk peninjauan alur aplikasi.
            </p>
        </div>

        <AuthNotice />
      </AuthCard>
    </AuthShell>
  )
}
