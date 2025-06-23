"use client"

import { Loader2 } from "lucide-react"

export default function MapLoadingSkeleton() {
  return (
    <div className="relative w-full h-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>

      {/* Optional skeleton pattern overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
    </div>
  )
}
