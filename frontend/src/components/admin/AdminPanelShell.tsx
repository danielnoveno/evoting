'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  CircleHelp,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Search,
  Settings,
} from 'lucide-react'

import { cn } from '@/lib/utils'

interface AdminPanelShellProps {
  children: React.ReactNode
}

const menus = [
  { label: 'Beranda', href: '/admin/beranda', icon: Home },
  { label: 'Manajemen Pemilihan', href: '/admin/manajemen-pemilihan', icon: ClipboardList },
  { label: 'Daftar Proposal', href: '/admin/daftar-proposal', icon: FileText },
  { label: 'Bantuan', href: '/admin/bantuan', icon: CircleHelp },
]

export function AdminPanelShell({ children }: AdminPanelShellProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-900">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[300px_1fr]">
        <aside className="flex flex-col border-r border-slate-200 bg-[#F2F4F8] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">◐</div>
            <div>
              <p className="text-[40px] font-semibold leading-none">Voteblock Admin</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">Otoritas Pemilihan</p>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {menus.map((menu) => {
              const Icon = menu.icon
              const active = pathname === menu.href

              return (
                <Link
                  className={cn(
                    'relative flex items-center gap-3 rounded-2xl px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors',
                    active
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-200',
                  )}
                  href={menu.href}
                  key={menu.href}
                >
                  <span className={cn('rounded-lg p-1.5', active ? 'bg-[#0F172A] text-white' : 'bg-transparent')}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {menu.label}
                  {active ? <span className="absolute right-0 top-3 h-10 w-1 rounded-l-full bg-[#1E3A8A]" /> : null}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto border-t border-slate-200 pt-4">
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white p-3">
              <div className="h-12 w-12 rounded-full bg-slate-300" />
              <div>
                <p className="text-[14px] font-semibold text-slate-900">Admin Utama</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </div>
            <Link className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700" href="/login">
              <LogOut className="h-4 w-4" />
              Keluar
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="border-b border-slate-200 bg-[#F7F8FC] px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex h-12 items-center gap-2 rounded-2xl bg-[#E8ECF1] px-4 text-slate-500 lg:min-w-[620px]">
                <Search className="h-4 w-4" />
                <input
                  className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none"
                  placeholder="Cari pemilihan atau ID..."
                  type="text"
                />
              </div>

              <div className="flex items-center gap-4">
                <button className="text-slate-500" type="button">
                  <Bell className="h-5 w-5" />
                </button>
                <button className="text-slate-500" type="button">
                  <Settings className="h-5 w-5" />
                </button>
                <span className="h-8 w-px bg-slate-200" />
                <p className="text-sm font-semibold text-slate-900">Dashboard Utama</p>
              </div>
            </div>
          </header>

          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
