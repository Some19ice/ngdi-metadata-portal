import { feature } from "topojson-client"
import { Topology } from "topojson-specification"
import { FeatureCollection } from "geojson"

let cachedCountries: FeatureCollection | null = null

export async function loadGlobeData(): Promise<FeatureCollection> {
  // Return cached data if available
  if (cachedCountries) {
    return cachedCountries
  }

  try {
    // Dynamically fetch the TopoJSON file from the public directory
    const response = await fetch("/globe.topo.json")

    if (!response.ok) {
      throw new Error(`Failed to fetch globe data: ${response.statusText}`)
    }

    const topology: Topology = await response.json()

    // Convert TopoJSON to GeoJSON using topojson-client
    // The feature function returns a single Feature or FeatureCollection
    const result = feature(topology, topology.objects.countries)

    // Ensure we have a FeatureCollection
    const countries: FeatureCollection =
      result.type === "FeatureCollection"
        ? result
        : {
            type: "FeatureCollection",
            features: [result]
          }

    // Cache the result
    cachedCountries = countries

    return countries
  } catch (error) {
    console.error("Error loading globe data:", error)
    // Return empty FeatureCollection on error
    return {
      type: "FeatureCollection",
      features: []
    }
  }
}

// Preload function for optimization
export function preloadGlobeData(): void {
  // Start loading in the background
  loadGlobeData().catch(() => {
    // Silently handle errors during preload
  })
}
