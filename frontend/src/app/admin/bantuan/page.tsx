'use client'

import { AdminShell } from '@/components/admin/admin-shell'
import { OnboardingTour } from '@/components/admin/onboarding-tour'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { BookOpen, HelpCircle, Mail } from 'lucide-react'

export default function AdminHelpPage() {
  return (
    <AdminShell>
      <OnboardingTour />
      <ScrollReveal variant="fade-up" duration={700}>
        <section className="mb-10">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-6">
            <span>ADMIN</span>
            <span>›</span>
            <span className="text-slate-900">PUSAT BANTUAN</span>
          </div>
          <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[44px]">
            Pusat Bantuan Admin
          </h1>
          <p className="mt-3 text-[16px] leading-8 text-slate-800 max-w-2xl">
            Butuh bantuan mengoperasikan sistem e-voting? Temukan panduan dan FAQ untuk membantu tugas administratif Anda.
          </p>
        </section>
      </ScrollReveal>

      <StaggerContainer stagger={100} className="grid gap-6 md:grid-cols-2">
        <section className="rounded-[32px] bg-white border border-slate-100 p-8 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-[20px] font-bold text-slate-900 mb-4">Panduan Cepat</h2>
          <ul className="space-y-4 text-[15px] text-slate-600">
            <li className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Cara membuat draf proposal pemilihan
            </li>
            <li className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Mengunggah daftar pemilih (Whitelist CSV)
            </li>
            <li className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Proses reveal kunci enkripsi suara
            </li>
          </ul>
        </section>

        <section className="rounded-[32px] bg-white border border-slate-100 p-8 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h2 className="text-[20px] font-bold text-slate-900 mb-4">FAQ</h2>
          <ul className="space-y-4 text-[15px] text-slate-600">
            <li className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Apa yang terjadi jika gas fee tidak cukup?
            </li>
            <li className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Bagaimana cara mengganti wallet admin?
            </li>
            <li className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Berapa lama masa berlaku draf proposal?
            </li>
          </ul>
        </section>
      </StaggerContainer>

      <section className="mt-12 rounded-[32px] bg-slate-900 p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-md">
          <h2 className="text-[24px] font-bold mb-3">Butuh bantuan lebih lanjut?</h2>
          <p className="text-slate-400 text-[15px] leading-7">
            Tim teknis kami siap membantu Anda menyelesaikan kendala operasional platform.
          </p>
        </div>
        <a href="mailto:support@votein.biz.id?subject=Bantuan%20Admin%20Votein" className="inline-flex h-14 items-center gap-3 rounded-2xl bg-white px-8 text-slate-900 font-bold hover:bg-slate-100 transition-colors">
          <Mail className="h-5 w-5" />
          support@votein.biz.id
        </a>
      </section>
    </AdminShell>
  )
}
