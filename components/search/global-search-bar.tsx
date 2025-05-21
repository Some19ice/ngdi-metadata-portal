"use client"

import { Input } from "@/components/ui/input"
import { SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function GlobalSearchBar() {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative flex items-center">
      <Input
        type="search"
        placeholder="Search metadata, content..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full rounded-md border py-2 pl-10 pr-4 md:w-64 lg:w-96"
      />
      <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
    </form>
  )
}
