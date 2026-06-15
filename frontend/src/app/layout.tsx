import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { AppProviders } from '@/components/ui/providers'
import { BackendStatusBanner } from '@/components/ui/backend-status-banner'
import './globals.css'

const inter = Inter({
  variable: '--font-geist',
  subsets: ['latin'],
})

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Votein - E-Voting Organisasi Mahasiswa',
  description:
    'Landing page Votein untuk implementasi e-voting organisasi mahasiswa berbasis Base Sepolia dengan fokus transparansi, auditabilitas, dan kemudahan penggunaan.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof window !== 'undefined' && window.ethereum) {
                  const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
                  if (descriptor && !descriptor.writable) {
                    Object.defineProperty(window, 'ethereum', {
                      value: window.ethereum,
                      writable: true,
                      configurable: true
                    });
                  }
                }
              } catch (e) {
                console.warn('Could not make window.ethereum writable:', e);
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetBrainsMono.variable} font-sans`}>
        <BackendStatusBanner />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
