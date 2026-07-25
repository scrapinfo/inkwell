import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl italic text-ledger">404</p>
      <h1 className="mt-4 font-display text-2xl text-ink-950">This page doesn't exist</h1>
      <p className="mt-2 text-sm text-ink-500">
        The article may have been unpublished, or the link might just be wrong.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-ink-950 px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-700"
      >
        Back to Inkwell
      </Link>
    </div>
  )
}
