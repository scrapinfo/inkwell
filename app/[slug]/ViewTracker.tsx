'use client'

import { useEffect, useRef } from 'react'

export default function ViewTracker({ articleId }: { articleId: string }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId }),
      keepalive: true, // let the request finish even if the reader navigates away
    }).catch(() => {
      // Best-effort — a failed view ping should never affect the reader.
    })
  }, [articleId])

  return null
}
