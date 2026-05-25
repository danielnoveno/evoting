'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import type { AppRole } from '@/lib/repositories/types'
import { useCurrentProfile } from '@/hooks/use-profile'

export function RoleGate({
  allowedRoles,
  fallbackTitle,
  fallbackDescription,
  children,
}: {
  allowedRoles: AppRole[]
  fallbackTitle: string
  fallbackDescription: string
  children: ReactNode
}) {
  const { data: currentProfile } = useCurrentProfile()

  if (currentProfile && !allowedRoles.includes(currentProfile.role)) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-800">
        <p className="text-[16px] font-semibold">{fallbackTitle}</p>
        <p className="mx-auto mt-3 max-w-[560px] text-[14px] leading-7">{fallbackDescription}</p>
        <Link href="/hubungkan-dompet" className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-5 text-[13px] font-medium text-white hover:bg-[#1E293B]">
          Kembali ke Login
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
