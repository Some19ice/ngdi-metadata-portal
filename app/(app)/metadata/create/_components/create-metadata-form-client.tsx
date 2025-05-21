"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  metadataRecordFormSchema,
  MetadataRecordFormValues
} from "@/lib/validators/metadata-validator"
import { SelectOrganization, datasetTypeEnum } from "@/db/schema"
import { createMetadataRecordAction } from "@/actions/db/metadata-records-actions"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface CreateMetadataFormClientProps {
  availableOrganizations: SelectOrganization[]
  // metadataStandards?: SelectMetadataStandard[]; // For later use
}

export default function CreateMetadataFormClient({
  availableOrganizations
}: CreateMetadataFormClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [apiError, setApiError] = useState<string | null>(null)

  const form = useForm<MetadataRecordFormValues>({
    resolver: zodResolver(metadataRecordFormSchema),
    defaultValues: {
      title: "",
      abstract: "",
      purpose: "",
      keywords: [],
      author: "",
      frameworkType: "",
      thumbnailUrl: "",
      imageName: "",
      southBoundLatitude: "",
      northBoundLatitude: "",
      westBoundLongitude: "",
      eastBoundLongitude: "",
      coordinateSystem: "WGS84", // Default common value
      projectionName: "Geographic", // Default common value
      updateFrequency: "As needed", // Default common value
      distributionFormatName: "",
      accessMethod: "Download", // Default common value
      licenseType: "",
      usageTerms: "",
      fileFormat: "",
      // Ensure all fields in Zod schema have a default here if not optional or handled by `default` in Zod
      organizationId:
        availableOrganizations.length > 0 ? availableOrganizations[0].id : "",
      datasetType: undefined, // Let placeholder show
      spatialResolution: undefined,
      productionDate: null,
      dateFrom: null,
      dateTo: null,
      distributionFormatVersion: undefined,
      downloadUrl: "",
      apiUrl: "",
      metadataStandardId: null
    }
  })

  async function onSubmit(values: MetadataRecordFormValues) {
    startTransition(async () => {
      setApiError(null)
      const result = await createMetadataRecordAction({
        ...values,
        // Convert date strings to Date objects or ensure they are ISO strings if action expects that.
        // The current DB schema uses timestamp, Drizzle might handle ISO strings.
        // Zod schema has dates as string().nullable(), so they are strings or null here.
        // The action input type `InsertMetadataRecord` expects `Date | null` for these.
        // Let's assume the action or DB can handle ISO strings for now if not null.
        // For fields that are optional and can be empty strings from form but should be null for DB:
        productionDate: values.productionDate || null,
        dateFrom: values.dateFrom || null,
        dateTo: values.dateTo || null,
        downloadUrl: values.downloadUrl || undefined, // Action expects string | undefined
        apiUrl: values.apiUrl || undefined,
        metadataStandardId: values.metadataStandardId || null,
        keywords: values.keywords || []
      })

      if (result.isSuccess) {
        toast.success(result.message)
        router.push("/metadata") // Redirect to list page
        // Potentially redirect to view/edit page: router.push(`/metadata/${result.data.id}`);
      } else {
        toast.error(result.message)
        setApiError(result.message)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Identification and General Information */}
        <section className="space-y-4 p-6 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold tracking-tight border-b pb-2">
            Identification & General Info
          </h2>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title / Name of the data *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter dataset title" {...field} />
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
                <FormLabel>Abstract / Description *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief summary of the dataset"
                    {...field}
                    rows={4}
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
                    placeholder="Reason or intended use for the dataset"
                    {...field}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid md:grid-cols-2 gap-6">
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
                      {datasetTypeEnum.enumValues.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={
                      availableOrganizations.length <= 1 &&
                      availableOrganizations.length > 0
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an organization" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableOrganizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                      {availableOrganizations.length === 0 && (
                        <SelectItem value="" disabled>
                          No organizations available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The primary organization associated with this metadata.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author *</FormLabel>
                <FormControl>
                  <Input placeholder="Author of the dataset" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="frameworkType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Framework Type *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Fundamental, Thematic" {...field} />
                </FormControl>
                <FormDescription>
                  Type of framework the data belongs to.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail URL *</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/image.png"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="image.png" {...field} />
                  </FormControl>
                  <FormDescription>
                    Filename of the image associated with the dataset.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="keywords"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keywords</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter keywords, comma-separated"
                    {...field}
                    onChange={e =>
                      field.onChange(
                        e.target.value
                          .split(",")
                          .map(k => k.trim())
                          .filter(k => k)
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  Searchable terms or classification of dataset content.
                  Comma-separated.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="metadataStandardId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Metadata Standard ID (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter UUID of metadata standard if applicable"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  If this record conforms to a specific registered standard.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Separator />

        {/* Section 2: Spatial Information */}
        <section className="space-y-4 p-6 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold tracking-tight border-b pb-2">
            Spatial Information
          </h2>
          <p className="text-sm text-muted-foreground pb-2">
            Define the geographic extent and reference system for the dataset.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormField
              control={form.control}
              name="westBoundLongitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>West Longitude *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., -180.0" {...field} />
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
                  <FormLabel>East Longitude *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 180.0" {...field} />
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
                  <FormLabel>South Latitude *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., -90.0" {...field} />
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
                  <FormLabel>North Latitude *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 90.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="coordinateSystem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordinate System *</FormLabel>
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
                  <FormLabel>Projection Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Geographic, UTM Zone 10N"
                      {...field}
                    />
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
                  <Input
                    placeholder="e.g., 30m, 1km"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  The resolution of the spatial data, if applicable.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Separator />

        {/* Section 3: Temporal Information */}
        <section className="space-y-4 p-6 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold tracking-tight border-b pb-2">
            Temporal Information
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="productionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Production Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>
                    Date of production or primary dataset validity.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date From</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>Start of temporal extent.</FormDescription>
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
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>End of temporal extent.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="updateFrequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Update Frequency *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select update frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[
                      "As needed",
                      "Daily",
                      "Weekly",
                      "Monthly",
                      "Quarterly",
                      "Annually",
                      "Irregular",
                      "Not planned",
                      "Unknown"
                    ].map(freq => (
                      <SelectItem key={freq} value={freq}>
                        {freq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Separator />

        {/* Section 4: Distribution Information */}
        <section className="space-y-4 p-6 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold tracking-tight border-b pb-2">
            Distribution Information
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="distributionFormatName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Distribution Format Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., GeoJSON, Shapefile, CSV"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="distributionFormatVersion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Distribution Format Version</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 1.0"
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
            name="accessMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Access Method *</FormLabel>
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
                    {[
                      "Download",
                      "API",
                      "Service Endpoint",
                      "Physical Media",
                      "Other"
                    ].map(method => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="downloadUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Download URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/data.zip"
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
              name="apiUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://api.example.com/data"
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
            name="fileFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File Format *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., GeoTIFF, CSV, SHP" {...field} />
                </FormControl>
                <FormDescription>
                  Specific file format of the data.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="licenseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Type *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Creative Commons BY 4.0, Open Data Commons ODbL"
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
                  <FormLabel>Usage Terms *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Terms and conditions for using the data"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {apiError && (
          <p className="text-sm font-medium text-destructive">{apiError}</p>
        )}

        <Button type="submit" disabled={isPending} className="w-full md:w-auto">
          {isPending ? "Creating Record..." : "Create Metadata Record"}
        </Button>
      </form>
    </Form>
  )
}
