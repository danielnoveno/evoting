import { ArrowRight, Eraser, Mail, MessageSquare, Search, Shield, Sparkles } from 'lucide-react'

import { VoterFooterMeta } from '@/components/voter/VoterFooterMeta'
import { VoterShell } from '@/components/voter/VoterShell'

const flowSteps = [
  {
    title: 'Pilih Kandidat',
    desc: 'Tentukan pilihan Anda di bilik suara digital yang terenkripsi.',
  },
  {
    title: 'Kirim Commit',
    desc: 'Suara dikirim dalam bentuk terenkripsi (hash) ke blockchain.',
  },
  {
    title: 'Tunggu Fase',
    desc: 'Menunggu periode pemilihan selesai sebelum masuk ke fase pembukaan.',
  },
  {
    title: 'Buka Reveal',
    desc: 'Sistem secara otomatis membuka enkripsi untuk dihitung secara publik.',
  },
]

export default function VoterHelpPage() {
  return (
    <VoterShell active="bantuan">
      <section className="space-y-10">
        <div>
          <h1 className="text-6xl font-semibold leading-tight text-slate-900">Pusat Bantuan Pemilih</h1>
          <p className="mt-4 max-w-4xl text-2xl leading-relaxed text-slate-600">
            Segala hal yang perlu Anda ketahui tentang proses pemilihan berbasis blockchain yang aman, transparan, dan tidak dapat dimanipulasi.
          </p>
        </div>

        <div className="flex h-20 items-center gap-3 rounded-3xl bg-slate-200 px-6 text-slate-500">
          <Search className="h-7 w-7" />
          <input className="w-full bg-transparent text-2xl placeholder:text-slate-500 focus:outline-none" placeholder="Cari panduan, istilah teknis, atau kendala..." type="text" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr_1fr]">
          <article className="rounded-[30px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
              <Eraser className="h-7 w-7" />
            </div>
            <h2 className="text-5xl font-semibold text-slate-900">Cara Memilih</h2>
            <p className="mt-3 text-2xl leading-relaxed text-slate-600">Panduan lengkap langkah demi langkah untuk menyalurkan hak suara Anda dari mana saja.</p>
            <button className="mt-8 inline-flex items-center gap-2 text-2xl font-semibold text-slate-900" type="button">
              Lihat Detail <ArrowRight className="h-5 w-5" />
            </button>
          </article>

          <article className="rounded-[30px] bg-[#F2F4F6] p-8">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Shield className="h-7 w-7" />
            </div>
            <h3 className="text-4xl font-semibold text-slate-900">Keamanan</h3>
            <p className="mt-3 text-xl leading-relaxed text-slate-600">Bagaimana kriptografi menjaga kerahasiaan pilihan Anda.</p>
          </article>

          <article className="rounded-[30px] bg-[#F2F4F6] p-8">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-4xl font-semibold text-slate-900">Teknis</h3>
            <p className="mt-3 text-xl leading-relaxed text-slate-600">Solusi kendala aplikasi dan koneksi jaringan.</p>
          </article>
        </div>

        <article className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-[#F2F4F6] px-7 py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-4xl font-semibold text-slate-900">Bukti Suara & Verifikasi</h3>
              <p className="mt-1 text-2xl text-slate-600">Pelajari cara menggunakan hash blockchain untuk memverifikasi bahwa suara Anda telah tercatat dengan benar tanpa mengungkap identitas Anda.</p>
            </div>
          </div>
          <button className="rounded-2xl p-2 text-slate-400 hover:bg-slate-200" type="button">
            <ArrowRight className="h-6 w-6" />
          </button>
        </article>

        <article className="rounded-[30px] bg-gradient-to-b from-[#131B2E] to-[#0F172A] p-8 text-white">
          <h3 className="text-5xl font-semibold">Alur Memilih Commit-Reveal</h3>
          <p className="mt-3 text-2xl text-slate-300">Sistem kami menggunakan dua tahap untuk menjamin integritas suara.</p>

          <div className="mt-8 grid gap-6 lg:grid-cols-4">
            {flowSteps.map((step, index) => (
              <div key={step.title}>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl font-semibold text-slate-900">
                  {index + 1}
                </div>
                <p className="text-3xl font-semibold">{step.title}</p>
                <p className="mt-2 text-xl leading-relaxed text-slate-300">{step.desc}</p>
              </div>
            ))}
          </div>
        </article>

        <div className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-[30px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Mail className="h-7 w-7" />
            </div>
            <h3 className="text-4xl font-semibold text-slate-900">Hubungi via Email</h3>
            <p className="mt-3 text-2xl text-slate-600">Respon dalam 24 jam untuk pertanyaan non-mendesak.</p>
            <button className="mt-8 rounded-2xl bg-black px-6 py-4 text-2xl font-semibold text-white" type="button">
              bantuan@portalsuara.id
            </button>
          </article>

          <article className="rounded-[30px] border-l-4 border-blue-600 bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h3 className="text-4xl font-semibold text-slate-900">Live Chat 24/7</h3>
            <p className="mt-3 text-2xl text-slate-600">Bicara langsung dengan tim dukungan teknis kami.</p>
            <button className="mt-8 rounded-2xl bg-blue-600 px-8 py-4 text-2xl font-semibold text-white" type="button">
              Mulai Chat Sekarang
            </button>
          </article>
        </div>

        <VoterFooterMeta />
      </section>
    </VoterShell>
  )
}
