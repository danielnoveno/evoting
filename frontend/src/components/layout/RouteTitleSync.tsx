'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { getPageTitle } from '@/lib/page-title'

export function RouteTitleSync() {
  const pathname = usePathname()

  useEffect(() => {
    document.title = getPageTitle(pathname || '/')
  }, [pathname])

  return null
}
