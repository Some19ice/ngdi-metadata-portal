"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Database, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { detectGISServiceType } from "@/lib/gis-services/service-factory"

// Dynamically import map components with SSR disabled
const EnhancedMetadataMapDisplay = dynamic(
  () => import("@/components/ui/map/enhanced-metadata-map-display"),
  { ssr: false }
)

export default function GISServicesDemo() {
  const [activeTab, setActiveTab] = useState("map-view")
  const [serviceUrl, setServiceUrl] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    serviceType?: string
    serviceName?: string
    serviceDescription?: string
    error?: string
  } | null>(null)

  const handleValidateService = async () => {
    if (!serviceUrl) {
      toast.error("Please enter a service URL")
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const result = await detectGISServiceType(serviceUrl)

      setValidationResult({
        isValid: result.isValid,
        serviceType: result.serviceType,
        serviceName: result.service?.name,
        serviceDescription:
          "description" in (result.service || {})
            ? (result.service as any).description
            : "abstract" in (result.service || {})
              ? (result.service as any).abstract
              : undefined,
        error: result.error
      })

      if (result.isValid && result.service) {
        toast.success(
          `Valid ${result.serviceType} service detected: ${result.service.name}`
        )
      } else {
        toast.error(`Invalid service: ${result.error}`)
      }
    } catch (error) {
      console.error("Error validating service:", error)
      setValidationResult({
        isValid: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
      toast.error(
        `Error validating service: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          GIS Services Integration
        </h1>
        <p className="text-muted-foreground">
          Explore and integrate external GIS services with the NGDI Metadata
          Portal
        </p>
      </div>

      <Tabs
        defaultValue="map-view"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="map-view">Map View</TabsTrigger>
          <TabsTrigger value="service-validator">Service Validator</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="map-view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Map with GIS Services</CardTitle>
              <CardDescription>
                Use the GIS Services panel in the top-right corner to add
                external services to the map
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <EnhancedMetadataMapDisplay
                  records={[]}
                  showGISServicePanel={true}
                  className="h-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service-validator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GIS Service Validator</CardTitle>
              <CardDescription>
                Validate GIS service endpoints before adding them to your
                metadata records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a GIS service URL (ArcGIS, WMS, WFS, etc.)"
                  value={serviceUrl}
                  onChange={e => setServiceUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleValidateService}
                  disabled={isValidating || !serviceUrl}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    "Validate"
                  )}
                </Button>
              </div>

              {validationResult && (
                <Card>
                  <CardContent className="pt-6">
                    {validationResult.isValid ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                          <h3 className="font-medium">Valid Service</h3>
                        </div>

                        <div className="grid gap-2">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="font-medium">Service Type</div>
                            <div className="col-span-2">
                              {validationResult.serviceType}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="font-medium">Service Name</div>
                            <div className="col-span-2">
                              {validationResult.serviceName}
                            </div>
                          </div>

                          {validationResult.serviceDescription && (
                            <div className="grid grid-cols-3 gap-4">
                              <div className="font-medium">Description</div>
                              <div className="col-span-2">
                                {validationResult.serviceDescription}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-4">
                            <div className="font-medium">URL</div>
                            <div className="col-span-2 break-all">
                              <a
                                href={serviceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline flex items-center"
                              >
                                {serviceUrl}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-red-500"></div>
                          <h3 className="font-medium">Invalid Service</h3>
                        </div>

                        <div className="text-red-500">
                          {validationResult.error}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GIS Services Documentation</CardTitle>
              <CardDescription>
                Learn how to integrate external GIS services with the NGDI
                Metadata Portal
              </CardDescription>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h3>Supported Service Types</h3>
              <ul>
                <li>
                  <strong>ArcGIS Services</strong> - MapServer, FeatureServer,
                  ImageServer
                </li>
                <li>
                  <strong>OGC Services</strong> - WMS, WFS
                </li>
              </ul>

              <h3>Adding Services to Metadata Records</h3>
              <p>
                When creating or editing a metadata record, use the GIS Services
                section to validate and add service endpoints. This will
                automatically populate the appropriate fields in the
                distribution information section.
              </p>

              <h3>Example Service URLs</h3>
              <ul>
                <li>
                  ArcGIS MapServer:{" "}
                  <code>
                    https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/MapServer
                  </code>
                </li>
                <li>
                  WMS:{" "}
                  <code>
                    https://ows.terrestris.de/osm/service?SERVICE=WMS&REQUEST=GetCapabilities
                  </code>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
