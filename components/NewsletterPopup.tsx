'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname } from 'next/navigation'
import { subscribe } from '@/lib/actions/newsletter'

const STORAGE_KEY = 'inkwell:newsletter-dismissed'
const HIDDEN_PREFIXES = ['/dashboard', '/admin', '/login']

export default function NewsletterPopup() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const hiddenHere = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))

  useEffect(() => {
    if (hiddenHere) return
    if (localStorage.getItem(STORAGE_KEY)) return
    const timer = setTimeout(() => setVisible(true), 4000)
    return () => clearTimeout(timer)
  }, [hiddenHere])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await subscribe(email)
      if (result.error) {
        setMessage(result.error)
      } else {
        setMessage(result.message ?? 'Thanks!')
        localStorage.setItem(STORAGE_KEY, '1')
        setTimeout(() => setVisible(false), 2500)
      }
    })
  }

  if (!visible || hiddenHere) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-lg sm:left-auto sm:right-4">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-ink-500 hover:text-ink-950"
      >
        ×
      </button>
      <p className="font-display text-lg text-ink-950">New stories, occasionally</p>
      <p className="mt-1 text-sm text-ink-500">No spam — just an email when something's worth reading.</p>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-lg border border-line px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ledger/40"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-lg bg-ledger px-3 py-1.5 text-sm font-medium text-white hover:bg-ledger-dark disabled:opacity-50"
        >
          Join
        </button>
      </form>
      {message && <p className="mt-2 text-xs text-ink-500">{message}</p>}
    </div>
  )
}
