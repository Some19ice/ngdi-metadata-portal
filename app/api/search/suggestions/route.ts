"use server"

import { NextRequest } from "next/server"
import { GET as getMetadataSuggestions } from "@/app/api/search/metadata-suggestions/route"

// Backward-compatible alias for metadata suggestions
export async function GET(request: NextRequest) {
  return getMetadataSuggestions(request)
}
