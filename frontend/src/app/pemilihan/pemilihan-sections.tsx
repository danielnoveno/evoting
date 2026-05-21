'use client'

import { ArrowRight, Download } from 'lucide-react'
import Link from 'next/link'
import { ScrollReveal, ParallaxLayer, FloatingShape, StaggerContainer } from '@/components/public/parallax'
import { sharedDummyContext } from '@/lib/dummy-shared-context'

const activeElections = [
  {
    phase: 'Fase Commit',
    deadline: 'Berakhir dalam 12 jam',
    title: sharedDummyContext.proposalTitle,
    body: sharedDummyContext.summary,
    participation: `${sharedDummyContext.voterEstimate} Pemilih`,
    hash: '0x8f2a ... 9c3b',
    primary: 'Mulai Memilih',
    href: '/hubungkan-dompet?redirect=pilih-kandidat',
    detailHref: `/pemilihan/${sharedDummyContext.electionId}/hasil`,
  },
  {
    phase: 'Fase Reveal',
    deadline: 'Berakhir dalam 2 hari',
    title: 'Pemilihan Ketua Kelompok Praktikum Basis Data FTI 2026',
    body: 'Pemungutan suara internal mahasiswa praktikum untuk menentukan ketua kelompok yang akan mengoordinasikan jadwal, pembagian tugas, dan komunikasi dengan asisten.',
    participation: '36 Pemilih',
    hash: '0x1d9f ... 4a2e',
    primary: 'Lihat Statistik',
    href: '/pemilih/pemilihan/ketua-kelompok-praktikum-bd-2026/reveal',
    detailHref: '/pemilihan/ketua-kelompok-praktikum-bd-2026/hasil',
  },
]

const upcoming = [
  { title: 'Pemilihan Sekretaris UKM Riset 2026', href: '/pemilih' },
  { title: 'Pemilihan Koordinator Divisi PSDM HIMAFORKA 2026', href: '/admin/daftar-proposal/p-himaforka-psdm-2026' },
]

const finished = [
  { month: 'Agustus 2025', title: 'Pemilihan Koordinator Divisi PSDM HIMAFORKA 2025', total: '284' },
  { month: 'Juli 2025', title: 'Pemilihan Sekretaris UKM Riset 2025', total: '301' },
]

export function PemilihanSections() {
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
                Pantau seluruh agenda pemilihan, status blockchain, dan hasil akhir secara transparan. Semua data tersimpan permanen di jaringan terdesentralisasi.
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
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-700">2 Aktif</span>
            </div>
          </ScrollReveal>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            {activeElections.map((item, index) => (
              <ScrollReveal
                key={item.title}
                variant="fade-up"
                delay={index * 180}
                duration={750}
              >
                <article className="public-card flex h-full flex-col overflow-hidden p-7 transition-all duration-200 hover:-translate-y-1 hover:border-slate-300">
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-700">{item.phase}</span>
                    <span className="text-[11px] uppercase tracking-[0.06em] text-slate-500">{item.deadline}</span>
                  </div>
                  <h3 className="mt-8 max-w-[560px] text-[24px] font-semibold leading-tight text-slate-900">{item.title}</h3>
                  <p className="mt-4 max-w-[560px] text-[16px] leading-8 text-slate-800">{item.body}</p>

                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-slate-100 px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Partisipasi</p>
                      <p className="mt-2 text-[18px] font-semibold text-slate-900">{item.participation}</p>
                    </div>
                    <div className="rounded-xl bg-slate-100 px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">{index === 0 ? 'Hash Terbaru' : 'Smart Contract'}</p>
                      <p className="mt-2 font-mono text-[13px] text-slate-700">{item.hash}</p>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-3 pt-8">
                    <Link href={item.href} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-5 text-[14px] font-medium text-white hover:bg-[#1E293B]">
                      {item.primary}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href={item.detailHref} className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-100 px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-200">
                      Detail
                    </Link>
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
            {upcoming.map((item, index) => (
              <ScrollReveal
                key={item.title}
                variant={index === 0 ? 'fade-left' : 'fade-right'}
                delay={index * 150}
                duration={700}
              >
                <article className="public-card flex h-full flex-col p-7">
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-amber-700 self-start">Menunggu</span>
                  <h3 className="mt-8 max-w-[20ch] text-[24px] font-semibold leading-tight text-slate-900">{item.title}</h3>
                  <p className="mt-4 text-[16px] text-slate-500">Jadwal: 15 Okt 2024 - 17 Okt 2024</p>
                  <div className="mt-auto pt-8">
                    <Link href={item.href} className="inline-flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                      Lihat Detail
                      <ArrowRight className="h-4 w-4" />
                    </Link>
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
            {finished.map((item, index) => (
              <ScrollReveal
                key={item.title}
                variant="fade-up"
                delay={index * 120}
                duration={700}
              >
                <article className="public-flat-card flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-emerald-700">Selesai</span>
                      <span className="text-[11px] uppercase tracking-[0.06em] text-slate-400">{item.month}</span>
                    </div>
                    <h3 className="mt-5 text-[24px] font-semibold text-slate-900">{item.title}</h3>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Total suara</p>
                      <p className="mt-2 text-[18px] font-semibold text-slate-900">{item.total}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href="/pemilihan/koordinator-psdm-himaforka-2025/hasil" className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-50">Detail Hasil</Link>
                      <a href="https://sepolia.basescan.org" target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-900 hover:bg-slate-50">
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
