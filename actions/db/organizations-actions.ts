"use server"

import { db } from "@/db/db"
import {
  InsertOrganization,
  SelectOrganization,
  organizationsTable,
  organizationStatusEnum
} from "@/db/schema/organizations-schema"
import { ActionState } from "@/types"
import { auth } from "@clerk/nextjs/server"
import { eq, desc, and, count, sql, asc, ilike, or, inArray } from "drizzle-orm"
import { hasPermission, checkUserRole, requiresSystemAdmin } from "@/lib/rbac"
import {
  userOrganizationsTable,
  userRolesTable,
  rolesTable,
  profilesTable,
  metadataRecordsTable
} from "@/db/schema"
import { createAuditLogAction, CreateAuditLogInput } from "../audit-log-actions"
import { clerkClient } from "@clerk/nextjs/server"
import { AdminOrganizationView } from "@/db/schema/organizations-schema"
// Import caching utilities
import {
  organizationCache,
  userOrganizationCache,
  organizationStatsCache,
  CacheKeys,
  CacheInvalidation,
  withCache
} from "@/lib/cache"

// ====== VALIDATION UTILITIES AND BUSINESS RULES ======

/**
 * Validates email format using a comprehensive regex pattern
 */
function validateEmail(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email)
}

/**
 * Validates URL format
 */
function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validates phone number format (supports various international formats)
 */
function validatePhoneNumber(phone: string): boolean {
  // Remove spaces, dashes, parentheses, plus signs
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "")
  // Allow 7-15 digits (international standard)
  const phoneRegex = /^\d{7,15}$/
  return phoneRegex.test(cleaned)
}

/**
 * Validates organization name according to business rules
 */
function validateOrganizationName(name: string): {
  isValid: boolean
  error?: string
} {
  if (!name || typeof name !== "string") {
    return { isValid: false, error: "Organization name is required" }
  }

  const trimmedName = name.trim()

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: "Organization name must be at least 2 characters long"
    }
  }

  if (trimmedName.length > 200) {
    return {
      isValid: false,
      error: "Organization name must not exceed 200 characters"
    }
  }

  // Check for potentially problematic characters
  const invalidChars = /[<>{}[\]\\]/
  if (invalidChars.test(trimmedName)) {
    return {
      isValid: false,
      error: "Organization name contains invalid characters"
    }
  }

  return { isValid: true }
}

/**
 * Comprehensive validation for organization data
 */
function validateOrganizationData(data: Partial<InsertOrganization>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate required name field
  if ("name" in data) {
    const nameValidation = validateOrganizationName(data.name || "")
    if (!nameValidation.isValid) {
      errors.push(nameValidation.error!)
    }
  }

  // Validate email if provided
  if (data.primaryContactEmail) {
    if (!validateEmail(data.primaryContactEmail)) {
      errors.push("Invalid primary contact email format")
    }
  }

  // Validate phone if provided
  if (data.primaryContactPhone) {
    if (!validatePhoneNumber(data.primaryContactPhone)) {
      errors.push("Invalid primary contact phone number format")
    }
  }

  // Validate website URL if provided
  if (data.websiteUrl) {
    if (!validateUrl(data.websiteUrl)) {
      errors.push("Invalid website URL format")
    }
  }

  // Validate logo URL if provided
  if (data.logoUrl) {
    if (!validateUrl(data.logoUrl)) {
      errors.push("Invalid logo URL format")
    }
  }

  // Validate description length if provided
  if (data.description && data.description.length > 1000) {
    errors.push("Description must not exceed 1000 characters")
  }

  // Validate address length if provided
  if (data.address && data.address.length > 500) {
    errors.push("Address must not exceed 500 characters")
  }

  // Validate primary contact name length if provided
  if (data.primaryContactName && data.primaryContactName.length > 100) {
    errors.push("Primary contact name must not exceed 100 characters")
  }

  // Validate status enum if provided
  if (
    data.status &&
    !organizationStatusEnum.enumValues.includes(data.status as any)
  ) {
    errors.push(
      `Invalid status. Must be one of: ${organizationStatusEnum.enumValues.join(", ")}`
    )
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Checks for duplicate or similar organization names
 * Uses exact match (case-insensitive) and similarity algorithms
 */
async function checkDuplicateOrganizationName(
  name: string,
  excludeId?: string
): Promise<boolean> {
  const trimmedName = name.trim()

  // First check for exact match (case-insensitive)
  let exactQuery = db
    .select({ id: organizationsTable.id, name: organizationsTable.name })
    .from(organizationsTable)
    .where(ilike(organizationsTable.name, trimmedName))

  const exactMatches = await exactQuery

  // If we're updating an organization, exclude its own ID from the duplicate check
  if (excludeId) {
    const hasExactDuplicate = exactMatches.some(org => org.id !== excludeId)
    if (hasExactDuplicate) return true
  } else if (exactMatches.length > 0) {
    return true
  }

  // Now check for similar names using various techniques
  const allOrganizations = await db
    .select({ id: organizationsTable.id, name: organizationsTable.name })
    .from(organizationsTable)

  // Filter out the current organization if updating
  const orgsToCheck = excludeId
    ? allOrganizations.filter(org => org.id !== excludeId)
    : allOrganizations

  // Check for similarity
  const normalizedNewName = normalizeName(trimmedName)

  for (const org of orgsToCheck) {
    const normalizedExistingName = normalizeName(org.name)

    // Check for very similar names
    if (areNamesSimilar(normalizedNewName, normalizedExistingName)) {
      return true
    }

    // Check for common government/official variations
    if (areGovernmentNamesSimilar(trimmedName, org.name)) {
      return true
    }
  }

  return false
}

/**
 * Normalizes organization names for comparison
 * Removes common words, punctuation, and standardizes spacing
 */
function normalizeName(name: string): string {
  // Common words to remove for comparison
  const stopWords = [
    "the",
    "of",
    "and",
    "for",
    "nigeria",
    "nigerian",
    "federal",
    "national"
  ]

  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .join(" ")
    .trim()
}

/**
 * Checks if two normalized names are similar using various techniques
 */
function areNamesSimilar(name1: string, name2: string): boolean {
  // If normalized names are identical
  if (name1 === name2) return true

  // Check if one name contains all significant words from the other
  const words1 = name1.split(" ")
  const words2 = name2.split(" ")

  // If all words from shorter name are in longer name
  const shorterWords = words1.length < words2.length ? words1 : words2
  const longerWords = words1.length < words2.length ? words2 : words1

  if (shorterWords.every(word => longerWords.includes(word))) {
    return true
  }

  // Levenshtein distance check for very similar names
  const distance = levenshteinDistance(name1, name2)
  const maxLength = Math.max(name1.length, name2.length)
  const similarity = 1 - distance / maxLength

  // If names are 80% similar or more
  return similarity >= 0.8
}

/**
 * Special check for government organization name variations
 */
function areGovernmentNamesSimilar(name1: string, name2: string): boolean {
  const govPatterns = [
    { pattern: /ministry\s+of\s+(\w+)/i, type: "ministry" },
    { pattern: /(\w+)\s+ministry/i, type: "ministry" },
    { pattern: /department\s+of\s+(\w+)/i, type: "department" },
    { pattern: /(\w+)\s+department/i, type: "department" },
    { pattern: /(\w+)\s+agency/i, type: "agency" },
    { pattern: /(\w+)\s+commission/i, type: "commission" },
    { pattern: /(\w+)\s+board/i, type: "board" },
    { pattern: /(\w+)\s+authority/i, type: "authority" }
  ]

  let type1 = null,
    keyword1 = null
  let type2 = null,
    keyword2 = null

  // Extract type and keyword from both names
  for (const { pattern, type } of govPatterns) {
    const match1 = name1.match(pattern)
    const match2 = name2.match(pattern)

    if (match1) {
      type1 = type
      keyword1 = match1[1].toLowerCase()
    }
    if (match2) {
      type2 = type
      keyword2 = match2[1].toLowerCase()
    }
  }

  // If both are government entities of the same type with similar keywords
  if (type1 && type1 === type2 && keyword1 && keyword2) {
    return keyword1 === keyword2 || levenshteinDistance(keyword1, keyword2) <= 2
  }

  return false
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        )
      }
    }
  }

  return dp[m][n]
}

/**
 * Business rule: Validates node officer assignment
 */
