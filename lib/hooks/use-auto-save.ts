import { useEffect, useRef, useState, useCallback } from "react"

export interface UseAutoSaveOptions<T> {
  key: string // localStorage key
  data: T // Data to save
  onRestore?: (data: T) => void // Callback when data is restored
  debounceMs?: number // Debounce delay for saves (default: 1000ms)
  autoSaveInterval?: number // Interval for periodic saves (default: 30000ms)
  enabled?: boolean // Whether auto-save is enabled (default: true)
}

export interface UseAutoSaveReturn<T> {
  lastSaved: Date | null
  isSaving: boolean
  hasUnsavedChanges: boolean
  saveNow: () => Promise<void>
  restoreData: () => void
  clearSavedData: () => void
  hasSavedData: boolean
}

export function useAutoSave<T>({
  key,
  data,
  onRestore,
  debounceMs = 1000,
  autoSaveInterval = 30000,
  enabled = true
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [hasSavedData, setHasSavedData] = useState(false)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataRef = useRef<string>("")
  const mountedRef = useRef(true)

  // Storage keys
  const dataKey = `autosave_${key}_data`
  const timestampKey = `autosave_${key}_timestamp`

  // Check for existing saved data on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(dataKey)
      const savedTimestamp = localStorage.getItem(timestampKey)

      if (savedData && savedTimestamp) {
        setHasSavedData(true)
        setLastSaved(new Date(savedTimestamp))
      }
    } catch (error) {
      console.warn("Failed to check for saved data:", error)
    }
  }, [dataKey, timestampKey])

  // Save function
  const saveToStorage = useCallback(async (): Promise<void> => {
    if (!enabled || !mountedRef.current) return

    try {
      setIsSaving(true)
      const timestamp = new Date()
      const serializedData = JSON.stringify(data)

      localStorage.setItem(dataKey, serializedData)
      localStorage.setItem(timestampKey, timestamp.toISOString())

      setLastSaved(timestamp)
      setHasUnsavedChanges(false)
      setHasSavedData(true)
      // Ensure lastDataRef is updated with the saved data
      lastDataRef.current = serializedData
    } catch (error) {
      console.error("Failed to save data:", error)
    } finally {
      if (mountedRef.current) {
        setIsSaving(false)
      }
    }
  }, [data, enabled, dataKey, timestampKey])

  // Manual save function
  const saveNow = useCallback(async (): Promise<void> => {
    // Clear any pending debounced save
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    await saveToStorage()
  }, [saveToStorage])

  // Restore function
  const restoreData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(dataKey)
      if (savedData && onRestore) {
        const parsedData = JSON.parse(savedData)
        onRestore(parsedData)
        setHasUnsavedChanges(false)
      }
    } catch (error) {
      console.error("Failed to restore data:", error)
    }
  }, [dataKey, onRestore])

  // Clear saved data function
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(dataKey)
      localStorage.removeItem(timestampKey)
      setLastSaved(null)
      setHasSavedData(false)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("Failed to clear saved data:", error)
    }
  }, [dataKey, timestampKey])

  // Watch for data changes and trigger debounced save
  useEffect(() => {
    if (!enabled) return

    const currentData = JSON.stringify(data)
    const hasChanged =
      currentData !== lastDataRef.current && lastDataRef.current !== ""

    if (hasChanged) {
      setHasUnsavedChanges(true)
      // Update lastDataRef immediately to prevent duplicate triggers
      lastDataRef.current = currentData

      // Clear existing debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      // Set new debounce timer
      debounceRef.current = setTimeout(() => {
        saveToStorage()
      }, debounceMs)
    } else if (lastDataRef.current === "") {
      // Initial data load
      lastDataRef.current = currentData
    }
  }, [data, enabled, debounceMs, saveToStorage])

  // Set up interval-based auto-save
  useEffect(() => {
    if (!enabled || !autoSaveInterval) return

    intervalRef.current = setInterval(() => {
      if (hasUnsavedChanges && !isSaving) {
        saveToStorage()
      }
    }, autoSaveInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, autoSaveInterval, hasUnsavedChanges, isSaving, saveToStorage])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return {
    lastSaved,
    isSaving,
    hasUnsavedChanges,
    saveNow,
    restoreData,
    clearSavedData,
    hasSavedData
  }
}
