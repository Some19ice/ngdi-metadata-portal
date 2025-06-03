/**
 * Simple in-memory cache with TTL (Time To Live) support
 * This is a basic implementation for server-side caching of frequently accessed data
 * For production with multiple instances, consider Redis or similar distributed cache
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class InMemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>()

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      return undefined
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  /**
   * Set a value in cache with TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlMs - Time to live in milliseconds (default: 5 minutes)
   */
  set(key: string, value: T, ttlMs: number = 5 * 60 * 1000): void {
    const expiresAt = Date.now() + ttlMs
    this.cache.set(key, { value, expiresAt })
  }

  /**
   * Delete a specific key from cache
   * @param key - Cache key to delete
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all expired entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }
}

// Global cache instances for different data types
export const organizationCache = new InMemoryCache<any>()
export const userOrganizationCache = new InMemoryCache<any>()
export const organizationStatsCache = new InMemoryCache<any>()
export const metadataCache = new InMemoryCache<any>()

// Cache key generators
export const CacheKeys = {
  organization: {
    byId: (id: string) => `org:${id}`,
    list: (params: string) => `org:list:${params}`,
    count: () => "org:count",
    adminList: (params: string) => `org:admin:${params}`,
    managed: (userId: string) => `org:managed:${userId}`,
    stats: (orgId: string) => `org:stats:${orgId}`,
    systemStats: () => "org:system-stats"
  },
  userOrganization: {
    userOrgs: (userId: string) => `user-org:${userId}`,
    orgUsers: (orgId: string) => `org-users:${orgId}`,
    nodeOfficerOrgs: (userId: string) => `node-officer:${userId}`
  },
  metadata: {
    byId: (id: string) => `metadata:${id}`,
    spatialBounds: () => "metadata:spatial-bounds",
    list: (params: string) => `metadata:list:${params}`,
    count: () => "metadata:count",
    byOrganization: (orgId: string, params: string) =>
      `metadata:org:${orgId}:${params}`,
    byUser: (userId: string, params: string) =>
      `metadata:user:${userId}:${params}`,
    published: (params: string) => `metadata:published:${params}`,
    search: (query: string, params: string) =>
      `metadata:search:${query}:${params}`
  }
} as const

// Cache invalidation helpers
export const CacheInvalidation = {
  organization: {
    /**
     * Invalidate all cache entries related to a specific organization
     */
    invalidateOrganization: (orgId: string) => {
      organizationCache.delete(CacheKeys.organization.byId(orgId))
      organizationStatsCache.delete(CacheKeys.organization.stats(orgId))
      organizationStatsCache.delete(CacheKeys.organization.systemStats())

      // Invalidate list caches (we need to clear all variations)
      const stats = organizationCache.getStats()
      stats.keys
        .filter(
          key =>
            key.startsWith("org:list:") ||
            key.startsWith("org:admin:") ||
            key === "org:count"
        )
        .forEach(key => organizationCache.delete(key))
    },

    /**
     * Invalidate user-organization relationship caches
     */
    invalidateUserOrganizations: (userId: string, orgId?: string) => {
      userOrganizationCache.delete(CacheKeys.userOrganization.userOrgs(userId))
      userOrganizationCache.delete(
        CacheKeys.userOrganization.nodeOfficerOrgs(userId)
      )

      if (orgId) {
        userOrganizationCache.delete(CacheKeys.userOrganization.orgUsers(orgId))
        // Also invalidate managed organizations cache for any user who might be a node officer
        const stats = userOrganizationCache.getStats()
        stats.keys
          .filter(key => key.startsWith("org:managed:"))
          .forEach(key => userOrganizationCache.delete(key))
      }
    },

    /**
     * Invalidate organization statistics caches
     */
    invalidateStats: (orgId?: string) => {
      if (orgId) {
        organizationStatsCache.delete(CacheKeys.organization.stats(orgId))
      }
      organizationStatsCache.delete(CacheKeys.organization.systemStats())
    },

    /**
     * Clear all organization-related caches
     */
    clearAll: () => {
      organizationCache.clear()
      userOrganizationCache.clear()
      organizationStatsCache.clear()
    }
  },

  metadata: {
    /**
     * Invalidate all cache entries related to a specific metadata record
     */
    invalidateMetadataRecord: (recordId: string) => {
      metadataCache.delete(CacheKeys.metadata.byId(recordId))
      metadataCache.delete(CacheKeys.metadata.spatialBounds())
      metadataCache.delete(CacheKeys.metadata.count())

      // Invalidate list caches (we need to clear all variations)
      const stats = metadataCache.getStats()
      stats.keys
        .filter(
          key =>
            key.startsWith("metadata:list:") ||
            key.startsWith("metadata:org:") ||
            key.startsWith("metadata:user:") ||
            key.startsWith("metadata:published:") ||
            key.startsWith("metadata:search:")
        )
        .forEach(key => metadataCache.delete(key))
    },

    /**
     * Invalidate caches for metadata records by organization
     */
    invalidateByOrganization: (orgId: string) => {
      metadataCache.delete(CacheKeys.metadata.spatialBounds())
      metadataCache.delete(CacheKeys.metadata.count())

      // Clear organization-specific caches
      const stats = metadataCache.getStats()
      stats.keys
        .filter(key => key.startsWith(`metadata:org:${orgId}:`))
        .forEach(key => metadataCache.delete(key))

      // Clear general list and published caches since they might include this org's records
      stats.keys
        .filter(
          key =>
            key.startsWith("metadata:list:") ||
            key.startsWith("metadata:published:")
        )
        .forEach(key => metadataCache.delete(key))
    },

    /**
     * Invalidate caches for metadata records by user
     */
    invalidateByUser: (userId: string) => {
      metadataCache.delete(CacheKeys.metadata.spatialBounds())
      metadataCache.delete(CacheKeys.metadata.count())

      // Clear user-specific caches
      const stats = metadataCache.getStats()
      stats.keys
        .filter(key => key.startsWith(`metadata:user:${userId}:`))
        .forEach(key => metadataCache.delete(key))

      // Clear general list and published caches since they might include this user's records
      stats.keys
        .filter(
          key =>
            key.startsWith("metadata:list:") ||
            key.startsWith("metadata:published:")
        )
        .forEach(key => metadataCache.delete(key))
    },

    /**
     * Clear all metadata-related caches
     */
    clearAll: () => {
      metadataCache.clear()
    }
  }
}

// Periodic cleanup (runs every 10 minutes)
if (typeof global !== "undefined") {
  setInterval(
    () => {
      organizationCache.cleanup()
      userOrganizationCache.cleanup()
      organizationStatsCache.cleanup()
      metadataCache.cleanup()
    },
    10 * 60 * 1000
  )
}

// Helper function to create cache-enabled functions
export function withCache<TArgs extends any[], TReturn>(
  cache: InMemoryCache<TReturn>,
  keyGenerator: (...args: TArgs) => string,
  ttlMs: number = 5 * 60 * 1000
) {
  return function cacheWrapper(
    originalFn: (...args: TArgs) => Promise<TReturn>
  ) {
    return async (...args: TArgs): Promise<TReturn> => {
      const cacheKey = keyGenerator(...args)

      // Try to get from cache first
      const cached = cache.get(cacheKey)
      if (cached !== undefined) {
        return cached
      }

      // Execute original function
      const result = await originalFn(...args)

      // Cache the result
      cache.set(cacheKey, result, ttlMs)

      return result
    }
  }
}

export { InMemoryCache }
