import { PublicPage, SectionTitle } from '@/components/public/site-shell'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import {
  FileCheck,
  Users,
  Link2,
  ListChecks,
  ShieldAlert,
  Ban,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  Info,
} from 'lucide-react'

const SECTIONS = [
  {
    num: '01',
    title: 'Penerimaan Ketentuan',
    icon: FileCheck,
    desc: 'Anda setuju untuk terikat oleh ketentuan ini.',
    content: (
      <p className="text-[14px] leading-7 text-slate-600">
        Dengan mengakses dan menggunakan platform Votein, Anda setuju untuk terikat oleh Ketentuan Layanan ini.
        Platform ini merupakan bagian dari penelitian skripsi mengenai sistem e-voting terdesentralisasi
        untuk organisasi mahasiswa.
      </p>
    ),
  },
  {
    num: '02',
    title: 'Kelayakan Pengguna',
    icon: Users,
    desc: 'Hanya anggota organisasi terdaftar yang dapat menggunakan layanan.',
    content: (
      <>
        <p className="mb-3 text-[14px] leading-7 text-slate-600">
          Layanan ini ditujukan bagi anggota organisasi mahasiswa yang terdaftar dalam Daftar Pemilih.
          Pengguna wajib memenuhi syarat berikut:
        </p>
        <ul className="space-y-2">
          {[
            'Terdaftar sebagai anggota organisasi mahasiswa aktif',
            'Menggunakan alamat email institusi yang sah untuk verifikasi',
            'Memiliki dompet digital yang kompatibel dengan jaringan Base Sepolia',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[14px] leading-6 text-slate-600">
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    num: '03',
    title: 'Transaksi Blockchain & Finalitas',
    icon: Link2,
    desc: 'Pemahaman tentang sifat transaksi blockchain.',
    content: (
      <>
        <p className="mb-3 text-[14px] leading-7 text-slate-600">
          Anda memahami bahwa setiap suara yang dikirimkan diproses melalui transaksi pada jaringan blockchain.
          Karena sifat teknologi blockchain:
        </p>
        <div className="mt-3 space-y-2.5">
          {[
            { label: 'Irreversible', text: 'Transaksi tidak dapat dibatalkan setelah dikonfirmasi oleh jaringan.' },
            { label: 'Tidak dapat dimanipulasi', text: 'Votein tidak dapat mengubah, menghapus, atau memanipulasi suara yang telah tercatat dalam smart contract.' },
            { label: 'Bergantung pada jaringan', text: 'Keberhasilan transaksi bergantung pada stabilitas jaringan testnet (Base Sepolia).' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <span className="text-[13px] font-semibold text-slate-900">{item.label}</span>
                <span className="text-[13px] leading-6 text-slate-600"> — {item.text}</span>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    num: '04',
    title: 'Kewajiban Tahapan Pemilihan',
    icon: ListChecks,
    desc: 'Mekanisme commit-reveal yang wajib diikuti.',
    content: (
      <>
        <p className="mb-3 text-[14px] leading-7 text-slate-600">
          Dalam mekanisme <span className="font-semibold text-slate-900">commit-reveal</span>, pengguna
          bertanggung jawab penuh untuk:
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { step: '1', label: 'Commit', text: 'Daftarkan pilihan terenkripsi ke smart contract.' },
            { step: '2', label: 'Tunggu', text: 'Tunggu jadwal yang ditentukan untuk fase Reveal.' },
            { step: '3', label: 'Reveal', text: 'Buka suara untuk mengungkapkan pilihan Anda.' },
          ].map((item) => (
            <div key={item.step} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
                  {item.step}
                </span>
                <span className="text-[13px] font-semibold text-slate-900">{item.label}</span>
              </div>
              <p className="text-[13px] leading-5 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-[13px] leading-6 text-amber-800">
            Suara yang tidak melalui fase Reveal dianggap <strong>tidak sah</strong> dan tidak akan dihitung oleh smart contract.
          </p>
        </div>
      </>
    ),
  },
  {
    num: '05',
    title: 'Batasan Tanggung Jawab',
    icon: ShieldAlert,
    desc: 'Platform disediakan "sebagaimana adanya" sebagai prototipe riset.',
    content: (
      <>
        <p className="mb-3 text-[14px] leading-7 text-slate-600">
          Votein disediakan "sebagaimana adanya" (<em>as is</em>) sebagai prototipe riset.
          Pengembang tidak bertanggung jawab atas:
        </p>
        <ul className="mt-2 space-y-2">
          {[
            'Kegagalan teknis akibat gangguan pihak ketiga (layanan RPC, dompet digital, infrastruktur cloud).',
            'Kehilangan akses akibat kelalaian pengguna dalam menjaga keamanan email atau sesi login.',
            'Kesalahan hasil perhitungan jika terjadi anomali pada jaringan blockchain testnet.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[14px] leading-6 text-slate-600">
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    num: '06',
    title: 'Perilaku yang Dilarang',
    icon: Ban,
    desc: 'Aktivitas yang dilarang di platform Votein.',
    content: (
      <div className="mt-1 space-y-2.5">
        {[
          'Mencoba serangan sybil atau manipulasi identitas untuk mendapatkan hak pilih ganda.',
          'Melakukan reverse engineering atau mencoba mengeksploitasi kerentanan pada smart contract.',
          'Menggunakan platform untuk tujuan selain pemilihan yang telah ditentukan secara resmi oleh organisasi.',
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
            <Ban className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span className="text-[13px] leading-6 text-red-800">{item}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: '07',
    title: 'Perubahan Ketentuan',
    icon: RefreshCw,
    desc: 'Ketentuan dapat berubah sewaktu-waktu.',
    content: (
      <p className="text-[14px] leading-7 text-slate-600">
        Pengembang berhak mengubah ketentuan ini sewaktu-waktu untuk menyesuaikan dengan perkembangan teknis
        penelitian atau kebutuhan organisasi. Perubahan akan diinformasikan melalui platform.
      </p>
    ),
  },
]

export default function KetentuanLayananPage() {
  return (
    <PublicPage activePath="/ketentuan-layanan">
      <section className="public-section">
        <div className="public-container">
          {/* Header */}
          <ScrollReveal>
            <SectionTitle
              title="Ketentuan Layanan"
              body="Aturan penggunaan platform Votein untuk pelaksanaan e-voting organisasi mahasiswa berbasis blockchain."
            />
          </ScrollReveal>

          {/* Summary Banner */}
          <ScrollReveal delay={100}>
            <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 px-6 py-5">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="mb-1.5 text-[14px] font-semibold text-slate-900">Ringkasan Cepat</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      'Hanya anggota organisasi terdaftar',
                      'Suara bersifat permanen di blockchain',
                      'Wajib Commit lalu Reveal',
                      'Dilarang manipulasi atau exploit',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-[13px] text-slate-700">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Table of Contents */}
          <ScrollReveal delay={200}>
            <div className="mt-8 rounded-xl border border-slate-200 bg-white px-6 py-5">
              <p className="mb-3 text-[13px] font-semibold text-slate-900">Daftar Isi</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {SECTIONS.map((s) => {
                  const Icon = s.icon
                  return (
                    <a
                      key={s.num}
                      href={`#section-${s.num}`}
                      className="group flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-slate-50"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600">
                        {s.num}
                      </span>
                      <Icon className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                      <span className="text-[13px] text-slate-700 group-hover:text-slate-900">{s.title}</span>
                    </a>
                  )
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* Sections */}
          <StaggerContainer className="mt-10 space-y-6" stagger={100}>
            {SECTIONS.map((s) => {
              const Icon = s.icon
              return (
                <article
                  key={s.num}
                  id={`section-${s.num}`}
                  className="rounded-xl border border-slate-200 bg-white scroll-mt-24"
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[13px] font-semibold text-white">
                      {s.num}
                    </span>
                    <Icon className="h-5 w-5 text-slate-400" />
                    <div>
                      <h3 className="text-[15px] font-semibold text-slate-900">{s.title}</h3>
                      <p className="text-[12px] text-slate-400">{s.desc}</p>
                    </div>
                  </div>
                  <div className="px-6 py-5">{s.content}</div>
                </article>
              )
            })}
          </StaggerContainer>

          {/* Footer Note */}
          <ScrollReveal delay={100}>
            <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 px-6 py-5 text-center">
              <p className="text-[13px] leading-6 text-slate-500">
                Ketentuan Layanan ini berlaku sejak tanggal publikasi dan dapat berubah sewaktu-waktu.
                <br />
                Terakhir diperbarui: <span className="font-semibold text-slate-700">Juni 2026</span>
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </PublicPage>
  )
}
