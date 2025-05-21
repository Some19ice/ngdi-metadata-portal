"use client"

import { useState, useMemo, useEffect } from "react"
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
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  InfoIcon,
  MapIcon,
  Layers,
  Map as MapIcon2,
  Globe,
  Mountain,
  Database
} from "lucide-react"
import { validateMapTilerApiKey, MAPTILER_STYLES } from "@/lib/map-config"

// Sample metadata records with spatial information
const sampleRecords: MetadataRecord[] = [
  {
    id: "1",
    title: "Nigeria Population Census Data",
    northBoundLatitude: "13.8856",
    southBoundLatitude: "4.2723",
    eastBoundLongitude: "14.6801",
    westBoundLongitude: "2.6684",
    description:
      "Comprehensive population census data for Nigeria from the latest census."
  },
  {
    id: "2",
    title: "Lagos State Land Use Survey",
    northBoundLatitude: "6.7027",
    southBoundLatitude: "6.3936",
    eastBoundLongitude: "3.4218",
    westBoundLongitude: "3.0589",
    description:
      "Detailed land use survey data for Lagos State, including urban and rural areas."
  },
  {
    id: "3",
    title: "Abuja Federal Capital Territory Mapping",
    northBoundLatitude: "9.2456",
    southBoundLatitude: "8.4003",
    eastBoundLongitude: "7.5400",
    westBoundLongitude: "6.7400",
    description:
      "Comprehensive mapping data for the Federal Capital Territory of Abuja."
  },
  {
    id: "4",
    title: "Niger Delta Environmental Survey",
    northBoundLatitude: "6.4698",
    southBoundLatitude: "4.1684",
    eastBoundLongitude: "8.8968",
    westBoundLongitude: "4.3169",
    description:
      "Environmental survey data for the Niger Delta region, including pollution monitoring."
  },
  {
    id: "5",
    title: "Kano Agricultural Land Use",
    northBoundLatitude: "12.6762",
    southBoundLatitude: "10.3156",
    eastBoundLongitude: "9.3333",
    westBoundLongitude: "7.5975",
    description:
      "Agricultural land use data for Kano State, including crop types and irrigation."
  }
]

