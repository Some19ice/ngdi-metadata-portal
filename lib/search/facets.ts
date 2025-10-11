"use server"

import { db } from "@/db/db"
import { metadataRecordsTable, organizationsTable } from "@/db/schema"
import { count, desc, eq, sql } from "drizzle-orm"
import type { SearchFacets } from "@/types"
import { metadataCache } from "@/lib/cache"

/**
 * Get search facets with caching.
 * Facets are cached for 10 minutes since they don't change frequently.
 * Cache is invalidated when metadata records are created/updated/deleted.
 */
export async function getSearchFacets(): Promise<SearchFacets> {
  // Check cache first
  const cacheKey = "search:facets:all"
  const cached = metadataCache.get(cacheKey)
  if (cached) {
    return cached as SearchFacets
  }

  // Compute facets if not cached
  const facets = await computeSearchFacets()

  // Cache for 10 minutes (600000ms)
  metadataCache.set(cacheKey, facets, 10 * 60 * 1000)

  return facets
}

/**
 * Invalidate the facets cache.
 * Call this when metadata records are created, updated, or deleted.
 */
export async function invalidateSearchFacetsCache(): Promise<void> {
  metadataCache.delete("search:facets:all")
}

/**
 * Internal function to compute search facets from database.
 * This performs 5 separate queries which can be expensive.
 */
async function computeSearchFacets(): Promise<SearchFacets> {
  try {
    const dataTypesFacet = await db
      .select({ value: metadataRecordsTable.dataType, count: count() })
      .from(metadataRecordsTable)
      .where(eq(metadataRecordsTable.status, "Published"))
      .groupBy(metadataRecordsTable.dataType)
      .orderBy(desc(count()))

    const organizationsFacet = await db
      .select({ value: organizationsTable.name, count: count() })
      .from(metadataRecordsTable)
      .leftJoin(
        organizationsTable,
        eq(metadataRecordsTable.organizationId, organizationsTable.id)
      )
      .where(eq(metadataRecordsTable.status, "Published"))
      .groupBy(organizationsTable.name)
      .orderBy(desc(count()))

    const frameworkTypesFacet = await db
      .select({ value: metadataRecordsTable.frameworkType, count: count() })
      .from(metadataRecordsTable)
      .where(eq(metadataRecordsTable.status, "Published"))
      .groupBy(metadataRecordsTable.frameworkType)
      .orderBy(desc(count()))

    const yearsFacet = await db
      .select({
        value: sql<string>`EXTRACT(YEAR FROM ${metadataRecordsTable.productionDate})::text`,
        count: count()
      })
      .from(metadataRecordsTable)
      .where(eq(metadataRecordsTable.status, "Published"))
      .groupBy(sql`EXTRACT(YEAR FROM ${metadataRecordsTable.productionDate})`)
      .orderBy(desc(count()))

    const keywordsFacet = await db
      .select({
        value: sql<string>`unnest(${metadataRecordsTable.keywords}[1:3])`,
        count: count()
      })
      .from(metadataRecordsTable)
      .where(eq(metadataRecordsTable.status, "Published"))
      .groupBy(sql`unnest(${metadataRecordsTable.keywords}[1:3])`)
      .orderBy(desc(count()))
      .limit(15)

    return {
      dataTypes: dataTypesFacet
        .filter(f => f.value)
        .map(f => ({ value: f.value!, count: f.count })),
      organizations: organizationsFacet
        .filter(f => f.value)
        .map(f => ({ value: f.value!, count: f.count })),
      topicCategories: keywordsFacet
        .filter(f => f.value)
        .map(f => ({ value: f.value!, count: f.count })),
      frameworkTypes: frameworkTypesFacet
        .filter(f => f.value)
        .map(f => ({ value: f.value!, count: f.count })),
      years: yearsFacet
        .filter(f => f.value)
        .map(f => ({ value: f.value!, count: f.count }))
    }
  } catch (error) {
    console.error("Error getting search facets:", error)
    return {
      dataTypes: [],
      organizations: [],
      topicCategories: [],
      frameworkTypes: [],
      years: []
    }
  }
}
