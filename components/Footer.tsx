import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 py-8 text-sm text-ink-500 sm:flex-row sm:justify-between sm:px-6">
        <p>&copy; {new Date().getFullYear()} Inkwell</p>
        <nav className="flex gap-5">
          <Link href="/privacy" className="hover:text-ink-950">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink-950">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  )
}
