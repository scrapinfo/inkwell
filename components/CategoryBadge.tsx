import Link from 'next/link'

export default function CategoryBadge({ slug, name }: { slug: string; name: string }) {
  return (
    <Link
      href={`/category/${slug}`}
      className="inline-flex items-center rounded-full bg-ledger-soft px-2.5 py-0.5 text-xs font-medium text-ledger-dark hover:bg-ledger/20"
    >
      {name}
    </Link>
  )
}
