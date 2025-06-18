/**
 * Nigerian States and Local Government Areas data
 * Optimized version with lazy loading and Map-based lookups
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
let statesData: State[] | null = null
let lgaMap: Map<string, LGA[]> | null = null

/**
 * Lazy load states data from JSON file
 */
async function loadStatesData(): Promise<State[]> {
  if (statesData) {
    return statesData
  }

  try {
    // Dynamic import to avoid including in initial bundle
    const response = await import("./nigeria-states-lga.json")
    statesData = response.default
    return statesData
  } catch (error) {
    console.error("Failed to load states data:", error)
    return []
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

  for (const state of states) {
    lgaMap.set(state.id, state.lgas)
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
  if (!statesData) {
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
