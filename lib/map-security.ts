/**
 * Security utilities for safe DOM manipulation in map components
 * Prevents XSS vulnerabilities from HTML injection
 */

export interface MarkerElementOptions {
  className?: string
  title?: string
  ariaLabel?: string
  size?: "small" | "medium" | "large"
  variant?: "primary" | "secondary" | "cluster" | "selected"
}

export interface ClusterMarkerOptions extends MarkerElementOptions {
  count: number
  isExpanded?: boolean
}

/**
 * Safely creates a marker element without HTML injection vulnerabilities
 */
export function createSafeMarkerElement(
  content: string | number,
  options: MarkerElementOptions = {}
): HTMLElement {
  const {
    className = "",
    title = "",
    ariaLabel,
    size = "medium",
    variant = "primary"
  } = options

  const element = document.createElement("div")
  element.className = `safe-marker ${className} marker-${size} marker-${variant}`

  if (title) {
    element.title = title
  }

  if (ariaLabel) {
    element.setAttribute("aria-label", ariaLabel)
    element.setAttribute("role", "button")
    element.setAttribute("tabindex", "0")
  }

  // Safe text content - no HTML injection possible
  element.textContent = String(content)

  return element
}

/**
 * Creates a safe cluster marker with count display
 */
export function createSafeClusterMarker(
  options: ClusterMarkerOptions
): HTMLElement {
  const {
    count,
    isExpanded = false,
    className = "",
    title = `Cluster of ${count} items`,
    ariaLabel = `Cluster containing ${count} metadata records. Click to expand.`
  } = options

  const container = document.createElement("div")
  container.className = `safe-cluster-marker ${className} ${isExpanded ? "expanded" : ""}`
  container.title = title
  container.setAttribute("aria-label", ariaLabel)
  container.setAttribute("role", "button")
  container.setAttribute("tabindex", "0")
  container.setAttribute("aria-expanded", String(isExpanded))

  // Create the visual cluster element safely
  const circle = document.createElement("div")
  circle.className = "cluster-circle"

  const countElement = document.createElement("span")
  countElement.className = "cluster-count"
  countElement.textContent = String(count)
  countElement.setAttribute("aria-hidden", "true")

  const pulseElement = document.createElement("div")
  pulseElement.className = "cluster-pulse"
  pulseElement.setAttribute("aria-hidden", "true")

  circle.appendChild(countElement)
  circle.appendChild(pulseElement)
  container.appendChild(circle)

  return container
}

/**
 * Creates a safe individual marker for metadata records
 */
export function createSafeIndividualMarker(
  record: { id: string; title: string },
  options: MarkerElementOptions = {}
): HTMLElement {
  const { className = "", variant = "primary" } = options

  const container = document.createElement("div")
  container.className = `safe-individual-marker ${className} marker-${variant}`
  container.title = record.title
  container.setAttribute(
    "aria-label",
    `Metadata record: ${record.title}. Click for details.`
  )
  container.setAttribute("role", "button")
  container.setAttribute("tabindex", "0")
  container.setAttribute("data-record-id", record.id)

  // Create marker dot
  const dot = document.createElement("div")
  dot.className = "marker-dot"
  dot.setAttribute("aria-hidden", "true")

  // Create label (truncated safely)
  const label = document.createElement("div")
  label.className = "marker-label"
  label.textContent =
    record.title.length > 50
      ? record.title.substring(0, 47) + "..."
      : record.title

  container.appendChild(dot)
  container.appendChild(label)

  return container
}

/**
 * Creates a safe search result marker
 */
export function createSafeSearchMarker(
  index: number,
  placeName: string,
  coordinates: [number, number]
): HTMLElement {
  const container = document.createElement("div")
  container.className = "safe-search-marker search-result-marker"
  container.title = placeName
  container.setAttribute(
    "aria-label",
    `Search result ${index + 1}: ${placeName}. Located at ${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`
  )
  container.setAttribute("role", "button")
  container.setAttribute("tabindex", "0")
  container.setAttribute("data-result-index", String(index))

  // Create main circular head
  const head = document.createElement("div")
  head.className = "search-marker-head"
  head.textContent = String(index + 1)
  head.setAttribute("aria-hidden", "true")

  // Tail triangle (CSS triangle)
  const tail = document.createElement("div")
  tail.className = "search-marker-tail"
  tail.setAttribute("aria-hidden", "true")

  // Optional pulse ring
  const pulse = document.createElement("div")
  pulse.className = "search-marker-pulse"
  pulse.setAttribute("aria-hidden", "true")

  container.appendChild(pulse)
  container.appendChild(head)
  container.appendChild(tail)

  // Accessible text label (appears on hover/focus)
  const label = document.createElement("div")
  label.className = "search-marker-label"
  label.textContent = placeName
  container.appendChild(label)

  return container
}

