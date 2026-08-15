"use client"

// SmoothScroll — uses native CSS scroll-behavior: smooth (applied via globals.css).
// Lenis was removed: it intercepted wheel + scrollbar events without a working
// RAF tick on Next.js 16 + Turbopack, making the page unscrollable.
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
