"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LandingSearchForm() {
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const input = e.currentTarget.querySelector(
      'input[type="search"]'
    ) as HTMLInputElement
    if (input.value.trim()) {
      router.push(`/search?q=${encodeURIComponent(input.value.trim())}`)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4">
      <div className="bg-white rounded-xl shadow-xl p-6">
        <h2 className="mb-6 text-center text-2xl font-semibold">
          Find Geospatial Resources
        </h2>
        <form
          className="flex flex-col md:flex-row items-center gap-4"
          onSubmit={handleSubmit}
        >
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search for datasets, maps, and more..."
              type="search"
            />
          </div>
          <Button type="submit" className="w-full md:w-auto">
            Search
          </Button>
        </form>
        <div className="mt-4 text-sm text-center text-gray-500">
          Popular:
          <Link
            href="/search?q=climate&type=metadata"
            className="ml-2 text-blue-600 hover:underline"
          >
            Climate Data
          </Link>
          ,
          <Link
            href="/search?q=transportation&type=metadata"
            className="ml-2 text-blue-600 hover:underline"
          >
            Transportation
          </Link>
          ,
          <Link
            href="/search?q=population&type=metadata"
            className="ml-2 text-blue-600 hover:underline"
          >
            Population
          </Link>
        </div>
      </div>
    </div>
  )
}
