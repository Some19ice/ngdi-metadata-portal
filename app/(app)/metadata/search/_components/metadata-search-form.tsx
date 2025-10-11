"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, CalendarDays, Filter, Layers, Map } from "lucide-react"
import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  frameworkTypeEnum,
  datasetTypeEnum
} from "@/db/schema/metadata-records-schema"
import { Checkbox } from "@/components/ui/checkbox"
import dynamic from "next/dynamic"
import { MetadataSearchFilters } from "@/types"
import {
  generateSearchUrl,
  parseSearchParams,
  SEARCH_PARAM_NAMES
} from "@/lib/utils/search-params-utils"

// Dynamically import the map component to prevent SSR issues
const BoundingBoxSelector = dynamic(
  () => import("@/components/ui/map/bounding-box-selector"),
  { ssr: false }
)

// Updated schema to use standardized parameter names
const searchFormSchema = z.object({
  query: z.string().max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  frameworkTypes: z.array(z.string()).optional(),
  dataTypes: z.array(z.string()).optional(),
  useSpatialSearch: z.boolean().optional().default(false),
  // Spatial search coordinates using standardized names
  bboxNorth: z.string().optional(),
  bboxSouth: z.string().optional(),
  bboxEast: z.string().optional(),
  bboxWest: z.string().optional()
})

type SearchFormValues = z.infer<typeof searchFormSchema>

interface MetadataSearchFormProps {
  initialFilters?: MetadataSearchFilters
}

