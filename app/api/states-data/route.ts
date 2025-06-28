"use server"

import { NextResponse } from "next/server"
import statesData from "@/lib/data/nigeria-states-lga.json"

export async function GET() {
  try {
    // Set appropriate cache headers to optimize performance
    return NextResponse.json(statesData, {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800", // Cache for 1 day, stale-while-revalidate for 1 week
        "Content-Type": "application/json"
      }
    })
  } catch (error) {
    console.error("Error serving states data:", error)
    return NextResponse.json(
      { error: "Failed to load states data" },
      { status: 500 }
    )
  }
}
