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

  const numberCircle = document.createElement("div")
  numberCircle.className = "search-marker-circle"
  numberCircle.textContent = String(index + 1)
  numberCircle.setAttribute("aria-hidden", "true")

  container.appendChild(numberCircle)
  return container
}

/**
 * Safe popup content creation
 */
export function createSafePopupContent(data: {
  title: string
  description?: string
  coordinates?: [number, number]
  metadata?: Record<string, any>
}): HTMLElement {
  const container = document.createElement("div")
  container.className = "safe-popup-content"
  container.setAttribute("role", "dialog")
  container.setAttribute("aria-label", `Details for ${data.title}`)

  const title = document.createElement("h3")
  title.className = "popup-title"
  title.textContent = data.title
  title.id = `popup-title-${Date.now()}`
  container.setAttribute("aria-labelledby", title.id)
  container.appendChild(title)

  if (data.description) {
    const description = document.createElement("p")
    description.className = "popup-description"
    description.textContent = data.description
    container.appendChild(description)
  }

  if (data.coordinates) {
    const coordinates = document.createElement("div")
    coordinates.className = "popup-coordinates"
    coordinates.textContent = `${data.coordinates[1].toFixed(4)}, ${data.coordinates[0].toFixed(4)}`
    coordinates.setAttribute(
      "aria-label",
      `Coordinates: ${coordinates.textContent}`
    )
    container.appendChild(coordinates)
  }

  if (data.metadata) {
    const metadataList = document.createElement("dl")
    metadataList.className = "popup-metadata"

    Object.entries(data.metadata).forEach(([key, value]) => {
      if (value) {
        const dt = document.createElement("dt")
        dt.textContent = key
        dt.className = "popup-metadata-key"

        const dd = document.createElement("dd")
        dd.textContent = String(value)
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
 * Event manager to prevent memory leaks
 */
export class MapEventManager {
  private elementHandlers = new WeakMap<HTMLElement, (() => void)[]>()
  private markerHandlers = new WeakMap<any, () => void>()

  /**
   * Safely adds event listener with automatic cleanup tracking
   */
  addElementListener(
    element: HTMLElement,
    event: string,
    handler: (e: Event) => void,
    options?: AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler, options)

    const handlers = this.elementHandlers.get(element) || []
    handlers.push(() => element.removeEventListener(event, handler, options))
    this.elementHandlers.set(element, handlers)
  }

  /**
   * Adds marker click handler with cleanup tracking
   */
  addMarkerHandler(marker: any, handler: () => void): void {
    const element = marker.getElement()
    if (element) {
      this.addElementListener(element, "click", handler)
      this.markerHandlers.set(marker, handler)
    }
  }

  /**
   * Removes all handlers for a specific element
   */
  removeElementHandlers(element: HTMLElement): void {
    const handlers = this.elementHandlers.get(element)
    if (handlers) {
      handlers.forEach(cleanup => cleanup())
      this.elementHandlers.delete(element)
    }
  }

  /**
   * Removes handler for a specific marker
   */
  removeMarkerHandler(marker: any): void {
    const handler = this.markerHandlers.get(marker)
    if (handler) {
      const element = marker.getElement()
      if (element) {
        this.removeElementHandlers(element)
      }
      this.markerHandlers.delete(marker)
    }
  }

  /**
   * Cleanup all managed event listeners
   */
  cleanup(): void {
    // WeakMap entries will be garbage collected automatically
    // when the referenced objects are no longer reachable
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
