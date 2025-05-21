"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SelectOrganization } from "@/db/schema"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

interface OrganizationSelectorProps {
  organizations: SelectOrganization[]
  currentOrgId?: string
  queryParamName?: string
}

export default function OrganizationSelector({
  organizations,
  currentOrgId,
  queryParamName = "orgId"
}: OrganizationSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleValueChange = (orgId: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    if (orgId) {
      current.set(queryParamName, orgId)
    } else {
      current.delete(queryParamName)
    }
    const query = current.toString()
    router.push(`/app/(node-officer)/officer-dashboard?${query}`)
  }

  if (!organizations || organizations.length === 0) {
    return null // Or some placeholder if only one org or no orgs
  }

  return (
    <div className="mb-4 max-w-xs">
      <Select onValueChange={handleValueChange} defaultValue={currentOrgId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an organization..." />
        </SelectTrigger>
        <SelectContent>
          {organizations.map(org => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
