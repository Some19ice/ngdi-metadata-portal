"use server"

import { NextRequest, NextResponse } from "next/server"
import { searchMetadataRecordsAction } from "@/actions/db/metadata-records-actions"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({
        isSuccess: true,
        message: "Query too short",
        data: []
      })
    }

    // Search for metadata records with a smaller page size for suggestions
    const result = await searchMetadataRecordsAction({
      query,
      page: 1,
      pageSize: 5 // Limit to 5 suggestions for performance
    })

    if (!result.isSuccess || !result.data) {
      return NextResponse.json({
        isSuccess: true,
        message: result.message || "No results",
        data: []
      })
    }

    // Transform metadata records into suggestion format
    const suggestions = result.data.records.map(record => ({
      id: record.id,
      title: record.title,
      description:
        record.purpose ||
        record.abstract ||
        record.supplementalInformation ||
        undefined
    }))

    return NextResponse.json({
      isSuccess: true,
      message: result.message,
      data: suggestions
    })
  } catch (error) {
    console.error("Error fetching metadata suggestions:", error)
    return NextResponse.json(
      { isSuccess: false, message: "Failed to fetch suggestions" },
      { status: 500 }
    )
  }
}
