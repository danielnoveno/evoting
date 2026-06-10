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
        <div className="w-full max-w-[540px] rounded-[48px] border border-slate-200 bg-white p-10 text-center shadow-2xl md:p-16">
           <div className="mx-auto mb-10 flex h-32 w-32 items-center justify-center rounded-full bg-slate-50 text-slate-200">
              <Clock className="h-16 w-16" strokeWidth={1.5} />
           </div>
           
           <h2 className="text-[32px] font-bold tracking-tight text-slate-900 md:text-[36px]">{fallbackTitle}</h2>
           <p className="mx-auto mt-5 max-w-[400px] text-[16px] leading-8 text-slate-500">
             {fallbackDescription}
           </p>
           
           <div className="mt-12 flex flex-col gap-4">
             <Link 
               href={loginHref} 
               className="inline-flex h-14 items-center justify-center rounded-2xl bg-indigo-600 px-8 text-[16px] font-bold text-white transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/25 active:scale-[0.98]"
             >
               {locale === 'Bahasa Indonesia' ? 'MASUK ULANG' : 'LOG IN AGAIN'}
             </Link>
             <Link 
               href="/" 
               className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white px-8 text-[15px] font-semibold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900"
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