async function validateNodeOfficerAssignment(
  userId: string,
  organizationId: string
): Promise<{ isValid: boolean; error?: string }> {
  // Check if user exists and is active
  try {
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    if (!clerkUser) {
      return {
        isValid: false,
        error: "User not found in authentication system"
      }
    }
  } catch (error) {
    return {
      isValid: false,
      error: "Failed to validate user in authentication system"
    }
  }

  // Check if user has Node Officer role in the system
  const hasNodeOfficerRole = await checkUserRole(userId, "Node Officer")
  if (!hasNodeOfficerRole) {
    return {
      isValid: false,
      error: "User does not have Node Officer role in the system"
    }
  }

  // Check if user is already assigned to another organization as Node Officer
  const existingAssignments = await db.query.userOrganizations.findMany({
    where: and(
      eq(userOrganizationsTable.userId, userId),
      eq(userOrganizationsTable.role, "Node Officer")
    )
  })

  // Filter out the current organization if we're updating
  const otherOrgAssignments = existingAssignments.filter(
    assignment => assignment.organizationId !== organizationId
  )

  if (otherOrgAssignments.length > 0) {
    return {
      isValid: false,
      error:
        "User is already assigned as Node Officer to another organization. A user can only be Node Officer for one organization at a time."
    }
  }

  return { isValid: true }
}

/**
 * Business rule: Prevents removal of the last Node Officer from an organization
 */
async function validateNodeOfficerRemoval(
  organizationId: string,
  userIdToRemove: string
): Promise<{ isValid: boolean; error?: string }> {
  const nodeOfficers = await db.query.userOrganizations.findMany({
    where: and(
      eq(userOrganizationsTable.organizationId, organizationId),
      eq(userOrganizationsTable.role, "Node Officer")
    )
  })

  // If there's only one Node Officer and it's the one being removed, prevent it
  if (nodeOfficers.length === 1 && nodeOfficers[0].userId === userIdToRemove) {
    return {
      isValid: false,
      error:
        "Cannot remove the last Node Officer from an organization. Assign another Node Officer first."
    }
  }

  return { isValid: true }
}

/**
 * Sanitizes text input by trimming and preventing XSS
 */
function sanitizeTextInput(text: string | null | undefined): string | null {
  if (!text) return null

  const trimmed = text.trim()
  if (!trimmed) return null

  // Basic XSS prevention - remove any HTML tags
  const sanitized = trimmed.replace(/<[^>]*>/g, "")

  return sanitized
}

/**
 * Comprehensive input sanitization for organization data
 */
function sanitizeOrganizationData(
  data: Partial<InsertOrganization>
): Partial<InsertOrganization> {
  const sanitized: Partial<InsertOrganization> = {}

  if (data.name) sanitized.name = sanitizeTextInput(data.name) || undefined
  if (data.description)
    sanitized.description = sanitizeTextInput(data.description)
  if (data.primaryContactName)
    sanitized.primaryContactName = sanitizeTextInput(data.primaryContactName)
  if (data.primaryContactEmail)
    sanitized.primaryContactEmail = data.primaryContactEmail
      .trim()
      .toLowerCase()
  if (data.primaryContactPhone)
    sanitized.primaryContactPhone = sanitizeTextInput(data.primaryContactPhone)
  if (data.websiteUrl) sanitized.websiteUrl = data.websiteUrl.trim()
  if (data.address) sanitized.address = sanitizeTextInput(data.address)
  if (data.logoUrl) sanitized.logoUrl = data.logoUrl.trim()
  if (data.status) sanitized.status = data.status
  if (data.nodeOfficerId) sanitized.nodeOfficerId = data.nodeOfficerId

  return sanitized
}

// ====== END VALIDATION UTILITIES ======

/**
 * Creates a new organization in the system.
 * Requires 'create' permission on 'organizations'.
 * Automatically creates an audit log entry upon successful creation.
 *
 * @param data - Organization data conforming to InsertOrganization type
 * @param data.name - Required organization name
 * @param data.description - Optional organization description
 * @param data.primaryContactName - Optional primary contact name
 * @param data.primaryContactEmail - Optional primary contact email
 * @param data.primaryContactPhone - Optional primary contact phone
 * @param data.websiteUrl - Optional website URL
 * @param data.address - Optional organization address
 * @param data.logoUrl - Optional logo URL
 * @param data.nodeOfficerId - Optional Node Officer ID (Clerk user ID)
 * @param data.status - Optional status (defaults to 'active')
 *
 * @returns Promise resolving to ActionState containing the created organization or error
 *
 * @example
 * ```typescript
 * const result = await createOrganizationAction({
 *   name: "Nigerian Geological Survey Agency",
 *   description: "National geological survey organization",
 *   primaryContactEmail: "contact@ngsa.gov.ng",
 *   status: "active"
 * });
 *
 * if (result.isSuccess) {
 *   console.log("Created organization:", result.data.name);
 * }
 * ```
 */
export async function createOrganizationAction(
  organization: InsertOrganization
): Promise<ActionState<SelectOrganization>> {
  try {
    // Get the current user
    const { userId } = await auth()

    if (!userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Check permissions - use "manage" instead of "create" since that's what's defined in the system
    const canCreate = await hasPermission(userId, "manage", "organizations")
    if (!canCreate) {
      return {
        isSuccess: false,
        message: "Forbidden: Insufficient permissions"
      }
    }

    // Validate organization data
    const validation = validateOrganizationData(organization)
    if (!validation.isValid) {
      return {
        isSuccess: false,
        message: `Validation failed: ${validation.errors.join(", ")}`
      }
    }

    // Sanitize the organization data
    const sanitizedData = sanitizeOrganizationData(organization)

    // Check for duplicate organization name (case-insensitive)
    const isDuplicate = await checkDuplicateOrganizationName(organization.name)
    if (isDuplicate) {
      return {
        isSuccess: false,
        message:
          "An organization with this name or a very similar name already exists. Please choose a more distinctive name to avoid confusion."
      }
    }

    // Validate Node Officer assignment if provided
    if (sanitizedData.nodeOfficerId) {
      const nodeOfficerValidation = await validateNodeOfficerAssignment(
        sanitizedData.nodeOfficerId,
        "" // No existing organization ID for new organization
      )
      if (!nodeOfficerValidation.isValid) {
        return {
          isSuccess: false,
          message: `Node Officer assignment error: ${nodeOfficerValidation.error}`
        }
      }
    }

    // Create the organization data ensuring required fields are present
    const organizationData: InsertOrganization = {
      ...organization,
      ...sanitizedData,
      name: sanitizedData.name || organization.name // Ensure name is always present
    }

    // Create the organization
    const [newOrganization] = await db
      .insert(organizationsTable)
      .values(organizationData)
      .returning()

    // Create audit log entry for organization creation
    const auditLogData: CreateAuditLogInput = {
      actionCategory: "OrganizationManagement",
      actionType: "OrganizationCreated",
      targetEntityType: "Organization",
      targetEntityId: newOrganization.id,
      details: { organizationName: newOrganization.name }
    }
    await createAuditLogAction(auditLogData)

    return {
      isSuccess: true,
      message: "Organization created successfully",
      data: newOrganization
    }
  } catch (error) {
    console.error("Error creating organization:", error)
    return { isSuccess: false, message: "Failed to create organization" }
  }
}

/**
 * Retrieves a specific organization by its ID.
 * Requires 'view' permission on 'organizations' or System Administrator role.
 *
 * @param id - UUID of the organization to retrieve
 *
 * @returns Promise resolving to ActionState containing the organization data or null if not found
 *
 * @example
 * ```typescript
 * const result = await getOrganizationByIdAction("123e4567-e89b-12d3-a456-426614174000");
 *
 * if (result.isSuccess && result.data) {
 *   console.log("Organization:", result.data.name);
 * } else if (result.isSuccess && !result.data) {
 *   console.log("Organization not found");
 * }
 * ```
 */
export async function getOrganizationByIdAction(
  id: string
): Promise<ActionState<SelectOrganization | null>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }

  const canViewGlobally = await hasPermission(userId, "view", "organizations")

  const isSysAdmin = await checkUserRole(userId, "System Administrator")

  if (!canViewGlobally && !isSysAdmin) {
    return {
      isSuccess: false,
      message:
        "Forbidden: You do not have permission to view this organization directly by ID without broader view rights or admin privileges."
    }
  }

  try {
    if (!id) {
      return { isSuccess: false, message: "Organization ID is required." }
    }

    // Check cache first
    const cacheKey = CacheKeys.organization.byId(id)
    const cachedOrganization = organizationCache.get(cacheKey)

    if (cachedOrganization) {
      return {
        isSuccess: true,
        message: "Organization retrieved successfully (cached).",
        data: cachedOrganization
      }
    }

    const organization = await db.query.organizations.findFirst({
      where: eq(organizationsTable.id, id)
    })

    if (!organization) {
      return { isSuccess: true, message: "Organization not found.", data: null }
    }

    // Cache the organization for 10 minutes
    organizationCache.set(cacheKey, organization, 10 * 60 * 1000)

    return {
      isSuccess: true,
      message: "Organization retrieved successfully.",
      data: organization
    }
  } catch (error) {
    console.error("Error getting organization by ID:", error)
    return { isSuccess: false, message: "Failed to retrieve organization." }
  }
}

