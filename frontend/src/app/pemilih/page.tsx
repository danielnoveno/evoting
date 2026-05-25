'use client'

import { ArrowRight, CircleCheck, ExternalLink, Hourglass, Fingerprint, CheckCircle2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { VoterPageSkeleton, VoterShell } from '@/components/voter/voter-shell'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { useToast } from '@/components/ui/toast-provider'
import { useQuery } from '@tanstack/react-query'
import { listActiveElections } from '@/lib/repositories/voterRepository'
import { formatNumber } from '@/lib/voter-mock-store'

export default function VoterDashboardPage() {
  const { data: elections, isLoading } = useQuery({
    queryKey: ['active-elections'],
    queryFn: listActiveElections
  })

  if (isLoading) {
    return (
      <VoterShell>
        <VoterPageSkeleton />
      </VoterShell>
    )
  }

  const activeElections = elections ?? []

  return (
    <VoterShell>
      <ScrollReveal variant="fade-up" duration={800}>
        <section>
          <h1 className="mt-3 text-[28px] font-semibold text-slate-900 sm:text-[34px] md:text-[40px]">Ruang Voting Saya</h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-7 text-slate-800 md:text-[16px] md:leading-8">
            Pantau ruang voting yang sedang aktif di blockchain Base Sepolia.
          </p>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={100} duration={800}>
        <section className="mt-10 grid gap-6 md:grid-cols-2">
          {activeElections.length === 0 ? (
            <div className="md:col-span-2 p-20 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50">
               <Hourglass className="h-10 w-10 text-slate-300 mx-auto mb-6" />
               <h2 className="text-[20px] font-semibold text-slate-900">Belum Ada Pemilihan Aktif</h2>
               <p className="mt-2 text-slate-500">Tunggu admin mempublikasikan ruang pemilihan baru.</p>
            </div>
          ) : (
            activeElections.map((election) => (
              <article key={election.id} className="rounded-3xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-xl hover:shadow-blue-900/5 group">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">Terdeploy On-Chain</span>
                    <h2 className="mt-4 text-[24px] font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{election.title}</h2>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <CircleCheck className="h-6 w-6 text-slate-400" />
                  </div>
                </div>
                
                <p className="mt-4 text-[14px] leading-relaxed text-slate-600 line-clamp-2">
                  {election.description || 'Pemilihan umum digital menggunakan teknologi blockchain.'}
                </p>

                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ID Ruang</p>
                     <p className="mt-1 font-mono text-[13px] text-slate-700">{election.id}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Organisasi</p>
                     <p className="mt-1 text-[13px] font-semibold text-slate-900">{election.organizationName || '-'}</p>
                   </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <Link
                    href={`/pemilih/pemilihan/${election.id}/pilih-kandidat`}
                    className="flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[14px] font-bold text-white hover:bg-slate-900 transition-all"
                  >
                    Masuk Ruang Voting
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                   <Link
                    href={`/pemilih/pemilihan/${election.id}/hasil`}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
      </ScrollReveal>
    </VoterShell>
  )
}
