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
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Lightbulb } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { MetadataFormValues } from "@/lib/validators/metadata-validator"
import {
  datasetTypeEnum,
  frameworkTypeEnum,
  metadataTopicCategoryEnum
} from "@/db/schema/metadata-records-schema"
import { LabelWithHelp } from "@/components/ui/form-field-with-help"

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
              Title
            </LabelWithHelp>
            <FormControl>
              <Input
                placeholder="e.g., Urban Planning Dataset for Downtown Area"
                {...field}
                onFocus={() => handleFieldFocus("title", field.value || "")}
              />
            </FormControl>
            <SuggestionList fieldName="title" />
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
              Abstract
            </LabelWithHelp>
            <FormControl>
              <Textarea
                placeholder="Provide a comprehensive description of your dataset, including its purpose, content, and potential applications..."
                className="min-h-[100px]"
                {...field}
                onFocus={() => handleFieldFocus("abstract", field.value || "")}
              />
            </FormControl>
            <SuggestionList fieldName="abstract" />
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="dataType"
          render={({ field }) => (
            <FormItem>
              <LabelWithHelp helpKey="dataType" required>
                Data Type
              </LabelWithHelp>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
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
          name="frameworkType"
          render={({ field }) => (
            <FormItem>
              <LabelWithHelp
                helpKey="frameworkType"
                customHelp={{
                  title: "Framework Type",
                  content:
                    "The metadata standard or framework used to describe your dataset.",
                  examples: ["NGDI", "ISO 19115", "Dublin Core", "DCAT"]
                }}
                required
              >
                Framework Type
              </LabelWithHelp>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || undefined}
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

      <FormField
        control={form.control}
        name="topicCategory"
        render={({ field }) => (
          <FormItem>
            <LabelWithHelp
              customHelp={{
                title: "Topic Category",
                content:
                  "The main theme or subject area that best describes your dataset content.",
                examples: [
                  "Environment: Environmental monitoring, ecology",
                  "Transportation: Roads, railways, airports",
                  "Society: Demographics, education, health",
                  "Economy: Business, agriculture, industry"
                ]
              }}
              required
            >
              Topic Category
            </LabelWithHelp>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value || undefined}
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

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="keywords"
          render={({ field }) => {
            const keywords = field.value || []
            return (
              <FormItem>
                <LabelWithHelp helpKey="keywords">Keywords</LabelWithHelp>
                <FormControl>
                  <Input
                    placeholder="Add keywords and press Enter"
                    onKeyDown={handleAddKeyword}
                    onFocus={e =>
                      handleFieldFocus("keywords", e.currentTarget.value || "")
                    }
                  />
                </FormControl>
                <SuggestionList fieldName="keywords" />
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {keywords.map((keyword: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveKeyword(keyword)}
                      >
                        {keyword} ×
                      </Badge>
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )
          }}
        />
      </div>

      <FormField
        control={form.control}
        name="purpose"
        render={({ field }) => (
          <FormItem>
            <LabelWithHelp
              customHelp={{
                title: "Purpose",
                content:
                  "The specific reason why this dataset was created and how it's intended to be used.",
                examples: [
                  "Urban planning and development monitoring",
                  "Environmental impact assessment",
                  "Infrastructure planning and management",
                  "Research and academic studies"
                ]
              }}
            >
              Purpose
            </LabelWithHelp>
            <FormControl>
              <Textarea
                placeholder="Describe the purpose or intended use of this dataset..."
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
        name="language"
        render={({ field }) => (
          <FormItem>
            <LabelWithHelp
              customHelp={{
                title: "Language",
                content:
                  "The primary language used in the dataset content, labels, and documentation."
              }}
            >
              Language
            </LabelWithHelp>
            <FormControl>
              <Input
                placeholder="e.g., English, French, etc."
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
        name="additionalInformation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Information</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Additional information about the dataset..."
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
