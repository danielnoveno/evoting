'use client'

import { ArrowRight, Download } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ScrollReveal, ParallaxLayer, FloatingShape, StaggerContainer } from '@/components/public/parallax'
import { listPublicElections } from '@/lib/repositories/electionRepository'
import type { PublicElectionRecord } from '@/lib/repositories/types'
import { shortenHash } from '@/lib/voter-helpers'

function formatFinishedDate(value: string | null) {
  if (!value) return 'Tanggal selesai belum diatur'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(new Date(value)) + ' WIB'
}

function formatScheduleDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(new Date(value)) + ' WIB'
}

function EmptyElectionCard({ message }: { message: string }) {
  return (
    <article className="rounded-[28px] border border-dashed border-slate-300 bg-white p-7 text-[14px] leading-7 text-slate-500">
      {message}
    </article>
  )
}

function ElectionDescription({ election }: { election: PublicElectionRecord }) {
  return <>{election.description ?? `Pemilihan ${election.organizationName ?? 'organisasi'} yang datanya dimuat dari Supabase.`}</>
}

export function PemilihanSections() {
  const electionsQuery = useQuery({
    queryKey: ['public', 'elections'],
    queryFn: listPublicElections,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const elections = electionsQuery.data ?? []
  const activeElections = elections.filter((item) => item.phase === 'commit' || item.phase === 'reveal')
  const upcoming = elections.filter((item) => item.phase === 'registration')
  const finished = elections.filter((item) => item.phase === 'ended')

  return (
    <section className="public-section relative overflow-hidden">
      {/* Floating decorative shapes */}
      <FloatingShape
        speed={-0.04}
        className="right-[-100px] top-[60px] h-[280px] w-[280px] rounded-full bg-gradient-to-bl from-blue-100/30 to-indigo-50/20 blur-3xl"
      />
      <FloatingShape
        speed={0.07}
        className="left-[-80px] top-[500px] h-[240px] w-[240px] rounded-full bg-gradient-to-tr from-purple-50/25 to-slate-100/15 blur-3xl"
      />
      <FloatingShape
        speed={-0.06}
        className="bottom-[200px] right-1/4 h-[200px] w-[200px] rounded-full bg-gradient-to-tl from-emerald-50/25 to-cyan-50/15 blur-2xl"
      />

      <div className="public-container relative">
        {/* Hero heading */}
        <ParallaxLayer speed={0.05}>
          <ScrollReveal variant="fade-up" duration={900}>
            <div className="max-w-[860px]">
              <h1 className="text-[44px] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-900 md:text-[64px]">Daftar Pemilihan Publik</h1>
              <p className="mt-5 text-[18px] leading-9 text-slate-800">
                Pantau agenda pemilihan, status fase, hasil yang tersedia, dan bukti transaksi jika sudah tercatat.
              </p>
            </div>
          </ScrollReveal>
        </ParallaxLayer>

        {/* === Sedang Berlangsung === */}
        <section className="mt-14">
          <ScrollReveal variant="fade-left" duration={700}>
            <div className="flex items-center gap-4">
              <div className="h-6 w-1 rounded-full bg-slate-900" />
              <h2 className="text-[24px] font-semibold text-slate-900">Sedang Berlangsung</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-700">{activeElections.length} Aktif</span>
            </div>
          </ScrollReveal>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            {electionsQuery.isLoading ? (
              <EmptyElectionCard message="Memuat data pemilihan dari Supabase..." />
            ) : null}
            {!electionsQuery.isLoading && activeElections.length === 0 ? (
              <EmptyElectionCard message="Belum ada pemilihan aktif yang tersedia dari Supabase." />
            ) : null}
            {activeElections.map((item, index) => (
              <ScrollReveal
                key={item.id}
                variant="fade-up"
                delay={index * 180}
                duration={750}
              >
                <article className="public-card flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-slate-300">
                  {item.bannerImagePath && (
                    <div className="relative h-48 w-full overflow-hidden border-b border-slate-100">
                      <img src={item.bannerImagePath} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent" />
                    </div>
                  )}
                  <div className="flex flex-col flex-1 p-7">
                    <div className="flex items-start justify-between gap-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-700">{item.phaseLabel}</span>
                      <span className="text-[11px] uppercase tracking-[0.06em] text-slate-500">{item.deadlineLabel}</span>
                    </div>
                    <h3 className="mt-8 max-w-[560px] text-[24px] font-semibold leading-tight text-slate-900">{item.title}</h3>
                    <p className="mt-4 max-w-[560px] text-[16px] leading-8 text-slate-800"><ElectionDescription election={item} /></p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-slate-500">
                      {item.commitStartAt && <span>Pencoblosan: {formatScheduleDate(item.commitStartAt)}</span>}
                      {item.revealStartAt && <span>Konfirmasi: {formatScheduleDate(item.revealStartAt)}</span>}
                      {item.endedAt && <span>Selesai: {formatScheduleDate(item.endedAt)}</span>}
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl bg-slate-100 px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Partisipasi</p>
                        <p className="mt-2 text-[18px] font-semibold text-slate-900">{item.participantCount} Pemilih</p>
                      </div>
                      <div className="rounded-xl bg-slate-100 px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Smart Contract</p>
                        <p className="mt-2 font-mono text-[13px] text-slate-700">{shortenHash(item.deployedSpaceAddress ?? item.deploymentTxHash)}</p>
                      </div>
                    </div>

                    <div className="mt-auto flex gap-3 pt-8">
                      <Link href={`/pemilih/pemilihan/${item.id}/pilih-kandidat`} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-5 text-[14px] font-medium text-white hover:bg-[#1E293B]">
                        {item.phase === 'commit' ? 'Mulai Memilih' : 'Lihat Tahap Reveal'}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link href={`/pemilihan/${item.id}/hasil`} className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-100 px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-200">
                        Detail
                      </Link>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* === Akan Datang === */}
        <section className="mt-14">
          <ScrollReveal variant="fade-left" duration={700}>
            <div className="flex items-center gap-4">
              <div className="h-6 w-1 rounded-full bg-slate-500" />
              <h2 className="text-[24px] font-semibold text-slate-900">Akan Datang</h2>
            </div>
          </ScrollReveal>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-[repeat(2,minmax(0,490px))]">
            {!electionsQuery.isLoading && upcoming.length === 0 ? (
              <EmptyElectionCard message="Belum ada jadwal pemilihan mendatang dari Supabase." />
            ) : null}
            {upcoming.map((item, index) => (
              <ScrollReveal
                key={item.id}
                variant={index === 0 ? 'fade-left' : 'fade-right'}
                delay={index * 150}
                duration={700}
              >
                <article className="public-card flex h-full flex-col overflow-hidden">
                  {item.bannerImagePath && (
                    <div className="relative h-40 w-full overflow-hidden border-b border-slate-100">
                      <img src={item.bannerImagePath} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent" />
                    </div>
                  )}
                  <div className="flex flex-col flex-1 p-7">
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-amber-700 self-start">Menunggu</span>
                    <h3 className="mt-8 max-w-[20ch] text-[24px] font-semibold leading-tight text-slate-900">{item.title}</h3>
                    <p className="mt-4 text-[16px] text-slate-500">{item.deadlineLabel}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-slate-500">
                      {item.commitStartAt && <span>Pencoblosan: {formatScheduleDate(item.commitStartAt)}</span>}
                      {item.revealStartAt && <span>Konfirmasi: {formatScheduleDate(item.revealStartAt)}</span>}
                      {item.endedAt && <span>Selesai: {formatScheduleDate(item.endedAt)}</span>}
                    </div>
                    <div className="mt-auto pt-8">
                      <Link href={`/pemilihan/${item.id}/hasil`} className="inline-flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                        Lihat Detail
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* === Selesai === */}
        <section className="mt-14">
          <ScrollReveal variant="fade-left" duration={700}>
            <div className="flex items-center gap-4">
              <div className="h-6 w-1 rounded-full bg-slate-500" />
              <h2 className="text-[24px] font-semibold text-slate-900">Selesai</h2>
            </div>
          </ScrollReveal>

          <div className="mt-8 space-y-4">
            {!electionsQuery.isLoading && finished.length === 0 ? (
              <EmptyElectionCard message="Belum ada pemilihan selesai yang tersedia dari Supabase." />
            ) : null}
            {finished.map((item, index) => (
              <ScrollReveal
                key={item.id}
                variant="fade-up"
                delay={index * 120}
                duration={700}
              >
                <article className="public-flat-card flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    {item.bannerImagePath && (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-100">
                        <img src={item.bannerImagePath} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-emerald-700">Selesai</span>
                        <span className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Selesai {formatFinishedDate(item.endedAt)}</span>
                      </div>
                      <h3 className="mt-2 text-[20px] font-semibold text-slate-900">{item.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-slate-500">
                        <span>Pencoblosan: {formatScheduleDate(item.commitStartAt)}</span>
                        <span>Konfirmasi: {formatScheduleDate(item.revealStartAt)}</span>
                        <span>Selesai: {formatScheduleDate(item.endedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Total suara</p>
                      <p className="mt-2 text-[18px] font-semibold text-slate-900">Lihat detail hasil</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href={`/pemilihan/${item.id}/hasil`} className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-50">Detail Hasil</Link>
                      <a href={item.deploymentTxHash ? `https://sepolia.basescan.org/tx/${item.deploymentTxHash}` : 'https://sepolia.basescan.org'} target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-900 hover:bg-slate-50">
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
