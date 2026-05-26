'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, FileText, Vote, HelpCircle, ShieldCheck, Users, AlertTriangle } from 'lucide-react'
import { sharedContext } from '@/lib/shared-context'

export type CommandPaletteRole = 'admin' | 'voter' | 'superadmin'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: CommandPaletteRole
}

interface SearchItem {
  id: string
  title: string
  description?: string
  category: string
  icon: typeof Search
  href: string
}

const adminData: SearchItem[] = [
  { id: 'a1', title: sharedContext.candidates[0].name, description: 'Kandidat #1 - Pemilihan Koordinator', category: 'Kandidat', icon: User, href: `/admin/manajemen-pemilihan/${sharedContext.electionId}` },
  { id: 'a2', title: sharedContext.proposalTitle, description: 'Fase: Commit', category: 'Pemilihan', icon: Vote, href: `/admin/manajemen-pemilihan/${sharedContext.electionId}` },
  { id: 'a3', title: '0x8f2a...d3e1', description: 'Pemilih Terdaftar', category: 'Voters', icon: User, href: '/admin' },
  { id: 'a4', title: sharedContext.proposalTitle, description: 'Proposal utama UKM Riset', category: 'Proposal', icon: FileText, href: `/admin/daftar-proposal/${sharedContext.proposalId}` },
]

const voterData: SearchItem[] = [
  { id: 'v1', title: sharedContext.proposalTitle, description: 'Sedang Berlangsung', category: 'Pemilihan', icon: Vote, href: `/pemilih/pemilihan/${sharedContext.electionId}/pilih-kandidat` },
  { id: 'v2', title: sharedContext.candidates[0].name, description: 'Kandidat Koordinator', category: 'Kandidat', icon: User, href: `/pemilih/pemilihan/${sharedContext.electionId}/pilih-kandidat` },
  { id: 'v3', title: 'Cara Menghubungkan Dompet', description: 'Panduan Pengguna', category: 'Bantuan', icon: HelpCircle, href: '/pemilih/bantuan' },
  { id: 'v4', title: 'Kenapa Gas Fee Gagal?', description: 'Panduan Pengguna', category: 'Bantuan', icon: HelpCircle, href: '/pemilih/bantuan' },
]

const superadminData: SearchItem[] = [
  { id: 's1', title: 'Dian Sastrowardoyo', description: 'Admin aktif dengan akses global', category: 'Admin', icon: Users, href: '/superadmin/manajemen-admin' },
  { id: 's2', title: sharedContext.proposalTitle, description: 'Ruang aktif UKM Riset dan Inovasi', category: 'Pemilihan', icon: Vote, href: `/superadmin/manajemen-pemilihan/${sharedContext.electionId}/moderasi` },
  { id: 's3', title: sharedContext.proposalTitle, description: 'Proposal utama untuk review superadmin', category: 'Proposal', icon: FileText, href: `/superadmin/manajemen-proposal/${sharedContext.proposalId}` },
  { id: 's4', title: 'Aktivitas mencurigakan', description: 'Deteksi anomali pada ruang voting', category: 'Keamanan', icon: AlertTriangle, href: '/superadmin/risk-activity' },
  { id: 's5', title: 'Audit log jaringan', description: 'Riwayat event tervalidasi secara global', category: 'Audit', icon: ShieldCheck, href: '/superadmin/audit-log' },
]

export function CommandPalette({ open, onOpenChange, role }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(true)
      }
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [open])

  if (!open) return null

  let dataSource: SearchItem[] = []
  if (role === 'admin') dataSource = adminData
  else if (role === 'superadmin') dataSource = superadminData
  else if (role === 'voter') dataSource = voterData

  const filteredData = query === '' 
    ? dataSource 
    : dataSource.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.description?.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )

  const groupedData = filteredData.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, SearchItem[]>)

  const handleSelect = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]">
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all">
        <div className="flex items-center border-b border-slate-100 px-4">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            className="h-14 w-full border-0 bg-transparent pl-4 pr-4 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            placeholder="Ketik kata kunci pencarian..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex h-6 items-center rounded bg-slate-100 px-2 text-[11px] font-medium text-slate-500 uppercase tracking-widest">
            ESC
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {Object.keys(groupedData).length === 0 ? (
            <div className="py-14 text-center text-[14px] text-slate-500">
              Tidak ada hasil pencarian untuk "{query}"
            </div>
          ) : (
            Object.entries(groupedData).map(([category, items]) => (
              <div key={category} className="mb-2">
                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {category}
                </div>
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item.href)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-slate-900">{item.title}</p>
                          {item.description && (
                            <p className="mt-0.5 text-[12px] text-slate-500">{item.description}</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-[12px] text-slate-500">
          Tip: Gunakan panah untuk navigasi, dan <kbd className="font-sans font-semibold">Enter</kbd> untuk memilih.
        </div>
      </div>
    </div>
  )
}
