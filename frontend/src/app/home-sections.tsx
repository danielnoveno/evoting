'use client'

import { ArrowRight, FileCheck2, Globe, LockKeyhole, ShieldCheck, SquarePen, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { ScrollReveal, ParallaxLayer, FloatingShape, StaggerContainer } from '@/components/public/parallax'
import { sharedDummyContext } from '@/lib/dummy-shared-context'

/* ─────────────────────────────────────────────
   Hero Section
   ───────────────────────────────────────────── */
export function HeroSection() {
  return (
    <section className="public-section relative overflow-hidden">
      {/* Decorative floating shapes for depth */}
      <FloatingShape
        speed={-0.06}
        className="left-[-80px] top-[120px] h-[320px] w-[320px] rounded-full bg-gradient-to-br from-blue-100/40 to-indigo-50/20 blur-3xl"
      />
      <FloatingShape
        speed={0.04}
        className="right-[-60px] top-[60px] h-[260px] w-[260px] rounded-full bg-gradient-to-bl from-slate-100/60 to-purple-50/20 blur-3xl"
      />
      <FloatingShape
        speed={0.1}
        className="bottom-[-40px] left-1/3 h-[180px] w-[180px] rounded-full bg-gradient-to-tr from-emerald-50/40 to-cyan-50/20 blur-2xl"
      />

      <div className="public-container relative flex flex-col items-center text-center">
        <ParallaxLayer speed={0.08} className="flex flex-col items-center">
          <div className="flex max-w-[760px] flex-col items-center">
            <ScrollReveal variant="fade-down" duration={800}>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                E-Voting berbasis blockchain
              </span>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={150} duration={900}>
              <h1 className="mt-8 text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] text-slate-900 md:text-[64px] lg:text-[72px]">
                Tata kelola pemilihan yang lebih bermartabat.
              </h1>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={300} duration={900}>
              <p className="mt-8 max-w-[720px] text-[18px] leading-9 text-slate-600">
                Keamanan kelas institusi bertemu dengan transparansi yang dapat diaudit. Platform e-voting ini
                mengubah kepercayaan abstrak menjadi jejak kriptografis yang tercatat permanen untuk konteks
                organisasi mahasiswa seperti {sharedDummyContext.organizationShort}.
              </p>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={450} duration={800}>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href={`/pemilih/pemilihan/${sharedDummyContext.electionId}/commit`} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-6 text-[14px] font-medium text-white hover:bg-[#1E293B]">
                  Mulai Memilih
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/cara-kerja" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-6 text-[14px] font-medium text-slate-900 hover:bg-white">
                  Pelajari Lebih Lanjut
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </ParallaxLayer>

        {/* Feature cards row */}
        <div className="mt-16 w-full max-w-[1280px] border-t border-slate-200 pt-8 text-left lg:mt-20 lg:pt-10">
          <StaggerContainer
            stagger={140}
            variant="fade-up"
            duration={700}
            className="grid gap-y-8 md:grid-cols-2 md:gap-x-8 lg:grid-cols-4 lg:gap-x-0"
          >
            {[
              { icon: FileCheck2, title: 'Jejak Audit', body: 'Setiap tindakan tercatat dan dapat ditelusuri kapan saja.' },
              { icon: ShieldCheck, title: 'Anti-Manipulasi', body: 'Teknologi blockchain mencegah perubahan dan kecurangan.' },
              { icon: Users, title: 'Akses Mudah', body: 'Dirancang agar siapa pun dapat berpartisipasi dengan mudah.' },
              { icon: LockKeyhole, title: 'Integritas Tinggi', body: 'Sistem menjaga keaslian suara dari awal hingga akhir.' },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className={index === 0
                    ? 'grid grid-cols-[56px_minmax(0,1fr)] items-start gap-4 lg:pr-8'
                    : 'grid grid-cols-[56px_minmax(0,1fr)] items-start gap-4 lg:border-l lg:border-slate-200 lg:px-8'}
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[16px] font-semibold leading-6 text-slate-900">{item.title}</h2>
                    <p className="mt-2 text-[14px] leading-7 text-slate-600">{item.body}</p>
                  </div>
                </article>
              )
            })}
          </StaggerContainer>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   Infrastructure Section
   ───────────────────────────────────────────── */
interface AuditItem {
  hash: string
  label: string
  time: string
}

export function InfrastructureSection({ auditItems }: { auditItems: AuditItem[] }) {
  return (
    <section className="relative overflow-hidden border-t border-slate-200 py-12 md:py-16 lg:py-20">
      {/* Decorative parallax shape */}
      <FloatingShape
        speed={-0.05}
        className="right-[-100px] top-[200px] h-[400px] w-[400px] rounded-full bg-gradient-to-tl from-indigo-50/30 to-slate-100/30 blur-3xl"
      />

      <div className="public-container relative">
        <ScrollReveal variant="fade-left" duration={800}>
          <div className="max-w-[680px]">
            <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 md:text-[40px]">Infrastruktur Kepercayaan</h2>
            <p className="mt-4 text-[18px] leading-9 text-slate-600">
              Dibangun di atas protokol terdesentralisasi, menjamin setiap suara dihitung dan dapat diaudit oleh publik tanpa mengorbankan privasi pemilih.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {/* Enkripsi End-to-End - spans 2 cols */}
          <ScrollReveal variant="fade-up" delay={100} className="lg:col-span-2">
            <article className="public-flat-card p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-900">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h3 className="mt-8 text-[24px] font-semibold text-slate-900">Enkripsi End-to-End</h3>
              <p className="mt-4 max-w-[820px] text-[16px] leading-8 text-slate-600">
                Identitas pemilih dipisahkan dari pilihan suara menggunakan mekanisme commit-reveal. Suara Anda sepenuhnya rahasia, namun secara matematis dapat dibuktikan keabsahannya.
              </p>
            </article>
          </ScrollReveal>

          {/* Audit Buku Besar Publik */}
          <ScrollReveal variant="fade-up" delay={250}>
            <article className="public-card p-7 h-full">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-900">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="mt-8 text-[24px] font-semibold text-slate-900">Audit Buku Besar Publik</h3>
              <p className="mt-4 text-[16px] leading-8 text-slate-600">
                Setiap transaksi dicatat secara permanen di blockchain, memungkinkan siapa saja untuk memverifikasi integritas pemilihan secara independen.
              </p>
            </article>
          </ScrollReveal>

          {/* Live Audit Log - tall card */}
          <ScrollReveal variant="fade-right" delay={350} className="lg:row-span-2">
            <article className="public-flat-card p-7 lg:min-h-[640px]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Live audit log</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Sinkron
                </span>
              </div>

              <div className="mt-8 space-y-3">
                {auditItems.map((item, i) => (
                  <ScrollReveal key={item.hash} variant="fade-left" delay={450 + i * 150} duration={600}>
                    <div className="rounded-xl bg-white px-4 py-3">
                      <div className="flex items-start justify-between gap-3 text-[12px]">
                        <div className="min-w-0">
                          <p className="font-mono text-slate-600">{item.hash}</p>
                          <p className="mt-1 text-slate-500">{item.label}</p>
                        </div>
                        <span className="text-slate-400">{item.time}</span>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              <div className="mt-24 border-t border-slate-100 pt-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Total suara</p>
                  <p className="mt-1 text-[40px] font-semibold tracking-[-0.03em] text-slate-900">142,893</p>
                </div>
              </div>
            </article>
          </ScrollReveal>

          {/* Verifikasi Real-time */}
          <ScrollReveal variant="fade-up" delay={300}>
            <article className="public-card p-7 h-full">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-900">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="mt-8 text-[24px] font-semibold text-slate-900">Verifikasi Real-time</h3>
              <p className="mt-4 text-[16px] leading-8 text-slate-600">
                Pantau aliran suara dan hasil sementara secara instan. Tidak ada lagi kotak hitam dalam proses penghitungan.
              </p>
            </article>
          </ScrollReveal>

          {/* UX Sederhana, Teknologi Kompleks - spans 2 cols, dark */}
          <ScrollReveal variant="zoom-in" delay={400} className="lg:col-span-2">
            <article className="rounded-[28px] bg-[#161b33] p-7 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <SquarePen className="h-5 w-5" />
              </div>
              <h3 className="mt-8 text-[24px] font-semibold">UX Sederhana, Teknologi Kompleks</h3>
              <p className="mt-4 max-w-[720px] text-[16px] leading-8 text-slate-300">
                Kami menyembunyikan kompleksitas blockchain di balik antarmuka yang intuitif. Memilih semudah mengirim pesan, dapat diakses oleh siapa saja tanpa pengetahuan teknis.
              </p>
              <Link href="/cara-kerja" className="mt-8 inline-flex items-center gap-2 text-[14px] font-medium text-white hover:text-slate-200">
                Coba Demo UX
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   (Unused export – kept for compat)
   ───────────────────────────────────────────── */
export function FeatureCardsSection() {
  return null
}
