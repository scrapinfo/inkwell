'use client'

import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * Wraps already-server-rendered children and animates elements tagged with
 * the given className in on mount. Server Components can pass their JSX
 * straight through as `children` here without becoming Client Components
 * themselves — only this wrapper needs the client boundary.
 */
export default function HeroReveal({
  children,
  itemClassName = 'hero-item',
}: {
  children: React.ReactNode
  itemClassName?: string
}) {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${itemClassName}`, {
          autoAlpha: 0,
          y: 20,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.12,
        })
      })
      return () => mm.revert()
    },
    { scope }
  )

  return <div ref={scope}>{children}</div>
}
