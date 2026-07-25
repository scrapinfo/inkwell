import { coverArtFor } from '@/lib/coverArt'

export default function ArticleCover({
  seed,
  title,
  className = '',
}: {
  seed: string
  title: string
  className?: string
}) {
  const { from, to, mark, motif, gradientId } = coverArtFor(seed, title)

  return (
    <svg viewBox="0 0 400 240" className={className} role="img" aria-label="">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#${gradientId})`} />

      {motif === 0 && (
        <circle cx="340" cy="30" r="90" fill="white" fillOpacity="0.06" />
      )}
      {motif === 1 && (
        <g stroke="white" strokeOpacity="0.12" strokeWidth="10">
          <line x1="0" y1="220" x2="220" y2="0" />
          <line x1="80" y1="240" x2="300" y2="20" />
        </g>
      )}
      {motif === 2 && (
        <g fill="white" fillOpacity="0.08">
          <circle cx="60" cy="190" r="70" />
          <circle cx="180" cy="230" r="40" />
        </g>
      )}

      <text
        x="32"
        y="165"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontSize="88"
        fill="white"
        fillOpacity="0.9"
      >
        {mark}
      </text>
    </svg>
  )
}
