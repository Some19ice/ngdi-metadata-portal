"use client"

import React, { useRef, useEffect, useState } from "react"
import {
  motion,
  useMotionTemplate,
  useMotionValue,
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
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [isReady, setIsReady] = useState(false)

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`

  // Check if path is ready after mount
  useEffect(() => {
    if (typeof window === "undefined") return

    const checkPath = () => {
      if (pathRef.current) {
        try {
          const length = pathRef.current.getTotalLength()
          if (length > 0) {
            setIsReady(true)
            return true
          }
        } catch {
          // Path not ready yet
        }
      }
      return false
    }

    // Try immediately
    if (checkPath()) return

    // Retry with requestAnimationFrame for layout to complete
    let frameId: number
    let attempts = 0
    const maxAttempts = 10

    const tryAgain = () => {
      attempts++
      if (checkPath() || attempts >= maxAttempts) return
      frameId = requestAnimationFrame(tryAgain)
    }

    frameId = requestAnimationFrame(tryAgain)

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [])

  // Update x and y positions when progress changes - only after path is ready
  useEffect(() => {
    if (!isReady || !pathRef.current) return

    const unsubscribe = progress.on("change", val => {
      if (!pathRef.current) return
      try {
        const path = pathRef.current
        // Extra check to ensure path is connected and valid
        if (!path.isConnected) return

        const length = path.getTotalLength()
        if (length === 0) return

        const point = path.getPointAtLength(val)
        if (point) {
          x.set(point.x)
          y.set(point.y)
        }
      } catch (e) {
        // Silently ignore SVG path errors
      }
    })

    return () => unsubscribe()
  }, [isReady, progress, x, y])

  // Animate the progress value continuously along the path length
  useEffect(() => {
    if (!pathRef.current || !isReady) return

    let totalLength: number
    try {
      totalLength = pathRef.current.getTotalLength()
      if (totalLength === 0) return
    } catch (e) {
      return
    }

    // Framer motion animate loop
    const controls = animate(progress, totalLength, {
      duration: duration / 1000,
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
      onUpdate: latest => {
        // Ensure we don't exceed the current total length if it changed
        try {
          // Optional: check if length changed?
          // For now, just keeping the loop safe
        } catch (e) {}

        if (latest >= totalLength) progress.set(0)
      }
    })

    return () => controls.stop()
  }, [duration, progress, isReady])

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
      {isReady && (
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
      )}
    </div>
  )
}

interface MovingBorderWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
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
