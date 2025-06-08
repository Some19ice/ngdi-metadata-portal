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
  const [clusters, setClusters] = useState<any[]>([])
  const superclusterRef = useRef<Supercluster | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const eventManagerRef = useRef<MapEventManager>(new MapEventManager())

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

  // Update clusters when map moves
  const updateClusters = useCallback(() => {
    if (!map || !superclusterRef.current) return

    const bounds = map.getBounds()
    const zoom = Math.floor(map.getZoom())

    const clusters = superclusterRef.current.getClusters(
      [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ],
      zoom
    )

    setClusters(clusters)
  }, [map])

  // Set up map event listeners
  useEffect(() => {
    if (!map) return

    const handleMapMove = () => updateClusters()

    map.on("move", handleMapMove)
    map.on("zoom", handleMapMove)
    map.on("load", handleMapMove)

    // Initial update
    updateClusters()

    return () => {
      map.off("move", handleMapMove)
      map.off("zoom", handleMapMove)
      map.off("load", handleMapMove)
    }
  }, [map, updateClusters])

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
          eventManagerRef.current.removeMarkerHandler(marker)
          marker.remove()
        })
      }
      eventManagerRef.current.cleanup()
    }
  }, [])

  // Function to expand a cluster by zooming in
  const expandCluster = useCallback(
    (clusterId: number) => {
      if (!map || !superclusterRef.current) return

      const expansionZoom =
        superclusterRef.current.getClusterExpansionZoom(clusterId)
      const cluster = clusters.find(
        c =>
          "cluster" in c.properties &&
          c.properties.cluster &&
          c.properties.cluster_id === clusterId
      )

      if (cluster) {
        map.flyTo({
          center: cluster.geometry.coordinates,
          zoom: expansionZoom,
          duration: 500
        })
      }
    },
    [map, clusters]
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
    updateClusters,
    expandCluster,
    getClusterLeaves
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
