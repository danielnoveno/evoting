import { ReactNode } from 'react'

/**
 * Shared navbar dan footer untuk seluruh aplikasi.
 *
 * Ubah style di sini → otomatis update di semua halaman.
 */

const NAVBAR_GLASS = 'border-b border-white/20 bg-white/30 backdrop-blur-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)]'
const FOOTER_GLASS = 'border-t border-white/20 bg-slate-50/30 backdrop-blur-xl shadow-[0_-1px_3px_rgba(15,23,42,0.04)]'

interface AppNavbarProps {
  children: ReactNode
  /** Extra className (position, z-index, padding, dll.) */
  className?: string
}

export function AppNavbar({ children, className = '' }: AppNavbarProps) {
  return (
    <header className={`${NAVBAR_GLASS} ${className}`}>
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
    <footer className={`${FOOTER_GLASS} ${className}`}>
      {children}
    </footer>
  )
}
