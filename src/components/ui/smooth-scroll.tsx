"use client"

import { useEffect } from "react"
import Lenis from "lenis"

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    window.scrollTo(0, 0)
    
    // Initialize Lenis for premium momentum scroll physics
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      wheelMultiplier: 1,
      touchMultiplier: 2,
      // Let nested scroll regions opt out so wheel scrolling works inside panels.
      prevent: (node) => {
        if (!(node instanceof HTMLElement)) return false
        return !!node.closest("[data-lenis-prevent], [data-lenis-prevent-wheel]")
      },
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
