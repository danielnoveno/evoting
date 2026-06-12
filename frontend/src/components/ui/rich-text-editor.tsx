'use client'

import { Bold, Code2, Eye, Image, Italic, Link as LinkIcon, List, ListOrdered, Pencil, Strikethrough } from 'lucide-react'
import { useRef, useState } from 'react'
import { RichTextRenderer } from '@/components/ui/rich-text-renderer'

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  minHeightClassName?: string
  dataValidationField?: string
}

type FormatAction = 'bold' | 'italic' | 'strike' | 'link' | 'image' | 'code' | 'bullet' | 'number'

function applyInlineFormat(value: string, start: number, end: number, before: string, after = before, fallback = 'teks') {
  const selected = value.slice(start, end) || fallback
  const nextValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`
  return { nextValue, nextStart: start + before.length, nextEnd: start + before.length + selected.length }
}

function applyListFormat(value: string, start: number, end: number, ordered: boolean) {
  const selected = value.slice(start, end) || 'item daftar'
  const lines = selected.split('\n')
  const formatted = lines.map((line, index) => `${ordered ? `${index + 1}.` : '-'} ${line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, '')}`).join('\n')
  const nextValue = `${value.slice(0, start)}${formatted}${value.slice(end)}`
  return { nextValue, nextStart: start, nextEnd: start + formatted.length }
}

export function RichTextEditor({ value, onChange, placeholder, disabled, minHeightClassName = 'min-h-[120px]', dataValidationField }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  const updateSelection = (nextValue: string, nextStart: number, nextEnd: number) => {
    onChange(nextValue)
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(nextStart, nextEnd)
    })
  }

  const handleFormat = (action: FormatAction) => {
    if (disabled) return
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length

    if (action === 'bullet' || action === 'number') {
      const result = applyListFormat(value, start, end, action === 'number')
      updateSelection(result.nextValue, result.nextStart, result.nextEnd)
      return
    }

    const format = {
      bold: ['**', '**', 'teks tebal'],
      italic: ['_', '_', 'teks miring'],
      strike: ['~~', '~~', 'teks dicoret'],
      code: ['`', '`', 'kode'],
      link: ['[', '](https://contoh.ac.id)', 'teks tautan'],
      image: ['![', '](https://contoh.ac.id/gambar.png)', 'deskripsi gambar'],
    } satisfies Record<Exclude<FormatAction, 'bullet' | 'number'>, [string, string, string]>

    const [before, after, fallback] = format[action]
    const result = applyInlineFormat(value, start, end, before, after, fallback)
    updateSelection(result.nextValue, result.nextStart, result.nextEnd)
  }

  const toolbarItems = [
    { action: 'bold' as const, label: 'Tebal', icon: Bold },
    { action: 'italic' as const, label: 'Miring', icon: Italic },
    { action: 'strike' as const, label: 'Coret', icon: Strikethrough },
    { action: 'link' as const, label: 'Tautan', icon: LinkIcon },
    { action: 'image' as const, label: 'Gambar', icon: Image },
    { action: 'code' as const, label: 'Kode', icon: Code2 },
    { action: 'bullet' as const, label: 'Daftar poin', icon: List },
    { action: 'number' as const, label: 'Daftar nomor', icon: ListOrdered },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-900/5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-2 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {toolbarItems.map(({ action, label, icon: Icon }) => (
            <button
              key={action}
              type="button"
              onClick={() => handleFormat(action)}
              disabled={disabled}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={label}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-[12px] font-semibold">
          <button type="button" onClick={() => setMode('edit')} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 ${mode === 'edit' ? 'bg-white text-slate-900' : 'text-slate-500'}`}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button type="button" onClick={() => setMode('preview')} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 ${mode === 'preview' ? 'bg-white text-slate-900' : 'text-slate-500'}`}>
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
        </div>
      </div>
      {mode === 'edit' ? (
        <textarea
          ref={textareaRef}
          data-validation-field={dataValidationField}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`${minHeightClassName} w-full resize-y rounded-b-xl border-0 bg-white px-4 py-3 text-[14px] leading-7 text-slate-900 outline-none placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-400`}
        />
      ) : (
        <div data-validation-field={dataValidationField} tabIndex={-1} className={`${minHeightClassName} w-full rounded-b-xl px-4 py-3 text-[14px] leading-7 text-slate-700 outline-none`}>
          <RichTextRenderer value={value} emptyFallback="Belum ada konten untuk ditampilkan." />
        </div>
      )}
    </div>
  )
}
