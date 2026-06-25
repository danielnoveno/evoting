'use client'

import { Camera, Copy, Lock, ShieldCheck } from 'lucide-react'
import { ChangeEvent, useRef } from 'react'
import { ScrollReveal } from '@/components/public/parallax'
import { useToast } from '@/components/ui/toast-provider'
import { VoterShell } from '@/components/voter/voter-shell'
import { useVoterStore } from '@/lib/voter-store'
import { useProfileByWallet } from '@/hooks/use-profile'
import { mapProfileToViewModel } from '@/lib/mappers/profileMapper'
import { useProfileImageUpload } from '@/hooks/use-profile-upload'

export default function VoterProfilePage() {
  const { showToast } = useToast()
  const { store, loading } = useVoterStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const profileQuery = useProfileByWallet(store?.profile.wallet)
  const uploadAvatarMutation = useProfileImageUpload()

  const resolvedProfile = mapProfileToViewModel(profileQuery.data ?? null, {
    displayName: store?.profile.name ?? 'Pemilih',
    email: store?.profile.email ?? '',
    walletAddress: store?.profile.wallet ?? '',
    bio: store?.profile.bio ?? '',
    avatarUrl: store?.profile.avatarUrl ?? null,
  })

  if (loading || !store) {
    return <VoterShell><div className="h-[420px] animate-pulse rounded-[32px] bg-slate-200" /></VoterShell>
  }

  const handleCopyWallet = async () => {
    await navigator.clipboard.writeText(resolvedProfile.walletAddress)
    showToast({ tone: 'success', title: 'Alamat berhasil disalin', description: 'Wallet pemilih sudah disalin ke clipboard.' })
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profileQuery.data?.userId) return

    if (!file.type.startsWith('image/')) {
      showToast({ tone: 'error', title: 'Format file tidak didukung', description: 'Silakan pilih file gambar JPG atau PNG.' })
      return
    }

    uploadAvatarMutation.mutate(
      { file, userId: profileQuery.data.userId },
      {
        onSuccess: (newUrl) => {
          showToast({ tone: 'success', title: 'Foto profil diperbarui', description: 'Perubahan foto profil berhasil disimpan.' })
        },
        onError: (error) => {
          showToast({
            tone: 'error',
            title: 'Gagal mengunggah foto',
            description: error instanceof Error ? error.message : 'Terjadi kesalahan.',
          })
        },
      }
    )
  }

  const photoUrl = resolvedProfile.avatarUrl ?? store.profile.avatarUrl

  return (
    <VoterShell>
      <ScrollReveal variant="fade-up" duration={800}>
      <section className="max-w-4xl">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          <span>Portal Pemilih</span>
          <span>›</span>
          <span className="text-slate-900">Profil Saya</span>
        </div>
        <h1 className="mt-5 text-[34px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[44px] md:text-[56px]">Profil Saya</h1>
        <p className="mt-4 text-[16px] leading-8 text-slate-800 md:text-[18px] md:leading-9">Informasi profil Anda dalam sistem voting. Untuk perubahan data lainnya, hubungi administrator.</p>
      </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={100} duration={800}>
      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(320px,0.64fr)_minmax(0,1.36fr)]">
        <div className="space-y-6">
          {/* Photo Card */}
          <article className="rounded-[32px] border border-slate-100 bg-white p-8 text-center">
            <div className="relative mx-auto h-[136px] w-[136px]">
              <div className="h-full w-full rounded-full overflow-hidden ring-4 ring-white flex items-center justify-center bg-slate-100">
                {uploadAvatarMutation.isPending ? (
                  <div className="flex items-center justify-center bg-slate-900/50 w-full h-full">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                  </div>
                ) : photoUrl ? (
                  <img src={photoUrl} alt={resolvedProfile.displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-slate-300">VM</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadAvatarMutation.isPending}
                className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full bg-black text-white hover:bg-slate-900 disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h2 className="mt-6 text-[24px] font-semibold text-slate-900">Foto Profil</h2>
            <p className="mt-3 text-[15px] leading-8 text-slate-800">Klik ikon kamera atau tombol di bawah untuk mengganti foto profil Anda.</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadAvatarMutation.isPending}
              className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-100 px-5 text-[15px] font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50"
            >
              {uploadAvatarMutation.isPending ? 'Mengunggah...' : 'Ganti Foto'}
            </button>
          </article>

          <article className="rounded-[32px] bg-[#161f35] p-8 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-6 text-[28px] font-semibold text-white">Identitas Terverifikasi</h2>
            <p className="mt-4 text-[15px] leading-8 text-slate-300">Profil Anda terhubung dengan identitas kampus dan dijaga oleh proses verifikasi wallet Votein.</p>
          </article>
        </div>

        {/* Read-only info */}
        <article className="rounded-[32px] border border-slate-100 bg-white p-6 sm:p-8">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-700">Informasi personal</p>

          <div className="mt-8 space-y-7">
            <div>
              <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Nama tampilan</label>
              <div className="relative">
                <input value={resolvedProfile.displayName} disabled readOnly className="h-14 w-full cursor-not-allowed rounded-2xl bg-slate-100 px-5 pr-12 text-[16px] text-slate-600 outline-none opacity-70" />
                <Lock className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Alamat email terdaftar</label>
              <input value={resolvedProfile.email} disabled readOnly className="h-14 w-full cursor-not-allowed rounded-2xl bg-slate-100 px-4 text-[16px] text-slate-500 outline-none sm:px-5" />
              <p className="mt-3 text-[12px] leading-6 text-slate-400">Email dikunci. Hubungi administrator jika ada perubahan data vital.</p>
            </div>

            <div>
              <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Hash identitas (wallet address)</label>
              <div className="flex h-14 items-center overflow-hidden rounded-2xl bg-slate-100">
                <div className="h-full w-1.5 bg-black" />
                <div className="flex-1 truncate px-3 font-mono text-[12px] text-slate-800 sm:px-4 sm:text-[14px]">{resolvedProfile.walletAddress}</div>
                <button type="button" onClick={handleCopyWallet} className="px-3 text-slate-500 hover:text-slate-900 sm:px-5" aria-label="Salin alamat wallet pemilih">
                  <Copy className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Bio singkat</label>
              <textarea value={resolvedProfile.bio} disabled readOnly rows={4} className="w-full cursor-not-allowed rounded-2xl bg-slate-100 p-5 text-[16px] leading-8 text-slate-500 outline-none opacity-70" />
            </div>
          </div>

          <p className="mt-8 rounded-2xl bg-slate-50 p-4 text-[13px] leading-6 text-slate-500">
            Untuk mengubah nama, email, atau bio, silakan hubungi administrator organisasi Anda.
          </p>
        </article>
      </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={150} duration={800}>
      <section className="mt-6 rounded-[32px] bg-slate-100 p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[24px] font-semibold text-slate-900">Kebijakan Privasi & Enkripsi</h3>
            <p className="mt-3 text-[15px] leading-8 text-slate-800">Data Anda dilindungi dengan enkripsi end-to-end. Hanya nama tampilan yang muncul pada dashboard partisipasi pemilih, sedangkan identitas formal tetap disamarkan pada blockchain.</p>
          </div>
        </div>
      </section>
      </ScrollReveal>
    </VoterShell>
  )
}
