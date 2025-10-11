/**
 * Search analytics tracking
 * Tracks search queries, results, and user interactions for insights
 */

export interface SearchAnalyticsEvent {
  query: string
  filters: Record<string, any>
  resultsCount: number
  searchTime?: number
  userId?: string
  sessionId?: string
  timestamp: Date
}

export interface SearchClickEvent {
  query: string
  resultId: string
  resultPosition: number
  userId?: string
  sessionId?: string
  timestamp: Date
}

/**
 * Track a search event
 */
export async function trackSearch(
  event: Omit<SearchAnalyticsEvent, "timestamp">
): Promise<void> {
  try {
    const analyticsEvent: SearchAnalyticsEvent = {
      ...event,
      timestamp: new Date()
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Search Analytics]", analyticsEvent)
    }

    // Send to analytics endpoint (non-blocking)
    fetch("/api/analytics/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(analyticsEvent),
      // Don't wait for response
      keepalive: true
    }).catch(err => {
      // Silently fail - don't disrupt user experience
      console.debug("Analytics tracking failed:", err)
    })
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.debug("Analytics error:", error)
  }
}

/**
 * Track when a user clicks on a search result
 */
export async function trackSearchClick(
  event: Omit<SearchClickEvent, "timestamp">
): Promise<void> {
  try {
    const analyticsEvent: SearchClickEvent = {
      ...event,
      timestamp: new Date()
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Search Click Analytics]", analyticsEvent)
    }

    // Send to analytics endpoint (non-blocking)
    fetch("/api/analytics/search-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(analyticsEvent),
      keepalive: true
    }).catch(err => {
      console.debug("Analytics tracking failed:", err)
    })
  } catch (error) {
    console.debug("Analytics error:", error)
  }
}

/**
 * Generate a session ID for tracking user sessions
 * Uses sessionStorage to persist across page loads within the same session
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return ""

  try {
    const storageKey = "search_session_id"
    let sessionId = sessionStorage.getItem(storageKey)

    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      sessionStorage.setItem(storageKey, sessionId)
    }

    return sessionId
  } catch {
    // Fallback if sessionStorage is not available
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }
}

/**
 * Sanitize search query for analytics
 * Remove sensitive information and normalize
 */
export function sanitizeQuery(query: string): string {
  if (!query) return ""

  return query.trim().toLowerCase().substring(0, 200) // Limit length
}

/**
 * Sanitize filters for analytics
 * Remove sensitive information
 */
export function sanitizeFilters(
  filters: Record<string, any>
): Record<string, any> {
  const sanitized: Record<string, any> = {}

  // Only include non-sensitive filter fields
  const allowedFields = [
    "dataTypes",
    "organizations",
    "frameworkTypes",
    "topicCategories",
    "sortBy",
    "sortOrder",
    "page",
    "limit",
    "hasTemporalFilter",
    "hasSpatialFilter"
  ]

  for (const [key, value] of Object.entries(filters)) {
    if (allowedFields.includes(key)) {
      sanitized[key] = value
    }
  }

  // Add boolean flags for privacy-sensitive filters
  if (filters.startDate || filters.endDate) {
    sanitized.hasTemporalFilter = true
  }

  if (filters.spatialBounds) {
    sanitized.hasSpatialFilter = true
  }

  return sanitized
}
