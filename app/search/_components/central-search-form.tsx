"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  SearchIcon,
  MapPin,
  FileText,
  Newspaper,
  BookOpen,
  Loader2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
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
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "@/hooks/use-toast"
import { generateSearchUrl } from "@/lib/utils/search-params-utils"
import { MetadataSearchFilters } from "@/types"

const searchFormSchema = z.object({
  q: z
    .string()
    .min(1, "Please enter a search term")
    .min(2, "Search term must be at least 2 characters")
    .max(100, "Search term cannot exceed 100 characters")
    .transform(val => val.trim()),
  type: z.enum(["auto", "location", "metadata", "news", "docs"]).default("auto")
})

type SearchFormValues = z.infer<typeof searchFormSchema>

interface CentralSearchFormProps {
  initialQuery?: string
  initialType?: string
}

export default function CentralSearchForm({
  initialQuery = "",
  initialType = "auto"
}: CentralSearchFormProps) {
  const router = useRouter()
  const [isSearching, setIsSearching] = useState(false)

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      q: initialQuery,
      type:
        initialType === "location" ||
        initialType === "metadata" ||
        initialType === "news" ||
        initialType === "docs"
          ? initialType
          : "auto"
    }
  })

  async function onSubmit(values: SearchFormValues) {
    try {
      setIsSearching(true)

      // Validate that we have a proper search term
      if (!values.q || values.q.trim().length === 0) {
        toast({
          title: "Invalid Search",
          description: "Please enter a valid search term",
          variant: "destructive"
        })
        return
      }

      const searchQuery = values.q.trim()

      // Route based on search type
      if (values.type === "metadata") {
        // Direct route to metadata search with standardized parameters
        const searchFilters: MetadataSearchFilters = { query: searchQuery }
        const url = generateSearchUrl(searchFilters, "/metadata/search")
        router.push(url)
      } else if (values.type === "location") {
        // Route to map search
        router.push(`/map?search=${encodeURIComponent(searchQuery)}`)
      } else {
        // Route to central search for other types (news, docs, auto)
        const params = new URLSearchParams()
        params.set("q", searchQuery)
        if (values.type !== "auto") {
          params.set("type", values.type)
        }
        router.push(`/search?${params.toString()}`)
      }
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Search Error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  const getSearchTypeIcon = (type: string) => {
    switch (type) {
      case "location":
        return <MapPin className="h-4 w-4" />
      case "metadata":
        return <FileText className="h-4 w-4" />
      case "news":
        return <Newspaper className="h-4 w-4" />
      case "docs":
        return <BookOpen className="h-4 w-4" />
      default:
        return <SearchIcon className="h-4 w-4" />
    }
  }

  const getSearchTypePlaceholder = (type: string) => {
    switch (type) {
      case "location":
        return "Search for cities, states, regions..."
      case "metadata":
        return "Search datasets, maps, services..."
      case "news":
        return "Search news and announcements..."
      case "docs":
        return "Search documentation and guides..."
      default:
        return "Search locations, datasets, and more..."
    }
  }

  const currentType = form.watch("type")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <FormField
            control={form.control}
            name="q"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder={getSearchTypePlaceholder(currentType)}
                      {...field}
                      className="pl-10"
                      disabled={isSearching}
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="w-full md:w-48">
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSearching}
                  >
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        {getSearchTypeIcon(field.value)}
                        <SelectValue placeholder="Search in..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        <div className="flex items-center gap-2">
                          <SearchIcon className="h-4 w-4" />
                          <span>Smart Search</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="location">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>Locations</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="metadata">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Datasets</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="news">
                        <div className="flex items-center gap-2">
                          <Newspaper className="h-4 w-4" />
                          <span>News</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="docs">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>Documentation</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={isSearching}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <SearchIcon className="h-4 w-4 mr-2" />
            )}
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {/* Search Type Description */}
        <div className="text-sm text-muted-foreground">
          {currentType === "auto" && (
            <p>
              Intelligent search that automatically detects whether you're
              searching for locations, datasets, or other content.
            </p>
          )}
          {currentType === "location" && (
            <p>
              Find Nigerian cities, states, regions, coordinates, and other
              geographic locations.
            </p>
          )}
          {currentType === "metadata" && (
            <p>Search geospatial datasets, maps, and data services.</p>
          )}
          {currentType === "news" && (
            <p>Find news articles and announcements from the NGDI portal.</p>
          )}
          {currentType === "docs" && (
            <p>Search documentation, guides, and help articles.</p>
          )}
        </div>
      </form>
    </Form>
  )
}
