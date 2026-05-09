import { Download, ExternalLink, LockKeyhole, ShieldCheck } from 'lucide-react'
import { PublicPage } from '@/components/public/site-shell'

const logs = [
  { action: 'Vote Reveal', tx: '0x8f4c ... 3b9a', time: '2 mnt lalu' },
  { action: 'Vote Commit', tx: '0x2a1b ... 9d4f', time: '5 mnt lalu' },
  { action: 'Vote Commit', tx: '0x7c9e ... 1f2a', time: '12 mnt lalu' },
]

export default function DetailHasilPage() {
  return (
    <PublicPage activePath="/pemilihan">
      <section className="public-section">
        <div className="public-container">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-[860px]">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-emerald-700">Data Terverifikasi On-Chain</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-700">Berlangsung</span>
              </div>
              <h1 className="mt-6 text-[44px] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-900 md:text-[64px]">Pemilihan Presiden BEM Universitas 2024</h1>
              <p className="mt-5 max-w-[760px] text-[18px] leading-9 text-slate-600">
                Transparansi penuh dengan rekam jejak yang tidak dapat diubah. Hasil di bawah ini diperbarui secara real-time dari smart contract.
              </p>
            </div>
            <button type="button" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-200">
              <Download className="h-4 w-4" />
              Unduh Laporan
            </button>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.72fr)]">
            <article className="public-card p-6 md:p-8">
              <div className="grid gap-8 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
                <div className="mx-auto h-44 w-44 rounded-full bg-[radial-gradient(circle_at_top,_#374151,_#111827)]" />
                <div>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] uppercase tracking-[0.06em] text-slate-500">Kandidat 01 · Pemenang Sementara</span>
                  <h2 className="mt-5 text-[28px] font-semibold leading-tight text-slate-900 md:text-[36px]">Bima Satria & Clara Wijaya</h2>
                  <p className="mt-3 text-[18px] text-slate-600">Fakultas Teknik & Fakultas Ilmu Sosial</p>
                  <div className="mt-8 flex flex-wrap items-end gap-4">
                    <p className="text-[56px] font-semibold leading-none tracking-[-0.04em] text-slate-900 md:text-[72px]">58.4%</p>
                    <p className="pb-2 text-[18px] text-slate-600">dari total suara masuk</p>
                  </div>
                  <div className="mt-8 flex gap-10">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Total Suara</p>
                      <p className="mt-2 text-[18px] font-semibold text-slate-900">12,450</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Tren</p>
                      <p className="mt-2 text-[18px] font-semibold text-emerald-600">+ 2.4%</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <div className="space-y-6">
              <article className="public-flat-card p-6">
                <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Total Suara Terverifikasi</p>
                <p className="mt-3 text-[48px] font-semibold leading-none tracking-[-0.04em] text-slate-900">21,318</p>
                <div className="mt-6 h-2 rounded-full bg-slate-200">
                  <div className="h-2 w-[82%] rounded-full bg-black" />
                </div>
                <div className="mt-3 flex items-center justify-between text-[14px] text-slate-600">
                  <span>Partisipasi 82%</span>
                  <span>Target: 26,000</span>
                </div>
              </article>

              <article className="public-card p-6">
                <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Distribusi Suara</p>
                <div className="mt-6 space-y-5 text-[16px] text-slate-900">
                  {[
                    ['Kandidat 01', '58.4%', 'w-[58.4%]'],
                    ['Kandidat 02', '31.2%', 'w-[31.2%]'],
                    ['Kandidat 03', '10.4%', 'w-[10.4%]'],
                  ].map(([label, value, widthClass], index) => (
                    <div key={label}>
                      <div className="flex items-center justify-between">
                        <span>{label}</span>
                        <span>{value}</span>
                      </div>
                      <div className="mt-2 h-3 rounded-full bg-slate-200">
                        <div className={`h-3 rounded-full ${widthClass} ${index === 0 ? 'bg-black' : index === 1 ? 'bg-slate-500' : 'bg-slate-400'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>

          <section className="mt-10 public-flat-card p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[32px] font-semibold text-slate-900">Jejak Audit Blockchain</h2>
                <p className="mt-3 text-[16px] leading-8 text-slate-600">Semua transaksi dicatat secara publik pada Base Network.</p>
              </div>
              <a href="https://sepolia.basescan.org" target="_blank" rel="noreferrer" className="hidden items-center gap-2 text-[14px] font-medium text-slate-900 md:inline-flex">
                Lihat Semua
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-8 space-y-4">
              {logs.map((log, index) => (
                <article key={`${log.action}-${index}`} className="public-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                      {log.action === 'Vote Reveal' ? <ShieldCheck className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-[18px] font-semibold text-slate-900">{log.action}</p>
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-emerald-700">Sukses</span>
                      </div>
                      <p className="mt-1 font-mono text-[13px] text-slate-600">Tx : {log.tx}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-6 md:justify-end">
                    <span className="text-[14px] text-slate-500">{log.time}</span>
                    <a href="https://sepolia.basescan.org" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-slate-900">
                      Lihat di Basescan
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button type="button" className="inline-flex h-11 items-center justify-center px-5 text-[14px] font-semibold uppercase tracking-[0.04em] text-slate-700 hover:text-slate-900">
                Muat Lebih Banyak Transaksi
              </button>
            </div>
          </section>
        </div>
      </section>
    </PublicPage>
  )
}
