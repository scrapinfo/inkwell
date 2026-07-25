import type { JSONContent } from '@tiptap/core'

export function slugify(input: string): string {
  const slug = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'article'
}

/** Walks a TipTap/ProseMirror JSON doc and concatenates its plain text. */
function extractPlainText(node: JSONContent): string {
  let text = node.text ?? ''
  for (const child of node.content ?? []) {
    text += (text ? ' ' : '') + extractPlainText(child)
  }
  return text
}

/** ~200wpm, rounded up, minimum 1 minute — shown next to article bylines. */
export function estimateReadingTime(doc: JSONContent): number {
  const wordCount = extractPlainText(doc).trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

/** Plain-text excerpt for article cards and OG descriptions. */
export function extractExcerpt(doc: JSONContent, maxLength = 160): string {
  const text = extractPlainText(doc).trim().replace(/\s+/g, ' ')
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '…'
}

/**
 * Turns "jane.doe@example.com" into "Jane Doe" for a nicer public byline
 * than a raw email address, without needing a schema change. Falls back to
 * the local-part as-is if it doesn't look name-like.
 */
export function formatAuthorName(email: string | null | undefined): string {
  if (!email) return 'Staff Writer'
  const local = email.split('@')[0]
  const words = local.split(/[._-]+/).filter(Boolean)
  if (words.length === 0) return email
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

/** PPV balances accrue in $0.002 increments, so show up to 4 decimal places. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value)
}