/**
 * Sanitizes and validates input values for safe DOM insertion
 */
function sanitizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ""
  }

  // Convert to string and remove any potential HTML
  const stringValue = String(value)

  // Basic HTML entity encoding
  return (
    stringValue
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;")
      // Limit length to prevent DOM issues
      .substring(0, 1000)
  )
}

/**
 * Validates popup content data structure
 */
function validatePopupData(data: unknown): data is {
  title: string
  description?: string
  coordinates?: [number, number]
  metadata?: Record<string, unknown>
} {
  if (!data || typeof data !== "object") return false

  const typedData = data as Record<string, unknown>

  // Title is required and must be string
  if (!typedData.title || typeof typedData.title !== "string") return false

  // Optional fields validation
  if (typedData.description && typeof typedData.description !== "string")
    return false

  if (typedData.coordinates) {
    if (
      !Array.isArray(typedData.coordinates) ||
      typedData.coordinates.length !== 2 ||
      typeof typedData.coordinates[0] !== "number" ||
      typeof typedData.coordinates[1] !== "number"
    ) {
      return false
    }
  }

  if (typedData.metadata && typeof typedData.metadata !== "object") return false

  return true
}

/**
 * Safe popup content creation with input validation and sanitization
 */
export function createSafePopupContent(data: unknown): HTMLElement {
  // Validate input data
  if (!validatePopupData(data)) {
    const errorContainer = document.createElement("div")
    errorContainer.className = "popup-error"
    errorContainer.textContent = "Invalid popup data"
    return errorContainer
  }

  const container = document.createElement("div")
  container.className = "safe-popup-content"
  container.setAttribute("role", "dialog")
  container.setAttribute(
    "aria-label",
    `Details for ${sanitizeValue(data.title)}`
  )

  const title = document.createElement("h3")
  title.className = "popup-title"
  title.textContent = sanitizeValue(data.title)
  title.id = `popup-title-${Date.now()}`
  container.setAttribute("aria-labelledby", title.id)
  container.appendChild(title)

  if (data.description) {
    const description = document.createElement("p")
    description.className = "popup-description"
    description.textContent = sanitizeValue(data.description)
    container.appendChild(description)
  }

  if (data.coordinates) {
    const coordinates = document.createElement("div")
    coordinates.className = "popup-coordinates"
    const coordText = `${data.coordinates[1].toFixed(4)}, ${data.coordinates[0].toFixed(4)}`
    coordinates.textContent = coordText
    coordinates.setAttribute("aria-label", `Coordinates: ${coordText}`)
    container.appendChild(coordinates)
  }

  if (data.metadata && typeof data.metadata === "object") {
    const metadataList = document.createElement("dl")
    metadataList.className = "popup-metadata"

    Object.entries(data.metadata).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const dt = document.createElement("dt")
        dt.textContent = sanitizeValue(key)
        dt.className = "popup-metadata-key"

        const dd = document.createElement("dd")
        dd.textContent = sanitizeValue(value)
        dd.className = "popup-metadata-value"

        metadataList.appendChild(dt)
        metadataList.appendChild(dd)
      }
    })

    container.appendChild(metadataList)
  }

  return container
}

/**
 * Enhanced Map Event Manager with comprehensive cleanup tracking
 * Prevents memory leaks by properly managing all event listeners and DOM elements
 */
export class MapEventManager {
  private elementHandlers = new WeakMap<HTMLElement, (() => void)[]>()
  private markerHandlers = new WeakMap<any, () => void>()
  private mapHandlers = new Map<string, () => void>()
  private animationFrames = new Set<number>()
  private timeouts = new Set<NodeJS.Timeout>()
  private intervals = new Set<number>()

  /**
   * Add event listener to DOM element with cleanup tracking
   */
  addElementListener(
    element: HTMLElement,
    event: string,
    handler: (e: Event) => void,
    options?: AddEventListenerOptions
  ): void {
    const cleanupHandler = () => {
      element.removeEventListener(event, handler, options)
    }

    // Store cleanup function
    const existingHandlers = this.elementHandlers.get(element) || []
    existingHandlers.push(cleanupHandler)
    this.elementHandlers.set(element, existingHandlers)

    // Add the event listener
    element.addEventListener(event, handler, options)
  }

