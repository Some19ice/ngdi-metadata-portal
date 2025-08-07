"use server"

import { NextRequest, NextResponse } from "next/server"
import { searchMetadataRecordsAction } from "@/actions/db/metadata-records-actions"

// Helper function to remove undefined values from search parameters
function cleanSearchParams<T extends Record<string, any>>(params: T): T {
  const cleaned = { ...params }
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key as keyof typeof cleaned] === undefined) {
      delete cleaned[key as keyof typeof cleaned]
    }
  })
  return cleaned
}

// Helper function to handle search request and format response
async function handleSearchRequest(searchParams: any) {
  const cleanedParams = cleanSearchParams(searchParams)
  const result = await searchMetadataRecordsAction(cleanedParams)

  if (result.isSuccess) {
    return NextResponse.json({
      isSuccess: true,
      message: result.message,
      data: {
        records: result.data?.records || [],
        totalCount: result.data?.totalRecords || 0,
        totalPages: result.data?.totalPages || 0,
        currentPage: result.data?.currentPage || 1,
        pageSize: result.data?.pageSize || 20,
        appliedFilters: cleanedParams
      }
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
}

// Helper function to handle errors
function handleError(error: unknown) {
  console.error("API search error:", error)
  return NextResponse.json(
    {
      isSuccess: false,
      message: "Internal server error"
    },
    { status: 500 }
  )
}

// Helper function to extract search parameters from POST request body
function extractPostSearchParams(body: any) {
  return {
    query: body.query,
    organizationId: body.organizationIds?.[0], // Take first org ID if multiple
    status: body.status?.[0] as any, // Take first status if multiple
    temporalExtentStartDate: body.startDate || body.temporalExtentStartDate,
    temporalExtentEndDate: body.endDate || body.temporalExtentEndDate,
    frameworkType: body.frameworkTypes?.[0], // Take first framework type if multiple
    datasetType: body.dataTypes?.[0], // Take first data type if multiple
    bbox_north: body.bbox_north,
    bbox_south: body.bbox_south,
    bbox_east: body.bbox_east,
    bbox_west: body.bbox_west,
    sortBy: body.sortBy,
    sortOrder: validateSortOrder(body.sortOrder),
    page: body.page || 1,
    pageSize: body.pageSize || body.limit || 20
  }
}

// Helper function to get first non-empty parameter value from a list of aliases
function getFirstParam(
  searchParams: URLSearchParams,
  aliases: string[],
  splitComma = false
): string | undefined {
  for (const alias of aliases) {
    const value = searchParams.get(alias)
    if (value) {
      return splitComma ? value.split(",")[0] : value
    }
  }
  return undefined
}

// Helper function to validate sort order values
function validateSortOrder(
  value: string | undefined
): "asc" | "desc" | undefined {
  if (value === "asc" || value === "desc") {
    return value
  }
  return undefined
}

// Helper function to extract search parameters from GET request URL
function extractGetSearchParams(searchParams: URLSearchParams) {
  return {
    query: getFirstParam(searchParams, ["q", "query"]),
    organizationId: getFirstParam(
      searchParams,
      ["organizationIds", "organizationId"],
      true
    ),
    status: getFirstParam(searchParams, ["status"], true) as any,
    temporalExtentStartDate: getFirstParam(searchParams, [
      "startDate",
      "temporalExtentStartDate"
    ]),
    temporalExtentEndDate: getFirstParam(searchParams, [
      "endDate",
      "temporalExtentEndDate"
    ]),
    frameworkType: getFirstParam(
      searchParams,
      ["frameworkTypes", "frameworkType"],
      true
    ),
    datasetType: getFirstParam(
      searchParams,
      ["dataTypes", "datasetType"],
      true
    ),
    bbox_north: getFirstParam(searchParams, ["bbox_north", "n"]),
    bbox_south: getFirstParam(searchParams, ["bbox_south", "s"]),
    bbox_east: getFirstParam(searchParams, ["bbox_east", "e"]),
    bbox_west: getFirstParam(searchParams, ["bbox_west", "w"]),
    sortBy: getFirstParam(searchParams, ["sortBy", "sort"]),
    sortOrder: validateSortOrder(
      getFirstParam(searchParams, ["sortOrder", "order"])
    ),
    page: parseInt(getFirstParam(searchParams, ["page"]) || "1"),
    pageSize: parseInt(
      getFirstParam(searchParams, ["pageSize", "limit"]) || "20"
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const searchParams = extractPostSearchParams(body)
    return await handleSearchRequest(searchParams)
  } catch (error) {
    return handleError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchOptions = extractGetSearchParams(searchParams)
    return await handleSearchRequest(searchOptions)
  } catch (error) {
    return handleError(error)
  }
}