export default function MetadataSearchForm({
  initialFilters = {}
}: MetadataSearchFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<string>("temporal")

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      query: initialFilters.query || "",
      startDate: initialFilters.startDate || "",
      endDate: initialFilters.endDate || "",
      frameworkTypes: initialFilters.frameworkTypes || [],
      dataTypes: initialFilters.dataTypes || [],
      useSpatialSearch: initialFilters.useSpatialSearch || false,
      bboxNorth: initialFilters.spatialBounds?.north?.toString() || "",
      bboxSouth: initialFilters.spatialBounds?.south?.toString() || "",
      bboxEast: initialFilters.spatialBounds?.east?.toString() || "",
      bboxWest: initialFilters.spatialBounds?.west?.toString() || ""
    }
  })

  // Effect to update form if URL search params change externally
  useEffect(() => {
    const urlFilters = parseSearchParams(searchParams)

    form.reset({
      query: urlFilters.query || "",
      startDate: urlFilters.startDate || "",
      endDate: urlFilters.endDate || "",
      frameworkTypes: urlFilters.frameworkTypes || [],
      dataTypes: urlFilters.dataTypes || [],
      useSpatialSearch: urlFilters.useSpatialSearch || false,
      bboxNorth: urlFilters.spatialBounds?.north?.toString() || "",
      bboxSouth: urlFilters.spatialBounds?.south?.toString() || "",
      bboxEast: urlFilters.spatialBounds?.east?.toString() || "",
      bboxWest: urlFilters.spatialBounds?.west?.toString() || ""
    })
  }, [searchParams, form])

  function onSubmit(values: SearchFormValues) {
    // Convert form values to MetadataSearchFilters
    const filters: MetadataSearchFilters = {}

    if (values.query?.trim()) {
      filters.query = values.query.trim()
    }
    if (values.startDate) {
      filters.startDate = values.startDate
    }
    if (values.endDate) {
      filters.endDate = values.endDate
    }
    if (values.frameworkTypes && values.frameworkTypes.length > 0) {
      filters.frameworkTypes = values.frameworkTypes
    }
    if (values.dataTypes && values.dataTypes.length > 0) {
      filters.dataTypes = values.dataTypes
    }

    // Handle spatial search
    if (values.useSpatialSearch) {
      filters.useSpatialSearch = true

      if (
        values.bboxNorth &&
        values.bboxSouth &&
        values.bboxEast &&
        values.bboxWest
      ) {
        filters.spatialBounds = {
          north: parseFloat(values.bboxNorth),
          south: parseFloat(values.bboxSouth),
          east: parseFloat(values.bboxEast),
          west: parseFloat(values.bboxWest)
        }
      }
    }

    // Use the standardized URL generation
    const url = generateSearchUrl(filters, "/metadata/search")
    router.push(url)
  }

  // Handle bounding box selection from map
  const handleBoundingBoxChange = (
    bounds: {
      north: number
      south: number
      east: number
      west: number
    } | null
  ) => {
    if (bounds) {
      form.setValue("bboxNorth", bounds.north.toString())
      form.setValue("bboxSouth", bounds.south.toString())
      form.setValue("bboxEast", bounds.east.toString())
      form.setValue("bboxWest", bounds.west.toString())
      form.setValue("useSpatialSearch", true)

      // Update URL immediately to reflect current bbox selection
      const values = form.getValues()
      const filters: MetadataSearchFilters = {
        query: values.query?.trim() || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        frameworkTypes:
          values.frameworkTypes && values.frameworkTypes.length > 0
            ? values.frameworkTypes
            : undefined,
        dataTypes:
          values.dataTypes && values.dataTypes.length > 0
            ? values.dataTypes
            : undefined,
        useSpatialSearch: true,
        spatialBounds: bounds
      }
      const url = generateSearchUrl(filters, "/metadata/search")
      router.replace(url)
    }
  }

  const useSpatialSearch = form.watch("useSpatialSearch")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Search Term</FormLabel>
              <FormControl>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, abstract..."
                    {...field}
                    className="pl-10"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="filters">
            <AccordionTrigger className="text-sm font-medium">
              <Filter className="mr-2 h-4 w-4" /> Advanced Filters
            </AccordionTrigger>
            <AccordionContent>
              <Tabs
                defaultValue="temporal"
                className="mt-4"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="temporal">
                    <CalendarDays className="mr-2 h-4 w-4" /> Temporal
                  </TabsTrigger>
                  <TabsTrigger value="categories">
                    <Layers className="mr-2 h-4 w-4" /> Categories
                  </TabsTrigger>
                  <TabsTrigger value="spatial">
                    <Map className="mr-2 h-4 w-4" /> Spatial
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="temporal" className="mt-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            Coverage Start Date (From)
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            Records with coverage ending on or after this date
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            Coverage End Date (To)
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            Records with coverage starting on or before this
                            date
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="categories" className="mt-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="frameworkTypes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Framework Types</FormLabel>
                          <div className="space-y-2">
                            {frameworkTypeEnum.enumValues.map(type => (
                              <div
                                key={type}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`framework-${type}`}
                                  checked={field.value?.includes(type) || false}
                                  onCheckedChange={checked => {
                                    const current = field.value || []
                                    if (checked) {
                                      field.onChange([...current, type])
                                    } else {
                                      field.onChange(
                                        current.filter(t => t !== type)
                                      )
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`framework-${type}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {type}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormDescription>
                            Select framework types
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataTypes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dataset Types</FormLabel>
                          <div className="space-y-2">
                            {datasetTypeEnum.enumValues.map(type => (
                              <div
                                key={type}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`dataset-${type}`}
                                  checked={field.value?.includes(type) || false}
                                  onCheckedChange={checked => {
                                    const current = field.value || []
                                    if (checked) {
                                      field.onChange([...current, type])
                                    } else {
                                      field.onChange(
                                        current.filter(t => t !== type)
                                      )
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`dataset-${type}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {type}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormDescription>
                            Select dataset types
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="spatial" className="mt-4 space-y-4">
                  {/* Spatial search section */}
                  <FormField
                    control={form.control}
                    name="useSpatialSearch"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Enable spatial search</FormLabel>
                          <FormDescription>
                            Limit search to a specific geographic area
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {useSpatialSearch ? (
                    <div className="p-2 border rounded-md">
                      <p className="mb-2 text-sm font-medium">
                        Draw a bounding box to search within:
                      </p>
                      <div className="h-96 rounded-md overflow-hidden">
                        <BoundingBoxSelector
                          onBoundsChange={handleBoundingBoxChange}
                          initialBounds={
                            form.watch("bboxNorth") &&
                            form.watch("bboxSouth") &&
                            form.watch("bboxEast") &&
                            form.watch("bboxWest")
                              ? {
                                  north: parseFloat(
                                    form.watch("bboxNorth") || "0"
                                  ),
                                  south: parseFloat(
                                    form.watch("bboxSouth") || "0"
                                  ),
                                  east: parseFloat(
                                    form.watch("bboxEast") || "0"
                                  ),
                                  west: parseFloat(
                                    form.watch("bboxWest") || "0"
                                  )
                                }
                              : undefined
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <FormField
                          control={form.control}
                          name="bboxNorth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>North</FormLabel>
                              <FormControl>
                                <Input {...field} readOnly />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bboxSouth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>South</FormLabel>
                              <FormControl>
                                <Input {...field} readOnly />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bboxEast"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>East</FormLabel>
                              <FormControl>
                                <Input {...field} readOnly />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bboxWest"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>West</FormLabel>
                              <FormControl>
                                <Input {...field} readOnly />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted p-6 rounded-md">
                      <div className="flex items-center justify-center h-48">
                        <p className="text-muted-foreground text-center">
                          <Map className="mx-auto h-8 w-8 mb-2" />
                          Check the box above to enable spatial search. <br />
                          This will allow you to define a bounding box to find
                          records within a specific geographic area.
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button type="submit" className="w-full md:w-auto">
          <Search className="mr-2 h-4 w-4" /> Search
        </Button>
      </form>
    </Form>
  )
}
