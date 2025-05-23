"use server"

import { db } from "@/db/db"
import {
  metadataRecordsTable,
  organizationsTable,
  type InsertMetadataRecord,
  type SelectMetadataRecord
} from "@/db/schema"
import { ActionState } from "@/types"
import { auth } from "@clerk/nextjs/server"
import {
  and,
  eq,
  ilike,
  or,
  desc,
  asc,
  sql,
  count,
  isNull,
  isNotNull
} from "drizzle-orm"
import { revalidatePath } from "next/cache"

// Enhanced search filters interface
interface MetadataSearchFilters {
  query?: string
  dataTypes?: string[]
  organizations?: string[]
  topicCategories?: string[]
  frameworkTypes?: string[]
  status?: string[]
  temporalRange?: {
    start?: string
    end?: string
  }
  spatialBounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  sortBy?: "relevance" | "date" | "title" | "updated"
  sortOrder?: "asc" | "desc"
  limit?: number
  offset?: number
}

// Search result interface with facets
interface MetadataSearchResult {
  records: {
    id: string
    title: string
    abstract: string
    dataType: string
    frameworkType: string | null
    keywords: string[] | null
    status: string
    productionDate: string | null
    updatedAt: Date
    organizationId: string | null
    thumbnailUrl: string | null
    spatialInfo: unknown
    temporalInfo: unknown
    distributionInfo: unknown
    organizationName: string | null
    organization?: { name: string } | null
  }[]
  totalCount: number
  facets: {
    dataTypes: { value: string; count: number }[]
    organizations: { value: string; count: number }[]
    topicCategories: { value: string; count: number }[]
    frameworkTypes: { value: string; count: number }[]
    years: { value: string; count: number }[]
  }
}

// Quality assessment interface
interface QualityAssessment {
  score: number
  issues: {
    type: "error" | "warning" | "suggestion"
    field: string
    message: string
  }[]
  suggestions: {
    field: string
    currentValue?: string
    suggestedValue: string
    reason: string
  }[]
}

