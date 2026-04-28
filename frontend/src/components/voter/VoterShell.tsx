'use client'

import Link from 'next/link'
import { Bell, CircleHelp, Home, Menu, ShieldCheck, UserRoundCog, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'

import { BrandLogo } from '@/components/layout/BrandLogo'
import { clearDemoSessionRole } from '@/lib/demo-auth'
import { cn } from '@/lib/utils'
import {
  DEFAULT_VOTER_NAME,
  VOTER_PROFILE_UPDATED_EVENT,
  getProfileInitials,
  getShortAddress,
  getVoterProfileStorageKey,
  parseSavedVoterSetting,
} from '@/lib/voter-profile'

export type VoterNavKey = 'beranda' | 'bukti' | 'bantuan'

interface VoterShellProps {
  children: ReactNode
  active: VoterNavKey
}

const navItems: Array<{ key: VoterNavKey; label: string; href: string; icon: typeof Home }> = [
  { key: 'beranda', label: 'Beranda', href: '/voter/beranda', icon: Home },
  { key: 'bukti', label: 'Bukti Saya', href: '/voter/bukti', icon: ShieldCheck },
  { key: 'bantuan', label: 'Bantuan', href: '/voter/bantuan', icon: CircleHelp },
]

export function VoterShell({ children, active }: VoterShellProps) {
  const router = useRouter()
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const walletId = useMemo(() => address?.toLowerCase() ?? 'demo-voter', [address])
  const walletLabel = useMemo(() => (address ? getShortAddress(address) : '0x71C...4f2'), [address])

  const [displayName, setDisplayName] = useState(DEFAULT_VOTER_NAME)
  const [photoUrl, setPhotoUrl] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = () => {
    if (isSigningOut) return

    setIsSigningOut(true)
    clearDemoSessionRole()
    try {
      disconnect()
    } catch {
      // no-op: tetap lanjut ke halaman login meski disconnect wallet gagal.
    }
    router.replace('/login')
    router.refresh()
  }

  useEffect(() => {
    const key = getVoterProfileStorageKey(walletId)

    const syncProfile = () => {
      const saved = parseSavedVoterSetting(localStorage.getItem(key))
      setDisplayName(saved?.displayName || DEFAULT_VOTER_NAME)
      setPhotoUrl(saved?.photoUrl || '')
    }

    syncProfile()
    window.addEventListener(VOTER_PROFILE_UPDATED_EVENT, syncProfile)

    return () => window.removeEventListener(VOTER_PROFILE_UPDATED_EVENT, syncProfile)
  }, [walletId])

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-slate-900">
      <aside className="fixed left-0 top-0 hidden h-screen w-[296px] flex-col border-r border-slate-200 bg-[#F2F4F6] md:flex">
        <div className="border-b border-slate-200 px-9 pb-7 pt-9">
          <div className="flex items-center justify-between gap-3">
            <BrandLogo className="h-10" />
            <button className="rounded-lg p-2 text-slate-700 hover:bg-slate-200" type="button">
              <Menu className="h-7 w-7" />
            </button>
          </div>

          <p className="font-label mt-4 text-[14px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            E-Voting with Blockchain System
          </p>
        </div>

        <nav className="space-y-3 px-9 py-8">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = active === item.key

            return (
              <Link
                className={cn(
                  'flex items-center gap-4 rounded-xl px-4 py-4 text-base',
                  isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200',
                )}
                href={item.href}
                key={item.key}
              >
                <Icon className="h-7 w-7" />
                <span className={cn('text-lg', isActive ? 'font-semibold' : 'font-normal')}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto space-y-4 px-9 pb-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-white">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="Foto profil pemilih" className="h-full w-full object-cover" src={photoUrl} />
                ) : (
                  <span className="text-sm font-semibold text-slate-700">{getProfileInitials(displayName)}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900">{displayName}</p>
                <p className="truncate font-mono text-xs text-slate-500">{walletLabel}</p>
              </div>
            </div>

            <Link
              className="mt-4 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900"
              href="/voter/profil/sunting"
            >
              <UserRoundCog className="h-5 w-5" />
              Sunting Profil
            </Link>
          </div>

          <button
            className="h-12 w-full rounded-xl bg-black text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSigningOut}
            onClick={handleSignOut}
            type="button"
          >
            {isSigningOut ? 'Keluar...' : 'Keluar Sesi'}
          </button>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-40 h-20 border-b border-slate-200 bg-[#F7F9FB]/95 backdrop-blur md:left-[296px]">
        <div className="flex h-full items-center justify-end gap-3 px-4 md:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-800">
            <Wallet className="h-4 w-4" />
            {walletLabel}
          </div>

          <button className="rounded-full p-2 text-slate-700 hover:bg-slate-200" type="button">
            <Bell className="h-6 w-6" />
          </button>

          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-200">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Avatar pemilih" className="h-full w-full object-cover" src={photoUrl} />
            ) : (
              <span className="text-sm font-semibold text-slate-700">{getProfileInitials(displayName)}</span>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 pb-16 pt-24 md:pl-[344px] md:pr-8 md:pt-28">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white md:hidden">
        <div className="grid grid-cols-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = active === item.key

            return (
              <Link
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-3 text-xs',
                  isActive ? 'text-slate-900' : 'text-slate-500',
                )}
                href={item.href}
                key={item.key}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