  /**
   * Add map event listener with cleanup tracking
   */
  addMapListener(map: any, event: string, handler: (e: any) => void): void {
    const handlerId = `${event}-${Date.now()}-${Math.random()}`

    const cleanupHandler = () => {
      if (map && typeof map.off === "function") {
        map.off(event, handler)
      }
    }

    this.mapHandlers.set(handlerId, cleanupHandler)

    // Add the event listener
    if (map && typeof map.on === "function") {
      map.on(event, handler)
    }
  }

  /**
   * Add marker handler with cleanup tracking
   */
  addMarkerHandler(marker: any, handler: () => void): void {
    this.markerHandlers.set(marker, handler)
  }

  /**
   * Track animation frame for cleanup
   */
  addAnimationFrame(frameId: number): void {
    this.animationFrames.add(frameId)
  }

  /**
   * Track timeout for cleanup
   */
  addTimeout(timeoutId: NodeJS.Timeout): void {
    this.timeouts.add(timeoutId)
  }

  /**
   * Track interval for cleanup
   */
  addInterval(intervalId: number): void {
    this.intervals.add(intervalId)
  }

  /**
   * Remove all event listeners from a specific element
   */
  removeElementHandlers(element: HTMLElement): void {
    const handlers = this.elementHandlers.get(element)
    if (handlers) {
      handlers.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          console.warn("Error cleaning up element handler:", error)
        }
      })
      this.elementHandlers.delete(element)
    }
  }

  /**
   * Remove all event listeners from a DOM element (alias for compatibility)
   */
  removeAllElementListeners(element: HTMLElement): void {
    this.removeElementHandlers(element)
  }

  /**
   * Remove marker handler
   */
  removeMarkerHandler(marker: any): void {
    const handler = this.markerHandlers.get(marker)
    if (handler) {
      try {
        handler()
      } catch (error) {
        console.warn("Error cleaning up marker handler:", error)
      }
      this.markerHandlers.delete(marker)
    }
  }

  /**
   * Remove map event listener
   */
  removeMapHandler(handlerId: string): void {
    const handler = this.mapHandlers.get(handlerId)
    if (handler) {
      try {
        handler()
      } catch (error) {
        console.warn("Error cleaning up map handler:", error)
      }
      this.mapHandlers.delete(handlerId)
    }
  }

  /**
   * Comprehensive cleanup of all tracked resources
   */
  cleanup(): void {
    // Clean up animation frames
    this.animationFrames.forEach(frameId => {
      try {
        cancelAnimationFrame(frameId)
      } catch (error) {
        console.warn("Error canceling animation frame:", error)
      }
    })
    this.animationFrames.clear()

    // Clean up timeouts
    this.timeouts.forEach(timeoutId => {
      try {
        clearTimeout(timeoutId)
      } catch (error) {
        console.warn("Error clearing timeout:", error)
      }
    })
    this.timeouts.clear()

    // Clean up intervals
    this.intervals.forEach(intervalId => {
      try {
        clearInterval(intervalId)
      } catch (error) {
        console.warn("Error clearing interval:", error)
      }
    })
    this.intervals.clear()

    // Clean up map handlers
    this.mapHandlers.forEach((cleanup, handlerId) => {
      try {
        cleanup()
      } catch (error) {
        console.warn(`Error cleaning up map handler ${handlerId}:`, error)
      }
    })
    this.mapHandlers.clear()

    // Clean up marker handlers (WeakMap will be garbage collected automatically)
    // Clean up element handlers (WeakMap will be garbage collected automatically)
  }

  /**
   * Get cleanup statistics for debugging
   */
  getCleanupStats() {
    return {
      animationFrames: this.animationFrames.size,
      timeouts: this.timeouts.size,
      intervals: this.intervals.size,
      mapHandlers: this.mapHandlers.size
    }
  }
}

/**
 * Creates an accessible skip link for keyboard navigation
 */
export function createSkipLink(
  targetId: string,
  text: string = "Skip to map"
): HTMLElement {
  const link = document.createElement("a")
  link.href = `#${targetId}`
  link.className = "skip-link"
  link.textContent = text
  link.setAttribute("aria-label", text)

  link.addEventListener("click", e => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: "smooth" })
    }
  })

  return link
}

/**
 * Announces changes to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite"
): void {
  const announcement = document.createElement("div")
  announcement.setAttribute("role", "status")
  announcement.setAttribute("aria-live", priority)
  announcement.setAttribute("aria-atomic", "true")
  announcement.className = "sr-only"
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}
