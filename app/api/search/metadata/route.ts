"use server"

import { NextRequest, NextResponse } from "next/server"
import { searchMetadataRecordsAction } from "@/actions/db/metadata-records-actions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Map the request body to the parameters expected by searchMetadataRecordsAction
    const searchParams = {
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
      sortOrder: body.sortOrder,
      page: body.page || 1,
      pageSize: body.pageSize || body.limit || 20
    }

    // Remove undefined values
    Object.keys(searchParams).forEach(key => {
      if (searchParams[key as keyof typeof searchParams] === undefined) {
        delete searchParams[key as keyof typeof searchParams]
      }
    })

    const result = await searchMetadataRecordsAction(searchParams)

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
          appliedFilters: searchParams
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
  } catch (error) {
    console.error("API search error:", error)
    return NextResponse.json(
      {
        isSuccess: false,
        message: "Internal server error"
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Convert URL search params to the format expected by searchMetadataRecordsAction
    const searchOptions = {
      query: searchParams.get("q") || searchParams.get("query") || undefined,
      organizationId:
        searchParams.get("organizationIds")?.split(",")[0] ||
        searchParams.get("organizationId") ||
        undefined,
      status: (searchParams.get("status")?.split(",")[0] as any) || undefined,
      temporalExtentStartDate:
        searchParams.get("startDate") ||
        searchParams.get("temporalExtentStartDate") ||
        undefined,
      temporalExtentEndDate:
        searchParams.get("endDate") ||
        searchParams.get("temporalExtentEndDate") ||
        undefined,
      frameworkType:
        searchParams.get("frameworkTypes")?.split(",")[0] ||
        searchParams.get("frameworkType") ||
        undefined,
      datasetType:
        searchParams.get("dataTypes")?.split(",")[0] ||
        searchParams.get("datasetType") ||
        undefined,
      bbox_north:
        searchParams.get("bbox_north") || searchParams.get("n") || undefined,
      bbox_south:
        searchParams.get("bbox_south") || searchParams.get("s") || undefined,
      bbox_east:
        searchParams.get("bbox_east") || searchParams.get("e") || undefined,
      bbox_west:
        searchParams.get("bbox_west") || searchParams.get("w") || undefined,
      sortBy:
        searchParams.get("sortBy") || searchParams.get("sort") || undefined,
      sortOrder:
        ((searchParams.get("sortOrder") || searchParams.get("order")) as
          | "asc"
          | "desc") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(
        searchParams.get("pageSize") || searchParams.get("limit") || "20"
      )
    }

    // Remove undefined values
    Object.keys(searchOptions).forEach(key => {
      if (searchOptions[key as keyof typeof searchOptions] === undefined) {
        delete searchOptions[key as keyof typeof searchOptions]
      }
    })

    const result = await searchMetadataRecordsAction(searchOptions)

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
          appliedFilters: searchOptions
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
  } catch (error) {
    console.error("API search error:", error)
    return NextResponse.json(
      {
        isSuccess: false,
        message: "Internal server error"
      },
      { status: 500 }
    )
  }
}
