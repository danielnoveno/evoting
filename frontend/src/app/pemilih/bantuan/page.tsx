'use client'

import { ChevronDown, ChevronUp, ExternalLink, Mail, MessageSquare, Search, ShieldCheck, Vote, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { useToast } from '@/components/ui/toast-provider'
import { VoterShell } from '@/components/voter/voter-shell'

const categories = [
  {
    key: 'cara-memilih',
    title: 'Cara Memilih',
    description: 'Panduan lengkap langkah demi langkah untuk menyalurkan hak suara Anda dengan aman.',
    icon: Vote,
  },
  {
    key: 'keamanan',
    title: 'Keamanan',
    description: 'Mengapa pilihanmu dikunci dulu sebelum dihitung, tanpa istilah teknis yang rumit.',
    icon: ShieldCheck,
  },
  {
    key: 'teknis',
    title: 'Teknis',
    description: 'Solusi kendala aplikasi, browser, dan koneksi jaringan saat voting.',
    icon: Wrench,
  },
] as const

const faqs = [
  {
    id: 'faq-1',
    question: 'Kenapa suara harus disimpan dulu lalu dikonfirmasi lagi?',
    answer: 'Tahap pertama mengunci pilihanmu agar tetap rahasia. Tahap kedua mencocokkan dan mengesahkan pilihan yang sama agar bisa dihitung. Jadi suara tidak dibuka terlalu cepat dan tidak bisa diganti sembarangan.',
  },
  {
    id: 'faq-2',
    question: 'Mengapa saya harus membuka dari browser yang sama?',
    answer: 'Browser menyimpan kode rahasia kecil untuk mencocokkan pilihanmu nanti. Kalau pindah browser atau menghapus data browser, kode itu bisa hilang dan konfirmasi suara bisa gagal.',
  },
  {
    id: 'faq-3',
    question: 'Bagaimana jika saya belum sempat konfirmasi suara?',
    answer: 'Jika tahap konfirmasi masih dibuka, masuk ke dashboard pemilih lalu lanjutkan dari kartu pemilihan terkait. Jika tahapnya sudah berakhir, hubungi admin untuk informasi tindak lanjut.',
  },
]

function HelpAccordion({ question, answer, openByDefault = false }: { question: string; answer: string; openByDefault?: boolean }) {
  const [open, setOpen] = useState(openByDefault)

  return (
    <article className="rounded-[24px] bg-white">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
        <span className="text-[16px] font-semibold text-slate-900">{question}</span>
        {open ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
      </button>
      {open ? <div className="px-6 pb-6 text-[15px] leading-8 text-slate-800">{answer}</div> : null}
    </article>
  )
}

export default function VoterHelpPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')

  const filteredFaqs = useMemo(() => {
    if (!query.trim()) return faqs
    const keyword = query.trim().toLowerCase()
    return faqs.filter((faq) => faq.question.toLowerCase().includes(keyword) || faq.answer.toLowerCase().includes(keyword))
  }, [query])

  return (
    <VoterShell>
      <ScrollReveal variant="fade-up" duration={800}>
      <section className="max-w-4xl">
        <h1 className="text-[34px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[42px] md:text-[56px]">Pusat Bantuan Voter</h1>
        <p className="mt-4 text-[16px] leading-8 text-slate-800 md:text-[18px] md:leading-9">
          Semua hal penting tentang proses voting dijelaskan dengan bahasa sederhana, aman, dan mudah diikuti.
        </p>

        <div className="mt-8 flex h-16 items-center gap-4 rounded-[24px] bg-slate-100 px-4 sm:px-5">
          <Search className="h-5 w-5 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari panduan memilih, akun, atau kendala..."
            className="h-full w-full bg-transparent text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </section>
      </ScrollReveal>

      <StaggerContainer stagger={120} variant="fade-up" className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.6fr)_minmax(260px,0.6fr)]">
        {categories.map((category, index) => {
          const Icon = category.icon

          return (
            <article key={category.key} className={`rounded-[32px] ${index === 0 ? 'bg-white' : 'bg-slate-100'} p-7`}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index === 0 ? 'bg-slate-100 text-slate-900' : index === 1 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-6 text-[20px] font-semibold text-slate-900 sm:text-[24px]">{category.title}</h2>
              <p className="mt-4 text-[15px] leading-8 text-slate-800">{category.description}</p>
              {index === 0 ? <button type="button" onClick={() => showToast({ tone: 'info', title: 'Panduan diprioritaskan', description: 'Topik cara memilih ditampilkan pada daftar FAQ di bawah.' })} className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-slate-900 hover:text-blue-700">Lihat Detail →</button> : null}
            </article>
          )
        })}
      </StaggerContainer>

      <ScrollReveal variant="fade-up" delay={100} duration={800}>
      <section className="mt-6 rounded-[32px] bg-slate-100 p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[24px] font-semibold text-slate-900">Bukti Suara & Verifikasi</h3>
              <p className="mt-3 text-[15px] leading-8 text-slate-800">Pelajari cara mengecek bukti bahwa suara Anda telah tercatat tanpa membuka identitas pemilih.</p>
            </div>
          </div>
          <ExternalLink className="hidden h-5 w-5 text-slate-400 md:block" />
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={150} duration={800}>
      <section className="mt-6 rounded-[32px] bg-[#161f35] p-8 text-white">
          <h3 className="text-[26px] font-semibold text-white sm:text-[32px]">Alur Memilih yang Mudah Diikuti</h3>
        <p className="mt-4 text-[16px] leading-8 text-slate-300">Intinya: pilih dulu, simpan aman, datang lagi untuk konfirmasi, lalu lihat hasil.</p>
        <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Pilih kandidat', 'Tentukan satu pilihan dari daftar kandidat resmi.'],
            ['Simpan pilihan', 'Pilihan dikunci dulu supaya tetap rahasia.'],
            ['Tunggu konfirmasi', 'Admin membuka tahap konfirmasi setelah waktu memilih selesai.'],
            ['Konfirmasi suara', 'Suaramu disahkan dan masuk ke hasil akhir.'],
          ].map(([title, body], index) => (
            <article key={title}>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[16px] font-semibold text-slate-900">{index + 1}</div>
              <h4 className="mt-6 text-[18px] font-semibold text-white">{title}</h4>
              <p className="mt-3 text-[15px] leading-8 text-slate-300">{body}</p>
            </article>
          ))}
        </div>
      </section>
      </ScrollReveal>

      <StaggerContainer stagger={150} variant="fade-up" className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="rounded-[32px] border border-slate-100 bg-white p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
            <Mail className="h-5 w-5" />
          </div>
          <h3 className="mt-6 text-[24px] font-semibold text-slate-900 sm:text-[28px]">Hubungi via Email</h3>
          <p className="mt-4 text-[15px] leading-8 text-slate-800">Respon dalam 24 jam untuk pertanyaan non-mendesak terkait akun, bukti transaksi, atau kendala akses.</p>
          <button type="button" onClick={() => showToast({ tone: 'success', title: 'Email support dibuka', description: 'Simulasi frontend mengarahkan Anda ke kanal email bantuan.' })} className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-black px-6 text-[14px] font-semibold text-white hover:bg-slate-900 sm:w-auto">
            bantuan@portalsuara.id
          </button>
        </article>

        <article className="rounded-[32px] border border-blue-200 bg-white p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <MessageSquare className="h-5 w-5" />
          </div>
          <h3 className="mt-6 text-[24px] font-semibold text-slate-900 sm:text-[28px]">Live Chat 24/7</h3>
          <p className="mt-4 text-[15px] leading-8 text-slate-800">Bicara langsung dengan tim dukungan teknis saat Anda perlu bantuan cepat ketika proses voting sedang berjalan.</p>
          <button type="button" onClick={() => showToast({ tone: 'success', title: 'Tim bantuan siap membantu', description: 'Jika diperlukan, lanjutkan melalui email bantuan untuk pendampingan lebih lanjut.' })} className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 px-6 text-[14px] font-semibold text-white hover:bg-blue-700 sm:w-auto">
            Mulai Chat Sekarang
          </button>
        </article>
      </StaggerContainer>

      <ScrollReveal variant="fade-up" delay={200} duration={800}>
      <section className="mt-6 space-y-4 rounded-[32px] bg-slate-100 p-6 md:p-8">
        {filteredFaqs.map((faq, index) => (
          <HelpAccordion key={faq.id} question={faq.question} answer={faq.answer} openByDefault={index === 0} />
        ))}
        {filteredFaqs.length === 0 ? (
          <article className="rounded-[24px] bg-white px-6 py-5 text-[15px] leading-8 text-slate-800">
            Tidak ada FAQ yang cocok. Coba kata kunci lain atau hubungi tim bantuan.
          </article>
        ) : null}
      </section>
      </ScrollReveal>
    </VoterShell>
  )
}
