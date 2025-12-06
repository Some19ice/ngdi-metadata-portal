/**
 * Performance utilities for map operations
 * Provides debouncing, throttling, and resource management
 */

import { useCallback, useRef, useEffect } from "react"

export interface UseMapPerformanceOptions {
  debounceMs?: number
  throttleMs?: number
}

export function useMapPerformance(options: UseMapPerformanceOptions = {}) {
  const { debounceMs = 300, throttleMs = 100 } = options
  const debounceTimerRef = useRef<NodeJS.Timeout>(undefined)
  const throttleTimerRef = useRef<NodeJS.Timeout>(undefined)
  const lastExecutedRef = useRef<number>(0)
  const isThrottledRef = useRef<boolean>(false)

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current)
      }
    }
  }, [])

  const debounce = useCallback(
    <T extends (...args: unknown[]) => void>(
      func: T
    ): ((...args: Parameters<T>) => void) => {
      return (...args: Parameters<T>) => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }

        debounceTimerRef.current = setTimeout(() => {
          func(...args)
        }, debounceMs)
      }
    },
    [debounceMs]
  )

  const throttle = useCallback(
    <T extends (...args: unknown[]) => void>(
      func: T
    ): ((...args: Parameters<T>) => void) => {
      return (...args: Parameters<T>) => {
        const now = Date.now()

        if (!isThrottledRef.current) {
          func(...args)
          lastExecutedRef.current = now
          isThrottledRef.current = true

          throttleTimerRef.current = setTimeout(() => {
            isThrottledRef.current = false
          }, throttleMs)
        } else {
          // Clear previous delayed call
          if (throttleTimerRef.current) {
            clearTimeout(throttleTimerRef.current)
          }

          // Schedule new delayed call
          throttleTimerRef.current = setTimeout(
            () => {
              if (Date.now() - lastExecutedRef.current >= throttleMs) {
                func(...args)
                lastExecutedRef.current = Date.now()
              }
              isThrottledRef.current = false
            },
            throttleMs - (now - lastExecutedRef.current)
          )
        }
      }
    },
    [throttleMs]
  )

  return { debounce, throttle }
}

/**
 * Hook for managing component mount state
 */
export function useIsMounted() {
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return useCallback(() => isMountedRef.current, [])
}

/**
 * Hook for creating abort controllers with timeout
 */
export function useAbortController(timeoutMs: number = 10000) {
  const controllerRef = useRef<AbortController>(undefined)
  const timeoutRef = useRef<NodeJS.Timeout>(undefined)

  const createController = useCallback(() => {
    // Cleanup previous controller
    if (controllerRef.current) {
      controllerRef.current.abort()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Create new controller
    controllerRef.current = new AbortController()

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      if (controllerRef.current) {
        controllerRef.current.abort()
      }
    }, timeoutMs)

    return controllerRef.current
  }, [timeoutMs])

  const cleanup = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return { createController, cleanup }
}
