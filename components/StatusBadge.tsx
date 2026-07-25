const STYLES: Record<string, string> = {
  draft: 'text-ink-500',
  pending: 'text-amber-600',
  published: 'text-ledger',
}

const DOT: Record<string, string> = {
  draft: 'bg-ink-500',
  pending: 'bg-amber-500',
  published: 'bg-ledger',
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium capitalize ${STYLES[status] ?? 'text-ink-500'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status] ?? 'bg-ink-500'}`} />
      {status}
    </span>
  )
}
