'use client'

import { CircleCheck, ExternalLink, Eye, LockKeyhole, UserRoundCheck } from 'lucide-react'
import { ScrollReveal, ParallaxLayer, FloatingShape } from '@/components/public/parallax'

const steps = [
  {
    icon: UserRoundCheck,
    title: '1. Pastikan kamu terdaftar',
    body: 'Sistem mengecek apakah kamu memang termasuk daftar pemilih. Ibarat daftar hadir, hanya nama yang terdaftar yang bisa ikut memilih.',
    noteTitle: 'Status pemilih',
    noteBody: 'Sudah dikenali sistem',
  },
  {
    icon: LockKeyhole,
    title: '2. Pilih, lalu kunci pilihan',
    body: 'Kamu memilih satu kandidat. Pilihan itu dikunci dulu sebagai kode bukti, jadi belum ada yang bisa melihat isi pilihanmu.',
    noteTitle: 'Contoh kode bukti',
    noteBody: '0x7a3b ... 9f2c (terkunci)',
  },
  {
    icon: Eye,
    title: '3. Sistem mengesahkan otomatis',
    body: 'Saat panitia membuka tahap penghitungan, relayer sistem mencoba membuka komitmen suara otomatis agar kamu tidak perlu masuk lagi hanya untuk reveal.',
    noteTitle: '',
    noteBody: 'Pencocokan berjalan otomatis di belakang layar.',
  },
  {
    icon: CircleCheck,
    title: '4. Lihat hasil dan bukti',
    body: 'Setelah semua selesai, hasil dapat dilihat bersama. Bukti transaksi tetap tersedia untuk dicek ulang tanpa membuka identitas pemilih.',
    noteTitle: '',
    noteBody: 'Lihat bukti teknis di Basescan',
  },
]

export function CaraKerjaSections() {
  return (
    <section className="public-section relative overflow-hidden">
      {/* Floating decorative shapes */}
      <FloatingShape
        speed={-0.05}
        className="left-[-120px] top-[80px] h-[300px] w-[300px] rounded-full bg-gradient-to-br from-indigo-100/30 to-blue-50/20 blur-3xl"
      />
      <FloatingShape
        speed={0.06}
        className="right-[-80px] top-[400px] h-[250px] w-[250px] rounded-full bg-gradient-to-tl from-purple-50/30 to-slate-100/20 blur-3xl"
      />
      <FloatingShape
        speed={-0.08}
        className="bottom-[100px] left-1/4 h-[200px] w-[200px] rounded-full bg-gradient-to-tr from-emerald-50/30 to-cyan-50/15 blur-2xl"
      />

      <div className="public-container relative">
        <ParallaxLayer speed={0.06}>
          <ScrollReveal variant="fade-up" duration={900}>
            <div className="max-w-[920px]">
              <h1 className="text-[44px] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-900 md:text-[64px]">Transparansi dalam Setiap Suara.</h1>
              <p className="mt-5 text-[18px] leading-9 text-slate-800">
                Lihat alur memilih dari awal sampai hasil akhir dengan bahasa sederhana. Detail teknis tetap ada sebagai bukti, tetapi kamu tidak perlu memahaminya untuk ikut memilih.
              </p>
            </div>
          </ScrollReveal>
        </ParallaxLayer>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {steps.map(({ icon: Icon, title, body, noteTitle, noteBody }, index) => {
            // Alternate directions for visual interest
            const variant = index % 2 === 0 ? 'fade-left' as const : 'fade-right' as const

            return (
              <ScrollReveal
                key={title}
                variant={variant}
                delay={index * 150}
                duration={750}
              >
                <article className={index === 0 || index === 3 ? 'public-flat-card p-7 h-full' : 'public-card p-7 h-full'}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-8 text-[24px] font-semibold text-slate-900">{title}</h2>
                  <p className="mt-4 text-[16px] leading-8 text-slate-800">{body}</p>
                  <div className="mt-8 rounded-xl bg-slate-100 px-4 py-4 text-[14px] text-slate-700">
                    {noteTitle ? <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">{noteTitle}</p> : null}
                    {index === 3 ? (
                      <a href="https://sepolia.basescan.org" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold text-slate-900">
                        {noteBody}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <div className="mt-2 flex items-center gap-2 font-mono text-[13px]">
                        {index === 0 ? <CircleCheck className="h-4 w-4 text-emerald-600" /> : null}
                        <span>{noteBody}</span>
                      </div>
                    )}
                  </div>
                </article>
              </ScrollReveal>
            )
          })}
        </div>

        {/* Bottom CTA - dark card */}
        <ScrollReveal variant="zoom-in" delay={200} duration={800}>
          <div className="mt-14 rounded-[32px] bg-black p-8 text-white md:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end">
              <ParallaxLayer speed={0.04}>
                <div>
                  <h2 className="text-[32px] font-semibold tracking-[-0.02em]">Bukti Transparansi</h2>
                  <p className="mt-4 text-[16px] leading-8 text-slate-300">
                    Setiap suara yang selesai dikonfirmasi memiliki jejak bukti yang bisa diperiksa. Jika ingin melihat detail teknisnya, gunakan tautan Basescan di bawah ini.
                  </p>
                  <a href="https://sepolia.basescan.org" target="_blank" rel="noreferrer" className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-100">
                    Eksplorasi Basescan
                  </a>
                </div>
              </ParallaxLayer>
              <ScrollReveal variant="fade-right" delay={400} duration={700}>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Status Kontrak</p>
                  <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-4">
                    <p className="font-mono text-sm text-slate-200">ElectionSpace (Verified)</p>
                    <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
