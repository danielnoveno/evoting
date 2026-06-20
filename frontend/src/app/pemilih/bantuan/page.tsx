'use client'

import { AlertCircle, Bot, ChevronDown, ChevronUp, ExternalLink, Loader2, Mail, MessageSquare, Search, Send, ShieldCheck, UserCircle2, Vote, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { useToast } from '@/components/ui/toast-provider'
import { VoterShell } from '@/components/voter/voter-shell'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

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
    question: 'Kenapa suara harus dikunci dulu sebelum dihitung?',
    answer: 'Saat mencoblos, pilihanmu dikunci dulu di blockchain. Saat jadwal penghitungan dibuka, sistem mencocokkan dan mengesahkan pilihan tersebut secara otomatis agar suara bisa dihitung.',
  },
  {
    id: 'faq-2',
    question: 'Apakah saya perlu konfirmasi suara manual?',
    answer: 'Tidak. Setelah mencoblos dan transaksi berhasil, Votein menyiapkan antrean penghitungan otomatis. Kamu cukup menunggu hasil saat jadwal penghitungan dibuka.',
  },
  {
    id: 'faq-3',
    question: 'Bagaimana jika status penghitungan otomatis bermasalah?',
    answer: 'Jika transaksi coblos berhasil tetapi status penghitungan belum berubah saat waktunya tiba, hubungi admin/TU agar antrean reveal otomatis diperiksa.',
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

const suggestedQuestions = [
  'Penghitungan otomatis belum berjalan, harus bagaimana?',
  'Kenapa pilihan saya perlu dikunci dulu?',
  'Bagaimana cara melihat bukti transaksi?',
] as const

function HelpChatCard() {
  const { showToast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Halo! Saya Asisten Bantuan Otomatis Votein. Tanyakan kendala seputar login, memilih kandidat, penghitungan otomatis, atau bukti transaksi.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendMessage = async (messageText?: string) => {
    const question = (messageText ?? input).trim()
    if (!question) return
    if (question.length > 1200) {
      setError('Pertanyaan terlalu panjang. Ringkas menjadi maksimal 1200 karakter.')
      return
    }

    setError('')
    setLoading(true)
    setInput('')

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: question }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)

    try {
      const client = getSupabaseBrowserClient()
      const { data: sessionData } = client ? await client.auth.getSession() : { data: { session: null } }
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Sesi pemilih tidak ditemukan. Silakan masuk kembali.')

      const response = await fetch('/api/ai/help-chat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: question,
          history: messages.map((item) => ({ role: item.role, content: item.content })),
        }),
      })

      const payload: unknown = await response.json()
      const record = typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : {}
      if (!response.ok) throw new Error(typeof record.error === 'string' ? record.error : 'Jawaban bantuan gagal dimuat.')

      const reply = typeof record.reply === 'string' ? record.reply : 'Maaf, asisten belum dapat menyiapkan jawaban.'
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', content: reply }])
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Jawaban bantuan gagal dimuat. Coba lagi.'
      setError(message)
      showToast({ tone: 'error', title: 'Chat bantuan gagal', description: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <article className="rounded-[32px] border border-blue-200 bg-white p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">Otomatis 24/7</div>
            <h3 className="mt-4 text-[24px] font-semibold text-slate-900 sm:text-[28px]">Asisten Bantuan Otomatis</h3>
            <p className="mt-3 text-[15px] leading-8 text-slate-800">Dapatkan panduan cepat tentang alur voting, konfirmasi suara, dan bukti transaksi. Untuk masalah akun, tetap hubungi admin.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <div className="max-h-[360px] space-y-4 overflow-y-auto pr-1" aria-live="polite">
          {messages.map((message) => {
            const isUser = message.role === 'user'
            return (
              <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser ? <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-blue-700"><Bot className="h-4 w-4" /></div> : null}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-7 ${isUser ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
                  {message.content}
                </div>
                {isUser ? <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white"><UserCircle2 className="h-4 w-4" /></div> : null}
              </div>
            )
          })}
          {loading ? (
            <div className="flex items-center gap-3 text-[14px] text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sedang menyiapkan jawaban...
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-6 text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {suggestedQuestions.map((question) => (
            <button key={question} type="button" onClick={() => sendMessage(question)} disabled={loading} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
              {question}
            </button>
          ))}
        </div>

        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            void sendMessage()
          }}
        >
          <label htmlFor="help-chat-input" className="sr-only">Tulis pertanyaan bantuan</label>
          <textarea
            id="help-chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Contoh: Kenapa tombol konfirmasi suara belum muncul?"
            maxLength={1200}
            className="min-h-[48px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            disabled={loading}
          />
          <button id="tour-voter-help-chat-btn" type="submit" disabled={loading || !input.trim()} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-[14px] font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Kirim
          </button>
        </form>
      </div>
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
        <h1 id="tour-voter-help-title" className="text-[34px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[42px] md:text-[56px]">Pusat Bantuan Voter</h1>
        <p className="mt-4 text-[16px] leading-8 text-slate-800 md:text-[18px] md:leading-9">
          Semua hal penting tentang proses voting dijelaskan dengan bahasa sederhana, aman, dan mudah diikuti.
        </p>

        <div id="tour-voter-help-search" className="mt-8 flex h-16 items-center gap-4 rounded-[24px] bg-slate-100 px-4 sm:px-5">
          <Search className="h-5 w-5 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari panduan memilih, akun, atau kendala..."
            maxLength={100}
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
      <section id="tour-voter-help-flow" className="mt-6 rounded-[32px] bg-[#161f35] p-8 text-white">
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

      <StaggerContainer stagger={150} variant="fade-up" className="mt-6 grid gap-6">
        <HelpChatCard />

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
