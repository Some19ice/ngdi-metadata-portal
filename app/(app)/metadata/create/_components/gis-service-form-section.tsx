"use client"

import { useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { MetadataFormValues } from "@/lib/validators/metadata-validator"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, AlertCircle, Check } from "lucide-react"
import { toast } from "sonner"
import { detectGISServiceType } from "@/lib/gis-services/service-factory"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface GISServiceFormSectionProps {
  form: UseFormReturn<MetadataFormValues>
}

export function GISServiceFormSection({ form }: GISServiceFormSectionProps) {
  const [serviceUrl, setServiceUrl] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    serviceType?: string
    serviceName?: string
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
        error: result.error
      })

      if (result.isValid && result.service) {
        // Update form fields with service information
        form.setValue("distributionInfo.apiEndpoint", serviceUrl)
        form.setValue("distributionInfo.accessMethod", "Service Endpoint")

        // Set distribution format based on service type
        if (result.serviceType) {
          form.setValue(
            "distributionInfo.distributionFormat",
            result.serviceType
          )
        }

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
    <div className="space-y-6">
      <h3 className="text-lg font-medium">GIS Service Information</h3>
      <p className="text-sm text-gray-500">
        If this metadata record describes a GIS service (like ArcGIS, WMS, or
        WFS), you can validate and add the service details here.
      </p>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-md">Service Validation</CardTitle>
          <CardDescription>
            Enter a GIS service URL to validate and automatically fill service
            details
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="https://services.arcgis.com/... or WMS/WFS endpoint"
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
            <div className="mt-4 p-3 rounded-md bg-gray-50">
              {validationResult.isValid ? (
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Valid Service Detected</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {validationResult.serviceType && (
                        <Badge variant="outline">
                          {validationResult.serviceType}
                        </Badge>
                      )}
                      {validationResult.serviceName && (
                        <p className="text-sm">
                          {validationResult.serviceName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Invalid Service</p>
                    {validationResult.error && (
                      <p className="text-sm text-red-500">
                        {validationResult.error}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="distributionInfo.accessMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Access Method *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select access method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Download">Download</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                  <SelectItem value="Service Endpoint">
                    Service Endpoint
                  </SelectItem>
                  <SelectItem value="OGC WMS">OGC WMS</SelectItem>
                  <SelectItem value="OGC WFS">OGC WFS</SelectItem>
                  <SelectItem value="ArcGIS REST">ArcGIS REST</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="distributionInfo.distributionFormat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Distribution Format</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., ArcGIS MapServer, WMS 1.3.0, GeoJSON"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="distributionInfo.downloadUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Download URL</FormLabel>
            <FormControl>
              <Input
                type="url"
                placeholder="Direct download link for the dataset"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="distributionInfo.apiEndpoint"
        render={({ field }) => (
          <FormItem>
            <FormLabel>API/Service Endpoint</FormLabel>
            <FormControl>
              <Input
                type="url"
                placeholder="API or service endpoint URL"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
