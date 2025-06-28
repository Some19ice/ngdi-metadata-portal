"use client"

import Image, { ImageProps } from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string
  className?: string
}

export function ImageWithFallback({
  src,
  fallbackSrc = "/img/placeholder.png",
  alt,
  className,
  ...props
}: ImageWithFallbackProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc)
      setHasError(true)
    }
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && <div className="absolute inset-0 bg-muted animate-pulse" />}
      <Image
        {...props}
        src={imageSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          hasError && "grayscale",
          className
        )}
        onError={handleError}
        onLoad={handleLoad}
        suppressHydrationWarning
      />
    </div>
  )
}