export default function MetadataMapDemoPage() {
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
              <Alert className="mb-4">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Metadata Visualization</AlertTitle>
                <AlertDescription>
                  This tab demonstrates how metadata records with spatial
                  information can be visualized on a map. The data shown is
                  sample data for demonstration purposes. Try different base map
                  styles using the layer controls on the top-left of the map.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <div className="h-[600px] w-full">
                    <MetadataMapDisplay
                      records={sampleRecords}
                      className="h-full w-full"
                      onRecordClick={handleRecordClick}
                      showBoundingBoxes={true}
                    />
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
                            <ul className="space-y-1 mt-2 list-disc list-inside text-sm">
                              <li>
                                <span className="font-medium">North:</span>{" "}
                                {selectedRecord.northBoundLatitude}°
                              </li>
                              <li>
                                <span className="font-medium">South:</span>{" "}
                                {selectedRecord.southBoundLatitude}°
                              </li>
                              <li>
                                <span className="font-medium">East:</span>{" "}
                                {selectedRecord.eastBoundLongitude}°
                              </li>
                              <li>
                                <span className="font-medium">West:</span>{" "}
                                {selectedRecord.westBoundLongitude}°
                              </li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-40 text-gray-400">
                          No record selected
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">
                  Available Metadata Records
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sampleRecords.map(record => (
                    <Card
                      key={record.id}
                      className={`cursor-pointer transition-colors ${
                        selectedRecord?.id === record.id
                          ? "border-primary"
                          : "hover:border-gray-300"
                      }`}
                      onClick={() => handleRecordClick(record)}
                    >
                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-base">
                          {record.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-500">
                          {record.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="map-styles" className="mt-0">
              <Alert className="mb-4">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>MapTiler Styles</AlertTitle>
                <AlertDescription>
                  MapTiler provides a variety of beautiful map styles for
                  different use cases. This tab showcases the available styles
                  and their features.
                </AlertDescription>
              </Alert>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableMapTilerStyles.map(style => (
                    <div key={style.id} className="space-y-3">
                      <StylePreview
                        styleId={style.id}
                        styleName={style.name}
                        styleUrl={style.url}
                        isAvailable={style.isAvailable}
                        className="h-48"
                        center={[8.6775, 9.0778]} // Nigeria
                        zoom={5}
                      />
                      <div className="px-1">
                        <h3 className="text-base font-medium">{style.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">
                          Style ID: {style.id}
                        </p>
                        <p className="text-sm text-gray-600">
                          {style.id === "streets" &&
                            "Default free style with basic street mapping. Available without an API key."}
                          {style.id === "satellite" &&
                            "Satellite imagery with labels for a detailed aerial view. Perfect for visualizing real-world features."}
                          {style.id === "terrain" &&
                            "Topographic style showing elevation and terrain features. Ideal for geographic analysis."}
                          {style.id === "basic" &&
                            "Clean, minimalist style for simple map displays. Great for data visualization overlays."}
                          {style.id === "streets-v2" &&
                            "Modern street maps with improved styling and readability. Excellent for urban navigation."}
                          {style.id === "outdoor-v2" &&
                            "Designed for outdoor activities with trails and natural features. Perfect for recreation maps."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Map Style Comparison
                    </CardTitle>
                    <CardDescription>
                      Choose the right map style for your application
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        MapTiler offers a variety of map styles to suit
                        different needs. Here's a quick comparison:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="border rounded-md p-4">
                          <h4 className="font-medium mb-2">Vector Styles</h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Streets, Basic, Outdoor</li>
                            <li>Smaller file sizes, faster loading</li>
                            <li>Crisp rendering at all zoom levels</li>
                            <li>Customizable styling</li>
                            <li>Better for interactive applications</li>
                          </ul>
                        </div>

                        <div className="border rounded-md p-4">
                          <h4 className="font-medium mb-2">Raster Styles</h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Satellite, Terrain</li>
                            <li>Photorealistic imagery</li>
                            <li>Detailed terrain visualization</li>
                            <li>Less customizable</li>
                            <li>Better for visual reference</li>
                          </ul>
                        </div>
                      </div>

                      {!isApiKeyValid && (
                        <div className="bg-amber-50 p-4 rounded-md border border-amber-200 text-sm">
                          <p className="font-medium text-amber-800 mb-1">
                            Note:
                          </p>
                          <p className="text-amber-700">
                            Most MapTiler styles require an API key. The free
                            Streets style is available without an API key, but
                            for the full range of styles, please add your
                            MapTiler API key to the .env.local file.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="terrain-view" className="mt-0">
              <Alert className="mb-4">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Terrain Visualization</AlertTitle>
                <AlertDescription>
                  MapTiler provides excellent terrain visualization
                  capabilities.
                  {!isApiKeyValid &&
                    " Note: This feature requires a valid MapTiler API key to fully demonstrate."}
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="h-[500px] w-full">
                      <TerrainMapDisplay
                        className="h-full w-full"
                        initialCenter={[8.8775, 9.1778]} // Nigeria, slightly offset for better terrain view
                        initialZoom={10}
                        initialPitch={60}
                        initialBearing={30}
                      />
                    </div>
                  </div>
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle>3D Terrain Features</CardTitle>
                        <CardDescription>
                          Explore MapTiler's terrain visualization capabilities
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">
                            Elevation Data
                          </h4>
                          <p className="text-sm text-gray-600">
                            MapTiler provides high-resolution global elevation
                            data that can be used to create 3D terrain
                            visualizations.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">
                            3D Controls
                          </h4>
                          <p className="text-sm text-gray-600">
                            Use the 3D toggle button in the control panel to
                            switch between 2D and 3D views. You can also adjust
                            the pitch and bearing.
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">
                            Terrain Styles
                          </h4>
                          <p className="text-sm text-gray-600">
                            Try different terrain-optimized styles from the
                            layer control panel to see how they enhance the 3D
                            visualization.
                          </p>
                        </div>
                        {!isApiKeyValid && (
                          <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-sm text-amber-700 mt-4">
                            <p className="font-medium mb-2">API Key Required</p>
                            <p className="text-xs">
                              To fully experience the 3D terrain features,
                              please add a valid MapTiler API key to your
                              .env.local file.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      How 3D Terrain Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      MapTiler's 3D terrain visualization uses digital elevation
                      model (DEM) data combined with vector or raster map
                      styles. The MapLibre GL JS library renders this data in
                      real-time, allowing for smooth navigation and exploration
                      of the terrain. Users can adjust the pitch and bearing to
                      view the landscape from different angles, and the
                      elevation data provides a realistic representation of
                      mountains, valleys, and other topographical features.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="features" className="mt-0">
              <Alert className="mb-4">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>MapTiler Features</AlertTitle>
                <AlertDescription>
                  Explore the various features and capabilities of MapTiler when
                  integrated with MapLibre GL JS.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vector Tiles</CardTitle>
                    <CardDescription>
                      High-performance vector rendering
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      MapTiler provides vector tiles that allow for smooth
                      zooming, rotation, and styling. Vector tiles are more
                      efficient than raster tiles and enable dynamic styling
                      changes.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Custom Styling</CardTitle>
                    <CardDescription>
                      Create your own map styles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      With MapTiler, you can create custom map styles using
                      MapTiler Studio or by modifying existing styles with the
                      MapLibre GL JS API.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">3D Terrain</CardTitle>
                    <CardDescription>Visualize elevation data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      MapTiler's terrain data allows for 3D visualization of
                      landscapes, mountains, and valleys, providing a more
                      immersive mapping experience.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Global Coverage</CardTitle>
                    <CardDescription>Worldwide map data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      MapTiler provides global coverage with detailed data for
                      streets, buildings, natural features, and points of
                      interest across the entire world.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-between">
          <div className="text-sm text-gray-500">
            Powered by MapTiler and MapLibre GL JS
          </div>
          {!isApiKeyValid && (
            <Button variant="outline" size="sm" className="text-xs">
              <a
                href="https://www.maptiler.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get MapTiler API Key
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
