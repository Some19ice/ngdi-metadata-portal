"use client"

import { useState } from "react"
import {
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import {
  Calendar as CalendarIcon,
  X,
  CheckCircle,
  ExternalLink
} from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { MetadataFormValues } from "@/lib/validators/metadata-validator"
import { cn } from "@/lib/utils"
import {
  datasetTypeEnum,
  frameworkTypeEnum,
  metadataTopicCategoryEnum
} from "@/db/schema/metadata-records-schema"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Lightbulb } from "lucide-react"

// Section 1: General Information (Renamed from IdentificationSection)
export function GeneralInformationSection({
  form
}: {
  form: UseFormReturn<MetadataFormValues>
}) {
  // State for smart suggestions
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({})

  // Generate smart suggestions
  const handleFieldFocus = (fieldName: string, value: string) => {
    const dataType = form.getValues("dataType")
    const smartSuggestions = getSmartSuggestions(fieldName, value, dataType)
    setSuggestions(prev => ({
      ...prev,
      [fieldName]: smartSuggestions
    }))
  }

  const applySuggestion = (fieldName: string, suggestion: string) => {
    if (fieldName === "keywords") {
      const currentKeywords = form.getValues("keywords") || []
      form.setValue("keywords", [...currentKeywords, suggestion], {
        shouldValidate: true
      })
    } else {
      form.setValue(fieldName as any, suggestion)
    }
    setSuggestions(prev => ({
      ...prev,
      [fieldName]: []
    }))
  }

  // Smart suggestions based on field content
  const getSmartSuggestions = (
    fieldName: string,
    value: string,
    dataType?: string
  ) => {
    const suggestions: string[] = []

    if (fieldName === "keywords" && value.length > 2) {
      const commonKeywords = [
        "geospatial",
        "GIS",
        "mapping",
        "spatial analysis",
        "remote sensing",
        "urban planning",
        "environmental",
        "transportation",
        "infrastructure",
        "demographics",
        "land use",
        "topography",
        "climate",
        "hydrology"
      ]

      suggestions.push(
        ...commonKeywords.filter(
          k =>
            k.toLowerCase().includes(value.toLowerCase()) &&
            !suggestions.includes(k)
        )
      )
    }

    if (fieldName === "coordinateSystem") {
      const systems = [
        "WGS84",
        "UTM Zone 31N",
        "NAD83",
        "EPSG:4326",
        "EPSG:3857"
      ]
      suggestions.push(
        ...systems.filter(s => s.toLowerCase().includes(value.toLowerCase()))
      )
    }

    if (fieldName === "fileFormat" && dataType) {
      const formatsByType: Record<string, string[]> = {
        Vector: ["Shapefile", "GeoJSON", "KML", "GeoPackage", "PostGIS"],
        Raster: ["GeoTIFF", "NetCDF", "JPEG2000", "PNG", "HDF5"],
        Table: ["CSV", "Excel", "JSON", "Parquet", "SQLite"],
        "Point Cloud": ["LAS", "LAZ", "PLY", "XYZ", "E57"]
      }

      suggestions.push(...(formatsByType[dataType] || []))
    }

    return suggestions.slice(0, 5)
  }

  // Suggestion list component
  const SuggestionList = ({ fieldName }: { fieldName: string }) => {
    const fieldSuggestions = suggestions[fieldName] || []

    if (fieldSuggestions.length === 0) return null

    return (
      <div className="mt-2 p-2 border rounded-md bg-muted/50">
        <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <Lightbulb className="h-3 w-3" />
          Suggestions:
        </div>
        <div className="flex flex-wrap gap-1">
          {fieldSuggestions.map((suggestion, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => applySuggestion(fieldName, suggestion)}
            >
              {suggestion}
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  // Helper for keywords, can be expanded later
  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim() !== "") {
      e.preventDefault()
      const currentKeywords = form.getValues("keywords") || []
      form.setValue(
        "keywords",
        [...currentKeywords, e.currentTarget.value.trim()],
        {
          shouldValidate: true
        }
      )
      e.currentTarget.value = "" // Clear input
    }
  }

  const handleRemoveKeyword = (keywordToRemove: string) => {
    const currentKeywords = form.getValues("keywords") || []
    form.setValue(
      "keywords",
      currentKeywords.filter((keyword: string) => keyword !== keywordToRemove),
      { shouldValidate: true }
    )
  }

  return (
    <div className="space-y-6">
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
                value={field.value ?? ""}
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
            <FormLabel>Purpose</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Reason or intended use for the dataset"
                {...field}
                value={field.value ?? ""}
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
          name="dataType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dataset Type *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value ?? undefined}
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
          name="topicCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic Category *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value ?? undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {metadataTopicCategoryEnum.enumValues.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="version"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Version</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., 1.0, 2023a"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., en, fr"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="updateFrequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Update Frequency</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Annually, As needed, Irregular"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assessment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assessment / Status of Data</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Complete, Incomplete, Ongoing"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
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
                placeholder="Type keyword and press Enter"
                onKeyDown={handleAddKeyword}
                onFocus={e => handleFieldFocus("keywords", e.target.value)}
                onChange={e => handleFieldFocus("keywords", e.target.value)}
              />
            </FormControl>
            <div className="mt-2 flex flex-wrap gap-2">
              {(form.getValues("keywords") || []).map((keyword: string) => (
                <div
                  key={keyword}
                  className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                >
                  {keyword}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveKeyword(keyword)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <SuggestionList fieldName="keywords" />
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
              <FormLabel>Thumbnail URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/image.png"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cloudCoverPercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cloud Cover Percentage (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g., 15"
                  {...field}
                  value={field.value ?? ""}
                  onChange={e =>
                    field.onChange(
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="frameworkType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Framework Type</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value ?? undefined}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select framework type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {frameworkTypeEnum.enumValues.map(type => (
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
    </div>
  )
}

// Section: Location Information (New Section)
export function LocationInformationSection({
  form
}: {
  form: UseFormReturn<MetadataFormValues>
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-3">Location Information</h3>
      <FormField
        control={form.control}
        name="locationInfo.country"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Country</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Nigeria"
                {...field}
                value={field.value ?? "Nigeria"} // Default to Nigeria as per schema defaults
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="locationInfo.geopoliticalZone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Geopolitical Zone</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., South West"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="locationInfo.state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Lagos"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="locationInfo.lga"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LGA (Local Government Area)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Ikeja"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="locationInfo.townCity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Town / City</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Ikeja"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

// Section 3: Spatial Information (Was SpatialSection)
export function SpatialInformationSection({
  form
}: {
  form: UseFormReturn<MetadataFormValues>
}) {
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({})
  const spatialRepresentationType = form.watch(
    "spatialInfo.spatialRepresentationType"
  )

  // Generate smart suggestions
  const handleFieldFocus = (fieldName: string, value: string) => {
    const dataType = form.getValues("dataType")
    const smartSuggestions = getSmartSuggestions(fieldName, value, dataType)
    setSuggestions(prev => ({
      ...prev,
      [fieldName]: smartSuggestions
    }))
  }

  const applySuggestion = (fieldName: string, suggestion: string) => {
    form.setValue(fieldName as any, suggestion)
    setSuggestions(prev => ({
      ...prev,
      [fieldName]: []
    }))
  }

  // Smart suggestions based on field content
  const getSmartSuggestions = (
    fieldName: string,
    value: string,
    dataType?: string
  ) => {
    const suggestions: string[] = []

    if (fieldName === "spatialInfo.coordinateSystem") {
      const systems = [
        "WGS84",
        "UTM Zone 31N",
        "NAD83",
        "EPSG:4326",
        "EPSG:3857"
      ]
      suggestions.push(
        ...systems.filter(s => s.toLowerCase().includes(value.toLowerCase()))
      )
    }

    return suggestions.slice(0, 5)
  }

  // Suggestion list component
  const SuggestionList = ({ fieldName }: { fieldName: string }) => {
    const fieldSuggestions = suggestions[fieldName] || []

    if (fieldSuggestions.length === 0) return null

    return (
      <div className="mt-2 p-2 border rounded-md bg-muted/50">
        <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
          <Lightbulb className="h-3 w-3" />
          Suggestions:
        </div>
        <div className="flex flex-wrap gap-1">
          {fieldSuggestions.map((suggestion, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => applySuggestion(fieldName, suggestion)}
            >
              {suggestion}
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Spatial Information</h3>

      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="spatialInfo.coordinateSystem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coordinate System</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., WGS 84, NAD 83"
                  {...field}
                  value={field.value ?? ""}
                  onFocus={e =>
                    handleFieldFocus(
                      "spatialInfo.coordinateSystem",
                      e.target.value
                    )
                  }
                  onChange={e => {
                    field.onChange(e)
                    handleFieldFocus(
                      "spatialInfo.coordinateSystem",
                      e.target.value
                    )
                  }}
                />
              </FormControl>
              <SuggestionList fieldName="spatialInfo.coordinateSystem" />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spatialInfo.projection"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Projection</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., UTM Zone 10N, Lambert Conformal Conic"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="spatialInfo.datum"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Datum</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., D_WGS_1984, D_North_American_1983"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spatialInfo.resolutionScale"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resolution Scale / Equivalent Scale</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., 1:24000 or 10 meters"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="spatialInfo.geometricObjectType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Geometric Object Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value ?? undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select geometric object type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {["Point", "Line", "Polygon", "Grid", "Complex", "Other"].map(
                    type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spatialInfo.numFeaturesOrLayers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Features or Layers</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter count"
                  {...field}
                  value={field.value ?? ""} // Input type number expects string or number
                  onChange={e =>
                    field.onChange(
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="spatialInfo.format"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Format</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., GeoTIFF, Shapefile, GeoJSON"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spatialInfo.distributionFormat" // This might be redundant with the one in distributionInfo
          render={({ field }) => (
            <FormItem>
              <FormLabel>Distribution Format (Spatial)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., COG, PMTiles, Esri FileGDB"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="spatialInfo.spatialRepresentationType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Spatial Representation Type</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value ?? undefined}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select spatial representation type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {[
                  "Vector",
                  "Raster",
                  "TextTable",
                  "TriangulatedIrregularNetwork",
                  "StereoModel",
                  "Video",
                  "Other"
                ].map(type => (
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

      {/* Conditional Vector Representation Fields */}
      {spatialRepresentationType === "Vector" && (
        <div className="p-4 border rounded-md space-y-4 mt-4">
          <h4 className="text-md font-medium">Vector Representation Details</h4>
          <FormField
            control={form.control}
            name="spatialInfo.vectorSpatialRepresentation.topologyLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Topology Level</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., GeometryOnly, TopologyComplete"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Implement UI for geometric objects array */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <FormLabel>Geometric Objects</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentObjects =
                    form.getValues(
                      "spatialInfo.vectorSpatialRepresentation.geometricObjects"
                    ) || []
                  form.setValue(
                    "spatialInfo.vectorSpatialRepresentation.geometricObjects",
                    [...currentObjects, { type: null, count: null }]
                  )
                }}
              >
                Add Object
              </Button>
            </div>

            {(
              form.watch(
                "spatialInfo.vectorSpatialRepresentation.geometricObjects"
              ) || []
            ).map((_, index) => (
              <div
                key={index}
                className="flex gap-2 items-end border p-2 rounded-md"
              >
                <FormField
                  control={form.control}
                  name={`spatialInfo.vectorSpatialRepresentation.geometricObjects.${index}.type`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            "Point",
                            "Line",
                            "Polygon",
                            "Grid",
                            "Complex",
                            "Other"
                          ].map(type => (
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
                  name={`spatialInfo.vectorSpatialRepresentation.geometricObjects.${index}.count`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Count</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Count"
                          {...field}
                          value={field.value ?? ""}
                          onChange={e =>
                            field.onChange(
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const currentObjects =
                      form.getValues(
                        "spatialInfo.vectorSpatialRepresentation.geometricObjects"
                      ) || []
                    const newObjects = [...currentObjects]
                    newObjects.splice(index, 1)
                    form.setValue(
                      "spatialInfo.vectorSpatialRepresentation.geometricObjects",
                      newObjects.length ? newObjects : null
                    )
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conditional Raster Representation Fields */}
      {spatialRepresentationType === "Raster" && (
        <div className="p-4 border rounded-md space-y-4 mt-4">
          <h4 className="text-md font-medium">Raster Representation Details</h4>

          {/* Implement UI for axis dimensions array */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <FormLabel>Axis Dimensions</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentDimensions =
                    form.getValues(
                      "spatialInfo.rasterSpatialRepresentation.axisDimensions"
                    ) || []
                  form.setValue(
                    "spatialInfo.rasterSpatialRepresentation.axisDimensions",
                    [
                      ...currentDimensions,
                      { name: null, size: null, resolution: null }
                    ]
                  )
                }}
              >
                Add Dimension
              </Button>
            </div>

            {(
              form.watch(
                "spatialInfo.rasterSpatialRepresentation.axisDimensions"
              ) || []
            ).map((_, index) => (
              <div
                key={index}
                className="flex gap-2 items-end border p-2 rounded-md"
              >
                <FormField
                  control={form.control}
                  name={`spatialInfo.rasterSpatialRepresentation.axisDimensions.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., X, Y, Z"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`spatialInfo.rasterSpatialRepresentation.axisDimensions.${index}.size`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Size</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 1024"
                          {...field}
                          value={field.value ?? ""}
                          onChange={e =>
                            field.onChange(
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`spatialInfo.rasterSpatialRepresentation.axisDimensions.${index}.resolution`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Resolution</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 10m"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const currentDimensions =
                      form.getValues(
                        "spatialInfo.rasterSpatialRepresentation.axisDimensions"
                      ) || []
                    const newDimensions = [...currentDimensions]
                    newDimensions.splice(index, 1)
                    form.setValue(
                      "spatialInfo.rasterSpatialRepresentation.axisDimensions",
                      newDimensions.length ? newDimensions : null
                    )
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <FormField
            control={form.control}
            name="spatialInfo.rasterSpatialRepresentation.cellGeometry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cell Geometry</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Pixel, Voxel"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="spatialInfo.rasterSpatialRepresentation.transformationParameterAvailability"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <FormLabel>Transformation Parameter Availability</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="spatialInfo.rasterSpatialRepresentation.cloudCoverPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cloud Cover Percentage (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 15"
                    {...field}
                    value={field.value ?? ""}
                    onChange={e =>
                      field.onChange(
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="spatialInfo.rasterSpatialRepresentation.compressionGenerationQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compression Generation Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter value"
                    {...field}
                    value={field.value ?? ""}
                    onChange={e =>
                      field.onChange(
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <h4 className="text-md font-medium pt-4">Bounding Box</h4>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FormField
          control={form.control}
          name="spatialInfo.boundingBox.westBoundingCoordinate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>West Bounding Coordinate</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., -123.45"
                  {...field}
                  value={field.value ?? ""}
                  onChange={e =>
                    field.onChange(
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* East, North, South Bounding Coordinates follow similar pattern */}
        <FormField
          control={form.control}
          name="spatialInfo.boundingBox.eastBoundingCoordinate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>East Bounding Coordinate</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., -122.67"
                  {...field}
                  value={field.value ?? ""}
                  onChange={e =>
                    field.onChange(
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spatialInfo.boundingBox.northBoundingCoordinate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>North Bounding Coordinate</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 49.28"
                  {...field}
                  value={field.value ?? ""}
                  onChange={e =>
                    field.onChange(
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spatialInfo.boundingBox.southBoundingCoordinate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>South Bounding Coordinate</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 48.54"
                  {...field}
                  value={field.value ?? ""}
                  onChange={e =>
                    field.onChange(
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <h4 className="text-md font-medium pt-4">Vertical Extent</h4>
      <div className="grid md:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name="spatialInfo.verticalExtent.minimumValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Value</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter min value"
                  {...field}
                  value={field.value ?? ""}
                  onChange={e =>
                    field.onChange(
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spatialInfo.verticalExtent.maximumValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Value</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter max value"
                  {...field}
                  value={field.value ?? ""}
                  onChange={e =>
                    field.onChange(
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spatialInfo.verticalExtent.unitOfMeasure"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit of Measure</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., meters, feet"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

// Section 2: Temporal Information
export function TemporalSection({
  form
}: {
  form: UseFormReturn<MetadataFormValues>
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-3">Temporal Information</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="temporalInfo.dateFrom"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date From (Start of temporal extent)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={date =>
                      field.onChange(date ? date.toISOString() : null)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="temporalInfo.dateTo"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date To (End of temporal extent)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={date =>
                      field.onChange(date ? date.toISOString() : null)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

// Section: Data Quality Information (New Section)
export function DataQualitySection({
  form
}: {
  form: UseFormReturn<MetadataFormValues>
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-3">Data Quality Information</h3>

      <FormField
        control={form.control}
        name="dataQualityLineage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lineage / Data Source History *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe the source of the data, processing steps, and history."
                {...field}
                value={field.value ?? ""}
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="dataQualityInfo.attributeAccuracyReport"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Accuracy Report</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Report on the accuracy of the dataset (e.g., positional accuracy, attribute accuracy)."
                {...field}
                value={field.value ?? ""}
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="dataQualityInfo.completenessReport"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Completeness Report</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Report on the completeness of the dataset (e.g., missing data, coverage)."
                {...field}
                value={field.value ?? ""}
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="dataQualityInfo.logicalConsistencyReport"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Logical Consistency Report</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Report on the logical consistency of the dataset (e.g., topological consistency, attribute relationships)."
                {...field}
                value={field.value ?? ""}
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

// Section: Processing Information (New Section)
export function ProcessingInformationSection({
  form
}: {
  form: UseFormReturn<MetadataFormValues>
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Processing Information</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Information about how the data was processed, tools used, and source
        data.
      </p>

      <FormField
        control={form.control}
        name="processingInfo.processingStepsDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Processing Steps Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe the steps taken to process the data"
                rows={4}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="processingInfo.softwareAndVersionUsed"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Software and Versions Used</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., ArcGIS Pro 3.0, QGIS 3.22"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Processor Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Name of the person who processed the data"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Processor Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="contact@example.com"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="contactAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Processor Organization</FormLabel>
            <FormControl>
              <Input
                placeholder="Organization responsible for processing"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="processingInfo.processedDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Processing Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(
                        typeof field.value === "string"
                          ? new Date(field.value)
                          : field.value,
                        "PPP"
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    field.value
                      ? typeof field.value === "string"
                        ? new Date(field.value)
                        : field.value
                      : undefined
                  }
                  onSelect={field.onChange}
                  disabled={date =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Source Information Section */}
      <div className="border p-4 rounded-md mt-6">
        <h4 className="text-md font-medium mb-4">Source Information</h4>

        <FormField
          control={form.control}
          name="dataSources"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source Citation</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Citation for the source data"
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <FormField
            control={form.control}
            name="spatialResolution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source Scale</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., 1:50000"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="technicalDetailsInfo.fileFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source Format</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Shapefile, GeoTIFF"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}

// Section: Contact and Other Information (New Section)
export function ContactAndOtherInformationSection({
  form
}: {
  form: UseFormReturn<MetadataFormValues>
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-3">Contact & Other Information</h3>

      {/* Contact Information Fields */}
      <h4 className="text-md font-medium pt-2">Contact Information</h4>
      <FormField
        control={form.control}
        name="contactName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Point of Contact *</FormLabel>
            <FormControl>
              <Input
                placeholder="Name or department for contact"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Email *</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="contact@example.com"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Phone</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+234 123 456 7890"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="contactAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Organization Name</FormLabel>
            <FormControl>
              <Input
                placeholder="Name of the responsible organization"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Technical Details Fields */}
      <h4 className="text-md font-medium pt-4">Technical Details</h4>
      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="spatialReferenceSystem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Standard</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., ISO 19115, FGDC CSDGM"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Dictionary URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="Link to data dictionary or schema documentation"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Distribution Information Fields (from Zod, some overlap with old DistributionSection) */}
      <h4 className="text-md font-medium pt-4">Distribution Details</h4>
      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="technicalDetailsInfo.fileFormat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Distribution Format Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., GeoTIFF, Shapefile, CSV"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="version"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Format Version</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., 1.0, 2.1"
                  {...field}
                  value={field.value ?? ""}
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
            <FormLabel>Access URL (Download/Service/API)</FormLabel>
            <FormControl>
              <Input
                type="url"
                placeholder="Link to download, service endpoint, or API documentation"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Metadata Reference Information Fields */}
      <h4 className="text-md font-medium pt-4">Metadata Reference</h4>
      <FormField
        control={form.control}
        name="spatialReferenceSystem"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Metadata Standard</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., ISO 19115-1:2014, Dublin Core"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="language"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Metadata Language</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., en, fr"
                {...field}
                value={field.value ?? "en"}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="additionalInformation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Information</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any other relevant information not covered elsewhere."
                {...field}
                value={field.value ?? ""}
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

// New Section: Preview
export function MetadataPreviewSection({
  form
}: {
  form: UseFormReturn<MetadataFormValues>
}) {
  const values = form.getValues()

  // Helper to render field values, handling various types
  const renderValue = (value: any) => {
    if (value === null || typeof value === "undefined") {
      return <span className="text-muted-foreground">Not provided</span>
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No"
    }
    if (value instanceof Date) {
      return format(value, "PPP")
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? (
        value.join(", ")
      ) : (
        <span className="text-muted-foreground">None</span>
      )
    }
    if (typeof value === "object") {
      // For simple objects, you might want to stringify or map through key-value pairs
      // For now, just stringify to show something
      return JSON.stringify(value)
    }
    return String(value)
  }

  // Helper to create a more readable label from a camelCase field name
  const formatLabel = (fieldName: string) => {
    const result = fieldName.replace(/([A-Z])/g, " $1")
    return result.charAt(0).toUpperCase() + result.slice(1)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-primary">Review Your Metadata</h3>
      <p className="text-sm text-muted-foreground">
        Please review the information below before submitting.
      </p>
      <div className="space-y-4 divide-y divide-border rounded-md border p-4 md:p-6">
        {Object.entries(values).map(([key, value]) => {
          // Skip internal react-hook-form properties or fields you don't want to show
          if (
            key === "control" ||
            key === "trigger" ||
            key === "formState" ||
            key === "watch" ||
            key === "reset" ||
            key === "handleSubmit" ||
            key === "register" ||
            key === "setValue" ||
            key === "getValues" ||
            key === "getFieldState" ||
            key === "clearErrors" ||
            key === "_formState"
          ) {
            return null
          }
          // You can add more sophisticated filtering or ordering of fields here
          return (
            <div key={key} className="pt-4 first:pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <dt className="font-medium text-foreground md:col-span-1">
                  {formatLabel(key)}:
                </dt>
                <dd className="text-muted-foreground md:col-span-2">
                  {renderValue(value)}
                </dd>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Placeholder for ReviewForm - to be implemented in Subtask 24.12
export function ReviewForm({
  form
}: {
  form: UseFormReturn<MetadataFormValues>
}) {
  const data = form.getValues() // Get all form values for review

  // Define section headers based on form steps
  const sections = [
    {
      title: "General Information",
      fields: [
        "title",
        "dataType",
        "abstract",
        "purpose",
        "organizationId",
        "keywords",
        "version",
        "language"
      ]
    },
    {
      title: "Location Information",
      fields: ["locationInfo", "geographicDescription"]
    },
    {
      title: "Spatial Information",
      fields: [
        "spatialRepresentationType",
        "spatialReferenceSystem",
        "spatialResolution",
        "boundingBoxNorth",
        "boundingBoxSouth",
        "boundingBoxEast",
        "boundingBoxWest"
      ]
    },
    {
      title: "Temporal Information",
      fields: ["temporalExtentFrom", "temporalExtentTo"]
    },
    {
      title: "Data Quality Information",
      fields: [
        "dataQualityInfo",
        "dataQualityScope",
        "dataQualityLineage",
        "dataQualityReport"
      ]
    },
    {
      title: "Processing Information",
      fields: ["processingInfo", "dataSources", "methodology"]
    },
    {
      title: "Contact & Distribution Information",
      fields: [
        "contactName",
        "contactEmail",
        "contactPhone",
        "contactAddress",
        "distributionInfo",
        "licence",
        "accessAndUseLimitations"
      ]
    },
    {
      title: "Additional Information",
      fields: ["notes", "additionalInformation"]
    }
  ]

  // Format a value for display
  const formatValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-muted-foreground italic">Not provided</span>
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No"
    }

    if (value instanceof Date) {
      return format(value, "PPP")
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {value.map((item, i) => (
            <span key={i} className="px-2 py-1 bg-muted rounded-md text-xs">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-muted-foreground italic">None</span>
      )
    }

    if (typeof value === "object") {
      return null // We'll handle objects specifically
    }

    // Special handling for URLs
    if (typeof value === "string") {
      if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.includes("www.")
      ) {
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center"
          >
            {value}
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        )
      }

      // Format emails
      if (value.includes("@") && value.includes(".")) {
        return (
          <a href={`mailto:${value}`} className="text-primary hover:underline">
            {value}
          </a>
        )
      }
    }

    return String(value)
  }

  // Format a field name for display
  const formatFieldName = (name: string): string => {
    // Convert camelCase to Title Case with spaces
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, str => str.toUpperCase())
      .replace(/Info$/, " Information")
  }

  // Render an object's values
  const renderObjectValues = (obj: Record<string, any>) => {
    if (!obj) return null

    return Object.entries(obj).map(([key, value]) => {
      // Skip empty values or nested objects (will be handled separately)
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (typeof value === "object" &&
          !Array.isArray(value) &&
          !(value instanceof Date))
      ) {
        return null
      }

      return (
        <div key={key} className="px-4 py-2 border-t">
          <div className="font-medium text-sm">{formatFieldName(key)}:</div>
          <div className="text-sm mt-1">{formatValue(value)}</div>
        </div>
      )
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Review Your Submission</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Please review all information carefully before submitting. You can go
          back to any section to make changes.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-muted/30 rounded-lg border p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h4 className="text-sm font-medium mb-1">Title</h4>
            <p className="text-sm">
              {data.title || "Untitled Metadata Record"}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">Data Type</h4>
            <p className="text-sm">{data.dataType || "Not specified"}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">Organization</h4>
            <p className="text-sm">{data.organizationId || "Not specified"}</p>
          </div>

          <div className="col-span-3">
            <h4 className="text-sm font-medium mb-1">Abstract</h4>
            <p className="text-sm line-clamp-2">
              {data.abstract || "No abstract provided"}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-sm font-medium">Ready for submission</p>
          </div>

          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {sections.map(section => {
          // Check if there's any data to show in this section
          const hasContent = section.fields.some(field => {
            const value = data[field as keyof typeof data]
            return (
              value !== null &&
              value !== undefined &&
              value !== "" &&
              !(
                typeof value === "object" &&
                Object.keys(value || {}).length === 0
              )
            )
          })

          if (!hasContent) return null

          return (
            <div
              key={section.title}
              className="border rounded-lg overflow-hidden"
            >
              <div className="bg-muted px-4 py-3">
                <h4 className="font-medium">{section.title}</h4>
              </div>
              <div>
                {section.fields.map(field => {
                  const value = data[field as keyof typeof data]

                  // Skip empty values
                  if (value === null || value === undefined || value === "") {
                    return null
                  }

                  // Handle objects differently
                  if (
                    typeof value === "object" &&
                    !Array.isArray(value) &&
                    !(value instanceof Date)
                  ) {
                    return renderObjectValues(value as Record<string, any>)
                  }

                  // Skip empty arrays
                  if (Array.isArray(value) && value.length === 0) {
                    return null
                  }

                  return (
                    <div
                      key={field}
                      className="px-4 py-3 border-t first:border-t-0"
                    >
                      <div className="font-medium text-sm">
                        {formatFieldName(field)}:
                      </div>
                      <div className="mt-1 text-sm">{formatValue(value)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-muted/50 rounded-lg p-4 border border-muted">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <p className="text-sm font-medium">
            Ready to submit? Use the buttons below to save as a draft or submit
            your metadata record.
          </p>
        </div>
      </div>
    </div>
  )
}
