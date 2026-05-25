'use client'

import Link from 'next/link'

export function ConnectWalletButton() {
  return (
    <Link
      href="/hubungkan-dompet"
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#1E293B]"
    >
      Masuk
    </Link>
  )
}
