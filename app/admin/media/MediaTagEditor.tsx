'use client'

import { useState, useTransition } from 'react'
import { updateMediaTags } from './actions'

export default function MediaTagEditor({ mediaId, initialTags }: { mediaId: string; initialTags: string[] }) {
  const [value, setValue] = useState(initialTags.join(', '))
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const save = () => {
    startTransition(async () => {
      await updateMediaTags(mediaId, value)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        placeholder="tags, comma, separated"
        className="w-full rounded-md border border-line bg-surface px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ledger/40"
      />
      {isPending ? (
        <span className="text-xs text-ink-500">Saving…</span>
      ) : saved ? (
        <span className="text-xs text-ledger">Saved</span>
      ) : null}
    </div>
  )
}
