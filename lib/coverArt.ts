// A small, curated set of gradient pairs, all within the site's existing
// palette family (deep ledger greens, ink neutrals, a couple of editorial
// accent tones) so generated covers never clash with the rest of the UI —
// deliberately not randomized RGB, which tends to produce muddy or garish
// results.
const PALETTES: Array<{ from: string; to: string }> = [
  { from: '#145c43', to: '#1c7a5a' }, // ledger green
  { from: '#1c1917', to: '#44403c' }, // ink
  { from: '#7a2e2e', to: '#9a3b3b' }, // oxblood
  { from: '#1e3a5f', to: '#2c5282' }, // editorial navy
  { from: '#92400e', to: '#b45309' }, // ledger gold
  { from: '#44403c', to: '#78716c' }, // slate
]

/** Simple deterministic string hash (djb2) — same seed always maps the same way. */
function hash(seed: string): number {
  let h = 5381
  for (let i = 0; i < seed.length; i++) {
    h = (h * 33) ^ seed.charCodeAt(i)
  }
  return Math.abs(h)
}

export function coverArtFor(seed: string, title: string) {
  const palette = PALETTES[hash(seed) % PALETTES.length]
  const mark = (title.trim().charAt(0) || '?').toUpperCase()
  // A second hash decides the decorative motif so two articles with the
  // same palette still look distinct.
  const motif = hash(seed + '::motif') % 3
  return { ...palette, mark, motif, gradientId: `cover-${hash(seed)}` }
}
