import { useState, useEffect, useCallback, useMemo } from "react"
import {
  getNigerianStates,
  getLGAsByState,
  getStatesAsOptions,
  preloadStatesData,
  type State,
  type LGA
} from "@/lib/data/nigeria-states-lga"

interface UseNigerianStatesReturn {
  states: State[]
  statesOptions: Array<{ value: string; label: string }>
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  preload: () => Promise<void>
}

interface UseStateLGAsReturn {
  lgas: LGA[]
  isLoading: boolean
  error: string | null
}

/**
 * Hook for managing Nigerian states data with async loading and caching
 */
export function useNigerianStates(): UseNigerianStatesReturn {
  const [states, setStates] = useState<State[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStates = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [statesData, statesOptions] = await Promise.all([
        getNigerianStates(),
        getStatesAsOptions()
      ])

      setStates(statesData)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load states data"
      setError(errorMessage)
      console.error("Error loading Nigerian states:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const preload = useCallback(async () => {
    try {
      await preloadStatesData()
    } catch (err) {
      console.error("Error preloading states data:", err)
    }
  }, [])

  // Memoized states options to avoid unnecessary recalculations
  const statesOptions = useMemo(() => {
    return states.map(state => ({
      value: state.id,
      label: state.name
    }))
  }, [states])

  useEffect(() => {
    loadStates()
  }, [loadStates])

  return {
    states,
    statesOptions,
    isLoading,
    error,
    refetch: loadStates,
    preload
  }
}

/**
 * Hook for getting LGAs for a specific state with caching
 */
export function useStateLGAs(
  stateId: string | null | undefined
): UseStateLGAsReturn {
  const [lgas, setLGAs] = useState<LGA[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLGAs = useCallback(async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const lgasData = await getLGAsByState(id)
      setLGAs(lgasData)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load LGAs data"
      setError(errorMessage)
      setLGAs([])
      console.error("Error loading LGAs for state:", id, err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (stateId) {
      loadLGAs(stateId)
    } else {
      setLGAs([])
      setIsLoading(false)
      setError(null)
    }
  }, [stateId, loadLGAs])

  return {
    lgas,
    isLoading,
    error
  }
}

/**
 * Hook that provides synchronous access to states data after preloading
 * Use this when you want to preload data during app initialization
 */
export function usePreloadedNigerianStates() {
  const [isPreloaded, setIsPreloaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const preload = useCallback(async () => {
    try {
      setError(null)
      await preloadStatesData()
      setIsPreloaded(true)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to preload states data"
      setError(errorMessage)
      console.error("Error preloading states data:", err)
    }
  }, [])

  useEffect(() => {
    preload()
  }, [preload])

  return {
    isPreloaded,
    error,
    preload
  }
}
