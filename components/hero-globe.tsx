"use client"
import React, { useEffect, Component, ReactNode } from "react"
import dynamic from "next/dynamic"
import { preloadGlobeData } from "@/lib/utils/topojson-loader"

const World = dynamic(
  () => import("@/components/ui/globe").then(m => m.World),
  {
    ssr: false,
    loading: () => <GlobePlaceholder />
  }
)

// Placeholder shown while loading or on error
function GlobePlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full h-full bg-gradient-to-br from-emerald-900/30 to-blue-900/30 rounded-full animate-pulse" />
    </div>
  )
}

// Error boundary for the globe component
interface GlobeErrorBoundaryProps {
  children: ReactNode
}

interface GlobeErrorBoundaryState {
  hasError: boolean
}

class GlobeErrorBoundary extends Component<
  GlobeErrorBoundaryProps,
  GlobeErrorBoundaryState
> {
  constructor(props: GlobeErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): GlobeErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    // Silently log the error - the globe is just a visual enhancement
    console.warn("Globe failed to load:", error.message)
  }

  render() {
    if (this.state.hasError) {
      return <GlobePlaceholder />
    }
    return this.props.children
  }
}

export default function GlobeDemo() {
  // Preload globe data when component mounts
  useEffect(() => {
    preloadGlobeData()
  }, [])

  const globeConfig = {
    pointSize: 4,
    globeColor: "#045d4d",
    showAtmosphere: true,
    atmosphereColor: "#FFFFFF",
    atmosphereAltitude: 0.1,
    emissive: "#045d4d",
    emissiveIntensity: 0.15,
    shininess: 0.9,
    polygonColor: "rgba(255,255,255,0.7)",
    ambientLight: "#34d399",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
    arcTime: 1000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    initialPosition: { lat: 9.082, lng: 8.6753 },
    autoRotate: true,
    autoRotateSpeed: 0.5
  }
  const colors = ["#22c55e", "#10b981", "#059669"]

  // Deterministic color selection based on coordinates
  const getArcColor = (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ) => {
    const coordString = `${startLat}-${startLng}-${endLat}-${endLng}`
    let hash = 0
    for (let i = 0; i < coordString.length; i++) {
      const char = coordString.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const sampleArcs = [
    {
      order: 1,
      startLat: -19.885592,
      startLng: -43.951191,
      endLat: -22.9068,
      endLng: -43.1729,
      arcAlt: 0.1,
      color: getArcColor(-19.885592, -43.951191, -22.9068, -43.1729)
    },
    {
      order: 1,
      startLat: 28.6139,
      startLng: 77.209,
      endLat: 3.139,
      endLng: 101.6869,
      arcAlt: 0.2,
      color: getArcColor(28.6139, 77.209, 3.139, 101.6869)
    },
    {
      order: 1,
      startLat: -19.885592,
      startLng: -43.951191,
      endLat: -1.303396,
      endLng: 36.852443,
      arcAlt: 0.5,
      color: getArcColor(-19.885592, -43.951191, -1.303396, 36.852443)
    },
    {
      order: 2,
      startLat: 1.3521,
      startLng: 103.8198,
      endLat: 35.6762,
      endLng: 139.6503,
      arcAlt: 0.2,
      color: getArcColor(1.3521, 103.8198, 35.6762, 139.6503)
    },
    {
      order: 2,
      startLat: 51.5072,
      startLng: -0.1276,
      endLat: 3.139,
      endLng: 101.6869,
      arcAlt: 0.3,
      color: getArcColor(51.5072, -0.1276, 3.139, 101.6869)
    },
    {
      order: 2,
      startLat: -15.785493,
      startLng: -47.909029,
      endLat: 36.162809,
      endLng: -115.119411,
      arcAlt: 0.3,
      color: getArcColor(-15.785493, -47.909029, 36.162809, -115.119411)
    },
    {
      order: 3,
      startLat: -33.8688,
      startLng: 151.2093,
      endLat: 22.3193,
      endLng: 114.1694,
      arcAlt: 0.3,
      color: getArcColor(-33.8688, 151.2093, 22.3193, 114.1694)
    },
    {
      order: 3,
      startLat: 21.3099,
      startLng: -157.8581,
      endLat: 40.7128,
      endLng: -74.006,
      arcAlt: 0.3,
      color: getArcColor(21.3099, -157.8581, 40.7128, -74.006)
    },
    {
      order: 3,
      startLat: -6.2088,
      startLng: 106.8456,
      endLat: 51.5072,
      endLng: -0.1276,
      arcAlt: 0.3,
      color: getArcColor(-6.2088, 106.8456, 51.5072, -0.1276)
    },
    {
      order: 4,
      startLat: 9.082,
      startLng: 8.6753,
      endLat: -15.595412,
      endLng: -56.05918,
      arcAlt: 0.5,
      color: getArcColor(9.082, 8.6753, -15.595412, -56.05918)
    },
    {
      order: 4,
      startLat: -34.6037,
      startLng: -58.3816,
      endLat: 22.3193,
      endLng: 114.1694,
      arcAlt: 0.7,
      color: getArcColor(-34.6037, -58.3816, 22.3193, 114.1694)
    },
    {
      order: 4,
      startLat: 51.5072,
      startLng: -0.1276,
      endLat: 48.8566,
      endLng: 2.3522,
      arcAlt: 0.1,
      color: getArcColor(51.5072, -0.1276, 48.8566, 2.3522)
    },
    {
      order: 5,
      startLat: 14.5995,
      startLng: 120.9842,
      endLat: 51.5072,
      endLng: -0.1276,
      arcAlt: 0.3,
      color: getArcColor(14.5995, 120.9842, 51.5072, -0.1276)
    },
    {
      order: 5,
      startLat: 1.3521,
      startLng: 103.8198,
      endLat: -33.8688,
      endLng: 151.2093,
      arcAlt: 0.2,
      color: getArcColor(1.3521, 103.8198, -33.8688, 151.2093)
    },
    {
      order: 5,
      startLat: 34.0522,
      startLng: -118.2437,
      endLat: 48.8566,
      endLng: 2.3522,
      arcAlt: 0.2,
      color: getArcColor(34.0522, -118.2437, 48.8566, 2.3522)
    },
    {
      order: 6,
      startLat: 51.5072,
      startLng: -0.1276,
      endLat: 9.082,
      endLng: 8.6753,
      arcAlt: 0.4,
      color: getArcColor(51.5072, -0.1276, 9.082, 8.6753)
    },
    {
      order: 6,
      startLat: 9.082,
      startLng: 8.6753,
      endLat: 40.7128,
      endLng: -74.006,
      arcAlt: 0.6,
      color: getArcColor(9.082, 8.6753, 40.7128, -74.006)
    }
  ]

  return (
    <GlobeErrorBoundary>
      <div className="absolute inset-0 w-full h-full">
        <div className="w-full h-full relative overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            <World data={sampleArcs} globeConfig={globeConfig} />
          </div>
        </div>
      </div>
    </GlobeErrorBoundary>
  )
}
