"use client"

import { useMemo } from "react"
import { ClusterFeature } from "@/lib/hooks/use-map-clustering"

interface ClusterMarkerProps {
  cluster: ClusterFeature
  onClick?: (cluster: ClusterFeature) => void
}

// Type guard to check if properties are cluster properties
function isClusterProperties(properties: any): properties is { cluster: boolean; cluster_id: number; point_count: number; point_count_abbreviated: string } {
  return properties && typeof properties.cluster === 'boolean' && properties.cluster === true
}

export default function ClusterMarker({
  cluster,
  onClick
}: ClusterMarkerProps) {
  // Calculate cluster size class based on point count
  const { sizeClass, size } = useMemo(() => {
    if (!isClusterProperties(cluster.properties)) {
      return { sizeClass: "small", size: 30 }
    }

    const pointCount = cluster.properties.point_count || 0

    if (pointCount < 10) {
      return { sizeClass: "small", size: 30 }
    } else if (pointCount < 50) {
      return { sizeClass: "medium", size: 40 }
    } else if (pointCount < 100) {
      return { sizeClass: "large", size: 50 }
    } else {
      return { sizeClass: "xlarge", size: 60 }
    }
  }, [cluster.properties])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClick) {
      onClick(cluster)
    }
  }

  // Individual point marker (not clustered)
  if (!isClusterProperties(cluster.properties)) {
    const record = cluster.properties
    return (
      <div
        className="individual-marker cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
        onClick={handleClick}
        title={record.title || "Metadata Record"}
      >
        <div className="relative">
          {/* Marker dot */}
          <div className="w-3 h-3 bg-blue-600 border-2 border-white rounded-full shadow-lg hover:scale-110 transition-transform duration-200" />

          {/* Optional pulse animation for hover */}
          <div className="absolute inset-0 w-3 h-3 bg-blue-600 rounded-full animate-ping opacity-75 hover:opacity-100" />
        </div>
      </div>
    )
  }

  // Cluster marker
  const clusterProps = cluster.properties
  return (
    <div
      className="cluster-marker cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform duration-200"
      onClick={handleClick}
      title={`${clusterProps.point_count} metadata records (click to expand)`}
      style={{ width: size, height: size }}
    >
      <div
        className={`
          relative w-full h-full rounded-full border-2 border-white shadow-lg
          flex items-center justify-center text-white font-bold
          ${sizeClass === "small" && "bg-blue-500 text-xs"}
          ${sizeClass === "medium" && "bg-blue-600 text-sm"}
          ${sizeClass === "large" && "bg-blue-700 text-base"}
          ${sizeClass === "xlarge" && "bg-blue-800 text-lg"}
        `}
      >
        {/* Count display */}
        <span className="select-none">
          {clusterProps.point_count_abbreviated || clusterProps.point_count}
        </span>

        {/* Optional ripple effect */}
        <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-pulse opacity-50" />
      </div>
    </div>
  )
}

// CSS styles to be added to global styles
export const clusterMarkerStyles = `
  .cluster-marker {
    z-index: 10;
  }
  
  .individual-marker {
    z-index: 5;
  }
  
  .cluster-marker:hover .animate-pulse {
    animation-duration: 0.5s;
  }
  
  .individual-marker:hover .animate-ping {
    animation-duration: 0.8s;
  }
`