/**
 * Gets the total count of organizations in the system.
 * Requires System Administrator role.
 *
 * @returns Promise resolving to ActionState containing the total organization count
 *
 * @example
 * ```typescript
 * const result = await getOrganizationsCountAction();
 *
 * if (result.isSuccess) {
 *   console.log(`Total organizations: ${result.data}`);
 * }
 * ```
 */
export async function getOrganizationsCountAction(): Promise<
  ActionState<number>
> {
  const isSysAdmin = await requiresSystemAdmin()
  if (!isSysAdmin) {
    return {
      isSuccess: false,
      message: "Unauthorized. System admin rights required."
    }
  }

  try {
    // Check cache first
    const cacheKey = CacheKeys.organization.count()
    const cachedCount = organizationCache.get(cacheKey)

    if (cachedCount !== undefined) {
      return {
        isSuccess: true,
        message: "Organizations count retrieved successfully (cached).",
        data: cachedCount
      }
    }

    const result = await db.select({ value: count() }).from(organizationsTable)
    const numOrganizations = result[0]?.value || 0

    // Cache the count for 5 minutes
    organizationCache.set(cacheKey, numOrganizations, 5 * 60 * 1000)

    return {
      isSuccess: true,
      message: "Organizations count retrieved successfully.",
      data: numOrganizations
    }
  } catch (error) {
    console.error("Error getting organizations count:", error)
    return { isSuccess: false, message: "Failed to get organizations count." }
  }
}

/**
 * Parameters for filtering and paginating organization lists.
 */
interface GetOrganizationsParams {
  /** Maximum number of organizations to return (default: 10) */
  limit?: number
  /** Number of organizations to skip (default: 0) */
  offset?: number
  /** Filter by organization status */
  status?: (typeof organizationStatusEnum.enumValues)[number]
}

/**
 * Retrieves a list of organizations with optional filtering and pagination.
 * Requires 'view' permission on 'organizations'.
 * Results are ordered by creation date (newest first).
 *
 * @param params - Optional filtering and pagination parameters
 * @param params.limit - Maximum number of organizations to return (default: 10)
 * @param params.offset - Number of organizations to skip for pagination (default: 0)
 * @param params.status - Filter by organization status ('active', 'inactive', 'pending_approval')
 *
 * @returns Promise resolving to ActionState containing array of organizations
 *
 * @example
 * ```typescript
 * // Get first 20 active organizations
 * const result = await getOrganizationsAction({
 *   limit: 20,
 *   offset: 0,
 *   status: "active"
 * });
 *
 * if (result.isSuccess) {
 *   result.data.forEach(org => console.log(org.name));
 * }
 * ```
 */
export async function getOrganizationsAction(
  params: GetOrganizationsParams = {}
): Promise<ActionState<SelectOrganization[]>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }
  const canViewList = await hasPermission(userId, "view", "organizations")
  if (!canViewList) {
    return {
      isSuccess: false,
      message: "Forbidden: You do not have permission to list organizations."
    }
  }

  const { limit = 10, offset = 0, status } = params

  try {
    // Create cache key based on parameters
    const paramsString = JSON.stringify({ limit, offset, status })
    const cacheKey = CacheKeys.organization.list(paramsString)

    // Check cache first
    const cachedOrganizations = organizationCache.get(cacheKey)
    if (cachedOrganizations) {
      return {
        isSuccess: true,
        message: "Organizations retrieved successfully (cached).",
        data: cachedOrganizations
      }
    }

    const queryOptions = {
      orderBy: [desc(organizationsTable.createdAt)],
      limit: limit,
      offset: offset,
      where: status ? eq(organizationsTable.status, status) : undefined
    }

    const organizations = await db.query.organizations.findMany(queryOptions)

    // Cache the results for 3 minutes (shorter since this is paginated data)
    organizationCache.set(cacheKey, organizations, 3 * 60 * 1000)

    return {
      isSuccess: true,
      message: "Organizations retrieved successfully.",
      data: organizations
    }
  } catch (error) {
    console.error("Error getting organizations:", error)
    return { isSuccess: false, message: "Failed to retrieve organizations." }
  }
}

/**
 * Updates an existing organization's information.
 * Requires 'manage' permission on 'organizations'.
 * Automatically updates the 'updatedAt' timestamp and creates an audit log entry.
 *
 * @param id - UUID of the organization to update
 * @param data - Partial organization data to update (cannot update ID)
 *
 * @returns Promise resolving to ActionState containing the updated organization or error
 *
 * @example
 * ```typescript
 * const result = await updateOrganizationAction(
 *   "123e4567-e89b-12d3-a456-426614174000",
 *   {
 *     name: "Updated Organization Name",
 *     primaryContactEmail: "newemail@example.com",
 *     status: "active"
 *   }
 * );
 *
 * if (result.isSuccess) {
 *   console.log("Updated organization:", result.data.name);
 * }
 * ```
 */
export async function updateOrganizationAction(
  id: string,
  data: Partial<Omit<InsertOrganization, "id">>
): Promise<ActionState<SelectOrganization>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }
  const canManage = await hasPermission(userId, "manage", "organizations")
  if (!canManage) {
    return {
      isSuccess: false,
      message:
        "Forbidden: You do not have permission to update this organization."
    }
  }

  try {
    if (!id) {
      return {
        isSuccess: false,
        message: "Organization ID is required for update."
      }
    }
    if (Object.keys(data).length === 0) {
      return { isSuccess: false, message: "No data provided for update." }
    }

    // Sanitize input data
    const sanitizedData = sanitizeOrganizationData(data)

    // Validate input data
    const validation = validateOrganizationData(sanitizedData)
    if (!validation.isValid) {
      return {
        isSuccess: false,
        message: `Validation failed: ${validation.errors.join(", ")}`
      }
    }

    // Check for duplicate organization name if name is being updated
    if (sanitizedData.name) {
      const isDuplicate = await checkDuplicateOrganizationName(
        sanitizedData.name,
        id
      )
      if (isDuplicate) {
        return {
          isSuccess: false,
          message:
            "An organization with this name or a very similar name already exists. Please choose a more distinctive name to avoid confusion."
        }
      }
    }

    // Validate Node Officer assignment if provided
    if (sanitizedData.nodeOfficerId) {
      const nodeOfficerValidation = await validateNodeOfficerAssignment(
        sanitizedData.nodeOfficerId,
        id
      )
      if (!nodeOfficerValidation.isValid) {
        return {
          isSuccess: false,
          message: `Node Officer assignment error: ${nodeOfficerValidation.error}`
        }
      }
    }

    const [updatedOrganization] = await db
      .update(organizationsTable)
      .set({
        ...sanitizedData,
        updatedAt: new Date() // Explicitly set updatedAt
      })
      .where(eq(organizationsTable.id, id))
      .returning()

    if (!updatedOrganization) {
      return {
        isSuccess: false,
        message: "Organization not found or failed to update."
      }
    }

    // Create audit log entry for organization update
    const auditLogData: CreateAuditLogInput = {
      actionCategory: "OrganizationManagement",
      actionType: "OrganizationUpdated",
      targetEntityType: "Organization",
      targetEntityId: updatedOrganization.id,
      details: { updatedFields: Object.keys(data) } // Log which fields were part of the update operation
    }
    await createAuditLogAction(auditLogData)

    return {
      isSuccess: true,
      message: "Organization updated successfully.",
      data: updatedOrganization
    }
  } catch (error) {
    console.error("Error updating organization:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to update organization: ${errorMessage}`
    }
  }
}

