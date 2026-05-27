'use client'

import { ArrowRight, CircleCheck, ExternalLink, Hourglass, Fingerprint, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { VoterPageSkeleton, VoterShell } from '@/components/voter/voter-shell'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { useToast } from '@/components/ui/toast-provider'
import {
  getElectionViewState,
  formatNumber,
  getElectionProgress,
  getPhaseLabel,
  getRecentLogs,
  resolveElectionAction,
  sortDashboardElections,
  useVoterStore,
  basescanTxUrl,
  formatWallet,
} from '@/lib/voter-store'

const logToneClassName = {
  success: 'bg-emerald-50 text-emerald-700',
  info: 'bg-blue-50 text-blue-700',
  warning: 'bg-amber-50 text-amber-700',
} as const

const logToneIcon = {
  success: CircleCheck,
  info: ExternalLink,
  warning: Hourglass,
} as const

export default function VoterDashboardPage() {
  const { store, loading } = useVoterStore()

  if (loading || !store) {
    return (
      <VoterShell>
        <VoterPageSkeleton />
      </VoterShell>
    )
  }

  const elections = sortDashboardElections(store.elections)
  if (elections.length === 0) {
    return (
      <VoterShell>
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h1 className="text-[24px] font-semibold text-slate-900">Belum ada ruang voting</h1>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-7 text-slate-600">
            Tidak ada pemilihan dari Supabase yang dapat ditampilkan untuk portal pemilih. Jalankan query seed atau deploy space terlebih dahulu.
          </p>
          <Link href="/pemilihan" className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]">
            Lihat Daftar Publik
          </Link>
        </section>
      </VoterShell>
    )
  }
  const featuredElection = elections.find((election) => election.phase === 'commit' && !election.commitProof)
    ?? elections.find((election) => election.phase === 'reveal' && !election.revealProof)
    ?? elections[0]
  const secondaryElection = elections.find((election) => election.id !== featuredElection.id) ?? featuredElection
  const logs = getRecentLogs(store)
  const secondaryAction = resolveElectionAction(secondaryElection)
  const featuredViewState = getElectionViewState(featuredElection)

  const participated = store.elections.filter((election) => election.commitProof || election.revealProof).length
  const pendingReveal = store.elections.filter((election) => getElectionViewState(election).canReveal).length
  const completed = store.elections.filter((election) => election.phase === 'ended').length
  const participationRate = Math.round((participated / store.elections.length) * 100)
  const featuredLabel = 'Pemilihan aktif'

  return (
    <VoterShell>
      <ScrollReveal variant="fade-up" duration={800}>
        <section>
          <h1 className="mt-3 text-[28px] font-semibold text-slate-900 sm:text-[34px] md:text-[40px]">Ruang Voting Saya</h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-7 text-slate-800 md:text-[16px] md:leading-8">
            Pantau ruang voting yang sedang aktif, bukti komitmen yang sudah tersimpan, dan langkah berikutnya untuk menyelesaikan konfirmasi suara.
          </p>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={100} duration={800}>
        <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.72fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-6 transition-colors duration-300 hover:border-slate-300">
          {(() => {
            const isCommitPhase = featuredViewState.nextAction === 'commit'
            const isRevealPhase = featuredViewState.nextAction === 'reveal'
            const isEndedPhase = featuredViewState.nextAction === 'results'

            return (
              <>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{featuredLabel}</p>
                    <h2 className="mt-4 text-[22px] font-semibold text-slate-900 md:text-[28px] tracking-tight">{featuredElection.title}</h2>
                    <p className="mt-3 max-w-3xl text-[14px] leading-7 text-slate-700">{featuredElection.summary}</p>
                    
                    {isCommitPhase && (
                      <p className="mt-4 text-[13px] font-medium text-slate-800 bg-blue-50/50 border border-blue-100 rounded-lg p-3 leading-relaxed">
                        💡 <span className="font-semibold text-blue-900">Langkah pertama:</span> Pilih satu kandidat untuk menyiapkan komitmen suara Anda. Setelah itu Anda akan masuk ke tahap kirim komitmen.
                      </p>
                    )}

                    {isRevealPhase && (
                      <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
                        <p className="text-[13px] font-medium text-amber-900 flex items-center gap-2">
                          <Fingerprint className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                          <span className="font-semibold">Komitmen suara Anda sudah tersimpan.</span>
                        </p>
                        <div className="font-mono text-[11px] text-slate-800 bg-white border border-amber-100 rounded-lg p-2.5 break-all leading-relaxed shadow-inner">
                          <span className="font-semibold text-slate-400 select-none">HASH KOMITMEN:</span> {featuredElection.commitmentHash}
                        </div>
                        <p className="text-[12px] leading-relaxed text-slate-700">
                          💡 <span className="font-semibold text-amber-900">Langkah berikutnya:</span> Konfirmasi suara Anda menggunakan browser dan perangkat yang sama agar kode rahasia dapat terbaca dengan benar.
                        </p>
                      </div>
                    )}

                    {isEndedPhase && (
                      <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                        <p className="text-[13px] font-medium text-emerald-900 flex items-center gap-2">
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold">Konfirmasi suara selesai. Pilihan Anda sudah masuk ke hasil akhir.</span>
                        </p>
                        {featuredElection.revealProof && (
                          <div className="flex flex-col gap-1.5 text-[12px] text-slate-600 bg-white/70 border border-emerald-100 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Nomor Block:</span>
                              <strong className="font-mono text-slate-900">#{featuredElection.revealProof.blockNumber}</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Tx Hash:</span>
                              <a 
                                href={basescanTxUrl(featuredElection.revealProof.txHash)} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-blue-600 hover:text-blue-800 font-mono text-[11px] hover:underline inline-flex items-center gap-0.5"
                                aria-label="Lihat transaksi reveal di Basescan"
                              >
                                {formatWallet(featuredElection.revealProof.txHash)}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        )}
                        <p className="text-[12px] leading-relaxed text-slate-700">
                          🎉 Terima kasih atas partisipasi Anda dalam menjaga proses voting kampus yang tertib dan transparan.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {isCommitPhase && (
                    <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700 border border-blue-100 shrink-0">
                      Sedang Berlangsung
                    </span>
                  )}
                    {isRevealPhase && (
                      <span className="inline-flex w-fit rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700 border border-amber-200 shrink-0">
                        Fase Konfirmasi
                      </span>
                    )}
                  {isEndedPhase && (
                    <span className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 border border-emerald-200 shrink-0">
                      Selesai
                    </span>
                  )}
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Waktu tersisa</p>
                    <p className="mt-2 text-[18px] font-semibold text-slate-900">
                      {new Date(featuredElection.deadlineIso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · {new Date(featuredElection.deadlineIso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total partisipan</p>
                    <p className="mt-2 text-[18px] font-semibold text-slate-900">{formatNumber(featuredElection.totalParticipants)} pemilih terdaftar</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {isCommitPhase && (
                    <Link
                      href={`/pemilih/pemilihan/${featuredElection.id}/pilih-kandidat`}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#0F172A] px-6 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B] focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none sm:w-auto"
                      aria-label="Mulai pilih kandidat"
                    >
                      Pilih Kandidat
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                  {isRevealPhase && (
                    <Link
                      href={`/pemilih/pemilihan/${featuredElection.id}/reveal`}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-amber-600 px-6 text-[13px] font-semibold text-white transition-colors hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none sm:w-auto"
                      aria-label="Mulai konfirmasi suara Anda"
                    >
                      Konfirmasi Suara
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                  {isEndedPhase && (
                    <Link
                      href={`/pemilih/pemilihan/${featuredElection.id}/hasil`}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none sm:w-auto"
                      aria-label="Lihat hasil akhir pemilihan"
                    >
                      Lihat Hasil Akhir
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                  <Link 
                    href="/pemilih/bukti-saya" 
                    className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-6 text-[13px] font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:outline-none sm:w-auto"
                    aria-label="Lihat arsip bukti digital Anda"
                  >
                    Lihat Bukti Saya
                  </Link>
                </div>
              </>
            )
          })()}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-800">
              {getPhaseLabel(secondaryElection.phase)}
            </span>
            <span className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Ruang berikutnya</span>
          </div>
          <h3 className="mt-5 text-[20px] font-semibold leading-tight text-slate-900 md:text-[24px]">{secondaryElection.title}</h3>
          <p className="mt-3 text-[14px] leading-7 text-slate-800">{secondaryElection.summary}</p>

          <div className="mt-8">
            <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.06em] text-slate-400">
              <span>Progress</span>
              <span>{getElectionProgress(secondaryElection)}% partisipasi</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-[#0F172A]" style={{ width: `${getElectionProgress(secondaryElection)}%` }} />
            </div>
          </div>

          <Link href={secondaryAction.href} className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-900 hover:bg-slate-50">
            {secondaryAction.label}
          </Link>
        </article>
      </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={150} duration={800}>
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[20px] font-semibold text-slate-900">Aktivitas Voting Terkini</h2>
              <p className="mt-2 text-[14px] leading-7 text-slate-800">Pantau komitmen suara, pembukaan fase konfirmasi, dan bukti transaksi yang sudah tersimpan.</p>
            </div>
            <Link href="/pemilih/bukti-saya" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-700 hover:text-slate-900 sm:text-right">
              Eksplorasi semua
            </Link>
          </div>

        <div className="mt-8 space-y-4">
          {logs.map((log) => {
            const Icon = logToneIcon[log.tone]

            return (
               <article key={log.id} className="rounded-lg border border-slate-100 bg-slate-50 px-5 py-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${logToneClassName[log.tone]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold text-slate-900 md:text-[18px]">{log.title}</p>
                      <p className="mt-1 break-words text-[13px] text-slate-700">{log.detail}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${logToneClassName[log.tone]}`}>
                      {log.tone === 'success' ? 'Selesai' : log.tone === 'info' ? 'Berlangsung' : 'Menunggu'}
                    </span>
                    <span className="text-[13px] text-slate-700">{log.timeLabel}</span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
      </ScrollReveal>

      <StaggerContainer stagger={120} variant="fade-up" className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,0.8fr)_minmax(0,0.82fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Hourglass className="h-5 w-5" />
          </div>
          <span className="mt-6 inline-flex rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-800 border border-amber-200">Menunggu</span>
          <h3 className="mt-5 text-[24px] font-semibold text-slate-900">{elections.find((election) => election.phase === 'registration')?.title ?? 'Belum ada pemilihan lain'}</h3>
          <p className="mt-4 text-[16px] leading-8 text-slate-800">
            Pendaftaran kandidat masih dibuka. Voting akan dimulai setelah admin membuka fase commit sesuai urutan resmi.
          </p>
          <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-5 text-[14px]">
            <span className="text-slate-400">Status</span>
            <span className="font-semibold text-slate-900">Pra-registrasi</span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-100 bg-slate-50 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">Partisipasi Anda</p>
          <div className="mt-6 flex items-end gap-3">
            <p className="text-[52px] font-semibold leading-none tracking-[-0.05em] text-slate-900 sm:text-[64px]">{participationRate}%</p>
            <p className="pb-2 text-[16px] font-semibold text-emerald-600 sm:text-[18px]">+12%</p>
          </div>
          <p className="mt-4 max-w-[24ch] text-[15px] leading-7 text-slate-800">Dari total ruang voting yang Anda ikuti tahun ini.</p>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {store.elections.slice(0, 3).map((election, index) => (
                <div key={election.id} className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-100 text-[12px] font-semibold text-white ${index === 0 ? 'bg-slate-900' : index === 1 ? 'bg-slate-700' : 'bg-slate-500'}`}>
                  {index + 1}
                </div>
              ))}
            </div>
            <span className="rounded-full bg-black px-3 py-1 text-[12px] font-semibold text-white">+{Math.max(store.elections.length - 3, 0)}</span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-[20px] font-semibold text-slate-900 md:text-[24px]">Butuh Bantuan?</h3>
          <p className="mt-3 text-[14px] leading-7 text-slate-800">
            Panduan langkah demi langkah untuk pilih kandidat, kirim komitmen, konfirmasi suara, hingga verifikasi hasil dapat diakses kapan saja.
          </p>
          <Link href="/pemilih/bantuan" className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-slate-900 hover:text-slate-800">
            Buka Pusat Bantuan
            <ExternalLink className="h-4 w-4" />
          </Link>
        </article>
      </StaggerContainer>

      <StaggerContainer stagger={100} variant="fade-up" className="mt-6 grid gap-6 md:grid-cols-3">
         {[
           ['Space diikuti', store.elections.length],
           ['Menunggu konfirmasi', pendingReveal],
           ['Bukti final', completed],
         ].map(([label, value]) => (
           <article key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
             <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">{label}</p>
             <p className="mt-3 text-[24px] font-semibold leading-none text-slate-900">{value}</p>
           </article>
         ))}
       </StaggerContainer>
    </VoterShell>
  )
}
