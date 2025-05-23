import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db/db"
import { metadataRecordsTable, organizationsTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import {
  exportMetadataAction,
  trackAnalyticsEventAction,
  getMetadataAnalyticsAction
} from "@/actions/db/enhanced-metadata-workflow-actions"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const { recordId } = await params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get("format") || "json"
    const includeAnalytics = searchParams.get("analytics") === "true"

    // Get metadata record with organization info
    const record = await db
      .select({
        id: metadataRecordsTable.id,
        title: metadataRecordsTable.title,
        abstract: metadataRecordsTable.abstract,
        dataType: metadataRecordsTable.dataType,
        frameworkType: metadataRecordsTable.frameworkType,
        keywords: metadataRecordsTable.keywords,
        status: metadataRecordsTable.status,
        purpose: metadataRecordsTable.purpose,
        language: metadataRecordsTable.language,
        version: metadataRecordsTable.version,
        updateFrequency: metadataRecordsTable.updateFrequency,
        productionDate: metadataRecordsTable.productionDate,
        publicationDate: metadataRecordsTable.publicationDate,
        lastRevisionDate: metadataRecordsTable.lastRevisionDate,
        thumbnailUrl: metadataRecordsTable.thumbnailUrl,
        cloudCoverPercentage: metadataRecordsTable.cloudCoverPercentage,
        locationInfo: metadataRecordsTable.locationInfo,
        temporalInfo: metadataRecordsTable.temporalInfo,
        fundamentalDatasetsInfo: metadataRecordsTable.fundamentalDatasetsInfo,
        spatialInfo: metadataRecordsTable.spatialInfo,
        technicalDetailsInfo: metadataRecordsTable.technicalDetailsInfo,
        constraintsInfo: metadataRecordsTable.constraintsInfo,
        dataQualityInfo: metadataRecordsTable.dataQualityInfo,
        processingInfo: metadataRecordsTable.processingInfo,
        distributionInfo: metadataRecordsTable.distributionInfo,
        metadataReferenceInfo: metadataRecordsTable.metadataReferenceInfo,
        additionalInfo: metadataRecordsTable.additionalInfo,
        organizationId: metadataRecordsTable.organizationId,
        userId: metadataRecordsTable.userId,
        createdAt: metadataRecordsTable.createdAt,
        updatedAt: metadataRecordsTable.updatedAt,
        organization: {
          id: organizationsTable.id,
          name: organizationsTable.name,
          type: organizationsTable.type,
          description: organizationsTable.description,
          contactEmail: organizationsTable.contactEmail,
          website: organizationsTable.website
        }
      })
      .from(metadataRecordsTable)
      .leftJoin(
        organizationsTable,
        eq(metadataRecordsTable.organizationId, organizationsTable.id)
      )
      .where(eq(metadataRecordsTable.id, recordId))
      .limit(1)

    if (!record.length) {
      return NextResponse.json(
        { error: "Metadata record not found" },
        { status: 404 }
      )
    }

    const metadataRecord = record[0]

    // Check if record is published or user has access
    if (metadataRecord.status !== "Published") {
      const { userId } = await auth()
      if (!userId || metadataRecord.userId !== userId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    // Track view analytics
    await trackAnalyticsEventAction({
      recordId,
      eventType: "view",
      metadata: {
        format,
        userAgent: request.headers.get("user-agent"),
        referer: request.headers.get("referer"),
        timestamp: new Date().toISOString()
      }
    })

    // Include analytics if requested
    let analytics = null
    if (includeAnalytics) {
      const analyticsResult = await getMetadataAnalyticsAction(recordId)
      if (analyticsResult.isSuccess) {
        analytics = analyticsResult.data
      }
    }

    // Handle different export formats
    if (format !== "json") {
      const exportResult = await exportMetadataAction(recordId, format as any)

      if (!exportResult.isSuccess) {
        return NextResponse.json(
          { error: exportResult.message },
          { status: 400 }
        )
      }

      const contentTypes = {
        xml: "application/xml",
        csv: "text/csv",
        iso19139: "application/xml"
      }

      const headers = {
        "Content-Type":
          contentTypes[format as keyof typeof contentTypes] || "text/plain",
        "Content-Disposition": `attachment; filename="metadata-${recordId}.${format}"`
      }

      return new NextResponse(exportResult.data, { headers })
    }

    // Return JSON response with full metadata
    const response = {
      metadata: metadataRecord,
      analytics: analytics,
      _links: {
        self: `/api/metadata/${recordId}`,
        exports: {
          json: `/api/metadata/${recordId}?format=json`,
          xml: `/api/metadata/${recordId}?format=xml`,
          csv: `/api/metadata/${recordId}?format=csv`,
          iso19139: `/api/metadata/${recordId}?format=iso19139`
        }
      }
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, max-age=300", // 5 minutes cache
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    })
  } catch (error) {
    console.error("Error fetching metadata:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  })
}
