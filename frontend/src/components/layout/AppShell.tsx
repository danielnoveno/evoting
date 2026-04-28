import { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { GlobalNav } from './GlobalNav'
import { MainContainer } from './SiteContainer'
import { TabItem, TabNav } from './TabNav'

interface AppShellProps {
  children: ReactNode
  tabs?: TabItem[]
  spaceName?: string
  mainClassName?: string
  pageClassName?: string
}

export function AppShell({ children, tabs, spaceName, mainClassName, pageClassName }: AppShellProps) {
  return (
    <div className={cn('bg-slate-50 text-slate-900', pageClassName)}>
      <GlobalNav spaceName={spaceName} />
      {tabs ? <TabNav items={tabs} /> : null}
      <MainContainer className={mainClassName}>{children}</MainContainer>
    </div>
  )
}
