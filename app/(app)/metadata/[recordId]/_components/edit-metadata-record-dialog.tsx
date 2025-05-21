"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { SelectMetadataRecord } from "@/db/schema"
import {
  metadataRecordFormSchema,
  MetadataRecordFormValues
} from "@/lib/validators/metadata-record-validator"
import { updateMetadataRecordAction } from "@/actions/db/metadata-records-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DATASET_TYPES,
  FRAMEWORK_TYPES,
  STATUS_OPTIONS,
  UPDATE_FREQUENCIES,
  ACCESS_METHODS,
  LICENSE_TYPES
} from "@/lib/constants"

interface EditMetadataRecordDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  record: SelectMetadataRecord
  onSuccess?: () => void
}

export default function EditMetadataRecordDialog({
  isOpen,
  onOpenChange,
  record,
  onSuccess
}: EditMetadataRecordDialogProps) {
  const router = useRouter()
  const form = useForm<MetadataRecordFormValues>({
    resolver: zodResolver(metadataRecordFormSchema),
    defaultValues: {}
  })

  useEffect(() => {
    if (record && isOpen) {
      const defaultVals: Partial<MetadataRecordFormValues> = {
        title: record.title,
        abstract: record.abstract,
        purpose: record.purpose,
        datasetType: record.datasetType,
        keywords: record.keywords || [],
        thumbnailUrl: record.thumbnailUrl,
        imageName: record.imageName,
        westBoundLongitude: record.westBoundLongitude?.toString(),
        eastBoundLongitude: record.eastBoundLongitude?.toString(),
        southBoundLatitude: record.southBoundLatitude?.toString(),
        northBoundLatitude: record.northBoundLatitude?.toString(),
        coordinateSystem: record.coordinateSystem,
        projectionName: record.projectionName,
        spatialResolution: record.spatialResolution || undefined,
        productionDate: record.productionDate
          ? new Date(record.productionDate).toISOString().split("T")[0]
          : undefined,
        dateFrom: record.dateFrom
          ? new Date(record.dateFrom).toISOString().split("T")[0]
          : undefined,
        dateTo: record.dateTo
          ? new Date(record.dateTo).toISOString().split("T")[0]
          : undefined,
        updateFrequency: record.updateFrequency,
        distributionFormatName: record.distributionFormatName,
        distributionFormatVersion:
          record.distributionFormatVersion || undefined,
        accessMethod: record.accessMethod,
        downloadUrl: record.downloadUrl || undefined,
        apiUrl: record.apiUrl || undefined,
        licenseType: record.licenseType,
        usageTerms: record.usageTerms,
        fileFormat: record.fileFormat
      }
      form.reset(defaultVals as MetadataRecordFormValues)
    }
  }, [record, form, isOpen])

  async function onSubmit(values: MetadataRecordFormValues) {
    const promise = updateMetadataRecordAction(record.id, values)

    toast.promise(promise, {
      loading: "Updating metadata record...",
      success: result => {
        if (result.isSuccess) {
          onOpenChange(false)
          if (onSuccess) onSuccess()
          router.refresh()
          return "Metadata record updated successfully!"
        } else {
          throw new Error(result.message)
        }
      },
      error: err => err.message || "Failed to update metadata record."
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Metadata Record</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 p-4"
            >
              {/* Basic Information */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Abstract</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
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
                    <FormLabel>Purpose</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
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
                    <FormLabel>Dataset Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a dataset type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DATASET_TYPES.map((type: string) => (
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
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Image Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Keywords -  Handled as a simple comma separated string for now, or use a tag input component */}
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords (comma-separated)</FormLabel>
                    <FormControl>
                      {/* Assuming keywords is string[] in form schema, join/split for input */}
                      <Input
                        {...field}
                        value={
                          Array.isArray(field.value)
                            ? field.value.join(", ")
                            : ""
                        }
                        onChange={e =>
                          field.onChange(
                            e.target.value.split(",").map(k => k.trim())
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Spatial Information */}
              <h3 className="text-lg font-medium pt-4">Spatial Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="westBoundLongitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>West Bound Longitude</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
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
                        <Input type="number" {...field} />
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
                        <Input type="number" {...field} />
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
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="coordinateSystem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coordinate System</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Projection Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="spatialResolution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spatial Resolution</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Temporal Information */}
              <h3 className="text-lg font-medium pt-4">Temporal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <FormField
                control={form.control}
                name="updateFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Update Frequency</FormLabel>
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
                        {UPDATE_FREQUENCIES.map((freq: string) => (
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

              {/* Distribution Information */}
              <h3 className="text-lg font-medium pt-4">
                Distribution Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="distributionFormatName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distribution Format Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
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
                        {ACCESS_METHODS.map((method: string) => (
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
              <FormField
                control={form.control}
                name="downloadUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Download URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licenseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select license type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LICENSE_TYPES.map((type: string) => (
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
                name="usageTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Terms</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fileFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Format</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Updating..."
                    : "Update Record"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
