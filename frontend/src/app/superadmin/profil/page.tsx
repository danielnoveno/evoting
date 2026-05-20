'use client'

import { Building2, KeyRound, Laptop, Smartphone, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { SuperadminSectionCard, SuperadminShell, SuperadminToolbarButton } from '@/components/superadmin/superadmin-shell'
import { useToast } from '@/components/ui/toast-provider'
import { superadminPlatformData } from '@/lib/superadmin-dummy-data'
import { useSuperadminPlatformStore } from '@/lib/superadmin-mock-store'

export default function SuperadminProfilePage() {
  const { showToast } = useToast()
  const { platform, setPlatform } = useSuperadminPlatformStore()

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(platform.twoFactorEnabled)
  const [platformName, setPlatformName] = useState(platform.platformName)
  const [language, setLanguage] = useState(platform.defaultLanguage)

  useEffect(() => {
    setTwoFactorEnabled(platform.twoFactorEnabled)
    setPlatformName(platform.platformName)
    setLanguage(platform.defaultLanguage)
  }, [platform])

  return (
    <SuperadminShell>
      <ScrollReveal variant="fade-up" duration={800}>
        <section>
          <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[44px]">
            Profil Super Admin
          </h1>
          <p className="mt-3 max-w-3xl text-[16px] leading-8 text-slate-800">
            Kelola identitas akun, keamanan sesi, serta konfigurasi sistem platform dari satu halaman profil.
          </p>
        </section>
      </ScrollReveal>

      <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-6">
          <SuperadminSectionCard>
            <h2 className="text-[18px] font-semibold text-slate-900">Profil Saya</h2>
            <div className="mt-10 flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white bg-[#0f172a] text-[30px] font-semibold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                SA
              </div>
              <h3 className="mt-6 text-[22px] font-semibold text-slate-900">{superadminPlatformData.profile.name}</h3>
              <p className="mt-2 font-mono text-[15px] text-slate-500">{superadminPlatformData.profile.email}</p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-[20px] bg-slate-200 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Nama Lengkap</p>
                <p className="mt-2 text-[18px] text-slate-900">{superadminPlatformData.profile.fullName}</p>
              </div>
              <div className="rounded-[20px] bg-slate-200 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Email</p>
                <p className="mt-2 text-[18px] text-slate-900">{superadminPlatformData.profile.email}</p>
              </div>
              <button
                type="button"
                onClick={() => showToast({ tone: 'success', title: 'Reset password diproses', description: 'Permintaan reset password berhasil dibuat.' })}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-slate-200 text-[15px] font-medium text-slate-900 transition hover:bg-slate-300"
              >
                <KeyRound className="h-4 w-4" />
                Ganti Kata Sandi
              </button>
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <h2 className="text-[18px] font-semibold text-slate-900">Keamanan</h2>
            <div className="mt-8 rounded-[24px] bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[18px] font-semibold text-slate-900">Autentikasi Dua Faktor (2FA)</p>
                  <p className="mt-2 text-[15px] leading-7 text-slate-800">Gunakan aplikasi authenticator untuk keamanan ekstra.</p>
                </div>
                <button
                  type="button"
                  aria-pressed={twoFactorEnabled}
                  onClick={() => {
                    const nextValue = !twoFactorEnabled
                    setTwoFactorEnabled(nextValue)
                    setPlatform((current) => ({ ...current, twoFactorEnabled: nextValue }))
                    showToast({
                      tone: 'success',
                      title: twoFactorEnabled ? '2FA dinonaktifkan' : '2FA diaktifkan',
                      description: 'Perubahan keamanan berhasil disimpan.',
                    })
                  }}
                  className={`relative h-8 w-14 rounded-full outline-none transition focus:outline-none focus:ring-2 focus:ring-black ${
                    twoFactorEnabled ? 'bg-black' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${twoFactorEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-[12px] uppercase tracking-[0.08em] text-slate-500">Sesi Aktif</p>
              <div className="mt-4 space-y-4">
                {platform.sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="text-slate-800">
                        {session.device.toLowerCase().includes('iphone') ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-[18px] font-medium text-slate-900">{session.device}</p>
                        <p className="mt-1 text-[14px] text-slate-500">{session.meta}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (session.status !== 'Aktif') {
                          setPlatform((current) => ({
                            ...current,
                            sessions: current.sessions.map((entry) => (entry.id === session.id ? { ...entry, status: 'Dicabut' } : entry)),
                          }))
                        }
                        showToast({
                          tone: session.status === 'Aktif' ? 'info' : 'success',
                          title: session.status === 'Aktif' ? 'Sesi utama dipertahankan' : 'Sesi berhasil dicabut',
                          description: 'Perubahan sesi berhasil diproses.',
                        })
                      }}
                      className={`rounded-xl px-3 py-1 text-[14px] font-semibold transition ${
                        session.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      {session.status}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </SuperadminSectionCard>
        </div>

        <div className="space-y-6">
          <SuperadminSectionCard>
            <h2 className="flex items-center gap-3 text-[18px] font-semibold text-slate-900">
              <Building2 className="h-5 w-5" />
              Konfigurasi Blockchain
            </h2>
            <div className="mt-8 space-y-5">
              <div className="rounded-[24px] bg-white p-5">
                <div className="flex items-center justify-between gap-4 border-l-4 border-blue-500 pl-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Status Jaringan</p>
                    <p className="mt-2 text-[18px] font-semibold text-slate-900">{superadminPlatformData.blockchain.network}</p>
                  </div>
                  <span className="rounded-xl bg-blue-50 px-3 py-1 text-[13px] font-semibold text-blue-600">
                    {superadminPlatformData.blockchain.networkStatus}
                  </span>
                </div>
              </div>

              <div className="rounded-[24px] bg-white p-5">
                <div className="border-l-4 border-black pl-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Contract Owner Address</p>
                  <div className="mt-4 break-all rounded-[16px] bg-slate-100 px-4 py-3 font-mono text-[15px] text-slate-700">
                    {superadminPlatformData.blockchain.ownerAddress}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] bg-slate-200 px-4 py-5">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Gas Price Limit (GWEI)</p>
                <div className="mt-4 flex items-center justify-between gap-4 text-[16px] text-slate-900">
                  <span className="text-[34px] font-semibold tracking-[-0.04em]">{superadminPlatformData.blockchain.gasLimit}</span>
                  <span className="font-semibold text-slate-800">GWEI</span>
                </div>
              </div>
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <h2 className="text-[18px] font-semibold text-slate-900">Konfigurasi Sistem</h2>
            <div className="mt-8 space-y-6">
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Nama Platform</span>
                <input
                  value={platformName}
                  onChange={(event) => setPlatformName(event.target.value)}
                  className="mt-3 h-14 w-full rounded-[20px] bg-slate-200 px-4 text-[18px] text-slate-900 outline-none transition focus:outline-none focus:ring-2 focus:ring-black"
                />
              </label>

              <div>
                <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Logo Institusi</span>
                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[16px] border border-slate-200 bg-white text-slate-900 shadow-sm">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        showToast({
                          tone: 'success',
                          title: 'Unggah logo diproses',
                          description: 'Penyimpanan logo sedang disiapkan. Gunakan logo saat ini untuk sementara.',
                        })
                      }
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-200 px-5 text-[15px] font-medium text-slate-900 transition hover:bg-slate-300"
                    >
                      <Upload className="h-4 w-4" />
                      Unggah Logo Baru
                    </button>
                  </div>
                  <p className="text-[14px] text-slate-500">{superadminPlatformData.system.uploadNote}</p>
                </div>
              </div>

              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Bahasa Default</span>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="mt-3 h-14 w-full rounded-[20px] bg-slate-200 px-4 text-[18px] text-slate-900 outline-none transition focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option>Bahasa Indonesia</option>
                  <option>English</option>
                </select>
              </label>
            </div>
          </SuperadminSectionCard>
        </div>
      </StaggerContainer>

      <ScrollReveal variant="fade-up" delay={200} duration={800}>
        <section className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setTwoFactorEnabled(platform.twoFactorEnabled)
              setPlatformName(platform.platformName)
              setLanguage(platform.defaultLanguage)
              showToast({
                tone: 'info',
                title: 'Perubahan dibatalkan',
                description: 'Form dikembalikan ke nilai tersimpan saat ini.',
              })
            }}
            className="inline-flex h-12 items-center justify-center rounded-2xl px-6 text-[15px] font-medium text-slate-900 transition hover:bg-slate-100"
          >
            Batal
          </button>
          <SuperadminToolbarButton
            variant="primary"
            onClick={() => {
              setPlatform((current) => ({ ...current, platformName, defaultLanguage: language }))
              showToast({
                tone: 'success',
                title: 'Perubahan disimpan',
                description: 'Pengaturan platform berhasil diperbarui.',
              })
            }}
          >
            Simpan Perubahan
          </SuperadminToolbarButton>
        </section>
      </ScrollReveal>
    </SuperadminShell>
  )
}
