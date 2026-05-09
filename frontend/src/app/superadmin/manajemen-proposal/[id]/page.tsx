'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, X, Download, FileText, Calendar, Users, Briefcase } from 'lucide-react'
import { SuperadminShell } from '@/components/superadmin/superadmin-shell'
import { superadminManajemenProposalContent } from '@/lib/dummy-superadmin-content'

export default function ReviewProposalPage() {
  const params = useParams()
  const router = useRouter()
  
  const proposalId = params.id as string
  const proposal = superadminManajemenProposalContent.proposals.find(p => p.id === proposalId) || superadminManajemenProposalContent.proposals[0]

  return (
    <SuperadminShell>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[24px] font-semibold text-slate-900">Review Proposal: {proposal.id}</h1>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-8">
            <h2 className="text-[28px] font-semibold text-slate-900">{proposal.title}</h2>
            <div className="mt-4 flex items-center gap-4">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] ${
                proposal.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                proposal.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                'bg-amber-50 text-amber-700'
              }`}>
                Status: {proposal.status}
              </span>
              <span className="text-[14px] text-slate-500">Diajukan pada {proposal.submittedAt}</span>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Institusi Pengaju
                </p>
                <p className="mt-2 text-[16px] text-slate-900 font-medium">{proposal.instansi}</p>
              </div>
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Estimasi Pemilih
                </p>
                <p className="mt-2 text-[16px] text-slate-900 font-medium">1,200 Pemilih</p>
              </div>
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Jadwal Pemilihan
                </p>
                <p className="mt-2 text-[16px] text-slate-900 font-medium">12 - 15 Juni 2026</p>
              </div>
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Tipe Kontrak
                </p>
                <p className="mt-2 text-[16px] text-slate-900 font-medium">Standard Voting (Commit-Reveal)</p>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-8">
              <h3 className="text-[18px] font-semibold text-slate-900">Deskripsi Tujuan</h3>
              <p className="mt-4 text-[15px] leading-7 text-slate-600">
                Proposal ini diajukan untuk memfasilitasi pemilihan ketua himpunan secara transparan dan aman menggunakan teknologi blockchain. Kami memerlukan ruang pemilihan dengan sistem commit-reveal untuk menghindari manipulasi data suara selama masa pemilihan berlangsung.
              </p>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-8">
            <h3 className="text-[18px] font-semibold text-slate-900">Dokumen Lampiran</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-slate-900">Surat_Permohonan_Resmi.pdf</p>
                    <p className="text-[12px] text-slate-500">2.4 MB</p>
                  </div>
                </div>
                <button className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-[13px] font-medium text-slate-700 hover:bg-slate-200">
                  <Download className="h-4 w-4" /> Unduh
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[32px] bg-slate-100 p-6">
            <h3 className="text-[18px] font-semibold text-slate-900">Aksi Review</h3>
            <p className="mt-2 text-[14px] text-slate-500">Setujui atau tolak pengajuan ini. Jika disetujui, contract akan disiapkan.</p>
            
            <div className="mt-6 space-y-3">
              <button className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-6 text-[15px] font-medium text-white hover:bg-slate-900">
                <Check className="h-5 w-5" /> Setujui Proposal
              </button>
              <button className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-6 text-[15px] font-medium text-red-600 hover:bg-red-50 hover:border-red-200">
                <X className="h-5 w-5" /> Tolak Proposal
              </button>
            </div>
          </section>
        </div>
      </div>
    </SuperadminShell>
  )
}
