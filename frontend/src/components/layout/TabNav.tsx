'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { SiteContainer } from '@/components/layout/SiteContainer'
import { cn } from '@/lib/utils'

export interface TabItem {
  label: string
  href: string
}

interface TabNavProps {
  items: TabItem[]
}

export function TabNav({ items }: TabNavProps) {
  const pathname = usePathname()

  return (
    <div className="h-11 overflow-x-auto border-b border-slate-100 bg-white">
      <SiteContainer className="flex h-full items-center gap-1.5">
        {items.map((item) => {
          const active = pathname === item.href

          return (
            <Link
              className={cn(
                'inline-flex h-full items-center border-b-2 px-4 text-[13px] transition-colors',
                active
                  ? 'border-[#0F172A] font-semibold text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600',
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          )
        })}
      </SiteContainer>
    </div>
  )
}
