"use client"

import { ReactNode } from "react"

interface UnifiedGeospatialBackgroundProps {
  children: ReactNode
  className?: string
}

export function UnifiedGeospatialBackground({
  children,
  className = ""
}: UnifiedGeospatialBackgroundProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Enhanced Geospatial SVG Background with Vibrant Colors */}
      <div className="absolute inset-0">
        {/* Base gradient background with richer colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-emerald-50/40 to-cyan-50/30" />

        {/* Primary topographic pattern overlay with enhanced colors */}
        <div
          className="absolute inset-0 opacity-75"
          style={{
            backgroundImage: `url("/patterns/topographic-grid.svg")`
          }}
        />

        {/* Enhanced satellite imagery inspired pattern with vibrant colors */}
        <div
          className="absolute inset-0 opacity-55"
          style={{
            backgroundImage: `url("/patterns/satellite-pattern.svg")`
          }}
        />

        {/* Enhanced animated floating elements with richer colors */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-500/15 to-purple-500/10 rounded-full blur-xl animate-float" />
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 rounded-full blur-lg animate-pulse-soft"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-32 left-32 w-40 h-40 bg-gradient-to-br from-cyan-500/12 to-blue-600/8 rounded-full blur-xl animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-20 right-32 w-28 h-28 bg-gradient-to-br from-indigo-500/15 to-violet-500/10 rounded-full blur-lg animate-pulse-soft"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-20 h-20 bg-gradient-to-br from-teal-500/12 to-emerald-600/8 rounded-full blur-lg animate-float"
          style={{ animationDelay: "4s" }}
        />

        {/* Enhanced radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-white/8 to-white/25" />
      </div>

      {/* Content with proper z-index */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
