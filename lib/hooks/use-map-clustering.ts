import { useEffect, useRef, useState, useCallback } from "react"
import { Map as MaplibreMap, Marker, Popup } from "maplibre-gl"
import Supercluster from "supercluster"
import { MetadataRecord } from "@/lib/map-utils"
import {
  createSafeClusterMarker,
  createSafeIndividualMarker,
  createSafePopupContent,
  MapEventManager
} from "@/lib/map-security"
import { useMapPerformance, useIsMounted } from "./use-map-performance"

interface ClusterProperties {
  cluster: boolean
  cluster_id: number
  point_count: number
  point_count_abbreviated: string
}

// Export the ClusterFeature type for use in other components
export interface ClusterFeature {
  type: "Feature"
  properties: ClusterProperties | MetadataRecord
  geometry: {
    type: "Point"
    coordinates: [number, number]
  }
}

interface UseMapClusteringOptions {
  map: MaplibreMap | null
  records: MetadataRecord[]
  onRecordClick?: (record: MetadataRecord) => void
  clusterRadius?: number
  minZoom?: number
  maxZoom?: number
}

export function useMapClustering({
  map,
  records,
  onRecordClick,
  clusterRadius = 50,
  minZoom = 0,
  maxZoom = 16
}: UseMapClusteringOptions) {
  const [clusters, setClusters] = useState<ClusterFeature[]>([])
  const superclusterRef = useRef<Supercluster | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const eventManagerRef = useRef<MapEventManager>(new MapEventManager())
  const isMounted = useIsMounted()
  const { debounce } = useMapPerformance({ debounceMs: 300 })

  // Initialize Supercluster
  useEffect(() => {
    if (!records || records.length === 0) return

    // Create GeoJSON features from records
    const features = records
      .filter(record => {
        const center = getRecordCenter(record)
        return center !== null
      })
      .map(record => {
        const center = getRecordCenter(record)!
        return {
          type: "Feature" as const,
          properties: record,
          geometry: {
            type: "Point" as const,
            coordinates: center
          }
        }
      })

    // Initialize Supercluster
    superclusterRef.current = new Supercluster({
      radius: clusterRadius,
      maxZoom,
      minZoom
    })

    superclusterRef.current.load(features)
  }, [records, clusterRadius, minZoom, maxZoom])

  // Debounced cluster update function
  const debouncedUpdateClusters = useCallback(
    debounce(() => {
      if (!map || !superclusterRef.current || !isMounted()) return

      const bounds = map.getBounds()
      const zoom = Math.floor(map.getZoom())

      const newClusters = superclusterRef.current.getClusters(
        [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ],
        zoom
      ) as ClusterFeature[]

      if (isMounted()) {
        setClusters(newClusters)
      }
    }),
    [map, debounce, isMounted]
  )

  // Set up map event listeners with debouncing
  useEffect(() => {
    if (!map) return

    const handleMapMove = () => debouncedUpdateClusters()

    map.on("moveend", handleMapMove)
    map.on("zoomend", handleMapMove)

    // Initial update
    debouncedUpdateClusters()

    return () => {
      map.off("moveend", handleMapMove)
      map.off("zoomend", handleMapMove)
    }
  }, [map, debouncedUpdateClusters])

  // Render markers
  useEffect(() => {
    if (!map || !clusters) return

    // Clear existing markers
    if (markersRef.current) {
      markersRef.current.forEach((marker: Marker) => {
        eventManagerRef.current.removeMarkerHandler(marker)
        marker.remove()
      })
    }
    markersRef.current = new Map()

    // Add new markers
    clusters.forEach(cluster => {
      const [lng, lat] = cluster.geometry.coordinates
      const properties = cluster.properties as
        | ClusterProperties
        | MetadataRecord

      let markerElement: HTMLElement
      let markerId: string

      if ("cluster" in properties && properties.cluster) {
        // Cluster marker
        markerId = `cluster-${properties.cluster_id}`
        markerElement = createSafeClusterMarker({
          count: properties.point_count,
          className: "map-cluster-marker"
        })

        // Add click handler to zoom into cluster
        eventManagerRef.current.addElementListener(
          markerElement,
          "click",
          () => {
            if (superclusterRef.current) {
              const expansionZoom =
                superclusterRef.current.getClusterExpansionZoom(
                  properties.cluster_id
                )
              map.flyTo({
                center: [lng, lat],
                zoom: expansionZoom,
                duration: 500
              })
            }
          }
        )
      } else {
        // Individual marker
        const record = properties as MetadataRecord
        markerId = `record-${record.id}`
        markerElement = createSafeIndividualMarker(record, {
          className: "map-record-marker"
        })

        // Add popup on hover
        const popupContent = createSafePopupContent({
          title: record.title,
          description: record.description || undefined,
          metadata: {
            "Data Type": record.dataType,
            Organization: record.organization?.name,
            Status: record.status
          }
        })

        const popup = new Popup({
          offset: 25,
          closeButton: false,
          className: "map-record-popup"
        }).setDOMContent(popupContent)

        eventManagerRef.current.addElementListener(
          markerElement,
          "mouseenter",
          () => popup.setLngLat([lng, lat]).addTo(map)
        )

        eventManagerRef.current.addElementListener(
          markerElement,
          "mouseleave",
          () => popup.remove()
        )

        // Add click handler
        if (onRecordClick) {
          eventManagerRef.current.addElementListener(
            markerElement,
            "click",
            () => onRecordClick(record)
          )
        }
      }

      // Create and add marker
      const marker = new Marker({
        element: markerElement
      })
        .setLngLat([lng, lat])
        .addTo(map)

      markersRef.current.set(markerId, marker)
    })
  }, [map, clusters, onRecordClick])

  // Cleanup
  useEffect(() => {
    return () => {
      if (markersRef.current) {
        markersRef.current.forEach((marker: Marker) => {
          try {
            eventManagerRef.current.removeAllElementListeners(
              marker.getElement()
            )
            marker.remove()
          } catch (error) {
            console.warn("Error cleaning up marker:", error)
          }
        })
        markersRef.current.clear()
      }

      if (eventManagerRef.current) {
        try {
          eventManagerRef.current.cleanup()
        } catch (error) {
          console.warn("Error cleaning up event manager:", error)
        }
      }
    }
  }, [])

  // Function to expand a cluster by zooming in
  const expandCluster = useCallback(
    (clusterId: number) => {
      if (!map || !superclusterRef.current || !isMounted()) return

      const expansionZoom =
        superclusterRef.current.getClusterExpansionZoom(clusterId)
      const cluster = clusters.find(
        c => "cluster" in c.properties && c.properties.cluster_id === clusterId
      )

      if (cluster) {
        const [lng, lat] = cluster.geometry.coordinates
        map.flyTo({
          center: [lng, lat],
          zoom: Math.min(expansionZoom, maxZoom),
          duration: 500
        })
      }
    },
    [map, clusters, maxZoom, isMounted]
  )

  // Function to get leaves (individual points) of a cluster
  const getClusterLeaves = useCallback(
    (clusterId: number, limit: number = 100) => {
      if (!superclusterRef.current) return []

      return superclusterRef.current.getLeaves(clusterId, limit)
    },
    []
  )

  return {
    clusters,
    expandCluster
  }
}

// Helper function to get record center
function getRecordCenter(record: MetadataRecord): [number, number] | null {
  if (
    !record.northBoundLatitude ||
    !record.southBoundLatitude ||
    !record.eastBoundLongitude ||
    !record.westBoundLongitude
  ) {
    return null
  }

  const north = parseFloat(record.northBoundLatitude)
  const south = parseFloat(record.southBoundLatitude)
  const east = parseFloat(record.eastBoundLongitude)
  const west = parseFloat(record.westBoundLongitude)

  if (isNaN(north) || isNaN(south) || isNaN(east) || isNaN(west)) {
    return null
  }

  return [(east + west) / 2, (north + south) / 2]
}
