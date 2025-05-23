"use client"

/**
 * Map Service Worker Registration and Management
 * Handles caching of map tiles and styles for better performance
 */

interface ServiceWorkerConfig {
  enableTileCache?: boolean
  enableStyleCache?: boolean
  maxTileCache?: number
  cleanupInterval?: number
}

class MapServiceWorkerManager {
  private isRegistered = false
  private registration: ServiceWorkerRegistration | null = null
  private config: ServiceWorkerConfig

  constructor(config: ServiceWorkerConfig = {}) {
    this.config = {
      enableTileCache: true,
      enableStyleCache: true,
      maxTileCache: 1000,
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      ...config
    }
  }

  /**
   * Register the service worker
   */
  async register(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported")
      return false
    }

    if (this.isRegistered) {
      return true
    }

    try {
      this.registration = await navigator.serviceWorker.register(
        "/sw-map-cache.js",
        {
          scope: "/"
        }
      )

      console.log("Map Service Worker registered successfully")
      this.isRegistered = true

      // Set up periodic cache cleanup
      this.setupCleanupInterval()

      // Listen for updates
      this.registration.addEventListener("updatefound", () => {
        console.log("Map Service Worker update found")
      })

      return true
    } catch (error) {
      console.error("Map Service Worker registration failed:", error)
      return false
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return true
    }

    try {
      await this.registration.unregister()
      this.isRegistered = false
      this.registration = null
      console.log("Map Service Worker unregistered")
      return true
    } catch (error) {
      console.error("Map Service Worker unregistration failed:", error)
      return false
    }
  }

  /**
   * Check if service worker is active
   */
  isActive(): boolean {
    return this.isRegistered && this.registration?.active !== null
  }

  /**
   * Manually trigger cache cleanup
   */
  async cleanupCache(): Promise<void> {
    if (!this.isActive()) {
      return
    }

    try {
      // Send message to service worker to clean up cache
      if (this.registration?.active) {
        this.registration.active.postMessage({
          type: "CLEAN_CACHE"
        })
      }
    } catch (error) {
      console.error("Cache cleanup failed:", error)
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    tileCount: number
    styleCount: number
    totalSize: number
  }> {
    if (!("caches" in window)) {
      return { tileCount: 0, styleCount: 0, totalSize: 0 }
    }

    try {
      const [tileCache, styleCache] = await Promise.all([
        caches.open("ngdi-map-tiles-v1"),
        caches.open("ngdi-map-styles-v1")
      ])

      const [tileKeys, styleKeys] = await Promise.all([
        tileCache.keys(),
        styleCache.keys()
      ])

      // Estimate total size (rough calculation)
      let totalSize = 0
      const sampleRequests = [...tileKeys.slice(0, 10), ...styleKeys]

      for (const request of sampleRequests) {
        try {
          const response =
            (await tileCache.match(request)) ||
            (await styleCache.match(request))
          if (response) {
            const blob = await response.blob()
            totalSize += blob.size
          }
        } catch (error) {
          // Skip failed requests
        }
      }

      // Extrapolate total size
      const avgSize = totalSize / sampleRequests.length || 0
      const estimatedTotal = avgSize * (tileKeys.length + styleKeys.length)

      return {
        tileCount: tileKeys.length,
        styleCount: styleKeys.length,
        totalSize: Math.round(estimatedTotal)
      }
    } catch (error) {
      console.error("Failed to get cache stats:", error)
      return { tileCount: 0, styleCount: 0, totalSize: 0 }
    }
  }

  /**
   * Clear all map caches
   */
  async clearAllCaches(): Promise<void> {
    if (!("caches" in window)) {
      return
    }

    try {
      const cacheNames = await caches.keys()
      const mapCacheNames = cacheNames.filter(
        name => name.includes("ngdi-map") || name.includes("map-cache")
      )

      await Promise.all(mapCacheNames.map(name => caches.delete(name)))

      console.log("All map caches cleared")
    } catch (error) {
      console.error("Failed to clear caches:", error)
    }
  }

  /**
   * Preload map tiles for a specific area
   */
  async preloadArea(
    bounds: {
      north: number
      south: number
      east: number
      west: number
    },
    zoomLevels: number[] = [10, 11, 12]
  ): Promise<void> {
    if (!this.isActive()) {
      console.warn("Service worker not active, cannot preload tiles")
      return
    }

    try {
      // Calculate tile URLs for the area
      const tileUrls: string[] = []

      for (const zoom of zoomLevels) {
        const tiles = this.calculateTilesForBounds(bounds, zoom)
        tiles.forEach(tile => {
          tileUrls.push(
            `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`
          )
        })
      }

      // Preload tiles (limit to avoid overwhelming the server)
      const maxPreload = 50
      const tilesToPreload = tileUrls.slice(0, maxPreload)

      await Promise.allSettled(tilesToPreload.map(url => fetch(url)))

      console.log(`Preloaded ${tilesToPreload.length} tiles for area`)
    } catch (error) {
      console.error("Tile preloading failed:", error)
    }
  }

  /**
   * Set up periodic cache cleanup
   */
  private setupCleanupInterval(): void {
    if (this.config.cleanupInterval && this.config.cleanupInterval > 0) {
      setInterval(() => {
        this.cleanupCache()
      }, this.config.cleanupInterval)
    }
  }

  /**
   * Calculate tile coordinates for given bounds and zoom level
   */
  private calculateTilesForBounds(
    bounds: {
      north: number
      south: number
      east: number
      west: number
    },
    zoom: number
  ): Array<{ x: number; y: number; z: number }> {
    const tiles: Array<{ x: number; y: number; z: number }> = []

    // Convert lat/lng to tile coordinates
    const minTileX = Math.floor(this.lngToTileX(bounds.west, zoom))
    const maxTileX = Math.floor(this.lngToTileX(bounds.east, zoom))
    const minTileY = Math.floor(this.latToTileY(bounds.north, zoom))
    const maxTileY = Math.floor(this.latToTileY(bounds.south, zoom))

    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        tiles.push({ x, y, z: zoom })
      }
    }

    return tiles
  }

  private lngToTileX(lng: number, zoom: number): number {
    return ((lng + 180) / 360) * Math.pow(2, zoom)
  }

  private latToTileY(lat: number, zoom: number): number {
    const latRad = (lat * Math.PI) / 180
    return (
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, zoom)
    )
  }
}

// Global instance
let mapServiceWorkerManager: MapServiceWorkerManager | null = null

/**
 * Get or create the map service worker manager
 */
export function getMapServiceWorker(
  config?: ServiceWorkerConfig
): MapServiceWorkerManager {
  if (!mapServiceWorkerManager) {
    mapServiceWorkerManager = new MapServiceWorkerManager(config)
  }
  return mapServiceWorkerManager
}

/**
 * Initialize map caching (call this in your app initialization)
 */
export async function initializeMapCaching(
  config?: ServiceWorkerConfig
): Promise<boolean> {
  const manager = getMapServiceWorker(config)
  return await manager.register()
}

/**
 * Hook for React components to use map service worker
 */
export function useMapServiceWorker() {
  const manager = getMapServiceWorker()

  return {
    isActive: manager.isActive(),
    cleanupCache: () => manager.cleanupCache(),
    getCacheStats: () => manager.getCacheStats(),
    clearAllCaches: () => manager.clearAllCaches(),
    preloadArea: (bounds: any, zoomLevels?: number[]) =>
      manager.preloadArea(bounds, zoomLevels)
  }
}
