"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchIcon } from "lucide-react"
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
  type: z.string().default("metadata")
})

type SearchFormValues = z.infer<typeof searchFormSchema>

interface CentralSearchFormProps {
  initialQuery?: string
  initialType?: string
}

export default function CentralSearchForm({
  initialQuery = "",
  initialType = "metadata"
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
                      placeholder="Search term..."
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
                      <SelectValue placeholder="Search in..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metadata">Metadata</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="docs">Documentation</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full md:w-auto">
            Search
          </Button>
        </div>
      </form>
    </Form>
  )
}
