'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Lock, ShieldCheck } from 'lucide-react'
import { useAccount } from 'wagmi'

import { VoterFooterMeta } from '@/components/voter/VoterFooterMeta'
import { VoterShell } from '@/components/voter/VoterShell'
import {
  DEFAULT_VOTER_NAME,
  VOTER_PROFILE_UPDATED_EVENT,
  getVoterProfileStorageKey,
  parseSavedVoterSetting,
} from '@/lib/voter-profile'

export default function VoterProfileEditPage() {
  const { address } = useAccount()
  const walletId = address?.toLowerCase() ?? 'demo-voter'
  const profileKey = useMemo(() => getVoterProfileStorageKey(walletId), [walletId])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState(DEFAULT_VOTER_NAME)
  const [email] = useState('budi.santoso@email.com')
  const [bio, setBio] = useState('Warga negara yang aktif dalam partisipasi demokrasi digital.')
  const [photoUrl, setPhotoUrl] = useState('')
  const [notice, setNotice] = useState('')

  const fullWallet = address ?? '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'

  useEffect(() => {
    const saved = parseSavedVoterSetting(localStorage.getItem(profileKey))
    if (!saved) return

    setDisplayName(saved.displayName)
    setPhotoUrl(saved.photoUrl)
  }, [profileKey])

  const onPickFile = () => fileInputRef.current?.click()

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setNotice('File harus berupa gambar (PNG/JPG/WebP).')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') return

      setPhotoUrl(result)
      setNotice('Foto baru siap disimpan.')
    }
    reader.readAsDataURL(file)
  }

  const onCopyWallet = async () => {
    await navigator.clipboard.writeText(fullWallet)
    setNotice('Alamat wallet tersalin.')
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      displayName,
      photoUrl,
      highContrast: false,
      updatedAt: Date.now(),
    }

    localStorage.setItem(profileKey, JSON.stringify(payload))
    window.dispatchEvent(new Event(VOTER_PROFILE_UPDATED_EVENT))
    setNotice('Perubahan profil berhasil disimpan.')
  }

  return (
    <VoterShell active="beranda">
      <section className="space-y-10">
        <div>
          <p className="font-label text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Portal Pemilih › Keamanan › Pengaturan Profil</p>
          <h1 className="mt-3 text-6xl font-semibold leading-tight text-slate-900">Sunting Profil</h1>
          <p className="mt-3 max-w-5xl text-2xl leading-relaxed text-slate-600">
            Kelola identitas digital Anda dalam ekosistem blockchain. Pastikan data Anda tetap terenkripsi dan aman.
          </p>
        </div>

        <form className="grid gap-6 xl:grid-cols-[1fr_1.4fr]" onSubmit={onSubmit}>
          <div className="space-y-6">
            <article className="rounded-[30px] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
              <div className="mx-auto mb-6 flex h-48 w-48 items-center justify-center overflow-hidden rounded-full border-4 border-slate-100 bg-slate-200">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="Foto profil" className="h-full w-full object-cover" src={photoUrl} />
                ) : (
                  <span className="text-5xl font-semibold text-slate-600">BS</span>
                )}
              </div>

              <h2 className="text-5xl font-semibold text-slate-900">Foto Profil</h2>
              <p className="mt-3 text-2xl leading-relaxed text-slate-600">
                Gunakan foto wajah yang jelas untuk mempermudah verifikasi biometrik jika diperlukan.
              </p>

              <input accept="image/*" className="hidden" onChange={onFileChange} ref={fileInputRef} type="file" />

              <button className="mt-8 h-16 w-full rounded-2xl bg-slate-200 text-2xl font-semibold text-slate-800" onClick={onPickFile} type="button">
                Ganti Foto
              </button>
            </article>

            <article className="rounded-[30px] bg-gradient-to-b from-[#131B2E] to-[#0F172A] p-8 text-white">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-5xl font-semibold">Identitas Terverifikasi</h3>
              <p className="mt-3 text-2xl leading-relaxed text-slate-300">Profil Anda terhubung dengan identitas nasional dan dijamin oleh sistem blockchain.</p>
            </article>
          </div>

          <article className="rounded-[30px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-label text-lg font-semibold uppercase tracking-[0.12em] text-slate-700">Informasi Personal</h2>

            <div className="mt-8 space-y-7">
              <label className="block">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Nama Tampilan (Display Name)</span>
                <input
                  className="mt-3 h-20 w-full rounded-2xl bg-slate-200 px-6 text-4xl text-slate-800 focus:outline-none"
                  onChange={(event) => setDisplayName(event.target.value)}
                  value={displayName}
                />
              </label>

              <label className="block">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Alamat Email Terdaftar</span>
                <input className="mt-3 h-20 w-full rounded-2xl bg-slate-200 px-6 text-4xl text-slate-500" disabled value={email} />
                <p className="mt-2 text-sm text-slate-500">Email dikunci untuk keamanan akun. Hubungi administrator untuk perubahan data vital.</p>
              </label>

              <div>
                <span className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Hash Identitas (Wallet Address)</span>
                <div className="mt-3 flex h-20 items-center justify-between gap-3 rounded-2xl border-l-4 border-black bg-slate-200 px-6">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-2xl text-slate-700">{fullWallet}</p>
                  <button className="rounded p-1 text-slate-600 hover:bg-slate-300" onClick={onCopyWallet} type="button">
                    <Copy className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <label className="block">
                <span className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Bio Singkat</span>
                <textarea
                  className="mt-3 min-h-[160px] w-full rounded-2xl bg-slate-200 px-6 py-5 text-4xl leading-relaxed text-slate-800 focus:outline-none"
                  onChange={(event) => setBio(event.target.value)}
                  value={bio}
                />
              </label>
            </div>

            {notice ? <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-lg font-medium text-blue-700">{notice}</p> : null}

            <div className="mt-8 flex flex-wrap justify-end gap-4 border-t border-slate-200 pt-7">
              <button className="h-16 rounded-2xl px-8 text-2xl font-semibold text-slate-600" type="button">
                Batalkan
              </button>
              <button className="h-16 rounded-2xl bg-gradient-to-r from-black via-[#0f1628] to-[#162544] px-8 text-2xl font-semibold text-white" type="submit">
                Simpan Perubahan
              </button>
            </div>
          </article>
        </form>

        <article className="rounded-[30px] border border-slate-200 bg-white p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Lock className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-4xl font-semibold text-slate-900">Kebijakan Privasi & Enkripsi</h3>
              <p className="mt-2 text-2xl leading-relaxed text-slate-700">
                Data Anda dilindungi dengan enkripsi end-to-end. Hanya nama tampilan yang akan muncul secara publik pada dashboard partisipasi pemilih. Identitas nasional Anda tetap anonim dalam blockchain.
              </p>
            </div>
          </div>
        </article>

        <VoterFooterMeta />
      </section>
    </VoterShell>
  )
}
