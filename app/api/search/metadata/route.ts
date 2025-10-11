"use server"

import { NextRequest, NextResponse } from "next/server"
import { searchMetadataRecordsAction } from "@/actions/db/metadata-records-actions"
import { getSearchFacets } from "@/lib/search/facets"

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
    // Fetch facets (non-blocking if fails)
    let facets: any = undefined
    try {
      facets = await getSearchFacets()
    } catch (e) {
      console.warn("Failed to load search facets:", e)
    }
    return NextResponse.json({
      isSuccess: true,
      message: result.message,
      data: {
        records: result.data?.records || [],
        totalCount: result.data?.totalRecords || 0,
        totalPages: result.data?.totalPages || 0,
        currentPage: result.data?.currentPage || 1,
        pageSize: result.data?.pageSize || 20,
        appliedFilters: cleanedParams,
        facets
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
  // Normalize sortBy aliases
  const sortBy = body.sortBy === "date" ? "createdAt" : body.sortBy

  return {
    query: body.query,
    // Support arrays for multi-select filters; keep legacy single fields
    organizationIds: Array.isArray(body.organizationIds)
      ? body.organizationIds
      : body.organizationId
        ? [body.organizationId]
        : undefined,
    statuses: Array.isArray(body.status)
      ? body.status
      : body.status
        ? [body.status]
        : undefined,
    temporalExtentStartDate: body.startDate || body.temporalExtentStartDate,
    temporalExtentEndDate: body.endDate || body.temporalExtentEndDate,
    frameworkTypes: Array.isArray(body.frameworkTypes)
      ? body.frameworkTypes
      : body.frameworkType
        ? [body.frameworkType]
        : undefined,
    datasetTypes: Array.isArray(body.dataTypes)
      ? body.dataTypes
      : body.datasetType
        ? [body.datasetType]
        : undefined,
    bbox_north: body.bbox_north,
    bbox_south: body.bbox_south,
    bbox_east: body.bbox_east,
    bbox_west: body.bbox_west,
    sortBy,
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
  // Helpers to split comma lists to arrays
  const splitList = (value?: string | undefined) =>
    value
      ? value
          .split(",")
          .map(v => v.trim())
          .filter(Boolean)
      : undefined

  const rawSortBy = getFirstParam(searchParams, ["sortBy", "sort"]) || undefined
  const sortBy = rawSortBy === "date" ? "createdAt" : rawSortBy

  return {
    query: getFirstParam(searchParams, ["q", "query"]),
    organizationIds: splitList(
      getFirstParam(
        searchParams,
        ["orgIds", "organizationIds", "organizationId"],
        true
      )
    ),
    statuses: splitList(getFirstParam(searchParams, ["status"], true)) as any,
    temporalExtentStartDate: getFirstParam(searchParams, [
      "startDate",
      "temporalExtentStartDate"
    ]),
    temporalExtentEndDate: getFirstParam(searchParams, [
      "endDate",
      "temporalExtentEndDate"
    ]),
    frameworkTypes: splitList(
      getFirstParam(
        searchParams,
        ["frameworks", "frameworkTypes", "frameworkType"],
        true
      )
    ),
    datasetTypes: splitList(
      getFirstParam(searchParams, ["types", "dataTypes", "datasetType"], true)
    ),
    bbox_north: getFirstParam(searchParams, ["bbox_north", "n"]),
    bbox_south: getFirstParam(searchParams, ["bbox_south", "s"]),
    bbox_east: getFirstParam(searchParams, ["bbox_east", "e"]),
    bbox_west: getFirstParam(searchParams, ["bbox_west", "w"]),
    sortBy,
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
    // Safely parse JSON body; handle empty body gracefully
    let body: any = {}
    try {
      const text = await request.text()
      body = text ? JSON.parse(text) : {}
    } catch {
      body = {}
    }
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
