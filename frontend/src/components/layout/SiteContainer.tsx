import { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export const SITE_CONTAINER_CLASS =
  'mx-auto w-full max-w-[1320px] px-4 md:px-5 lg:px-6'

type SiteContainerProps = HTMLAttributes<HTMLDivElement>
type MainContainerProps = HTMLAttributes<HTMLElement>

export function SiteContainer({ className, ...props }: SiteContainerProps) {
  return <div className={cn(SITE_CONTAINER_CLASS, className)} {...props} />
}

export function MainContainer({ className, ...props }: MainContainerProps) {
  return <main className={cn(SITE_CONTAINER_CLASS, className)} {...props} />
}