/**
 * Permanently deletes an organization and handles cascade operations.
 * Requires 'manage' permission on 'organizations'.
 *
 * ⚠️ **DESTRUCTIVE OPERATION**: This will:
 * - CASCADE DELETE all user-organization associations
 * - SET NULL the organizationId in all related metadata records (orphaning them)
 * - Create an audit log entry with details of affected records
 *
 * @param id - UUID of the organization to delete
 *
 * @returns Promise resolving to ActionState with success/failure status and affected record counts
 *
 * @example
 * ```typescript
 * const result = await deleteOrganizationAction("123e4567-e89b-12d3-a456-426614174000");
 *
 * if (result.isSuccess) {
 *   console.log(result.message); // Shows counts of affected records
 * } else {
 *   console.error("Failed to delete:", result.message);
 * }
 * ```
 */
export async function deleteOrganizationAction(
  id: string
): Promise<ActionState<void>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }
  const canManage = await hasPermission(userId, "manage", "organizations")
  if (!canManage) {
    return {
      isSuccess: false,
      message:
        "Forbidden: You do not have permission to delete this organization."
    }
  }

  try {
    if (!id) {
      return {
        isSuccess: false,
        message: "Organization ID is required for deletion."
      }
    }

    // First, get organization details for audit logging
    const organizationToDelete = await db.query.organizations.findFirst({
      where: eq(organizationsTable.id, id)
    })

    if (!organizationToDelete) {
      return {
        isSuccess: false,
        message: "Organization not found."
      }
    }

    // Get related data counts for audit logging
    const userAssociations = await db.query.userOrganizations.findMany({
      where: eq(userOrganizationsTable.organizationId, id)
    })

    const metadataRecords = await db.query.metadataRecords.findMany({
      where: eq(metadataRecordsTable.organizationId, id),
      columns: { id: true, title: true }
    })

    // Create audit log entry before deletion
    const auditLogData: CreateAuditLogInput = {
      actionCategory: "OrganizationManagement",
      actionType: "OrganizationDeleted",
      targetEntityType: "Organization",
      targetEntityId: id,
      details: {
        organizationName: organizationToDelete.name,
        affectedUserAssociations: userAssociations.length,
        affectedMetadataRecords: metadataRecords.length,
        metadataRecordsToBeOrphaned: metadataRecords.map(r => ({
          id: r.id,
          title: r.title
        }))
      }
    }
    await createAuditLogAction(auditLogData)

    // Perform the deletion - cascade deletes will handle related records
    // - user_organizations will be CASCADE deleted
    // - metadata_records organizationId will be SET NULL
    const result = await db
      .delete(organizationsTable)
      .where(eq(organizationsTable.id, id))
      .returning({ deletedId: organizationsTable.id })

    if (result.length === 0 || !result[0].deletedId) {
      return {
        isSuccess: false,
        message: "Organization not found or failed to delete."
      }
    }

    return {
      isSuccess: true,
      message: `Organization deleted successfully. ${userAssociations.length} user associations removed. ${metadataRecords.length} metadata records orphaned (organization reference set to null).`,
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting organization:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return {
      isSuccess: false,
      message: `Failed to delete organization: ${errorMessage}`
    }
  }
}

// --- Get Managed Organizations Action (For Node Officers) ---
export async function getManagedOrganizationsAction(): Promise<
  ActionState<SelectOrganization[]>
> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }

  // Optional: Check if the user even has the Node Officer role globally,
  // though the main check is the join for isNodeOfficer = true.
  // const isNO = await checkUserRole(userId, "Node Officer");
  // if (!isNO) {
  //   return { isSuccess: true, message: "User is not a Node Officer.", data: [] };
  // }

  try {
    // Check cache first
    const cacheKey = CacheKeys.organization.managed(userId)
    const cachedManagedOrgs = userOrganizationCache.get(cacheKey)

    if (cachedManagedOrgs) {
      return {
        isSuccess: true,
        message: "Managed organizations retrieved successfully (cached).",
        data: cachedManagedOrgs
      }
    }

    const managedOrganizations = await db
      .select({
        id: organizationsTable.id,
        name: organizationsTable.name,
        description: organizationsTable.description,
        primaryContactName: organizationsTable.primaryContactName,
        primaryContactEmail: organizationsTable.primaryContactEmail,
        primaryContactPhone: organizationsTable.primaryContactPhone,
        websiteUrl: organizationsTable.websiteUrl,
        address: organizationsTable.address,
        logoUrl: organizationsTable.logoUrl,
        nodeOfficerId: organizationsTable.nodeOfficerId,
        status: organizationsTable.status,
        createdAt: organizationsTable.createdAt,
        updatedAt: organizationsTable.updatedAt
      })
      .from(organizationsTable)
      .innerJoin(
        userOrganizationsTable,
        eq(organizationsTable.id, userOrganizationsTable.organizationId)
      )
      .where(
        and(
          eq(userOrganizationsTable.userId, userId),
          eq(userOrganizationsTable.role, "Node Officer")
        )
      )
      .orderBy(desc(organizationsTable.name))

    // Cache the managed organizations for 5 minutes
    userOrganizationCache.set(cacheKey, managedOrganizations, 5 * 60 * 1000)

    return {
      isSuccess: true,
      message: "Managed organizations retrieved successfully.",
      data: managedOrganizations
    }
  } catch (error) {
    console.error("Error getting managed organizations:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve managed organizations."
    }
  }
}

// --- Enhanced Get Organizations Admin Action with advanced filtering ---
interface GetOrganizationsAdminOptions {
  page?: number
  limit?: number
  searchTerm?: string
  status?: (typeof organizationStatusEnum.enumValues)[number]
  sortBy?: "name" | "createdAt" | "memberCount" | "status"
  sortOrder?: "asc" | "desc"
  nodeOfficerId?: string
}

export async function getOrganizationsAdminAction(
  options: GetOrganizationsAdminOptions = {}
): Promise<
  ActionState<{ organizations: AdminOrganizationView[]; totalCount: number }>
> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }

  const isAdmin = await hasPermission(userId, "manage", "organizations")
  if (!isAdmin) {
    return {
      isSuccess: false,
      message:
        "Forbidden: Admin privileges required to view detailed organization data."
    }
  }

  try {
    const {
      page = 1,
      limit = 10,
      searchTerm = "",
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      nodeOfficerId
    } = options

    const offset = (page - 1) * limit

    // Build base query for organizations
    let query = db
      .select({
        id: organizationsTable.id,
        name: organizationsTable.name,
        description: organizationsTable.description,
        primaryContactName: organizationsTable.primaryContactName,
        primaryContactEmail: organizationsTable.primaryContactEmail,
        primaryContactPhone: organizationsTable.primaryContactPhone,
        websiteUrl: organizationsTable.websiteUrl,
        address: organizationsTable.address,
        logoUrl: organizationsTable.logoUrl,
        nodeOfficerId: organizationsTable.nodeOfficerId,
        status: organizationsTable.status,
        createdAt: organizationsTable.createdAt,
        updatedAt: organizationsTable.updatedAt,
        memberCount: sql<number>`COUNT(DISTINCT ${userOrganizationsTable.userId})`
      })
      .from(organizationsTable)
      .leftJoin(
        userOrganizationsTable,
        eq(userOrganizationsTable.organizationId, organizationsTable.id)
      )
      .groupBy(organizationsTable.id)
      .$dynamic()

    // Apply filters
    const conditions = []

    // Search term filter (name or description)
    if (searchTerm) {
      conditions.push(
        or(
          ilike(organizationsTable.name, `%${searchTerm}%`),
          ilike(organizationsTable.description || "", `%${searchTerm}%`),
          ilike(organizationsTable.primaryContactName || "", `%${searchTerm}%`),
          ilike(organizationsTable.primaryContactEmail || "", `%${searchTerm}%`)
        )
      )
    }

    // Status filter
    if (status) {
      conditions.push(eq(organizationsTable.status, status))
    }

    // Node Officer filter
    if (nodeOfficerId) {
      conditions.push(eq(organizationsTable.nodeOfficerId, nodeOfficerId))
    }

    // Apply all conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    // Get total count for pagination
    const countQuery = db
      .select({
        count: sql<number>`COUNT(DISTINCT ${organizationsTable.id})`
      })
      .from(organizationsTable)
      .$dynamic()

    // Apply same filtering conditions to count query
    if (conditions.length > 0) {
      countQuery.where(and(...conditions))
    }

    const [countResult] = await countQuery
    const totalCount = countResult?.count || 0

    // Apply sorting
    if (sortBy === "name") {
      query = query.orderBy(
        sortOrder === "asc"
          ? asc(organizationsTable.name)
          : desc(organizationsTable.name)
      )
    } else if (sortBy === "status") {
      query = query.orderBy(
        sortOrder === "asc"
          ? asc(organizationsTable.status)
          : desc(organizationsTable.status)
      )
    } else if (sortBy === "memberCount") {
      query = query.orderBy(
        sortOrder === "asc"
          ? sql`COUNT(DISTINCT ${userOrganizationsTable.userId}) ASC`
          : sql`COUNT(DISTINCT ${userOrganizationsTable.userId}) DESC`
      )
    } else {
      // Default to createdAt
      query = query.orderBy(
        sortOrder === "asc"
          ? asc(organizationsTable.createdAt)
          : desc(organizationsTable.createdAt)
      )
    }

    // Apply pagination
    query = query.limit(limit).offset(offset)

    // Execute the query
    const organizations = await query

    // If no organizations found, return early
    if (organizations.length === 0) {
      return {
        isSuccess: true,
        message: "No organizations found.",
        data: { organizations: [], totalCount }
      }
    }

    // Fetch Node Officer names from Clerk for organizations that have nodeOfficerId
    const nodeOfficerIds = organizations
      .map(org => org.nodeOfficerId)
      .filter(Boolean) as string[]

    let nodeOfficerNames: Record<string, string> = {}

    if (nodeOfficerIds.length > 0) {
      try {
        const clerk = await clerkClient()
        const nodeOfficers = await clerk.users.getUserList({
          userId: nodeOfficerIds
        })

        nodeOfficerNames = nodeOfficers.data.reduce(
          (acc: Record<string, string>, user: any) => {
            const fullName =
              `${user.firstName || ""} ${user.lastName || ""}`.trim()
            const displayName =
              fullName || user.emailAddresses[0]?.emailAddress || "Unknown User"
            acc[user.id] = displayName
            return acc
          },
          {} as Record<string, string>
        )
      } catch (error) {
        console.error("Error fetching node officer names from Clerk:", error)
        // Continue without node officer names rather than failing the entire request
      }
    }

    // Add node officer names to organization data
    const organizationsWithExtras = organizations.map(org => {
      return {
        ...org,
        nodeOfficerName: org.nodeOfficerId
          ? nodeOfficerNames[org.nodeOfficerId]
          : undefined
      } as AdminOrganizationView
    })

    return {
      isSuccess: true,
      message: "Organizations retrieved successfully.",
      data: {
        organizations: organizationsWithExtras,
        totalCount
      }
    }
  } catch (error) {
    console.error("Error in getOrganizationsAdminAction:", error)
    return {
      isSuccess: false,
      message: "Failed to retrieve organizations. Please try again."
    }
  }
}

// Add a new action to assign a node officer to an organization
export async function assignNodeOfficerAction(
  organizationId: string,
  nodeOfficerId: string | null
): Promise<ActionState<SelectOrganization>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }

  const isAdmin = await hasPermission(userId, "manage", "organizations")
  if (!isAdmin) {
    return {
      isSuccess: false,
      message: "Forbidden: Admin privileges required to assign node officers."
    }
  }

  try {
    // If nodeOfficerId is provided, we'll create or update the user-organization relationship
    if (nodeOfficerId) {
      // First, check if the user already has a Node Officer role for another organization
      const existingAssignment = await db.query.userOrganizations.findFirst({
        where: and(
          eq(userOrganizationsTable.userId, nodeOfficerId),
          eq(userOrganizationsTable.role, "Node Officer")
        ),
        with: {
          organization: true
        }
      })

      // If they're already a Node Officer for a different organization, remove that assignment
      if (
        existingAssignment &&
        existingAssignment.organizationId !== organizationId
      ) {
        await db
          .delete(userOrganizationsTable)
          .where(
            and(
              eq(userOrganizationsTable.userId, nodeOfficerId),
              eq(
                userOrganizationsTable.organizationId,
                existingAssignment.organizationId
              ),
              eq(userOrganizationsTable.role, "Node Officer")
            )
          )
      }

      // Check if the user already has an assignment to this organization
      const currentAssignment = await db.query.userOrganizations.findFirst({
        where: and(
          eq(userOrganizationsTable.userId, nodeOfficerId),
          eq(userOrganizationsTable.organizationId, organizationId)
        )
      })

      if (currentAssignment) {
        // Update existing assignment to Node Officer role
        await db
          .update(userOrganizationsTable)
          .set({
            role: "Node Officer",
            updatedAt: new Date()
          })
          .where(
            and(
              eq(userOrganizationsTable.userId, nodeOfficerId),
              eq(userOrganizationsTable.organizationId, organizationId)
            )
          )
      } else {
        // Create new assignment
        await db.insert(userOrganizationsTable).values({
          userId: nodeOfficerId,
          organizationId,
          role: "Node Officer"
        })
      }
    } else {
      // Remove the current Node Officer assignment
      await db
        .delete(userOrganizationsTable)
        .where(
          and(
            eq(userOrganizationsTable.organizationId, organizationId),
            eq(userOrganizationsTable.role, "Node Officer")
          )
        )
    }

    // Update the organization's nodeOfficerId field
    const [updatedOrganization] = await db
      .update(organizationsTable)
      .set({
        nodeOfficerId,
        updatedAt: new Date()
      })
      .where(eq(organizationsTable.id, organizationId))
      .returning()

    if (!updatedOrganization) {
      return {
        isSuccess: false,
        message: "Organization not found or update failed."
      }
    }

    // Create audit log entry
    const auditLogData: CreateAuditLogInput = {
      actionCategory: "OrganizationManagement",
      actionType: nodeOfficerId ? "NodeOfficerAssigned" : "NodeOfficerRemoved",
      targetEntityType: "Organization",
      targetEntityId: organizationId,
      details: nodeOfficerId ? { nodeOfficerId } : { removedAssignment: true }
    }
    await createAuditLogAction(auditLogData)

    return {
      isSuccess: true,
      message: nodeOfficerId
        ? "Node Officer assigned successfully."
        : "Node Officer assignment removed.",
      data: updatedOrganization
    }
  } catch (error) {
    console.error("Error assigning node officer:", error)
    return {
      isSuccess: false,
      message: "Failed to update Node Officer assignment."
    }
  }
}

/**
 * Transfers ownership of an organization from one Node Officer to another.
 * Requires System Administrator privileges.
 *
 * This operation:
 * 1. Validates both users exist and have appropriate roles
 * 2. Removes the current Node Officer role from the previous owner
 * 3. Assigns Node Officer role to the new owner (if not already assigned)
 * 4. Optionally transfers metadata record ownership
 * 5. Creates comprehensive audit logs for the transfer
 *
 * @param organizationId - UUID of the organization to transfer
 * @param currentNodeOfficerId - Clerk user ID of the current Node Officer
 * @param newNodeOfficerId - Clerk user ID of the new Node Officer
 * @param transferMetadata - Whether to also transfer metadata record ownership (default: true)
 *
 * @returns Promise resolving to ActionState with transfer summary
 *
 * @example
 * ```typescript
 * const result = await transferOrganizationOwnershipAction(
 *   "123e4567-e89b-12d3-a456-426614174000",
 *   "user_2ABC123DEF456", // current owner
 *   "user_2DEF456GHI789", // new owner
 *   true // transfer metadata too
 * );
 *
 * if (result.isSuccess) {
 *   console.log(`Transferred ownership. ${result.data.metadataRecordsTransferred} metadata records moved.`);
 * }
 * ```
 */
export async function transferOrganizationOwnershipAction(
  organizationId: string,
  currentNodeOfficerId: string,
  newNodeOfficerId: string,
  transferMetadata: boolean = true
): Promise<
  ActionState<{
    organizationId: string
    previousOwner: string
    newOwner: string
    metadataRecordsTransferred: number
    rolesUpdated: number
  }>