// Analytics event interface
interface AnalyticsEvent {
  recordId: string
  eventType: "view" | "download" | "share" | "bookmark" | "search" | "export"
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

/**
 * Enhanced search with faceted filtering and suggestions
 */
export async function searchMetadataEnhancedAction(
  filters: MetadataSearchFilters
): Promise<ActionState<MetadataSearchResult>> {
  try {
    const {
      limit = 20,
      offset = 0,
      sortBy = "relevance",
      sortOrder = "desc"
    } = filters

    // Build where conditions
    const whereConditions = []

    // Only show published records for public search
    whereConditions.push(eq(metadataRecordsTable.status, "Published"))

    // Text search across multiple fields
    if (filters.query && filters.query.length > 0) {
      const searchTerm = `%${filters.query}%`
      whereConditions.push(
        or(
          ilike(metadataRecordsTable.title, searchTerm),
          ilike(metadataRecordsTable.abstract, searchTerm),
          sql`${metadataRecordsTable.keywords}::text ILIKE ${searchTerm}`
        )
      )
    }

    // Data type filtering
    if (filters.dataTypes && filters.dataTypes.length > 0) {
      whereConditions.push(
        sql`${metadataRecordsTable.dataType} = ANY(${filters.dataTypes})`
      )
    }

    // Framework type filtering
    if (filters.frameworkTypes && filters.frameworkTypes.length > 0) {
      whereConditions.push(
        sql`${metadataRecordsTable.frameworkType} = ANY(${filters.frameworkTypes})`
      )
    }

    // Organization filtering
    if (filters.organizations && filters.organizations.length > 0) {
      whereConditions.push(
        sql`${metadataRecordsTable.organizationId} IN (
          SELECT id FROM ${organizationsTable} 
          WHERE name = ANY(${filters.organizations})
        )`
      )
    }

    // Temporal filtering
    if (filters.temporalRange?.start) {
      whereConditions.push(
        sql`${metadataRecordsTable.productionDate} >= ${new Date(filters.temporalRange.start)}`
      )
    }
    if (filters.temporalRange?.end) {
      whereConditions.push(
        sql`${metadataRecordsTable.productionDate} <= ${new Date(filters.temporalRange.end)}`
      )
    }

    // Spatial filtering (bounding box intersection)
    if (filters.spatialBounds) {
      const { north, south, east, west } = filters.spatialBounds
      whereConditions.push(
        sql`
          (${metadataRecordsTable.spatialInfo}->>'boundingBox')::jsonb IS NOT NULL AND
          (${metadataRecordsTable.spatialInfo}->>'boundingBox'->>'northBoundingCoordinate')::float <= ${north} AND
          (${metadataRecordsTable.spatialInfo}->>'boundingBox'->>'southBoundingCoordinate')::float >= ${south} AND
          (${metadataRecordsTable.spatialInfo}->>'boundingBox'->>'eastBoundingCoordinate')::float <= ${east} AND
          (${metadataRecordsTable.spatialInfo}->>'boundingBox'->>'westBoundingCoordinate')::float >= ${west}
        `
      )
    }

    const whereClause = and(...whereConditions)

    // Build order clause
    let orderClause
    const direction = sortOrder === "asc" ? asc : desc

    switch (sortBy) {
      case "date":
        orderClause = direction(metadataRecordsTable.productionDate)
        break
      case "title":
        orderClause = direction(metadataRecordsTable.title)
        break
      case "updated":
        orderClause = direction(metadataRecordsTable.updatedAt)
        break
      default: // relevance
        orderClause = filters.query
          ? sql`
              CASE 
                WHEN ${metadataRecordsTable.title} ILIKE ${"%" + filters.query + "%"} THEN 3
                WHEN ${metadataRecordsTable.abstract} ILIKE ${"%" + filters.query + "%"} THEN 2
                WHEN ${metadataRecordsTable.keywords}::text ILIKE ${"%" + filters.query + "%"} THEN 1
                ELSE 0
              END DESC,
              ${desc(metadataRecordsTable.updatedAt)}
            `
          : desc(metadataRecordsTable.updatedAt)
    }

    // Get main results with organization info
    const records = await db
      .select({
        id: metadataRecordsTable.id,
        title: metadataRecordsTable.title,
        abstract: metadataRecordsTable.abstract,
        dataType: metadataRecordsTable.dataType,
        frameworkType: metadataRecordsTable.frameworkType,
        keywords: metadataRecordsTable.keywords,
        status: metadataRecordsTable.status,
        productionDate: metadataRecordsTable.productionDate,
        updatedAt: metadataRecordsTable.updatedAt,
        organizationId: metadataRecordsTable.organizationId,
        thumbnailUrl: metadataRecordsTable.thumbnailUrl,
        spatialInfo: metadataRecordsTable.spatialInfo,
        temporalInfo: metadataRecordsTable.temporalInfo,
        distributionInfo: metadataRecordsTable.distributionInfo,
        organizationName: organizationsTable.name
      })
      .from(metadataRecordsTable)
      .leftJoin(
        organizationsTable,
        eq(metadataRecordsTable.organizationId, organizationsTable.id)
      )
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset)

    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(metadataRecordsTable)
      .leftJoin(
        organizationsTable,
        eq(metadataRecordsTable.organizationId, organizationsTable.id)
      )
      .where(whereClause)

    // Generate facets
    const facets = await generateSearchFacets(whereClause)

    return {
      isSuccess: true,
      message: "Search completed successfully",
      data: {
        records: records.map(r => ({
          ...r,
          organization: r.organizationName ? { name: r.organizationName } : null
        })),
        totalCount,
        facets
      }
    }
  } catch (error) {
    console.error("Error in enhanced metadata search:", error)
    return {
      isSuccess: false,
      message: "Failed to search metadata records"
    }
  }
}

/**
 * Generate search facets for filtering
 */
