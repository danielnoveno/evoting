import { CircleCheck, ExternalLink, Eye, LockKeyhole, UserRoundCheck } from 'lucide-react'
import { PublicPage } from '@/components/public/site-shell'

const steps = [
  {
    icon: UserRoundCheck,
    title: '1. Registrasi (Whitelist)',
    body: 'Hanya pemilih yang terdaftar yang dapat berpartisipasi. Identitas Anda diverifikasi secara aman, dan alamat dompet digital Anda dimasukkan ke dalam daftar putih (whitelist).',
    noteTitle: 'Status Identitas',
    noteBody: 'Diverifikasi & Terenkripsi',
  },
  {
    icon: LockKeyhole,
    title: '2. Fase Commit (Pilihan Terenkripsi)',
    body: 'Anda memberikan suara secara rahasia. Pilihan Anda diubah menjadi kode unik (hash) dan dikunci. Tidak ada yang tahu siapa yang Anda pilih pada tahap ini.',
    noteTitle: 'Contoh Hash Suara',
    noteBody: '0x7a3b ... 9f2c (Terkunci)',
  },
  {
    icon: Eye,
    title: '3. Fase Reveal (Pembukaan Suara)',
    body: 'Setelah waktu pemilihan selesai, kunci dibuka. Sistem secara otomatis mencocokkan hash yang dikunci sebelumnya untuk memastikan suara tidak dimanipulasi selama proses.',
    noteTitle: '',
    noteBody: 'Proses pencocokan otomatis berjalan di latar belakang.',
  },
  {
    icon: CircleCheck,
    title: '4. Finalisasi (Audit Publik)',
    body: 'Hasil akhir dihitung dan dicatat secara permanen di blockchain. Siapa pun dapat memverifikasi hasil ini secara independen tanpa bisa mengubah datanya.',
    noteTitle: '',
    noteBody: 'Lihat Kontrak Cerdas di Basescan',
  },
]

export default function CaraKerjaPage() {
  return (
    <PublicPage activePath="/cara-kerja">
      <section className="public-section">
        <div className="public-container">
          <div className="max-w-[920px]">
            <h1 className="text-[44px] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-900 md:text-[64px]">Transparansi dalam Setiap Suara.</h1>
            <p className="mt-5 text-[18px] leading-9 text-slate-600">
              Pelajari bagaimana teknologi blockchain memastikan setiap suara Anda aman, rahasia, dan tidak dapat diubah. Proses pemilihan kami dirancang untuk memberikan kepercayaan penuh melalui empat tahap terstruktur.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {steps.map(({ icon: Icon, title, body, noteTitle, noteBody }, index) => (
              <article key={title} className={index === 0 || index === 3 ? 'public-flat-card p-7' : 'public-card p-7'}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-8 text-[24px] font-semibold text-slate-900">{title}</h2>
                <p className="mt-4 text-[16px] leading-8 text-slate-600">{body}</p>
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
            ))}
          </div>

          <div className="mt-14 rounded-[32px] bg-black p-8 text-white md:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end">
              <div>
                <h2 className="text-[32px] font-semibold tracking-[-0.02em]">Bukti Transparansi</h2>
                <p className="mt-4 text-[16px] leading-8 text-slate-300">
                  Seluruh proses ini berjalan di atas jaringan blockchain publik. Anda tidak perlu mempercayai penyelenggara, cukup percaya kode. Periksa setiap transaksi dan status kontrak pintar kami secara langsung.
                </p>
                <a href="https://sepolia.basescan.org" target="_blank" rel="noreferrer" className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-100">
                  Eksplorasi Basescan
                </a>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Status Kontrak</p>
                <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="font-mono text-sm text-slate-200">0x8F2A...c91E (Verified)</p>
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicPage>
  )
}
