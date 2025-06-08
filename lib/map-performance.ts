/**
 * Performance optimization utilities for map operations
 * Provides debouncing, throttling, and efficient rendering helpers
 */

/**
 * Debounce function for search inputs and rapid interactions
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)

    if (callNow) func(...args)
  }
}

/**
 * Throttle function for continuous events like pan, zoom
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  let lastFunc: NodeJS.Timeout
  let lastRan: number

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      lastRan = Date.now()
      inThrottle = true
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(
        () => {
          if (Date.now() - lastRan >= limit) {
            func(...args)
            lastRan = Date.now()
          }
        },
        limit - (Date.now() - lastRan)
      )
    }
  }
}

/**
 * RequestAnimationFrame-based throttle for smooth animations
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let requestId: number | null = null

  return function executedFunction(...args: Parameters<T>) {
    if (requestId === null) {
      requestId = requestAnimationFrame(() => {
        func(...args)
        requestId = null
      })
    }
  }
}

/**
 * Batch DOM operations to minimize reflows
 */
export class DOMBatcher {
  private operations: (() => void)[] = []
  private isScheduled = false

  add(operation: () => void): void {
    this.operations.push(operation)
    this.schedule()
  }

  private schedule(): void {
    if (this.isScheduled) return

    this.isScheduled = true
    requestAnimationFrame(() => {
      this.flush()
    })
  }

  private flush(): void {
    const ops = this.operations.splice(0)
    ops.forEach(op => op())
    this.isScheduled = false
  }

  clear(): void {
    this.operations = []
    this.isScheduled = false
  }
}

/**
 * Efficient marker clustering for large datasets
 */
export interface ClusterPoint {
  id: string
  coordinates: [number, number]
  properties?: Record<string, any>
}

export interface Cluster {
  id: string
  coordinates: [number, number]
  count: number
  points: ClusterPoint[]
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

export class MarkerClusterer {
  private gridSize: number
  private maxZoom: number
  private clusters: Map<string, Cluster> = new Map()

  constructor(gridSize = 60, maxZoom = 15) {
    this.gridSize = gridSize
    this.maxZoom = maxZoom
  }

  cluster(points: ClusterPoint[], zoom: number): Cluster[] {
    this.clusters.clear()

    if (zoom >= this.maxZoom) {
      // Don't cluster at high zoom levels
      return points.map(point => ({
        id: point.id,
        coordinates: point.coordinates,
        count: 1,
        points: [point],
        bounds: {
          north: point.coordinates[1],
          south: point.coordinates[1],
          east: point.coordinates[0],
          west: point.coordinates[0]
        }
      }))
    }

    // Group points into grid cells
    const gridCells = new Map<string, ClusterPoint[]>()

    points.forEach(point => {
      const cellKey = this.getCellKey(point.coordinates, zoom)
      if (!gridCells.has(cellKey)) {
        gridCells.set(cellKey, [])
      }
      gridCells.get(cellKey)!.push(point)
    })

    // Create clusters from grid cells
    const clusters: Cluster[] = []
    let clusterId = 0

    gridCells.forEach((cellPoints, cellKey) => {
      if (cellPoints.length === 1) {
        // Single point, no cluster needed
        const point = cellPoints[0]
        clusters.push({
          id: point.id,
          coordinates: point.coordinates,
          count: 1,
          points: cellPoints,
          bounds: {
            north: point.coordinates[1],
            south: point.coordinates[1],
            east: point.coordinates[0],
            west: point.coordinates[0]
          }
        })
      } else {
        // Multiple points, create cluster
        const bounds = this.calculateBounds(cellPoints)
        const center = this.calculateCentroid(cellPoints)

        clusters.push({
          id: `cluster-${clusterId++}`,
          coordinates: center,
          count: cellPoints.length,
          points: cellPoints,
          bounds
        })
      }
    })

    return clusters
  }

