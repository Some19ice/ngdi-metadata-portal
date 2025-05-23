"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { createMetadataRecordAction } from "@/actions/db/metadata-records-actions"
import {
  metadataRecordFormSchema,
  type MetadataRecordFormValues
} from "@/lib/validators/metadata-record-validator"
import { SelectOrganization } from "@/db/schema"

interface CreateMetadataFormClientProps {
  organizations: SelectOrganization[]
  currentUserOrganizationId?: string
}

export default function CreateMetadataFormClient({
  organizations,
  currentUserOrganizationId
}: CreateMetadataFormClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<MetadataRecordFormValues>({
    resolver: zodResolver(metadataRecordFormSchema),
    defaultValues: {
      title: "",
      abstract: "",
      purpose: "",
      datasetType: "",
      keywords: [],
      thumbnailUrl: "",
      imageName: "",
      westBoundLongitude: "",
      eastBoundLongitude: "",
      southBoundLatitude: "",
      northBoundLatitude: "",
      coordinateSystem: "",
      projectionName: "",
      spatialResolution: "",
      productionDate: "",
      dateFrom: "",
      dateTo: "",
      updateFrequency: "",
      distributionFormatName: "",
      distributionFormatVersion: "",
      accessMethod: "",
      downloadUrl: "",
      apiUrl: "",
      licenseType: "",
      usageTerms: "",
      fileFormat: ""
    }
  })

  const onSubmit = (values: MetadataRecordFormValues) => {
    startTransition(async () => {
      try {
        // Transform form values to match the database schema
        const transformedData = {
          title: values.title,
          abstract: values.abstract,
          purpose: values.purpose || null,
          dataType: values.datasetType as
            | "Raster"
            | "Vector"
            | "Table"
            | "Service"
            | "Application"
            | "Document"
            | "Collection"
            | "Other",
          keywords: values.keywords || null,
          thumbnailUrl: values.thumbnailUrl || null,
          imageName: values.imageName || null,
          organizationId: currentUserOrganizationId || null,

          // Transform spatial data into spatialInfo JSONB
          spatialInfo: {
            coordinateSystem: values.coordinateSystem || null,
            projection: values.projectionName || null,
            resolutionScale: values.spatialResolution || null,
            boundingBox: {
              westBoundingCoordinate: values.westBoundLongitude
                ? parseFloat(values.westBoundLongitude)
                : null,
              eastBoundingCoordinate: values.eastBoundLongitude
                ? parseFloat(values.eastBoundLongitude)
                : null,
              southBoundingCoordinate: values.southBoundLatitude
                ? parseFloat(values.southBoundLatitude)
                : null,
              northBoundingCoordinate: values.northBoundLatitude
                ? parseFloat(values.northBoundLatitude)
                : null
            },
            datum: null,
            geometricObjectType: null,
            numFeaturesOrLayers: null,
            format: null,
            distributionFormat: null,
            spatialRepresentationType: null,
            vectorSpatialRepresentation: null,
            rasterSpatialRepresentation: null,
            verticalExtent: null
          },

          // Transform temporal data into temporalInfo JSONB
          temporalInfo: {
            dateFrom: values.dateFrom || null,
            dateTo: values.dateTo || null
          },

          // Transform distribution data into distributionInfo JSONB
          distributionInfo: {
            distributionFormat: values.distributionFormatName || null,
            accessMethod: values.accessMethod || null,
            downloadUrl: values.downloadUrl || null,
            apiEndpoint: values.apiUrl || null,
            licenseInfo: {
              licenseType: values.licenseType || null,
              usageTerms: values.usageTerms || null,
              attributionRequirements: null,
              accessRestrictions: null
            },
            distributionContact: null
          },

          // Set production date
          productionDate: values.productionDate || null,

          // Set update frequency
          updateFrequency: values.updateFrequency || null,

          // Set file format
          fileFormat: values.fileFormat || null,

          // Initialize other required JSONB fields with proper null values
          locationInfo: {
            country: null,
            geopoliticalZone: null,
            state: null,
            lga: null,
            townCity: null
          },
          technicalDetailsInfo: {
            fileFormat: null,
            fileSizeMB: null,
            numFeaturesOrLayers: null,
            softwareHardwareRequirements: null
          },
          constraintsInfo: {
            accessConstraints: null,
            useConstraints: null,
            otherConstraints: null
          },
          dataQualityInfo: {
            logicalConsistencyReport: null,
            completenessReport: null,
            attributeAccuracyReport: null,
            horizontalAccuracy: null,
            verticalAccuracy: null
          },
          processingInfo: {
            processingStepsDescription: null,
            softwareAndVersionUsed: null,
            processedDate: null,
            processorContact: null,
            sourceInfo: null
          },
          metadataReferenceInfo: {
            metadataCreationDate: null,
            metadataReviewDate: null,
            metadataPoc: null
          },
          fundamentalDatasetsInfo: {
            geodeticData: null,
            topographicData: null,
            cadastralData: null,
            administrativeBoundaries: null,
            hydrographicData: null,
            landUseLandCover: null,
            geologicalData: null,
            demographicData: null,
            digitalImagery: null,
            transportationData: null,
            others: null,
            othersSpecify: null
          },
          additionalInfo: null
        }

        const result = await createMetadataRecordAction(transformedData)

        if (result.isSuccess) {
          toast.success(result.message)
          router.push(`/metadata/${result.data.id}`)
        } else {
          toast.error(result.message)
        }
      } catch (error) {
        console.error("Error creating metadata record:", error)
        toast.error("An unexpected error occurred")
      }
    })
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create Metadata Record</h1>
          <p className="text-muted-foreground mt-2">
            Fill out the form below to create a new metadata record.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter metadata title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="abstract"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Abstract *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a brief description of the dataset"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the purpose of this dataset"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="datasetType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dataset Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select dataset type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Raster">Raster</SelectItem>
                          <SelectItem value="Vector">Vector</SelectItem>
                          <SelectItem value="Table">Table</SelectItem>
                          <SelectItem value="Service">Service</SelectItem>
                          <SelectItem value="Application">
                            Application
                          </SelectItem>
                          <SelectItem value="Document">Document</SelectItem>
                          <SelectItem value="Collection">Collection</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Spatial Information */}
            <Card>
              <CardHeader>
                <CardTitle>Spatial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="westBoundLongitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>West Bound Longitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="-180 to 180"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eastBoundLongitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>East Bound Longitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="-180 to 180"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="southBoundLatitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>South Bound Latitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="-90 to 90"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="northBoundLatitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>North Bound Latitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="-90 to 90"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="coordinateSystem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coordinate System</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., WGS84" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projection</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., UTM Zone 32N" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="spatialResolution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spatial Resolution</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 30m" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Temporal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Temporal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="productionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Production Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="updateFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Update Frequency</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Monthly, Annually"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date From</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date To</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Distribution Information */}
            <Card>
              <CardHeader>
                <CardTitle>Distribution Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fileFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File Format</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., GeoTIFF, Shapefile"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accessMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Method</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select access method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Download">Download</SelectItem>
                            <SelectItem value="API">API</SelectItem>
                            <SelectItem value="Web Service">
                              Web Service
                            </SelectItem>
                            <SelectItem value="Physical Media">
                              Physical Media
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="downloadUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Download URL</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://example.com/download"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apiUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API URL</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://api.example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="licenseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Type</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Creative Commons, Public Domain"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="usageTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usage Terms</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Terms and conditions for usage"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Separator />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Metadata Record"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
