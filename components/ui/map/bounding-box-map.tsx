"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import maplibregl, { Map, LngLatBoundsLike, LngLatLike } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { getAvailableMapStyles } from "@/lib/map-config"

interface BoundingBoxMapProps {
  onBoundsChange?: (
    bounds: {
      north: number
      south: number
      east: number
      west: number
    } | null
  ) => void
  initialBounds?: {
    north: number
    south: number
    east: number
    west: number
  } | null
}

export default function BoundingBoxMap({
  onBoundsChange,
  initialBounds
}: BoundingBoxMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef<[number, number] | null>(null)
  const bboxCoordsRef = useRef<[number, number][]>([])

  const [ready, setReady] = useState(false)

  const styles = useMemo(() => getAvailableMapStyles(), [])
  const initialStyleUrl =
    styles[0]?.url || "https://demotiles.maplibre.org/style.json"

  // Create or update the rectangle source/layers
  const ensureBboxLayers = useCallback((map: Map) => {
    if (!map.getSource("bbox-source")) {
      map.addSource("bbox-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      })

      map.addLayer({
        id: "bbox-fill",
        type: "fill",
        source: "bbox-source",
        paint: {
          "fill-color": "#3b82f6",
          "fill-opacity": 0.2
        }
      })

      map.addLayer({
        id: "bbox-outline",
        type: "line",
        source: "bbox-source",
        paint: {
          "line-color": "#2563eb",
          "line-width": 2
        }
      })
    }

    // Handles source/layer
    if (!map.getSource("bbox-handles-source")) {
      map.addSource("bbox-handles-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      })
    }
    if (!map.getLayer("bbox-handles")) {
      map.addLayer({
        id: "bbox-handles",
        type: "circle",
        source: "bbox-handles-source",
        paint: {
          "circle-radius": 5,
          "circle-color": "#1f2937",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2
        }
      })
    }
  }, [])

  const setBbox = useCallback(
    (map: Map, sw: [number, number], ne: [number, number]) => {
      const source = map.getSource("bbox-source") as maplibregl.GeoJSONSource
      if (!source) return
      const [west, south] = sw
      const [east, north] = ne
      const polygon: GeoJSON.Feature = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south]
            ]
          ]
        },
        properties: {}
      }
      source.setData({ type: "FeatureCollection", features: [polygon] })
      // Track ring coordinates and update handles
      bboxCoordsRef.current = (polygon.geometry as any).coordinates[0]
      const handlesSource = map.getSource(
        "bbox-handles-source"
      ) as maplibregl.GeoJSONSource
      if (handlesSource && bboxCoordsRef.current.length >= 4) {
        const [swC, seC, neC, nwC] = bboxCoordsRef.current
        const handleFeatures: GeoJSON.Feature[] = [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: swC },
            properties: { corner: "sw" }
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: seC },
            properties: { corner: "se" }
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: neC },
            properties: { corner: "ne" }
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: nwC },
            properties: { corner: "nw" }
          }
        ]
        handlesSource.setData({
          type: "FeatureCollection",
          features: handleFeatures
        })
      }

      onBoundsChange?.({ north, south, east, west })
    },
    [onBoundsChange]
  )

  // Add simple edit/drag interaction for the bbox polygon corners and body
  const enableBboxEditing = useCallback(
    (map: Map) => {
      const source = map.getSource("bbox-source") as maplibregl.GeoJSONSource
      if (!source) return

      const handlesSource = map.getSource(
        "bbox-handles-source"
      ) as maplibregl.GeoJSONSource
      const refreshHandles = (ring: [number, number][]) => {
        if (!handlesSource || !ring || ring.length < 4) return
        const [swC, seC, neC, nwC] = ring
        const handleFeatures: GeoJSON.Feature[] = [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: swC },
            properties: { corner: "sw" }
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: seC },
            properties: { corner: "se" }
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: neC },
            properties: { corner: "ne" }
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: nwC },
            properties: { corner: "nw" }
          }
        ]
        handlesSource.setData({
          type: "FeatureCollection",
          features: handleFeatures
        })
      }

      // Drag state
      let draggingHandle: string | null = null
      let draggingBox = false
      let dragStartLngLat: [number, number] | null = null

      // Pointer down: detect if on a handle or inside polygon
      map.on("mousedown", "bbox-fill", e => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["bbox-fill"]
        })
        if (features.length > 0) {
          draggingBox = true
          dragStartLngLat = [e.lngLat.lng, e.lngLat.lat]
          map.getCanvas().style.cursor = "grabbing"
          try {
            map.dragPan.disable()
          } catch {}
        }
      })

      map.on("mousedown", e => {
        const feats = map.queryRenderedFeatures(e.point, {
          layers: ["bbox-handles"]
        })
        if (feats.length === 0) return
        // Identify nearest corner by comparing distances
        const coords = bboxCoordsRef.current
        if (!coords) return
        const corners = [
          { id: "sw", c: coords[0] },
          { id: "se", c: coords[1] },
          { id: "ne", c: coords[2] },
          { id: "nw", c: coords[3] }
        ]
        let minD = Number.POSITIVE_INFINITY
        let chosen: string | null = null
        corners.forEach(k => {
          const dx = e.lngLat.lng - k.c[0]
          const dy = e.lngLat.lat - k.c[1]
          const d2 = dx * dx + dy * dy
          if (d2 < minD && d2 < 0.0001) {
            minD = d2
            chosen = k.id
          }
        })
        if (chosen) {
          draggingHandle = chosen
          map.getCanvas().style.cursor = "grabbing"
          try {
            map.dragPan.disable()
          } catch {}
        }
      })

      map.on("mousemove", e => {
        if (!draggingHandle && !draggingBox) return
        const coords = bboxCoordsRef.current
        if (!coords) return
        if (draggingHandle) {
          const [lng, lat] = [e.lngLat.lng, e.lngLat.lat]
          const next = [...coords]
          const idxMap: Record<string, number> = { sw: 0, se: 1, ne: 2, nw: 3 }
          const idx = idxMap[draggingHandle]
          next[idx] = [lng, lat]
          // Close ring
          next[4] = next[0]
          source.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "Polygon", coordinates: [next] },
                properties: {}
              }
            ]
          })
          bboxCoordsRef.current = next
          refreshHandles(next)
          // Emit updated bounds
          const xs = next.map((c: number[]) => c[0])
          const ys = next.map((c: number[]) => c[1])
          const west = Math.min(...xs)
          const east = Math.max(...xs)
          const south = Math.min(...ys)
          const north = Math.max(...ys)
          onBoundsChange?.({ north, south, east, west })
        } else if (draggingBox && dragStartLngLat) {
          const dx = e.lngLat.lng - dragStartLngLat[0]
          const dy = e.lngLat.lat - dragStartLngLat[1]
          const moved: [number, number][] = coords.map((c: number[]) => [
            (c[0] as number) + dx,
            (c[1] as number) + dy
          ]) as [number, number][]
          moved[4] = moved[0]
          source.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "Polygon", coordinates: [moved] },
                properties: {}
              }
            ]
          })
          dragStartLngLat = [e.lngLat.lng, e.lngLat.lat]
          bboxCoordsRef.current = moved
          refreshHandles(moved)
          const xs = moved.map((c: number[]) => c[0])
          const ys = moved.map((c: number[]) => c[1])
          const west = Math.min(...xs)
          const east = Math.max(...xs)
          const south = Math.min(...ys)
          const north = Math.max(...ys)
          onBoundsChange?.({ north, south, east, west })
        }
      })

      const stopDrag = () => {
        draggingHandle = null
        draggingBox = false
        dragStartLngLat = null
        map.getCanvas().style.cursor = ""
        try {
          map.dragPan.enable()
        } catch {}
      }
      map.on("mouseup", stopDrag)
      map.on("mouseleave", stopDrag)
    },
    [onBoundsChange]
  )

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: initialStyleUrl,
      center: [0, 20] as LngLatLike,
      zoom: 2
    })

    mapRef.current = map

    map.on("load", () => {
      ensureBboxLayers(map)

      // If initial bounds provided, render and fit
      if (initialBounds) {
        const sw: [number, number] = [initialBounds.west, initialBounds.south]
        const ne: [number, number] = [initialBounds.east, initialBounds.north]
        setBbox(map, sw, ne)
        const llb: LngLatBoundsLike = [sw, ne]
        map.fitBounds(llb, { padding: 20, duration: 0 })
      }

      setReady(true)
      enableBboxEditing(map)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [initialStyleUrl, ensureBboxLayers, initialBounds, setBbox])

  // Handle drag-to-draw rectangle
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const handleMouseDown = (e: maplibregl.MapMouseEvent) => {
      // Only start draw-to-create if no bbox exists yet
      if (bboxCoordsRef.current && bboxCoordsRef.current.length >= 4) return
      isDraggingRef.current = true
      dragStartRef.current = [e.lngLat.lng, e.lngLat.lat]
      try {
        map.dragPan.disable()
      } catch {}
      // reset layer data
      ensureBboxLayers(map)
      const source = map.getSource("bbox-source") as maplibregl.GeoJSONSource
      if (source) {
        source.setData({ type: "FeatureCollection", features: [] })
      }
    }

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return
      const start = dragStartRef.current
      const current: [number, number] = [e.lngLat.lng, e.lngLat.lat]
      const sw: [number, number] = [
        Math.min(start[0], current[0]),
        Math.min(start[1], current[1])
      ]
      const ne: [number, number] = [
        Math.max(start[0], current[0]),
        Math.max(start[1], current[1])
      ]
      setBbox(map, sw, ne)
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      dragStartRef.current = null
      try {
        map.dragPan.enable()
      } catch {}
    }

    map.on("mousedown", handleMouseDown)
    map.on("mousemove", handleMouseMove)
    map.on("mouseup", handleMouseUp)

    return () => {
      map.off("mousedown", handleMouseDown)
      map.off("mousemove", handleMouseMove)
      map.off("mouseup", handleMouseUp)
    }
  }, [setBbox, ensureBboxLayers])

  return (
    <div
      ref={containerRef}
      className="w-full h-80 rounded-md overflow-hidden"
    />
  )
}
