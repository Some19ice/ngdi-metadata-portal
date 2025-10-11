"use client"

import { ReactNode } from "react"

interface UnifiedGeospatialBackgroundProps {
  children: ReactNode
  className?: string
}

// Inline SVG patterns for better performance
const topographicGridSVG = `data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='topographicGrid' x='0' y='0' width='120' height='120' patternUnits='userSpaceOnUse'%3E%3Cpath d='M20,60 Q40,40 60,60 T100,60' stroke='%2300bcd4' stroke-width='1.5' fill='none' opacity='0.6'/%3E%3Cpath d='M10,80 Q30,60 50,80 T90,80' stroke='%2306d6a0' stroke-width='1.5' fill='none' opacity='0.5'/%3E%3Cpath d='M30,40 Q50,20 70,40 T110,40' stroke='%232563eb' stroke-width='1.5' fill='none' opacity='0.55'/%3E%3Cpath d='M15,100 Q35,80 55,100 T95,100' stroke='%2300a8cc' stroke-width='1' fill='none' opacity='0.4'/%3E%3Cpath d='M25,20 Q45,0 65,20 T105,20' stroke='%2304d69f' stroke-width='1' fill='none' opacity='0.4'/%3E%3Cline x1='0' y1='30' x2='120' y2='30' stroke='%236366f1' stroke-width='0.8' opacity='0.35'/%3E%3Cline x1='0' y1='60' x2='120' y2='60' stroke='%2310b981' stroke-width='0.8' opacity='0.35'/%3E%3Cline x1='0' y1='90' x2='120' y2='90' stroke='%2306b6d4' stroke-width='0.8' opacity='0.35'/%3E%3Cline x1='30' y1='0' x2='30' y2='120' stroke='%236366f1' stroke-width='0.8' opacity='0.35'/%3E%3Cline x1='60' y1='0' x2='60' y2='120' stroke='%2310b981' stroke-width='0.8' opacity='0.35'/%3E%3Cline x1='90' y1='0' x2='90' y2='120' stroke='%2306b6d4' stroke-width='0.8' opacity='0.35'/%3E%3Ccircle cx='25' cy='25' r='3' fill='%2300bcd4' opacity='0.6'/%3E%3Ccircle cx='75' cy='35' r='3' fill='%2306d6a0' opacity='0.6'/%3E%3Ccircle cx='45' cy='75' r='3' fill='%232563eb' opacity='0.6'/%3E%3Ccircle cx='95' cy='85' r='3' fill='%2300a8cc' opacity='0.6'/%3E%3Ccircle cx='15' cy='55' r='2.5' fill='%2304d69f' opacity='0.5'/%3E%3Ccircle cx='105' cy='65' r='2.5' fill='%236366f1' opacity='0.5'/%3E%3Cpolygon points='15,10 20,15 15,20 10,15' fill='%2306d6a0' opacity='0.4'/%3E%3Cpolygon points='85,50 90,55 85,60 80,55' fill='%232563eb' opacity='0.4'/%3E%3Cpolygon points='105,25 110,30 105,35 100,30' fill='%2300bcd4' opacity='0.4'/%3E%3Cpolygon points='55,95 60,100 55,105 50,100' fill='%2304d69f' opacity='0.4'/%3E%3Cpath d='M5,110 Q25,90 45,110 T85,110' stroke='%236366f1' stroke-width='1' fill='none' opacity='0.35'/%3E%3Cpath d='M35,10 Q55,30 75,10 T115,10' stroke='%2300a8cc' stroke-width='1' fill='none' opacity='0.35'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23topographicGrid)'/%3E%3C/svg%3E`

const satellitePatternSVG = `data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='satellitePattern' x='0' y='0' width='200' height='200' patternUnits='userSpaceOnUse'%3E%3Cellipse cx='100' cy='100' rx='80' ry='40' stroke='%235b21b6' stroke-width='2' fill='none' opacity='0.4' transform='rotate(15 100 100)'/%3E%3Cellipse cx='100' cy='100' rx='60' ry='30' stroke='%230369a1' stroke-width='1.5' fill='none' opacity='0.35' transform='rotate(-30 100 100)'/%3E%3Cellipse cx='100' cy='100' rx='90' ry='45' stroke='%230d9488' stroke-width='1.5' fill='none' opacity='0.3' transform='rotate(45 100 100)'/%3E%3Cellipse cx='100' cy='100' rx='70' ry='35' stroke='%23dc2626' stroke-width='1' fill='none' opacity='0.25' transform='rotate(75 100 100)'/%3E%3Cpath d='M50,50 L150,150' stroke='%235b21b6' stroke-width='1.5' opacity='0.25' stroke-dasharray='8,4'/%3E%3Cpath d='M150,50 L50,150' stroke='%230369a1' stroke-width='1.5' opacity='0.25' stroke-dasharray='8,4'/%3E%3Cpath d='M100,25 L100,175' stroke='%230d9488' stroke-width='1' opacity='0.2' stroke-dasharray='6,3'/%3E%3Cpath d='M25,100 L175,100' stroke='%23dc2626' stroke-width='1' opacity='0.2' stroke-dasharray='6,3'/%3E%3Crect x='40' y='40' width='20' height='20' fill='%230d9488' opacity='0.5' transform='rotate(45 50 50)'/%3E%3Crect x='140' y='140' width='20' height='20' fill='%235b21b6' opacity='0.5' transform='rotate(45 150 150)'/%3E%3Crect x='140' y='40' width='20' height='20' fill='%230369a1' opacity='0.5' transform='rotate(45 150 50)'/%3E%3Crect x='40' y='140' width='20' height='20' fill='%23dc2626' opacity='0.5' transform='rotate(45 50 150)'/%3E%3Ccircle cx='100' cy='100' r='4' fill='%235b21b6' opacity='0.6'/%3E%3Ccircle cx='100' cy='100' r='12' fill='none' stroke='%235b21b6' stroke-width='1.5' opacity='0.3'/%3E%3Ccircle cx='100' cy='100' r='20' fill='none' stroke='%235b21b6' stroke-width='1' opacity='0.2'/%3E%3Ccircle cx='100' cy='100' r='28' fill='none' stroke='%235b21b6' stroke-width='0.5' opacity='0.15'/%3E%3Cpath d='M75,75 L125,125 M125,75 L75,125' stroke='%230d9488' stroke-width='1' opacity='0.2'/%3E%3Ccircle cx='50' cy='50' r='6' fill='none' stroke='%230369a1' stroke-width='1' opacity='0.3'/%3E%3Ccircle cx='150' cy='150' r='6' fill='none' stroke='%23dc2626' stroke-width='1' opacity='0.3'/%3E%3Ccircle cx='150' cy='50' r='6' fill='none' stroke='%230d9488' stroke-width='1' opacity='0.3'/%3E%3Ccircle cx='50' cy='150' r='6' fill='none' stroke='%235b21b6' stroke-width='1' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23satellitePattern)'/%3E%3C/svg%3E`

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

        {/* Primary topographic pattern overlay with enhanced colors - Inlined SVG */}
        <div
          className="absolute inset-0 opacity-75"
          style={{
            backgroundImage: `url("${topographicGridSVG}")`
          }}
        />

        {/* Enhanced satellite imagery inspired pattern with vibrant colors - Inlined SVG */}
        <div
          className="absolute inset-0 opacity-55"
          style={{
            backgroundImage: `url("${satellitePatternSVG}")`
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
