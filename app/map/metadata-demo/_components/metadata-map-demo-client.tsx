"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { MetadataRecord } from "@/lib/map-utils"

// Dynamically import map components with SSR disabled
const MetadataMapDisplay = dynamic(
  () => import("@/components/ui/map/metadata-map-display"),
  { ssr: false }
)

const TerrainMapDisplay = dynamic(
  () => import("@/components/ui/map/terrain-map-display"),
  { ssr: false }
)

const StylePreview = dynamic(
  () => import("@/components/ui/map/style-preview"),
  { ssr: false }
)

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  InfoIcon,
  MapIcon,
  Layers,
  Map as MapIcon2,
  Globe,
  Mountain,
  Database,
  AlertCircle
} from "lucide-react"
import { validateMapTilerApiKey, MAPTILER_STYLES } from "@/lib/map-config"

interface MetadataMapDemoClientProps {
  initialRecords: MetadataRecord[]
  error?: string
}

export default function MetadataMapDemoClient({
  initialRecords,
  error
}: MetadataMapDemoClientProps) {
  const [selectedRecord, setSelectedRecord] = useState<MetadataRecord | null>(
    null
  )
  const [activeTab, setActiveTab] = useState("metadata-map")

  // Check if MapTiler API key is valid
  const { isValid: isApiKeyValid, apiKey } = validateMapTilerApiKey()

  // Get available MapTiler styles for display
  const availableMapTilerStyles = useMemo(() => {
    return MAPTILER_STYLES.map(style => ({
      ...style,
      url: apiKey ? style.url.replace("${apiKey}", apiKey) : "",
      isAvailable: !!apiKey
    }))
  }, [apiKey])

  const handleRecordClick = (record: MetadataRecord) => {
    setSelectedRecord(record)
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">
                MapTiler Map Visualization
              </CardTitle>
              <CardDescription className="mt-2">
                Explore geospatial data visualization with MapTiler and MapLibre
                GL JS
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isApiKeyValid ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                >
                  <InfoIcon className="h-3 w-3" />
                  MapTiler API Key Active
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1"
                >
                  <InfoIcon className="h-3 w-3" />
                  MapTiler API Key Missing
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="metadata-map"
            className="w-full"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <TabsList className="grid grid-cols-1 md:grid-cols-4 mb-4">
              <TabsTrigger
                value="metadata-map"
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                <span>Metadata Map</span>
              </TabsTrigger>
              <TabsTrigger
                value="map-styles"
                className="flex items-center gap-2"
              >
                <Layers className="h-4 w-4" />
                <span>Map Styles</span>
              </TabsTrigger>
              <TabsTrigger
                value="terrain-view"
                className="flex items-center gap-2"
              >
                <Mountain className="h-4 w-4" />
                <span>Terrain View</span>
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Features</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="metadata-map" className="mt-0">
              {error ? (
                <Alert className="mb-4" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Loading Metadata</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <Alert className="mb-4">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Metadata Visualization</AlertTitle>
                  <AlertDescription>
                    This tab displays published metadata records with spatial
                    information from the NGDI database. Showing{" "}
                    {initialRecords.length} records with spatial bounds. Try
                    different base map styles using the layer controls on the
                    top-left of the map.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <div className="h-[600px] w-full">
                    {initialRecords.length > 0 ? (
                      <MetadataMapDisplay
                        records={initialRecords}
                        className="h-full w-full"
                        onRecordClick={handleRecordClick}
                        showBoundingBoxes={true}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">
                            No metadata records with spatial bounds found
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Published metadata records with spatial information
                            will appear here
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Record Details</CardTitle>
                      <CardDescription>
                        {selectedRecord
                          ? "Selected metadata record information"
                          : "Click on a marker to view record details"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedRecord ? (
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-xl">
                              {selectedRecord.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {selectedRecord.description}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">
                              Spatial Bounds
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                              <div>
                                <span className="text-gray-500">North:</span>{" "}
                                {selectedRecord.northBoundLatitude}°
                              </div>
                              <div>
                                <span className="text-gray-500">South:</span>{" "}
                                {selectedRecord.southBoundLatitude}°
                              </div>
                              <div>
                                <span className="text-gray-500">East:</span>{" "}
                                {selectedRecord.eastBoundLongitude}°
                              </div>
                              <div>
                                <span className="text-gray-500">West:</span>{" "}
                                {selectedRecord.westBoundLongitude}°
                              </div>
                            </div>
                          </div>
                          {selectedRecord.dataType && (
                            <div>
                              <h4 className="font-medium text-sm">Data Type</h4>
                              <p className="text-sm text-gray-600">
                                {selectedRecord.dataType}
                              </p>
                            </div>
                          )}
                          {selectedRecord.keywords &&
                            Array.isArray(selectedRecord.keywords) &&
                            selectedRecord.keywords.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm">
                                  Keywords
                                </h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedRecord.keywords.map(
                                    (keyword, index) => (
                                      <Badge
                                        key={index}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {keyword}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          {selectedRecord.organization && (
                            <div>
                              <h4 className="font-medium text-sm">
                                Organization
                              </h4>
                              <p className="text-sm text-gray-600">
                                {typeof selectedRecord.organization ===
                                  "object" && selectedRecord.organization.name
                                  ? selectedRecord.organization.name
                                  : String(selectedRecord.organization)}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">
                          <MapIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">
                            Select a marker on the map to view detailed
                            information about the metadata record.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="map-styles" className="mt-0">
              <Alert className="mb-4">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Map Style Preview</AlertTitle>
                <AlertDescription>
                  Preview different MapTiler map styles. Each style provides a
                  different visual representation of the same geographic data.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableMapTilerStyles.map(style => (
                  <Card key={style.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{style.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {style.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-48 w-full">
                        {style.isAvailable ? (
                          <StylePreview
                            styleUrl={style.url}
                            className="h-full w-full"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                            <div className="text-center">
                              <InfoIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">
                                API Key Required
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Badge
                        variant={style.isAvailable ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {style.isAvailable ? "Available" : "Requires API Key"}
                      </Badge>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="terrain-view" className="mt-0">
              <Alert className="mb-4">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>3D Terrain Visualization</AlertTitle>
                <AlertDescription>
                  Experience terrain data in 3D with elevation and hillshading.
                  Use mouse controls to rotate and tilt the view.
                </AlertDescription>
              </Alert>

              <div className="h-[600px] w-full">
                <TerrainMapDisplay className="h-full w-full" />
              </div>
            </TabsContent>

            <TabsContent value="features" className="mt-0">
              <Alert className="mb-4">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Map Features</AlertTitle>
                <AlertDescription>
                  Explore the various features and capabilities of the MapLibre
                  GL JS mapping system.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Layer Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Toggle between different base map styles</li>
                      <li>• Add and remove overlay layers</li>
                      <li>• Control layer opacity and visibility</li>
                      <li>• Organize layers with drag-and-drop</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapIcon2 className="h-5 w-5" />
                      Interactive Controls
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Zoom and pan with mouse or touch</li>
                      <li>• Rotate and tilt for 3D perspective</li>
                      <li>• Click markers for detailed information</li>
                      <li>• Fullscreen mode for immersive viewing</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Data Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Real-time metadata record visualization</li>
                      <li>• Spatial bounds and bounding boxes</li>
                      <li>• Dynamic data loading and caching</li>
                      <li>• Search and filter capabilities</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Vector tiles for fast rendering</li>
                      <li>• Efficient clustering for large datasets</li>
                      <li>• Responsive design for all devices</li>
                      <li>• Optimized for mobile performance</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
