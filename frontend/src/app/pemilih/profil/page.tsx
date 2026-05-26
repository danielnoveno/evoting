'use client'

import { Camera, Copy, Pencil, ShieldCheck } from 'lucide-react'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { ScrollReveal } from '@/components/public/parallax'
import { useToast } from '@/components/ui/toast-provider'
import { VoterShell } from '@/components/voter/voter-shell'
import { useVoterStore } from '@/lib/voter-store'
import { useProfileByWallet, useSaveCurrentProfile } from '@/hooks/use-profile'
import { mapProfileToViewModel } from '@/lib/mappers/profileMapper'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'

export default function VoterProfilePage() {
  const { showToast } = useToast()
  const { store, loading, actions } = useVoterStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const saveProfile = useSaveCurrentProfile()
  const profileQuery = useProfileByWallet(store?.profile.wallet)

  const resolvedProfile = mapProfileToViewModel(profileQuery.data ?? null, {
    displayName: store?.profile.name ?? 'Pemilih',
    email: store?.profile.email ?? '',
    walletAddress: store?.profile.wallet ?? '',
    bio: store?.profile.bio ?? '',
    avatarUrl: store?.profile.avatarUrl ?? null,
  })

  useEffect(() => {
    setDisplayName(resolvedProfile.displayName)
    setBio(resolvedProfile.bio)
  }, [resolvedProfile.bio, resolvedProfile.displayName])

  if (loading || !store) {
    return <VoterShell><div className="h-[420px] animate-pulse rounded-[32px] bg-slate-200" /></VoterShell>
  }

  const handleCopyWallet = async () => {
    await navigator.clipboard.writeText(resolvedProfile.walletAddress)
    showToast({ tone: 'success', title: 'Alamat berhasil disalin', description: 'Wallet pemilih sudah disalin ke clipboard.' })
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast({ tone: 'error', title: 'Format file tidak didukung', description: 'Silakan pilih file gambar JPG atau PNG.' })
      return
    }

    const photoUrl = URL.createObjectURL(file)
    actions.updateProfile({ avatarUrl: photoUrl })
    showToast({ tone: 'success', title: 'Foto profil diperbarui', description: 'Pratinjau foto baru berhasil dimuat.' })
  }

  const handleSave = () => {
    actions.updateProfile({ name: displayName, bio })

    if (!store?.profile.wallet) {
      showToast({ tone: 'success', title: 'Perubahan disimpan', description: 'Profil pemilih berhasil diperbarui.' })
      return
    }

    saveProfile.mutate(
      {
        walletAddress: store.profile.wallet,
        displayName,
        email: resolvedProfile.email,
        avatarUrl: store.profile.avatarUrl,
      },
      {
        onSuccess: () => {
          showToast({ tone: 'success', title: 'Perubahan disimpan', description: 'Profil pemilih berhasil diperbarui.' })
        },
        onError: (error) => {
          showToast({
            tone: 'error',
            title: 'Gagal menyimpan profil',
            description: getRepositoryErrorMessage(error, 'Perubahan lokal tersimpan, tetapi sinkronisasi backend belum aktif.'),
          })
        },
      },
    )
  }

  return (
    <VoterShell>
      <ScrollReveal variant="fade-up" duration={800}>
      <section className="max-w-4xl">
        {profileQuery.error ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800" role="status">
            {getRepositoryErrorMessage(profileQuery.error, 'Profil live belum tersedia. Halaman masih memakai data transisi lokal.')}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          <span>Portal Pemilih</span>
          <span>›</span>
          <span>Keamanan</span>
          <span>›</span>
          <span className="text-slate-900">Pengaturan Profil</span>
        </div>
        <h1 className="mt-5 text-[34px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[44px] md:text-[56px]">Sunting Profil</h1>
        <p className="mt-4 text-[16px] leading-8 text-slate-800 md:text-[18px] md:leading-9">Kelola identitas digital Anda dalam ekosistem voting. Pastikan informasi tetap jelas, rapi, dan mudah diverifikasi.</p>
      </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={100} duration={800}>
      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(320px,0.64fr)_minmax(0,1.36fr)]">
        <div className="space-y-6">
          <article className="rounded-[32px] border border-slate-100 bg-white p-8 text-center">
            <div className="relative mx-auto h-[136px] w-[136px]">
              <img src={resolvedProfile.avatarUrl ?? store.profile.avatarUrl} alt={resolvedProfile.displayName} className="h-full w-full rounded-full object-cover ring-4 ring-white" />
              <button type="button" onClick={() => fileRef.current?.click()} className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full bg-black text-white hover:bg-slate-900">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h2 className="mt-6 text-[24px] font-semibold text-slate-900">Foto Profil</h2>
            <p className="mt-3 text-[15px] leading-8 text-slate-800">Gunakan foto yang jelas untuk mempermudah identifikasi saat proses voting berlangsung.</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button type="button" onClick={() => fileRef.current?.click()} className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-100 px-5 text-[15px] font-medium text-slate-900 hover:bg-slate-200">
              Ganti Foto
            </button>
          </article>

          <article className="rounded-[32px] bg-[#161f35] p-8 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-6 text-[28px] font-semibold text-white">Identitas Terverifikasi</h2>
            <p className="mt-4 text-[15px] leading-8 text-slate-300">Profil Anda terhubung dengan identitas kampus dan dijaga oleh proses verifikasi wallet VoteChain.</p>
          </article>
        </div>

          <article className="rounded-[32px] border border-slate-100 bg-white p-6 sm:p-8">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-700">Informasi personal</p>

          <div className="mt-8 space-y-7">
            <div>
              <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Nama tampilan (display name)</label>
              <div className="relative">
                 <input value={displayName || resolvedProfile.displayName} onChange={(event) => setDisplayName(event.target.value)} className="h-14 w-full rounded-2xl bg-slate-100 px-4 pr-12 text-[16px] text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-slate-300 sm:px-5" />
                <Pencil className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Alamat email terdaftar</label>
               <input value={resolvedProfile.email} disabled className="h-14 w-full cursor-not-allowed rounded-2xl bg-slate-100 px-4 text-[16px] text-slate-500 outline-none sm:px-5" />
              <p className="mt-3 text-[12px] leading-6 text-slate-400">Email dikunci untuk keamanan akun. Hubungi administrator jika ada perubahan data vital.</p>
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
               <textarea value={bio || resolvedProfile.bio} onChange={(event) => setBio(event.target.value)} rows={4} className="w-full rounded-2xl bg-slate-100 p-4 text-[16px] leading-8 text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-slate-300 sm:p-5" />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-8 sm:flex-row sm:justify-end">
             <button type="button" onClick={() => { setDisplayName(resolvedProfile.displayName); setBio(resolvedProfile.bio) }} className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-100 px-6 text-[14px] font-medium text-slate-700 hover:bg-slate-200">
               Batalkan
             </button>
             <button type="button" onClick={handleSave} disabled={saveProfile.isPending} className="inline-flex h-12 items-center justify-center rounded-2xl bg-black px-6 text-[14px] font-medium text-white hover:bg-slate-900 disabled:opacity-60">
               {saveProfile.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
             </button>
          </div>
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
