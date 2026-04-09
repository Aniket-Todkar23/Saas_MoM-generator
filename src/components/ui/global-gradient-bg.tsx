"use client"

import { motion, useScroll, useTransform, useSpring } from "framer-motion"

/**
 * GlobalGradientBackground
 * Fixed behind every section, scroll-reactive polygon blob gradients.
 * z-index: -10 — below content but intentionally visible through transparent sections.
 */
export function GlobalGradientBackground() {
  const { scrollYProgress } = useScroll()

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 25,
    damping: 18,
    restDelta: 0.001,
  })

  // Top blob drifts diagonally as you scroll
  const topX = useTransform(smoothProgress, [0, 1], ["-20vw", "30vw"])
  const topY = useTransform(smoothProgress, [0, 1], ["-20vh", "40vh"])
  const topRotate = useTransform(smoothProgress, [0, 1], [30, -30])

  // Bottom blob mirrors in opposite direction
  const botX = useTransform(smoothProgress, [0, 1], ["30vw", "-20vw"])
  const botY = useTransform(smoothProgress, [0, 1], ["50vh", "-10vh"])

  const GRADIENT_TOP = "radial-gradient(circle at 50% 50%, oklch(0.58 0.25 264), oklch(0.62 0.24 310))"
  const GRADIENT_BOT = "radial-gradient(circle at 50% 50%, oklch(0.65 0.24 10), oklch(0.58 0.25 264))"

  // Radial mask fades the blob out at the edges so it blends smoothly
  const MASK = "radial-gradient(circle at 50% 50%, black 30%, transparent 75%)"

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: -10 }}
    >
      {/* Top blob — circular, soft masked edges */}
      <motion.div
        className="absolute rounded-full"
        style={{
          x: topX,
          y: topY,
          rotate: topRotate,
          opacity: 0.55,
          width: "70vw",
          height: "70vw",
          background: GRADIENT_TOP,
          filter: "blur(60px)",
          WebkitMaskImage: MASK,
          maskImage: MASK,
        }}
      />

      {/* Bottom blob — circular, soft masked edges */}
      <motion.div
        className="absolute rounded-full"
        style={{
          x: botX,
          y: botY,
          opacity: 0.5,
          width: "65vw",
          height: "65vw",
          background: GRADIENT_BOT,
          filter: "blur(60px)",
          WebkitMaskImage: MASK,
          maskImage: MASK,
        }}
      />
    </div>
  )
}
