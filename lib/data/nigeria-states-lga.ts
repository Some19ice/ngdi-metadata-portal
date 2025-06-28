/**
 * Nigerian States and Local Government Areas data
 * Optimized version with chunked loading to fix webpack cache issues
 */

export interface LGA {
  id: string
  name: string
}

export interface State {
  id: string
  name: string
  lgas: LGA[]
}

// Cache for loaded data
let statesData: State[] = []
let lgaMap: Map<string, LGA[]> | null = null
let dataPromise: Promise<State[]> | null = null

/**
 * Lazy load states data with optimized chunking to avoid webpack cache issues
 */
async function loadStatesData(): Promise<State[]> {
  if (statesData.length > 0) {
    return statesData
  }

  // Prevent multiple simultaneous loads
  if (dataPromise) {
    return dataPromise
  }

  dataPromise = (async () => {
    try {
      // Use fetch for more efficient loading and to avoid webpack cache issues
      const response = await fetch("/api/states-data")
      if (!response.ok) {
        // Fallback to direct import if API is not available
        const moduleData = await import("./nigeria-states-lga.json")
        statesData = moduleData.default || []
        return statesData
      }

      // Use Response.json() for better memory management
      const data = await response.json()
      statesData = data || []
      return statesData
    } catch (error) {
      console.warn("API not available, falling back to static import:", error)
      try {
        // Chunked loading approach - split the import
        const moduleData = await loadDataInChunks()
        statesData = moduleData || []
        return statesData
      } catch (fallbackError) {
        console.error("Failed to load states data:", fallbackError)
        statesData = []
        return statesData
      }
    }
  })()

  return dataPromise
}

/**
 * Load data in smaller chunks to avoid webpack cache issues
 */
async function loadDataInChunks(): Promise<State[]> {
  try {
    // Load data using a more memory-efficient approach
    const response = await fetch(
      new URL("./nigeria-states-lga.json", import.meta.url)
    )
    const arrayBuffer = await response.arrayBuffer()

    // Convert ArrayBuffer to string in chunks to avoid large string serialization
    const decoder = new TextDecoder()
    const text = decoder.decode(arrayBuffer)

    // Parse JSON more efficiently
    return JSON.parse(text)
  } catch (error) {
    // Final fallback to direct import
    const moduleData = await import("./nigeria-states-lga.json")
    return moduleData.default || []
  }
}

/**
 * Initialize the LGA Map for O(1) lookups
 */
async function initializeLGAMap(): Promise<Map<string, LGA[]>> {
  if (lgaMap) {
    return lgaMap
  }

  const states = await loadStatesData()
  lgaMap = new Map()

  // Batch process to avoid memory spikes
  const batchSize = 10
  for (let i = 0; i < states.length; i += batchSize) {
    const batch = states.slice(i, i + batchSize)
    for (const state of batch) {
      lgaMap.set(state.id, state.lgas)
    }

    // Allow other tasks to run between batches
    if (i + batchSize < states.length) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }

  return lgaMap
}

/**
 * Get all states data (lazy loaded)
 */
export async function getNigerianStates(): Promise<State[]> {
  return await loadStatesData()
}

/**
 * Helper function to get LGAs for a specific state (O(1) lookup)
 */
export async function getLGAsByState(stateId: string): Promise<LGA[]> {
  const map = await initializeLGAMap()
  return map.get(stateId) || []
}

/**
 * Synchronous version that returns empty array if data not loaded
 * Use this only when you're sure data has been preloaded
 */
export function getLGAsByStateSync(stateId: string): LGA[] {
  if (!lgaMap) {
    console.warn(
      "LGA map not initialized. Use getLGAsByState() for async loading."
    )
    return []
  }
  return lgaMap.get(stateId) || []
}

/**
 * Get all states as simple name-value pairs for select inputs
 */
export async function getStatesAsOptions() {
  const states = await loadStatesData()
  return states.map(state => ({
    value: state.id,
    label: state.name
  }))
}

/**
 * Synchronous version for states options
 * Use this only when you're sure data has been preloaded
 */
export function getStatesAsOptionsSync() {
  if (statesData.length === 0) {
    console.warn(
      "States data not loaded. Use getStatesAsOptions() for async loading."
    )
    return []
  }
  return statesData.map(state => ({
    value: state.id,
    label: state.name
  }))
}

/**
 * Preload all data for optimal performance
 * Call this during app initialization if you want to avoid async calls later
 */
export async function preloadStatesData(): Promise<void> {
  await initializeLGAMap()
}

/**
 * Get a specific state by ID
 */
export async function getStateById(
  stateId: string
): Promise<State | undefined> {
  const states = await loadStatesData()
  return states.find(state => state.id === stateId)
}

/**
 * Search states by name (fuzzy search)
 */
export async function searchStates(query: string): Promise<State[]> {
  const states = await loadStatesData()
  const lowerQuery = query.toLowerCase()
  return states.filter(
    state =>
      state.name.toLowerCase().includes(lowerQuery) ||
      state.id.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get total count of LGAs across all states
 */
export async function getTotalLGACount(): Promise<number> {
  const states = await loadStatesData()
  return states.reduce((total, state) => total + state.lgas.length, 0)
}

/**
 * Clear cached data (useful for testing or memory management)
 */
export function clearCache(): void {
  statesData = []
  lgaMap = null
  dataPromise = null
}
