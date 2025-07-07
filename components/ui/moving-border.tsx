"use client"

import React, { useRef } from "react"
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform
} from "framer-motion"
import { cn } from "@/lib/utils"

export function MovingBorder({
  children,
  duration = 4000,
  rx = "30%",
  ry = "30%",
  className,
  ...otherProps
}: {
  children: React.ReactNode
  duration?: number
  rx?: string
  ry?: string
  className?: string
  [key: string]: any
}) {
  const pathRef = useRef<SVGRectElement | null>(null)
  const progress = useMotionValue<number>(0)

  useAnimationFrame(time => {
    const length = pathRef.current?.getTotalLength()
    if (length) {
      const pxPerMillisecond = length / duration
      progress.set((time * pxPerMillisecond) % length)
    }
  })

  const x = useTransform(
    progress,
    val => pathRef.current?.getPointAtLength(val).x
  )
  const y = useTransform(
    progress,
    val => pathRef.current?.getPointAtLength(val).y
  )
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      {...otherProps}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
      >
        <rect
          fill="none"
          width="100%"
          height="100%"
          rx={rx}
          ry={ry}
          ref={pathRef}
        />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export function MovingBorderWrapper({
  children,
  duration = 4000,
  className,
  borderGradient = "bg-[radial-gradient(#22c55e_40%,transparent_60%)]",
  variant = "box",
  ...props
}: {
  children: React.ReactNode
  duration?: number
  className?: string
  borderGradient?: string
  variant?: "box" | "line"
  [key: string]: any
}) {
  if (variant === "line") {
    return (
      <div className={cn("relative", className)} {...props}>
        {children}
        {/* underline effect */}
        <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-[2px]">
          <MovingBorder duration={duration} rx="0%" ry="0%">
            <div className={cn("h-6 w-6 opacity-80", borderGradient)} />
          </MovingBorder>
        </div>
      </div>
    )
  }

  // default box variant
  return (
    <div className={cn("relative", className)} {...props}>
      <MovingBorder duration={duration} rx="30%" ry="30%">
        <div className={cn("h-20 w-20 opacity-80", borderGradient)} />
      </MovingBorder>
      {children}
    </div>
  )
}
