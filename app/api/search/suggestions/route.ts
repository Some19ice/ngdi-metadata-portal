import { NextRequest, NextResponse } from "next/server"
import { searchMetadataSuggestionsAction } from "@/actions/db/metadata-records-actions"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limit = parseInt(searchParams.get("limit") || "10")

    if (!query || query.length < 2) {
      return NextResponse.json({
        isSuccess: true,
        message: "Query too short",
        data: []
      })
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        {
          isSuccess: false,
          message: "Limit must be between 1 and 50"
        },
        { status: 400 }
      )
    }

    const result = await searchMetadataSuggestionsAction({ query, limit })

    if (result.isSuccess) {
      // Transform the data to match the expected SearchSuggestion format
      const suggestions =
        result.data?.map(item => ({
          id: item.id,
          title: item.title,
          type: "record" as const,
          category: "metadata"
        })) || []

      return NextResponse.json({
        isSuccess: true,
        message: result.message,
        data: suggestions
      })
    } else {
      return NextResponse.json(
        {
          isSuccess: false,
          message: result.message
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("API suggestions error:", error)
    return NextResponse.json(
      {
        isSuccess: false,
        message: "Internal server error"
      },
      { status: 500 }
    )
  }
}
