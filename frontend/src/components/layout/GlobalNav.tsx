'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'

import { BrandLogo } from '@/components/layout/BrandLogo'
import { SiteContainer } from '@/components/layout/SiteContainer'
import { truncateAddress } from '@/lib/utils'

interface GlobalNavProps {
  spaceName?: string
}

export function GlobalNav({ spaceName }: GlobalNavProps) {
  const { address, isConnected } = useAccount()

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white">
      <SiteContainer className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link className="flex items-center" href="/beranda">
            <BrandLogo className="h-7" />
          </Link>
          {spaceName ? (
            <>
              <span className="text-slate-300">/</span>
              <span className="max-w-[220px] truncate text-[13px] text-slate-400">{spaceName}</span>
            </>
          ) : null}
        </div>

        {isConnected && address ? (
          <div className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="font-mono text-xs text-slate-600">{truncateAddress(address)}</span>
          </div>
        ) : (
          <Link className="flex h-9 items-center rounded-md border border-slate-200 px-3 text-[13px] font-medium text-slate-600 hover:bg-slate-50" href="/login">
            Hubungkan Wallet
          </Link>
        )}
      </SiteContainer>
    </nav>
  )
}
