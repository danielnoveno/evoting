'use client'

import { ReactNode } from 'react'
import { DynamicPageTitle } from '@/components/ui/dynamic-page-title'
import { ToastProvider } from '@/components/ui/toast-provider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <DynamicPageTitle />
      {children}
    </ToastProvider>
  )
}
