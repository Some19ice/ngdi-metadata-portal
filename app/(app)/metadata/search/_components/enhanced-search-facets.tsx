"use server"

import { db } from "@/db/db"
import { metadataRecordsTable, organizationsTable } from "@/db/schema"
import { eq, count, desc, sql } from "drizzle-orm"

export interface SearchFacets {
  dataTypes: { value: string; count: number }[]
  organizations: { value: string; count: number }[]
  topicCategories: { value: string; count: number }[]
  frameworkTypes: { value: string; count: number }[]
  years: { value: string; count: number }[]
}

export async function getSearchFacets(): Promise<SearchFacets> {
  try {
    // Get data types facet
    const dataTypesFacet = await db
      .select({
        value: metadataRecordsTable.dataType,
        count: count()
      })
      .from(metadataRecordsTable)
      .where(eq(metadataRecordsTable.status, "Published"))
      .groupBy(metadataRecordsTable.dataType)
      .orderBy(desc(count()))

    // Get organizations facet
    const organizationsFacet = await db
      .select({
        value: organizationsTable.name,
        count: count()
      })
      .from(metadataRecordsTable)
      .leftJoin(
        organizationsTable,
        eq(metadataRecordsTable.organizationId, organizationsTable.id)
      )
      .where(eq(metadataRecordsTable.status, "Published"))
      .groupBy(organizationsTable.name)
      .orderBy(desc(count()))

    // Get framework types facet
    const frameworkTypesFacet = await db
      .select({
        value: metadataRecordsTable.frameworkType,
        count: count()
      })
      .from(metadataRecordsTable)
      .where(eq(metadataRecordsTable.status, "Published"))
      .groupBy(metadataRecordsTable.frameworkType)
      .orderBy(desc(count()))

    // Get years facet (from production date)
    const yearsFacet = await db
      .select({
        value: sql<string>`EXTRACT(YEAR FROM ${metadataRecordsTable.productionDate})::text`,
        count: count()
      })
      .from(metadataRecordsTable)
      .where(eq(metadataRecordsTable.status, "Published"))
      .groupBy(sql`EXTRACT(YEAR FROM ${metadataRecordsTable.productionDate})`)
      .orderBy(desc(count()))

    // Simple topic categories from first few keywords
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
        .map(f => ({
          value: f.value!,
          count: f.count
        })),
      organizations: organizationsFacet
        .filter(f => f.value)
        .map(f => ({
          value: f.value!,
          count: f.count
        })),
      topicCategories: keywordsFacet
        .filter(f => f.value)
        .map(f => ({
          value: f.value!,
          count: f.count
        })),
      frameworkTypes: frameworkTypesFacet
        .filter(f => f.value)
        .map(f => ({
          value: f.value!,
          count: f.count
        })),
      years: yearsFacet
        .filter(f => f.value)
        .map(f => ({
          value: f.value!,
          count: f.count
        }))
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