  private getCellKey(coordinates: [number, number], zoom: number): string {
    const scale = this.gridSize / Math.pow(2, zoom)
    const x = Math.floor(coordinates[0] / scale)
    const y = Math.floor(coordinates[1] / scale)
    return `${x},${y}`
  }

  private calculateBounds(points: ClusterPoint[]): Cluster["bounds"] {
    let north = -Infinity
    let south = Infinity
    let east = -Infinity
    let west = Infinity

    points.forEach(point => {
      const [lng, lat] = point.coordinates
      north = Math.max(north, lat)
      south = Math.min(south, lat)
      east = Math.max(east, lng)
      west = Math.min(west, lng)
    })

    return { north, south, east, west }
  }

  private calculateCentroid(points: ClusterPoint[]): [number, number] {
    let totalLng = 0
    let totalLat = 0

    points.forEach(point => {
      totalLng += point.coordinates[0]
      totalLat += point.coordinates[1]
    })

    return [totalLng / points.length, totalLat / points.length]
  }
}

/**
 * Viewport culling for efficient rendering
 */
export class ViewportCuller {
  private bounds: {
    north: number
    south: number
    east: number
    west: number
  } | null = null

  updateBounds(bounds: {
    north: number
    south: number
    east: number
    west: number
  }): void {
    this.bounds = bounds
  }

  isVisible(coordinates: [number, number]): boolean {
    if (!this.bounds) return true

    const [lng, lat] = coordinates
    return (
      lat >= this.bounds.south &&
      lat <= this.bounds.north &&
      lng >= this.bounds.west &&
      lng <= this.bounds.east
    )
  }

  filterVisible<T extends { coordinates: [number, number] }>(items: T[]): T[] {
    if (!this.bounds) return items

    return items.filter(item => this.isVisible(item.coordinates))
  }

  expandBounds(factor = 1.2): void {
    if (!this.bounds) return

    const latDiff = ((this.bounds.north - this.bounds.south) * (factor - 1)) / 2
    const lngDiff = ((this.bounds.east - this.bounds.west) * (factor - 1)) / 2

    this.bounds = {
      north: this.bounds.north + latDiff,
      south: this.bounds.south - latDiff,
      east: this.bounds.east + lngDiff,
      west: this.bounds.west - lngDiff
    }
  }
}

/**
 * Memory-efficient data loading
 */
export class ChunkedDataLoader<T> {
  private chunkSize: number
  private loadDelay: number

  constructor(chunkSize = 100, loadDelay = 50) {
    this.chunkSize = chunkSize
    this.loadDelay = loadDelay
  }

  async loadInChunks<R>(
    data: T[],
    processor: (chunk: T[]) => Promise<R[]> | R[],
    onProgress?: (loaded: number, total: number) => void
  ): Promise<R[]> {
    const results: R[] = []
    const chunks = this.createChunks(data)

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const chunkResults = await processor(chunk)
      results.push(...chunkResults)

      // Report progress
      onProgress?.(i + 1, chunks.length)

      // Small delay to prevent blocking
      if (i < chunks.length - 1) {
        await this.delay(this.loadDelay)
      }
    }

    return results
  }

  private createChunks<T>(array: T[]): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += this.chunkSize) {
      chunks.push(array.slice(i, i + this.chunkSize))
    }
    return chunks
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()

  startTiming(name: string): () => void {
    const start = performance.now()

    return () => {
      const duration = performance.now() - start
      this.recordMetric(name, duration)
    }
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const values = this.metrics.get(name)!
    values.push(value)

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  getAverageTime(name: string): number | null {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return null

    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  getStats(name: string): {
    average: number
    min: number
    max: number
    count: number
  } | null {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return null

    return {
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    }
  }

  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name)
    } else {
      this.metrics.clear()
    }
  }
}

// Export a global performance monitor instance
export const mapPerformanceMonitor = new PerformanceMonitor()
