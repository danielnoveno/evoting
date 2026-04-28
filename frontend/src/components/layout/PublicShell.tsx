import { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { PublicFooter } from './PublicFooter'
import { PublicNav } from './PublicNav'
import { MainContainer } from './SiteContainer'

interface PublicShellProps {
  children: ReactNode
  mainClassName?: string
  pageClassName?: string
}

export function PublicShell({ children, mainClassName, pageClassName }: PublicShellProps) {
  return (
    <div className={cn('min-h-screen bg-slate-50 text-slate-900', pageClassName)}>
      <PublicNav />
      <MainContainer className={mainClassName}>{children}</MainContainer>
      <PublicFooter />
    </div>
  )
}
