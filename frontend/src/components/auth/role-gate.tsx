'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import { Clock, ArrowLeft } from 'lucide-react'
import type { AppRole } from '@/lib/repositories/types'
import { useCurrentProfile } from '@/hooks/use-profile'
import { useLanguage } from '@/lib/contexts/language-context'

export function RoleGate({
  allowedRoles,
  fallbackTitle,
  fallbackDescription,
  loginHref = '/hubungkan-dompet',
  children,
}: {
  allowedRoles: AppRole[]
  fallbackTitle: string
  fallbackDescription: string
  loginHref?: string
  children: ReactNode
}) {
  const { data: currentProfile, isLoading } = useCurrentProfile()
  const { locale } = useLanguage()

  if (isLoading) return null

  if (!currentProfile || !allowedRoles.includes(currentProfile.role)) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center p-6">
        <div className="w-full max-w-[480px] overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-xl md:p-12">
           <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[24px] bg-slate-50 text-slate-300">
              <Clock className="h-10 w-10" strokeWidth={1.5} />
           </div>
           
           <h2 className="text-[28px] font-bold tracking-tight text-slate-900 md:text-[32px]">{fallbackTitle}</h2>
           <p className="mx-auto mt-4 max-w-[340px] text-[15px] leading-7 text-slate-500">
             {fallbackDescription}
           </p>
           
           <div className="mt-10 flex flex-col gap-3">
             <Link 
               href={loginHref} 
               className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#0B1120] px-8 text-[15px] font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
             >
               {locale === 'Bahasa Indonesia' ? 'MASUK ULANG' : 'LOG IN AGAIN'}
             </Link>
             <Link 
               href="/" 
               className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-[14px] font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900"
             >
               <ArrowLeft className="h-4 w-4" />
               {locale === 'Bahasa Indonesia' ? 'Kembali ke Beranda' : 'Back to Home'}
             </Link>
           </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
