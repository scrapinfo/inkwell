'use client'

import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'

/**
 * Wraps already-server-rendered children (e.g. a grid of article cards) and
 * reveals elements tagged with itemClassName as they scroll into view.
 * Uses ScrollTrigger.batch rather than one ScrollTrigger per card — cheaper
 * and it lets nearby cards stagger together instead of popping in one by one
 * as each individually crosses the trigger line.
 */
export default function RevealGroup({
  children,
  itemClassName = 'reveal-item',
  className,
}: {
  children: React.ReactNode
  itemClassName?: string
  className?: string
}) {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const items = gsap.utils.toArray<HTMLElement>(`.${itemClassName}`, scope.current)
        if (items.length === 0) return
        gsap.set(items, { autoAlpha: 0, y: 24 })
        ScrollTrigger.batch(items, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 0.6,
              ease: 'power2.out',
              stagger: 0.1,
              overwrite: true,
            }),
        })
      })
      return () => mm.revert()
    },
    { scope }
  )

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  )
}
