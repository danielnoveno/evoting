import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string): string {
  if (!address.startsWith('0x') || address.length < 12) return address
  return `0x${address.slice(2, 8)}...${address.slice(-4)}`
}