async function generateSearchFacets(whereClause: any) {
  try {
    // Data types facet
    const dataTypesFacet = await db
      .select({
        value: metadataRecordsTable.dataType,
        count: count()
      })
      .from(metadataRecordsTable)
      .where(whereClause)
      .groupBy(metadataRecordsTable.dataType)
      .orderBy(desc(count()))

    // Organizations facet
    const organizationsFacet = await db
      .select({
        value: organizationsTable.name,
        count: count()
      })
      .from(metadataRecordsTable)
      .leftJoin(
        organizationsTable,
        eq(metadataRecordsTable.organizationId, organizationsTable.id)
      )
      .where(and(whereClause, isNotNull(organizationsTable.name)))
      .groupBy(organizationsTable.name)
      .orderBy(desc(count()))

    // Framework types facet
    const frameworkTypesFacet = await db
      .select({
        value: metadataRecordsTable.frameworkType,
        count: count()
      })
      .from(metadataRecordsTable)
      .where(and(whereClause, isNotNull(metadataRecordsTable.frameworkType)))
      .groupBy(metadataRecordsTable.frameworkType)
      .orderBy(desc(count()))

    // Years facet (from production date)
    const yearsFacet = await db
      .select({
        value: sql<string>`EXTRACT(YEAR FROM ${metadataRecordsTable.productionDate})::text`,
        count: count()
      })
      .from(metadataRecordsTable)
      .where(and(whereClause, isNotNull(metadataRecordsTable.productionDate)))
      .groupBy(sql`EXTRACT(YEAR FROM ${metadataRecordsTable.productionDate})`)
      .orderBy(
        desc(sql`EXTRACT(YEAR FROM ${metadataRecordsTable.productionDate})`)
      )

    return {
      dataTypes: dataTypesFacet.map(f => ({
        value: f.value || "",
        count: f.count
      })),
      organizations: organizationsFacet.map(f => ({
        value: f.value || "",
        count: f.count
      })),
      topicCategories: [], // TODO: Extract from keywords or add dedicated field
      frameworkTypes: frameworkTypesFacet.map(f => ({
        value: f.value || "",
        count: f.count
      })),
      years: yearsFacet.map(f => ({ value: f.value, count: f.count }))
    }
  } catch (error) {
    console.error("Error generating facets:", error)
    return {
      dataTypes: [],
      organizations: [],
      topicCategories: [],
      frameworkTypes: [],
      years: []
    }
  }
}

/**
 * Assess metadata quality and provide suggestions
 */
export async function assessMetadataQualityAction(
  recordId: string
): Promise<ActionState<QualityAssessment>> {
  try {
    const record = await db.query.metadataRecords.findFirst({
      where: eq(metadataRecordsTable.id, recordId)
    })

    if (!record) {
      return {
        isSuccess: false,
        message: "Metadata record not found"
      }
    }

    const assessment = performQualityAssessment(record)

    return {
      isSuccess: true,
      message: "Quality assessment completed",
      data: assessment
    }
  } catch (error) {
    console.error("Error assessing metadata quality:", error)
    return {
      isSuccess: false,
      message: "Failed to assess metadata quality"
    }
  }
}

/**
 * Perform quality assessment on metadata record
 */
function performQualityAssessment(
  record: SelectMetadataRecord
): QualityAssessment {
  const issues: QualityAssessment["issues"] = []
  const suggestions: QualityAssessment["suggestions"] = []
  let score = 100

  // Title assessment
  if (!record.title || record.title.length < 10) {
    issues.push({
      type: "error",
      field: "title",
      message: "Title is too short or missing"
    })
    score -= 15
  } else if (record.title.toLowerCase().includes("untitled")) {
    issues.push({
      type: "warning",
      field: "title",
      message: "Title appears to be generic"
    })
    score -= 10
  }

  // Abstract assessment
  if (!record.abstract || record.abstract.length < 50) {
    issues.push({
      type: "error",
      field: "abstract",
      message: "Abstract is too short or missing"
    })
    score -= 20
  } else if (record.abstract.length < 100) {
    issues.push({
      type: "suggestion",
      field: "abstract",
      message: "Consider providing a more detailed abstract"
    })
    score -= 5
  }

  // Keywords assessment
  if (!record.keywords || record.keywords.length < 3) {
    issues.push({
      type: "error",
      field: "keywords",
      message: "At least 3 keywords are recommended"
    })
    score -= 15
  } else if (record.keywords.length < 5) {
    issues.push({
      type: "suggestion",
      field: "keywords",
      message: "Consider adding more keywords for better discoverability"
    })
    score -= 5
  }

  // Spatial information assessment
  const spatialInfo = record.spatialInfo as any
  if (!spatialInfo?.coordinateSystem) {
    issues.push({
      type: "error",
      field: "spatialInfo.coordinateSystem",
      message: "Coordinate system is required"
    })
    score -= 10
  }

  if (!spatialInfo?.boundingBox) {
    issues.push({
      type: "warning",
      field: "spatialInfo.boundingBox",
      message: "Geographic bounding box is recommended"
    })
    score -= 10
  }

  // Technical details assessment
  const technicalInfo = record.technicalDetailsInfo as any
  if (!technicalInfo?.fileFormat) {
    issues.push({
      type: "error",
      field: "technicalDetailsInfo.fileFormat",
      message: "File format information is required"
    })
    score -= 10
  }

  // Distribution information assessment
  const distributionInfo = record.distributionInfo as any
  if (!distributionInfo?.downloadUrl && !distributionInfo?.apiEndpoint) {
    issues.push({
      type: "warning",
      field: "distributionInfo",
      message: "No access method specified"
    })
    score -= 5
  }

  // Generate suggestions
  if (record.keywords && record.keywords.length > 0) {
    const suggestedKeywords = generateKeywordSuggestions(
      record.keywords,
      record.dataType
    )
    if (suggestedKeywords.length > 0) {
      suggestions.push({
        field: "keywords",
        suggestedValue: suggestedKeywords.join(", "),
        reason: "Based on data type and existing keywords"
      })
    }
  }

  return {
    score: Math.max(0, score),
    issues,
    suggestions
  }
}

