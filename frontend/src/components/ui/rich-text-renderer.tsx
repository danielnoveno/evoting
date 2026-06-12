'use client'

import type { ReactNode } from 'react'

function isSafeUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function renderInline(text: string, keyPrefix = 'rt'): ReactNode[] {
  const nodes: ReactNode[] = []
  let remaining = text
  let index = 0

  const patterns: Array<{
    regex: RegExp
    render: (match: RegExpMatchArray, key: string) => ReactNode
  }> = [
    {
      regex: /^!\[([^\]]*)\]\(([^)\s]+)\)/,
      render: (match, key) => isSafeUrl(match[2])
        ? <img key={key} src={match[2]} alt={match[1]} className="my-2 max-h-48 rounded-xl border border-slate-200 object-cover" />
        : <span key={key}>{match[0]}</span>,
    },
    {
      regex: /^\[([^\]]+)\]\(([^)\s]+)\)/,
      render: (match, key) => isSafeUrl(match[2])
        ? <a key={key} href={match[2]} target="_blank" rel="noreferrer" className="font-medium text-blue-700 underline underline-offset-2">{renderInline(match[1], `${key}-link`)}</a>
        : <span key={key}>{match[0]}</span>,
    },
    { regex: /^\*\*([^*]+)\*\*/, render: (match, key) => <strong key={key} className="font-semibold text-slate-900">{renderInline(match[1], `${key}-bold`)}</strong> },
    { regex: /^_([^_]+)_/, render: (match, key) => <em key={key}>{renderInline(match[1], `${key}-italic`)}</em> },
    { regex: /^~~([^~]+)~~/, render: (match, key) => <span key={key} className="line-through">{renderInline(match[1], `${key}-strike`)}</span> },
    { regex: /^`([^`]+)`/, render: (match, key) => <code key={key} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.92em] text-slate-800">{match[1]}</code> },
  ]

  while (remaining.length > 0) {
    const matchedPattern = patterns.find((pattern) => pattern.regex.test(remaining))
    if (matchedPattern) {
      const match = remaining.match(matchedPattern.regex)
      if (match) {
        nodes.push(matchedPattern.render(match, `${keyPrefix}-${index}`))
        remaining = remaining.slice(match[0].length)
        index += 1
        continue
      }
    }

    const nextSpecial = remaining.search(/(!?\[|\*\*|_|~~|`)/)
    const sliceLength = nextSpecial <= 0 ? 1 : nextSpecial
    nodes.push(<span key={`${keyPrefix}-${index}`}>{remaining.slice(0, sliceLength)}</span>)
    remaining = remaining.slice(sliceLength)
    index += 1
  }

  return nodes
}

export function RichTextRenderer({ value, className = '', emptyFallback }: { value?: string | null; className?: string; emptyFallback?: string }) {
  const content = value?.trim()
  if (!content) return emptyFallback ? <p className={className}>{emptyFallback}</p> : null

  const lines = content.split('\n')
  const blocks: ReactNode[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }

    const orderedMatch = line.match(/^\s*\d+[.)]\s+(.+)$/)
    const unorderedMatch = line.match(/^\s*[-*]\s+(.+)$/)

    if (orderedMatch || unorderedMatch) {
      const isOrdered = Boolean(orderedMatch)
      const items: string[] = []

      while (index < lines.length) {
        const currentLine = lines[index]
        const currentMatch = isOrdered
          ? currentLine.match(/^\s*\d+[.)]\s+(.+)$/)
          : currentLine.match(/^\s*[-*]\s+(.+)$/)
        if (!currentMatch) break
        items.push(currentMatch[1])
        index += 1
      }

      const ListTag = isOrdered ? 'ol' : 'ul'
      blocks.push(
        <ListTag key={`block-${index}`} className={`my-2 space-y-1 pl-5 ${isOrdered ? 'list-decimal' : 'list-disc'}`}>
          {items.map((item, itemIndex) => <li key={`${index}-${itemIndex}`}>{renderInline(item, `item-${index}-${itemIndex}`)}</li>)}
        </ListTag>,
      )
      continue
    }

    blocks.push(<p key={`block-${index}`}>{renderInline(line, `line-${index}`)}</p>)
    index += 1
  }

  return <div className={`space-y-2 ${className}`}>{blocks}</div>
}
