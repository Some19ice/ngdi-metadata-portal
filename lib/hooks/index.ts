/**
 * Export all hooks from the lib/hooks directory
 *
 * Note: Do not export use-map-layers and use-gis-services here
 * to avoid circular dependencies. Import them directly from their
 * respective files.
 */

// Re-export hooks from the hooks directory
// This allows components to import from @/hooks
export * from "../../hooks/use-map-instance"
export * from "../../hooks/use-map-styles"
export * from "../../hooks/use-map-controls"
export * from "../../hooks/use-map-markers"
export * from "../../hooks/use-map-viewport"
export * from "../../hooks/use-map-events"
export * from "../../hooks/use-mobile"

// Data hooks from lib/hooks
export * from "./use-nigeria-states"
export * from "./use-debounced-search"
