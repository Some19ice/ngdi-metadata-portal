"use client"

import Image from "next/image"
import { useState } from "react"

interface ImageWithFallbackProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  fallbackContent?: React.ReactNode
}

export function ImageWithFallback({
  src,
  alt,
  fill = false,
  className = "",
  fallbackContent
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false)

  const defaultFallback = (
    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
      <svg
        className="h-12 w-12 text-muted-foreground"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M3 5v14a9 3 0 0 0 18 0V5"></path>
      </svg>
    </div>
  )

  if (imageError) {
    return fallbackContent || defaultFallback
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      onError={() => setImageError(true)}
    />
  )
}
