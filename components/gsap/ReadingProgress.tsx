'use client'

import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'

/** Targets the article by id rather than a ref, so the article markup itself stays a plain Server Component. */
export default function ReadingProgress({ targetId }: { targetId: string }) {
  const barRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.set(barRef.current, { scaleX: 0, transformOrigin: 'left center' })
      gsap.to(barRef.current, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: `#${targetId}`,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      })
    })
    return () => mm.revert()
  })

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-line">
      <div ref={barRef} className="h-full bg-ledger" />
    </div>
  )
}
