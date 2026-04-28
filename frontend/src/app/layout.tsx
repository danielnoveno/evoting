import type { Metadata } from 'next'
import { ReactNode } from 'react'

import { RouteTitleSync } from '@/components/layout/RouteTitleSync'
import { Providers } from '@/providers'

import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Votein',
    template: 'Votein - %s',
  },
  description: 'E-voting organisasi mahasiswa berbasis Base Sepolia',
  icons: {
    icon: [{ url: '/brand/votein-favicon.png', type: 'image/png' }],
    shortcut: ['/brand/votein-favicon.png'],
    apple: [{ url: '/brand/votein-favicon.png', type: 'image/png' }],
  },
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
        <RouteTitleSync />
      </body>
    </html>
  )
}
