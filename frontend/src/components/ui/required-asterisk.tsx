import React from 'react'

interface RequiredAsteriskProps {
  className?: string
}

export function RequiredAsterisk({ className = '' }: RequiredAsteriskProps) {
  return (
    <span 
      className={`ml-1 text-red-500 font-bold ${className}`} 
      aria-hidden="true"
      title="Wajib diisi"
    >
      *
    </span>
  )
}
