'use client'

import { useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { signIn, signUp } from '@/lib/actions/auth'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result =
        mode === 'signin' ? await signIn({ email, password }) : await signUp({ email, password, agreedToTerms })
      if (result?.error) setError(result.error)
      else if (result?.message) setMessage(result.message)
    })
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <h1 className="font-display text-2xl text-ink-950">
          {mode === 'signin' ? 'Welcome back' : 'Create your author account'}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {mode === 'signin' ? 'Sign in to manage your articles.' : 'Start writing and earning today.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ledger/40"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ledger/40"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-ledger">{message}</p>}

          {mode === 'signup' && (
            <label className="flex items-start gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-line text-ledger focus:ring-ledger/40"
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="underline hover:text-ledger">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" className="underline hover:text-ledger">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={isPending || (mode === 'signup' && !agreedToTerms)}
            className="w-full rounded-lg bg-ink-950 py-2.5 text-sm font-semibold text-paper hover:bg-ink-700 disabled:opacity-50"
          >
            {isPending ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
            setMessage(null)
          }}
          className="mt-5 w-full text-center text-sm text-ink-500 hover:text-ink-700"
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
