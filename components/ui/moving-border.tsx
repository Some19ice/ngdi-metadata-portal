"use client"

import React, { useRef, useEffect } from "react"
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform,
  animate
} from "framer-motion"
import { cn } from "@/lib/utils"

interface MovingBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  duration?: number
  rx?: string
  ry?: string
}

export function MovingBorder({
  children,
  duration = 4000,
  rx = "30%",
  ry = "30%",
  className,
  ...otherProps
}: MovingBorderProps) {
  const pathRef = useRef<SVGRectElement | null>(null)
  const progress = useMotionValue<number>(0)

  const x = useTransform(
    progress,
    val => pathRef.current?.getPointAtLength(val)?.x ?? 0
  )
  const y = useTransform(
    progress,
    val => pathRef.current?.getPointAtLength(val)?.y ?? 0
  )
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`

  // Animate the progress value continuously along the path length
  useEffect(() => {
    if (!pathRef.current) return

    const totalLength = pathRef.current.getTotalLength()

    // Framer motion animate loop
    const controls = animate(progress, totalLength, {
      duration: duration / 1000, // convert ms to seconds if duration in ms; original default 4000 assumed ms? Actually default 4000, but progress animate expects seconds; We'll convert.
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
      onUpdate: latest => {
        // Reset to 0 when exceeds length to ensure continuous loop
        if (latest >= totalLength) progress.set(0)
      }
    })

    return () => controls.stop()
  }, [duration, progress])

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
        aria-hidden="true"
        role="presentation"
      >
        {children}
      </motion.div>
    </div>
  )
}

interface MovingBorderWrapperProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  duration?: number
  className?: string
  borderGradient?: string
  variant?: "box" | "line"
  dotSize?: number // size in px of moving dot
}

export function MovingBorderWrapper({
  children,
  duration = 4000,
  className,
  borderGradient = "bg-[radial-gradient(#22c55e_40%,transparent_60%)]",
  variant = "box",
  dotSize = 12,
  ...props
}: MovingBorderWrapperProps) {
  if (variant === "line") {
    return (
      <div className={cn("relative", className)} {...props}>
        {children}
        {/* underline effect */}
        <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-[2px]">
          <MovingBorder duration={duration} rx="0%" ry="0%">
            <div
              style={{ height: dotSize, width: dotSize }}
              className={cn("opacity-80", borderGradient)}
            />
          </MovingBorder>
        </div>
      </div>
    )
  }

  // default box variant
  return (
    <div className={cn("relative", className)} {...props}>
      <MovingBorder duration={duration} rx="30%" ry="30%">
        <div
          style={{ height: dotSize, width: dotSize }}
          className={cn("opacity-80", borderGradient)}
        />
      </MovingBorder>
      {children}
    </div>
  )
}
