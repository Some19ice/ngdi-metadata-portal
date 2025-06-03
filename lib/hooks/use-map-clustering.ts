import { useMemo, useCallback, useEffect, useState } from "react"
import Supercluster from "supercluster"
import { Map } from "maplibre-gl"
import { MetadataRecord } from "@/lib/map-utils"

export interface ClusterFeature {
  type: "Feature"
  id: number
  properties: {
    cluster: boolean
    cluster_id?: number
    point_count?: number
    point_count_abbreviated?: string
    record?: MetadataRecord
  }
  geometry: {
    type: "Point"
    coordinates: [number, number]
  }
}

export interface ClusterOptions {
  radius?: number
  maxZoom?: number
  minZoom?: number
  extent?: number
  nodeSize?: number
}

interface UseMapClusteringProps {
  records: MetadataRecord[]
  map: Map | null
  options?: ClusterOptions
}

export function useMapClustering({
  records,
  map,
  options = {}
}: UseMapClusteringProps) {
  const [currentZoom, setCurrentZoom] = useState<number>(5)
  const [currentBounds, setCurrentBounds] = useState<number[] | null>(null)

  // Default clustering options
  const clusterOptions: ClusterOptions = {
    radius: 50,
    maxZoom: 16,
    minZoom: 0,
    extent: 512,
    nodeSize: 64,
    ...options
  }

  // Initialize Supercluster instance
  const supercluster = useMemo(() => {
    if (!records || records.length === 0) return null

    // Convert MetadataRecord to GeoJSON points for Supercluster
    const points: ClusterFeature[] = records
      .filter(record => {
        // Ensure record has valid spatial bounds
        return (
          record.spatialInfo?.boundingBox?.northBoundingCoordinate &&
          record.spatialInfo?.boundingBox?.southBoundingCoordinate &&
          record.spatialInfo?.boundingBox?.eastBoundingCoordinate &&
          record.spatialInfo?.boundingBox?.westBoundingCoordinate
        )
      })
      .map(record => {
        // Calculate center point from bounding box
        const bbox = record.spatialInfo!.boundingBox!
        const centerLng =
          (parseFloat(bbox.eastBoundingCoordinate as string) +
            parseFloat(bbox.westBoundingCoordinate as string)) /
          2
        const centerLat =
          (parseFloat(bbox.northBoundingCoordinate as string) +
            parseFloat(bbox.southBoundingCoordinate as string)) /
          2

        return {
          type: "Feature" as const,
          id: record.id.hashCode(), // Convert string ID to number
          properties: {
            cluster: false,
            record
          },
          geometry: {
            type: "Point" as const,
            coordinates: [centerLng, centerLat]
          }
        }
      })

    const cluster = new Supercluster(clusterOptions)
    cluster.load(points)
    return cluster
  }, [records, clusterOptions])

  // Get clusters for current map view
  const clusters = useMemo(() => {
    if (!supercluster || !currentBounds || currentZoom < 0) return []

    try {
      // Convert bounds array to proper BBox format [west, south, east, north]
      const bbox = currentBounds as [number, number, number, number]
      return supercluster.getClusters(bbox, Math.floor(currentZoom))
    } catch (error) {
      console.warn("Error getting clusters:", error)
      return []
    }
  }, [supercluster, currentBounds, currentZoom])

  // Update map view state when map changes
  useEffect(() => {
    if (!map) return

    const updateMapState = () => {
      const zoom = map.getZoom()
      const bounds = map.getBounds()

      setCurrentZoom(zoom)
      setCurrentBounds([
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ])
    }

    // Initial state
    updateMapState()

    // Listen for map changes
    map.on("zoom", updateMapState)
    map.on("move", updateMapState)
    map.on("moveend", updateMapState)
    map.on("zoomend", updateMapState)

    return () => {
      map.off("zoom", updateMapState)
      map.off("move", updateMapState)
      map.off("moveend", updateMapState)
      map.off("zoomend", updateMapState)
    }
  }, [map])

  // Expand cluster to show individual points
  const expandCluster = useCallback(
    (clusterId: number) => {
      if (!supercluster || !map) return

      try {
        const expansionZoom = supercluster.getClusterExpansionZoom(clusterId)
        const leaves = supercluster.getLeaves(clusterId, 1)
        const clusterCenter = leaves[0]?.geometry.coordinates

        if (clusterCenter && expansionZoom) {
          map.flyTo({
            center: clusterCenter as [number, number],
            zoom: expansionZoom,
            duration: 1000
          })
        }
      } catch (error) {
        console.warn("Error expanding cluster:", error)
      }
    },
    [supercluster, map]
  )

  // Get leaves (individual points) of a cluster
  const getClusterLeaves = useCallback(
    (clusterId: number, limit: number = 10, offset: number = 0) => {
      if (!supercluster) return []

      try {
        return supercluster.getLeaves(clusterId, limit, offset)
      } catch (error) {
        console.warn("Error getting cluster leaves:", error)
        return []
      }
    },
    [supercluster]
  )

  return {
    clusters,
    currentZoom,
    expandCluster,
    getClusterLeaves,
    supercluster
  }
}

// Helper function to convert string to hash code (for Supercluster ID requirement)
declare global {
  interface String {
    hashCode(): number
  }
}

if (typeof String.prototype.hashCode === "undefined") {
  String.prototype.hashCode = function () {
    let hash = 0
    if (this.length === 0) return hash
    for (let i = 0; i < this.length; i++) {
      const char = this.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }
}
