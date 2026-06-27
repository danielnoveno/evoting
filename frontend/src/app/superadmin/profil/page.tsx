'use client'

import { Building2, KeyRound, Laptop, Smartphone, Upload, ShieldCheck, WalletCards, Pencil, Lock, Monitor, Globe, LogOut } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { SuperadminSectionCard, SuperadminShell, SuperadminToolbarButton } from '@/components/superadmin/superadmin-shell'
import { SuperadminOnboardingTour } from '@/components/superadmin/onboarding-tour'
import { useToast } from '@/components/ui/toast-provider'
import { superadminPlatformData, type SuperadminPlatformSession } from '@/lib/superadmin-data'
import { useCurrentProfile, useSaveCurrentProfile } from '@/hooks/use-profile'
import { getAdminInitials } from '@/lib/superadmin-admin-mapper'
import { useProfileImageUpload } from '@/hooks/use-profile-upload'
import { usePlatformSettings, useUpdatePlatformSettings } from '@/hooks/use-platform-settings'
import { useResetPassword } from '@/hooks/use-auth-session'
import { useAccount, useBalance } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { isAddress, type Address } from 'viem'

export default function SuperadminProfilePage() {
  const { showToast } = useToast()
  const { address: connectedWallet, isConnected, isReconnecting, chainId } = useAccount()
  const [platform, setPlatform] = useState<{
    platformName: string
    defaultLanguage: string
    sessions: SuperadminPlatformSession[]
    twoFactorEnabled: boolean
  }>({
    platformName: superadminPlatformData.system.platformName,
    defaultLanguage: superadminPlatformData.system.defaultLanguage,
    sessions: [],
    twoFactorEnabled: false,
  })
  const { data: profile, isLoading: isProfileLoading } = useCurrentProfile()
  const profileWalletAddress = profile?.walletAddress?.trim()
  const savedProfileWallet = profileWalletAddress && isAddress(profileWalletAddress)
    ? (profileWalletAddress as Address)
    : undefined
  const balanceWalletAddress = connectedWallet ?? savedProfileWallet
  const walletReadMode = connectedWallet ? 'connected' : savedProfileWallet ? 'saved-profile' : 'none'
  const walletBalanceQuery = useBalance({
    address: balanceWalletAddress,
    chainId: baseSepolia.id,
    query: {
      enabled: Boolean(balanceWalletAddress),
      refetchInterval: 30_000,
    },
  })
  
  const { data: platformSettings, isLoading: isPlatformSettingsLoading } = usePlatformSettings()
  const updatePlatformMutation = useUpdatePlatformSettings()

  const uploadAvatarMutation = useProfileImageUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [activeSessions, setActiveSessions] = useState<Array<{ id: string; device: string; location: string; time: string; status: string; isCurrent: boolean; icon: typeof Monitor }>>([])

  const [platformName, setPlatformName] = useState('')
  const [language, setLanguage] = useState('')
  const [networkName, setNetworkName] = useState('')
  const [gasLimit, setGasLimit] = useState(50)

  useEffect(() => {
    if (profile?.displayName) {
      setDisplayName(profile.displayName)
    }
  }, [profile])

  useEffect(() => {
    const fetchSessionInfo = async () => {
      try {
        const response = await fetch('/api/auth/session-info')
        const data = await response.json()
        setActiveSessions([{
          id: 'current',
          device: `${data.device} Browser`,
          location: data.location,
          time: 'Baru saja',
          status: 'online',
          isCurrent: true,
          icon: data.device === 'Mobile' ? Smartphone : Monitor,
        }])
      } catch {}
    }
    fetchSessionInfo()
  }, [])

  useEffect(() => {
    if (platformSettings) {
      setPlatformName(platformSettings.platform_name)
      setLanguage(platformSettings.default_language)
      setNetworkName(platformSettings.network_name)
      setGasLimit(platformSettings.gas_limit)
    }
  }, [platformSettings])

  const saveProfileMutation = useSaveCurrentProfile()

  const handleSaveProfile = () => {
    if (!profile?.walletAddress) return

    saveProfileMutation.mutate(
      {
        walletAddress: profile.walletAddress,
        displayName,
        email: profile.email || '',
        avatarUrl: profile.avatarUrl || '',
      },
      {
        onSuccess: () => {
          showToast({ tone: 'success', title: 'Profil diperbarui', description: 'Perubahan nama profil berhasil disimpan.' })
        },
        onError: (error) => {
          showToast({ tone: 'error', title: 'Gagal memperbarui profil', description: error instanceof Error ? error.message : 'Terjadi kesalahan.' })
        },
      }
    )
  }

  const handleSavePlatform = () => {
    if (!platformSettings?.id) return

    updatePlatformMutation.mutate(
      {
        id: platformSettings.id,
        platform_name: platformName,
        default_language: language,
        network_name: networkName,
        gas_limit: gasLimit,
      },
      {
        onSuccess: () => {
          showToast({ tone: 'success', title: 'Konfigurasi disimpan', description: 'Pengaturan platform berhasil diperbarui.' })
        },
        onError: (error) => {
          showToast({ tone: 'error', title: 'Gagal menyimpan', description: error instanceof Error ? error.message : 'Terjadi kesalahan.' })
        },
      }
    )
  }

  const resetPasswordMutation = useResetPassword()

  const handleResetPassword = () => {
    if (!profile?.email) return
    resetPasswordMutation.mutate(profile.email, {
      onSuccess: () => {
        showToast({ tone: 'success', title: 'Reset password diproses', description: 'Silakan cek email Anda untuk instruksi selanjutnya.' })
      },
      onError: (err) => {
        showToast({ tone: 'error', title: 'Gagal reset password', description: err instanceof Error ? err.message : 'Terjadi kesalahan.' })
      }
    })
  }

  const initials = profile?.displayName ? getAdminInitials(profile.displayName) : 'SA'
  const balanceLabel = walletBalanceQuery.data
    ? `${Number(walletBalanceQuery.data.formatted).toLocaleString('id-ID', { maximumFractionDigits: 6 })} ${walletBalanceQuery.data.symbol}`
    : '-'
  const isBaseSepolia = chainId === 84532
  const walletStatusTone = isConnected && isBaseSepolia
    ? 'bg-emerald-50 text-emerald-700'
    : isConnected || walletReadMode === 'saved-profile'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-slate-100 text-slate-600'
  const walletStatusLabel = isReconnecting
    ? 'Memulihkan koneksi'
    : isConnected
      ? isBaseSepolia ? 'Base Sepolia' : 'Network perlu dicek'
      : walletReadMode === 'saved-profile'
        ? 'Wallet akun tersimpan'
        : 'Belum tersambung'
  const walletHelperCopy = walletReadMode === 'connected'
    ? 'Saldo ini digunakan sebagai gas fee saat superadmin melakukan deploy pemilihan. Angka diperbarui otomatis berkala.'
    : walletReadMode === 'saved-profile'
      ? 'Koneksi wallet belum aktif setelah reload, tetapi saldo alamat profil tetap dibaca dari Base Sepolia. Sambungkan ulang sebelum melakukan deploy atau transaksi.'
      : 'Sambungkan Smart Wallet superadmin untuk melihat saldo gas deploy.'

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile?.userId) return

    if (!file.type.startsWith('image/')) {
      showToast({ tone: 'error', title: 'Format tidak didukung', description: 'Silakan pilih file gambar (JPG, PNG).' })
      return
    }

    uploadAvatarMutation.mutate(
      { file, userId: profile.userId },
      {
        onSuccess: () => {
          showToast({ tone: 'success', title: 'Foto profil diperbarui', description: 'Perubahan foto profil berhasil disimpan.' })
        },
        onError: (error) => {
          showToast({ tone: 'error', title: 'Gagal mengunggah foto', description: error instanceof Error ? error.message : 'Terjadi kesalahan.' })
        },
      }
    )
  }

  return (
    <SuperadminShell>
      <SuperadminOnboardingTour />
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
              <div className="relative group">
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-[#0f172a] text-[42px] font-semibold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] transition-transform group-hover:scale-105 overflow-hidden">
                  {uploadAvatarMutation.isPending ? (
                    <div className="flex items-center justify-center bg-slate-900/50 w-full h-full">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                    </div>
                  ) : profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.displayName || 'Avatar'} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAvatarMutation.isPending}
                  className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                </button>
              </div>
              
              {isProfileLoading ? (
                <div className="mt-6 h-8 w-48 animate-pulse bg-slate-200 rounded-lg" />
              ) : (
                <>
                  <h3 className="mt-6 text-[24px] font-semibold text-slate-900">{profile?.displayName || 'Super Admin'}</h3>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Otoritas Superadmin
                  </div>
                  <p className="mt-3 font-mono text-[14px] text-slate-500">{profile?.email}</p>
                </>
              )}
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-slate-900">Informasi Personal</p>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                    isEditing ? 'bg-black text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Pencil className="h-4 w-4" />
                  {isEditing ? 'Sedang Mengedit' : 'Edit Profil'}
                </button>
              </div>
              <div className={`rounded-[24px] bg-white border px-5 py-5 transition-colors ${isEditing ? 'border-slate-300 focus-within:border-slate-900' : 'border-slate-200'}`}>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">Nama Lengkap</p>
                <div className="relative">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    disabled={!isEditing}
                    maxLength={100}
                    className={`mt-2 w-full text-[17px] font-semibold bg-transparent border-none outline-none p-0 pr-8 ${
                      isEditing ? 'text-slate-900' : 'text-slate-600 cursor-not-allowed opacity-70'
                    }`}
                  />
                  {!isEditing && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-[24px] bg-slate-100 border border-slate-200 px-5 py-5 opacity-70">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">Email Institusi (Read Only)</p>
                <p className="mt-2 text-[17px] font-semibold text-slate-600">{profile?.email || '-'}</p>
              </div>
              <div className="rounded-[24px] bg-slate-900 px-5 py-5 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">Blockchain Identity</p>
                <p className="mt-2 font-mono text-[14px] break-all text-slate-100">{profile?.walletAddress || '-'}</p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <WalletCards className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">Saldo Wallet Tersambung</p>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${walletStatusTone}`}>
                        {walletStatusLabel}
                      </span>
                    </div>
                    <p className="mt-3 text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
                      {walletBalanceQuery.isLoading ? 'Memuat saldo...' : balanceLabel}
                    </p>
                    <p className="mt-2 font-mono text-[12px] break-all text-slate-500">
                      {balanceWalletAddress ?? 'Belum ada wallet profil yang dapat dibaca.'}
                    </p>
                    {walletBalanceQuery.isError ? (
                      <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-[13px] leading-6 text-red-700">
                        Saldo belum bisa dibaca. Cek koneksi wallet dan jaringan Base Sepolia.
                      </p>
                    ) : (
                      <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-[13px] leading-6 text-slate-600">
                        {walletHelperCopy}
                      </p>
                    )}
                  </div>
                </div>
              </div>
               
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        if (profile?.displayName) setDisplayName(profile.displayName)
                      }}
                      className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-[24px] bg-slate-100 text-[15px] font-semibold text-slate-600 transition hover:bg-slate-200"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleSaveProfile(); setIsEditing(false) }}
                      disabled={saveProfileMutation.isPending}
                      className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-[24px] bg-slate-900 text-[15px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {saveProfileMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetPasswordMutation.isPending}
                    className="inline-flex h-14 w-14 items-center justify-center rounded-[24px] bg-slate-200 text-slate-900 transition hover:bg-slate-300 disabled:opacity-50"
                    title="Ganti Kata Sandi"
                  >
                    <KeyRound className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <h2 className="text-[18px] font-semibold text-slate-900">Keamanan Sesi</h2>
            <div className="mt-8">
              <p className="text-[12px] uppercase tracking-[0.08em] text-slate-500">Sesi Aktif</p>
              <div className="mt-4 space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                        <session.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-bold text-slate-900">{session.device}</p>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Sesi Ini</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[13px] text-slate-500">
                          <Globe className="h-3.5 w-3.5" />
                          <span>{session.location}</span>
                          <span className="text-slate-300">•</span>
                          <span>{session.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {activeSessions.length === 0 && platform.sessions.map((session) => (
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
                  <div className="flex-1">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Jaringan (Network)</p>
                    <input
                      value={networkName}
                      onChange={(e) => setNetworkName(e.target.value)}
                      maxLength={100}
                      className="mt-2 w-full text-[18px] font-semibold text-slate-900 bg-transparent outline-none border-b border-transparent focus:border-slate-200 transition-colors"
                    />
                  </div>
                  <span className="rounded-xl bg-blue-50 px-3 py-1 text-[13px] font-semibold text-blue-600">
                    Live
                  </span>
                </div>
              </div>

              <div className="rounded-[24px] bg-white p-5">
                <div className="border-l-4 border-black pl-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Registry Address</p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={platformSettings?.registry_address || ''}
                      disabled
                      className="flex-1 bg-transparent font-mono text-[14px] text-slate-500 outline-none"
                    />
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] bg-slate-200 px-5 py-5">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Gas Price Limit (GWEI)</p>
                <div className="mt-4 flex items-center justify-between gap-4 text-[16px] text-slate-900">
                  <input
                    type="number"
                    value={gasLimit}
                    onChange={(e) => setGasLimit(Number(e.target.value))}
                    maxLength={10}
                    className="w-24 bg-transparent text-[34px] font-semibold tracking-[-0.04em] outline-none"
                  />
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
                  maxLength={100}
                  className="mt-3 h-14 w-full rounded-[20px] bg-white border border-slate-200 px-4 text-[18px] text-slate-900 outline-none transition focus:border-slate-900"
                />
              </label>

              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Bahasa Default</span>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="mt-3 h-14 w-full rounded-[20px] bg-white border border-slate-200 px-4 text-[18px] text-slate-900 outline-none transition focus:border-slate-900"
                >
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="English">English</option>
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
              if (platformSettings) {
                setPlatformName(platformSettings.platform_name)
                setLanguage(platformSettings.default_language)
                setNetworkName(platformSettings.network_name)
                setGasLimit(platformSettings.gas_limit)
              }
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
            disabled={updatePlatformMutation.isPending}
            onClick={handleSavePlatform}
          >
            {updatePlatformMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan Platform'}
          </SuperadminToolbarButton>
        </section>
      </ScrollReveal>
    </SuperadminShell>
  )
}
