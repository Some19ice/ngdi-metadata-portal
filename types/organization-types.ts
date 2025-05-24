import { SelectOrganization, InsertOrganization } from "@/db/schema"
import { SelectUserOrganization, InsertUserOrganization } from "@/db/schema"

// Re-export database types for convenience
export type { SelectOrganization, InsertOrganization }
export type { SelectUserOrganization, InsertUserOrganization }

// Organization status types
export type OrganizationStatus =
  | "active"
  | "inactive"
  | "pending_approval"
  | "suspended"

// Organization with user role information
export interface OrganizationWithUserRole extends SelectOrganization {
  userRole?: string | null
  userCount?: number
  metadataRecordCount?: number
}

// Organization form data types
export interface OrganizationFormData {
  name: string
  description?: string | null
  primaryContactName?: string | null
  primaryContactEmail?: string | null
  primaryContactPhone?: string | null
  website?: string | null
  address?: string | null
  status: OrganizationStatus
}

// Organization list item for admin interface
export interface OrganizationListItem extends SelectOrganization {
  memberCount?: number
  activeMetadataRecords?: number
  lastActivity?: Date | null
}

// Organization search and filter types
export interface OrganizationSearchParams {
  query?: string
  status?: OrganizationStatus
  sortBy?: "name" | "createdAt" | "updatedAt" | "memberCount"
  sortOrder?: "asc" | "desc"
  page?: number
  pageSize?: number
}

// Organization statistics
export interface OrganizationStats {
  totalOrganizations: number
  activeOrganizations: number
  pendingOrganizations: number
  suspendedOrganizations: number
  totalMembers: number
  totalMetadataRecords: number
}