/**
 * Generate keyword suggestions based on existing keywords and data type
 */
function generateKeywordSuggestions(
  existingKeywords: string[],
  dataType?: string
): string[] {
  const suggestions = []

  const dataTypeKeywords = {
    Vector: ["geospatial", "GIS", "spatial analysis", "cartography"],
    Raster: ["remote sensing", "imagery", "satellite", "aerial"],
    Table: ["tabular data", "statistics", "database", "records"],
    "Point Cloud": ["LiDAR", "3D", "point cloud", "laser scanning"]
  }

  if (dataType && dataTypeKeywords[dataType as keyof typeof dataTypeKeywords]) {
    const typeKeywords =
      dataTypeKeywords[dataType as keyof typeof dataTypeKeywords]
    for (const keyword of typeKeywords) {
      if (
        !existingKeywords.some(k =>
          k.toLowerCase().includes(keyword.toLowerCase())
        )
      ) {
        suggestions.push(keyword)
      }
    }
  }

  return suggestions.slice(0, 3)
}

/**
 * Submit metadata for quality review workflow
 */
export async function submitForReviewAction(
  recordId: string
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    // Check if user has permission to submit
    const record = await db.query.metadataRecords.findFirst({
      where: eq(metadataRecordsTable.id, recordId)
    })

    if (!record) {
      return {
        isSuccess: false,
        message: "Metadata record not found"
      }
    }

    if (record.creatorUserId !== userId) {
      return {
        isSuccess: false,
        message: "Permission denied"
      }
    }

    // Perform quality check
    const assessment = performQualityAssessment(record)

    if (assessment.score < 60) {
      return {
        isSuccess: false,
        message: `Quality score too low (${assessment.score}%). Please address quality issues before submitting.`
      }
    }

    // Update status to under review
    await db
      .update(metadataRecordsTable)
      .set({
        status: "Pending Validation",
        updatedAt: new Date()
      })
      .where(eq(metadataRecordsTable.id, recordId))

    // TODO: Create review task/notification

    revalidatePath("/metadata")

    return {
      isSuccess: true,
      message: "Metadata submitted for review successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error submitting for review:", error)
    return {
      isSuccess: false,
      message: "Failed to submit for review"
    }
  }
}

/**
 * Approve metadata record for publication
 */
export async function approveMetadataAction(
  recordId: string,
  reviewNotes?: string
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    // TODO: Check if user has reviewer permissions

    await db
      .update(metadataRecordsTable)
      .set({
        status: "Published",
        publicationDate: new Date().toISOString(),
        updatedAt: new Date()
      })
      .where(eq(metadataRecordsTable.id, recordId))

    // TODO: Store review notes, notify creator

    revalidatePath("/metadata")

    return {
      isSuccess: true,
      message: "Metadata approved and published successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error approving metadata:", error)
    return {
      isSuccess: false,
      message: "Failed to approve metadata"
    }
  }
}

/**
 * Track analytics events for metadata usage
 */
export async function trackAnalyticsEventAction(
  event: AnalyticsEvent
): Promise<ActionState<void>> {
  try {
    // TODO: Store in analytics table or send to analytics service
    console.log("Analytics event:", event)

    return {
      isSuccess: true,
      message: "Analytics event tracked",
      data: undefined
    }
  } catch (error) {
    console.error("Error tracking analytics:", error)
    return {
      isSuccess: false,
      message: "Failed to track analytics event"
    }
  }
}

