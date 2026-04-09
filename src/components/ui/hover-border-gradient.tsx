'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Direction = 'TOP' | 'LEFT' | 'BOTTOM' | 'RIGHT'

const movingMap: Record<Direction, string> = {
  TOP: 'radial-gradient(20.7% 50% at 50% 0%, var(--foreground) 0%, rgba(255, 255, 255, 0) 100%)',
  LEFT: 'radial-gradient(16.6% 43.1% at 0% 50%, var(--foreground) 0%, rgba(255, 255, 255, 0) 100%)',
  BOTTOM:
    'radial-gradient(20.7% 50% at 50% 100%, var(--foreground) 0%, rgba(255, 255, 255, 0) 100%)',
  RIGHT:
    'radial-gradient(16.2% 41.199999999999996% at 100% 50%, var(--foreground) 0%, rgba(255, 255, 255, 0) 100%)',
}

const highlight =
  'radial-gradient(75% 181.15942028985506% at 50% 50%, var(--primary) 0%, rgba(255, 255, 255, 0) 100%)'

function rotateDirection(currentDirection: Direction, clockwise: boolean): Direction {
  const directions: Direction[] = ['TOP', 'LEFT', 'BOTTOM', 'RIGHT']
  const currentIndex = directions.indexOf(currentDirection)
  const nextIndex = clockwise
    ? (currentIndex - 1 + directions.length) % directions.length
    : (currentIndex + 1) % directions.length

  return directions[nextIndex]
}

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Element = 'button',
  duration = 1,
  clockwise = true,
  active = false,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType
    containerClassName?: string
    className?: string
    duration?: number
    clockwise?: boolean
    active?: boolean
  } & React.HTMLAttributes<HTMLElement>
>) {
  const [hovered, setHovered] = useState<boolean>(false)
  const [direction, setDirection] = useState<Direction>('BOTTOM')

  const isAnimating = hovered || active

  useEffect(() => {
    if (!isAnimating) return

    const interval = window.setInterval(() => {
      setDirection((prevState) => rotateDirection(prevState, clockwise))
    }, duration * 1000)

    return () => window.clearInterval(interval)
  }, [isAnimating, duration, clockwise])

  return (
    <Element
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative flex h-min w-fit flex-col flex-nowrap content-center items-center justify-center gap-10 overflow-visible rounded-full border border-border/70 bg-background/40 box-decoration-clone p-px backdrop-blur-sm transition duration-500 hover:bg-background/60',
        containerClassName
      )}
      {...props}
    >
      <div className={cn('z-10 w-auto rounded-[inherit] bg-card px-4 py-2 text-foreground', className)}>
        {children}
      </div>

      <motion.div
        className={cn('absolute inset-0 z-0 flex-none overflow-hidden rounded-[inherit]')}
        style={{
          filter: 'blur(2px)',
          width: '100%',
          height: '100%',
        }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: movingMap[direction],
        }}
        transition={{ ease: 'linear', duration }}
      />

      <div className="absolute inset-0.5 z-[1] flex-none rounded-[inherit] bg-background" />
    </Element>
  )
}

export default function HoverBorderDemo() {
  return (
    <HoverBorderGradient>
      <span>Emerald UI Components</span>
    </HoverBorderGradient>
  )
}
