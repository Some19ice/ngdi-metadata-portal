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

// Dynamically import the map component to prevent SSR issues
const BoundingBoxSelector = dynamic(
  () => import("@/components/ui/map/bounding-box-selector"),
  { ssr: false }
)

// Updated schema to include faceted search options
const searchFormSchema = z.object({
  query: z.string().max(200).optional(),
  temporalExtentStartDate: z.string().optional(), // Expecting YYYY-MM-DD from date input
  temporalExtentEndDate: z.string().optional(),
  frameworkType: z.string().optional(),
  datasetType: z.string().optional(),
  useSpatialSearch: z.boolean().optional().default(false),
  // We'll add spatial search coordinates
  bbox_north: z.string().optional(),
  bbox_south: z.string().optional(),
  bbox_east: z.string().optional(),
  bbox_west: z.string().optional()
})

type SearchFormValues = z.infer<typeof searchFormSchema>

interface MetadataSearchFormProps {
  initialQuery?: string
  initialStartDate?: string
  initialEndDate?: string
  initialFrameworkType?: string
  initialDatasetType?: string
  initialBboxNorth?: string
  initialBboxSouth?: string
  initialBboxEast?: string
  initialBboxWest?: string
  initialUseSpatialSearch?: boolean
}

export default function MetadataSearchForm({
  initialQuery = "",
  initialStartDate,
  initialEndDate,
  initialFrameworkType,
  initialDatasetType,
  initialBboxNorth,
  initialBboxSouth,
  initialBboxEast,
  initialBboxWest,
  initialUseSpatialSearch = false
}: MetadataSearchFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<string>("temporal")

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      query: initialQuery || "",
      temporalExtentStartDate: initialStartDate || "",
      temporalExtentEndDate: initialEndDate || "",
      frameworkType: initialFrameworkType || "",
      datasetType: initialDatasetType || "",
      useSpatialSearch: initialUseSpatialSearch || false,
      bbox_north: initialBboxNorth || "",
      bbox_south: initialBboxSouth || "",
      bbox_east: initialBboxEast || "",
      bbox_west: initialBboxWest || ""
    }
  })

  // Effect to update form if URL search params change externally
  useEffect(() => {
    form.reset({
      query: searchParams.get("query") || "",
      temporalExtentStartDate:
        searchParams.get("temporalExtentStartDate") || "",
      temporalExtentEndDate: searchParams.get("temporalExtentEndDate") || "",
      frameworkType: searchParams.get("frameworkType") || "",
      datasetType: searchParams.get("datasetType") || "",
      useSpatialSearch: searchParams.get("useSpatialSearch") === "true",
      bbox_north: searchParams.get("bbox_north") || "",
      bbox_south: searchParams.get("bbox_south") || "",
      bbox_east: searchParams.get("bbox_east") || "",
      bbox_west: searchParams.get("bbox_west") || ""
    })
  }, [searchParams, form])

  function onSubmit(values: SearchFormValues) {
    const params = new URLSearchParams()
    params.set("type", "metadata") // Add the type for the central search page

    if (values.query) {
      params.set("q", values.query) // Use 'q' to match global search
    }
    if (values.temporalExtentStartDate) {
      params.set("temporalExtentStartDate", values.temporalExtentStartDate)
    }
    if (values.temporalExtentEndDate) {
      params.set("temporalExtentEndDate", values.temporalExtentEndDate)
    }
    if (values.frameworkType) {
      params.set("frameworkType", values.frameworkType)
    }
    if (values.datasetType) {
      params.set("datasetType", values.datasetType)
    }

    // Add spatial search params
    if (values.useSpatialSearch) {
      params.set("useSpatialSearch", "true")
      if (values.bbox_north) params.set("bbox_north", values.bbox_north)
      if (values.bbox_south) params.set("bbox_south", values.bbox_south)
      if (values.bbox_east) params.set("bbox_east", values.bbox_east)
      if (values.bbox_west) params.set("bbox_west", values.bbox_west)
    }

    router.push(`/search?${params.toString()}`)
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
      form.setValue("bbox_north", bounds.north.toString())
      form.setValue("bbox_south", bounds.south.toString())
      form.setValue("bbox_east", bounds.east.toString())
      form.setValue("bbox_west", bounds.west.toString())
      form.setValue("useSpatialSearch", true)
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
                      name="temporalExtentStartDate"
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
                      name="temporalExtentEndDate"
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
                      name="frameworkType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Framework Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Any Framework Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {/* <SelectItem value="">All Framework Types</SelectItem> */}
                              {frameworkTypeEnum.enumValues.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Filter by framework type
                          </FormDescription>
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
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Any Dataset Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {/* <SelectItem value="">All Dataset Types</SelectItem> */}
                              {datasetTypeEnum.enumValues.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Filter by dataset type
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
                            form.watch("bbox_north") &&
                            form.watch("bbox_south") &&
                            form.watch("bbox_east") &&
                            form.watch("bbox_west")
                              ? {
                                  north: parseFloat(
                                    form.watch("bbox_north") || "0"
                                  ),
                                  south: parseFloat(
                                    form.watch("bbox_south") || "0"
                                  ),
                                  east: parseFloat(
                                    form.watch("bbox_east") || "0"
                                  ),
                                  west: parseFloat(
                                    form.watch("bbox_west") || "0"
                                  )
                                }
                              : undefined
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <FormField
                          control={form.control}
                          name="bbox_north"
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
                          name="bbox_south"
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
                          name="bbox_east"
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
                          name="bbox_west"
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
