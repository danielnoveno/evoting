'use client'

import { ArrowRight, Clock3, Info } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import type { Address } from 'viem'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { findElection, formatDateTime, useVoterStore } from '@/lib/voter-store'
import { generateCommitment, generateSalt, saveVoteCommitment } from '@/lib/vote-commitment-storage'
import { backendRuntimeConfig } from '@/lib/supabase/config'

export default function PilihKandidatPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { address } = useAccount()
  const { store, loading, actions } = useVoterStore()
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 8 })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [candidateToConfirm, setCandidateToConfirm] = useState<string | null>(null)

  const election = findElection(store, params.id)

  useEffect(() => {
    if (!election?.deadlineIso) return

    const target = new Date(election.deadlineIso).getTime()
    const updateTimer = () => {
      const now = new Date().getTime()
      const diff = target - now
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft({ hours, minutes, seconds })
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [election?.deadlineIso])

  if (loading || !store) {
    return (
      <VoterShell>
        <div className="h-[420px] animate-pulse rounded-xl bg-slate-200" />
      </VoterShell>
    )
  }

  if (!election) {
    return (
      <VoterShell>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-[20px] font-semibold text-slate-900">Pemilihan tidak ditemukan</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">Ruang voting yang Anda cari belum tersedia saat ini.</p>
          <Link href="/pemilih" className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]">
            Kembali ke Beranda
          </Link>
        </section>
      </VoterShell>
    )
  }

  const stepState = [
    { label: 'Pilih kandidat', description: 'Pilih satu nama', active: true },
    { label: 'Simpan pilihan', description: 'Kunci pilihanmu' },
    { label: 'Konfirmasi suara', description: 'Datang lagi nanti' },
    { label: 'Lihat hasil', description: 'Cek hasil akhir' },
  ]

  const handleSelectClick = (candidateId: string) => {
    setCandidateToConfirm(candidateId)
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (candidateToConfirm) {
      const candidate = election.candidates.find(c => c.id === candidateToConfirm)
      const candidateNumber = candidate ? parseInt(candidate.id.split('-').pop() || '0') : 0
      const deployedSpaceAddress = election.deployedSpaceAddress

      if (!address || !deployedSpaceAddress) {
        setConfirmOpen(false)
        window.alert('Sambungkan dompet dan pastikan ruang voting sudah memiliki alamat kontrak sebelum memilih kandidat.')
        return
      }

      actions.selectCandidate(election.id, candidateToConfirm)
      
      const salt = generateSalt()
      const commitment = generateCommitment(
        candidateNumber,
        salt,
        address as Address,
        deployedSpaceAddress as Address,
        backendRuntimeConfig.chainId,
      )
      saveVoteCommitment(election.id, {
        candidateId: candidateToConfirm,
        salt,
        commitment,
        timestamp: new Date().toISOString()
      })
      
      router.push(`/pemilih/pemilihan/${election.id}/commit`)
    }
    setConfirmOpen(false)
  }

  const formatTimeVal = (val: number) => String(val).padStart(2, '0')

  return (
    <VoterShell>
      <VoterStepper steps={stepState} />

      <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0F172A] p-6 text-white">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] items-center">
          <div>
            <span className="inline-flex rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-blue-400">
              STATUS SAAT INI
            </span>
            <h1 className="mt-3 text-[26px] font-bold tracking-tight text-white md:text-[32px]">Saatnya Memilih</h1>
            <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-slate-300">
              Pilih satu kandidat dulu. Setelah itu, sistem akan mengunci pilihanmu supaya belum terlihat oleh siapa pun sampai waktu penghitungan dibuka.
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end justify-center shrink-0 border-t border-slate-800 md:border-t-0 md:pl-6 pt-4 md:pt-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">WAKTU TERSISA</span>
            <div className="mt-2.5 flex items-center gap-1.5 font-mono">
              <div className="flex flex-col items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 border border-slate-800 text-[18px] font-bold text-white shadow-inner">
                  {formatTimeVal(timeLeft.hours)}
                </div>
                <span className="mt-1 text-[8px] font-semibold text-slate-500 uppercase tracking-widest">Jam</span>
              </div>
              <span className="text-white text-[16px] font-bold select-none mb-4">:</span>
              <div className="flex flex-col items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 border border-slate-800 text-[18px] font-bold text-white shadow-inner">
                  {formatTimeVal(timeLeft.minutes)}
                </div>
                <span className="mt-1 text-[8px] font-semibold text-slate-500 uppercase tracking-widest">Menit</span>
              </div>
              <span className="text-white text-[16px] font-bold select-none mb-4">:</span>
              <div className="flex flex-col items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 border border-slate-800 text-[18px] font-bold text-white shadow-inner">
                  {formatTimeVal(timeLeft.seconds)}
                </div>
                <span className="mt-1 text-[8px] font-semibold text-slate-500 uppercase tracking-widest">Detik</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-10 flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Kandidat Aktif</h2>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
            {election.title}
          </p>
        </div>
        <span className="mt-2 sm:mt-0 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 shadow-sm">
          {election.candidates.length} Kandidat Terdaftar
        </span>
      </section>

      <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-[12.5px] leading-relaxed text-blue-900">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-blue-700" />
          <p>
            Setelah memilih, jangan ganti browser atau hapus data browser. Nanti kamu perlu membuka halaman ini lagi untuk mengesahkan suara.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {election.candidates.map((candidate, index) => {
          return (
            <article
              key={candidate.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-slate-300"
            >
              <div>
                <div className="relative overflow-hidden bg-slate-50 border-b border-slate-100">
                  <div className="flex h-[250px] w-full items-center justify-center bg-slate-200 text-[36px] font-semibold text-slate-600 transition-transform duration-500 group-hover:scale-105">
                    {candidate.name.slice(0, 2).toUpperCase()}
                  </div>
                   <div className="absolute top-3 left-3 rounded border border-white/10 bg-black/85 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                    K0{index + 1}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-[17px] font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                    {candidate.name}
                  </h3>
                  <p className="mt-1 font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {candidate.faculty}
                  </p>

                  <div className="mt-4 space-y-3.5">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">Visi</h4>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-slate-700 line-clamp-3">
                        {candidate.vision}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">Misi</h4>
                      <ul className="mt-1.5 space-y-1">
                        {candidate.mission.map((item, mIndex) => (
                          <li key={mIndex} className="text-[12px] leading-relaxed text-slate-600 flex items-start gap-1.5">
                            <span className="text-slate-400 font-bold select-none shrink-0">•</span>
                            <span className="line-clamp-2">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  type="button"
                  onClick={() => handleSelectClick(candidate.id)}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#0F172A] px-4 text-[13px] font-bold text-white transition-all hover:bg-[#1E293B] focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none active:scale-[0.98] shadow-sm"
                  aria-label={`Pilih kandidat ${candidate.name}`}
                >
                  Pilih Kandidat
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          )
        })}
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <Clock3 className="h-4.5 w-4.5 shrink-0 text-slate-400" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-500">Batas waktu memilih</p>
            <p className="mt-0.5 text-[13.5px] font-semibold text-slate-900">
              {formatDateTime(election.deadlineIso)} WIB
            </p>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Pilih kandidat ini?"
        description="Pastikan namanya sudah benar. Setelah ini, pilihanmu akan disiapkan untuk disimpan dengan aman."
        confirmLabel="Ya, Pilih Kandidat"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </VoterShell>
  )
}
