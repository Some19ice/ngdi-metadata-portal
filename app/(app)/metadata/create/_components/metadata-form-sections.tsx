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
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { X, CheckCircle, ExternalLink } from "lucide-react"
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
import { LabelWithHelp } from "@/components/ui/form-field-with-help"
import { MobileCoordinateInput } from "@/components/ui/mobile-coordinate-input"
import { MobileDateInput } from "@/components/ui/mobile-date-input"
import {
  nigerianStates,
  getStatesAsOptions,
  getLGAsByState
} from "@/lib/data/nigeria-states-lga"

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
            <LabelWithHelp helpKey="title" required>
              Title / Name of the data
            </LabelWithHelp>
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
            <LabelWithHelp helpKey="abstract" required>
              Abstract / Description
            </LabelWithHelp>
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
            <LabelWithHelp helpKey="purpose">Purpose</LabelWithHelp>
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
              <LabelWithHelp helpKey="dataType" required>
                Dataset Type
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="topicCategory" required>
                Topic Category
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="version">Version</LabelWithHelp>
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
              <LabelWithHelp helpKey="language" required>
                Language
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="updateFrequency">
                Update Frequency
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="status">
                Assessment / Status of Data
              </LabelWithHelp>
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
            <LabelWithHelp helpKey="keywords">Keywords</LabelWithHelp>
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
              <LabelWithHelp helpKey="thumbnailUrl">
                Thumbnail URL
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="cloudCover">
                Cloud Cover Percentage (%)
              </LabelWithHelp>
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
            <LabelWithHelp helpKey="frameworkType">
              Framework Type
            </LabelWithHelp>
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
  // Watch the selected state to update LGA options
  const selectedState = form.watch("locationInfo.state")
  const lgaOptions = selectedState ? getLGAsByState(selectedState) : []

  // Clear LGA when state changes
  const handleStateChange = (stateId: string) => {
    form.setValue("locationInfo.state", stateId)
    form.setValue("locationInfo.lga", null) // Clear LGA when state changes
  }

  // Geopolitical zones options
  const geopoliticalZones = [
    { value: "north-central", label: "North Central" },
    { value: "north-east", label: "North East" },
    { value: "north-west", label: "North West" },
    { value: "south-east", label: "South East" },
    { value: "south-south", label: "South South" },
    { value: "south-west", label: "South West" }
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-3">Location Information</h3>
      <FormField
        control={form.control}
        name="locationInfo.country"
        render={({ field }) => (
          <FormItem>
            <LabelWithHelp helpKey="country">Country</LabelWithHelp>
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
              <LabelWithHelp
                customHelp={{
                  title: "Geopolitical Zone",
                  content:
                    "The geopolitical zone within Nigeria where the data is located.",
                  examples: [
                    "North Central",
                    "North East",
                    "North West",
                    "South East",
                    "South South",
                    "South West"
                  ]
                }}
              >
                Geopolitical Zone
              </LabelWithHelp>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select geopolitical zone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {geopoliticalZones.map(zone => (
                    <SelectItem key={zone.value} value={zone.value}>
                      {zone.label}
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
          name="locationInfo.state"
          render={({ field }) => (
            <FormItem>
              <LabelWithHelp
                customHelp={{
                  title: "State",
                  content:
                    "The specific state within Nigeria where the data is geographically located.",
                  examples: [
                    "Lagos",
                    "Abuja (FCT)",
                    "Kano",
                    "Rivers",
                    "Ogun",
                    "Kaduna"
                  ]
                }}
              >
                State
              </LabelWithHelp>
              <Select
                onValueChange={handleStateChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {getStatesAsOptions().map(state => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
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
          name="locationInfo.lga"
          render={({ field }) => (
            <FormItem>
              <LabelWithHelp
                customHelp={{
                  title: "LGA (Local Government Area)",
                  content:
                    "The Local Government Area where the data is specifically located within the state.",
                  examples: selectedState
                    ? lgaOptions.slice(0, 5).map(lga => lga.name)
                    : ["Select a state first to see LGA options"]
                }}
              >
                LGA (Local Government Area)
              </LabelWithHelp>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
                disabled={!selectedState || lgaOptions.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        selectedState ? "Select LGA" : "Select state first"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {lgaOptions.map(lga => (
                    <SelectItem key={lga.id} value={lga.id}>
                      {lga.name}
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
          name="locationInfo.townCity"
          render={({ field }) => (
            <FormItem>
              <LabelWithHelp
                customHelp={{
                  title: "Town / City",
                  content:
                    "The specific town, city, or urban area covered by the dataset.",
                  examples: [
                    "Ikeja",
                    "Victoria Island",
                    "Surulere",
                    "Yaba",
                    "Ikoyi"
                  ]
                }}
              >
                Town / City
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="coordinateSystem">
                Coordinate System
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="projection">Projection</LabelWithHelp>
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
              <LabelWithHelp helpKey="datum">Datum</LabelWithHelp>
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
              <LabelWithHelp helpKey="resolutionScale">
                Resolution Scale / Equivalent Scale
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="geometricObjectType">
                Geometric Object Type
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="numFeaturesOrLayers">
                Number of Features or Layers
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="format">Format</LabelWithHelp>
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
              <LabelWithHelp helpKey="distributionFormat">
                Distribution Format (Spatial)
              </LabelWithHelp>
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
            <LabelWithHelp helpKey="spatialRepresentationType">
              Spatial Representation Type
            </LabelWithHelp>
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
                <LabelWithHelp helpKey="topologyLevel">
                  Topology Level
                </LabelWithHelp>
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
              <LabelWithHelp helpKey="geometricObjects">
                Geometric Objects
              </LabelWithHelp>
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
                      <LabelWithHelp
                        helpKey="geometricObjectType"
                        className="text-xs"
                      >
                        Type
                      </LabelWithHelp>
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
                      <LabelWithHelp
                        helpKey="geometricObjectCount"
                        className="text-xs"
                      >
                        Count
                      </LabelWithHelp>
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
              <LabelWithHelp helpKey="axisDimensions">
                Axis Dimensions
              </LabelWithHelp>
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
                      <LabelWithHelp helpKey="axisName" className="text-xs">
                        Name
                      </LabelWithHelp>
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
                      <LabelWithHelp helpKey="axisSize" className="text-xs">
                        Size
                      </LabelWithHelp>
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
                      <LabelWithHelp
                        helpKey="axisResolution"
                        className="text-xs"
                      >
                        Resolution
                      </LabelWithHelp>
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
                <LabelWithHelp helpKey="cellGeometry">
                  Cell Geometry
                </LabelWithHelp>
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
                <LabelWithHelp helpKey="transformationParameterAvailability">
                  Transformation Parameter Availability
                </LabelWithHelp>
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
                <LabelWithHelp helpKey="cloudCover">
                  Cloud Cover Percentage (%)
                </LabelWithHelp>
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
                <LabelWithHelp helpKey="compressionGenerationQuantity">Compression Generation Quantity</LabelWithHelp>
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
      <div className="space-y-4">
        {/* Mobile Coordinate Input - shows on small screens */}
        <div className="block sm:hidden">
          <MobileCoordinateInput
            value={{
              minX:
                form.watch("spatialInfo.boundingBox.westBoundingCoordinate") ??
                undefined,
              maxX:
                form.watch("spatialInfo.boundingBox.eastBoundingCoordinate") ??
                undefined,
              minY:
                form.watch("spatialInfo.boundingBox.southBoundingCoordinate") ??
                undefined,
              maxY:
                form.watch("spatialInfo.boundingBox.northBoundingCoordinate") ??
                undefined
            }}
            onChange={coords => {
              form.setValue(
                "spatialInfo.boundingBox.westBoundingCoordinate",
                coords.minX ?? null
              )
              form.setValue(
                "spatialInfo.boundingBox.eastBoundingCoordinate",
                coords.maxX ?? null
              )
              form.setValue(
                "spatialInfo.boundingBox.southBoundingCoordinate",
                coords.minY ?? null
              )
              form.setValue(
                "spatialInfo.boundingBox.northBoundingCoordinate",
                coords.maxY ?? null
              )
            }}
            placeholder="Tap to set coordinates"
          />
        </div>

        {/* Desktop Coordinate Inputs - shows on larger screens */}
        <div className="hidden sm:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField
            control={form.control}
            name="spatialInfo.boundingBox.westBoundingCoordinate"
            render={({ field }) => (
              <FormItem>
                <LabelWithHelp helpKey="westBoundingCoordinate">
                  West Bounding Coordinate
                </LabelWithHelp>
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
          <FormField
            control={form.control}
            name="spatialInfo.boundingBox.eastBoundingCoordinate"
            render={({ field }) => (
              <FormItem>
                <LabelWithHelp helpKey="eastBoundingCoordinate">
                  East Bounding Coordinate
                </LabelWithHelp>
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
                <LabelWithHelp helpKey="northBoundingCoordinate">
                  North Bounding Coordinate
                </LabelWithHelp>
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
                <LabelWithHelp helpKey="southBoundingCoordinate">
                  South Bounding Coordinate
                </LabelWithHelp>
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
      </div>

      <h4 className="text-md font-medium pt-4">Vertical Extent</h4>
      <div className="grid md:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name="spatialInfo.verticalExtent.minimumValue"
          render={({ field }) => (
            <FormItem>
              <LabelWithHelp helpKey="minimumValue">
                Minimum Value
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="maximumValue">
                Maximum Value
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="unitOfMeasure">
                Unit of Measure
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="dateFrom">
                Date From (Start of temporal extent)
              </LabelWithHelp>
              <FormControl>
                <MobileDateInput
                  value={field.value ? new Date(field.value) : null}
                  onChange={date =>
                    field.onChange(date ? date.toISOString() : null)
                  }
                  placeholder="Pick a start date"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="temporalInfo.dateTo"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <LabelWithHelp helpKey="dateTo">
                Date To (End of temporal extent)
              </LabelWithHelp>
              <FormControl>
                <MobileDateInput
                  value={field.value ? new Date(field.value) : null}
                  onChange={date =>
                    field.onChange(date ? date.toISOString() : null)
                  }
                  placeholder="Pick an end date"
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
            <LabelWithHelp helpKey="lineage" required>
              Lineage / Data Source History
            </LabelWithHelp>
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
            <LabelWithHelp helpKey="accuracyReport">
              Accuracy Report
            </LabelWithHelp>
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
            <LabelWithHelp helpKey="completenessReport">
              Completeness Report
            </LabelWithHelp>
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
            <LabelWithHelp helpKey="logicalConsistencyReport">
              Logical Consistency Report
            </LabelWithHelp>
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
            <LabelWithHelp helpKey="processing.stepDescription">
              Processing Steps Description
            </LabelWithHelp>
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
            <LabelWithHelp helpKey="processing.software">
              Software and Versions Used
            </LabelWithHelp>
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
              <LabelWithHelp helpKey="contact.individualName">
                Processor Name
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="contact.email">
                Processor Email
              </LabelWithHelp>
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
            <LabelWithHelp helpKey="contact.organization">
              Processor Organization
            </LabelWithHelp>
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
            <LabelWithHelp helpKey="processing.date">
              Processing Date
            </LabelWithHelp>
            <FormControl>
              <MobileDateInput
                value={field.value}
                onChange={field.onChange}
                placeholder="Pick a date"
              />
            </FormControl>
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
              <LabelWithHelp helpKey="general.dataSources">
                Source Citation
              </LabelWithHelp>
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
                <LabelWithHelp helpKey="spatial.resolution">
                  Source Scale
                </LabelWithHelp>
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
                <LabelWithHelp helpKey="spatial.format">
                  Source Format
                </LabelWithHelp>
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
            <LabelWithHelp helpKey="contact.individualName">
              Point of Contact *
            </LabelWithHelp>
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
              <LabelWithHelp helpKey="contact.email">
                Contact Email *
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="contact.phone">
                Contact Phone
              </LabelWithHelp>
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
            <LabelWithHelp helpKey="contact.organization">
              Organization Name
            </LabelWithHelp>
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
              <LabelWithHelp helpKey="general.dataStandard">
                Data Standard
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="distribution.onlineResource">
                Data Dictionary URL
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="spatial.format">
                Distribution Format Name *
              </LabelWithHelp>
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
              <LabelWithHelp helpKey="general.version">
                Format Version
              </LabelWithHelp>
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
            <LabelWithHelp helpKey="distribution.accessUrl">
              Access URL (Download/Service/API)
            </LabelWithHelp>
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
            <LabelWithHelp helpKey="general.metadataStandard">
              Metadata Standard
            </LabelWithHelp>
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
            <LabelWithHelp helpKey="general.language">
              Metadata Language
            </LabelWithHelp>
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
            <LabelWithHelp helpKey="general.additionalInfo">
              Additional Information
            </LabelWithHelp>
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Review Your Metadata</h3>
        <p className="text-muted-foreground">
          Please review all the information below before submitting
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">General Information</h4>
          <div className="grid gap-2 text-sm">
            <div>
              <strong>Title:</strong> {renderValue(values.title)}
            </div>
            <div>
              <strong>Data Type:</strong> {renderValue(values.dataType)}
            </div>
            <div>
              <strong>Abstract:</strong> {renderValue(values.abstract)}
            </div>
            <div>
              <strong>Keywords:</strong> {renderValue(values.keywords)}
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Location Information</h4>
          <div className="grid gap-2 text-sm">
            <div>
              <strong>Country:</strong>{" "}
              {renderValue(values.locationInfo?.country)}
            </div>
            <div>
              <strong>State:</strong> {renderValue(values.locationInfo?.state)}
            </div>
            <div>
              <strong>LGA:</strong> {renderValue(values.locationInfo?.lga)}
            </div>
          </div>
        </div>

        {values.spatialInfo && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Spatial Information</h4>
            <div className="grid gap-2 text-sm">
              <div>
                <strong>Coordinate System:</strong>{" "}
                {renderValue(values.spatialInfo.coordinateSystem)}
              </div>
              <div>
                <strong>Format:</strong>{" "}
                {renderValue(values.spatialInfo.format)}
              </div>
            </div>
          </div>
        )}

        {values.temporalInfo && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Temporal Information</h4>
            <div className="grid gap-2 text-sm">
              <div>
                <strong>Date From:</strong>{" "}
                {renderValue(values.temporalInfo.dateFrom)}
              </div>
              <div>
                <strong>Date To:</strong>{" "}
                {renderValue(values.temporalInfo.dateTo)}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center p-4 border-t">
        <p className="text-sm text-muted-foreground">
          You can go back to any section to make changes, or submit your
          metadata record.
        </p>
      </div>
    </div>
  )
}
