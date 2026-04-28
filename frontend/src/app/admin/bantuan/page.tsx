import {
  ChevronDown,
  ChevronUp,
  Eraser,
  FileText,
  Fingerprint,
  Mail,
  MessageSquare,
  Search,
  Shield,
} from 'lucide-react'

const helpCards = [
  {
    title: 'Manajemen Proposal',
    desc: 'Panduan pembuatan, pengeditan, dan verifikasi draf proposal sebelum fase voting.',
    icon: FileText,
  },
  {
    title: 'Manajemen Space',
    desc: 'Konfigurasi parameter pemilihan, durasi blok, dan pengaturan partisipasi anggota.',
    icon: Eraser,
  },
  {
    title: 'Blockchain Commit',
    desc: 'Penjelasan teknis mekanisme commit-reveal untuk menjaga privasi pemilih.',
    icon: Fingerprint,
  },
  {
    title: 'Keamanan & Whitelist',
    desc: 'Audit akses admin, pengaturan whitelist dompet, dan proteksi dari serangan sybil.',
    icon: Shield,
  },
]

const faqs = [
  {
    question: 'Bagaimana cara mengganti fase pemilihan?',
    answer:
      'Fase pemilihan hanya dapat diubah melalui dashboard Manajemen Pemilihan jika status saat ini masih "Menunggu". Jika fase sudah berjalan ("Berlangsung"), gunakan alur transisi resmi agar integritas blockchain tetap terjaga.',
    expanded: true,
  },
  {
    question: 'Apa yang harus dilakukan jika transaksi gagal?',
    expanded: false,
  },
  {
    question: 'Cara ekspor data pemilih ke CSV?',
    expanded: false,
  },
]

export default function AdminBantuanPage() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-7xl font-semibold leading-tight text-slate-900">Pusat Bantuan Admin</h2>
        <p className="mt-2 text-2xl text-slate-600">
          Panduan operasional dan dukungan teknis blockchain untuk ekosistem Votein.
        </p>

        <div className="mt-5 flex h-16 items-center rounded-3xl bg-white px-4">
          <Search className="h-6 w-6 text-slate-400" />
          <input
            className="w-full bg-transparent px-3 text-xl text-slate-700 placeholder:text-slate-400 focus:outline-none"
            placeholder="Cari solusi atau panduan..."
            type="text"
          />
          <button className="h-12 rounded-2xl bg-black px-8 text-lg font-semibold text-white" type="button">
            Cari
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {helpCards.map((card) => {
          const Icon = card.icon

          return (
            <article className="rounded-3xl border border-slate-200 bg-white p-6" key={card.title}>
              <div className="mb-4 inline-flex rounded-2xl bg-indigo-50 p-4 text-slate-700">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="text-4xl font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-xl leading-relaxed text-slate-600">{card.desc}</p>
            </article>
          )
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_0.85fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-6xl font-semibold text-slate-900">Pertanyaan Populer</h3>
            <button className="text-xl font-semibold text-slate-900" type="button">
              Lihat Semua →
            </button>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <article className="rounded-2xl border border-slate-200 bg-white p-5" key={faq.question}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[31px] font-medium text-slate-900">{faq.question}</p>
                  {faq.expanded ? <ChevronUp className="h-5 w-5 text-slate-600" /> : <ChevronDown className="h-5 w-5 text-slate-600" />}
                </div>
                {faq.expanded ? (
                  <p className="mt-3 text-xl leading-relaxed text-slate-600">{faq.answer}</p>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <article className="rounded-3xl bg-gradient-to-b from-[#111936] to-[#131D43] p-6 text-white">
            <h4 className="text-5xl font-semibold leading-tight">Butuh Bantuan Langsung?</h4>
            <p className="mt-3 text-xl leading-relaxed text-slate-300">
              Tim teknis kami tersedia 24/7 untuk membantu masalah kritis pada sistem voting Anda.
            </p>

            <button className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-xl font-semibold text-slate-900" type="button">
              <MessageSquare className="h-5 w-5" />
              Chat dengan Tim Teknis
            </button>
            <button className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-black text-xl font-semibold text-white" type="button">
              <Mail className="h-5 w-5" />
              Hubungi Support
            </button>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Status Sistem</p>
            <p className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Node Blockchain Aktif
            </p>
            <p className="mt-2 font-mono text-sm text-slate-500">Last block: #19,452,102</p>
          </article>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between border-t border-slate-200 pt-4 text-sm">
        <div className="flex flex-wrap gap-10">
          <p>
            <span className="block text-xs uppercase tracking-[0.1em] text-slate-500">Dokumentasi API</span>
            <span className="text-3xl font-semibold text-slate-900">docs.votein.io</span>
          </p>
          <p>
            <span className="block text-xs uppercase tracking-[0.1em] text-slate-500">Keamanan</span>
            <span className="text-3xl font-semibold text-slate-900">Laporan Audit 2024</span>
          </p>
        </div>
        <p className="text-sm text-slate-500">© 2024 Votein Protocol. Platform Pemilihan Terdesentralisasi.</p>
      </section>
    </div>
  )
}
