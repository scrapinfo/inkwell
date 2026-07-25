import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'

type NavUser = { email: string; role: 'admin' | 'author' } | null

export default function Navbar({ user }: { user: NavUser }) {
  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-xl italic text-ink-950">
          Inkwell
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-ink-700">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-ink-950">
                Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="hover:text-ink-950">
                  Admin
                </Link>
              )}
              <span className="hidden text-ink-500 sm:inline">{user.email}</span>
              <form action={signOut}>
                <button className="rounded-lg border border-line px-3 py-1.5 hover:bg-surface">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-ink-950 px-4 py-1.5 text-paper hover:bg-ink-700"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
