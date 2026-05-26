'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface WalletAddressProps {
  address: string
  className?: string
}

/**
 * Displays a wallet address that fills the available container width.
 * Uses a hidden measurer to binary-search the maximum number of visible
 * characters before applying middle-truncation with "...".
 *
 * - If the full address fits → show everything.
 * - If not → show as many characters as possible, replacing the middle
 *   with "..." so the text fills right up to the container edge.
 *   Always keeps at least 4 chars at the start and 4 at the end.
 */
export function WalletAddress({ address, className = '' }: WalletAddressProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(address)

  const compute = useCallback(() => {
    const container = containerRef.current
    const measurer = measureRef.current
    if (!container || !measurer || !address) return

    const availableWidth = container.clientWidth

    // First check if full address fits
    measurer.textContent = address
    if (measurer.scrollWidth <= availableWidth) {
      setDisplay(address)
      return
    }

    // Binary search for max visible chars that fit
    // Format: <startChars>...<endChars>
    // We keep endChars fixed at 4 and vary startChars
    const endChars = 4
    const ellipsis = '...'
    const suffix = address.slice(-endChars)
    const minStart = 4

    let lo = minStart
    let hi = address.length - endChars - 1
    let bestStart = minStart

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      const candidate = address.slice(0, mid) + ellipsis + suffix
      measurer.textContent = candidate
      if (measurer.scrollWidth <= availableWidth) {
        bestStart = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }

    // If bestStart covers almost all chars, just show full
    if (bestStart >= address.length - endChars - 1) {
      setDisplay(address)
    } else {
      setDisplay(address.slice(0, bestStart) + ellipsis + suffix)
    }
  }, [address])

  useEffect(() => {
    compute()

    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(compute)
    observer.observe(el)
    return () => observer.disconnect()
  }, [compute])

  return (
    <div ref={containerRef} className={`relative whitespace-nowrap overflow-hidden ${className}`} title={address}>
      {/* Hidden measurer — same font styles, positioned off-screen */}
      <span
        ref={measureRef}
        aria-hidden
        className="invisible absolute left-0 top-0 whitespace-nowrap"
        style={{ pointerEvents: 'none' }}
      />
      {display}
    </div>
  )
}
