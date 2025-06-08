"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchIcon, MapPin, FileText, Newspaper, BookOpen } from "lucide-react"
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
  FormLabel
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

const searchFormSchema = z.object({
  q: z.string().min(1, "Please enter a search term"),
  type: z.string().default("auto")
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

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      q: initialQuery,
      type: initialType
    }
  })

  function onSubmit(values: SearchFormValues) {
    const params = new URLSearchParams()
    params.set("q", values.q)
    params.set("type", values.type)
    router.push(`/search?${params.toString()}`)
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
                      placeholder={getSearchTypePlaceholder(form.watch("type"))}
                      {...field}
                      className="pl-10"
                    />
                  </div>
                </FormControl>
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
                    defaultValue={field.value}
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
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full md:w-auto">
            <SearchIcon className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Search Type Description */}
        <div className="text-sm text-muted-foreground">
          {form.watch("type") === "auto" && (
            <p>
              Intelligent search that automatically detects whether you're
              searching for locations, datasets, or other content.
            </p>
          )}
          {form.watch("type") === "location" && (
            <p>
              Find Nigerian cities, states, regions, coordinates, and other
              geographic locations.
            </p>
          )}
          {form.watch("type") === "metadata" && (
            <p>Search geospatial datasets, maps, and data services.</p>
          )}
          {form.watch("type") === "news" && (
            <p>Find news articles and announcements from the NGDI portal.</p>
          )}
          {form.watch("type") === "docs" && (
            <p>Search documentation, guides, and help articles.</p>
          )}
        </div>
      </form>
    </Form>
  )
}