> {
  const isSysAdmin = await requiresSystemAdmin()
  if (!isSysAdmin) {
    return {
      isSuccess: false,
      message:
        "Unauthorized. System Administrator privileges required for ownership transfers."
    }
  }

  try {
    if (!organizationId || !currentNodeOfficerId || !newNodeOfficerId) {
      return {
        isSuccess: false,
        message:
          "Organization ID, current Node Officer ID, and new Node Officer ID are all required."
      }
    }

    if (currentNodeOfficerId === newNodeOfficerId) {
      return {
        isSuccess: false,
        message: "Current and new Node Officer cannot be the same person."
      }
    }

    // Validate organization exists
    const organization = await db.query.organizations.findFirst({
      where: eq(organizationsTable.id, organizationId)
    })

    if (!organization) {
      return {
        isSuccess: false,
        message: "Organization not found."
      }
    }

    // Validate current Node Officer exists and has the role
    const currentNodeOfficerAssignment =
      await db.query.userOrganizations.findFirst({
        where: and(
          eq(userOrganizationsTable.organizationId, organizationId),
          eq(userOrganizationsTable.userId, currentNodeOfficerId),
          eq(userOrganizationsTable.role, "Node Officer")
        )
      })

    if (!currentNodeOfficerAssignment) {
      return {
        isSuccess: false,
        message: "Current user is not a Node Officer for this organization."
      }
    }

    // Check if new Node Officer already exists in the organization
    const existingNewOwnerAssignment =
      await db.query.userOrganizations.findFirst({
        where: and(
          eq(userOrganizationsTable.organizationId, organizationId),
          eq(userOrganizationsTable.userId, newNodeOfficerId)
        )
      })

    // Count metadata records that would be transferred
    let metadataRecordsCount = 0
    if (transferMetadata) {
      const metadataRecords = await db.query.metadataRecords.findMany({
        where: and(
          eq(metadataRecordsTable.organizationId, organizationId),
          eq(metadataRecordsTable.creatorUserId, currentNodeOfficerId)
        ),
        columns: { id: true }
      })
      metadataRecordsCount = metadataRecords.length
    }

    // Begin the transfer transaction
    let rolesUpdated = 0

    // 1. Remove Node Officer role from current owner
    await db
      .delete(userOrganizationsTable)
      .where(
        and(
          eq(userOrganizationsTable.organizationId, organizationId),
          eq(userOrganizationsTable.userId, currentNodeOfficerId),
          eq(userOrganizationsTable.role, "Node Officer")
        )
      )
    rolesUpdated++

    // 2. Update or create Node Officer role for new owner
    if (existingNewOwnerAssignment) {
      // Update existing role to Node Officer
      await db
        .update(userOrganizationsTable)
        .set({
          role: "Node Officer",
          updatedAt: new Date()
        })
        .where(
          and(
            eq(userOrganizationsTable.organizationId, organizationId),
            eq(userOrganizationsTable.userId, newNodeOfficerId)
          )
        )
      rolesUpdated++
    } else {
      // Create new Node Officer assignment
      await db.insert(userOrganizationsTable).values({
        organizationId,
        userId: newNodeOfficerId,
        role: "Node Officer"
      })
      rolesUpdated++
    }

    // 3. Transfer metadata records if requested
    let metadataRecordsTransferred = 0
    if (transferMetadata && metadataRecordsCount > 0) {
      const updateResult = await db
        .update(metadataRecordsTable)
        .set({
          creatorUserId: newNodeOfficerId,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(metadataRecordsTable.organizationId, organizationId),
            eq(metadataRecordsTable.creatorUserId, currentNodeOfficerId)
          )
        )
        .returning({ id: metadataRecordsTable.id })

      metadataRecordsTransferred = updateResult.length
    }

    // 4. Create comprehensive audit log
    const auditLogData: CreateAuditLogInput = {
      actionCategory: "OrganizationManagement",
      actionType: "OrganizationOwnershipTransferred",
      targetEntityType: "Organization",
      targetEntityId: organizationId,
      details: {
        organizationName: organization.name,
        previousNodeOfficer: currentNodeOfficerId,
        newNodeOfficer: newNodeOfficerId,
        rolesUpdated,
        metadataRecordsTransferred,
        transferMetadataRequested: transferMetadata,
        transferTimestamp: new Date().toISOString()
      }
    }
    await createAuditLogAction(auditLogData)

    return {
      isSuccess: true,
      message: `Organization ownership transferred successfully. ${rolesUpdated} role(s) updated, ${metadataRecordsTransferred} metadata record(s) transferred.`,
      data: {
        organizationId,
        previousOwner: currentNodeOfficerId,
        newOwner: newNodeOfficerId,
        metadataRecordsTransferred,
        rolesUpdated
      }
    }
  } catch (error) {
    console.error("Error transferring organization ownership:", error)
    return {
      isSuccess: false,
      message: `Failed to transfer organization ownership: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
}

/**
 * Transfers ownership of specific metadata records from one Node Officer to another within the same organization.
 * Requires either System Administrator privileges or Node Officer role for the organization.
 * Useful for partial transfers or when reorganizing metadata ownership without full organization transfer.
 *
 * @param organizationId - UUID of the organization
 * @param metadataRecordIds - Array of metadata record IDs to transfer
 * @param currentOwnerId - Clerk user ID of the current owner
 * @param newOwnerId - Clerk user ID of the new owner
 *
 * @returns Promise resolving to ActionState with transfer summary
 *
 * @example
 * ```typescript
 * const result = await transferMetadataRecordsAction(
 *   "123e4567-e89b-12d3-a456-426614174000",
 *   ["rec_1", "rec_2", "rec_3"],
 *   "user_2ABC123DEF456", // current owner
 *   "user_2DEF456GHI789"  // new owner
 * );
 *
 * if (result.isSuccess) {
 *   console.log(`Transferred ${result.data.transferred.length} metadata records`);
 * }
 * ```
 */
export async function transferMetadataRecordsAction(
  organizationId: string,
  metadataRecordIds: string[],
  currentOwnerId: string,
  newOwnerId: string
): Promise<
  ActionState<{
    transferred: string[]
    failed: { recordId: string; error: string }[]
    notFound: string[]
  }>
> {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return { isSuccess: false, message: "Unauthorized." }
  }

  // Authorization: System Admin or Node Officer of the organization
  const isNodeOfficerOfOrg = await db.query.userOrganizations.findFirst({
    where: and(
      eq(userOrganizationsTable.userId, currentUserId),
      eq(userOrganizationsTable.organizationId, organizationId),
      eq(userOrganizationsTable.role, "Node Officer")
    )
  })
  const isSysAdmin = await checkUserRole(currentUserId, "System Administrator")

  if (!isNodeOfficerOfOrg && !isSysAdmin) {
    return {
      isSuccess: false,
      message:
        "Forbidden: Not authorized to transfer metadata for this organization."
    }
  }

  try {
    if (
      !organizationId ||
      !metadataRecordIds.length ||
      !currentOwnerId ||
      !newOwnerId
    ) {
      return {
        isSuccess: false,
        message:
          "Organization ID, metadata record IDs, current owner ID, and new owner ID are all required."
      }
    }

    if (currentOwnerId === newOwnerId) {
      return {
        isSuccess: false,
        message: "Current and new owner cannot be the same person."
      }
    }

    // Validate both users are in the organization
    const userAssignments = await db.query.userOrganizations.findMany({
      where: and(
        eq(userOrganizationsTable.organizationId, organizationId),
        inArray(userOrganizationsTable.userId, [currentOwnerId, newOwnerId])
      )
    })

    const assignedUserIds = new Set(userAssignments.map(ua => ua.userId))
    if (
      !assignedUserIds.has(currentOwnerId) ||
      !assignedUserIds.has(newOwnerId)
    ) {
      return {
        isSuccess: false,
        message:
          "Both current and new owners must be members of the organization."
      }
    }

    // Find existing metadata records owned by current owner
    const existingRecords = await db.query.metadataRecords.findMany({
      where: and(
        eq(metadataRecordsTable.organizationId, organizationId),
        eq(metadataRecordsTable.creatorUserId, currentOwnerId),
        inArray(metadataRecordsTable.id, metadataRecordIds)
      ),
      columns: { id: true, title: true }
    })

    const existingRecordIds = new Set(existingRecords.map(r => r.id))
    const notFound = metadataRecordIds.filter(id => !existingRecordIds.has(id))

    const transferred: string[] = []
    const failed: { recordId: string; error: string }[] = []

    // Transfer each record
    for (const recordId of metadataRecordIds) {
      if (!existingRecordIds.has(recordId)) {
        continue // Already tracked in notFound
      }

      try {
        await db
          .update(metadataRecordsTable)
          .set({
            creatorUserId: newOwnerId,
            updatedAt: new Date()
          })
          .where(eq(metadataRecordsTable.id, recordId))

        transferred.push(recordId)
      } catch (error) {
        failed.push({
          recordId,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    // Create audit log for metadata transfer
    const auditLogData: CreateAuditLogInput = {
      actionCategory: "MetadataWorkflow",
      actionType: "MetadataRecordsTransferred",
      targetEntityType: "Organization",
      targetEntityId: organizationId,
      details: {
        previousOwner: currentOwnerId,
        newOwner: newOwnerId,
        transferredRecords: transferred,
        failedRecords: failed.map(f => f.recordId),
        notFoundRecords: notFound,
        transferredCount: transferred.length,
        transferTimestamp: new Date().toISOString()
      }
    }
    await createAuditLogAction(auditLogData)

    return {
      isSuccess: true,
      message: `Metadata transfer completed. ${transferred.length} transferred, ${failed.length} failed, ${notFound.length} not found.`,
      data: { transferred, failed, notFound }
    }
  } catch (error) {
    console.error("Error transferring metadata records:", error)
    return {
      isSuccess: false,
      message: `Failed to transfer metadata records: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
}

// ====== ORGANIZATION STATISTICS AND ANALYTICS ======

/**
 * Interface for organization statistics data
 */
interface OrganizationStatistics {
  organizationId: string
  organizationName: string
  totalMembers: number
  membersByRole: {
    "Node Officer": number
    "Metadata Creator": number
    "Metadata Approver": number
  }
  metadataMetrics: {
    totalRecords: number
    recordsByStatus: {
      draft: number
      submitted: number
      approved: number
      published: number
      rejected: number
    }
    recordsByType: Record<string, number>
    recentSubmissions: {
      last7Days: number
      last30Days: number
      last90Days: number
    }
  }
  activityMetrics: {
    lastMemberJoined: string | null
    lastMetadataSubmission: string | null
    averageSubmissionsPerMonth: number
    activeContributors: number // Users who submitted metadata in last 30 days
  }
  healthScore: {
    score: number // 0-100
    factors: {
      memberActivity: number
      metadataQuality: number
      recentActivity: number
      organizationCompleteness: number
    }
  }
}

/**
 * Retrieves comprehensive statistics and analytics for a specific organization.
 * Requires either Node Officer role for the specific organization or System Administrator role.
 *
 * Provides detailed insights including:
 * - Member count and role distribution
 * - Metadata metrics (total, by status, by type)
 * - Activity trends and submission patterns
 * - Organization health score based on multiple factors
 *
 * @param organizationId - UUID of the organization to analyze
 *
 * @returns Promise resolving to ActionState containing comprehensive organization statistics
 *
 * @example
 * ```typescript
 * const result = await getOrganizationStatisticsAction("123e4567-e89b-12d3-a456-426614174000");
 *
 * if (result.isSuccess) {
 *   const stats = result.data;
 *   console.log(`Organization: ${stats.organizationName}`);
 *   console.log(`Members: ${stats.totalMembers}`);
 *   console.log(`Metadata Records: ${stats.metadataMetrics.totalRecords}`);
 *   console.log(`Health Score: ${stats.healthScore.score}/100`);
 * }
 * ```
 */
export async function getOrganizationStatisticsAction(
  organizationId: string
): Promise<ActionState<OrganizationStatistics>> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }

  try {
    // Check authorization: System Admin or Node Officer of the organization
    const isNodeOfficerOfOrg = await db.query.userOrganizations.findFirst({
      where: and(
        eq(userOrganizationsTable.userId, userId),
        eq(userOrganizationsTable.organizationId, organizationId),
        eq(userOrganizationsTable.role, "Node Officer")
      )
    })
    const isSysAdmin = await checkUserRole(userId, "System Administrator")

    if (!isNodeOfficerOfOrg && !isSysAdmin) {
      return {
        isSuccess: false,
        message:
          "Forbidden: Not authorized to view statistics for this organization."
      }
    }

    // Get organization details
    const organization = await db.query.organizations.findFirst({
      where: eq(organizationsTable.id, organizationId)
    })

    if (!organization) {
      return { isSuccess: false, message: "Organization not found." }
    }

    // Get member statistics
    const members = await db.query.userOrganizations.findMany({
      where: eq(userOrganizationsTable.organizationId, organizationId)
    })

    const membersByRole = {
      "Node Officer": 0,
      "Metadata Creator": 0,
      "Metadata Approver": 0
    }

    members.forEach(member => {
      if (member.role in membersByRole) {
        membersByRole[member.role as keyof typeof membersByRole]++
      }
    })

    // Get metadata statistics
    const metadataRecords = await db.query.metadataRecords.findMany({
      where: eq(metadataRecordsTable.organizationId, organizationId),
      columns: {
        id: true,
        status: true,
        dataType: true,
        createdAt: true,
        creatorUserId: true
      }
    })

    const recordsByStatus = {
      draft: 0,
      submitted: 0,
      approved: 0,
      published: 0,
      rejected: 0
    }

    const recordsByType: Record<string, number> = {}

    metadataRecords.forEach(record => {
      // Count by status
      if (record.status && record.status in recordsByStatus) {
        recordsByStatus[record.status as keyof typeof recordsByStatus]++
      }

      // Count by type
      if (record.dataType) {
        recordsByType[record.dataType] =
          (recordsByType[record.dataType] || 0) + 1
      }
    })

    // Calculate recent submissions
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const recentSubmissions = {
      last7Days: metadataRecords.filter(r => r.createdAt >= last7Days).length,
      last30Days: metadataRecords.filter(r => r.createdAt >= last30Days).length,
      last90Days: metadataRecords.filter(r => r.createdAt >= last90Days).length
    }

    // Calculate activity metrics
    const lastMemberJoined =
      members.length > 0
        ? members
            .reduce(
              (latest, member) =>
                member.createdAt > latest ? member.createdAt : latest,
              members[0].createdAt
            )
            .toISOString()
        : null

    const lastMetadataSubmission =
      metadataRecords.length > 0
        ? metadataRecords
            .reduce(
              (latest, record) =>
                record.createdAt > latest ? record.createdAt : latest,
              metadataRecords[0].createdAt
            )
            .toISOString()
        : null

    // Calculate average submissions per month (based on organization age)
    const organizationAge = now.getTime() - organization.createdAt.getTime()
    const monthsActive = Math.max(
      1,
      organizationAge / (30 * 24 * 60 * 60 * 1000)
    )
    const averageSubmissionsPerMonth = metadataRecords.length / monthsActive

    // Count active contributors (users who submitted metadata in last 30 days)
    const activeContributors = new Set(
      metadataRecords
        .filter(r => r.createdAt >= last30Days)
        .map(r => r.creatorUserId)
    ).size

    // Calculate health score
    const healthScore = calculateOrganizationHealthScore(
      organization,
      members,
      metadataRecords,
      recentSubmissions
    )

    const statistics: OrganizationStatistics = {
      organizationId: organization.id,
      organizationName: organization.name,
      totalMembers: members.length,
      membersByRole,
      metadataMetrics: {
        totalRecords: metadataRecords.length,
        recordsByStatus,
        recordsByType,
        recentSubmissions
      },
      activityMetrics: {
        lastMemberJoined,
        lastMetadataSubmission,
        averageSubmissionsPerMonth:
          Math.round(averageSubmissionsPerMonth * 100) / 100,
        activeContributors
      },
      healthScore
    }

    return {
      isSuccess: true,
      message: "Organization statistics retrieved successfully.",
      data: statistics
    }
  } catch (error) {
    console.error("Error getting organization statistics:", error)
    return {
      isSuccess: false,
      message: `Failed to get organization statistics: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
}

/**
 * Calculates organization health score based on multiple factors
 */
function calculateOrganizationHealthScore(
  organization: SelectOrganization,
  members: any[],
  metadataRecords: any[],
  recentSubmissions: {
    last7Days: number
    last30Days: number
    last90Days: number
  }
): OrganizationStatistics["healthScore"] {
  // Factor 1: Member Activity (0-25 points)
  const memberActivity = Math.min(25, (members.length / 10) * 25) // Up to 25 points for 10+ members

  // Factor 2: Metadata Quality (0-25 points)
  const publishedRecords = metadataRecords.filter(
    r => r.status === "published"
  ).length
  const totalRecords = metadataRecords.length
  const qualityRatio = totalRecords > 0 ? publishedRecords / totalRecords : 0
  const metadataQuality = qualityRatio * 25

  // Factor 3: Recent Activity (0-25 points)
  const recentActivityScore = Math.min(
    25,
    (recentSubmissions.last30Days / 5) * 25
  ) // Up to 25 points for 5+ submissions in last 30 days

  // Factor 4: Organization Completeness (0-25 points)
  let completenessScore = 0
  if (organization.name) completenessScore += 5
  if (organization.description) completenessScore += 5
  if (organization.primaryContactEmail) completenessScore += 5
  if (organization.websiteUrl) completenessScore += 5
  if (organization.address) completenessScore += 5

  const totalScore = Math.round(
    memberActivity + metadataQuality + recentActivityScore + completenessScore
  )

  return {
    score: Math.min(100, totalScore),
    factors: {
      memberActivity: Math.round(memberActivity),
      metadataQuality: Math.round(metadataQuality),
      recentActivity: Math.round(recentActivityScore),
      organizationCompleteness: Math.round(completenessScore)
    }
  }
}

/**
 * Interface for bulk organization statistics
 */
interface BulkOrganizationStatistics {
  totalOrganizations: number
  organizationsByStatus: Record<string, number>
  aggregateMetrics: {
    totalMembers: number
    totalMetadataRecords: number
    averageRecordsPerOrganization: number
    averageMembersPerOrganization: number
  }
  topPerformingOrganizations: Array<{
    id: string
    name: string
    healthScore: number
    memberCount: number
    metadataCount: number
  }>
  activityTrends: {
    organizationsCreatedLast30Days: number
    organizationsCreatedLast90Days: number
    recentlyActiveOrganizations: number // Had activity in last 30 days
  }
}

/**
 * Retrieves system-wide organization statistics and analytics.
 * Requires System Administrator role.
 *
 * Provides insights across all organizations including:
 * - Organization count and status distribution
 * - Aggregate member and metadata metrics
 * - Top performing organizations by health score
 * - Activity trends and growth metrics
 *
 * @returns Promise resolving to ActionState containing system-wide organization statistics
 *
 * @example
 * ```typescript
 * const result = await getSystemOrganizationStatisticsAction();
 *
 * if (result.isSuccess) {
 *   const stats = result.data;
 *   console.log(`Total Organizations: ${stats.totalOrganizations}`);
 *   console.log(`Total Members: ${stats.aggregateMetrics.totalMembers}`);
 *   console.log(`Top Organization: ${stats.topPerformingOrganizations[0]?.name}`);
 * }
 * ```
 */
export async function getSystemOrganizationStatisticsAction(): Promise<
  ActionState<BulkOrganizationStatistics>
> {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Unauthorized: User not logged in." }
  }

  // Check System Administrator role
  const isSysAdmin = await checkUserRole(userId, "System Administrator")
  if (!isSysAdmin) {
    return {
      isSuccess: false,
      message: "Forbidden: System Administrator role required."
    }
  }

  try {
    // Get all organizations
    const organizations = await db.query.organizations.findMany()

    // Count organizations by status
    const organizationsByStatus: Record<string, number> = {}
    organizations.forEach(org => {
      organizationsByStatus[org.status] =
        (organizationsByStatus[org.status] || 0) + 1
    })

    // Get all user-organization associations
    const allUserOrganizations = await db.query.userOrganizations.findMany()

    // Get all metadata records
    const allMetadataRecords = await db.query.metadataRecords.findMany({
      columns: { id: true, organizationId: true, createdAt: true }
    })

    // Calculate aggregate metrics
    const totalMembers = allUserOrganizations.length
    const totalMetadataRecords = allMetadataRecords.length
    const averageRecordsPerOrganization =
      organizations.length > 0
        ? Math.round((totalMetadataRecords / organizations.length) * 100) / 100
        : 0
    const averageMembersPerOrganization =
      organizations.length > 0
        ? Math.round((totalMembers / organizations.length) * 100) / 100
        : 0

    // Calculate activity trends
    const now = new Date()
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const organizationsCreatedLast30Days = organizations.filter(
      org => org.createdAt >= last30Days
    ).length

    const organizationsCreatedLast90Days = organizations.filter(
      org => org.createdAt >= last90Days
    ).length

    // Calculate recently active organizations (had metadata submissions in last 30 days)
    const recentlyActiveOrgIds = new Set(
      allMetadataRecords
        .filter(record => record.createdAt >= last30Days)
        .map(record => record.organizationId)
        .filter(Boolean)
    )
    const recentlyActiveOrganizations = recentlyActiveOrgIds.size

    // Calculate top performing organizations (simplified health score)
    const topPerformingOrganizations = await Promise.all(
      organizations.map(async org => {
        const orgMembers = allUserOrganizations.filter(
          uo => uo.organizationId === org.id
        )
        const orgMetadata = allMetadataRecords.filter(
          mr => mr.organizationId === org.id
        )

        // Simplified health calculation
        const memberScore = Math.min(25, (orgMembers.length / 10) * 25)
        const metadataScore = Math.min(25, (orgMetadata.length / 20) * 25)
        const recentActivityScore = Math.min(
          25,
          (orgMetadata.filter(mr => mr.createdAt >= last30Days).length / 5) * 25
        )
        const completenessScore =
          [
            org.name,
            org.description,
            org.primaryContactEmail,
            org.websiteUrl,
            org.address
          ].filter(Boolean).length * 5

        const healthScore = Math.round(
          memberScore + metadataScore + recentActivityScore + completenessScore
        )

        return {
          id: org.id,
          name: org.name,
          healthScore: Math.min(100, healthScore),
          memberCount: orgMembers.length,
          metadataCount: orgMetadata.length
        }
      })
    )

    // Sort by health score and take top 10
    topPerformingOrganizations.sort((a, b) => b.healthScore - a.healthScore)
    const topTen = topPerformingOrganizations.slice(0, 10)

    const statistics: BulkOrganizationStatistics = {
      totalOrganizations: organizations.length,
      organizationsByStatus,
      aggregateMetrics: {
        totalMembers,
        totalMetadataRecords,
        averageRecordsPerOrganization,
        averageMembersPerOrganization
      },
      topPerformingOrganizations: topTen,
      activityTrends: {
        organizationsCreatedLast30Days,
        organizationsCreatedLast90Days,
        recentlyActiveOrganizations
      }
    }

    return {
      isSuccess: true,
      message: "System organization statistics retrieved successfully.",
      data: statistics
    }
  } catch (error) {
    console.error("Error getting system organization statistics:", error)
    return {
      isSuccess: false,
      message: `Failed to get system organization statistics: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
}

// ====== END ORGANIZATION STATISTICS AND ANALYTICS ======

/**
 * Parameters for filtering and paginating public organization lists.
 */
interface GetPublicOrganizationsParams {
  /** Maximum number of organizations to return (default: 12) */
  limit?: number
  /** Number of organizations to skip (default: 0) */
  offset?: number
}

/**
 * Get public-facing organizations for display on the landing page
 * This doesn't require authentication and only returns active/approved organizations
 * with basic information (name, logo, website) for public display
 *
 * @param params - Optional pagination parameters
 * @param params.limit - Maximum number of organizations to return (default: 12)
 * @param params.offset - Number of organizations to skip for pagination (default: 0)
 *
 * @returns Promise resolving to ActionState containing array of public organization data
 *
 * @example
 * ```typescript
 * // Get first 12 organizations (default)
 * const result = await getPublicOrganizationsAction();
 *
 * // Get next 12 organizations
 * const result = await getPublicOrganizationsAction({ limit: 12, offset: 12 });
 * ```
 */
export async function getPublicOrganizationsAction(
  params: GetPublicOrganizationsParams = {}
): Promise<
  ActionState<
    Pick<
      SelectOrganization,
      "id" | "name" | "logoUrl" | "websiteUrl" | "description"
    >[]
  >
> {
  const { limit = 12, offset = 0 } = params

  try {
    const organizations = await db
      .select({
        id: organizationsTable.id,
        name: organizationsTable.name,
        logoUrl: organizationsTable.logoUrl,
        websiteUrl: organizationsTable.websiteUrl,
        description: organizationsTable.description
      })
      .from(organizationsTable)
      .where(eq(organizationsTable.status, "active"))
      .orderBy(desc(organizationsTable.createdAt)) // Show newest organizations first for better UX
      .limit(limit)
      .offset(offset)

    return {
      isSuccess: true,
      message: "Organizations retrieved successfully",
      data: organizations
    }
  } catch (error) {
    console.error("Error fetching public organizations:", error)
    return {
      isSuccess: false,
      message: "Failed to fetch organizations"
    }
  }
}
