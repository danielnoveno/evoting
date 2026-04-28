import Image from 'next/image'

import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <Image
      alt="Logo Votein"
      className={cn('h-9 w-auto', className)}
      height={120}
      priority
      src="/brand/voteinin-item-kecil.png"
      width={420}
    />
  )
}
