"use client"

import React, { memo, useCallback, useEffect, useState, useRef } from "react"
import {
  Pencil,
  Square,
  Circle,
  Pentagon,
  Trash2,
  Download,
  Upload,
  Undo,
  Redo,
  Move,
  Hand
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Map as MapLibreMap, GeoJSONSource } from "maplibre-gl"

interface MapDrawingToolsProps {
  map: MapLibreMap | null
  onShapeDrawn?: (feature: GeoJSON.Feature) => void
  onShapeDeleted?: (featureId: string) => void
  onShapesExported?: (features: GeoJSON.Feature[]) => void
  onShapesImported?: (features: GeoJSON.Feature[]) => void
  className?: string
  variant?: "overlay" | "sidebar"
}

type DrawingMode =
  | "none"
  | "point"
  | "line"
  | "rectangle"
  | "circle"
  | "polygon"
  | "select"
  | "edit"

interface DrawnFeature {
  id: string
  feature: GeoJSON.Feature
  name?: string
  description?: string
  color?: string
  createdAt: Date
}

interface DrawingState {
  mode: DrawingMode
  isDrawing: boolean
  currentPoints: [number, number][]
  selectedFeature: string | null
  features: Map<string, DrawnFeature>
  // State for preview shapes
  previewShape: GeoJSON.Feature | null
  mousePosition: [number, number] | null
}

const DRAWING_COLORS = [
  "#ff0000", // Red
  "#00ff00", // Green
  "#0000ff", // Blue
  "#ffff00", // Yellow
  "#ff00ff", // Magenta
  "#00ffff", // Cyan
  "#ff8000", // Orange
  "#8000ff" // Purple
]

