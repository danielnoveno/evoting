import { ReactNode } from 'react'

/**
 * Shared navbar dan footer untuk seluruh aplikasi.
 *
 * Ubah style di sini → otomatis update di semua halaman.
 */

const NAVBAR_BASE = 'border-b border-slate-100 bg-white'
const FOOTER_BASE = 'border-t border-slate-100 bg-white'

interface AppNavbarProps {
  children: ReactNode
  /** Extra className (position, z-index, padding, dll.) */
  className?: string
}

export function AppNavbar({ children, className = '' }: AppNavbarProps) {
  return (
    <header className={`${NAVBAR_BASE} ${className}`}>
      {children}
    </header>
  )
}

interface AppFooterProps {
  children: ReactNode
  /** Extra className (position, z-index, padding, dll.) */
  className?: string
}

export function AppFooter({ children, className = '' }: AppFooterProps) {
  return (
    <footer className={`${FOOTER_BASE} ${className}`}>
      {children}
    </footer>
  )
}
