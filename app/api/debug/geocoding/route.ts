"use server"

import { NextRequest, NextResponse } from "next/server"

// Debug endpoint to check geocoding configuration
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const testQuery = searchParams.get("q") || "Lagos"

  // Check environment variables
  const envCheck = {
    MAPTILER_API_KEY_SERVER: !!process.env.MAPTILER_API_KEY_SERVER,
    MAPTILER_API_KEY: !!process.env.MAPTILER_API_KEY,
    NEXT_PUBLIC_MAPTILER_API_KEY: !!process.env.NEXT_PUBLIC_MAPTILER_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  }

  // Try to make a test request to our geocoding endpoint
  let geocodingTest = null
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:${process.env.PORT || 3000}`)

    const testUrl = `${baseUrl}/api/map/geocode?q=${encodeURIComponent(testQuery)}&limit=1`

    const testResponse = await fetch(testUrl, {
      headers: {
        "User-Agent": "NGDI-Debug/1.0"
      }
    })

    geocodingTest = {
      url: testUrl,
      status: testResponse.status,
      statusText: testResponse.statusText,
      ok: testResponse.ok,
      data: testResponse.ok
        ? await testResponse.json()
        : await testResponse.text()
    }
  } catch (error) {
    geocodingTest = {
      error: error instanceof Error ? error.message : String(error)
    }
  }

  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      geocodingTest,
      testQuery
    },
    {
      headers: {
        "Cache-Control": "no-cache"
      }
    }
  )
}
