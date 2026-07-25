'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-2xl text-ink-950">Something went wrong</h1>
      <p className="mt-2 text-sm text-ink-500">
        That's on us, not you. Try again, or come back in a moment.
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-ink-950 px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-700"
      >
        Try again
      </button>
    </div>
  )
}
