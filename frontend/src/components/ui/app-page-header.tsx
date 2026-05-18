import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'

export interface AppPageHeaderProps {
  title: ReactNode
  description?: ReactNode
  backLink?: {
    href: string
    label?: string
  }
  rightContent?: ReactNode
  bottomContent?: ReactNode
}

export function AppPageHeader({ title, description, backLink, rightContent, bottomContent }: AppPageHeaderProps) {
  return (
    <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
      <div className="max-w-[760px]">
        {backLink ? (
          <Link href={backLink.href} className="mb-6 inline-flex items-center gap-2 text-[14px] font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {backLink.label ?? 'Kembali'}
          </Link>
        ) : null}
        <h1 className="text-[32px] font-semibold tracking-[-0.04em] text-slate-900 md:text-[40px] xl:text-[44px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 text-[16px] leading-8 text-slate-600">
            {description}
          </p>
        ) : null}
        {bottomContent ? <div className="mt-8">{bottomContent}</div> : null}
      </div>
      {rightContent ? (
        <div className="shrink-0 xl:pt-2">
          {rightContent}
        </div>
      ) : null}
    </section>
  )
}
