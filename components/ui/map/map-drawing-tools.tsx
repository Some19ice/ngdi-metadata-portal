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
  className = ""
}: MapDrawingToolsProps) {
  const [state, setState] = useState<DrawingState>({
    mode: "none",
    isDrawing: false,
    currentPoints: [],
    selectedFeature: null,
    features: new Map()
  })

  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<"geojson" | "kml">("geojson")
  const [importData, setImportData] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const undoStackRef = useRef<DrawnFeature[]>([])
  const redoStackRef = useRef<DrawnFeature[]>([])

  // Initialize drawing layers
  useEffect(() => {
    if (!map) return

    // Add drawing source and layers
    if (!map.getSource("drawing-source")) {
      map.addSource("drawing-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      })

      // Point layer
      map.addLayer({
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
      map.addLayer({
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
      map.addLayer({
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
      map.addLayer({
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

      // Selected feature layer
      map.addLayer({
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
    }

    return () => {
      // Cleanup drawing layers and source
      const layersToRemove = [
        "drawing-selected",
        "drawing-polygons-stroke",
        "drawing-polygons-fill",
        "drawing-lines",
        "drawing-points"
      ]

      layersToRemove.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId)
        }
      })

      if (map.getSource("drawing-source")) {
        map.removeSource("drawing-source")
      }
    }
  }, [map])

  // Update drawing source when features change
  useEffect(() => {
    if (!map) return

    const source = map.getSource("drawing-source") as GeoJSONSource
    if (source) {
      const features = Array.from(state.features.values()).map(df => ({
        ...df.feature,
        properties: {
          ...df.feature.properties,
          id: df.id,
          name: df.name,
          description: df.description,
          color: df.color || "#ff0000",
          selected: df.id === state.selectedFeature
        }
      }))

      source.setData({
        type: "FeatureCollection",
        features
      })
    }
  }, [map, state.features, state.selectedFeature])

  // Set up event listeners for drawing
  useEffect(() => {
    if (!map || state.mode === "none") return

    const handleMapClick = (e: any) => {
      const point: [number, number] = [e.lngLat.lng, e.lngLat.lat]

      switch (state.mode) {
        case "point":
          createPoint(point)
          break
        case "line":
          addLinePoint(point)
          break
        case "rectangle":
          startRectangle(point)
          break
        case "circle":
          startCircle(point)
          break
        case "polygon":
          addPolygonPoint(point)
          break
        case "select":
          selectFeature(e)
          break
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

    map.on("click", handleMapClick)
    map.on("dblclick", handleMapDblClick)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      map.off("click", handleMapClick)
      map.off("dblclick", handleMapDblClick)
      document.removeEventListener("keydown", handleKeyDown)
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

  const startRectangle = useCallback(
    (startPoint: [number, number]) => {
      // For rectangle, we need a second click
      const handleSecondClick = (e: any) => {
        const endPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat]

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
        setDrawingMode("none")
        map?.off("click", handleSecondClick)
      }

      map?.once("click", handleSecondClick)
    },
    [map]
  )

  const startCircle = useCallback(
    (center: [number, number]) => {
      const handleSecondClick = (e: any) => {
        const edge: [number, number] = [e.lngLat.lng, e.lngLat.lat]

        // Calculate radius in degrees (approximate)
        const radius = Math.sqrt(
          Math.pow(edge[0] - center[0], 2) + Math.pow(edge[1] - center[1], 2)
        )

        // Create circle approximation with 64 points
        const points = []
        for (let i = 0; i <= 64; i++) {
          const angle = (i / 64) * 2 * Math.PI
          points.push([
            center[0] + radius * Math.cos(angle),
            center[1] + radius * Math.sin(angle)
          ])
        }

        const feature: GeoJSON.Feature = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [points]
          },
          properties: {
            center: center,
            radius: radius
          }
        }

        addFeature(feature, "Circle")
        setDrawingMode("none")
        map?.off("click", handleSecondClick)
      }

      map?.once("click", handleSecondClick)
    },
    [map]
  )

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
        map.getCanvas().style.cursor = mode === "none" ? "" : "crosshair"
      }
    },
    [map]
  )

  const cancelDrawing = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: "none",
      isDrawing: false,
      currentPoints: []
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
        <Card className="absolute top-20 left-4 z-10 p-2 bg-white/95 backdrop-blur-sm border shadow-lg">
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