/**
 * Get metadata analytics for a record
 */
export async function getMetadataAnalyticsAction(recordId: string): Promise<
  ActionState<{
    views: number
    downloads: number
    shares: number
    bookmarks: number
    lastViewed?: string
  }>
> {
  try {
    // TODO: Query analytics data from database
    // For now, return mock data
    const mockAnalytics = {
      views: Math.floor(Math.random() * 1000) + 100,
      downloads: Math.floor(Math.random() * 100) + 10,
      shares: Math.floor(Math.random() * 50) + 5,
      bookmarks: Math.floor(Math.random() * 25) + 2,
      lastViewed: new Date().toISOString()
    }

    return {
      isSuccess: true,
      message: "Analytics retrieved successfully",
      data: mockAnalytics
    }
  } catch (error) {
    console.error("Error getting analytics:", error)
    return {
      isSuccess: false,
      message: "Failed to get analytics data"
    }
  }
}

/**
 * Export metadata in various formats
 */
export async function exportMetadataAction(
  recordId: string,
  format: "json" | "xml" | "csv" | "iso19139"
): Promise<ActionState<string>> {
  try {
    const record = await db.query.metadataRecords.findFirst({
      where: eq(metadataRecordsTable.id, recordId)
    })

    if (!record) {
      return {
        isSuccess: false,
        message: "Metadata record not found"
      }
    }

    let exportData: string

    switch (format) {
      case "json":
        exportData = JSON.stringify(record, null, 2)
        break
      case "xml":
        exportData = convertToXML(record)
        break
      case "csv":
        exportData = convertToCSV(record)
        break
      case "iso19139":
        exportData = convertToISO19139(record)
        break
      default:
        return {
          isSuccess: false,
          message: "Unsupported export format"
        }
    }

    // Track export event
    await trackAnalyticsEventAction({
      recordId,
      eventType: "export",
      metadata: { format }
    })

    return {
      isSuccess: true,
      message: "Metadata exported successfully",
      data: exportData
    }
  } catch (error) {
    console.error("Error exporting metadata:", error)
    return {
      isSuccess: false,
      message: "Failed to export metadata"
    }
  }
}

/**
 * Convert metadata record to XML format
 */
function convertToXML(record: SelectMetadataRecord): string {
  // Simplified XML conversion - in production, use proper XML library
  return `<?xml version="1.0" encoding="UTF-8"?>
<metadata>
  <title>${escapeXML(record.title)}</title>
  <abstract>${escapeXML(record.abstract)}</abstract>
  <dataType>${escapeXML(record.dataType)}</dataType>
  <status>${escapeXML(record.status)}</status>
  <createdAt>${record.createdAt}</createdAt>
  <updatedAt>${record.updatedAt}</updatedAt>
</metadata>`
}

/**
 * Convert metadata record to CSV format
 */
function convertToCSV(record: SelectMetadataRecord): string {
  const fields = [
    "ID",
    "Title",
    "Abstract",
    "Data Type",
    "Status",
    "Created",
    "Updated",
    "Keywords"
  ]

  const values = [
    record.id,
    `"${record.title.replace(/"/g, '""')}"`,
    `"${record.abstract.replace(/"/g, '""')}"`,
    record.dataType,
    record.status,
    record.createdAt,
    record.updatedAt,
    `"${record.keywords?.join(", ") || ""}"`
  ]

  return fields.join(",") + "\n" + values.join(",")
}

/**
 * Convert metadata record to ISO 19139 XML format
 */
function convertToISO19139(record: SelectMetadataRecord): string {
  // Simplified ISO 19139 conversion - in production, implement full standard
  return `<?xml version="1.0" encoding="UTF-8"?>
<gmd:MD_Metadata xmlns:gmd="http://www.isotc211.org/2005/gmd"
                  xmlns:gco="http://www.isotc211.org/2005/gco">
  <gmd:citation>
    <gmd:CI_Citation>
      <gmd:title>
        <gco:CharacterString>${escapeXML(record.title)}</gco:CharacterString>
      </gmd:title>
    </gmd:CI_Citation>
  </gmd:citation>
  <gmd:abstract>
    <gco:CharacterString>${escapeXML(record.abstract)}</gco:CharacterString>
  </gmd:abstract>
</gmd:MD_Metadata>`
}

/**
 * Escape XML characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
