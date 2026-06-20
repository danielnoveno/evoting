'use client'

import { useState, useEffect } from 'react'
import { Search, ShieldCheck, ExternalLink, LockKeyhole, ClipboardCheck, History, Info } from 'lucide-react'
import { ModalShell } from '@/components/ui/modal-shell'
import type { VoteCommitmentRecord } from '@/lib/vote-commitment-storage'
import { useToast } from '@/components/ui/toast-provider'

export function AuditShortcutModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [txHash, setTxHash] = useState('')
  const [myCommitment, setMyCommitment] = useState<VoteCommitmentRecord | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    if (open) setMyCommitment(null)
  }, [open])

  const handleSearchTx = (e: React.FormEvent) => {
    e.preventDefault()
    if (!txHash.trim()) return
    
    window.open(`https://sepolia.basescan.org/tx/${txHash}`, '_blank')
    onClose()
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    showToast({
      tone: 'success',
      title: 'Berhasil disalin',
      description: `${label} telah disalin ke papan klip.`,
    })
  }

  return (
    <ModalShell
      open={open}
      title="Shortcut Audit"
      description="Cari transaksi langsung di Basescan atau unduh bukti jika transaksi nyata sudah tersedia."
      onClose={onClose}
    >
      <div className="space-y-6">
        {/* Search TX Section */}
        <section>
          <label htmlFor="tx-search" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Cari Transaksi Blockchain
          </label>
          <form onSubmit={handleSearchTx} className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="tx-search"
                type="text"
                placeholder="Masukkan Tx Hash (0x...)"
                maxLength={66}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[14px] text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-[14px] font-medium text-white hover:bg-slate-800"
            >
              Cari
            </button>
          </form>
        </section>

        {/* My Commitment Section */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Bukti Partisipasi Anda
          </p>
          {myCommitment ? (
            <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-slate-900">Komitmen tersimpan di browser</p>
                  <p className="mt-1 text-[13px] text-slate-600">Terdaftar pada: {myCommitment.timestamp}</p>
                  
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-500 uppercase">Commitment Hash</span>
                        <button 
                          onClick={() => copyToClipboard(myCommitment.commitment, 'Commitment hash')}
                          className="text-[11px] font-semibold text-emerald-700 hover:underline"
                        >
                          Salin
                        </button>
                      </div>
                      <p className="mt-1 truncate font-mono text-[12px] text-slate-800">{myCommitment.commitment}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-500 uppercase">Salt (Private)</span>
                        <button 
                          onClick={() => copyToClipboard(myCommitment.salt, 'Private salt')}
                          className="text-[11px] font-semibold text-emerald-700 hover:underline"
                        >
                          Salin
                        </button>
                      </div>
                      <p className="mt-1 truncate font-mono text-[12px] text-slate-800">{myCommitment.salt}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-100/50 px-3 py-2 text-[12px] text-emerald-800">
                <Info className="h-4 w-4 shrink-0" />
                Simpan data ini untuk melakukan Reveal saat fase pemilihan selanjutnya dimulai.
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <LockKeyhole className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-[14px] text-slate-500">
                Belum ada bukti transaksi nyata yang tersimpan untuk ditampilkan di shortcut ini.
              </p>
            </div>
          )}
        </section>

        {/* Quick Links */}
        <section className="grid grid-cols-2 gap-3">
          <a
            href="https://sepolia.basescan.org"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-4 text-center transition-colors hover:bg-slate-100"
          >
            <ExternalLink className="h-5 w-5 text-slate-600" />
            <span className="mt-2 text-[13px] font-medium text-slate-900">Basescan Explorer</span>
          </a>
          <button
            onClick={() => {
              showToast({ tone: 'info', title: 'Audit Bundle', description: 'Fitur unduh audit bundle sedang disiapkan.' })
              onClose()
            }}
            className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-4 text-center transition-colors hover:bg-slate-100"
          >
            <ClipboardCheck className="h-5 w-5 text-slate-600" />
            <span className="mt-2 text-[13px] font-medium text-slate-900">Unduh Bukti Audit</span>
          </button>
        </section>

        {/* Latest Activity Summary */}
        <section className="border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-slate-400" />
              <span className="text-[12px] font-medium text-slate-600">Status Jaringan (Base Sepolia)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Terhubung</span>
            </div>
          </div>
        </section>
      </div>
    </ModalShell>
  )
}
