'use client'

import { ChevronLeft, ChevronRight, Ellipsis, CheckSquare2 } from 'lucide-react'
import { type HTMLAttributes, type ReactNode, type TdHTMLAttributes, useEffect, useRef, useState } from 'react'

export function DataTableShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`overflow-hidden rounded-[28px] border border-slate-200 bg-white ${className}`}>{children}</section>
}

export function DataTableToolbar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between ${className}`}>{children}</div>
}

export function DataTableCount({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="text-[14px] font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-[13px] leading-6 text-slate-600">{description}</p>
    </div>
  )
}

export function DataTableViewport({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto"><div className="min-w-full">{children}</div></div>
}

export function DataTable({ children }: { children: ReactNode }) {
  return <table className="min-w-full border-separate border-spacing-0 text-left">{children}</table>
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-50">{children}</thead>
}

export function DataTableHeaderRow({ children }: { children: ReactNode }) {
  return <tr className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{children}</tr>
}

export function DataTableHeaderCell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={`px-5 py-4 ${className}`}>{children}</th>
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
}

export function DataTableRow({ children, className = '', ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`text-[14px] text-slate-700 transition hover:bg-slate-50/70 ${className}`} {...props}>{children}</tr>
}

export function DataTableCell({ children, className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement> & { children: ReactNode; className?: string }) {
  return <td className={`px-5 py-4 align-middle ${className}`} {...props}>{children}</td>
}

export function DataTableEmpty({ colSpan, title, description }: { colSpan: number; title: string; description: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <div className="mx-auto max-w-md">
          <p className="text-[16px] font-semibold text-slate-900">{title}</p>
          <p className="mt-2 text-[14px] leading-7 text-slate-500">{description}</p>
        </div>
      </td>
    </tr>
  )
}

function buildPagination(currentPage: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  if (currentPage <= 4) return [1, 2, 3, 4, 5, 'ellipsis-right', totalPages] as const
  if (currentPage >= totalPages - 3) return [1, 'ellipsis-left', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const
  return [1, 'ellipsis-left', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-right', totalPages] as const
}

export function DataTableFooter({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  label,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  label: string
}) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)
  const pages = buildPagination(currentPage, totalPages)

  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[13px] text-slate-600">Menampilkan {start} - {end} dari {totalItems} {label}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-slate-100 px-4 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        {pages.map((item, index) => typeof item === 'number' ? (
          <button
            key={`${item}-${index}`}
            type="button"
            onClick={() => onPageChange(item)}
            className={currentPage === item
              ? 'inline-flex h-9 min-w-[36px] items-center justify-center rounded-xl bg-[#0B1120] px-3 text-[13px] font-semibold text-white transition'
              : 'inline-flex h-9 min-w-[36px] items-center justify-center rounded-xl bg-white border border-slate-200 px-3 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50'}
          >
            {String(item).padStart(2, '0')}
          </button>
        ) : (
          <span key={`${item}-${index}`} className="inline-flex h-9 min-w-[36px] items-center justify-center text-[13px] font-semibold text-slate-400">…</span>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-slate-100 px-4 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function SelectedCounter({ title, description, onClear, actions }: { title: string; description: string; onClear: () => void; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-slate-100 p-2 text-slate-700">
          <CheckSquare2 className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-[13px] leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
        >
          Bersihkan Pilihan
        </button>
        {actions}
      </div>
    </div>
  )
}

type RowActionItem = {
  label: string
  onClick: () => void
  tone?: 'default' | 'danger'
  disabled?: boolean
}

export function RowActionMenu({ items, buttonLabel }: { items: RowActionItem[]; buttonLabel: string }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handlePointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handlePointer)
    return () => window.removeEventListener('mousedown', handlePointer)
  }, [open])

  return (
    <div ref={containerRef} className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={buttonLabel}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
      >
        <Ellipsis className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-20 min-w-[180px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
              className={item.tone === 'danger'
                ? 'flex w-full items-center rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50'
                : 'flex w-full items-center rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50'}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