const MapDrawingTools = memo(function MapDrawingTools({
  map,
  onShapeDrawn,
  onShapeDeleted,
  onShapesExported,
  onShapesImported,
  className = "",
  variant = "overlay"
}: MapDrawingToolsProps) {
  const [state, setState] = useState<DrawingState>({
    mode: "none",
    isDrawing: false,
    currentPoints: [],
    selectedFeature: null,
    features: new Map(),
    previewShape: null,
    mousePosition: null
  })

  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<"geojson" | "kml">("geojson")
  const [importData, setImportData] = useState("")
  // Persist features to localStorage and restore on mount
  useEffect(() => {
    try {
      const serialized = localStorage.getItem("mapDrawingFeatures")
      if (serialized) {
        const parsed = JSON.parse(serialized) as Array<{
          id: string
          feature: GeoJSON.Feature
          name?: string
          description?: string
          color?: string
          createdAt: string
        }>
        const restored = new Map<string, DrawnFeature>()
        parsed.forEach(item => {
          restored.set(item.id, {
            id: item.id,
            feature: item.feature,
            name: item.name,
            description: item.description,
            color: item.color,
            createdAt: new Date(item.createdAt)
          })
        })
        setState(prev => ({ ...prev, features: restored }))
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const arr = Array.from(state.features.values()).map(df => ({
        id: df.id,
        feature: df.feature,
        name: df.name,
        description: df.description,
        color: df.color,
        createdAt: df.createdAt.toISOString()
      }))
      localStorage.setItem("mapDrawingFeatures", JSON.stringify(arr))
    } catch {}
  }, [state.features])

  // Measurement utilities (length/area)
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6378137
  const haversine = (a: [number, number], b: [number, number]) => {
    const dLat = toRad(b[1] - a[1])
    const dLon = toRad(b[0] - a[0])
    const lat1 = toRad(a[1])
    const lat2 = toRad(b[1])
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(h))
  }
  const lengthOfLine = (coords: [number, number][]) => {
    let sum = 0
    for (let i = 1; i < coords.length; i++)
      sum += haversine(coords[i - 1], coords[i])
    return sum
  }
  const project3857 = ([lng, lat]: [number, number]): [number, number] => {
    const x = R * toRad(lng)
    const y = R * Math.log(Math.tan(Math.PI / 4 + toRad(lat) / 2))
    return [x, y]
  }
  const polygonArea = (ring: [number, number][]) => {
    const pts = ring.map(project3857)
    let area = 0
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      area += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]
    }
    return Math.abs(area / 2)
  }

  const selected = state.selectedFeature
    ? state.features.get(state.selectedFeature) || null
    : null
  const selectedMetrics = (() => {
    if (!selected) return null
    const geom = selected.feature.geometry
    if (geom.type === "LineString") {
      const meters = lengthOfLine(geom.coordinates as [number, number][])
      return { type: "line", lengthMeters: meters }
    }
    if (geom.type === "Polygon") {
      const rings = geom.coordinates as [number, number][][]
      const area = polygonArea(rings[0])
      const perimeter = lengthOfLine([...rings[0]])
      return { type: "polygon", areaSqMeters: area, perimeterMeters: perimeter }
    }
    return { type: geom.type }
  })()

  // Move/drag mode for selected feature: disable pan, start dragging only when clicking the selected feature
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef<[number, number] | null>(null)
  const draggingVertexRef = useRef<{
    featureId: string
    ringIndex?: number
    vertexIndex: number
  } | null>(null)
  useEffect(() => {
    if (!map || state.mode !== "edit" || !state.selectedFeature) return

    try {
      map.dragPan.disable()
      map.doubleClickZoom.disable()
      map.getCanvas().style.cursor = "grab"
    } catch {}

    const onMouseDown = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [
          "drawing-points",
          "drawing-lines",
          "drawing-polygons-fill",
          "drawing-polygons-stroke"
        ]
      })
      const fid = features?.[0]?.properties?.id
      if (!fid || fid !== state.selectedFeature) return
      e.preventDefault()
      dragStartRef.current = [e.lngLat.lng, e.lngLat.lat]
      isDraggingRef.current = true
      try {
        map.getCanvas().style.cursor = "grabbing"
      } catch {}
    }

    const onMouseMove = (e: any) => {
      if (!isDraggingRef.current || !dragStartRef.current) return
      e.preventDefault()
      const start = dragStartRef.current
      const current: [number, number] = [e.lngLat.lng, e.lngLat.lat]
      const dx = current[0] - start[0]
      const dy = current[1] - start[1]
      const featureId = state.selectedFeature!
      const df = state.features.get(featureId)
      if (!df) return
      const geom = df.feature.geometry
      const translate = (pts: [number, number][]) =>
        pts.map(([x, y]) => [x + dx, y + dy]) as [number, number][]
      let newGeom: GeoJSON.Geometry = geom
      if (geom.type === "Point") {
        newGeom = {
          type: "Point",
          coordinates: [
            (geom.coordinates as [number, number])[0] + dx,
            (geom.coordinates as [number, number])[1] + dy
          ]
        }
      } else if (geom.type === "LineString") {
        newGeom = {
          type: "LineString",
          coordinates: translate(geom.coordinates as [number, number][])
        }
      } else if (geom.type === "Polygon") {
        newGeom = {
          type: "Polygon",
          coordinates: (geom.coordinates as [number, number][][]).map(r =>
            translate(r)
          )
        }
      }
      setState(prev => {
        const newMap = new Map(prev.features)
        newMap.set(featureId, {
          ...df,
          feature: { ...df.feature, geometry: newGeom }
        })
        return { ...prev, features: newMap }
      })
      dragStartRef.current = current
    }
    const onMouseUp = (e: any) => {
      if (isDraggingRef.current) e.preventDefault()
      isDraggingRef.current = false
      dragStartRef.current = null
      try {
        map.getCanvas().style.cursor = "grab"
      } catch {}
    }

    map.on("mousedown", onMouseDown)
    map.on("mousemove", onMouseMove)
    map.on("mouseup", onMouseUp)
    return () => {
      map.off("mousedown", onMouseDown)
      map.off("mousemove", onMouseMove)
      map.off("mouseup", onMouseUp)
      try {
        map.dragPan.enable()
        map.doubleClickZoom.enable()
        map.getCanvas().style.cursor = ""
      } catch {}
    }
  }, [map, state.mode, state.selectedFeature, state.features])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const undoStackRef = useRef<DrawnFeature[]>([])
  const redoStackRef = useRef<DrawnFeature[]>([])

  // Snapping utilities
  const getAllVertices = useCallback((): [number, number][] => {
    const vertices: [number, number][] = []
    state.features.forEach(df => {
      const geom = df.feature.geometry
      if (geom.type === "Point") {
        vertices.push(geom.coordinates as [number, number])
      } else if (geom.type === "LineString") {
        ;(geom.coordinates as [number, number][])?.forEach(c =>
          vertices.push(c)
        )
      } else if (geom.type === "Polygon") {
        ;(geom.coordinates as [number, number][][])?.forEach(ring => {
          ring.forEach((c, idx) => {
            if (idx === ring.length - 1) return
            vertices.push(c)
          })
        })
      }
    })
    return vertices
  }, [state.features])

  const snapPoint = useCallback(
    (point: [number, number], maxPixelDistance = 10): [number, number] => {
      if (!map) return point
      const candidates = getAllVertices()
      if (candidates.length === 0) return point
      const pPix = map.project({ lng: point[0], lat: point[1] })
      let best: [number, number] | null = null
      let bestDist = Number.POSITIVE_INFINITY
      for (const c of candidates) {
        const cPix = map.project({ lng: c[0], lat: c[1] })
        const dx = cPix.x - pPix.x
        const dy = cPix.y - pPix.y
        const d = Math.hypot(dx, dy)
        if (d < bestDist) {
          bestDist = d
          best = c
        }
      }
      if (best && bestDist <= maxPixelDistance) return best
      return point
    },
    [map, getAllVertices]
  )

  // Initialize drawing layers and re-add on style changes
  useEffect(() => {
    if (!map) return

    const addDrawingLayers = () => {
      if (!map || !map.isStyleLoaded()) {
        // Wait for style to be loaded before adding layers
        return
      }

      // Check if source already exists to prevent duplicate addition
      try {
        if (map.getSource("drawing-source")) {
          return
        }
      } catch {
        // If getSource fails, continue with source creation
      }

      try {
        map.addSource("drawing-source", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: []
          }
        })
      } catch (error) {
        console.warn("Failed to add drawing source:", error)
        return
      }

      // Helper function to safely add layers
      const safeAddLayer = (layerConfig: any) => {
        try {
          // Check if layer already exists
          if (map.getLayer(layerConfig.id)) {
            return
          }

          // Special handling for text layers - check if style supports glyphs
          if (
            layerConfig.type === "symbol" &&
            layerConfig.layout?.["text-field"]
          ) {
            const style = map.getStyle()
            if (!style?.glyphs) {
              console.warn(
                `Skipping text layer ${layerConfig.id}: no glyphs defined in style`
              )
              return
            }
          }

          map.addLayer(layerConfig)
        } catch (error) {
          console.warn(`Failed to add layer ${layerConfig.id}:`, error)
          // If it's a text layer failing, try to continue without it
          if (layerConfig.type === "symbol") {
            console.warn(
              "Text layer failed to load, continuing without text labels"
            )
          }
        }
      }

      // Point layer
      safeAddLayer({
        id: "drawing-points",
        type: "circle",
        source: "drawing-source",
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-radius": 6,
          "circle-color": [
            "case",
            ["has", "color"],
            ["get", "color"],
            "#ff0000"
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2
        }
      })

      // Line layer
      safeAddLayer({
        id: "drawing-lines",
        type: "line",
        source: "drawing-source",
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": ["case", ["has", "color"], ["get", "color"], "#ff0000"],
          "line-width": 3,
          "line-opacity": 0.8
        }
      })

      // Polygon fill layer
      safeAddLayer({
        id: "drawing-polygons-fill",
        type: "fill",
        source: "drawing-source",
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": ["case", ["has", "color"], ["get", "color"], "#ff0000"],
          "fill-opacity": 0.3
        }
      })

      // Polygon stroke layer
      safeAddLayer({
        id: "drawing-polygons-stroke",
        type: "line",
        source: "drawing-source",
        filter: ["==", "$type", "Polygon"],
        paint: {
          "line-color": ["case", ["has", "color"], ["get", "color"], "#ff0000"],
          "line-width": 2,
          "line-opacity": 0.8
        }
      })

      // Selected feature layers (line/polygon outline)
      safeAddLayer({
        id: "drawing-selected",
        type: "line",
        source: "drawing-source",
        filter: ["==", "selected", true],
        paint: {
          "line-color": "#ffff00",
          "line-width": 4,
          "line-dasharray": [2, 2]
        }
      })

      // Selected points highlight
      safeAddLayer({
        id: "drawing-selected-points",
        type: "circle",
        source: "drawing-source",
        filter: ["all", ["==", "$type", "Point"], ["==", "selected", true]],
        paint: {
          "circle-radius": 8,
          "circle-color": "#ffff00",
          "circle-opacity": 0.6,
          "circle-stroke-color": "#000000",
          "circle-stroke-width": 1
        }
      })

      // Vertex handles for selected line/polygon
      safeAddLayer({
        id: "drawing-vertex-handles",
        type: "circle",
        source: "drawing-source",
        filter: ["==", "isVertexHandle", true],
        paint: {
          "circle-radius": 5,
          "circle-color": "#ffcc00",
          "circle-stroke-color": "#000000",
          "circle-stroke-width": 1
        }
      })

      // Measurement labels (properly handled with glyph check)
      safeAddLayer({
        id: "drawing-measure-labels",
        type: "symbol",
        source: "drawing-source",
        filter: ["==", "isMeasureLabel", true],
        layout: {
          "text-field": ["get", "label"],
          "text-size": 12,
          "text-offset": [0, 1.2],
          "text-anchor": "top"
        },
        paint: {
          "text-color": "#111827",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1
        }
      })
    }

    const addAfterStyle = () => {
      if (!map) return

      // Wait for the next tick to ensure style is fully loaded
      setTimeout(() => {
        try {
          if (map.isStyleLoaded()) {
            addDrawingLayers()
          } else {
            // If style isn't loaded yet, wait for it
            const checkStyleLoaded = () => {
              if (map.isStyleLoaded()) {
                addDrawingLayers()
              } else {
                // Retry after a short delay
                setTimeout(checkStyleLoaded, 100)
              }
            }
            checkStyleLoaded()
          }
        } catch (e) {
          console.warn("Failed to add drawing layers after style load:", e)
        }
      }, 0)
    }
    addAfterStyle()
    map.on("style.load", addAfterStyle)

    return () => {
      map.off("style.load", addAfterStyle)
      const layersToRemove = [
        "drawing-selected",
        "drawing-selected-points",
        "drawing-vertex-handles",
        "drawing-measure-labels",
        "drawing-polygons-stroke",
        "drawing-polygons-fill",
        "drawing-lines",
        "drawing-points"
      ]
      try {
        layersToRemove.forEach(layerId => {
          try {
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId)
            }
          } catch {}
        })
      } catch {}
      try {
        if (map.getSource("drawing-source")) {
          map.removeSource("drawing-source")
        }
      } catch {
        // If getSource or removeSource fails during cleanup, ignore
      }
    }
  }, [map])

  // Disable double-click zoom while drawing lines/polygons so finish works
  useEffect(() => {
    if (!map) return
    const needsDisable = state.mode === "line" || state.mode === "polygon"
    if (needsDisable) {
      try {
        map.doubleClickZoom.disable()
      } catch {}
      return () => {
        try {
          map.doubleClickZoom.enable()
        } catch {}
      }
    }
  }, [map, state.mode])

  // Update drawing source when features change
  useEffect(() => {
    if (!map) return

    // Comprehensive map validity check to prevent accessing destroyed/invalid map
    try {
      // Check if map is destroyed or unmounted
      if (!(map as any)._container || (map as any)._removed) return

      // Check if map has required methods
      if (typeof (map as any).getStyle !== "function") return
      if (typeof (map as any).getSource !== "function") return

      // Check if style exists and is loaded
      const style = map.getStyle()
      if (!style) return

      if (
        typeof (map as any).isStyleLoaded === "function" &&
        !map.isStyleLoaded()
      )
        return
    } catch {
      // If any check throws, bail out safely
      return
    }

    try {
      const source = map.getSource("drawing-source") as
        | GeoJSONSource
        | undefined
      if (source) {
        const features: any[] = Array.from(state.features.values()).flatMap(
          df => {
            const base = {
              ...df.feature,
              properties: {
                ...df.feature.properties,
                id: df.id,
                name: df.name,
                description: df.description,
                color: df.color || "#ff0000",
                selected: df.id === state.selectedFeature
              }
            }

            const extras: any[] = []
            // Add vertex handles for edit mode on selected feature
            if (df.id === state.selectedFeature && state.mode === "edit") {
              const geom = df.feature.geometry
              if (geom.type === "LineString") {
                ;(geom.coordinates as [number, number][])?.forEach((c, idx) => {
                  extras.push({
                    type: "Feature",
                    geometry: { type: "Point", coordinates: c },
                    properties: {
                      isVertexHandle: true,
                      featureId: df.id,
                      vertexIndex: idx
                    }
                  })
                })
              } else if (geom.type === "Polygon") {
                ;(geom.coordinates as [number, number][][])?.forEach(
                  (ring, rIdx) => {
                    ring.forEach((c, idx) => {
                      // Skip duplicate last vertex for closed ring
                      if (idx === ring.length - 1) return
                      extras.push({
                        type: "Feature",
                        geometry: { type: "Point", coordinates: c },
                        properties: {
                          isVertexHandle: true,
                          featureId: df.id,
                          ringIndex: rIdx,
                          vertexIndex: idx
                        }
                      })
                    })
                  }
                )
              }
            }

            // Measurement labels for selected
            if (df.id === state.selectedFeature) {
              const geom = df.feature.geometry
              if (geom.type === "LineString") {
                const coords = geom.coordinates as [number, number][]
                const meters = lengthOfLine(coords)
                const midIdx = Math.floor(coords.length / 2)
                const mid = coords[midIdx]
                extras.push({
                  type: "Feature",
                  geometry: { type: "Point", coordinates: mid },
                  properties: {
                    isMeasureLabel: true,
                    label: `${(meters / 1000).toFixed(2)} km`
                  }
                })
              } else if (geom.type === "Polygon") {
                const ring = (geom.coordinates as [number, number][][])[0]
                const area = polygonArea(ring)
                // Rough centroid from first 4 vertices
                const cx =
                  (ring[0][0] + ring[1][0] + ring[2][0] + ring[3][0]) / 4
                const cy =
                  (ring[0][1] + ring[1][1] + ring[2][1] + ring[3][1]) / 4
                extras.push({
                  type: "Feature",
                  geometry: { type: "Point", coordinates: [cx, cy] },
                  properties: {
                    isMeasureLabel: true,
                    label: `${(area / 1_000_000).toFixed(2)} km²`
                  }
                })
              }
            }

            return [base, ...extras]
          }
        )

        // Add temporary drawing features
        if (state.isDrawing && state.currentPoints.length > 0) {
          if (state.mode === "line" && state.currentPoints.length >= 1) {
            // Show current line being drawn
            features.push({
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: state.currentPoints
              },
              properties: {
                color: "#ff0000",
                temporary: true
              }
            })
            // Measurement for live line length
            const meters = lengthOfLine(state.currentPoints)
            const midIdx = Math.floor(state.currentPoints.length / 2)
            const mid = state.currentPoints[midIdx]
            features.push({
              type: "Feature",
              geometry: { type: "Point", coordinates: mid },
              properties: {
                isMeasureLabel: true,
                label: `${(meters / 1000).toFixed(2)} km`
              }
            })
          } else if (
            state.mode === "polygon" &&
            state.currentPoints.length >= 1
          ) {
            // Show current polygon points
            state.currentPoints.forEach((point, index) => {
              features.push({
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: point
                },
                properties: {
                  color: "#ff0000",
                  temporary: true,
                  pointIndex: index
                }
              })
            })

            // Show polygon outline if we have enough points
            if (state.currentPoints.length >= 2) {
              features.push({
                type: "Feature",
                geometry: {
                  type: "LineString",
                  coordinates: state.currentPoints
                },
                properties: {
                  color: "#ff0000",
                  temporary: true
                }
              })
              if (state.currentPoints.length >= 3) {
                // Live polygon area label using provisional closed ring
                const ring = [...state.currentPoints, state.currentPoints[0]]
                const area = polygonArea(ring)
                const mid = ring[Math.floor(ring.length / 2)]
                features.push({
                  type: "Feature",
                  geometry: { type: "Point", coordinates: mid },
                  properties: {
                    isMeasureLabel: true,
                    label: `${(area / 1_000_000).toFixed(2)} km²`
                  }
                })
              }
            }
          }
        }

        // Add preview shape for rectangle and circle
        if (state.previewShape) {
          features.push({
            ...state.previewShape,
            properties: {
              ...state.previewShape.properties,
              color: "#ff0000",
              preview: true,
              temporary: true
            }
          })
        }

        source.setData({
          type: "FeatureCollection",
          features
        })
      }
    } catch (error) {
      // During style teardown/unmount, accesses can throw; ignore safely
      // to avoid noisy errors in unmount phases.
    }
  }, [
    map,
    state.features,
    state.selectedFeature,
    state.isDrawing,
    state.currentPoints,
    state.mode,
    state.previewShape
  ])

  // Set up event listeners for drawing
  useEffect(() => {
    if (!map || state.mode === "none") return

    const handleMapClick = (e: any) => {
      e.preventDefault()
      let point: [number, number] = [e.lngLat.lng, e.lngLat.lat]
      if (
        state.mode === "point" ||
        state.mode === "line" ||
        state.mode === "polygon"
      ) {
        point = snapPoint(point)
      }

      // Vertex drag finish
      if (state.mode === "edit" && draggingVertexRef.current) {
        draggingVertexRef.current = null
        return
      }

      switch (state.mode) {
        case "point":
          createPoint(point)
          break
        case "line":
          addLinePoint(point)
          break
        case "rectangle":
          if (state.currentPoints.length === 0) startRectangle(point)
          else finishRectangle(point)
          break
        case "circle":
          if (state.currentPoints.length === 0) startCircle(point)
          else finishCircle()
          break
        case "polygon":
          addPolygonPoint(point)
          break
        case "select":
          selectFeature(e)
          break
      }
    }

    const handleMouseMove = (e: any) => {
      let point: [number, number] = [e.lngLat.lng, e.lngLat.lat]
      if (state.mode === "line" || state.mode === "polygon") {
        point = snapPoint(point)
      }

      setState(prev => ({ ...prev, mousePosition: point }))

      // Vertex dragging for selected features
      if (
        state.mode === "edit" &&
        draggingVertexRef.current &&
        state.selectedFeature
      ) {
        const featureId = draggingVertexRef.current.featureId
        const df = state.features.get(featureId)
        if (!df) return
        const geom = df.feature.geometry
        if (geom.type === "LineString") {
          const coords = (geom.coordinates as [number, number][])!.slice()
          coords[draggingVertexRef.current.vertexIndex] = snapPoint(point)
          setState(prev => {
            const newMap = new Map(prev.features)
            newMap.set(featureId, {
              ...df,
              feature: {
                ...df.feature,
                geometry: { type: "LineString", coordinates: coords }
              }
            })
            return { ...prev, features: newMap }
          })
        } else if (geom.type === "Polygon") {
          const rings = (geom.coordinates as [number, number][][])!.map(r =>
            r.slice()
          )
          const ringIdx = draggingVertexRef.current.ringIndex ?? 0
          const vIdx = draggingVertexRef.current.vertexIndex
          const snapped = snapPoint(point)
          rings[ringIdx][vIdx] = snapped
          // Keep closed ring
          if (vIdx === 0) rings[ringIdx][rings[ringIdx].length - 1] = snapped
          if (vIdx === rings[ringIdx].length - 1) rings[ringIdx][0] = snapped
          setState(prev => {
            const newMap = new Map(prev.features)
            newMap.set(featureId, {
              ...df,
              feature: {
                ...df.feature,
                geometry: { type: "Polygon", coordinates: rings }
              }
            })
            return { ...prev, features: newMap }
          })
        }
      }

      // Generate preview shapes for rectangle and circle
      if (state.mode === "rectangle" && state.currentPoints.length === 1) {
        const startPoint = state.currentPoints[0]
        const coordinates = [
          startPoint,
          [point[0], startPoint[1]],
          point,
          [startPoint[0], point[1]],
          startPoint
        ]

        setState(prev => ({
          ...prev,
          previewShape: {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [coordinates]
            },
            properties: { preview: true }
          }
        }))
      } else if (state.mode === "circle" && state.currentPoints.length === 1) {
        const center = state.currentPoints[0]
        const radius = Math.sqrt(
          Math.pow(point[0] - center[0], 2) + Math.pow(point[1] - center[1], 2)
        )

        const points: [number, number][] = []
        for (let i = 0; i <= 64; i++) {
          const angle = (i / 64) * 2 * Math.PI
          points.push([
            center[0] + radius * Math.cos(angle),
            center[1] + radius * Math.sin(angle)
          ])
        }
        if (
          points.length > 0 &&
          (points[0][0] !== points[points.length - 1][0] ||
            points[0][1] !== points[points.length - 1][1])
        ) {
          points.push(points[0])
        }

        setState(prev => ({
          ...prev,
          previewShape: {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [points]
            },
            properties: { preview: true }
          }
        }))
      } else {
        setState(prev => ({ ...prev, previewShape: null }))
      }
    }

    const handleMapDblClick = (e: any) => {
      e.preventDefault()

      if (state.mode === "line" && state.currentPoints.length >= 2) {
        finishLine()
      } else if (state.mode === "polygon" && state.currentPoints.length >= 3) {
        finishPolygon()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelDrawing()
      } else if (e.key === "Delete" && state.selectedFeature) {
        deleteFeature(state.selectedFeature)
      } else if (e.key === "Enter") {
        if (state.mode === "line" && state.currentPoints.length >= 2) {
          finishLine()
        } else if (
          state.mode === "polygon" &&
          state.currentPoints.length >= 3
        ) {
          finishPolygon()
        }
      }
    }

    // Pick vertex handles to start dragging
    const handleMouseDown = (e: any) => {
      if (state.mode !== "edit" || !state.selectedFeature) return
      const features = map?.queryRenderedFeatures(e.point)
      const top = features?.find(f => f.properties?.isVertexHandle)
      if (top) {
        e.preventDefault()
        const fid = top.properties?.featureId
        const ringIndex =
          typeof top.properties?.ringIndex === "number"
            ? (top.properties?.ringIndex as number)
            : undefined
        const vertexIndex = Number(top.properties?.vertexIndex)
        draggingVertexRef.current = { featureId: fid, ringIndex, vertexIndex }
        try {
          map.getCanvas().style.cursor = "grabbing"
        } catch {}
      }
    }

    try {
      map.on("click", handleMapClick)
      map.on("dblclick", handleMapDblClick)
      map.on("mousemove", handleMouseMove)
      map.on("mousedown", handleMouseDown)
      document.addEventListener("keydown", handleKeyDown)
    } catch (error) {
      console.warn("Failed to add map event listeners:", error)
    }

    return () => {
      try {
        map.off("click", handleMapClick)
        map.off("dblclick", handleMapDblClick)
        map.off("mousemove", handleMouseMove)
        map.off("mousedown", handleMouseDown)
        document.removeEventListener("keydown", handleKeyDown)
      } catch (error) {
        console.warn("Failed to remove map event listeners:", error)
      }
    }
  }, [map, state.mode, state.currentPoints, state.selectedFeature])

  // Drawing functions
  const createPoint = useCallback((point: [number, number]) => {
    const feature: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: point
      },
      properties: {}
    }

    addFeature(feature, "Point")
    setDrawingMode("none")
  }, [])

  const addLinePoint = useCallback((point: [number, number]) => {
    setState(prev => ({
      ...prev,
      currentPoints: [...prev.currentPoints, point],
      isDrawing: true
    }))
  }, [])

  const finishLine = useCallback(() => {
    if (state.currentPoints.length < 2) return

    const feature: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: state.currentPoints
      },
      properties: {}
    }

    addFeature(feature, "LineString")
    setState(prev => ({
      ...prev,
      currentPoints: [],
      isDrawing: false
    }))
    setDrawingMode("none")
  }, [state.currentPoints])

  const addPolygonPoint = useCallback((point: [number, number]) => {
    setState(prev => ({
      ...prev,
      currentPoints: [...prev.currentPoints, point],
      isDrawing: true
    }))
  }, [])

  const finishPolygon = useCallback(() => {
    if (state.currentPoints.length < 3) return

    // Close the polygon by adding the first point at the end
    const coordinates = [...state.currentPoints, state.currentPoints[0]]

    const feature: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [coordinates]
      },
      properties: {}
    }

    addFeature(feature, "Polygon")
    setState(prev => ({
      ...prev,
      currentPoints: [],
      isDrawing: false
    }))
    setDrawingMode("none")
  }, [state.currentPoints])

  const startRectangle = useCallback((startPoint: [number, number]) => {
    setState(prev => ({
      ...prev,
      currentPoints: [startPoint],
      isDrawing: true
    }))
  }, [])

  const finishRectangle = useCallback(
    (endPoint: [number, number]) => {
      if (state.currentPoints.length !== 1) return
      const startPoint = state.currentPoints[0]
      const coordinates = [
        startPoint,
        [endPoint[0], startPoint[1]],
        endPoint,
        [startPoint[0], endPoint[1]],
        startPoint
      ]

      const feature: GeoJSON.Feature = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coordinates]
        },
        properties: {}
      }

      addFeature(feature, "Rectangle")
      setState(prev => ({
        ...prev,
        currentPoints: [],
        isDrawing: false,
        previewShape: null
      }))
      setDrawingMode("none")
    },
    [state.currentPoints]
  )

  const startCircle = useCallback((center: [number, number]) => {
    setState(prev => ({
      ...prev,
      currentPoints: [center],
      isDrawing: true
    }))
  }, [])

  const finishCircle = useCallback(() => {
    if (state.currentPoints.length !== 1 || !state.mousePosition) return
    const center = state.currentPoints[0]
    const edge = state.mousePosition
    const radius = Math.sqrt(
      Math.pow(edge[0] - center[0], 2) + Math.pow(edge[1] - center[1], 2)
    )
    const points: [number, number][] = []
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * 2 * Math.PI
      points.push([
        center[0] + radius * Math.cos(angle),
        center[1] + radius * Math.sin(angle)
      ])
    }
    if (
      points.length > 0 &&
      (points[0][0] !== points[points.length - 1][0] ||
        points[0][1] !== points[points.length - 1][1])
    ) {
      points.push(points[0])
    }

    const feature: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [points]
      },
      properties: {
        center,
        radius
      }
    }

    addFeature(feature, "Circle")
    setState(prev => ({
      ...prev,
      currentPoints: [],
      isDrawing: false,
      previewShape: null
    }))
    setDrawingMode("none")
  }, [state.currentPoints, state.mousePosition])

  const addFeature = useCallback(
    (feature: GeoJSON.Feature, name: string) => {
      const id = `feature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const color = DRAWING_COLORS[state.features.size % DRAWING_COLORS.length]

      const drawnFeature: DrawnFeature = {
        id,
        feature,
        name,
        color,
        createdAt: new Date()
      }

      setState(prev => ({
        ...prev,
        features: new Map(prev.features).set(id, drawnFeature)
      }))

      // Add to undo stack
      undoStackRef.current.push(drawnFeature)
      redoStackRef.current = []

      onShapeDrawn?.(feature)
      toast.success(`${name} drawn successfully`)
    },
    [state.features.size, onShapeDrawn]
  )

  const deleteFeature = useCallback(
    (featureId: string) => {
      const feature = state.features.get(featureId)
      if (!feature) return

      setState(prev => {
        const newFeatures = new Map(prev.features)
        newFeatures.delete(featureId)
        return {
          ...prev,
          features: newFeatures,
          selectedFeature:
            prev.selectedFeature === featureId ? null : prev.selectedFeature
        }
      })

      onShapeDeleted?.(featureId)
      toast.success("Feature deleted")
    },
    [state.features, onShapeDeleted]
  )

  const selectFeature = useCallback(
    (e: any) => {
      const features = map?.queryRenderedFeatures(e.point, {
        layers: ["drawing-points", "drawing-lines", "drawing-polygons-fill"]
      })

      if (features && features.length > 0) {
        const featureId = features[0].properties?.id
        setState(prev => ({
          ...prev,
          selectedFeature: featureId
        }))
      } else {
        setState(prev => ({
          ...prev,
          selectedFeature: null
        }))
      }
    },
    [map]
  )

  const setDrawingMode = useCallback(
    (mode: DrawingMode) => {
      setState(prev => ({
        ...prev,
        mode,
        isDrawing: false,
        currentPoints: []
      }))

      if (map) {
        if (mode === "none") map.getCanvas().style.cursor = ""
        else if (mode === "edit") map.getCanvas().style.cursor = "grab"
        else map.getCanvas().style.cursor = "crosshair"
      }
    },
    [map]
  )

  const cancelDrawing = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: "none",
      isDrawing: false,
      currentPoints: [],
      previewShape: null
    }))

    if (map) {
      map.getCanvas().style.cursor = ""
    }
  }, [map])

  const clearAllFeatures = useCallback(() => {
    setState(prev => ({
      ...prev,
      features: new Map(),
      selectedFeature: null
    }))
    toast.success("All features cleared")
  }, [])

  const exportFeatures = useCallback(() => {
    const features = Array.from(state.features.values()).map(df => df.feature)

    if (exportFormat === "geojson") {
      const geojson = {
        type: "FeatureCollection" as const,
        features
      }

      const blob = new Blob([JSON.stringify(geojson, null, 2)], {
        type: "application/json"
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "map-features.geojson"
      a.click()
      URL.revokeObjectURL(url)
    } else if (exportFormat === "kml") {
      const toCoord = (c: [number, number]) => `${c[0]},${c[1]},0`
      const kmlPlacemarks = features
        .map(f => {
          const name = (f.properties as any)?.name || "Feature"
          if (f.geometry.type === "Point") {
            const c = f.geometry.coordinates as [number, number]
            return `<Placemark><name>${name}</name><Point><coordinates>${toCoord(c)}</coordinates></Point></Placemark>`
          }
          if (f.geometry.type === "LineString") {
            const coords = (f.geometry.coordinates as [number, number][])
              .map(toCoord)
              .join(" ")
            return `<Placemark><name>${name}</name><LineString><coordinates>${coords}</coordinates></LineString></Placemark>`
          }
          if (f.geometry.type === "Polygon") {
            const rings = f.geometry.coordinates as [number, number][][]
            const outer = rings[0].map(toCoord).join(" ")
            return `<Placemark><name>${name}</name><Polygon><outerBoundaryIs><LinearRing><coordinates>${outer}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>`
          }
          return null
        })
        .filter(Boolean)
        .join("")

      const kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>${kmlPlacemarks}</Document></kml>`
      const blob = new Blob([kml], {
        type: "application/vnd.google-earth.kml+xml"
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "map-features.kml"
      a.click()
      URL.revokeObjectURL(url)
    }

    onShapesExported?.(features)
    setShowExportDialog(false)
    toast.success(`Exported ${features.length} features`)
  }, [state.features, exportFormat, onShapesExported])

  const importFeatures = useCallback(() => {
    try {
      const geojson = JSON.parse(importData)

      if (
        geojson.type === "FeatureCollection" &&
        Array.isArray(geojson.features)
      ) {
        geojson.features.forEach((feature: GeoJSON.Feature) => {
          addFeature(feature, "Imported")
        })

        onShapesImported?.(geojson.features)
        setShowImportDialog(false)
        setImportData("")
        toast.success(`Imported ${geojson.features.length} features`)
      } else {
        toast.error("Invalid GeoJSON format")
      }
    } catch (error) {
      toast.error("Failed to parse GeoJSON")
    }
  }, [importData, addFeature, onShapesImported])

  return (
    <TooltipProvider>
      <div className={`map-drawing-tools ${className}`}>
        {/* Drawing tools panel */}
        <Card
          className={`${variant === "overlay" ? "absolute top-20 left-4 z-10" : ""} p-2 bg-white/95 backdrop-blur-sm border shadow-lg`}
        >
          <CardHeader className="p-2 pb-1">
            <CardTitle className="text-sm">Drawing Tools</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-1">
            <div className="grid grid-cols-2 gap-1">
              {/* Selection tool */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={state.mode === "select" ? "default" : "ghost"}
                    onClick={() => setDrawingMode("select")}
                    className="h-8 w-8 p-0"
                  >
                    <Hand className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select features</p>
                </TooltipContent>
              </Tooltip>

              {/* Point tool */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={state.mode === "point" ? "default" : "ghost"}
                    onClick={() => setDrawingMode("point")}
                    className="h-8 w-8 p-0"
                  >
                    <Circle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Draw point</p>
                </TooltipContent>
              </Tooltip>

              {/* Line tool */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={state.mode === "line" ? "default" : "ghost"}
                    onClick={() => setDrawingMode("line")}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Draw line (double-click to finish)</p>
                </TooltipContent>
              </Tooltip>

              {/* Rectangle tool */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={state.mode === "rectangle" ? "default" : "ghost"}
                    onClick={() => setDrawingMode("rectangle")}
                    className="h-8 w-8 p-0"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Draw rectangle</p>
                </TooltipContent>
              </Tooltip>

              {/* Polygon tool */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={state.mode === "polygon" ? "default" : "ghost"}
                    onClick={() => setDrawingMode("polygon")}
                    className="h-8 w-8 p-0"
                  >
                    <Pentagon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Draw polygon (double-click to finish)</p>
                </TooltipContent>
              </Tooltip>

              {/* Delete tool */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      state.selectedFeature &&
                      deleteFeature(state.selectedFeature)
                    }
                    disabled={!state.selectedFeature}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete selected feature</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <Separator className="my-2" />

            <div className="grid grid-cols-2 gap-1">
              {/* Export */}
              <Dialog
                open={showExportDialog}
                onOpenChange={setShowExportDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={state.features.size === 0}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export Features</DialogTitle>
                    <DialogDescription>
                      Export drawn features to a file
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Format</Label>
                      <select
                        value={exportFormat}
                        onChange={e =>
                          setExportFormat(e.target.value as "geojson" | "kml")
                        }
                        className="w-full mt-1 p-2 border rounded"
                      >
                        <option value="geojson">GeoJSON</option>
                        <option value="kml">KML</option>
                      </select>
                    </div>
                    <Button onClick={exportFeatures} className="w-full">
                      Export {state.features.size} features
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Import */}
              <Dialog
                open={showImportDialog}
                onOpenChange={setShowImportDialog}
              >
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Upload className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Features</DialogTitle>
                    <DialogDescription>
                      Import features from GeoJSON
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Paste GeoJSON</Label>
                      <Textarea
                        value={importData}
                        onChange={e => setImportData(e.target.value)}
                        placeholder="Paste GeoJSON data here..."
                        rows={10}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      onClick={importFeatures}
                      disabled={!importData.trim()}
                      className="w-full"
                    >
                      Import Features
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Undo/Redo and Edit controls */}
            <div className="flex items-center gap-2 my-2">
              <Button
                size="sm"
                variant="outline"
                disabled={undoStackRef.current.length === 0}
                onClick={() => {
                  const last = undoStackRef.current.pop()
                  if (!last) return
                  setState(prev => {
                    const newMap = new Map(prev.features)
                    newMap.delete(last.id)
                    redoStackRef.current.push(last)
                    return { ...prev, features: newMap }
                  })
                }}
              >
                Undo
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={redoStackRef.current.length === 0}
                onClick={() => {
                  const last = redoStackRef.current.pop()
                  if (!last) return
                  setState(prev => {
                    const newMap = new Map(prev.features)
                    newMap.set(last.id, last)
                    undoStackRef.current.push(last)
                    return { ...prev, features: newMap }
                  })
                }}
              >
                Redo
              </Button>
              <Button
                size="sm"
                variant={state.mode === "edit" ? "default" : "secondary"}
                onClick={() =>
                  setDrawingMode(state.mode === "edit" ? "none" : "edit")
                }
              >
                {state.mode === "edit" ? "Stop Move" : "Move Selected"}
              </Button>
            </div>

            {/* Selected feature metadata + metrics */}
            {selected && (
              <div className="space-y-2 mb-2">
                <Label className="text-xs">Selected Feature</Label>
                <Input
                  placeholder="Name"
                  value={selected.name || ""}
                  onChange={e => {
                    const name = e.target.value
                    setState(prev => {
                      const df = prev.features.get(selected.id)!
                      const newMap = new Map(prev.features)
                      newMap.set(selected.id, {
                        ...df,
                        name,
                        feature: {
                          ...df.feature,
                          properties: { ...(df.feature.properties || {}), name }
                        }
                      })
                      return { ...prev, features: newMap }
                    })
                  }}
                />
                <Textarea
                  placeholder="Description"
                  value={selected.description || ""}
                  onChange={e => {
                    const description = e.target.value
                    setState(prev => {
                      const df = prev.features.get(selected.id)!
                      const newMap = new Map(prev.features)
                      newMap.set(selected.id, {
                        ...df,
                        description,
                        feature: {
                          ...df.feature,
                          properties: {
                            ...(df.feature.properties || {}),
                            description
                          }
                        }
                      })
                      return { ...prev, features: newMap }
                    })
                  }}
                />
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Color</Label>
                  <input
                    type="color"
                    value={selected.color || "#ff0000"}
                    onChange={e => {
                      const color = e.target.value
                      setState(prev => {
                        const df = prev.features.get(selected.id)!
                        const newMap = new Map(prev.features)
                        newMap.set(selected.id, { ...df, color })
                        return { ...prev, features: newMap }
                      })
                    }}
                  />
                </div>
                {selectedMetrics && (
                  <div className="text-xs text-gray-600">
                    {selectedMetrics.type === "line" &&
                      selectedMetrics.lengthMeters && (
                        <div>
                          Length:{" "}
                          {(selectedMetrics.lengthMeters / 1000).toFixed(2)} km
                        </div>
                      )}
                    {selectedMetrics.type === "polygon" &&
                      selectedMetrics.areaSqMeters &&
                      selectedMetrics.perimeterMeters && (
                        <div>
                          <div>
                            Area:{" "}
                            {(selectedMetrics.areaSqMeters / 1_000_000).toFixed(
                              2
                            )}{" "}
                            km²
                          </div>
                          <div>
                            Perimeter:{" "}
                            {(selectedMetrics.perimeterMeters / 1000).toFixed(
                              2
                            )}{" "}
                            km
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {state.features.size > 0 && (
              <>
                <Separator className="my-2" />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={clearAllFeatures}
                  className="w-full text-xs"
                >
                  Clear All ({state.features.size})
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Drawing status */}
        {state.isDrawing && (
          <Card className="absolute bottom-20 left-4 z-10 p-2 bg-white/95 backdrop-blur-sm border shadow-lg">
            <CardContent className="p-2">
              <div className="text-sm">
                {state.mode === "line" && (
                  <p>Click to add points, double-click to finish line</p>
                )}
                {state.mode === "polygon" && (
                  <p>Click to add points, double-click to finish polygon</p>
                )}
                {state.mode === "rectangle" && (
                  <p>Click second corner to complete rectangle</p>
                )}
                {state.mode === "circle" && (
                  <p>Click edge point to complete circle</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Press Escape to cancel
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
})

export default MapDrawingTools
